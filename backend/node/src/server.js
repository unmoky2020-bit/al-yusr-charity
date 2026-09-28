import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { authMiddleware, requireAuth, requireRole, sign, registerUser, loginUser } from './auth.js';
import * as repo from './repo.js';

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(cors({ origin: (process.env.APP_CORS_ORIGIN || '*').split(','), credentials: true }));
app.use(authMiddleware);

const ok = (res, data) => res.json({ data });
const fail = (res, code, msg) => res.status(code).json({ error: msg });
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((e) => { console.error(e); fail(res, 500, e.message); });

app.get('/health', (_req, res) => res.json({ ok: true, driver: process.env.DB_DRIVER || 'mysql' }));

/* ===== Auth ===== */
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password, name, phone, city, role, skills, preferred_program } = req.body || {};
  if (!email || !password) return fail(res, 400, 'email/password required');
  const u = await registerUser({ email, password, name, phone, city, role: role || 'donor', skills, preferred_program });
  ok(res, { user: u, token: sign({ sub: u.id, email: u.email }) });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const u = await loginUser(email, password);
  if (!u) return fail(res, 401, 'invalid credentials');
  ok(res, { user: u, token: sign({ sub: u.id, email: u.email }) });
}));

/* ===== Categories ===== */
app.get('/api/categories', wrap(async (_req, res) => ok(res, await repo.listCategories())));

/* ===== Cases ===== */
app.get('/api/cases', wrap(async (req, res) =>
  ok(res, await repo.listPublicCases({ categorySlug: req.query.cat, limit: req.query.limit }))));
app.get('/api/cases/all', requireRole('admin','case_manager'),
  wrap(async (_req, res) => ok(res, await repo.listAllCases())));
app.get('/api/cases/:ref', wrap(async (req, res) => {
  const c = await repo.getCaseByRef(req.params.ref);
  if (!c) return fail(res, 404, 'not found');
  ok(res, c);
}));
app.post('/api/cases', requireRole('admin','case_manager'),
  wrap(async (req, res) => ok(res, await repo.createCase(req.body, req.user.sub))));
app.patch('/api/cases/:id/status', requireRole('admin','case_manager'),
  wrap(async (req, res) => { await repo.setCaseStatus(req.params.id, req.body.status, req.body.reason, req.user.sub); ok(res, { ok: true }); }));
app.delete('/api/cases/:id', requireRole('admin'),
  wrap(async (req, res) => { await repo.deleteCase(req.params.id); ok(res, { ok: true }); }));

/* ===== Case Updates ===== */
app.get('/api/cases/:id/updates', wrap(async (req, res) => ok(res, await repo.listCaseUpdates(req.params.id))));
app.post('/api/cases/:id/updates', requireRole('admin','case_manager'),
  wrap(async (req, res) => ok(res, await repo.addCaseUpdate(req.params.id, req.body.body, req.body.image_url, req.user.sub))));

/* ===== Donations ===== */
app.get('/api/donations/me', requireAuth,
  wrap(async (req, res) => ok(res, await repo.listMyDonations(req.user.sub))));
app.post('/api/donations',
  wrap(async (req, res) => ok(res, await repo.createDonation(req.body, req.user?.sub))));

const port = Number(process.env.APP_PORT || 8080);
initDb().then(() => app.listen(port, () => console.log(`🚀 alyusr-api on :${port} (${process.env.DB_DRIVER || 'mysql'})`)))
  .catch((e) => { console.error('DB init failed', e); process.exit(1); });