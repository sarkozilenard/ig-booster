import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'fallback-secret';

function sign(value) {
  return crypto.createHmac('sha256', SECRET).update(value).digest('hex');
}

export function createToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  if (sign(data) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'ig_session';
export const ADMIN_COOKIE = 'ig_admin';
