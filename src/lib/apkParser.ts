import JSZip from 'jszip';
import type { ApkMetadata } from '../types';

/**
 * Parses Android Binary XML strings pool from AndroidManifest.xml
 */
function extractStringsFromAxml(buffer: ArrayBuffer): string[] {
  const view = new DataView(buffer);
  const strings: string[] = [];

  try {
    // Check magic number: 0x00080003 (RES_XML_TYPE)
    if (buffer.byteLength < 8) return strings;
    const magic = view.getUint32(0, true);
    if (magic !== 0x00080003) {
      // Not a binary XML or raw XML
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(buffer);
      const pkgMatch = text.match(/package=["']([^"']+)["']/);
      if (pkgMatch) strings.push(pkgMatch[1]);
      const verMatch = text.match(/android:versionName=["']([^"']+)["']/);
      if (verMatch) strings.push(verMatch[1]);
      return strings;
    }

    // String pool chunk starts at offset 8
    const stringPoolType = view.getUint32(8, true);
    if (stringPoolType !== 0x001c0001) return strings;

    const stringCount = view.getUint32(16, true);
    const flags = view.getUint32(24, true);
    const stringsStart = 8 + view.getUint32(28, true);
    const isUtf8 = (flags & (1 << 8)) !== 0;

    // String offsets table starts at offset 36 (8 + 28)
    const offsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
      offsets.push(view.getUint32(36 + i * 4, true));
    }

    const uint8 = new Uint8Array(buffer);
    for (let i = 0; i < offsets.length; i++) {
      const start = stringsStart + offsets[i];
      if (start >= buffer.byteLength) continue;

      let str = '';
      if (isUtf8) {
        // UTF-8 string: length is at start
        let lenOffset = start;
        // skip 1 or 2 bytes of char count & byte count
        lenOffset += (uint8[lenOffset] & 0x80) ? 2 : 1;
        const byteLen = (uint8[lenOffset] & 0x80) ? ((uint8[lenOffset] & 0x7f) << 8) | uint8[lenOffset + 1] : uint8[lenOffset];
        lenOffset += (uint8[lenOffset] & 0x80) ? 2 : 1;

        const strBytes = uint8.slice(lenOffset, lenOffset + byteLen);
        str = new TextDecoder('utf-8').decode(strBytes);
      } else {
        // UTF-16 string: length is 2 bytes (or 4)
        let charLen = view.getUint16(start, true);
        let strStart = start + 2;
        if (charLen & 0x8000) {
          charLen = ((charLen & 0x7fff) << 16) | view.getUint16(strStart, true);
          strStart += 2;
        }
        const strBytes = uint8.slice(strStart, strStart + charLen * 2);
        str = new TextDecoder('utf-16le').decode(strBytes);
      }

      if (str && str.trim()) {
        strings.push(str.trim());
      }
    }
  } catch (err) {
    console.warn('Error reading AXML chunk, falling back to pattern scan', err);
  }

  // If table parsing yielded few strings, perform direct printable ASCII scanner
  if (strings.length < 3) {
    const uint8 = new Uint8Array(buffer);
    let current = '';
    for (let i = 0; i < uint8.length; i++) {
      const byte = uint8[i];
      if (byte >= 32 && byte <= 126) {
        current += String.fromCharCode(byte);
      } else {
        if (current.length >= 3) {
          strings.push(current);
        }
        current = '';
      }
    }
  }

  return strings;
}

/**
 * Computes SHA-256 hash of an ArrayBuffer using Web Crypto API
 */
export async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats bytes to readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Reads and inspects an APK file
 */
export async function inspectApk(file: File): Promise<ApkMetadata> {
  const buffer = await file.arrayBuffer();
  const checksum = await computeSha256(buffer);
  const zip = await JSZip.loadAsync(buffer);

  let packageName = '';
  let versionName = '';
  let versionCode = 1;
  let label = '';
  let isExtractedAutomatically = false;
  let iconBlob: Blob | undefined;
  let iconDataUrl: string | undefined;

  // 1. Inspect AndroidManifest.xml
  const manifestEntry = zip.file('AndroidManifest.xml');
  if (manifestEntry) {
    const manifestBuffer = await manifestEntry.async('arraybuffer');
    const strings = extractStringsFromAxml(manifestBuffer);

    // Package pattern: e.g. com.company.app
    const pkgRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i;
    const versionRegex = /^v?[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9.]+)?$/;

    for (const str of strings) {
      if (!packageName && pkgRegex.test(str) && !str.startsWith('android.') && !str.startsWith('androidx.') && !str.startsWith('com.android.')) {
        packageName = str;
      }
      if (!versionName && versionRegex.test(str) && str.includes('.')) {
        versionName = str;
      }
    }

    if (packageName) {
      isExtractedAutomatically = true;
    }
  }

  // 2. Look for best launcher icon in res/
  const iconCandidates = Object.keys(zip.files).filter(path => 
    /\.(png|webp)$/i.test(path) && (path.includes('ic_launcher') || path.includes('app_icon') || path.includes('icon'))
  );

  if (iconCandidates.length > 0) {
    // Pick the highest density candidate (xxxhdpi, xxhdpi, xhdpi, hdpi, mdpi)
    const priority = ['xxxhdpi', 'xxhdpi', 'xhdpi', 'hdpi', 'mdpi'];
    let chosenPath = iconCandidates[0];
    for (const p of priority) {
      const match = iconCandidates.find(c => c.toLowerCase().includes(p));
      if (match) {
        chosenPath = match;
        break;
      }
    }

    const iconEntry = zip.file(chosenPath);
    if (iconEntry) {
      const iconBuffer = await iconEntry.async('arraybuffer');
      const mime = chosenPath.endsWith('.webp') ? 'image/webp' : 'image/png';
      iconBlob = new Blob([iconBuffer], { type: mime });
      iconDataUrl = URL.createObjectURL(iconBlob);
    }
  }

  return {
    packageName: packageName || '',
    versionName: versionName || '1.0.0',
    versionCode: versionCode || 1,
    label,
    fileSizeBytes: file.size,
    checksumSha256: checksum,
    iconBlob,
    iconDataUrl,
    isExtractedAutomatically,
  };
}
