---
name: user-journey-perspective
description: Carregar para forçar perspectiva de cliente/agent real (não de dev) — pergunta "o cliente vê isso? o agent vê isso? o que ele faria a seguir?". Consulta jornada-completa-lease.md e diferencia portais Website (customer) vs Servicing (agent).
disable-model-invocation: true
---

# User Journey Perspective — sair da cabeça do dev, entrar na do usuário

> "Website" no UOWN é o portal do CLIENTE; "Servicing" é o portal do AGENT (`feedback_portal_naming`). Errar essa distinção em planejamento de teste gera testes que não cobrem o que o cliente realmente faz.

## Quando aplicar

- Após scope/AC/strategy, antes do SPEC final, para sanity-check de perspectiva.
- Pipeline `new-flow` com fluxo customer-facing — sempre.
- Cenário envolve >1 portal — clarificar quem faz o quê.
- Bug ticket descrito do ponto de vista do dev/log — traduzir para o ponto de vista do customer/agent.
- Revisão de SPEC onde os passos parecem mais "chamadas de API" que "ações de pessoa".

## Princípios

1. **Customer ≠ Agent ≠ Admin.** Três personas; três jornadas; três níveis de informação visíveis.
2. **Cliente é mobile real.** Customer não está num MacBook em escritório com 1440px — está no celular, com má conexão.
3. **Pergunta-mestra:** "o cliente vê isso? o agent vê isso? o que ele faria a seguir?"
4. **Jornada é narrativa, não fluxograma.** Pessoas têm contexto (já é cliente? primeira vez? abandonou ontem?).
5. **Confiar em `docs/user-stories/jornada-completa-lease.md`** como spec de jornada quando aplicável.

## Personas (UOWN)

### Customer (cliente final)

- **Portal:** Website (`feedback_portal_naming`).
- **Device:** mobile real (smartphone), conexão variável, atenção curta.
- **Conhecimento:** zero sobre lease internals. Espera fluxo guiado.
- **Sub-personas:**
  - *Novo cliente:* primeira vez no UOWN; precisa criar account, KYC, signing.
  - *Returning cliente:* já tem account; chega via novo merchant, novo lease, ou via Account Portal.
- **Pontos de dor recorrentes:**
  - OTP no email — TTL, spam, atrasos.
  - Plaid / MX link — quebra mid-flow, sai do app.
  - GowSign iframe — tela pequena, scroll difícil.
  - Read mode GoSign mobile (zoom de fonte — `project_gosign_rollout`).
  - PDF rendering — coluna pequena ou faltante (caso CA).
- **Pergunta-guia:** "Cliente está com pressa, no celular, no caixa da loja — esse passo é claro?"

### Agent (UOWN ou merchant ops)

