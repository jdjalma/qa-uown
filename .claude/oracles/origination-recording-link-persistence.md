---
operation: origination-recording-link-persistence
description: Persistência do link de gravação (Sentry Session Replay) criado pela página consumer-facing "/{shortCode}/complete" do Origination. Cobre o fix da MR !1448 (R1.52.0) — reuso da MESMA aba do navegador para abrir 2 aplicações consecutivas: AMBOS os leads devem ganhar uma linha em uown_lead_recording, mesmo que o sentUuid de sessionStorage tenha sobrado da app1.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/origination/R1.52.0_fixRecordingLinkSameTabReuse.spec.ts
  - src/helpers/recording.helpers.ts
  - src/helpers/database.helpers.ts
---

# Oracle BDD — Persistência do Link de Gravação (Recording-Link Same-Tab Reuse)

> **Gatilho:** qualquer operação que exercite a navegação do cliente até a página `/{shortCode}/complete` do Origination e valide a criação da linha de gravação em `uown_lead_recording` — em particular o cenário de **reuso da mesma aba** (abrir a app1 e depois a app2 no MESMO `Page`/`BrowserContext`). Inclui rodar `R1.52.0_fixRecordingLinkSameTabReuse.spec.ts` (regra #19 — executar o spec É executar a operação).
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/origination/R1.52.0_fixRecordingLinkSameTabReuse.spec.ts \
>   src/helpers/recording.helpers.ts \
>   src/helpers/database.helpers.ts
> ```
> Sem output = oracle está atual. Com output = prepend `[BDD MAY BE STALE]` e revalidar checkpoints antes de reportar PASS/FAIL.
>
> **Viewport:** Origination é um portal interno voltado para agentes → **1440×900** (regra #15; `page.setViewportSize({ width: 1440, height: 900 })` em todos os CTs — spec:229, 346, 412, 460, 489). **[HYPOTHESIS/ressalva]** a página `/{shortCode}/complete` é *consumer-facing* (o cliente a acessa pelo link recebido) e a regra #15 sugere inspeção mobile (375/768) para fluxos do cliente; porém o defeito da MR !1448 é lógica client-side de `sessionStorage`, **viewport-agnóstica** — o spec fixa 1440×900 e não cobre viewport mobile. Se um defeito de renderização mobile de `/complete` for suspeitado, isso está FORA do escopo deste oracle e exige investigação DOM-first separada.

---

## Contexto — qual era o bug e o que o fix garante

**Fonte primária:** cabeçalho do spec (linhas 9-14) + `src/helpers/recording.helpers.ts:1-27`.

- **Feature:** a página `/{shortCode}/complete` (frontend Origination, *consumer-facing*) monta o SDK do **Sentry Session Replay** e faz POST do `replayId`, criando uma linha em `uown_lead_recording (lead_pk, uuid)` que mapeia o lead ao UUID do replay do Sentry. **Não há elemento de UI** renderizando esse link na tela do lead no Origination — o acesso ao replay é feito pelo dashboard do Sentry (spec:22-25; recording.helpers.ts:13-20). Por isso a validação de AC-2/AC-4 é um SELECT no DB, **não** uma checagem de DOM — e a regra #14 (UI-first) permanece satisfeita porque o **caminho do bug** (navegar entre apps na mesma aba) é exercido via browser; só a pós-condição é DB-bound (não existe UI para validar).
- **Bug pré-fix (MR !1448):** ao abrir 2 aplicações diferentes **consecutivamente na MESMA aba**, o 2º lead **perdia** sua gravação porque `sessionStorage.sentUuid` sobrava da app1 e o front-end **pulava o reenvio** do `replayId` (assumia que já havia enviado). Resultado: nenhuma linha em `uown_lead_recording` para o lead2.
- **Fix:** o front-end força o reenvio quando o `shortCode` muda → AMBOS os leads recebem a linha em `uown_lead_recording`. O `replayId` (uuid) do Sentry **pode ser idêntico** para os dois leads, pois o Session Replay tem escopo *por sessão de aba* — **AC-4 = presença da linha, NÃO unicidade do uuid** (spec:269-283; recording.helpers.ts:comentário de escopo Sentry).

> **[Correção de premissa — regra #10/#16]** O brief da tarefa hipotetizou que o bug seria reuso de *nome de janela* (`window.open` / `target="_blank"` reutilizando a mesma janela nomeada). A **fonte primária (spec:11-14)** mostra que o mecanismo real é **carryover de `sessionStorage.sentUuid`** que fazia o FE pular o reenvio do `replayId` — NÃO é um problema de target de janela. Nenhum `window.open`/`target` é exercido ou asserido pelo spec.

---

## CT-01 — Reuso da mesma aba (SignWell, NY): ambos os leads ganham linha de gravação

```gherkin
Dado que dois leads frescos foram criados via API no estado NY (candidatos a SignWell), cada um em UW_APPROVED com um shortCode válido
E que os dois leads possuem leadPk e shortCode distintos entre si
E que a mesma aba do navegador (mesmo BrowserContext e mesmo Page) será usada para ambos, com viewport 1440×900
Quando o cliente acessa a URL "/{shortCode}/complete" do lead1 e o SDK do Sentry Session Replay inicializa
Então existe uma linha em uown_lead_recording para o lead1 com um uuid não-vazio (AC-2)
E o sessionStorage da aba passa a conter sentUuid presente e shortCode igual ao shortCode do lead1
Quando o cliente cola a URL "/{shortCode}/complete" do lead2 na MESMA aba (navegação completa, não um clique)
Então existe uma linha em uown_lead_recording para o lead2 com um uuid não-vazio (AC-4)
E o sessionStorage passa a conter shortCode igual ao shortCode do lead2 (rotacionado para app2), com sentUuid ainda presente
E a igualdade uuid1 === uuid2 é ESPERADA (replayId do Sentry é por sessão de aba); AC-4 é satisfeita pela presença da linha, não pela unicidade do uuid
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| leads distintos | `lead1.leadPk !== lead2.leadPk` E `lead1.shortCode !== lead2.shortCode` | spec:225-226 |
| Sentry inicializado (app1) | `assertSentryReplayInitialized(page)` retorna true (`window.__SENTRY__.hub` OU `window.Sentry.getReplay`) | spec:232-234; recording.helpers.ts:192-212 |
| AC-2 — gravação do lead1 | `assertRecordingLinkInDb(db, lead1.leadPk, {timeoutMs:15000})` retorna uuid não-vazio; `uuid1` truthy | spec:237-242, 267 |
| sessionStorage pós-app1 | `sentUuid: 'present'`, `shortCode === lead1.shortCode` | spec:245-251; recording.helpers.ts:147-176 |
| Navegação app2 | `page.goto(lead2.completeUrl)` na MESMA `page` — SEM `newPage()`/`newContext()` no meio (invariante de mesma-aba) | spec:26-28, 254-256 |
| AC-4 — gravação do lead2 | `assertRecordingLinkInDb(db, lead2.leadPk, {timeoutMs:15000})` retorna uuid não-vazio; `uuid2` truthy | spec:260-268 |
| Igualdade de uuid | `uuid1 === uuid2` é ESPERADO (mesma aba → replayId por sessão); AC-4 = presença da linha, não unicidade | spec:269-283 |
| sessionStorage pós-app2 | `sentUuid: 'present'`, `shortCode === lead2.shortCode` (rotacionado) | spec:286-292 |

```sql
-- Validação DB CT-01 (substituir $lead_pk por lead1 e depois lead2)
SELECT pk, uuid, lead_pk, row_created_timestamp
  FROM uown_lead_recording
 WHERE lead_pk = $lead_pk
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado: >= 1 linha com uuid não-nulo/não-vazio para AMBOS os leads.
```

---

## CT-02 — Reuso da mesma aba (GoSign, CA): ambos os leads ganham linha de gravação

```gherkin
Dado que o ambiente possui (ou não) um template GoSign para o estado CA, checado por preflight em uown_gow_sign_template
E que dois leads frescos foram criados via API no estado CA (candidatos a GoSign), cada um em UW_APPROVED com shortCode válido
E que a mesma aba (mesmo BrowserContext e Page) será usada, com viewport 1440×900
Quando o cliente acessa "/{shortCode}/complete" do lead1 e o Sentry inicializa
Então existe uma linha em uown_lead_recording para o lead1 com uuid não-vazio (AC-2)
Quando o cliente cola "/{shortCode}/complete" do lead2 na MESMA aba
Então existe uma linha em uown_lead_recording para o lead2 com uuid não-vazio (AC-4)
E a validação de gravação é vendor-agnóstica: SignWell e GoSign invocam a MESMA página /complete que monta o Sentry
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Preflight GoSign CA | `getGowSignTemplatesForState(db,'CA')` consultado; tabela canônica é `uown_gow_sign_template` (SEM coluna `is_active` — presença = elegível) | spec:315-336 |
| Degradação silenciosa (ressalva) | se `gowsignTemplates.length === 0`, CT-02 exercita o **fallback SignWell** — a asserção de gravação continua válida (vendor-agnóstica), mas a alegação de "cobertura GoSign" degrada; anotar `[OBSERVATION]` para o relatório | spec:325-330 |
| leads distintos | `lead1.leadPk !== lead2.leadPk` | spec:344 |
| AC-2 — gravação do lead1 | uuid1 truthy | spec:351-355, 373 |
| sessionStorage pós-app1 | `sentUuid: 'present'`, `shortCode === lead1.shortCode` | spec:357-362 |
| AC-4 — gravação do lead2 | uuid2 truthy | spec:367-374 |
| Igualdade de uuid | `uuid1 === uuid2` esperado (mesma aba) — AC-4 = presença da linha | spec:375-385 |
| sessionStorage pós-app2 | `sentUuid: 'present'`, `shortCode === lead2.shortCode` | spec:387-392 |

---

## CT-03 — Golden path aplicação única (SignWell, NY): linha de gravação presente

```gherkin
Dado que um único lead fresco foi criado via API no estado NY (candidato a SignWell), em UW_APPROVED com shortCode válido
E que uma aba nova é usada (sem reuso), viewport 1440×900
Quando o cliente acessa "/{shortCode}/complete" e o Sentry inicializa
Então existe uma linha em uown_lead_recording para o lead com um uuid não-vazio (AC-5 — regressão: o fix não pode quebrar o caso comum)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Sentry inicializado | `assertSentryReplayInitialized` true | spec:413-415 |
| AC-5 — gravação (aba nova) | `assertRecordingLinkInDb(db, lead.leadPk, {timeoutMs:15000})` retorna uuid truthy | spec:417-421 |

---

## CT-04 — Golden path aplicação única (GoSign, CA): linha de gravação presente

```gherkin
Dado que o preflight de template GoSign para CA foi executado (uown_gow_sign_template, sem is_active)
E que um único lead fresco foi criado via API no estado CA, em UW_APPROVED com shortCode válido
E que uma aba nova é usada, viewport 1440×900
Quando o cliente acessa "/{shortCode}/complete" e o Sentry inicializa
Então existe uma linha em uown_lead_recording para o lead com uuid não-vazio (AC-5)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Preflight GoSign CA | `getGowSignTemplatesForState(db,'CA')`; length 0 → degrada para SignWell, asserção de gravação ainda válida (`[OBSERVATION]`) | spec:435-454 |
| AC-5 — gravação (aba nova) | uuid truthy | spec:465-469 |

---

## CT-05 — Limpeza de sessionStorage após appComplete: shortCode e leadPk zerados

```gherkin
Dado que um lead fresco (SignWell, NY) foi criado via API e o cliente chegou em "/{shortCode}/complete", viewport 1440×900
Quando o cliente seleciona o programa de pagamento (Bi-Weekly), preenche cartão e dados bancários, aceita os Termos e conclui a e-assinatura, chegando em "/appComplete"
Então o sessionStorage.shortCode está ausente (null) após o appComplete (AC-6)
E o sessionStorage.leadPk está ausente (null) após o appComplete (AC-6)
E o valor de sessionStorage.sentUuid é apenas OBSERVADO/registrado, sem asserção estrita de ausência (OQ-4 — o diff da MR !1448 só exige que shortCode e leadPk sejam limpos)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Seleção do programa de pagamento | `contract.choosePlanByName('Bi-Weekly')` antes do formulário de CC (o seletor de plano precede o form em /complete) | spec:506-508 |
| Fluxo de assinatura completo | CC (`MASTERCARD_APPROVED`) + bank → T&C → e-sign; se `completeESign` lançar, anotar `[OBSERVATION]` e prosseguir (OQ-1) | spec:510-544 |
| Chegada em /appComplete | best-effort `waitForURL(/\/appComplete\b/i, 30s)`; se não chegar, anotar `[OBSERVATION]` com a URL final | spec:547-558 |
| AC-6 — shortCode limpo | `assertSessionStorageState(page, { shortCode: 'absent' })` → `getItem('shortCode')` retorna null | spec:560-565; recording.helpers.ts:163-164 |
| AC-6 — leadPk limpo | `{ leadPk: 'absent' }` → `getItem('leadPk')` retorna null | spec:560-565 |
| sentUuid (OQ-4) | valor apenas registrado (`null (cleared)` vs `"…" (preserved)`), SEM asserção estrita — gap OQ-4 | spec:560-572 |

---

## CT-06 — Smoke cross-env (qa2): reuso da mesma aba via SignWell — [SKIP intencional]

```gherkin
Dado que o CT-06 é opcional e explicitamente env-gated (qa2) no plano de teste
Quando a suíte roda o CT-06
Então ele é pulado (test.skip) com anotação de env-gap, pois o bug é client-side e a cobertura qa1 (CT-01/CT-02) é a regressão canônica
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Estado do CT-06 | `test.skip` — NÃO implementado; anota `env-gap` "CT-06 not implemented — optional per spec" | spec:589-592 |
| Como habilitar (doc) | copiar o corpo do CT-01 e fixar `process.env.ENV` via `test.use({ envName: 'qa2' })` | spec:585-587 |

---

## CT-07 — [negative] Repro da condição do bug pré-fix: carryover de sentUuid NÃO pode suprimir a gravação do lead2

> Cenário de **guarda de regressão**. Não é um CT executado isoladamente no spec — é a condição-armadilha embutida em CT-01/CT-02: o estado intermediário de `sessionStorage` (sentUuid da app1 sobrando quando o lead2 é aberto na mesma aba) é EXATAMENTE o locus do bug pré-fix. A asserção de que o lead2 **ainda** ganha uma linha em `uown_lead_recording` é a prova de que a MR !1448 corrigiu o defeito.

```gherkin
Dado que a app1 já foi aberta na aba e o sessionStorage carrega sentUuid presente com shortCode do lead1 (locus do bug pré-fix)
Quando o cliente abre a app2 (lead diferente) na MESMA aba, com o sentUuid da app1 ainda em sessionStorage
Então (comportamento pré-fix, PROIBIDO agora) o front-end NÃO pode pular o reenvio do replayId assumindo que já enviou
E existe uma linha em uown_lead_recording para o lead2 (o lead2 NÃO perde sua gravação)
E o sessionStorage.shortCode é rotacionado para o shortCode do lead2 (prova de que o FE reconheceu a troca de aplicação)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Locus do bug (estado intermediário) | após app1: `sentUuid: 'present'` E `shortCode === lead1.shortCode` — comentado no spec como "pre-bug-fix locus" | spec:244-251 |
| Guarda de regressão | após abrir app2 na mesma aba: `assertRecordingLinkInDb(db, lead2.leadPk)` retorna uuid não-vazio (pré-fix: nenhuma linha para o lead2) | spec:258-268 |
| Prova de rotação do shortCode | `shortCode === lead2.shortCode` após app2 (FE reconheceu a troca e forçou o reenvio) | spec:286-292 |
| Falha esperada se o bug retornar | ausência de linha em `uown_lead_recording` para o lead2 → `assertRecordingLinkInDb` lança "Recording link missing for lead …" após 15s → `[BUG]` (regressão da MR !1448) | recording.helpers.ts:107-112 |

---

## Pré-condições

- **Test Data Hierarchy (regra #9):** ambos os leads são criados FRESCOS via `createPreQualifiedApplication` com `skipPaymentInfo: true` — isso deixa o lead em UW_APPROVED com um shortCode válido, exatamente o estado para onde o link do cliente aponta. **NÃO** usar `submitPaymentInfoViaApi: true` — empurraria o lead direto para o iframe de assinatura e o cliente nunca acessaria `/{shortCode}/complete`, que é a página que hospeda o `useEffect` que faz POST do `replayId` (spec:105-115).
- **Merchant preflight (regra #12):** tratado automaticamente por `createPreQualifiedApplication` (merchant `TireAgent`, ONLINE) (spec:29-30).
- **`uniqueAddress: true`** em `buildTestData` para driblar a blacklist de endereço estático de CA entre execuções (spec:128).
- **Invariante de mesma-aba (CT-01/CT-02/CT-07):** mesmo `BrowserContext` + mesmo `Page` entre app1 e app2. NENHUM `newPage()`/`newContext()` no meio (spec:26-28).
- **shortCode:** resolvido via `db.waitForLeadShortCode(leadPk)` na tabela canônica `uown_los_lead_short_code`; a URL do cliente é montada por `buildCustomerCompleteUrl(originationUrl, shortCode)` → `{base}/{shortCode}/complete` (spec:153-160; recording.helpers.ts:255-260).
- **Timeout de gravação:** cada `assertRecordingLinkInDb` usa `timeoutMs: 15_000` no spec (o default do helper é 10_000) para acomodar a latência do POST do replayId após `page.goto` (spec:238, 261; recording.helpers.ts:71).

## Log de Atividade (Regra #13) — N/A justificado

`uown_los_lead_notes` **NÃO** registra a criação da gravação — a regra #13 é **N/A para a gravação em si** (gap OQ-3 documentado no spec:31-35 e recording.helpers.ts:21-22). Os passos do ciclo de vida que geram logs (ex.: submissão da aplicação) ocorrem DENTRO de `createPreQualifiedApplication` e não são asseridos aqui porque não fazem parte da superfície deste bug. A pós-condição da gravação é DB-bound em `uown_lead_recording` (não há UI nem nota para validar). **[HYPOTHESIS/gap]** Se o produto vier a adicionar uma nota de atividade para a criação da gravação, este oracle deve ser atualizado com o padrão de texto correspondente.

## Schema de referência — uown_lead_recording

```
pk BIGINT, row_created_timestamp TIMESTAMP, row_updated_timestamp TIMESTAMP,
tenant_id BIGINT, lead_pk BIGINT, uuid VARCHAR
```
Fonte: recording.helpers.ts:24-27. Chaves de sessionStorage geridas pelo fluxo Complete: `sentUuid`, `shortCode`, `leadPk` (recording.helpers.ts:152-156).

## Open questions / gaps para follow-up

- **OQ-1:** timing exato do envio do `replayId` dentro de `[shortCode]/complete/index.tsx` (mount `useEffect` vs submit). O spec assume envio no mount/efeito-de-navegação e espera a linha logo após `page.goto`. Se a linha nunca aparecer em 15s, a premissa pode estar errada → escalar (spec:38-42).
- **OQ-3:** ausência de log de atividade para criação de gravação (ver seção acima).
- **OQ-4:** comportamento de `sessionStorage.sentUuid` durante a limpeza do `appComplete` — CT-05 apenas registra o valor observado, sem asserção estrita (spec:43-46).
- **[HYPOTHESIS] viewport mobile:** `/{shortCode}/complete` é consumer-facing; a regra #15 sugere inspeção mobile para fluxos do cliente, mas o spec fixa 1440×900. Um defeito de renderização mobile de `/complete` estaria fora do escopo deste oracle.
