# BDD Scenarios Index

> **Oracle index** — maps named operations to their BDD files.
> Used by rule #19 in CLAUDE.md: after performing any listed operation, read the
> corresponding file's `### Oracle` sections and validate every checkpoint.

| Operation | Trigger keywords | BDD file | Last reviewed |
|---|---|---|---|
| login | login, authenticate, log in, sign in, fazer login, enter credentials, access portal, open origination, open servicing, open ams, navigate to dashboard, open website portal | [login.md](login.md) | 2026-06-26 |
| new-application | new application, create application, nova aplicação, criar aplicação, new app form, origination form, send application, submit application, customer application form, invite link, application link, fill application, preencher aplicação, customer submits application | [new-application.md](new-application.md) | 2026-06-28 |
| send-application | sendApplication, createPreQualifiedApplication, create lead via api, seed lead, precondition lead, pre-qualified application, criar lead via api, precondição de lead, POST /uown/los/sendApplication | [send-application.md](send-application.md) | 2026-06-28 |
| cc-ach | cc/ach, cc ach, credit card page, ach page, payment info, payment page, contract url, contract page, redirectUrl, checkout page, submitApplication, submit application, fill cc, fill ach, preencher cartão, preencher pagamento, página de pagamento, getMissingFields | [cc-ach.md](cc-ach.md) | 2026-06-28 |
| servicing-ach-payment | ach payment servicing, make payment, make ach payment, pagamento ach, pagamento ach servicing, fazer pagamento, pay by ach, one-off ach, single ach payment, makeAchPayment, createOrUpdateACHPayment, makePayment modal, circle-dollar, pay active account, débito ach, post ach payment, servicing payment | [servicing-ach-payment.md](servicing-ach-payment.md) | 2026-06-28 |
| servicing-cc-payment | cc payment servicing, make payment cc, pagamento cc servicing, make payment modal cc, credit card payment servicing, circle-dollar cc, makeCreditCardPayment, pagamento cartão servicing, POST makeCreditCardPayment, charge convenience fee, charge fee, convenince fee, pagar com cartão de crédito servicing | [servicing-cc-payment.md](servicing-cc-payment.md) | 2026-06-28 |
| prorated-amount | prorated amount, calculator, prorated, prorate, getProrateAmount, AS OF, payoff amount calculator, calculadora proporcional | [prorated-amount.md](prorated-amount.md) | 2026-06-28 |
| protection-plan | protection plan, protection plus, plano de proteção, buddy, uown protection plus, AON_PURCHASEPROTECTION, offer protection plan, offerInsurance, see protection benefits, opt-in protection, opt-out protection, aderir plano, already enrolled, acceptAndProceedWithProtectionPlan, completeProtectionPlan, enrollAccountInProtectionPlan, getPlanEligibilityForAccount | [protection-plan.md](protection-plan.md) | 2026-06-28 |
| terms-of-agreement | terms of agreement, termos do contrato, toa page, sign contract button, revisão do contrato, SIGN CONTRACT, isInfoConfirmed, isEverythingAgreed, see protection benefits, buddy overlay, contract review, resumo do contrato, itens do lease, checkboxes de consentimento | [terms-of-agreement.md](terms-of-agreement.md) | 2026-06-28 |
| gowsign-signing | gowsign, assinar contrato, sign contract, signing page, gow sign, proceed to signature, sign lease, contrato gowsign, assinatura gowsign, alternative contract modal, gowsign iframe, sign all, cerimônia de assinatura, startSignatureButton | [gowsign-signing.md](gowsign-signing.md) | 2026-06-28 |
| signwell-signing | signwell, contrato signwell, assinatura signwell, sign well, SignWell-Embedded-Iframe, completeSignwellFlow, esign default, esign fallback, signwell iframe, inline signing, click to start, save & apply everywhere, esign_client SIGNWELL, provider routing signwell | [signwell-signing.md](signwell-signing.md) | 2026-06-28 |
| funding | funding, settle, settleApplication, settle application, signed to funding, signed → funding, ready to fund, READY_TO_FUND, settlement, fund the lease, tornar signed em funding, mover para funding, updateFundingStatus, fundRequestDateTime, isSignedToFunding, is_signed_to_funding, auto-move funding, FULL_FUNDING, amountToBeFunded, getApplicationStatus FUNDING | [funding.md](funding.md) | 2026-06-28 |
| funded | funded, fund lead, mark as funded, FUNDING to FUNDED, send to funded, funding queue, fila de financiamento, marcar como fundado, tornar funded, aplicação funded, funding → funded, fundFirstEntry, Send to FUNDED, FUNDED transition | [funded.md](funded.md) | 2026-06-28 |
| modify-lease | modify lease, modificar lease, modify invoice, modificar fatura, Modify Lease button, sendInvoice orderType 1, invoice increase, invoice reduce, reduce value, increase value, LEASE_MOD, CONTRACT_CREATED via modify, modifyLease, deleteAllInvoiceItems, modify at FUNDING, invoice modification, modificação de invoice | [modify-lease.md](modify-lease.md) | 2026-06-28 |
| commit | git commit, commit files, stage and commit, criar commit, fazer commit, commit message, git add + commit | [commit.md](commit.md) | 2026-06-27 |
| push | git push, push to remote, push branch, enviar para o remote, push origin, fazer push | [push.md](push.md) | 2026-06-27 |

