import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs/promises';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_TAXONOMY_DATA } from './src/data/circleData';
import type { PendingCustomSpecialty, TaxonomyDatabase } from './src/types/circle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Security helpers: rate limiting, signed sessions, admin allow-list
// ---------------------------------------------------------------------------
const IS_PROD = process.env.NODE_ENV === 'production';
const OTP_DEV_MODE = process.env.OTP_DEV_MODE === 'true' || !IS_PROD;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET && IS_PROD) {
  console.warn(
    '[security] SESSION_SECRET is not set: sessions will reset on every restart. Set it in your environment.'
  );
}
const ADMIN_PHONES = new Set(
  (process.env.ADMIN_PHONES || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PHONE_RE = /^\+9647[3-9]\d{8}$/;

type Bucket = { count: number; resetAt: number };
function rateLimit(name: string, max: number, windowMs: number): express.RequestHandler {
  const buckets = new Map<string, Bucket>();
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now > b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    b.count += 1;
    if (b.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((b.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Try again later.' });
    }
    return next();
  };
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function signSession(phone: string): string {
  const payload = b64url(JSON.stringify({ p: phone, exp: Date.now() + SESSION_TTL_MS }));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function readSession(token: string | undefined): { phone: string; isAdmin: boolean } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      p: string;
      exp: number;
    };
    if (!PHONE_RE.test(data.p) || Date.now() > data.exp) return null;
    return { phone: data.p, isAdmin: ADMIN_PHONES.has(data.p) };
  } catch {
    return null;
  }
}

type AuthedRequest = express.Request & { session?: { phone: string; isAdmin: boolean } };

const requireAuth: express.RequestHandler = (req, res, next) => {
  const header = req.headers.authorization || '';
  const session = readSession(header.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  (req as AuthedRequest).session = session;
  return next();
};

const requireAdmin: express.RequestHandler = (req, res, next) =>
  requireAuth(req, res, () => {
    if (!(req as AuthedRequest).session?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    return next();
  });

// ---------------------------------------------------------------------------
// Iraqi phone (+964) OTP authentication (phone is the ONLY login method)
// ---------------------------------------------------------------------------
const otpStore = new Map<
  string,
  { code: string; expiresAt: number; attempts: number; lastSentAt: number }
>();

async function deliverOtp(phone: string, code: string): Promise<boolean> {
  const hook = process.env.SMS_WEBHOOK_URL;
  if (!hook) return false;
  const r = await fetch(hook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.SMS_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      to: phone,
      message: `رمز التحقق الخاص بك في CIRCLE.iq: ${code}`,
    }),
  });
  return r.ok;
}

app.post(
  '/api/circle/auth/send-otp',
  rateLimit('send-otp', 10, 15 * 60 * 1000),
  async (req, res) => {
    const normalized = String(req.body?.phone || '').trim();
    if (!PHONE_RE.test(normalized)) {
      return res.status(400).json({
        error: 'Invalid Iraqi mobile number. Expected +9647XXXXXXXXX.',
      });
    }
    const existing = otpStore.get(normalized);
    if (existing && Date.now() - existing.lastSentAt < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait before requesting a new code.' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    let delivered = false;
    try {
      delivered = await deliverOtp(normalized, code);
    } catch {
      delivered = false;
    }
    if (!delivered && !OTP_DEV_MODE) {
      return res.status(503).json({
        error: 'SMS service is not configured. Please try again later.',
      });
    }

    otpStore.set(normalized, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    return res.json({
      ok: true,
      e164: normalized,
      expiresInSeconds: 300,
      // The code is only exposed to the browser in development mode.
      ...(OTP_DEV_MODE && !delivered ? { previewCode: code } : {}),
    });
  }
);

app.post(
  '/api/circle/auth/verify-otp',
  rateLimit('verify-otp', 30, 15 * 60 * 1000),
  async (req, res) => {
    const normalized = String(req.body?.phone || '').trim();
    const submittedCode = String(req.body?.code || '').trim();

    if (!PHONE_RE.test(normalized) || !/^\d{6}$/.test(submittedCode)) {
      return res.status(400).json({ error: 'Invalid phone number or 6-digit code.' });
    }

    const entry = otpStore.get(normalized);
    if (!entry) {
      return res.status(400).json({
        error: 'No active verification code for this number. Request a new code.',
      });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({
        error: 'Verification code expired. Please request a new code.',
      });
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(normalized);
      return res.status(429).json({
        error: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    const a = Buffer.from(entry.code);
    const b = Buffer.from(submittedCode);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Incorrect verification code.' });
    }

    otpStore.delete(normalized);
    const accounts = await readAccounts();
    return res.json({
      verified: true,
      e164: normalized,
      token: signSession(normalized),
      isAdmin: ADMIN_PHONES.has(normalized),
      account: accounts[normalized] ?? null,
    });
  }
);

// ---------------------------------------------------------------------------
// Accounts keyed by verified phone (.data/accounts.json)
// ---------------------------------------------------------------------------
const ACCOUNTS_PATH = path.resolve(__dirname, '.data/accounts.json');
type AccountRecord = { user: unknown; freelancer: unknown | null };

async function readAccounts(): Promise<Record<string, AccountRecord>> {
  try {
    return JSON.parse(await fs.readFile(ACCOUNTS_PATH, 'utf8')) as Record<string, AccountRecord>;
  } catch {
    return {};
  }
}

app.get('/api/circle/auth/me', requireAuth, async (req, res) => {
  const session = (req as AuthedRequest).session!;
  const accounts = await readAccounts();
  res.json({
    phone: session.phone,
    isAdmin: session.isAdmin,
    account: accounts[session.phone] ?? null,
  });
});

app.put('/api/circle/account', rateLimit('account', 60, 15 * 60 * 1000), requireAuth, async (req, res) => {
  const session = (req as AuthedRequest).session!;
  const body = req.body as { user?: Record<string, unknown>; freelancer?: unknown };
  if (!body?.user || typeof body.user !== 'object') {
    return res.status(400).json({ error: 'Invalid account payload.' });
  }
  // The phone always comes from the verified session, never from the client.
  const user = { ...body.user, phone: session.phone };
  // Roles are server-controlled: only the admin allow-list can hold admin roles.
  const roles = Array.isArray(user.roles) ? (user.roles as string[]) : ['user'];
  user.roles = roles.filter(
    (r) => ['user', 'freelancer', 'service_provider'].includes(r)
  );
  if (session.isAdmin) (user.roles as string[]).push('admin');

  const accounts = await readAccounts();
  accounts[session.phone] = { user, freelancer: body.freelancer ?? null };
  await fs.mkdir(path.dirname(ACCOUNTS_PATH), { recursive: true });
  await fs.writeFile(ACCOUNTS_PATH, JSON.stringify(accounts), 'utf8');
  return res.json({ ok: true });
});

// CIRCLE.iq Ecosystem API Endpoints
const circleServiceRequests: unknown[] = [];
const circleContactMessages: unknown[] = [];

app.get('/api/circle/health', (_req, res) => {
  res.json({
    platform: 'CIRCLE.iq',
    phase: 1,
    activeModules: ['website', 'services', 'freelancers', 'admin', 'mobile-preview'],
    gatedModules: ['community', 'academy', 'events', 'payments'],
  });
});

app.post('/api/circle/requests', rateLimit('requests', 20, 15 * 60 * 1000), requireAuth, (req, res) => {
  const body = req.body as { projectTitle?: string; serviceId?: string };
  if (!body?.projectTitle || !body?.serviceId) {
    return res.status(400).json({ error: 'Invalid service request payload.' });
  }
  circleServiceRequests.push(body);
  return res.status(201).json({ ok: true, count: circleServiceRequests.length });
});

app.post('/api/circle/contact', rateLimit('contact', 5, 15 * 60 * 1000), (req, res) => {
  const body = req.body as { email?: string; message?: string };
  if (!body?.email || !body?.message) {
    return res.status(400).json({ error: 'Invalid contact payload.' });
  }
  circleContactMessages.push(body);
  return res.status(201).json({ ok: true });
});

// Two-Level Freelancer Taxonomy Database (.data/circle-taxonomy.json)
const TAXONOMY_DB_PATH = path.resolve(__dirname, '.data/circle-taxonomy.json');

async function readTaxonomyDb(): Promise<TaxonomyDatabase> {
  try {
    const raw = await fs.readFile(TAXONOMY_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TaxonomyDatabase>;
    if (Array.isArray(parsed.categories) && Array.isArray(parsed.specialties)) {
      return {
        categories: parsed.categories,
        specialties: parsed.specialties,
        pendingCustom: Array.isArray(parsed.pendingCustom) ? parsed.pendingCustom : [],
      };
    }
  } catch {
    // Initialize seed DB on first read
  }
  await writeTaxonomyDb(INITIAL_TAXONOMY_DATA);
  return INITIAL_TAXONOMY_DATA;
}

async function writeTaxonomyDb(db: TaxonomyDatabase): Promise<void> {
  await fs.mkdir(path.dirname(TAXONOMY_DB_PATH), { recursive: true });
  await fs.writeFile(TAXONOMY_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

app.get('/api/circle/taxonomy', async (_req, res) => {
  try {
    const db = await readTaxonomyDb();
    return res.json(db);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to load taxonomy database.',
    });
  }
});

app.put('/api/circle/taxonomy', requireAdmin, async (req, res) => {
  try {
    const body = req.body as Partial<TaxonomyDatabase>;
    if (!Array.isArray(body?.categories) || !Array.isArray(body?.specialties)) {
      return res.status(400).json({ error: 'Invalid taxonomy payload.' });
    }
    const nextDb: TaxonomyDatabase = {
      categories: body.categories,
      specialties: body.specialties,
      pendingCustom: Array.isArray(body.pendingCustom) ? body.pendingCustom : [],
    };
    await writeTaxonomyDb(nextDb);
    return res.json(nextDb);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to save taxonomy database.',
    });
  }
});

app.post('/api/circle/taxonomy/pending', rateLimit('pending', 20, 15 * 60 * 1000), requireAuth, async (req, res) => {
  try {
    const body = req.body as Partial<PendingCustomSpecialty>;
    const customText = String(body?.customText || '').trim();
    if (!customText) {
      return res.status(400).json({ error: 'Custom specialty text is required.' });
    }
    const db = await readTaxonomyDb();
    const item: PendingCustomSpecialty = {
      id: body.id || `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: String(body.userId || 'usr-guest'),
      username: String(body.username || 'member'),
      userDisplayNameEn: String(body.userDisplayNameEn || 'Member'),
      userDisplayNameAr: String(body.userDisplayNameAr || 'عضو'),
      customText,
      roleType: body.roleType === 'secondary' ? 'secondary' : 'primary',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const nextDb: TaxonomyDatabase = {
      ...db,
      pendingCustom: [item, ...db.pendingCustom],
    };
    await writeTaxonomyDb(nextDb);
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to submit pending specialty.',
    });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CIRCLE.iq server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
