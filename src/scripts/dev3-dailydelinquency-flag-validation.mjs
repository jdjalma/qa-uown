/**
 * Valida o runtime da flag dailyDelinquencyRerunCCSweep em dev3.
 *
 * Objetivo: confirmar que, com a flag TRUE em uown_configuration_management (pk=126),
 * o sweep agora TENTA o re-charge (entra em runCCTransaction) em vez de só logar nota.
 *
 * Passos:
 *   1. Verifica o valor atual da flag em uown_configuration_management
 *   2. Re-seed account 221 se necessário (posting_date deve ser CURRENT_DATE)
 *   3. Valida que o SQL do sweep seleciona account 221
 *   4. Dispara o sweep via API
 *   5. Aguarda nova row em uown_sweep_logs
 *   6. Checa se houve nova uown_sv_credit_card_transaction para account 221
 *   7. Reporta: processed count + nova transação (indicador do re-charge)
 *
 * Autorização DB: continuação da autorização registrada na sessão 2026-06-03
 * (CLAUDE.md Exception 3) para account 221 (dedicado a este sweep).
 *
 * Run: node src/scripts/dev3-dailydelinquency-flag-validation.mjs
 */

import fs from 'node:fs';
import pg from 'pg';

// ── Config ────────────────────────────────────────────────────────────────────

