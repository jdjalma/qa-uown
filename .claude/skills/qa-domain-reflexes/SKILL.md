---
name: qa-domain-reflexes
description: Carregue quando o agent vai criar, validar ou debugar teste que toca em signing, payment, status transition, vendor callback, refund, recovery ou qualquer business action — fornece checklist obrigatório de validações pós-ação (audit log, activity log, rating letter, DB notes). Sem log = nada aconteceu.
disable-model-invocation: true
---

# QA Domain Reflexes — UOWN Leasing

> **Propósito:** catálogo de validações que um QA experiente do UOWN faz **no automático** após cada ação do sistema. Não são heurísticas genéricas de UX — são reflexos de domínio: "ação X sempre implica checar Y, porque o usuário real faz isso."
>
> **Como usar (agents):** `qa-planner` DEVE carregar este arquivo antes de fechar o spec. Para cada passo do cenário, consultar o catálogo — se a ação tiver reflexo listado, incluir as validações no spec como passos obrigatórios.
>
> **Como alimentar (humanos):** toda vez que um bug escapar porque faltou uma validação óbvia, adicione aqui. Sem alimentação o arquivo morre.

---

## Convenção

Cada entrada segue o formato:

```
### Ação
- [ ] Validação 1
- [ ] Validação 2
**Why (user perspective):** razão pela qual o usuário real confere isso
```

---

## 1. Pagamento / Charge

- [ ] Valor cobrado == valor acordado (principal + juros + fees + taxes decompostos)
- [ ] Saldo da conta antes vs. depois (diff == valor pago)
- [ ] Rating letter atualizado (valor e data)
- [ ] Status da parcela/invoice transicionou (pending → paid)
- [ ] Transaction record criado no DB com payment_method correto
- [ ] Log de auditoria gerado (user, timestamp, action)
- [ ] Email/notificação de confirmação enviado
- [ ] Próxima due date recalculada se aplicável

**Why:** usuário confere extrato, quer prova de pagamento, e checa cobranças futuras.

---

## 2. Payment Agreement (acordo de pagamento)

- [ ] Rating letter **antes** da criação do acordo
- [ ] Rating letter **depois** da criação do acordo
- [ ] Novo schedule de pagamento gerado (N parcelas com valores corretos)
- [ ] Soma das novas parcelas == saldo acordado
- [ ] Status da conta atualizado (ex: "On Payment Plan")
- [ ] Documento do acordo disponível para download
- [ ] Log de auditoria
- [ ] Email com termos do acordo

**Why:** usuário guarda o acordo em papel, confere valores parcela a parcela, e usa rating letter para disputas.

---

## 3. Payoff / Quitação

- [ ] Rating letter **antes** do payoff
- [ ] Rating letter **depois** do payoff (saldo zerado)
- [ ] Saldo da conta == 0
- [ ] Status final = "Paid Off" / "Closed"
- [ ] Documento de quitação (payoff letter) gerado e acessível
- [ ] Log de auditoria
- [ ] Email de confirmação de quitação
- [ ] Parcelas futuras canceladas/removidas do schedule

**Why:** usuário precisa da prova de quitação para credit bureau, refinanciamento, ou disputa futura.

---

## 4. Credit Application / Origination

- [ ] Decisão (approved/denied/pending) persistida
- [ ] Score/tier calculado e salvo
- [ ] Log de auditoria da decisão (regra aplicada, timestamp, user/system)
- [ ] Status transition correto (submitted → underwriting → approved/denied)
- [ ] Email ao cliente com resultado
- [ ] Se aprovado: contrato/lease document gerado
- [ ] Se negado: reason codes persistidos (regulatório — ECOA/FCRA)

**Why:** auditoria regulatória exige rastro completo; usuário acompanha status e precisa do motivo da negativa.

### sendApplication — campos obrigatórios por client type

| Client Type | mainNextPayDate obrigatório? | Campos opcionais |
|---|---|---|
| PAY_POSSIBLE | **NÃO** — config YAML exclui `mainNextPayDate` | mainPayFrequency, mainLastPayDate, mainEmploymentDuration |
| SYNCHRONY | **NÃO** — config YAML exclui `mainNextPayDate` | mainPayFrequency, mainLastPayDate, mainEmploymentDuration |
| DANIELS_JEWELERS | **SIM** por padrão (requer cherry-pick `62e2fc20` em `uown-qa1` + pod restart para remover) | — |
| Qualquer outro sem config explícita | **SIM** — default do `LosRequestMessageConstraintValidatorConfig` | — |

**Reflexo:** ao criar CT de sendApplication para PAY_POSSIBLE ou SYNCHRONY, incluir um cenário que omite `mainNextPayDate`, `mainPayFrequency`, `mainLastPayDate` e `mainEmploymentDuration` — valida que a config YAML está correta e o backend não exige campos desnecessários. Se retornar 400 `mainNextPayDate is required`, a causa é config YAML no branch `uown-<env>` (não DB, não `ConfigurationManagement` API).

---

## 5. Refund / Chargeback / Reversal

- [ ] Valor revertido == valor original (ou parcial conforme solicitado)
- [ ] Rating letter atualizado
- [ ] Saldo da conta ajustado corretamente
- [ ] Status da transação original = "refunded" / "reversed"
- [ ] Nova transaction record de reversal criada
- [ ] Log de auditoria (quem autorizou, motivo)
- [ ] Notificação ao cliente

