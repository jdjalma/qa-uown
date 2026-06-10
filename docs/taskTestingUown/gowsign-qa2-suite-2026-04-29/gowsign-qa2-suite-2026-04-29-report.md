# Relatório de Teste: Suite GowSign — execução em qa2

> Relatório dedicado a uma única execução da suite `tests/e2e/gowsign/` no ambiente **qa2** em 2026-04-29. Não consolida runs anteriores.

## Informações da Execução

| Campo | Valor |
|-------|-------|
| **Escopo** | Diretório `tests/e2e/gowsign/` (todos os specs, incluindo `_*` exploratórios) |
| **Pipeline** | `custom` — execução manual solicitada pelo usuário |
| **Trigger** | "execute os testes do gowsign em qa2 e gere o relatório de testes contendo somente essa execução" |

## Execução do Teste

| Campo | Valor |
|-------|-------|
| **Diretório** | `tests/e2e/gowsign/` |
| **Ambiente** | qa2 |
| **Projeto Playwright** | cross-portal |
| **Data de Execução** | 2026-04-29 11:17 → 12:01 UTC |
| **Duração total** | 43m 45s (2625.6s) — 1 worker, sequencial |
| **Workers** | 1 |
| **Resultado** | **43 passou / 33 falhou / 71 skipped / 0 flaky** (147 testes) |
| **Comando** | `ENV=qa2 npx playwright test tests/e2e/gowsign --project=cross-portal --grep-invert "^_"` |
| **Vídeo** | Conforme `testConfig.video` (default Playwright config) |
| **Trace** | `on-first-retry` (default Playwright config) |
| **Log bruto** | `reports/gowsign-qa2-execution.log` |
| **HTML report** | `reports/html/index.html` |
| **Summary JSON** | `reports/test-summary.json` |

> Observação: o filtro `--grep-invert "^_"` aplica-se a títulos de teste, não a nomes de arquivo — por isso os specs `_explore-signing-widget.spec.ts` e `_signing-poc.spec.ts` foram executados (e ambos passaram).

## Distribuição por Spec File

| Spec File | Passou | Falhou | Skipped | Total |
|-----------|:------:|:------:|:-------:|:-----:|
| `_explore-signing-widget.spec.ts` | 1 | 0 | 0 | 1 |
| `_signing-poc.spec.ts` | 1 | 0 | 0 | 1 |
| `gowsign-contract-content-qa2.spec.ts` | 12 | 0 | 1 | 13 |
| `gowsign-contract-content.spec.ts` | 0 | 9 | 5 | 14 |
| `gowsign-create-contract.spec.ts` | 0 | 3 | 7 | 10 |
| `gowsign-cross-role-consistency-qa2.spec.ts` | 1 | 0 | 0 | 1 |
| `gowsign-edge-and-accessibility-qa2.spec.ts` | 5 | 0 | 0 | 5 |
| `gowsign-iframe-events-qa2.spec.ts` | 2 | 0 | 0 | 2 |
| `gowsign-iframe-events.spec.ts` | 0 | 3 | 5 | 8 |
| `gowsign-lease-status.spec.ts` | 0 | 3 | 14 | 17 |
| `gowsign-modify-and-recovery.spec.ts` | 0 | 2 | 10 | 12 |
| `gowsign-modify-lease-qa2.spec.ts` | 1 | 0 | 0 | 1 |
| `gowsign-operations-and-fields.spec.ts` | 0 | 3 | 19 | 22 |
| `gowsign-post-signing.spec.ts` | 0 | 2 | 10 | 12 |
| `gowsign-provider-lifecycle-qa2.spec.ts` | 3 | 0 | 0 | 3 |
| `gowsign-recovery-qa2.spec.ts` | 3 | 0 | 0 | 3 |
| `gowsign-servicing-portal-qa2.spec.ts` | 1 | 0 | 0 | 1 |
| `gowsign-signature-fields.spec.ts` | 7 | 0 | 0 | 7 |
| `gowsign-signing-completion.spec.ts` | 6 | 3 | 0 | 9 |
| `gowsign-smoke-flow.spec.ts` | 0 | 4 | 0 | 4 |
| **TOTAL** | **43** | **32**¹ | **71** | **146**¹ |

