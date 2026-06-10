/**
 * Links the 16-month program `KWC-2` (program_pk=213) to merchant
 * "Progress Mobility Acquisition LLC" (merchant_pk=2812, ref_code
 * `OL90294-0001_2812`) in qa1. Calls
 * `POST /uown/addProgramsToMerchant?merchantPk=2812&programPks=213&removeOld=false`.
 *
 * Why: svc#531 AC5 (cross-brand UOWN + Kornerstone) was originally covered
 * via inference, because random SSN on Daniel's Jewelers (UOWN, merchant_pk=6108)
 * caps BlackBox approval at $1,820 in qa1 (eligibleTerms=13). Progress Mobility
 * (UOWN brand) does NOT have that BlackBox cap (historical leads show
 * approvals of $6,500-$7,580 with random SSN). Linking a 16m program to
 * Progress Mobility opens a path for STRICT UOWN-brand 16m validation in qa1.
 *
 * Caveat: this mutates a shared merchant configuration in qa1. Restore is
 * not trivially scriptable (there is no `removeProgramFromMerchant` endpoint
 * in the current API; reversal requires deactivating the link row via DB or
 * dev support). Only run when explicitly authorized.
 */
import { request } from 'playwright';
import { ConfigEnvironment } from '../config/environment.js';
import { MerchantClient } from '../api/clients/merchant.client.js';

async function main() {
  const env = new ConfigEnvironment('qa1');
  const ctx = await request.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });
  const client = new MerchantClient(ctx, env);

  const MERCHANT_PK = 2812; // Progress Mobility Acquisition LLC (UOWN, BlackBox tier high)
  const PROGRAM_PK_KWC2 = 213; // 16-month, covers all states including CA, no cart-amount cap

  console.log(`Linking program ${PROGRAM_PK_KWC2} to merchant ${MERCHANT_PK}...`);
  const resp = await client.addProgramsToMerchant(MERCHANT_PK, [PROGRAM_PK_KWC2], false);
  console.log('  status:', resp.status);
  console.log('  body:', JSON.stringify(resp.body).slice(0, 400));

  // Verify
  const list = await client.getMerchantProgramsByMerchantPk(MERCHANT_PK);
  const has16m = (list.body ?? []).some(
    (w) => w.programInfo?.programPk === PROGRAM_PK_KWC2 && w.programInfo?.termMonths === 16,
  );
  console.log(`\nMerchant 2812 now has program 213 (KWC-2 16m)? ${has16m}`);

  await ctx.dispose();
}

main().catch((err) => { console.error(err); process.exit(1); });
