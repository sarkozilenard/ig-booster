const fs = require('fs');
const nodemailer = require('nodemailer');

function loadEnv(path = '.env') {
  const env = {};
  try {
    const raw = fs.readFileSync(path, 'utf8');
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
  return env;
}

async function trySend(env, recipient, attemptPort) {
  const host = env.SMTP_HOST;
  const port = attemptPort || parseInt(env.SMTP_PORT || '587', 10);
  const secure = port === 465;
  const auth = env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    logger: true,
    debug: true,
    tls: { rejectUnauthorized: false }
  });

  console.log('Using SMTP', host, 'port', port, 'secure', secure, 'user', !!env.SMTP_USER);

  const from = env.SMTP_FROM || env.SMTP_USER || `no-reply@${env.SMTP_HOST || 'example.com'}`;

  const mail = {
    from,
    to: recipient,
    subject: 'Social Booster — Teszt üzenet',
    text: 'Ez egy teszt e-mail a Social Booster alkalmazástól.',
    html: '<p>Ez egy <b>teszt</b> e-mail a Social Booster alkalmazástól.</p>'
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mail, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    });
  });
}

(async function main(){
  const env = loadEnv();
  const recipient = process.argv[2] || env.TEST_RECIPIENT;
  if (!recipient) {
    console.error('USAGE: node scripts/send_test_email.js recipient@example.com');
    process.exit(2);
  }

  try {
    // First, try configured port
    const info = await trySend(env, recipient);
    console.log('SEND_OK', info && info.messageId ? info.messageId : info);
    process.exit(0);
  } catch (err1) {
    console.error('SEND_ERROR', err1 && err1.message ? err1.message : err1);
    console.error('Stack:', err1 && err1.stack);
    // If initial port was 465, try 587 fallback
    const fallbackPort = 587;
    try {
      console.log('Trying fallback port', fallbackPort);
      const info2 = await trySend(env, recipient, fallbackPort);
      console.log('SEND_OK_FALLBACK', info2 && info2.messageId ? info2.messageId : info2);
      process.exit(0);
    } catch (err2) {
      console.error('SEND_ERROR_FALLBACK', err2 && err2.message ? err2.message : err2);
      console.error('Stack:', err2 && err2.stack);
      process.exit(4);
    }
  }
})();