- **Portal:** Origination (criar/completar lease) + Servicing (gerenciar lease pós-assinatura) + AMS (administração avançada).
- **Device:** desktop 1440px+ (regra #15 — Bootstrap `d-lg-block`).
- **Conhecimento:** treinado no produto, conhece termos (OEP, EPO, NSF, dunning, NACHA).
- **Sub-personas:**
  - *Merchant agent:* funcionário do merchant; vê só leads próprios.
  - *UOWN support agent:* vê todos; mais permissões.
  - *Approval agent vs Read-only:* matriz de role afeta o que cada um faz.
- **Pontos de dor recorrentes:**
  - Lead em estado errado / não consegue avançar.
  - Customer não recebeu OTP — agent precisa reenviar.
  - Edit invoice — re-issue de contrato (`feedback_qa_flow_scope_dual_brand_lease_edit`).
  - Refund / void de lease.
- **Pergunta-guia:** "Agent está em escritório, multi-tab, esse erro/log é actionable?"

### Admin / Ops

- **Portal:** AMS (administração); às vezes acesso direto a admin endpoints (ex: `POST /uown/createOrUpdateSqlConfig` — `reference_sqlconfig_admin_endpoint`).
- **Device:** desktop.
- **Conhecimento:** acesso a config interna, SQL config, merchant programs, templates.
- **Sub-personas:** dev/ops vs Yuri (decisão), vs business.
- **Pergunta-guia:** "Quem corrige config drift? Como audita?"

## Procedimento

### Passo 1 — Identificar todas as personas do fluxo

Para cada cenário, lista:
- Quem inicia?
- Quem reage?
- Quem precisa ver o resultado?

Exemplo: "Customer assina lease" tem:
- Customer (Website, mobile)
- Agent (Servicing) — vê lead avançar
- Merchant (talvez por email automático)
- Possivelmente admin (audit log)

### Passo 2 — Mapear jornada por persona

Para cada persona, narrar a sequência de telas/ações DO PONTO DE VISTA DELA:

```
Customer:
  1. Clica link no email do merchant ("Complete your application")
  2. Chega no Website /{shortCode}/complete
  3. Vê resumo do lease (cash price, schedule)
  4. Preenche missing data se houver
  5. Submit → vê confirmação
  6. Recebe email com link de signing
  7. Clica link, chega no signing flow
  8. Lê contrato (GowSign iframe), assina
  9. Vê confirmação de signing
  10. Recebe email de welcome no Account Portal
```

Cada passo é alvo potencial de teste. Cada passo tem oráculo: "o que o customer espera ver agora?"

### Passo 3 — Cross-portal check

Quando uma ação em um portal afeta outro, marca explicitamente:

| Customer faz no Website | Aparece em Servicing? | Em AMS? | Activity log? |
|---|---|---|---|
| Submit lease | Sim — lead muda status | Sim — DB | Sim (regra #13) |
| Assina contrato | Sim — status SIGNED | Sim | Sim |
| Solicita refund | Sim — task aberta pro agent | Sim | Sim |

Cada SIM é assertion candidata.

### Passo 4 — Pontos onde a jornada quebra (real-world)

Pra cada passo, pergunta:
- E se o customer fecha o navegador?
- E se o OTP expira antes do clique?
- E se a conexão cai durante o signing?
- E se o customer tenta voltar (back button)?
- E se ele já tinha account?
- E se ele tem outro lease ativo?

Cada cenário "e se" candidato a teste.

### Passo 5 — Consultar jornada-completa-lease

`docs/user-stories/jornada-completa-lease.md` é a fonte da verdade para jornadas multi-portal. Se o cenário tocar lease completo, alinhar com este doc antes de inventar passos.

### Passo 6 — Output

```markdown
## User Journey Perspective — {cenário}

### Personas envolvidas
- Customer (Website, mobile) — inicia/reage em: passos X, Y
- Agent (Servicing) — reage em: passo Z
- Admin (AMS) — visibilidade em: passo W

### Jornada Customer
1. {ação} — onde está, o que vê, o que espera
2. ...

### Jornada Agent
1. ...

### Cross-portal assertions
- Customer ação X → Agent vê Y → Admin vê Z

### Pontos de quebra (real-world)
- Customer abandona em passo N → comportamento esperado?
- OTP expira → fluxo de re-emissão visível?
- ...

### Assertions visuais obrigatórias (do ponto de vista do user)
- Customer no Website passo 5: vê texto "..." (não vê erro técnico)
- Agent no Servicing após X: vê badge "SIGNED" + linha de activity log

### Referência
- docs/user-stories/jornada-completa-lease.md § {seção}
```

## Heurísticas

- **"Errar nome de portal = errar persona."** "Website" é cliente; "Servicing" é agent. Sempre nomear explicitamente (`feedback_portal_naming`).
- **"Mobile-first para customer."** Se o teste customer roda só em desktop 1440px, NÃO captura a experiência real. Mobile viewport opcional pra customer flows críticos.
- **"Cliente não lê logs."** Validar o que ele vê — texto, badge, redirect. Log é assertion paralela (regra #13), não substituta.
- **"E se ele faz X fora de ordem?"** Customers/agents fazem coisas inesperadas. Back button, refresh, abrir em nova aba.
- **"Email = passo da jornada."** Não é detalhe técnico. Clicar no link real do email (`feedback_email_imap_click_link`) é o fluxo real.
- **"Returning vs novo."** Sempre verifica: jornada cobre returning customer? (Login? Account já existe? Side-effects?)
- **"Agent com role X."** Não assumir agent omnipotente. Role matrix afeta o que ele vê e pode fazer.

## Output esperado

Documento de jornada por persona (template acima). 50–150 linhas dependendo da complexidade. Sempre nomeia portal explicitamente. Sempre lista cross-portal assertions quando aplicável.

## Anti-patterns

- Chamar portal pelo nome em inglês sem distinguir customer vs agent — confunde (`feedback_portal_naming`).
- Descrever jornada do ponto de vista do dev ("chama endpoint X, salva em DB Y") — não é jornada.
- Ignorar mobile pra customer flows — assume desktop universalmente.
- Assertion só técnica (DB row, response code) sem assertion visual quando a persona é customer-facing.
- Esquecer email/SMS como passos da jornada — são touchpoints reais.
- Não consultar `jornada-completa-lease.md` quando aplicável — reinventa passos com erro.
- Misturar agent e customer no mesmo "user" sem distinguir.

## Exemplos curtos (domínio UOWN)

### Exemplo 1 — Cenário "Customer assina e merchant é notificado"

Personas: Customer (Website mobile) + Merchant agent (Servicing desktop) + Admin (AMS, observa).

Jornada Customer (mobile):
1. Email "Sign your lease" chega → clica link (não usar URL da API — `feedback_email_imap_click_link`).
2. Website abre signing page. Vê resumo + iframe GoSign (com read mode toggle se merchant configurado).
3. Lê, scrolla, assina.
4. Vê confirmation page.

Jornada Merchant agent (desktop):
1. Já estava em Servicing/lead/{id}. Status era LEASED.
2. Page atualiza (manual refresh ou polling) → status agora SIGNED.
3. Badge "SIGNED" visível, activity log atualizado.

Cross-portal assertion: lead.status mudou de LEASED → SIGNED em ambos os portais; activity log `uown_los_lead_notes` tem row SIGNATURE_COMPLETED.

Pontos de quebra:
- Customer fecha browser depois do "assinar" — sessão GoSign continua processando? Status correto eventualmente?
- Customer no mobile pequeno (375px) — iframe GoSign legível? Read mode disponível?

### Exemplo 2 — "Agent edita invoice e customer re-submete"

Personas: Agent (Origination desktop) + Customer (Website mobile).

Jornada Agent:
1. Em Origination/lead/{id}. Clica "Create new invoice" / edit existing.
2. Modifica amount.
3. Sistema gera novo redirectUrl. Agent vê confirmação.

Jornada Customer:
1. (Antes — está em Complete page antiga). Talvez já tentou submit e falhou.
2. Recebe novo link (email ou direto) → abre NOVA Complete page com novo amount.
3. Submit.

Cross-portal: count de `submitApplication` chamadas = 1 por submit; `[CONFIRMADO]` regra dual-brand + lease-edit (`feedback_qa_flow_scope_dual_brand_lease_edit`).

### Exemplo 3 — "Customer abandona em signing, volta dia seguinte"

Jornada do customer:
1. (D-1) Recebe email signing, clica, abre Website. Vê iframe, ABANDONA.
2. (D+0) Volta — usa link do email de novo? Email ainda válido? Lead state ainda permite signing?
3. Assina.

Pontos de quebra:
- Link tem TTL? Customer vê erro útil se expirou?
- Lead state poderia ter mudado (timeout server-side, cancellation by ops)?
- Activity log do D-1 (started_signing) presente? D+0 (completed_signing) presente?

### Exemplo 4 — "Refund flow"

Personas: Agent (Servicing) inicia; Customer (Website) NÃO vê fluxo direto, mas vê side-effect (refund creditado, email).

Jornada Agent:
1. Em Servicing/account/{id}/payments.
2. Identifica payment a refund.
3. Clica "Refund", confirma amount.
4. Sistema dispara vendor (Repay/Tilled). Tarefa abre.

Customer NÃO vê tela — só:
- Email "Your refund has been processed"
- Account portal mostra crédito.

Assertion: agent UI mostra status atualizado; customer email enviado; activity log com refund_initiated + refund_completed.

Quando NÃO aplicar fluxo "customer só recebe email": refund parcial complexo, customer talvez precise confirmar — checar AC.

## Referências

- `docs/user-stories/jornada-completa-lease.md`
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- memory: `feedback_portal_naming`, `feedback_email_imap_click_link`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`
