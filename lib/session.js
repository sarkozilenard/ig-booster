import HmacSHA256 from 'crypto-js/hmac-sha256';
import Hex from 'crypto-js/enc-hex';

const SECRET = process.env.SESSION_SECRET || 'fallback-secret';

function sign(value) {
  // Use pure-JS HMAC implementation (crypto-js) which works in Edge and Node runtimes
  return HmacSHA256(value, SECRET).toString(Hex);
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
