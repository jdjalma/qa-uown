import fs from 'node:fs'; import pg from 'pg';
const env={}; for(const l of fs.readFileSync(new URL('../../.env',import.meta.url),'utf8').split('\n')){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m)env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const SVC = env.DEV3_SVC_API_URL || env.SVC_API_URL || 'https://svc-dev3.uownleasing.com';
const KEY = 'com.uownleasing.svc.service.sweeps.paymentSweeps.DelinquencyRerunCCPaymentsSweepService.run.cc.transaction.for.delinquency.dailyDelinquencyRerunCCSweep';
const headers = { 'Content-Type':'application/json' };
if (env.UOWN_API_AUTHORIZATION) headers['Authorization'] = env.UOWN_API_AUTHORIZATION;
const key = env.UOWN_SVC_API_KEY || env.UOWN_API_KEY;
if (key) for (const h of ['x-api-key','X-API-KEY','api-key','Api-Key']) headers[h] = key;

// DB connection for before/after verification
const u=new URL(env.UOWN_DB_URL_DEV3.replace(/^jdbc:/,'')); u.username=env.UOWN_DB_USER_DEV3; u.password=env.UOWN_DB_PASS_DEV3||'';
const pool=new pg.Pool({connectionString:u.toString(),max:1});
const dbVal = async () => (await pool.query('SELECT key, value FROM uown_configuration_management WHERE key=$1',[KEY])).rows;

console.log('SVC =', SVC);
console.log('\n[1] valor ANTES no DB:', JSON.stringify(await dbVal()));

console.log('\n[2] POST /ConfigurationManagement/createOrUpdateConfig ...');
const resp = await fetch(`${SVC}/ConfigurationManagement/createOrUpdateConfig`, {
  method:'POST', headers, body: JSON.stringify({ key: KEY, value: 'true' }),
});
const txt = await resp.text();
console.log('   status =', resp.status, resp.statusText);
console.log('   body   =', txt.slice(0,400));

console.log('\n[3] GET /ConfigurationManagement/forceReloadConfig (evict cache) ...');
const rel = await fetch(`${SVC}/ConfigurationManagement/forceReloadConfig`, { method:'GET', headers });
console.log('   status =', rel.status, rel.statusText);

console.log('\n[4] valor DEPOIS no DB:', JSON.stringify(await dbVal()));
await pool.end();
