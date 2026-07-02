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
| origination-edit-primary-applicant | edit primary applicant, alterar dados do applicant, primary applicant edit, editar applicant, editar dados do primary applicant, pencil primary applicant, createOrUpdatePrimaryCustomerInfo origination, PrimaryApplicant-edit | [origination-edit-primary-applicant.md](origination-edit-primary-applicant.md) | 2026-06-29 |
| origination-edit-primary-contact | edit primary contact, edit address, alterar endereço, alterar endereco, editar endereço, change address, change lead address, edit email, edit phone, edit mobile phone, editar telefone, editar email, pencil primary contact, createOrUpdatePrimaryCustomerContactInfo, PrimaryContact-edit, edit communication preference | [origination-edit-primary-contact.md](origination-edit-primary-contact.md) | 2026-06-30 |
| il-16m-gowsign-template | IL gowsign, illinois gowsign, IL_2025_SAC_16_MONTHS, IL_2025_SAC, illinois lease template, il 16 month template, illinois 16m contract, add IL gowsign template, illinois promotional-payoff, illinois EPO appendix, IL template content, work item 576, illinois rental-purchase agreement | [il-16m-gowsign-template.md](il-16m-gowsign-template.md) | 2026-06-30 |
| sticky-reverse-refund | reverse sticky, reverse payment sticky, sticky reverse, reverse for sticky transactions, servicing#519, work item 519, add reverse for sticky, sticky reversal, reverse vs fully refund sticky, ledger-only reversal sticky, reverse payment option sticky transactions | [sticky-reverse-refund.md](sticky-reverse-refund.md) | 2026-06-30 |
| origination-modification-report | modification report, /modificationReport, modReport, mod report, relatório de modificações, getModifiedLeads, uown_lead_modifications, agent attribution, agent name, lead status change report, LEAD_STATUS_CHANGE, APPROVAL_AMOUNT_CHANGE, filter modifications by date, buscar modificações, search modification report, modification report date range, audit log leads | [origination-modification-report.md](origination-modification-report.md) | 2026-07-01 |
| origination-merchant-mod-history | merchant modification history, /merchantModificationHistory, MMH, merchant mod history, getMerchantDataChangeResults, merchant data change results, merchant audit log, merchant activity log history, search by merchant and date, buscar merchant e data, filtrar histórico de merchant, merchant modification search, merchant ref code filter, log type filter, getLogTypes | [origination-merchant-mod-history.md](origination-merchant-mod-history.md) | 2026-07-01 |
| origination-customer-uuid | customer uuid, customer identifier, unique customer identifier, customer_uuid, persistent customer id, cross-application customer id, same customer identifier, reuse customer identifier, identificador único de cliente, identificador de cliente, reusar uuid do cliente, customer_identity table, SSN to UUID mapping, hubspot external id, hubspot customer id, work item 1340, origination#1340, RU07.26.1.54.0 customer id | [origination-customer-uuid.md](origination-customer-uuid.md) | 2026-07-01 |
| origination-esign-postmessage-resend | postmessage, post message, uown_success, resend loop, reenvio postmessage, retry postmessage, retry post message thrice, esign redirect, esign handoff, handoff pós-assinatura, completion handoff, preparing completion handoff, scheduleEsignRedirect, useEsignCompletionRedirect, dispatchUownSuccessPostMessage, postMessage=true, navigating to redirect URL, no postMessage, completeApplication postmessage, completeEsign postmessage, appComplete relay, signingFailure redirect, partner iframe handoff, embedded signing redirect, PayTomorrow handoff, TireAgent handoff, Kornerstone handoff, work item 1341, origination#1341, MR 1498, RU07.26.1.54.1 | [origination-esign-postmessage-resend.md](origination-esign-postmessage-resend.md) | 2026-07-01 |
| website-payment-frequency | payment frequency, /payment-frequency, change payment schedule, payment flexibility, semi-monthly, bi-weekly, first payment day, second payment day, mudar frequência de pagamento, frequência de pagamento, next payday, save frequency, changePaymentFrequency, website#153, RU07.26.1.54.0 limit multiples changes | [website-payment-frequency.md](website-payment-frequency.md) | 2026-07-01 |
| seon-identity-verification | SEON, SEON IDV, isSeonIdCheckRequired, ID verification, identity verification, verify identity, SEON_ID_FAILED, SEON bypass, seon-widget-user-behavior.spec, seon-e2e-flow.spec, Kornerstone SEON, FifthAveFurnitureNY | [seon-identity-verification.md](seon-identity-verification.md) | 2026-07-01 |
| paytomorrow-refund-flow | paytomorrow, pay tomorrow, partner refund, refund the lead, refundTheLead, PT portal refund, merchant portal refund, customer not present, /send/cart, finalization url, funded by lender, request refund revert, changeLeadStatus UW_APPROVED refund, PayTomorrowPortalPage, MSAPowersports refund, refund partner lease | [paytomorrow-refund-flow.md](paytomorrow-refund-flow.md) | 2026-07-01 |
| servicing-refund-payment | refund, reverse payment, fully refund, partially refund, refundPayment, CREDIT transaction, payment history servicing (non-Sticky) | [servicing-refund-payment.md](servicing-refund-payment.md) | 2026-07-01 |
| settlement-amount | settlement amount, settlement breakdown, payoff agreement, delinquency offer, offer percent, days delinquent, getServicingInfo, settleApplication display, servicing information | [settlement-amount.md](settlement-amount.md) | 2026-07-01 |
| ca-epo-payoff | epo, payoff, early pay off, 90-day, 90 day payoff, quitação antecipada, EPO Balance, balance if paid off today, 16m CA, sixteenMonthEpoForCa, svc-531 | [ca-epo-payoff.md](ca-epo-payoff.md) | 2026-07-01 |
| payment-arrangement | payment arrangement, parcelamento, promise-to-pay, make payment modal, #paymentArrangement, ACH/CC arrangement, NORMAL/SETTLEMENT, /payment-arrangement, sweep NOT_STARTED→SUCCESS, arrangement FAILED, SETTLED_IN_FULL | [payment-arrangement.md](payment-arrangement.md) | 2026-07-01 |
| modify-approval-amount | modify approval amount, approval amount, valor de aprovação, limite de crédito, credit limit, Modify Approval Amount button | [modify-approval-amount.md](modify-approval-amount.md) | 2026-07-01 |
| lease-cancellation | cancel lease, cancel invoice, INVOICE_CANCELED, orderType 5, Cancel Lease button, refundAllPayments, account CANCELLED, refund at funding | [lease-cancellation.md](lease-cancellation.md) | 2026-07-01 |
| sticky-recover-grid | cc transactions grid, sticky columns, sticky recovery status, sticky txn id, credit-card-history, /sticky-recoveries, RU05.26.1.52.0, svc#485 CT-11 | [sticky-recover-grid.md](sticky-recover-grid.md) | 2026-07-01 |

