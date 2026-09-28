import { v4 as uuid } from 'uuid';
import { isMongo, sql, mongo } from './db.js';

const refCase = () => `C-${new Date().getFullYear()}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
const refDon  = () => `D-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;

/* ============ CATEGORIES ============ */
export async function listCategories() {
  if (isMongo()) return mongo().collection('case_categories').find({ active: true }).sort({ sort_order: 1 }).toArray();
  const [rows] = await sql().query('SELECT * FROM case_categories WHERE active=1 ORDER BY sort_order');
  return rows;
}

/* ============ CASES ============ */
const PUBLIC_STATUSES = ['approved','funded','closed'];

export async function listPublicCases({ categorySlug, limit }) {
  if (isMongo()) {
    const match = { status: { $in: PUBLIC_STATUSES } };
    if (categorySlug) {
      const cat = await mongo().collection('case_categories').findOne({ slug: categorySlug });
      if (!cat) return [];
      match.category_id = cat.id;
    }
    let cur = mongo().collection('cases').find(match).sort({ created_at: -1 });
    if (limit) cur = cur.limit(Number(limit));
    return cur.toArray();
  }
  let q = `SELECT c.*, cat.slug AS cat_slug, cat.name_ar AS cat_name_ar, cat.name_en AS cat_name_en, cat.icon AS cat_icon
           FROM cases c JOIN case_categories cat ON cat.id=c.category_id
           WHERE c.status IN (?)`;
  const params = [PUBLIC_STATUSES];
  if (categorySlug) { q += ' AND cat.slug=?'; params.push(categorySlug); }
  q += ' ORDER BY c.created_at DESC';
  if (limit) { q += ' LIMIT ?'; params.push(Number(limit)); }
  const [rows] = await sql().query(q, params);
  return rows.map(nestCategory);
}

export async function listAllCases() {
  if (isMongo()) return mongo().collection('cases').find().sort({ created_at: -1 }).toArray();
  const [rows] = await sql().query(
    `SELECT c.*, cat.slug AS cat_slug, cat.name_ar AS cat_name_ar, cat.name_en AS cat_name_en, cat.icon AS cat_icon
     FROM cases c JOIN case_categories cat ON cat.id=c.category_id ORDER BY c.created_at DESC`
  );
  return rows.map(nestCategory);
}

export async function getCaseByRef(ref) {
  if (isMongo()) return mongo().collection('cases').findOne({ ref_code: ref });
  const [rows] = await sql().query(
    `SELECT c.*, cat.slug AS cat_slug, cat.name_ar AS cat_name_ar, cat.name_en AS cat_name_en, cat.icon AS cat_icon
     FROM cases c JOIN case_categories cat ON cat.id=c.category_id WHERE c.ref_code=? LIMIT 1`, [ref]);
  return rows[0] ? nestCategory(rows[0]) : null;
}

