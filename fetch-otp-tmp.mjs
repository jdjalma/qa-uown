import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
dotenv.config();
const client = new ImapFlow({
  host: 'imap.gmail.com', port: 993, secure: true, logger: false,
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
});
const alias = process.argv[2];
await client.connect();
const lock = await client.getMailboxLock('INBOX');
try {
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const uids = await client.search({ since, to: alias }, { uid: true });
  if (!uids || uids.length === 0) { console.log('NO_EMAIL'); process.exit(0); }
  const last = uids[uids.length - 1];
  const msg = await client.fetchOne(String(last), { source: true, envelope: true }, { uid: true });
  const src = msg.source.toString();
  console.log('SUBJECT:', msg.envelope.subject);
  console.log('DATE:', msg.envelope.date);
  const m = src.replace(/=\r?\n/g, '').match(/\b(\d{6})\b/);
  console.log('CODE:', m ? m[1] : 'NOT_FOUND');
} finally { lock.release(); await client.logout(); }