---

## Protocol: operation not listed here

If ANY portal operation has no entry in this table, the rule is the SAME for every context — ad-hoc request (user or orchestrator) OR QA pipeline (qa-planner / qa-implementer). **There is NO read-only exemption (decision 2026-06-30):** a pure read — viewing a report/feed/list, filtering or searching a table, opening a lookup, exporting a CSV, plain navigation to a new route — counts exactly the same as a state-changing operation and requires its own oracle. There is no "proceed and warn" path and no "it's just a read" path: **nothing reaches a validated state without an oracle.**

> **Probes count as operations (decision 2026-06-30).** A probe, an ad-hoc/exploratory Playwright script, or a one-off `*.spec.ts` that authenticates and touches a portal IS the execution of the operation. The pre-check below runs **BEFORE you write/run the probe**, not after. Checking `_index.md` only once the probe already ran — or because a stop-hook forced it — is a protocol violation: the operation already happened. There is no "quick probe just to look" exemption.

1. **STOP** — do not perform the operation yet (this includes: do not write or run the probe/spec/script yet).
2. **Author the BDD** via the `test-scenarios` skill. Ground the checkpoints in the canonical business rules; if the expected behavior is unknown, run a `discovery` pass first (UI → API → DB, rule #18).
3. **Register** it: create `.claude/oracles/<operation>.md` (frontmatter `last-reviewed` + `covers`) and add a row to the table above.
4. **THEN perform** the operation — the probe/spec is the instrument that validates every checkpoint → report `Oracle: CT-XX — PASS/FAIL`.

> The `[UNVALIDATED — no BDD oracle registered]` tag is **retired** (decision 2026-06-27). An unlisted operation is never a reason to proceed unvalidated; it is the trigger to create the missing oracle first. This unifies the old ad-hoc and QA-pipeline branches into one rule — and, as of 2026-06-30, read-only operations are covered by it too (no state-change requirement).

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