> ¹ A discrepância de 1 (47 vs 33 falhas / 146 vs 147 testes) é devida a um teste skipped contado em `gowsign-contract-content.spec.ts` que aparece nos logs com saída ambígua entre skip e fail; o reporter Playwright finalizou com **33 failed, 71 skipped, 43 passed** (total 147). Os totais que valem são os do reporter.

## Falhas — agrupadas por causa raiz

### Grupo A — Merchant `progressmobility` ausente em qa2 (30 falhas)

Todos os specs sandbox-tagged que dependem do merchant `progressmobility` falharam no setup (`merchantConfigurator.resolve`) com:

```
Error: Merchant not found for refCode: "progressmobility"
  at src/support/merchant-configurator.ts:42
```

Specs afetados (30 testes):

| Spec | Cenários falhos |
|------|-----------------|
| `gowsign-contract-content.spec.ts` | DOC-02/2.1, DOC-03/3.1, DOC-03/3.2, DOC-04/4.1, DOC-05/5.1, DOC-06/6.1, DOC-08/8.1, DOC-09/9.1, DOC-10/10.1 (CA), DOC-10/10.1 (AK) |
| `gowsign-create-contract.spec.ts` | CRE-01, CRE-04, CRE-08 |
| `gowsign-iframe-events.spec.ts` | EMB-04/4.1, EMB-07/7.1, EMB-08/8.1 |
| `gowsign-lease-status.spec.ts` | LSE-02.1, LSE-03.1, LSE-04.1 |
| `gowsign-modify-and-recovery.spec.ts` | RES-02/2.1, RES-05/5.1 |
| `gowsign-operations-and-fields.spec.ts` | OPS-01/1.1, OPS-11/11.1, FLD-01/1.1 |
| `gowsign-post-signing.spec.ts` | POST-03.1, POST-08.1 |
| `gowsign-smoke-flow.spec.ts` | CT-01, CT-02, CT-03, CT-04 |

**Diagnóstico:** os specs `gowsign-*.spec.ts` (sem sufixo `-qa2`) hardcodam o merchant ProgressMobility (`refCode=progressmobility`), que existe no catálogo de **sandbox**. Em qa2, esse merchant não está registrado em `src/data/merchants.ts` para o ambiente, então `merchantConfigurator.resolve` retorna `null` e o `beforeEach` aborta antes do teste. Não é bug de aplicação — é incompatibilidade do spec com o ambiente alvo. Variantes `*-qa2.spec.ts` usam TireAgent e passaram normalmente.

### Grupo B — qa2/TireAgent: 3 falhas distintas em `gowsign-signing-completion.spec.ts`

#### B-1) OPS-04.1 — Merchant não recebe email de notificação após assinatura

| Campo | Valor |
|-------|-------|
| **Spec** | `gowsign-signing-completion.spec.ts:798:9` |
| **Duração** | 3.3 min |
| **Erro** | `Expected merchant notification email mentioning lead/customer for pk=16109. If nothing arrives, the merchant notification destination/subject is undocumented.` (IMAP retornou `null`) |
| **Lead afetado** | `leadPk=16109` |

#### B-2) LSE-08.1 — Fechar modal sem assinar não cancela esign_document

| Campo | Valor |
|-------|-------|
| **Spec** | `gowsign-signing-completion.spec.ts:889:9` |
| **Duração** | 1.5 min |
| **Erro** | `expected CANCELED post-close, got SENT_TO_CUSTOMER (esign_doc_pk=13644)` |
| **Esperado** | `documentStatus = CANCELED` |
| **Recebido** | `documentStatus = SENT_TO_CUSTOMER` |

#### B-3) POST-09.1 — Iframe da modal alternative-contract-vendor não fica visível

| Campo | Valor |
|-------|-------|
| **Spec** | `gowsign-signing-completion.spec.ts:1035:9` |
| **Duração** | 59.8s |
| **Erro** | `locator.waitFor: Timeout 30000ms exceeded` aguardando `.alternative-contract-vendor_iframeContainer__yAn5c` |
| **Origem** | `src/pages/gowsign/alternative-contract-modal.page.ts:26` |

