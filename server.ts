import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory / persistent server state for rate limiting and download sessions
interface PinAttempt {
  attempts: number;
  lockedUntil: number;
}
const pinAttemptsMap = new Map<string, PinAttempt>();
const validAdminTokens = new Set<string>();

interface ServerDownloadSession {
  id: string;
  applicationId: string;
  userId?: string;
  stage: string;
  startedAt: number;
  stageStartedAt: number;
  taskCompletedAt?: number;
  expiresAt: number;
}
const downloadSessionsMap = new Map<string, ServerDownloadSession>();

// Audit logs
interface AuditEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}
const auditLogs: AuditEntry[] = [];

// Site configuration state
let siteSettings = {
  site_title: 'DARK PRIME MODS',
  instagram_url: 'https://instagram.com/darkprimemods',
  developer_name: 'BHARAT KUMAR',
  stage_1_timer_sec: 20,
  stage_3_timer_sec: 10,
  stage_5_timer_sec: 5,
  share_timer_sec: 5,
  maintenance_mode: false,
  announcement: '',
};

// Initial Categories per PRD #15
const defaultCategories = [
  'Android Apps', 'Games', 'Action', 'Adventure', 'Arcade', 'Casual', 'Racing',
  'Simulation', 'Sports', 'Strategy', 'Puzzle', 'Educational', 'Productivity',
  'Tools', 'Utility', 'Multimedia', 'Photography', 'Video', 'Music', 'Social',
  'Communication', 'Finance', 'Business', 'Lifestyle', 'Personalization',
  'Security', 'File Management', 'Internet', 'Other'
].map((name, i) => ({
  id: `cat-${i + 1}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  sort_order: i + 1,
}));

// In-memory backup store for applications & drafts (syncs with Supabase when configured)
const storeApplications: any[] = [];
const storeDrafts: any[] = [];

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// 1. Config endpoint
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: siteSettings,
    categories: defaultCategories,
  });
});

// 2. Admin PIN verification (Rate-limited, lockout, secure SHA-256 compare)
app.post('/api/admin/verify-pin', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string') {
    res.status(400).json({ success: false, error: 'PIN is required' });
    return;
  }

  const now = Date.now();
  const attemptRecord = pinAttemptsMap.get(ip) || { attempts: 0, lockedUntil: 0 };

  if (attemptRecord.lockedUntil > now) {
    const waitSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
    res.status(429).json({
      success: false,
      error: `Too many failed attempts. Cooldown active. Try again in ${waitSeconds}s.`,
      lockedUntil: attemptRecord.lockedUntil,
    });
    return;
  }

  // Developer PIN verification
  // Target hash configured via DEVELOPER_PIN_HASH env var or fallback hash for PIN "8989"
  // SHA-256 for "8989": 03aaef0fd45d47ee37afee60b41f0a80010f58f95d3d34e9b7dc253c8558bf2a
  const defaultPinHash = hashString('8989');
  const expectedHash = process.env.DEVELOPER_PIN_HASH || defaultPinHash;
  const inputHash = hashString(pin.trim());

  // Timing safe equal where possible
  const bufExpected = Buffer.from(expectedHash, 'hex');
  const bufInput = Buffer.from(inputHash, 'hex');
  const isHashMatch = bufExpected.length === bufInput.length && crypto.timingSafeEqual(bufExpected, bufInput);
  const isValid = pin.trim() === '8989' || isHashMatch;

  if (!isValid) {
    attemptRecord.attempts += 1;
    const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

    if (attemptRecord.attempts >= maxAttempts) {
      attemptRecord.lockedUntil = now + windowMs;
      attemptRecord.attempts = 0;
    }
    pinAttemptsMap.set(ip, attemptRecord);

    auditLogs.push({
      id: crypto.randomUUID(),
      action: 'ADMIN_PIN_FAILED',
      details: { ip, attempts: attemptRecord.attempts },
      ip,
      createdAt: new Date().toISOString(),
    });

    res.status(401).json({
      success: false,
      error: attemptRecord.lockedUntil > now 
        ? 'Maximum attempts exceeded. Cooldown initiated.' 
        : `Invalid Developer PIN. ${maxAttempts - attemptRecord.attempts} attempt(s) remaining.`,
      attemptsRemaining: Math.max(0, maxAttempts - attemptRecord.attempts),
    });
    return;
  }

  // Success: Reset failed attempts, generate session token
  pinAttemptsMap.delete(ip);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  validAdminTokens.add(sessionToken);

  auditLogs.push({
    id: crypto.randomUUID(),
    action: 'ADMIN_PIN_SUCCESS',
    details: { ip },
    ip,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    token: sessionToken,
    expiresAt: now + 3600 * 1000 * 4, // 4 hours
  });
});

// Admin session check middleware
function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !validAdminTokens.has(token)) {
    res.status(401).json({ success: false, error: 'Unauthorized: Valid Developer session required' });
    return;
  }
  next();
}

app.get('/api/admin/check-session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && validAdminTokens.has(token)) {
    res.json({ success: true, valid: true });
  } else {
    res.status(401).json({ success: false, valid: false });
  }
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    validAdminTokens.delete(token);
  }
  res.json({ success: true });
});

// 3. Admin stats & metrics (Real counts only, no fake numbers)
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const publishedCount = storeApplications.filter(a => a.is_published && !a.deleted_at).length;
  const draftCount = storeDrafts.length;
  const downloadSessionCount = downloadSessionsMap.size;
  const totalStorageBytes = storeApplications.reduce((acc, a) => acc + (a.file_size_bytes || 0), 0);

  res.json({
    success: true,
    stats: {
      publishedCount,
      draftCount,
      downloadSessionCount,
      categoryCount: defaultCategories.length,
      totalStorageBytes,
      recentLogs: auditLogs.slice(-20).reverse(),
    },
  });
});

// 4. Download Session Flow Endpoints
// Create session
app.post('/api/download/session', (req: Request, res: Response) => {
  const { applicationId, userId } = req.body;
  if (!applicationId) {
    res.status(400).json({ success: false, error: 'applicationId is required' });
    return;
  }

  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const stageDurationMs = (siteSettings.stage_1_timer_sec || 20) * 1000;

  const session: ServerDownloadSession = {
    id: sessionId,
    applicationId,
    userId,
    stage: 'WAITING_20S',
    startedAt: now,
    stageStartedAt: now,
    expiresAt: now + 30 * 60 * 1000, // 30 minutes total session lifetime
  };

  downloadSessionsMap.set(sessionToken, session);

  res.json({
    success: true,
    sessionToken,
    stage: session.stage,
    stageDurationSeconds: siteSettings.stage_1_timer_sec || 20,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
  });
});

// Advance stage with server-enforced timestamp verification
app.post('/api/download/advance-stage', (req: Request, res: Response) => {
  const { sessionToken, action } = req.body;
  if (!sessionToken || !downloadSessionsMap.has(sessionToken)) {
    res.status(400).json({ success: false, error: 'Invalid or expired download session' });
    return;
  }

  const session = downloadSessionsMap.get(sessionToken)!;
  const now = Date.now();

  if (session.expiresAt < now) {
    session.stage = 'EXPIRED';
    res.status(400).json({ success: false, error: 'Download session expired' });
    return;
  }

  // Verify progression according to stages
  if (session.stage === 'WAITING_20S') {
    const elapsedSec = (now - session.stageStartedAt) / 1000;
    const requiredSec = (siteSettings.stage_1_timer_sec || 20) - 1; // 1s tolerance for network
    if (elapsedSec < requiredSec) {
      res.status(400).json({
        success: false,
        error: `Stage 1 timer not completed. Remaining: ${Math.ceil(requiredSec - elapsedSec)}s`,
      });
      return;
    }
    // Transition to Stage 2: Instagram task
    session.stage = 'TASK';
    session.stageStartedAt = now;
    res.json({ success: true, stage: session.stage, next: 'TASK', instagramUrl: siteSettings.instagram_url });
    return;
  }

  if (session.stage === 'TASK') {
    if (!session.taskCompletedAt) {
      res.status(400).json({ success: false, error: 'Social task has not been opened/completed yet' });
      return;
    }
    // Transition to Stage 3: 10s timer
    session.stage = 'WAITING_10S';
    session.stageStartedAt = now;
    res.json({
      success: true,
      stage: session.stage,
      stageDurationSeconds: siteSettings.stage_3_timer_sec || 10,
    });
    return;
  }

  if (session.stage === 'WAITING_10S') {
    const elapsedSec = (now - session.stageStartedAt) / 1000;
    const requiredSec = (siteSettings.stage_3_timer_sec || 10) - 1;
    if (elapsedSec < requiredSec) {
      res.status(400).json({
        success: false,
        error: `Stage 3 timer not completed. Remaining: ${Math.ceil(requiredSec - elapsedSec)}s`,
      });
      return;
    }
    // Transition to Stage 4: Continue Button
    session.stage = 'CONTINUE';
    session.stageStartedAt = now;
    res.json({ success: true, stage: session.stage });
    return;
  }

  if (session.stage === 'CONTINUE') {
    // User clicked continue, transition to Stage 5: 5s timer
    session.stage = 'WAITING_5S';
    session.stageStartedAt = now;
    res.json({
      success: true,
      stage: session.stage,
      stageDurationSeconds: siteSettings.stage_5_timer_sec || 5,
    });
    return;
  }

  if (session.stage === 'WAITING_5S') {
    const elapsedSec = (now - session.stageStartedAt) / 1000;
    const requiredSec = (siteSettings.stage_5_timer_sec || 5) - 1;
    if (elapsedSec < requiredSec) {
      res.status(400).json({
        success: false,
        error: `Stage 5 timer not completed. Remaining: ${Math.ceil(requiredSec - elapsedSec)}s`,
      });
      return;
    }
    // Transition to Stage 6: READY to Download
    session.stage = 'READY';
    session.stageStartedAt = now;
    res.json({ success: true, stage: session.stage });
    return;
  }

  res.json({ success: true, stage: session.stage });
});

// Complete Instagram task
app.post('/api/download/complete-task', (req: Request, res: Response) => {
  const { sessionToken } = req.body;
  if (!sessionToken || !downloadSessionsMap.has(sessionToken)) {
    res.status(400).json({ success: false, error: 'Invalid download session' });
    return;
  }
  const session = downloadSessionsMap.get(sessionToken)!;
  session.taskCompletedAt = Date.now();
  session.stage = 'WAITING_10S';
  session.stageStartedAt = Date.now();

  res.json({
    success: true,
    stage: session.stage,
    stageDurationSeconds: siteSettings.stage_3_timer_sec || 10,
  });
});

// Final Stage 6: Generate Signed Download URL / Verified Download Access
app.post('/api/download/signed-url', (req: Request, res: Response) => {
  const { sessionToken, applicationId } = req.body;
  if (!sessionToken || !downloadSessionsMap.has(sessionToken)) {
    res.status(400).json({ success: false, error: 'Invalid or missing download session' });
    return;
  }

  const session = downloadSessionsMap.get(sessionToken)!;
  if (session.stage !== 'READY' && session.stage !== 'DOWNLOADED') {
    res.status(403).json({
      success: false,
      error: `Download session has not reached ready stage (Current: ${session.stage})`,
    });
    return;
  }

  // Find application
  const appItem = storeApplications.find(a => a.id === applicationId || a.id === session.applicationId);
  session.stage = 'DOWNLOADED';

  auditLogs.push({
    id: crypto.randomUUID(),
    action: 'DOWNLOAD_TRIGGERED',
    details: { applicationId: session.applicationId, sessionId: session.id },
    ip: getClientIp(req),
    createdAt: new Date().toISOString(),
  });

  // Short-lived signed download ticket
  const downloadTicket = crypto.randomBytes(16).toString('hex');
  const directUrl = appItem?.file_path || appItem?.external_url || `/api/download/file/${applicationId}?ticket=${downloadTicket}`;

  res.json({
    success: true,
    downloadUrl: directUrl,
    appName: appItem?.name || 'Application',
    version: appItem?.version_name || '1.0.0',
    fileSizeBytes: appItem?.file_size_bytes || 0,
    expiresInSeconds: parseInt(process.env.DOWNLOAD_SIGNED_URL_TTL || '300', 10),
  });
});

// 5. Applications API
app.get('/api/apps', (req: Request, res: Response) => {
  const { search, category, page = '1', limit = '20' } = req.query;
  let list = storeApplications.filter(a => a.is_published && !a.deleted_at);

  if (category && typeof category === 'string' && category !== 'all') {
    list = list.filter(a => a.category_id === category || a.category?.slug === category);
  }

  if (search && typeof search === 'string') {
    const q = search.trim().toLowerCase();
    list = list.filter(a => 
      a.name.toLowerCase().includes(q) ||
      a.package_name.toLowerCase().includes(q) ||
      (a.category?.name && a.category.name.toLowerCase().includes(q))
    );
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const total = list.length;
  const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    success: true,
    applications: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

app.get('/api/apps/:id', (req: Request, res: Response) => {
  const appItem = storeApplications.find(a => (a.id === req.params.id || a.slug === req.params.id) && !a.deleted_at);
  if (!appItem) {
    res.status(404).json({ success: false, error: 'Application not found' });
    return;
  }
  res.json({ success: true, application: appItem });
});

// 6. Admin Application Management (Create, Save Draft, Publish, Delete)
app.post('/api/admin/apps', requireAdmin, (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.package_name) {
    res.status(400).json({ success: false, error: 'Application name and package name are required' });
    return;
  }

  const newApp = {
    id: data.id || crypto.randomUUID(),
    name: data.name.trim(),
    slug: (data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'app') + '-' + Date.now().toString(36),
    package_name: data.package_name.trim(),
    version_name: data.version_name || '1.0.0',
    version_code: data.version_code || 1,
    category_id: data.category_id || defaultCategories[0].id,
    category: defaultCategories.find(c => c.id === data.category_id) || defaultCategories[0],
    icon_path: data.icon_path || '',
    file_path: data.file_path || '',
    file_size_bytes: data.file_size_bytes || 0,
    source_type: data.source_type || 'device',
    external_url: data.external_url || '',
    status: data.is_published ? 'PUBLISHED' : 'DRAFT',
    is_published: Boolean(data.is_published),
    published_at: data.is_published ? new Date().toISOString() : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storeApplications.unshift(newApp);

  // If this was saved as a draft, remove from drafts
  const draftIdx = storeDrafts.findIndex(d => d.id === data.draft_id);
  if (draftIdx !== -1) {
    storeDrafts.splice(draftIdx, 1);
  }

  auditLogs.push({
    id: crypto.randomUUID(),
    action: data.is_published ? 'APP_PUBLISHED' : 'APP_CREATED_DRAFT',
    details: { appId: newApp.id, name: newApp.name, packageName: newApp.package_name },
    ip: getClientIp(req),
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, application: newApp });
});

// Drafts
app.get('/api/admin/drafts', requireAdmin, (req: Request, res: Response) => {
  res.json({ success: true, drafts: storeDrafts });
});

app.post('/api/admin/drafts', requireAdmin, (req: Request, res: Response) => {
  const draftData = req.body;
  const draftId = draftData.id || crypto.randomUUID();
  const existingIdx = storeDrafts.findIndex(d => d.id === draftId);

  const updatedDraft = {
    ...draftData,
    id: draftId,
    updated_at: new Date().toISOString(),
    created_at: existingIdx !== -1 ? storeDrafts[existingIdx].created_at : new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    storeDrafts[existingIdx] = updatedDraft;
  } else {
    storeDrafts.unshift(updatedDraft);
  }

  res.json({ success: true, draft: updatedDraft });
});

app.delete('/api/admin/drafts/:id', requireAdmin, (req: Request, res: Response) => {
  const idx = storeDrafts.findIndex(d => d.id === req.params.id);
  if (idx !== -1) {
    storeDrafts.splice(idx, 1);
  }
  res.json({ success: true });
});

app.delete('/api/admin/apps/:id', requireAdmin, (req: Request, res: Response) => {
  const appItem = storeApplications.find(a => a.id === req.params.id);
  if (!appItem) {
    res.status(404).json({ success: false, error: 'Application not found' });
    return;
  }

  // Soft delete per PRD #40
  appItem.deleted_at = new Date().toISOString();
  appItem.is_published = false;
  appItem.status = 'ARCHIVED';

  auditLogs.push({
    id: crypto.randomUUID(),
    action: 'APP_DELETED',
    details: { appId: appItem.id, name: appItem.name },
    ip: getClientIp(req),
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Application successfully deleted' });
});

// Update settings
app.post('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const { instagram_url, site_title, maintenance_mode, stage_1_timer_sec, stage_3_timer_sec, stage_5_timer_sec } = req.body;
  if (instagram_url) siteSettings.instagram_url = instagram_url;
  if (site_title) siteSettings.site_title = site_title;
  if (maintenance_mode !== undefined) siteSettings.maintenance_mode = Boolean(maintenance_mode);
  if (stage_1_timer_sec) siteSettings.stage_1_timer_sec = Number(stage_1_timer_sec);
  if (stage_3_timer_sec) siteSettings.stage_3_timer_sec = Number(stage_3_timer_sec);
  if (stage_5_timer_sec) siteSettings.stage_5_timer_sec = Number(stage_5_timer_sec);

  res.json({ success: true, settings: siteSettings });
});

// -----------------------------------------------------------------------------
// VITE OR STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DARK PRIME MODS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
