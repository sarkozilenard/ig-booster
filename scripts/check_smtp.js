const fs = require('fs');
const nodemailer = require('nodemailer');

// load .env
const envPath = '.env';
const env = {};
try {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const k = line.slice(0, idx);
    const v = line.slice(idx + 1);
    env[k] = v;
  });
} catch (e) {
  console.error('ERR_READ_ENV', e.message);
  process.exit(2);
}

const host = env.SMTP_HOST;
if (!host) { console.error('ERR_MISSING', 'SMTP_HOST not found in .env'); process.exit(2); }
const port = parseInt(env.SMTP_PORT || '587', 10);
const secure = port === 465;
const auth = env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined;

const transporter = nodemailer.createTransport({ host, port, secure, auth, tls: { rejectUnauthorized: false } });

console.log('SMTP', host, 'port', port, 'secure', secure, 'user', !!env.SMTP_USER);

transporter.verify((err, success) => {
  if (err) {
    console.error('VERIFY_ERROR', err && err.message ? err.message : err);
    process.exit(3);
  }
  console.log('VERIFY_OK');
  process.exit(0);
});
