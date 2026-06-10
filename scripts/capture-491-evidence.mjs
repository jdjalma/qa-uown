#!/usr/bin/env node
/**
 * Captures email evidence + DB snapshot for task 491.
 * - Pulls UOWN + KS SettledInFullEmail bodies from IMAP
 * - Writes the raw HTML to docs/taskTestingUown/.../emails/
 * - Renders each HTML to a PNG via Playwright chromium headless
 * - Writes a db-snapshot.json with the authoritative DB state
 *
 * Usage:
 *   node scripts/capture-491-evidence.mjs \
 *     --uown-pk 11473 \
 *     --ks-pk 11469 \
 *     --out docs/taskTestingUown/RU04.26.1.51.0_addNewSettledInFullEmailTemplate_491
 */
import 'dotenv/config';
import { ImapFlow } from 'imapflow';
import { chromium } from '@playwright/test';
import { Client } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => {
    if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1]]);
    return a;
  }, []),
);
const uownPk = Number(args['uown-pk']);
const ksPk = Number(args['ks-pk']);
const outRoot = args['out'];
if (!uownPk || !ksPk || !outRoot) {
  console.error('Missing --uown-pk / --ks-pk / --out');
  process.exit(1);
}

const emailsDir = path.join(outRoot, 'emails');
const shotsDir = path.join(outRoot, 'screenshots');
await fs.mkdir(emailsDir, { recursive: true });
await fs.mkdir(shotsDir, { recursive: true });

// ── IMAP fetch ────────────────────────────────────────────────────────
function decodeQuotedPrintable(s) {
  return s
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
function extractHtmlBody(source) {
  // Separate top-level headers from body
  const headerEnd = source.search(/\r?\n\r?\n/);
  if (headerEnd < 0) return source;
  const headers = source.slice(0, headerEnd);
  const body = source.slice(headerEnd).replace(/^\r?\n\r?\n/, '');

  const topCtMatch = headers.match(/^Content-Type:\s*([^;\r\n]+)(?:;[^\r\n]*)?(?:\r?\n\s+[^\r\n]+)*/im);
  const topCt = topCtMatch?.[1]?.toLowerCase().trim();
  const boundaryMatch = headers.match(/boundary="?([^";\r\n]+)"?/i);

  // Single-part text/html
  if (topCt === 'text/html' && !boundaryMatch) {
    return decodeQuotedPrintable(body);
  }

  // Multipart — walk parts and find text/html
  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = body.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?`, 'g'));
    for (const part of parts) {
      if (/content-type:\s*text\/html/i.test(part)) {
        const partBodyIdx = part.search(/\r?\n\r?\n/);
        if (partBodyIdx >= 0) return decodeQuotedPrintable(part.slice(partBodyIdx + 2));
      }
    }
  }

  return decodeQuotedPrintable(body);
}

async function fetchEmailForPk(pk, label) {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    logger: false,
  });
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const uids = await client.search({ to: process.env.EMAIL, since });
    if (!uids?.length) throw new Error(`${label}: no UIDs returned since ${since.toISOString()}`);
    const wanted = new RegExp(`account\\s*#\\s*${pk}\\b`, 'i');
    let latest = null;
    let latestDate = new Date(0);
    for await (const msg of client.fetch(uids, { source: true, envelope: true })) {
      const subject = msg.envelope?.subject || '';
      if (!wanted.test(subject)) continue;
      const date = msg.envelope?.date || new Date(0);
      if (date > latestDate) {
        latestDate = date;
        latest = {
          subject,
          date: date.toISOString(),
          from: msg.envelope?.from?.[0]
            ? `${msg.envelope.from[0].name ?? ''} <${msg.envelope.from[0].address}>`
            : '',
          source: msg.source?.toString() || '',
        };
      }
    }
    if (!latest) throw new Error(`${label}: no email matching account #${pk}`);
    latest.html = extractHtmlBody(latest.source);
    return latest;
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

// ── DB snapshot ───────────────────────────────────────────────────────
async function snapshotDb(uownPk, ksPk) {
  const c = new Client({
    host: '127.0.0.1',
    port: 5445,
    user: 'svc_user',
    password: 'F1nTech',
    database: 'svc',
  });
  await c.connect();
  const pick = async (sql, params) => (await c.query(sql, params)).rows;
  const snap = {
    capturedAt: new Date().toISOString(),
    accounts: await pick(
      `SELECT pk, account_status, company, rating, settled_in_full_date_time
         FROM uown_sv_account WHERE pk = ANY($1::int[])`,
      [[uownPk, ksPk]],
    ),
    emailQueue: await pick(
      `SELECT pk, account_pk, template_name, to_email_addresses, status, sent_time, row_created_timestamp
         FROM uown_email_queue
        WHERE account_pk = ANY($1::int[]) AND template_name LIKE '%SettledInFull%'
        ORDER BY row_created_timestamp DESC`,
      [[uownPk, ksPk]],
    ),
    correspondenceLogs: await pick(
      `SELECT pk, account_pk, template_name, row_created_timestamp
         FROM uown_correspondence_logs
        WHERE account_pk = ANY($1::int[]) AND template_name LIKE '%SettledInFull%'
        ORDER BY row_created_timestamp DESC`,
      [[uownPk, ksPk]],
    ),
    scheduledTask: await pick(
      `SELECT scheduled_task_name, is_active, cron_trigger, last_trigger_time
         FROM uown_scheduled_task
        WHERE scheduled_task_name = 'settledInFullAccountEmailSweep'`,
    ),
  };
  await c.end();
  return snap;
}

// ── Playwright render ─────────────────────────────────────────────────
async function renderPngs(htmlByLabel) {
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 720, height: 900 } });
    const page = await ctx.newPage();
    for (const [label, info] of Object.entries(htmlByLabel)) {
      const htmlPath = path.join(emailsDir, `${label}.html`);
      const pngPath = path.join(shotsDir, `${label}.png`);
      await fs.writeFile(htmlPath, info.html, 'utf8');
      await fs.writeFile(htmlPath.replace(/\.html$/, '.eml'), info.source, 'utf8');
      await page.setContent(info.html, { waitUntil: 'networkidle' });
      await page.screenshot({ path: pngPath, fullPage: true });
      console.log(`wrote ${htmlPath} + ${pngPath}`);
    }
  } finally {
    await browser.close();
  }
}

// ── Run ───────────────────────────────────────────────────────────────
const [uown, ks] = await Promise.all([
  fetchEmailForPk(uownPk, 'uown'),
  fetchEmailForPk(ksPk, 'kornerstone'),
]);

const dbSnap = await snapshotDb(uownPk, ksPk);

await renderPngs({
  [`RU04.26.1.51.0_491-01-uown-settled-in-full-${uownPk}`]: uown,
  [`RU04.26.1.51.0_491-02-kornerstone-settled-in-full-${ksPk}`]: ks,
});

await fs.writeFile(
  path.join(outRoot, 'db-snapshot.json'),
  JSON.stringify(dbSnap, null, 2),
  'utf8',
);

const meta = {
  uown: { pk: uownPk, subject: uown.subject, from: uown.from, date: uown.date },
  kornerstone: { pk: ksPk, subject: ks.subject, from: ks.from, date: ks.date },
  capturedAt: new Date().toISOString(),
};
await fs.writeFile(
  path.join(emailsDir, 'metadata.json'),
  JSON.stringify(meta, null, 2),
  'utf8',
);
console.log('\nmetadata:');
console.log(JSON.stringify(meta, null, 2));