export async function createCase(input, userId) {
  const id = uuid(); const ref_code = refCase();
  const row = {
    id, ref_code, status: 'pending', raised_amount: 0,
    governorate: input.governorate || 'الدقهلية',
    urgency: input.urgency || 'medium',
    story: input.story || '', created_by: userId || null,
    ...input,
  };
  if (isMongo()) {
    await mongo().collection('cases').insertOne({ ...row, created_at: new Date(), updated_at: new Date() });
    return row;
  }
  await sql().query(
    `INSERT INTO cases (id,ref_code,category_id,title,story,beneficiary_name,beneficiary_age,beneficiary_gender,
      governorate,city,cover_image_url,needed_amount,deadline,urgency,status,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, ref_code, input.category_id, input.title, row.story, input.beneficiary_name,
     input.beneficiary_age || null, input.beneficiary_gender || null, row.governorate,
     input.city || null, input.cover_image_url || null, input.needed_amount || 0,
     input.deadline || null, row.urgency, 'pending', userId || null]);
  return getCaseByRef(ref_code);
}

export async function setCaseStatus(id, status, reason, approverId) {
  const patch = { status };
  if (status === 'approved') { patch.approved_by = approverId; patch.approved_at = new Date(); }
  if (status === 'closed')   { patch.closed_at = new Date(); }
  if (status === 'rejected') { patch.rejection_reason = reason || null; }
  if (isMongo()) {
    await mongo().collection('cases').updateOne({ id }, { $set: { ...patch, updated_at: new Date() } });
    return;
  }
  const cols = Object.keys(patch); const vals = Object.values(patch);
  await sql().query(`UPDATE cases SET ${cols.map(c=>`${c}=?`).join(',')} WHERE id=?`, [...vals, id]);
}

export async function deleteCase(id) {
  if (isMongo()) { await mongo().collection('cases').deleteOne({ id }); return; }
  await sql().query('DELETE FROM cases WHERE id=?', [id]);
}

/* ============ CASE UPDATES ============ */
export async function listCaseUpdates(caseId) {
  if (isMongo()) return mongo().collection('case_updates').find({ case_id: caseId }).sort({ created_at: -1 }).toArray();
  const [rows] = await sql().query('SELECT * FROM case_updates WHERE case_id=? ORDER BY created_at DESC', [caseId]);
  return rows;
}
export async function addCaseUpdate(caseId, body, image_url, authorId) {
  const id = uuid();
  if (isMongo()) {
    const doc = { id, case_id: caseId, body, image_url: image_url || null, author_id: authorId || null, created_at: new Date() };
    await mongo().collection('case_updates').insertOne(doc); return doc;
  }
  await sql().query('INSERT INTO case_updates (id,case_id,body,image_url,author_id) VALUES (?,?,?,?,?)',
    [id, caseId, body, image_url || null, authorId || null]);
  return { id, case_id: caseId, body, image_url, author_id: authorId, created_at: new Date() };
}

/* ============ DONATIONS ============ */
export async function createDonation(input, donorId) {
  const id = uuid(); const ref_code = refDon();
  const row = { id, ref_code, donor_id: donorId || null, currency: 'EGP', payment_status: 'pending', ...input };
  if (isMongo()) {
    await mongo().collection('donations').insertOne({ ...row, created_at: new Date() });
    if (row.case_id && row.payment_status === 'paid') await bumpRaised(row.case_id, row.amount);
    return row;
  }
  await sql().query(
    `INSERT INTO donations (id,ref_code,donor_id,case_id,category_id,amount,currency,donor_name,donor_email,donor_phone,message,payment_method,payment_status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, ref_code, row.donor_id, input.case_id || null, input.category_id || null, input.amount,
     row.currency, input.donor_name || null, input.donor_email || null, input.donor_phone || null,
     input.message || null, input.payment_method || null, row.payment_status]);
  if (input.case_id && row.payment_status === 'paid') await bumpRaised(input.case_id, input.amount);
  return row;
}

export async function listMyDonations(donorId) {
  if (isMongo()) return mongo().collection('donations').find({ donor_id: donorId }).sort({ created_at: -1 }).toArray();
  const [rows] = await sql().query('SELECT * FROM donations WHERE donor_id=? ORDER BY created_at DESC', [donorId]);
  return rows;
}

/* ============ DONATION STATUS STATE MACHINE ============ */
const DON_TRANSITIONS = {
  pending:  ['paid','failed'],
  paid:     ['refunded'],
  failed:   ['pending'],
  refunded: [],
};
export function canTransitionDonation(from, to) {
  return from === to || (DON_TRANSITIONS[from] || []).includes(to);
}