**Why:** usuário confere se estorno entrou na conta bancária e se rating letter reflete.

---

## 6. Late Fee / Penalty

- [ ] Valor aplicado segue regra do contrato (percentual ou flat)
- [ ] Aplicado na parcela correta (não em parcela errada)
- [ ] Rating letter atualizado
- [ ] Log de auditoria (regra aplicada, grace period respeitado)
- [ ] Não aplicado duas vezes para o mesmo atraso

**Why:** fees geram disputa frequente; QA sempre confere se aplicou certo e uma vez só.

---

## 7. Cancelamento / Void

- [ ] Status = canceled/voided
- [ ] Rollback de saldos (se houve cobrança)
- [ ] Rating letter atualizado
- [ ] Parcelas futuras removidas do schedule
- [ ] Log de auditoria (quem cancelou, motivo)
- [ ] Notificação ao cliente
- [ ] Documentos relacionados (contratos) marcados como void

**Why:** usuário confere que não será cobrado após cancelar.

---

## 8. Criação / Edição de Merchant

- [ ] Status inicial correto (active/pending approval)
- [ ] Permissions e limites aplicados
- [ ] Log de auditoria
- [ ] Email de welcome/ativação
- [ ] Dados fiscais (EIN, W9) persistidos
- [ ] Visibilidade correta nos portais (Origination, AMS)

**Why:** merchant mal configurado = problemas em cascata nas aplicações de crédito.

---

## 9. Criação / Edição de Usuário Interno

- [ ] Permissões/role aplicadas
- [ ] Acesso aos portais corretos
- [ ] Log de auditoria (quem criou, role atribuída)
- [ ] Email de welcome com reset de senha
- [ ] MFA configurável

**Why:** controle de acesso é foco de auditoria SOC/PCI.

---

## 10. Login / Autenticação

- [ ] Session criada com expiração correta
- [ ] Log de acesso (IP, user agent, timestamp)
- [ ] Falhas de login registradas (brute force detection)
- [ ] MFA exigido quando configurado
- [ ] Redirect para URL correta pós-login

**Why:** compliance + segurança; auditorias pedem trilha de acesso.

---

## 11. Qualquer Mutation (genérico — CRUD)

Aplicar SEMPRE que não houver reflexo mais específico:

- [ ] Log de auditoria gerado (who, when, what changed, old → new)
- [ ] `updated_at` atualizado
- [ ] `updated_by` preenchido
- [ ] Campos required não aceitam null/empty

**Why:** rastreabilidade regulatória é não-negociável em fintech.

---

## 12. Geração de Documento (contrato, acordo, payoff letter)

- [ ] Documento gerado e persistido (S3/storage)
- [ ] Link de download funciona
- [ ] PDF contém dados corretos (nome, valores, datas, assinaturas)
- [ ] Log de geração
- [ ] Versionamento se documento for regerado

**Why:** usuário baixa e guarda; documento errado vira disputa legal.

---

## 13. Envio de Email / Notificação

- [ ] Email disparado para o endereço correto
- [ ] Template correto (confirmação vs. lembrete vs. cobrança)
- [ ] Dados dinâmicos preenchidos (nome, valor, data)
- [ ] Log de envio (sent, delivered, bounced)
- [ ] Links do email apontam para ambiente correto

**Why:** usuário age a partir do email; email errado = ação errada.

---

## 14. Ativação / Desativação de Programa de Merchant (Origination)

- [ ] `is_active` derivado das datas: `activation_date <= today AND (deactivation_date IS NULL OR deactivation_date > today)` — NÃO confiar no campo `is_active` booleano diretamente
- [ ] `uown_merchant_activity_log` contém entrada com `log_type = 'PROGRAM_DATA_CHANGE'` e `program_pk` correto
- [ ] `uown_merchant_to_program.is_active` reflete o estado calculado após sweep ou chamada de API
- [ ] Propagação para portal de merchant: Programs section exibe badge de status correto (ativo/inativo)
- [ ] Propagação para aplicações existentes: `uown_los_lead.merchant_program_pk` ainda aponta para o programa; programa inativo NÃO impede visualização de aplicações históricas
- [ ] Sweep `ProgramActivationDeactivationSweep` processa datas na virada correta (ativação = dia da `activation_date`; desativação = dia da `deactivation_date`)
- [ ] Validação backend: ativar com `activation_date > deactivation_date` retorna erro (esperado 400 — BUG-01 em qa2 retorna 500)
- [ ] Datas prevalecem sobre flag: Source of Truth são `activation_date`/`deactivation_date`, não o booleano `is_active`

**Why:** config de programa define quais programas de financiamento estão disponíveis para merchant. Programa inativo deve bloquear novas aplicações mas não invalidar histórico.

---

## Checklist-guia para `qa-planner`

Ao montar cada cenário, para cada passo de ação perguntar:

1. Essa ação está no catálogo acima?
2. Se sim → copiar as validações do bloco correspondente como passos do cenário.
3. Se não se encaixa em nenhum bloco específico → aplicar o bloco **11. Qualquer Mutation**.
4. Se a ação combina múltiplos blocos (ex: payment dentro de um agreement) → aplicar os dois.

Marcar no spec quais validações vieram deste catálogo com tag `[reflex]` pra facilitar review humano.
