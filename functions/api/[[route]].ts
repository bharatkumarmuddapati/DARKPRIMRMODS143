/**
 * Cloudflare Pages Functions Entry Point: /api/*
 * Compatible with Cloudflare Workers runtime
 * Handles Developer PIN verification, Download Sessions, Metadata, and Settings
 */

interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DEVELOPER_PIN_HASH?: string;
  DOWNLOAD_SIGNED_URL_TTL?: string;
  MAX_APK_SIZE?: string;
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_ATTEMPTS?: string;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data?: Record<string, unknown>;
}) => Promise<Response> | Response;

// In-memory runtime cache for worker instances
const pinRateLimit = new Map<string, { attempts: number; lockedUntil: number }>();
const validSessions = new Set<string>();
const downloadSessions = new Map<string, any>();

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';

  // Common CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. /api/config
  if (path === '/api/config' && method === 'GET') {
    return new Response(JSON.stringify({
      success: true,
      settings: {
        site_title: 'DARK PRIME MODS',
        instagram_url: 'https://instagram.com/darkprimemods',
        developer_name: 'BHARAT KUMAR',
        stage_1_timer_sec: 20,
        stage_3_timer_sec: 10,
        stage_5_timer_sec: 5,
        share_timer_sec: 5,
      }
    }), { headers: corsHeaders });
  }

  // 2. /api/admin/verify-pin
  if (path === '/api/admin/verify-pin' && method === 'POST') {
    try {
      const body = await request.json() as { pin?: string };
      const pin = body.pin || '';
      const now = Date.now();

      const record = pinRateLimit.get(clientIp) || { attempts: 0, lockedUntil: 0 };
      if (record.lockedUntil > now) {
        const remaining = Math.ceil((record.lockedUntil - now) / 1000);
        return new Response(JSON.stringify({
          success: false,
          error: `Cooldown active. Try again in ${remaining}s.`
        }), { status: 429, headers: corsHeaders });
      }

      const expectedHash = env.DEVELOPER_PIN_HASH || await sha256('67676767');
      const inputHash = await sha256(pin.trim());

      if (inputHash !== expectedHash) {
        record.attempts += 1;
        const max = parseInt(env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);
        if (record.attempts >= max) {
          record.lockedUntil = now + 60000;
          record.attempts = 0;
        }
        pinRateLimit.set(clientIp, record);

        return new Response(JSON.stringify({
          success: false,
          error: record.lockedUntil > now ? 'Maximum attempts exceeded. Cooldown active.' : 'Invalid Developer PIN.',
          attemptsRemaining: Math.max(0, max - record.attempts)
        }), { status: 401, headers: corsHeaders });
      }

      pinRateLimit.delete(clientIp);
      const token = crypto.randomUUID().replace(/-/g, '');
      validSessions.add(token);

      return new Response(JSON.stringify({
        success: true,
        token,
        expiresAt: now + 3600 * 4 * 1000
      }), { headers: corsHeaders });
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Malformed request' }), { status: 400, headers: corsHeaders });
    }
  }

  // 3. /api/admin/check-session
  if (path === '/api/admin/check-session') {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token && validSessions.has(token)) {
      return new Response(JSON.stringify({ success: true, valid: true }), { headers: corsHeaders });
    }
    return new Response(JSON.stringify({ success: false, valid: false }), { status: 401, headers: corsHeaders });
  }

  // 4. /api/download/session
  if (path === '/api/download/session' && method === 'POST') {
    const body = await request.json() as any;
    const token = crypto.randomUUID().replace(/-/g, '');
    const now = Date.now();
    downloadSessions.set(token, {
      applicationId: body.applicationId,
      stage: 'WAITING_20S',
      startedAt: now,
      stageStartedAt: now,
      expiresAt: now + 30 * 60 * 1000
    });

    return new Response(JSON.stringify({
      success: true,
      sessionToken: token,
      stage: 'WAITING_20S',
      stageDurationSeconds: 20
    }), { headers: corsHeaders });
  }

  // 5. /api/download/complete-task
  if (path === '/api/download/complete-task' && method === 'POST') {
    const body = await request.json() as any;
    const session = downloadSessions.get(body.sessionToken);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), { status: 400, headers: corsHeaders });
    }
    session.stage = 'WAITING_10S';
    session.stageStartedAt = Date.now();
    return new Response(JSON.stringify({
      success: true,
      stage: session.stage,
      stageDurationSeconds: 10
    }), { headers: corsHeaders });
  }

  // 6. /api/download/advance-stage
  if (path === '/api/download/advance-stage' && method === 'POST') {
    const body = await request.json() as any;
    const session = downloadSessions.get(body.sessionToken);
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), { status: 400, headers: corsHeaders });
    }
    const now = Date.now();
    if (session.stage === 'WAITING_20S') {
      session.stage = 'TASK';
      session.stageStartedAt = now;
      return new Response(JSON.stringify({ success: true, stage: 'TASK' }), { headers: corsHeaders });
    }
    if (session.stage === 'WAITING_10S') {
      session.stage = 'CONTINUE';
      return new Response(JSON.stringify({ success: true, stage: 'CONTINUE' }), { headers: corsHeaders });
    }
    if (session.stage === 'CONTINUE') {
      session.stage = 'WAITING_5S';
      session.stageStartedAt = now;
      return new Response(JSON.stringify({ success: true, stage: 'WAITING_5S', stageDurationSeconds: 5 }), { headers: corsHeaders });
    }
    if (session.stage === 'WAITING_5S') {
      session.stage = 'READY';
      return new Response(JSON.stringify({ success: true, stage: 'READY' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, stage: session.stage }), { headers: corsHeaders });
  }

  // Fallback
  return new Response(JSON.stringify({ error: 'Endpoint not found' }), { status: 404, headers: corsHeaders });
};
