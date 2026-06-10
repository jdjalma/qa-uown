import pg from 'pg';

(async () => {
  const c = new pg.Client({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1nTech', database: 'svc' });
  try {
    await c.connect();
    const r = await c.query('SELECT 1 AS ok, now() AS now');
    console.log('OK:', r.rows[0]);
  } catch (e) {
    console.error('ERR:', (e as Error).message);
  } finally {
    await c.end().catch(() => {});
  }
})();
