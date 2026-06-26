> ⚠️ Este arquivo é um registro de execução, NÃO uma fonte de padrões (rule #16). Não inferir seletores, helpers, classificações ou status de leads deste documento. Fonte de padrões = `.claude/skills/` + `src/` + `tests/`.

# Relatorio de Teste: lead-detail-esign-modify-lease

## Informacoes da Tarefa

| Campo | Valor |
|-------|-------|
| **Titulo** | Lead Detail — E-Sign / Sign section (after Modify Lease invoice increase) |
| **Arquivo de teste** | `tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts` |
| **Pipeline** | origination-ui |
| **Labels** | `@regression` `@e2e` `@origination` `@priority-high` |

## Descricao

Valida a secao E-Sign / Sign do Origination Lead Detail apos uma modificacao de lease (invoice INCREASE) ter levado o lead ao status `CONTRACT_CREATED` com auto-despacho de um contrato. Cenarios ativos: S1 (negativo — E-Sign ausente em SIGNED), S2 (visibilidade do botao em CONTRACT_CREATED), S3 (dispatch SENT + log), S6 (assinatura completa pelo cliente + signing log). S4/S5 permanecem skipped aguardando discovery de `chargeProcessingFeeBeforeEsign`.

## Execucao do Teste

### Ciclo 3/3 — 2026-06-26 (sandbox, FINAL)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-06-26 (ciclo 3 — final) |
| **Ambiente** | `sandbox` (ENV=sandbox em `.env`) |
| **Project Playwright** | `origination-ui` |
| **Branch** | `wip/transfer` |
| **Resultado geral** | **PARCIAL** — 2 PASSOU / 2 FALHOU / 2 SKIPPED |
| **Duracao** | ~4.8 min |
| **Ciclo de validacao** | 3/3 (cap atingido — relatorio definitivo) |

> **Nota de ambiente (ciclo 3):** DB tunnel ativo na porta 5445 (`UOWN_DB_URL_SBX=postgresql://127.0.0.1:5445/svc`). Conexao verificada com sucesso — todos os steps de DB executaram sem erro. `sendApplication` criou 4 leads novos (PKs 98101–98104) com sucesso. Setup de S2/S3/S6 completou Modify Lease ("Invoice saved") e assertiva de DB `CONTRACT_CREATED` passou. Falhas sao de comportamento de aplicacao/premissa de teste, nao de infraestrutura.

### Ciclo 2/3 — 2026-06-26 (sandbox, historico)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-06-26 (ciclo 2) |
| **Resultado geral** | **FALHOU** (4 falhas / 2 skipped / 0 pass entre os CTs ativos) |
| **Ciclo de validacao** | 2/3 |

> **Nota ciclo 2:** Tunnel PostgreSQL para sandbox nao estava ativo na porta 5446. Todos os CTs falharam na primeira assertiva de DB. API LOS e UI Modify Lease funcionaram (leads 98097–98100 criados).

### Ciclo 1/3 — 2026-06-26 (stg, historico)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-06-26 13:15 UTC |
| **Ambiente** | `stg` |
| **Resultado geral** | **FALHOU** (4 falhas / 2 skipped / 0 pass) |
| **Ciclo de validacao** | 1/3 |

> **Nota ciclo 1:** `sendApplication` retornou HTTP 500 / nested 401 em stg. Nenhum lead criado.

## Evidencias (Dados Utilizados/Criados)

### Ciclo 3 (sandbox — definitivo)

| Lead/Account | Papel | Criado/Existente | Observacao |
|---|---|---|---|
| leadPk=98101 | Setup S2 (CONTRACT_CREATED via Modify Increase) | Criado | Setup completo; S2 PASSOU. `[test-execution:cycle-3-sandbox-2026-06-26]` |
| leadPk=98102 | Setup S3 (CONTRACT_CREATED via Modify Increase) | Criado | Setup completo; falha no assert contractType LEASE vs LEASE_MOD. `[db-observation:uown_esign_document.document_group=LEASE,lead_pk=98102]` `[test-execution:cycle-3-sandbox-2026-06-26]` |
| leadPk=98103 | Setup S6 (CONTRACT_CREATED via Modify Increase) | Criado | Setup completo; GowSign modal nao apareceu apos E-Sign click. `[db-observation:uown_esign_document.client=GOWSIGN,pk=14809,lead_pk=98103]` `[test-execution:cycle-3-sandbox-2026-06-26]` |
| leadPk=98104 | Setup S1 (SIGNED via driveLeadToSigned) | Criado | S1 PASSOU; lead status EXPIRED no DB apos o run (transicao esperada em sandbox). `[test-execution:cycle-3-sandbox-2026-06-26]` |

### Ciclos anteriores (historico)

| Ciclo | Leads | Observacao |
|-------|-------|------------|
| Ciclo 2 (sandbox) | 98097–98100 | DB inacessivel (porta 5446). |
| Ciclo 1 (stg) | N/A | `sendApplication` 500/401. |

## Capturas de Tela

### Ciclo 3 (sandbox — definitivo)

| CT | Screenshot | Conteudo |
|----|-----------|---------|
| S2 | N/A (PASSOU) | — |
| S1 | N/A (PASSOU) | — |
| S3 | `reports/test-results/lead-detail-esign-modify-l-70a15-ocuments-panel-activity-log-origination-ui/test-failed-1.png` | Lead 98102 — Internal Status = CONTRACT_CREATED; painel Documents mostra secao Lease com "UOWN_96..." — captura cortada antes de mostrar as linhas do painel. `[test-execution:cycle-3-sandbox-2026-06-26]` |
| S6 | `reports/test-results/lead-detail-esign-modify-l-9c2b8-ontract-SIGNED-activity-log-origination-ui/test-failed-1.png` | Lead 98103 — Internal Status = CONTRACT_CREATED; pagina base sem modal GowSign aparente. `[test-execution:cycle-3-sandbox-2026-06-26]` |

## Cenarios

### CT-01 — S2: E-Sign button e visivel em CONTRACT_CREATED

**Objetivo:** confirmar que o botao E-Sign aparece na action bar quando o lead esta em `CONTRACT_CREATED` apos um Modify Lease de aumento.

**O que e verificado:** apos o setup criar um lead fresco via `createPreQualifiedApplication` + `driveLeadToSigned` + UI Modify Lease (aumento), o agent abre o lead no Origination e expande o menu de acoes; o botao E-Sign deve estar visivel.

**Status ciclo 3:** **PASSOU**

> Setup (includindo DB `findLeadNoteContaining` com pattern 'Invoice increase') executou sem erro. Lead 98101, status CONTRACT_CREATED confirmado. E-Sign visivel na action bar. `[test-execution:cycle-3-sandbox-2026-06-26]`

#### Como verificar manualmente

1. Acessar sandbox com credenciais validas.
2. Criar um lead via API: `POST /uown/los/sendApplication` (TireAgent, NY, orderTotal=800).
3. Enviar invoice reduzida → `driveLeadToSigned`.
4. Abrir o lead no Origination → Modify Lease (aumento de valor).
5. Recarregar a pagina; confirmar status interno `CONTRACT_CREATED`.
6. Expandir o menu de acoes; confirmar botao E-Sign visivel.

---

### CT-02 — S3: Clicking E-Sign -> documento SENT no painel Lease + activity log

**Objetivo:** confirmar que apos clicar em E-Sign em CONTRACT_CREATED, o documento re-despachado aparece com status SENT no painel Documents e que existe nota de atividade "Sent Contract to customer".

**O que e verificado:** apos setup CONTRACT_CREATED, o agente clica em E-Sign, forca "Get Document Status" sync, recarrega a pagina e verifica o tipo e status do contrato no painel Lease. Valida idempotencia.

**Status ciclo 3:** **FALHOU** [OBSERVACAO — premissa de tipo de contrato]

> Falha: `expected a LEASE_MOD row; got [{"contractNumber":"UOWN_96192_98102","contractType":"LEASE","status":"SENT",...}]`
>
> O painel Documents exibe `contractType="LEASE"` com `status="SENT"`, nao `contractType="LEASE_MOD"`. O DB confirma: `uown_esign_document.document_group='LEASE'` (pk=14808) e a nota do backend registra `LeaseType : LEASE and EsignMode : EMBEDDED` (note pk=813319). A premissa do teste de que o painel exibiria "LEASE_MOD" nao se verifica em sandbox — o backend re-despacha um contrato de tipo "LEASE", nao "LEASE_MOD".
>
> Steps anteriores do CT-02 passaram: (1) baseline — `getEsignDocumentByLeadPk` encontrou o documento; (2) E-Sign click + Get Document Status executados; (3) pagina recarregada. A falha foi exclusivamente na assertiva `contractType.toUpperCase() === 'LEASE_MOD'`. O activity log "Sent Contract to customer" existe no DB (note pk=813319).
>
> `[db-observation:uown_esign_document.document_group=LEASE,pk=14808,lead_pk=98102]` `[db-observation:uown_los_lead_notes.pk=813319,notes=Sent Contract to customer...,lead_pk=98102]` `[test-execution:cycle-3-sandbox-2026-06-26]`

#### Como verificar manualmente

1. Seguir passos 1–5 de CT-01.
2. Clicar no botao E-Sign na action bar.
3. Clicar em "Get Document Status" (se visivel).
4. Recarregar a pagina.
5. Verificar no painel Documents → Lease o tipo e status do contrato re-despachado.
6. Verificar no DB: `SELECT document_group, status FROM uown_esign_document WHERE lead_pk = :pk ORDER BY pk DESC LIMIT 1`.
7. Verificar no DB: `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = :pk AND notes ILIKE '%Sent Contract to customer%'`.

---

### CT-03 — S6: Customer signs LEASE_MOD -> lead + contract SIGNED + activity log [P0]

**Objetivo:** confirmar o fluxo completo de assinatura do contrato re-despachado pelo cliente apos Modify Lease increase — lead e documento transitam para SIGNED.

**O que e verificado:** apos setup CONTRACT_CREATED, o agente clica em E-Sign; o sistema deve abrir a superficie de assinatura embarcada (GowSign, resolvido via DB); o cliente completa a cerimonia; lead e documento transitam para SIGNED.

**Status ciclo 3:** **FALHOU** [OBSERVACAO — signed-modal-not-confirmed]

> Falha: `TimeoutError: locator.waitFor: Timeout 120000ms exceeded` para `.alternative-contract-vendor_iframeContainer__yAn5c`.
>
> O provider foi resolvido corretamente como GOWSIGN via DB (uown_esign_document pk=14809, client='GOWSIGN', status='SENT_TO_CUSTOMER', esign_mode='EMBEDDED'). O E-Sign foi clicado com sucesso (`[Customer] Clicked E-Sign / Resend E-sign`). No entanto, o modal GowSign embarcado nao apareceu dentro do timeout de 120s.
>
> Contexto: o documento tem `test_mode=true` e `mock_response_on_test=true` em sandbox. A URL de embedding aponta para `https://gowsign-app-dev-uown.azurewebsites.net/document/599f0466-...`. A superficie de assinatura embarcada nao foi confirmada visualmente neste ciclo.
>
> Per instrucao da task: classificado como `[OBSERVACAO — signed-modal-not-confirmed]`. Nenhuma alteracao de codigo realizada.
>
> `[db-observation:uown_esign_document.pk=14809,client=GOWSIGN,esign_mode=EMBEDDED,lead_pk=98103]` `[test-execution:cycle-3-sandbox-2026-06-26]`

#### Como verificar manualmente

1. Seguir passos 1–5 de CT-01.
2. Clicar em E-Sign.
3. Aguardar o modal GowSign embarcado aparecer na pagina.
4. Verificar no DB: `SELECT client, status, embed_urlsent_for_signing, test_mode FROM uown_esign_document WHERE lead_pk = :pk ORDER BY pk DESC LIMIT 1`.
5. Completar a cerimonia de assinatura.
6. Verificar na UI que o status do lead muda para Signed.
7. Verificar no DB: `SELECT lead_status FROM uown_los_lead WHERE pk = :pk` — deve retornar `SIGNED`.

---

### CT-04 — S1: [negativo] E-Sign ausente quando lead esta SIGNED

**Objetivo:** confirmar que o botao E-Sign NAO aparece na action bar de um lead em status SIGNED.

**O que e verificado:** lead fresco criado via API e levado a SIGNED (`driveLeadToSigned`); agente abre o lead no Origination, expande o menu de acoes; o botao E-Sign deve estar ausente.

**Status ciclo 3:** **PASSOU**

> Setup (leadPk=98104) + `driveLeadToSigned` completaram. Activity log com 'SIGNED' encontrado no DB. Internal status = SIGNED confirmado na UI. `isESignVisible()` retornou false. AC-01 validado. `[test-execution:cycle-3-sandbox-2026-06-26]`

#### Como verificar manualmente

1. Criar um lead via API (TireAgent, NY, orderTotal=800).
2. Levar o lead a SIGNED via `driveLeadToSigned`.
3. Verificar no DB: `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = :pk AND notes ILIKE '%SIGNED%'`.
4. Abrir o lead no Origination.
5. Confirmar status interno `SIGNED`.
6. Expandir o menu de acoes; confirmar que o botao E-Sign NAO esta presente.

---

### CT-05 — S4: chargeProcessingFeeBeforeEsign cobra a taxa

**Status:** **SKIPPED**

> Motivo: `pending discovery — see docs/scenarios/lead-detail-esign-modify-lease.md §Pending`

---

### CT-06 — S5: chargeProcessingFeeBeforeEsign desmarcado pula a taxa

**Status:** **SKIPPED**

> Motivo: `pending discovery — see docs/scenarios/lead-detail-esign-modify-lease.md §Pending`

---

## Desvios Implementados vs. Instrucao Original

| Desvio | Status | Observacao |
|--------|--------|-----------|
| S1 implementado (era @pending) | **Confirmado** | PASSOU no ciclo 3. AC-01 validado. `[user-provided:task-instructions,2026-06-26]` |
| S6 assume superficie de assinatura embarcada via DB provider | **Nao verificavel** | Provider resolvido corretamente como GOWSIGN (pk=14809). Modal nao abriu. Classificado como OBSERVACAO — signed-modal-not-confirmed per instrucao da task. `[test-execution:cycle-3-sandbox-2026-06-26]` |

## Findings

| ID | Tipo | Ciclo | Severidade | Prioridade | Descricao |
|----|------|-------|-----------|-----------|----------|
| F-001 | [OBSERVACAO — RESOLVIDO] | 1 | S2 | P1 | Ambiente `stg`: `sendApplication` retornou HTTP 500 / nested `401 Unauthorized`. Resolvido no ciclo 2. `[test-execution:run-2026-06-26T13:15]` |
| F-002 | [OBSERVACAO — RESOLVIDO] | 1 | S3 | P2 | `.env` tinha `ENV=stg` conflitando com instrucao da task. Resolvido no ciclo 2. `[user-provided:task-instructions,2026-06-26]` |
| F-003 | [OBSERVACAO — RESOLVIDO] | 2 | S2 | P1 | Tunnel PostgreSQL para sandbox nao estava ativo (porta 5446). Resolvido no ciclo 3 (porta 5445, `UOWN_DB_URL_SBX` corrigido). `[test-execution:cycle-2-sandbox-2026-06-26]` |
| F-004 | [OBSERVACAO] | 3 | S3 | P2 | Pos Modify Lease invoice increase, o backend cria `uown_esign_document.document_group='LEASE'` (nao 'LEASE_MOD') e a nota registra `LeaseType : LEASE`. O painel Documents no Origination exibe `contractType='LEASE'`. O teste assertia `contractType='LEASE_MOD'` — premissa de teste incorreta para sandbox. Activity log "Sent Contract to customer" presente. Nao e bug de producao; e mismatch de premissa de design. `[db-observation:uown_esign_document.pk=14808,document_group=LEASE,lead_pk=98102]` `[db-observation:uown_los_lead_notes.pk=813319,notes=LeaseType:LEASE,lead_pk=98102]` `[test-execution:cycle-3-sandbox-2026-06-26]` |
| F-005 | [OBSERVACAO — signed-modal-not-confirmed] | 3 | S3 | P1 | GowSign embedded signing surface (`.alternative-contract-vendor_iframeContainer__yAn5c`) nao apareceu dentro de 120s apos E-Sign click para lead 98103. Provider confirmado como GOWSIGN via DB (pk=14809, test_mode=true, mock_response_on_test=true). Causa provavel: sandbox GowSign mock mode nao renderiza a superficie de assinatura embarcada no portal. Per instrucao da task: `[OBSERVACAO — signed-modal-not-confirmed]`. `[db-observation:uown_esign_document.pk=14809,client=GOWSIGN,test_mode=true,lead_pk=98103]` `[test-execution:cycle-3-sandbox-2026-06-26]` |

## Cobertura dos Requisitos vs. Risco

| Area de risco (do SPEC) | Nivel | Cenarios cobrindo | Adequado? |
|------------------------|-------|-------------------|-----------|
| Visibilidade E-Sign em CONTRACT_CREATED | Alto | CT-01 (S2) — PASSOU | Sim |
| Negativo: E-Sign ausente em SIGNED | Medio | CT-04 (S1) — PASSOU | Sim |
| Dispatch de contrato SENT + activity log | Alto | CT-02 (S3) — falha em premissa de tipo; activity log confirmado no DB | Parcial — AC de log validado; tipo de contrato precisa revisao de premissa |
| Cerimonia de assinatura LEASE_MOD [P0] | Critico | CT-03 (S6) — modal nao confirmado | Nao testado — superficie de assinatura embarcada nao verificada em sandbox mock mode |
| chargeProcessingFeeBeforeEsign | Baixo | CT-05/06 (S4/S5) — skipped por design | N/A |

**Avaliacao geral (ciclo 3):** cobertura parcial. Os dois ACs de visibilidade do botao (S1, S2) foram validados com sucesso. O AC de activity log para o dispatch foi confirmado no DB (F-004 e um mismatch de premissa, nao ausencia do log). O cenario P0 (assinatura embarcada) nao foi verificado — a superficie GowSign nao renderizou no ambiente sandbox mock mode.

## Resumo da Validacao

| Item | Ciclo 1 (stg) | Ciclo 2 (sandbox) | Ciclo 3 (sandbox — FINAL) |
|------|--------------|------------------|--------------------------|
| Testes passaram (CTs ativos) | 0 / 4 | 0 / 4 | 2 / 4 |
| Falhas de infraestrutura | 4 / 4 (LOS 401) | 4 / 4 (DB ECONNREFUSED) | 0 / 4 |
| Falhas de comportamento/premissa | 0 | 0 | 2 / 4 (S3, S6) |
| Skipped por design | 2 (S4/S5) | 2 (S4/S5) | 2 (S4/S5) |
| Bugs de aplicacao confirmados | 0 | 0 | 0 |
| Observacoes abertas | 2 | 1 nova | 2 novas (F-004, F-005); F-001/F-002/F-003 resolvidos |
| API LOS sandbox funcional | N/A | Sim | Sim |
| UI Modify Lease funcional | N/A | Sim | Sim |
| Activity log "Invoice increase" validado | Nao verificavel | Nao verificavel | Sim (setup do S2/S3/S6) |
| Activity log "Sent Contract to customer" | Nao verificavel | Nao verificavel | Sim (DB note pk=813319 para lead 98102) |
| Superficie de assinatura embarcada | Nao verificavel | Nao verificavel | NAO verificada (modal nao renderizou) |

## Decisoes

- **F-004 — Tipo de contrato LEASE vs LEASE_MOD:** a premissa do teste (`contractType='LEASE_MOD'`) nao corresponde ao comportamento real do backend em sandbox (`document_group='LEASE'`). Acao recomendada: a equipe deve investigar se o painel deveria exibir "LEASE_MOD" (feature gap) ou se a premissa deve ser atualizada para "LEASE" (test fix). Decisao do usuario ou dev team.
- **F-005 — Modal GowSign nao renderiza em sandbox mock mode:** o provider GowSign foi corretamente identificado, mas a superficie de assinatura embarcada nao apareceu. Causa provavel: `test_mode=true` + `mock_response_on_test=true` impede o carregamento do iframe real em sandbox. Acao recomendada: validar o fluxo de assinatura em qa1 ou qa2 onde `test_mode` pode ter comportamento diferente.
- **S4/S5 skipped:** decisao de design. Sem acao necessaria.
- **Cap de 3 ciclos atingido:** resultados definitivos. Escalacao ao usuario para decisao sobre F-004 e F-005.

## Handoff

**Ciclo de validacao: 3/3 — cap atingido. Relatorio definitivo.**

**Status final:** PARCIAL — S1 e S2 PASSARAM; S3 e S6 FALHARAM por observacoes de comportamento (nao bugs confirmados).

**Escalacao ao usuario:**
1. **F-004 (S3):** o painel Documents mostra `contractType='LEASE'` apos Modify Lease increase. O teste espera `'LEASE_MOD'`. Decidir: (a) corrigir a premissa do teste para aceitar 'LEASE', ou (b) investigar se o backend deveria criar um documento com `document_group='LEASE_MOD'`. Se (b), abrir ticket para dev.
2. **F-005 (S6 — P0):** assinatura embarcada GowSign nao renderizou em sandbox (`test_mode=true`). Decidir: (a) re-executar em qa1/qa2 para validar o fluxo real, ou (b) aceitar como limitacao de sandbox e marcar como test debt.