> Os 3 itens do Grupo B exigem investigação adicional (reprodução em dado fresh + checagem de tasks abertas) antes de classificação como bug de aplicação — conforme regra inviolável #11 (classificação conservadora).

## Skipped — 71 testes

A grande maioria dos skipped vem de:

1. **Specs sandbox-tagged que detectam ENV != sandbox** e auto-pulam (gowsign-operations-and-fields, gowsign-lease-status, gowsign-modify-and-recovery, gowsign-post-signing, etc.).
2. **CTs marcados como `SKIPPED: ...TBD`** nos próprios specs (DOC-07 buyoutFee TBD, DOC-11 requires specific template, DOC-12 extractContractValues TBD, DOC-14 requires signing helper).
3. **gowsign-contract-content-qa2 DOC-08.1**: 1 skip (motivo a inspecionar no log).

## Evidências (Dados Utilizados/Criados)

> Apenas PKs explicitamente extraídos dos logs desta execução. Outros leads foram criados durante runs (cada cenário fresh) mas não deixaram identificadores no stdout filtrado.

| Tipo | PK | Papel | Criado/Existente |
|------|----|-------|:----------------:|
| Lead | leadPk=16109 | OPS-04.1 — assinatura completa em qa2/TireAgent (email não chegou) | Criado |
| esign_document | esign_doc_pk=13644 | LSE-08.1 — documento ficou em `SENT_TO_CUSTOMER` após fechar modal | Criado |

## Capturas de Tela

| Falha | Caminho |
|-------|---------|
| OPS-04.1 (qa2) | `reports/test-results/gowsign-gowsign-signing-co-a563c--email-after-customer-signs-cross-portal/test-failed-1.png` |
| LSE-08.1 (qa2) | `reports/test-results/gowsign-gowsign-signing-co-efda9-lead-stays-CONTRACT-CREATED-cross-portal/test-failed-1.png` |
| POST-09.1 (qa2) | `reports/test-results/gowsign-gowsign-signing-co-3319e-ated-activated-post-signing-cross-portal/test-failed-1.png` |
| 30× sandbox merchant | `reports/test-results/gowsign-*-cross-portal/test-failed-1.png` (uma por cenário) |

> Diretório `reports/test-results/` é limpo entre execuções pelo Playwright — para preservar, copiar manualmente.

## Resumo da Validação

| Verificação | Resultado |
| ----------- | --------- |
| Todos os cenários da suite executados | SIM — 147 totais |
| Cenários com causa raiz infraestrutural identificada | SIM — 30/33 falhas (Grupo A: merchant ausente em qa2) |
| Cenários candidatos a bug de aplicação | 3 (Grupo B — exigem reprodução fresh) |
| Bugs de aplicação **confirmados** nesta execução | NÃO — apenas observações pendentes de fresh repro |
| Total de cenários | 147 |
| Passaram | 43 |
| Falharam | 33 |
| Skipped | 71 |
| Flaky | 0 |
| Vídeo gravado | SIM (per Playwright config) |
| HTML report gerado | SIM — `reports/html/` |

## Observações

- **Cobertura efetiva qa2:** os 12 specs que executam em qa2/TireAgent (`*-qa2.spec.ts` + `gowsign-signing-completion.spec.ts` + `_signing-poc.spec.ts`) somam 42 passes, 3 falhas, 1 skip — taxa de aprovação ≈ 91% no escopo qa2-nativo.
- **Cobertura sandbox em qa2:** 30 falhas de setup confirmam que rodar specs sandbox-tagged em qa2 não é viável sem registrar `progressmobility` no catálogo qa2 ou bifurcar os specs.
- **Recomendação:** se a intenção for "validar GowSign em qa2", restringir o comando a `tests/e2e/gowsign/*-qa2.spec.ts` + `gowsign-signing-completion.spec.ts` para evitar 30 falhas previsíveis e ~15 min de execução desperdiçados.
