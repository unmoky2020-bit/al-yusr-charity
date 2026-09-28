import crypto from 'node:crypto';

function verifyHmac(secret, raw, sig, algo = 'sha256') {
  if (!secret) return true;
  if (!sig) return false;
  const computed = crypto.createHmac(algo, secret).update(raw).digest('hex');
  return computed === String(sig).replace(/^sha256=/, '');
}

function verifyPaymob(payload, hmac) {
  const secret = process.env.PAYMOB_HMAC_SECRET || '';
  if (!secret) return true;
  const o = payload?.obj ?? payload;
  const fields = [
    'amount_cents','created_at','currency','error_occured','has_parent_transaction',
    'id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment',
    'is_voided','order.id','owner','pending','source_data.pan','source_data.sub_type','source_data.type','success',
  ];
  const get = (path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const concat = fields.map((f) => (get(f) ?? '')).join('');
  const sig = crypto.createHmac('sha512', secret).update(concat).digest('hex');
  return sig === hmac;
}

export function normalize(provider, body) {
  if (provider === 'paymob') {
    const o = body?.obj ?? body;
    const ref = o?.payment_key_claims?.extra?.donation_ref || o?.order?.merchant_order_id || o?.merchant_order_id;
    if (!ref) return null;
    if (o?.is_refunded) return { ref, status: 'refunded', provider_ref: String(o?.id ?? '') };
    return { ref, status: o?.success ? 'paid' : 'failed', provider_ref: String(o?.id ?? '') };
  }
  if (provider === 'vodafone') {
    const ref = body?.merchant_ref || body?.reference || body?.donation_ref;
    if (!ref) return null;
    const s = String(body?.status ?? body?.txn_status ?? '').toUpperCase();
    const status = s.includes('SUCCESS') || s === 'PAID' ? 'paid' : s.includes('REFUND') ? 'refunded' : 'failed';
    return { ref, status, provider_ref: String(body?.transaction_id ?? '') };
  }
  // instapay
  const ref = body?.merchantOrderId || body?.reference || body?.donation_ref;
  if (!ref) return null;
  const s = String(body?.status ?? '').toUpperCase();
  const status = s === 'SETTLED' || s === 'SUCCESS' ? 'paid' : s === 'REVERSED' || s === 'REFUNDED' ? 'refunded' : 'failed';
  return { ref, status, provider_ref: String(body?.transactionId ?? '') };
}

export function verify(provider, raw, body, sigHeader) {
  if (provider === 'paymob') return verifyPaymob(body, sigHeader || '');
  const secret = provider === 'vodafone' ? process.env.VODAFONE_WEBHOOK_SECRET : process.env.INSTAPAY_WEBHOOK_SECRET;
  return verifyHmac(secret, raw, sigHeader);
}