const env = {};
for (const line of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const dbUrl = new URL(env.UOWN_DB_URL_DEV3.replace(/^jdbc:/, ''));
dbUrl.username = env.UOWN_DB_USER_DEV3;
dbUrl.password = env.UOWN_DB_PASS_DEV3 || '';
const pool = new pg.Pool({ connectionString: dbUrl.toString(), max: 1 });

const API_BASE = env.UOWN_API_BASE_DEV3 || 'https://svc-dev3.uownleasing.com';
const API_KEY  = env.UOWN_API_KEY_DEV3  || env.UOWN_API_KEY;

// Tokenized MASTERCARD on file for account 221 (confirmed 2026-06-03)
const CARD_TOKEN = '545f5afc-1e51-4960-99a5-5fd173cefbe0';
const SWEEP_NAME = 'dailyDelinquencyRerunCCSweep';
const ACCOUNT    = 221;
const FLAG_KEY   = 'com.uownleasing.svc.service.sweeps.paymentSweeps.DelinquencyRerunCCPaymentsSweepService.run.cc.transaction.for.delinquency.dailyDelinquencyRerunCCSweep';

const q = async (label, sql, params = []) => {
  try {
    const r = await pool.query(sql, params);
    console.log(`\n### ${label} (${r.rows.length} row(s))`);
    console.dir(r.rows, { depth: null, maxArrayLength: 20 });
    return r.rows;
  } catch (e) {
    console.log(`\n### ${label}\n  ERR: ${e.message}`);
    return [];
  }
};

// ── Step 1: verificar flag em uown_configuration_management ──────────────────

console.log('=== STEP 1: verificar flag dailyDelinquencyRerunCCSweep ===');
const flagRows = await q('config flag', `
  SELECT pk, key, value, row_updated_timestamp AS date_updated
  FROM uown_configuration_management
  WHERE key = $1
`, [FLAG_KEY]);

const flagValue = flagRows[0]?.value;
if (flagValue !== 'true') {
  console.warn(`\n⚠️  FLAG NÃO ESTÁ TRUE — valor atual: "${flagValue ?? 'AUSENTE'}"`);
  console.warn('   Sem a flag, o sweep só loga nota e não tenta re-charge.');
  console.warn('   Para habilitar: POST /ConfigurationManagement/createOrUpdateConfig { key, value: "true" }');
  console.warn('   Continuando mesmo assim para documentar o comportamento atual...\n');
} else {
  console.log(`\n✅ FLAG OK — valor: "${flagValue}" (pk=${flagRows[0].pk}, updated=${flagRows[0].date_updated})`);
}

// ── Step 2: verificar e re-seed account 221 ───────────────────────────────────

console.log('\n=== STEP 2: verificar e re-seed account 221 ===');

const txToday = await q('CC tx APPROVED SALE today (account 221)', `
  SELECT pk, status, cc_action, cc_transaction_type, posting_date, vendor
  FROM uown_sv_credit_card_transaction
  WHERE account_pk = $1
    AND status = 'APPROVED'
    AND cc_action = 'SALE'
    AND posting_date = CURRENT_DATE
  ORDER BY pk DESC LIMIT 5
`, [ACCOUNT]);

if (txToday.length === 0) {
  console.log('\n  Sem APPROVED SALE hoje para account 221 — inserindo seed (Exc 3 autorizado)...');
  await q('INSERT APPROVED SALE today', `
    INSERT INTO uown_sv_credit_card_transaction
      (account_pk, status, cc_action, cc_transaction_type, posting_date, amount, vendor, cc_type, cc_token)
    VALUES ($1, 'APPROVED', 'SALE', 'SCHEDULED', CURRENT_DATE, 50.00, 'CHANNEL_PAYMENTS_CC', 'MASTERCARD', $2)
  `, [ACCOUNT, CARD_TOKEN]);
} else {
  console.log(`\n  Seed já existe (${txToday.length} row(s)) — reutilizando.`);
}

await q('UPDATE delinquency -5d (account 221)', `
  UPDATE uown_sv_sched_summary
  SET delinquency_as_of_date = CURRENT_DATE - 5
  WHERE account_pk = $1
`, [ACCOUNT]);

// ── Step 3: validar SQL do sweep seleciona account 221 ────────────────────────

console.log('\n=== STEP 3: validar que o SQL do sweep seleciona account 221 ===');
const sweepDef = await q('sweep SQL definition', `
  SELECT scheduled_task_name, sql_to_pick_accounts
  FROM uown_scheduled_task
  WHERE scheduled_task_name = $1
`, [SWEEP_NAME]);

const selectionSql = sweepDef[0]?.sql_to_pick_accounts;
if (!selectionSql) {
  console.error('\n❌ Sweep não encontrado em uown_scheduled_task');
  await pool.end();
  process.exit(1);
}

console.log(`\n  SQL do sweep:\n  ${selectionSql.slice(0, 400)}...`);

let selectedBysweep = false;
try {
  const selected = await pool.query(selectionSql);
  selectedBysweep = selected.rows.some(r => Object.values(r).map(String).includes(String(ACCOUNT)));
  console.log(`\n  Sweep selection result: ${selected.rows.length} row(s)`);
  console.dir(selected.rows.slice(0, 10), { depth: null });
  console.log(`\n  Account ${ACCOUNT} está na seleção: ${selectedBysweep ? '✅ SIM' : '❌ NÃO'}`);
} catch (e) {
  console.error(`\n  ERR ao executar SQL do sweep: ${e.message}`);
}

// ── Step 4: baseline sweep_logs + CC transactions ────────────────────────────

console.log('\n=== STEP 4: baseline antes do trigger ===');
const baseLog = await q('sweep_logs MAX pk (baseline)', `
  SELECT COALESCE(MAX(pk), 0) AS max_pk
  FROM uown_sweep_logs
  WHERE sweep_name = $1
`, [SWEEP_NAME]);
const baseLogPk = baseLog[0]?.max_pk ?? 0;

const baseCcTx = await q('CC transactions MAX pk account 221 (baseline)', `
  SELECT COALESCE(MAX(pk), 0) AS max_pk
  FROM uown_sv_credit_card_transaction
  WHERE account_pk = $1
`, [ACCOUNT]);
const baseCcPk = baseCcTx[0]?.max_pk ?? 0;

// ── Step 5: trigger sweep ─────────────────────────────────────────────────────

console.log(`\n=== STEP 5: trigger ${SWEEP_NAME} via API ===`);
let triggerStatus = 0;
try {
  const resp = await fetch(`${API_BASE}/uown/svc/triggerScheduledTask/${SWEEP_NAME}`, {
    method: 'POST',
    headers: {
      Authorization: API_KEY,
      'Content-Type': 'application/json',
    },
  });
  triggerStatus = resp.status;
  const body = await resp.text().catch(() => '');
  console.log(`  HTTP ${triggerStatus} — body: ${body.slice(0, 200)}`);
  if (triggerStatus !== 200) {
    console.error(`  ❌ Trigger falhou com HTTP ${triggerStatus}`);
  }
} catch (e) {
  console.error(`  ERR no trigger HTTP: ${e.message}`);
}

// ── Step 6: aguardar novo sweep_log ──────────────────────────────────────────

console.log('\n=== STEP 6: aguardar novo sweep_log ===');
let newLog = null;
const maxWait = 30_000;
const start = Date.now();
while (Date.now() - start < maxWait) {
  await new Promise(r => setTimeout(r, 2_000));
  const r = await pool.query(`
    SELECT pk, sweep_name, number_of_records_processed AS processed, start_time,
           LEFT(COALESCE(error, ''), 200) AS error
    FROM uown_sweep_logs
    WHERE sweep_name = $1 AND pk > $2
    ORDER BY pk DESC LIMIT 1
  `, [SWEEP_NAME, baseLogPk]);
  if (r.rows.length > 0) {
    newLog = r.rows[0];
    break;
  }
}

if (newLog) {
  console.log(`  ✅ Novo sweep_log pk=${newLog.pk} processed=${newLog.processed} start=${newLog.start_time}`);
  if (newLog.error) console.log(`  error: ${newLog.error}`);
} else {
  console.error(`  ❌ Timeout — nenhum novo sweep_log após ${maxWait / 1000}s`);
}

// ── Step 7: checar nova CC transaction para account 221 ───────────────────────

console.log('\n=== STEP 7: nova CC transaction pós-sweep (indicador de re-charge) ===');
const newCcTx = await q(`CC tx account ${ACCOUNT} após trigger (pk > ${baseCcPk})`, `
  SELECT pk, status, cc_action, cc_transaction_type, posting_date, vendor, amount,
         LEFT(COALESCE(error, ''), 100) AS error
  FROM uown_sv_credit_card_transaction
  WHERE account_pk = $1 AND pk > $2
  ORDER BY pk DESC LIMIT 10
`, [ACCOUNT, baseCcPk]);

// ── Resumo ────────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log('RESUMO DA VALIDAÇÃO');
console.log('='.repeat(60));
console.log(`Sweep:       ${SWEEP_NAME}`);
console.log(`Account:     ${ACCOUNT}`);
console.log(`Flag TRUE:   ${flagValue === 'true' ? '✅' : '❌ ' + (flagValue ?? 'AUSENTE')}`);
console.log(`Selecionado: ${selectedBysweep ? '✅' : '❌'}`);
console.log(`Trigger:     HTTP ${triggerStatus}`);
console.log(`Sweep log:   ${newLog ? `✅ pk=${newLog.pk} processed=${newLog.processed}` : '❌ timeout'}`);
console.log(`Nova CC tx:  ${newCcTx.length > 0 ? `✅ ${newCcTx.length} row(s) — re-charge tentado!` : '0 rows — sweep não criou nova CC tx (gateway ausente ou flag ainda false)'}`);
if (newLog?.processed > 0) {
  console.log(`\n✅ CONCLUSÃO: processed=${newLog.processed} — sweep executou com re-charge.`);
} else if (newCcTx.length > 0) {
  console.log('\n✅ CONCLUSÃO: nova CC tx criada — re-charge foi tentado mesmo com processed=0.');
} else {
  console.log('\n⚠️  CONCLUSÃO: processed=0 e sem nova CC tx.');
  console.log('   Possível que: (a) flag ainda não propagada no Hazelcast, (b) gateway ausente impede inserção, ou (c) flag ainda false no binário.');
  console.log('   Checar uown_los_lead_notes / sweep_logs.error para discriminar.');
}

await pool.end();
