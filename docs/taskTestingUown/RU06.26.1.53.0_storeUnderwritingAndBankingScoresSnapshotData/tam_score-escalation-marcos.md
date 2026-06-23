# Escalação QA → Marcos — bloqueio de ambiente p/ `tam_score`

> Comentário pronto p/ colar no work item. Contexto: discovery QA ao vivo em qa2 (2026-06-19).

---

Hi @marcos.pacheco.silva — started QA on this task. Confirmed the easy half and hit an environment blocker on the other half. Summary below.

**✅ `npm_segment` — validated in qa2.** The column is populated on every **GDS + APPROVED + EligibleTerms 16** decision (Kornerstone/UOWN/PayTomorrow merchants). Automated test covering this is in progress. No issue here.

**⛔ `tam_score` — not reachable in qa2.** Across **6046** `uown_los_uwdata` rows (and 2037 `uown_sv_uwdata`), `tam_score` is **NULL in 100% of them**. Root cause, from the data:
- TireAgent (`OW90218-0001`) leads in qa2 **are** decided by GDS and approved, but cap at **EligibleTerms 13** — and the GDS fields seem to come only on the **16m** branch.
- The Second Look SSN `100000053` on TireAgent in qa2 returns **UW_DENIED** and short-circuits (it's validated only on stg), so the bank-data 2nd submission that would approve 16m never completes.
- Net: the **TireAgent + 16m + GDS** combination that produces `tam_score` doesn't happen in qa2.

**To finish the `tam_score` validation I need 3 things:**
1. **Exact SSN** — is it literally `100000053` (Second Look), or another value ending in `953`?
2. **Which environment** returns `tam_score` for a TireAgent 16m GDS decision? qa2 caps TireAgent at 13m and denies Second Look — is it **stg**, or is **dev2** configured for it?
3. **Recipe** — should `tam_score` come from the Second Look 2nd submission (bank data → 16m APPROVED), or is there an SSN/merchant that gives TireAgent 16m directly?

The automated test already has the `tam_score`/TireAgent cases stubbed (skipped) with a guard — I'll enable them as soon as the env + SSN are confirmed. Thanks!

---

## Notas internas (não colar)
- Discovery completo: `docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md`.
- Probes: `npx tsx src/scripts/_probe_uwdata.ts <env>` · `_probe_tireagent.ts <env>`.
- Se o env-alvo for dev2/stg, QA precisa do túnel kubectl correspondente aberto (`.env` reusa `127.0.0.1:5445` p/ QA2/DEV1/DEV2; STG = `34.121.232.252:5432`, sem rota deste host hoje).
- Ao confirmar: habilitar CT-02/CT-04 (remover `.skip`), atualizar `[[ssn-test-modalities]]` com a modalidade `tam_score`, e fechar com `qa-validator` → `qa-doc-keeper`.
