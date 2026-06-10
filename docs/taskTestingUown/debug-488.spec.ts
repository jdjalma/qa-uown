import { test, expect } from '@fixtures/test-context.fixture.js';

test('debug: find any leads with multiple eligible_terms', async ({ db }) => {
  // Find ANY leads that have multiple eligible_terms (e.g., "13,16")
  const multiTerms = await db.query(
    `SELECT u.pk, u.lead_pk, u.eligible_terms, u.uw_status,
            m.client_type, m.merchant_name
     FROM uown_los_uwdata u
     JOIN uown_los_lead l ON l.pk = u.lead_pk
     JOIN uown_merchant m ON m.pk = l.merchant_pk
     WHERE u.eligible_terms LIKE '%,%'
     ORDER BY u.pk DESC
     LIMIT 10`,
    []
  );
  console.log('[DEBUG] Leads with multiple eligible_terms:', JSON.stringify(multiTerms, null, 2));

  // Count eligible_terms distribution
  const distribution = await db.query(
    `SELECT eligible_terms, COUNT(*) as cnt
     FROM uown_los_uwdata
     WHERE eligible_terms IS NOT NULL
     GROUP BY eligible_terms
     ORDER BY cnt DESC
     LIMIT 20`,
    []
  );
  console.log('[DEBUG] eligible_terms distribution:', JSON.stringify(distribution, null, 2));
});
