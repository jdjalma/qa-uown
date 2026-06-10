import pg from 'pg';

const { Pool } = pg;

const connectionString = 'postgresql://svc_user:F1nTech@34.121.232.252:5432/svc';

const pool = new Pool({ connectionString, max: 1 });

(async () => {
  try {
    const result = await pool.query(
      `SELECT pk as account_pk, lead_pk, account_status 
       FROM uown_sv_account 
       WHERE account_status = 'ACTIVE' 
       ORDER BY pk DESC 
       LIMIT 5`
    );
    
    console.log('Active accounts found in STG:');
    result.rows.forEach(row => {
      console.log(`  accountPk: ${row.account_pk}, leadPk: ${row.lead_pk}`);
    });
    
    if (result.rows.length > 0) {
      const first = result.rows[0];
      console.log(`\nRecommended entry:`);
      console.log(`  accountPk: '${first.account_pk}'`);
      console.log(`  leadPk: '${first.lead_pk}'`);
    } else {
      console.log('No active accounts found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
