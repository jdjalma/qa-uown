/**
 * RU03.26.1.50.0_addMerchantFieldOnSearchFilter_501
 *
 * Task #501: Add Merchant field on Search Filter — Servicing
 * Validates the new MERCHANT and LOCATION filter fields on the Servicing main search page.
 *
 * Scope (from task #501 testing steps):
 *   CT-01: MERCHANT and LOCATION fields visible in the filter panel
 *   CT-02: Search by valid merchant → results returned
 *   CT-03: Search by valid location → results returned + merchant auto-filled
 *   CT-04: Combined filters: Merchant selected → search returns results
 *   CT-05: Selecting merchant filters available locations (cross-select UX)
 *   CT-06: API — POST /uown/svc/getAccountsByCriteria with merchantName → status 200 + results
 *   CT-07: API — invalid merchantName → status 200 + empty searchResults
 *   CT-08: Clearing merchant also clears location (cross-select reverse)
 *
 * Backend changes (MR !1318):
 *   - AccountSearchFilter: new fields merchantName, location
 *   - getAccountsByCriteria.sql: LEFT JOINs → uown_los_lead + uown_merchant
 *   - Filter: LOWER(merchant.merchant_name) = LOWER(:merchantName) — exact case-insensitive
 *
 * Frontend changes (MR !672):
 *   - 2 new React Select dropdowns in FilterTable: name='merchantName', name='location'
 *   - Cross-select: merchant → filters locations; location → auto-sets merchant
 *
 * Test data strategy:
 *   GDS bypass: no application created → runId/email not needed.
 *   Merchant resolved dynamically from dropdown (first available option).
 *
 * Project: task-testing (storageState: .auth/servicing.json)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ServicingSearchPage } from '@pages/index.js';
import { TestTag, buildTags } from '@ptypes/enums.js';

const TEST_NAME = 'RU03.26.1.50.0_addMerchantFieldOnSearchFilter_501';
const SCREENSHOTS_DIR = `reports/screenshots/${TEST_NAME}`;

const testData = [
  {
    env: 'qa1',
    // GDS bypass: filter test — no application created → runId/email not needed
    tag: buildTags(TestTag.REGRESSION, TestTag.QA1),
  },
  {
    env: 'stg',
    // GDS bypass: filter test — no application created → runId/email not needed
    tag: buildTags(TestTag.REGRESSION, TestTag.STG),
  },
];

for (const td of testData) {
  test.describe(
    `${TEST_NAME} — ${td.env}`,
    { tag: td.tag.split(' ') },
    () => {
      test.use({
        storageState: '.auth/servicing.json',
      });

      test.describe.configure({ mode: 'serial' });

      /** Resolved dynamically in CT-02; reused across remaining CTs. */
      let resolvedMerchantName = '';
      let resolvedLocationName = '';

      // ── CT-01 ─────────────────────────────────────────────────────────────

      test('CT-01: MERCHANT e LOCATION visíveis no painel de filtros', async ({ page, ctx, testEnv }) => {
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);

        await test.step('Navegar para a página de busca do Servicing', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
        });

        await test.step('Expandir painel de filtros', async () => {
          await searchPage.expandFilters();
        });

        await test.step('Verificar campo MERCHANT visível', async () => {
          const merchantVisible = await searchPage.isMerchantFieldVisible();
          expect(merchantVisible, 'Campo MERCHANT deve ser visível no painel de filtros').toBe(true);
        });

        await test.step('Verificar campo LOCATION visível', async () => {
          const locationVisible = await searchPage.isLocationFieldVisible();
          expect(locationVisible, 'Campo LOCATION deve ser visível no painel de filtros').toBe(true);
        });

        await test.step('Capturar screenshot dos campos visíveis', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-01-fields-visible.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('CT-01: Filter fields visible', {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-02 ─────────────────────────────────────────────────────────────

      test('CT-02: Busca por merchant válido retorna resultados', async ({ page, ctx, testEnv, api }) => {
        test.setTimeout(300_000); // Discovery loop may take longer in envs with many merchants (stg: 6849+)
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);

        await test.step('Navegar para a página de busca', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
          await searchPage.expandFilters();
        });

        await test.step('Obter lista de merchants e descobrir primeiro com resultados na UI (sem filtro de data)', async () => {
          const options = await searchPage.getMerchantOptions();
          expect(options.length, 'Deve haver ao menos 1 merchant no dropdown').toBeGreaterThan(0);
          // Skip numeric-only entries like "0" (test/placeholder merchants with no linked accounts).
          const named = options.filter(o => !/^\d+$/.test(o));
          const candidates = named.length > 0 ? named : options;
          console.log(`[CT-02][${td.env}] ${options.length} merchants no dropdown. Buscando o 1º com contas...`);

          // Pre-screen via PARALLEL API calls (fast — avoids sequential timeout in envs with many merchants).
          // Root cause: The Servicing search page defaults date range to TODAY.
          // Searching merchant + today's date → 0 results for merchants without activity today.
          // Fix: clear date filters before submitting so the merchant filter works on all accounts.
          const topCandidates = candidates.slice(0, 15);
          const apiChecks = await Promise.all(
            topCandidates.map(m => api.account.getAccountsByCriteria({ merchantName: m, pageNumber: '0', maxResults: '1' })),
          );
          const apiCandidates = topCandidates.filter((_, i) => (apiChecks[i].body?.searchResults?.length ?? 0) > 0);

          expect(apiCandidates.length, 'Deve encontrar ao menos 1 merchant com contas via API').toBeGreaterThan(0);
          console.log(`[CT-02][${td.env}] API candidates (${apiCandidates.length}): ${apiCandidates.slice(0, 5).join(', ')}...`);

          for (const merchant of apiCandidates) {
            // Clear date filters so search runs on all accounts (not just today's).
            await searchPage.clearDateFilters();
            await searchPage.selectMerchant(merchant);
            await searchPage.submitFilters();

            const rowCount = await searchPage.getVisibleRowCount();
            console.log(`[CT-02][${td.env}] Merchant "${merchant}": ${rowCount} rows in UI (no date filter)`);

            if (rowCount > 0) {
              resolvedMerchantName = merchant;
              break;
            }
            // UI returned 0 — navigate fresh and try the next candidate
            await searchPage.navigateToSearch(testEnv.servicingUrl);
            await searchPage.expandFilters();
          }

          expect(resolvedMerchantName, 'Deve encontrar ao menos 1 merchant com contas visíveis na UI').not.toBe('');
          console.log(`[CT-02][${td.env}] Merchant resolvido: "${resolvedMerchantName}"`);
        });

        await test.step('Verificar que resultados foram retornados', async () => {
          const rowCount = await searchPage.getVisibleRowCount();
          expect(rowCount, `Deve haver resultados para merchant "${resolvedMerchantName}"`).toBeGreaterThan(0);
          console.log(`[CT-02][${td.env}] Rows returned: ${rowCount}`);
        });

        await test.step('Capturar screenshot com resultados', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-02-merchant-results.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('CT-02: Merchant filter results', {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-03 ─────────────────────────────────────────────────────────────

      test('CT-03: Busca por location válida — merchant auto-preenchido', async ({ page, ctx, testEnv, api }) => {
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);

        await test.step('Navegar para a página de busca', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
          await searchPage.expandFilters();
        });

        await test.step('Obter locations disponíveis e descobrir primeira com contas', async () => {
          const locationOptions = await searchPage.getLocationOptions();
          expect(locationOptions.length, 'Deve haver ao menos 1 location disponível').toBeGreaterThan(0);
          // Skip numeric-only entries like "0"
          const named = locationOptions.filter(o => !/^\d+$/.test(o));
          const candidates = named.length > 0 ? named : locationOptions;
          console.log(`[CT-03][${td.env}] ${locationOptions.length} locations disponíveis. Buscando 1ª com contas...`);

          for (const loc of candidates.slice(0, 20)) {
            const resp = await api.account.getAccountsByCriteria({
              location: loc, pageNumber: '0', maxResults: '1',
            });
            if ((resp.body?.searchResults?.length ?? 0) > 0) {
              resolvedLocationName = loc;
              break;
            }
          }
          if (!resolvedLocationName) {
            // Fallback: use first non-numeric location even if API finds 0 (data may differ by env)
            resolvedLocationName = candidates[0];
          }
          console.log(`[CT-03][${td.env}] Location selecionada: "${resolvedLocationName}"`);
        });

        await test.step(`Selecionar location`, async () => {
          await searchPage.selectLocation(resolvedLocationName);
        });

        await test.step('Verificar que merchant foi auto-preenchido (cross-select)', async () => {
          const selectedMerchant = await searchPage.getSelectedMerchant();
          expect(
            selectedMerchant.trim().length,
            'Ao selecionar location, o campo Merchant deve ser auto-preenchido',
          ).toBeGreaterThan(0);
          console.log(`[CT-03][${td.env}] Merchant auto-preenchido: "${selectedMerchant}"`);
        });

        await test.step('Executar busca (sem filtro de data) e verificar resultados', async () => {
          // Clear date filters so the location filter works on all accounts, not just today's.
          await searchPage.clearDateFilters();
          await searchPage.submitFilters();
          const rowCount = await searchPage.getVisibleRowCount();
          expect(rowCount, `Deve haver resultados para location "${resolvedLocationName}"`).toBeGreaterThan(0);
        });

        await test.step('Capturar screenshot', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-03-location-auto-merchant.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('CT-03: Location → auto-merchant + results', {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-04 ─────────────────────────────────────────────────────────────

      test('CT-04: Filtros combinados — Merchant integrado com busca existente', async ({ page, ctx, testEnv }) => {
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);
        const merchantToUse = resolvedMerchantName || 'Tire Agent';

        await test.step('Navegar e expandir filtros', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
          await searchPage.expandFilters();
        });

        await test.step(`Selecionar merchant "${merchantToUse}" e executar busca (sem filtro de data)`, async () => {
          // Clear date filters so the combined merchant filter works on all accounts.
          await searchPage.clearDateFilters();
          await searchPage.selectMerchant(merchantToUse);
          await searchPage.submitFilters();
        });

        await test.step('Verificar que filtros combinados retornam resultados', async () => {
          const rowCount = await searchPage.getVisibleRowCount();
          expect(rowCount, 'Filtros combinados devem retornar resultados').toBeGreaterThan(0);
        });

        await test.step('Capturar screenshot dos filtros combinados', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-04-combined-filters.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('CT-04: Combined filters result', {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-05 ─────────────────────────────────────────────────────────────

      test('CT-05: Selecionar merchant filtra as locations disponíveis', async ({ page, ctx, testEnv }) => {
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);
        const merchantToUse = resolvedMerchantName || 'Tire Agent';

        let allLocationsCount = 0;
        let filteredLocationsCount = 0;

        await test.step('Navegar e expandir filtros', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
          await searchPage.expandFilters();
        });

        await test.step('Contar locations ANTES de selecionar merchant', async () => {
          const allLocations = await searchPage.getLocationOptions();
          allLocationsCount = allLocations.length;
          expect(allLocationsCount, 'Deve haver locations sem merchant selecionado').toBeGreaterThan(0);
          console.log(`[CT-05][${td.env}] Locations (all): ${allLocationsCount}`);
        });

        await test.step(`Selecionar merchant "${merchantToUse}"`, async () => {
          await searchPage.selectMerchant(merchantToUse);
          // Brief wait for React state update — location options reload from API
          await page.waitForTimeout(1_500);
        });

        await test.step('Contar locations APÓS selecionar merchant', async () => {
          const filteredLocations = await searchPage.getLocationOptions();
          filteredLocationsCount = filteredLocations.length;
          console.log(`[CT-05][${td.env}] Locations (filtered): ${filteredLocationsCount}`);
          expect(filteredLocationsCount, 'Deve haver ao menos 1 location para o merchant').toBeGreaterThan(0);
          expect(
            filteredLocationsCount,
            'Locations filtradas devem ser ≤ total de locations',
          ).toBeLessThanOrEqual(allLocationsCount);
        });

        await test.step('Capturar screenshot das locations filtradas', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-05-filtered-locations.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach(`CT-05: Locations filtered (${filteredLocationsCount}/${allLocationsCount})`, {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-06 ─────────────────────────────────────────────────────────────

      test('CT-06: API — merchantName filtra accounts (status 200 + resultados)', async ({ api, ctx }) => {
        ctx.env = td.env;
        const merchantToUse = resolvedMerchantName || 'Tire Agent';

        let searchResults: Array<{ accountPk?: number; accountStatus?: string }> = [];

        await test.step(`POST /uown/svc/getAccountsByCriteria com merchantName="${merchantToUse}"`, async () => {
          const response = await api.account.getAccountsByCriteria({
            merchantName: merchantToUse,
            pageNumber: '0',
            maxResults: '10',
          });
          expect(response.status, 'API deve retornar 200').toBe(200);
          expect(response.body?.searchResults, 'searchResults deve ser array').toBeDefined();
          searchResults = response.body?.searchResults ?? [];
        });

        await test.step('Verificar que há resultados para o merchant', async () => {
          expect(searchResults.length, `Deve haver accounts para merchant "${merchantToUse}"`).toBeGreaterThan(0);
          console.log(`[CT-06][${td.env}] API results: ${searchResults.length}`);
        });

        await test.step('Verificar estrutura do resultado', async () => {
          const first = searchResults[0];
          expect(first.accountPk, 'accountPk deve estar presente no resultado').toBeDefined();
          expect(first.accountStatus, 'accountStatus deve estar presente no resultado').toBeDefined();
        });
      });

      // ── CT-07 ─────────────────────────────────────────────────────────────

      test('CT-07: API — merchantName inválido retorna searchResults vazio', async ({ api, ctx }) => {
        ctx.env = td.env;
        const invalidMerchant = 'MerchantQueNaoExisteNaBase_XYZ_501';

        await test.step('POST com merchantName inexistente', async () => {
          const response = await api.account.getAccountsByCriteria({
            merchantName: invalidMerchant,
            pageNumber: '0',
            maxResults: '10',
          });
          expect(response.status, 'Status deve ser 200 mesmo para merchant inexistente').toBe(200);
          const results = response.body?.searchResults ?? [];
          expect(results.length, 'searchResults deve ser vazio para merchant inexistente').toBe(0);
          console.log(`[CT-07][${td.env}] count=${response.body?.count} moreResults=${response.body?.moreResults}`);
        });
      });

      // ── CT-08 ─────────────────────────────────────────────────────────────

      test('CT-08: Limpar merchant limpa location automaticamente', async ({ page, ctx, testEnv }) => {
        ctx.env = td.env;
        const searchPage = new ServicingSearchPage(page);
        const merchantToUse = resolvedMerchantName || 'Tire Agent';

        await test.step('Navegar e expandir filtros', async () => {
          await searchPage.navigateToSearch(testEnv.servicingUrl);
          await searchPage.expandFilters();
        });

        await test.step(`Selecionar merchant "${merchantToUse}"`, async () => {
          await searchPage.selectMerchant(merchantToUse);
          await page.waitForTimeout(1_000);
        });

        await test.step('Selecionar uma location do merchant', async () => {
          const locations = await searchPage.getLocationOptions();
          if (locations.length > 0) {
            await searchPage.selectLocation(locations[0]);
            console.log(`[CT-08][${td.env}] Location selecionada: "${locations[0]}"`);
          }
        });

        await test.step('Limpar campo merchant (clear)', async () => {
          await searchPage.clearMerchant();
        });

        await test.step('Verificar que location foi limpa automaticamente', async () => {
          await page.waitForTimeout(500);
          const selectedLocation = await searchPage.getSelectedLocation();
          expect(
            selectedLocation.trim(),
            'Limpar merchant deve limpar location automaticamente',
          ).toBe('');
        });

        await test.step('Capturar screenshot', async () => {
          const screenshotPath = `${SCREENSHOTS_DIR}/${td.env}-CT-08-clear-cross-select.png`;
          await page.screenshot({ path: screenshotPath });
          await test.info().attach('CT-08: Clear merchant → location cleared', {
            path: screenshotPath,
            contentType: 'image/png',
          });
        });
      });
    },
  );
}