---

## Protocol: operation not listed here

If a portal state-changing operation has no entry in this table, the rule is the SAME for every context — ad-hoc request (user or orchestrator) OR QA pipeline (qa-planner / qa-implementer). There is no "proceed and warn" path: **nothing reaches a validated state without an oracle.**

1. **STOP** — do not perform the operation yet.
2. **Author the BDD** via the `test-scenarios` skill. Ground the checkpoints in the canonical business rules; if the expected behavior is unknown, run a `discovery` pass first (UI → API → DB, rule #18).
3. **Register** it: create `.claude/oracles/<operation>.md` (frontmatter `last-reviewed` + `covers`) and add a row to the table above.
4. **THEN perform** the operation and validate every checkpoint → report `Oracle: CT-XX — PASS/FAIL`.

> The `[UNVALIDATED — no BDD oracle registered]` tag is **retired** (decision 2026-06-27). An unlisted operation is never a reason to proceed unvalidated; it is the trigger to create the missing oracle first. This unifies the old ad-hoc and QA-pipeline branches into one rule.

## Protocol: staleness check (run before every oracle)

Before executing any oracle, run the SHA-range form, reading `last-reviewed-sha` from the BDD frontmatter:

```bash
git log <last-reviewed-sha>..HEAD -- <each file in covers>
```

- **No output** → no covered file changed since the reviewed commit. BDD is current. Proceed.
- **Output (commits exist)** → a covered file changed after the review point → prepend `[BDD MAY BE STALE — <file> changed since <last-reviewed-sha>]` to the oracle report. Still run the oracle, but flag all PASS results as unconfirmed until the BDD is re-reviewed.

> **SHA range, not `--after=<date>`:** a date boundary has day granularity and depends on the committer
> timezone, so a same-day commit may or may not be caught. `<sha>..HEAD` is exact — it lists precisely the
> commits that touched a covered file between the review point and now. When re-reviewing, bump BOTH
> `last-reviewed` (human-readable date) and `last-reviewed-sha` (the HEAD at review time) in the frontmatter.

## Protocol: oracle checkpoint fails

When any checkpoint in the oracle table returns FAIL:

1. **Inspect the real DOM** (via MCP Playwright snapshot) to confirm the behavior is what the portal actually shows.
2. **Check git log** for the `covers` files — was this file changed intentionally since `last-reviewed-sha`?
   - Yes, intentional change → BDD is stale. Update the BDD and bump `last-reviewed` + `last-reviewed-sha` before reporting.
   - No change or unintentional → report as `[BUG]` following the bug-classification rules.
3. Never report a FAIL as a confirmed bug without ruling out BDD staleness first.

## Adding a new BDD file

1. Create `.claude/oracles/<operation>.md` with frontmatter `last-reviewed` + `last-reviewed-sha` (HEAD at creation) + `covers`.
2. Add a row to this table.
3. The operation is now covered by rule #19 for all agents.
