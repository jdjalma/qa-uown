# Observações — Task #505

## UOWN | Servicing | Add "Opt Out AI" Flag under the DNC flags

**Milestone:** RU03.26.1.50.0
**Data:** 2026-03-20
**Portal:** Servicing
**Total de bugs in-scope:** 0
**Total de observações:** 1

---

## Observações para o Time de Desenvolvimento

### OBS-01 — Frontend textarea de motivo "Opt Out AI" sem atributo maxlength

**Classificação:** Observação (fora do escopo da Task #505)
**Severidade:** Informativa
**Anteriormente reportado como:** BUG-03 (reclassificado após aplicação do Bug Triage Protocol)

**Descrição:** O textarea do modal "Reason for Opt Out AI Mobile" não possui o atributo HTML `maxlength`. A coluna correspondente no banco de dados (`uown_sv_phone.opt_out_ai_reason`) é `character varying(500)`. Sem a restrição no frontend, um usuário pode digitar mais de 500 caracteres, o que causaria erro de constraint violation no banco ou truncamento silencioso pelo backend.

**Como Reproduzir:**
1. Acessar `https://svc-website-qa1.uownleasing.com`
2. Login com credenciais de agente
3. Buscar conta `4476` → Primary Contact → Mobile Phone
4. Clicar no icone de edição (pencil icon) → marcar checkbox "Opt Out AI"
5. No modal "Reason for Opt Out AI Mobile", inspecionar o elemento textarea via DevTools (F12)
6. Confirmar que o atributo `maxlength` **não** está definido no `<textarea>`
7. Tentar digitar texto com mais de 500 caracteres — o frontend permite sem restrição

**Evidência:**
- CT-08 output: `[CT-08] Frontend textarea maxlength: NOT SET`
- CT-08 output: `[CT-08] DB column type for opt_out_ai_reason: character varying(500)`
- DB schema: `uown_sv_phone.opt_out_ai_reason` = `character varying(500)`

**Cenário que detectou:** CT-08

**Sugestão de melhoria:** Adicionar `maxLength={500}` ao componente React `<textarea>` do modal de motivo em `@uownleasing/common-ui`.

**Triagem (Bug Triage Protocol):**
1. **Comportamento errado?** Parcialmente — discrepância entre frontend (sem limite) e backend/DB (500 chars)
2. **Em escopo?** NAO — a Task #505 não define requisito explícito de `maxlength` no textarea. O campo de motivo (`optOutAiReason`) faz parte da feature, mas o requisito de limite de caracteres no frontend não consta nos critérios de aceite.
3. **Regressão?** NAO — feature nova, não havia textarea de motivo antes
4. **Classificação:** Fora do escopo → reclassificado de BUG-03 para OBS-01 (observação informativa)
