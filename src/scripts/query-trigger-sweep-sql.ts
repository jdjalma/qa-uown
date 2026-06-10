import pg from 'pg';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5446, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

const names = [
  'getStatusDatePaymentsListSweep', 'rerunACHPaymentsSweep', 'updateTaxRatesSweep',
  'checkSignedAndFundingLeaseCountSweep', 'chargeSigningFeeSweep',
  'refreshTrustPilotAccessKeySweep', 'redistributeDelinquentEpoPoolSweep',
  'dailyTaxCloudPaymentsSync', 'dailyTaxCloudRefundsSync',
  'ProgramActivationDeactivationSweep', 'refreshKountAccessTokenSweep', 'refreshGdsAccessTokenSweep',
  'dailyFundingReportSweep', 'weeklyFundingReportSweep', 'monthlyFundingReportSweep',
  'monthlyTaxReportSweep', 'danielJewelersLeadReportSweep', 'monthlyConsolidatedFundingReportSweep',
  'sendDailyPaymentsSharepointSweep', 'generateMerchantLeaseReport', 'generateExportBlacklistReport',
  'generateDueDateMovesReport', 'rerunACHWeeklyReport', 'pastDueEpoPoolAmountReportSweep',
];

async function main() {
  const r = await pool.query(
    'SELECT pk, template_name, sql_to_pick_accounts FROM uown_scheduled_task WHERE template_name = ANY($1) ORDER BY template_name',
    [names],
  );
  for (const row of r.rows) {
    console.log('\n===', row.pk, row.template_name, '===');
    console.log(row.sql_to_pick_accounts ?? '(no SQL)');
  }
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
