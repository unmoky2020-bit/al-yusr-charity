import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { isMongo, sql, mongo } from './db.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });
export const verify = (tok) => { try { return jwt.verify(tok, SECRET); } catch { return null; } };

export function authMiddleware(req, _res, next) {
  const h = req.headers.authorization || '';
  const tok = h.startsWith('Bearer ') ? h.slice(7) : null;
  req.user = tok ? verify(tok) : null;
  next();
}

export const requireAuth = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: 'unauthorized' });

export const requireRole = (...roles) => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const has = await userHasAnyRole(req.user.sub, roles);
  return has ? next() : res.status(403).json({ error: 'forbidden' });
};

export async function userHasAnyRole(userId, roles) {
  if (isMongo()) {
    const c = await mongo().collection('user_roles').countDocuments({ user_id: userId, role: { $in: roles } });
    return c > 0;
  }
  const [rows] = await sql().query('SELECT 1 FROM user_roles WHERE user_id=? AND role IN (?) LIMIT 1', [userId, roles]);
  return rows.length > 0;
}

export async function registerUser({ email, password, name, phone, city, role = 'donor', skills, preferred_program }) {
  const id = uuid();
  const hash = await bcrypt.hash(password, 10);
  if (isMongo()) {
    await mongo().collection('users').insertOne({
      id, email, password_hash: hash, full_name: name || '', phone, city,
      skills: skills || [], preferred_program: preferred_program || null,
      total_donated: 0, donations_count: 0, created_at: new Date(), updated_at: new Date(),
    });
    await mongo().collection('user_roles').insertOne({ id: uuid(), user_id: id, role, created_at: new Date() });
  } else {
    await sql().query(
      'INSERT INTO users (id,email,password_hash,full_name,phone,city,skills,preferred_program) VALUES (?,?,?,?,?,?,?,?)',
      [id, email, hash, name || '', phone || null, city || null, JSON.stringify(skills || []), preferred_program || null]
    );
    await sql().query('INSERT INTO user_roles (id,user_id,role) VALUES (?,?,?)', [uuid(), id, role]);
  }
  return { id, email, name, role };
}

export async function loginUser(email, password) {
  let user;
  if (isMongo()) {
    user = await mongo().collection('users').findOne({ email });
  } else {
    const [rows] = await sql().query('SELECT * FROM users WHERE email=? LIMIT 1', [email]);
    user = rows[0];
  }
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.full_name };
}