export async function getDonationByRef(ref) {
  if (isMongo()) return mongo().collection('donations').findOne({ ref_code: ref });
  const [rows] = await sql().query('SELECT * FROM donations WHERE ref_code=? LIMIT 1', [ref]);
  return rows[0] || null;
}
export async function getDonationById(id) {
  if (isMongo()) return mongo().collection('donations').findOne({ id });
  const [rows] = await sql().query('SELECT * FROM donations WHERE id=? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function setDonationStatus(idOrRef, nextStatus, { byRef = false, paymentMethod, providerRef } = {}) {
  if (!['pending','paid','failed','refunded'].includes(nextStatus)) {
    const e = new Error(`Invalid status: ${nextStatus}`); e.code = 400; throw e;
  }
  const current = byRef ? await getDonationByRef(idOrRef) : await getDonationById(idOrRef);
  if (!current) { const e = new Error('donation not found'); e.code = 404; throw e; }
  if (!canTransitionDonation(current.payment_status, nextStatus)) {
    const e = new Error(`Illegal transition ${current.payment_status} -> ${nextStatus}`); e.code = 409; throw e;
  }
  const patch = { payment_status: nextStatus };
  if (paymentMethod) patch.payment_method = paymentMethod;
  if (providerRef)   patch.message = `provider_ref:${providerRef}`;

  if (isMongo()) {
    await mongo().collection('donations').updateOne({ id: current.id }, { $set: patch });
  } else {
    const cols = Object.keys(patch); const vals = Object.values(patch);
    await sql().query(`UPDATE donations SET ${cols.map(c=>`${c}=?`).join(',')} WHERE id=?`, [...vals, current.id]);
  }

  // Adjust raised_amount
  if (current.case_id) {
    if (current.payment_status !== 'paid' && nextStatus === 'paid') {
      await bumpRaised(current.case_id, current.amount);
    } else if (current.payment_status === 'paid' && ['refunded','failed','pending'].includes(nextStatus)) {
      if (isMongo()) {
        await mongo().collection('cases').updateOne({ id: current.case_id }, { $inc: { raised_amount: -Number(current.amount) } });
      } else {
        await sql().query('UPDATE cases SET raised_amount = GREATEST(0, raised_amount - ?) WHERE id=?', [Number(current.amount), current.case_id]);
      }
    }
  }
  return { ...current, ...patch };
}

export async function listAllDonations({ status, method, q } = {}) {
  if (isMongo()) {
    const m = {};
    if (status && status !== 'all') m.payment_status = status;
    if (method && method !== 'all') m.payment_method = method;
    if (q) m.$or = [{ ref_code: { $regex: q, $options: 'i' } }, { donor_name: { $regex: q, $options: 'i' } }];
    return mongo().collection('donations').find(m).sort({ created_at: -1 }).limit(500).toArray();
  }
  let sqlq = 'SELECT * FROM donations WHERE 1=1'; const p = [];
  if (status && status !== 'all') { sqlq += ' AND payment_status=?'; p.push(status); }
  if (method && method !== 'all') { sqlq += ' AND payment_method=?'; p.push(method); }
  if (q) { sqlq += ' AND (ref_code LIKE ? OR donor_name LIKE ? OR donor_email LIKE ?)'; p.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  sqlq += ' ORDER BY created_at DESC LIMIT 500';
  const [rows] = await sql().query(sqlq, p);
  return rows;
}

async function bumpRaised(caseId, amount) {
  if (isMongo()) {
    await mongo().collection('cases').updateOne({ id: caseId }, { $inc: { raised_amount: Number(amount) } });
    const c = await mongo().collection('cases').findOne({ id: caseId });
    if (c && c.raised_amount >= c.needed_amount && c.status === 'approved') {
      await mongo().collection('cases').updateOne({ id: caseId }, { $set: { status: 'funded' } });
    }
    return;
  }
  await sql().query('UPDATE cases SET raised_amount = raised_amount + ? WHERE id=?', [Number(amount), caseId]);
  await sql().query("UPDATE cases SET status='funded' WHERE id=? AND raised_amount>=needed_amount AND status='approved'", [caseId]);
}

/* ============ helpers ============ */
function nestCategory(r) {
  const { cat_slug, cat_name_ar, cat_name_en, cat_icon, ...rest } = r;
  return { ...rest, case_categories: cat_slug ? { slug: cat_slug, name_ar: cat_name_ar, name_en: cat_name_en, icon: cat_icon } : null };
}