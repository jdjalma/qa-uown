import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ImapFlow } from 'imapflow';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

const user = process.env.EMAIL || '';
const pass = process.env.EMAIL_PASSWORD || '';

console.log('Email user:', user);
console.log('Password length:', pass.length);

const client = new ImapFlow({
  host: 'imap.gmail.com',
  port: 993,
  secure: true,
  auth: { user, pass },
  logger: false,
});

try {
  console.log('Connecting to Gmail IMAP...');
  await client.connect();
  console.log('Connected successfully!');

  const lock = await client.getMailboxLock('INBOX');
  try {
    console.log('Mailbox status:', client.mailbox?.exists, 'messages');

    // Fetch 3 most recent emails
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    let count = 0;
    for await (const msg of client.fetch({ since }, { envelope: true, source: true })) {
      count++;
      const subject = msg.envelope?.subject || '(no subject)';
      const to = msg.envelope?.to?.map(t => t.address).join(', ') || '(no to)';
      const date = msg.envelope?.date || '(no date)';
      const bodyPreview = (msg.source?.toString() || '').substring(0, 200);

      // Check for 6-digit code
      const decoded = bodyPreview.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      const codeMatch = decoded.match(/(?<!\d)(\d{6})(?!\d)/);

      console.log(`\n--- Email ${count} ---`);
      console.log('  Subject:', subject);
      console.log('  To:', to);
      console.log('  Date:', date);
      if (codeMatch) console.log('  CODE FOUND:', codeMatch[1]);
      if (count >= 5) break;
    }
    console.log(`\nTotal recent emails found: ${count}`);
  } finally {
    lock.release();
  }
} catch (err) {
  console.error('IMAP Error:', err.message);
} finally {
  await client.logout().catch(() => {});
}
