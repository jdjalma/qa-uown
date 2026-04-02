# Relatorio de Erros Identificados — Task #477

> **Task:** UOWN | SVC | New TireAgent Flow (return 16-month) and (second look)
> **GitLab:** https://gitlab.com/uown/backend/svc/-/work_items/477
> **Data:** 2026-03-23
> **Total de erros de aplicacao:** 0

## Conclusao

Nenhum erro de aplicacao identificado no SVC.

O campo `isEligibleForExtraInfo` esta presente na resposta da API `sendApplication` (confirmando que o MR !1302 esta deployado). O SVC repassa fielmente o valor recebido do GDS.

## Bloqueio Identificado (NAO e bug do SVC)

O modelo do GDS (DataView360, campaign 137) retorna `is_eligible_for_extra_info=false` para o SSN 100000053 em **todos os ambientes testados** (qa1 e sandbox). Nenhum lead em todo o qa1 possui `is_eligible_for_extra_info=true` (distribuicao: 9.416 null + 237 false + 0 true).

### Evidencias

**sandbox (execucao automatizada):**
```
appApprovalStatus=DECLINED
isEligibleForExtraInfo=false
paymentDetailsList=[]
transactionMessage=Denied due to address mismatch
authorizationNumber=95697
```

**qa1 (execucao manual via Postman):**
```
appApprovalStatus=DECLINED
isEligibleForExtraInfo=false
paymentDetailsList=[]
transactionMessage=Application denied (UW)
authorizationNumber=11132
```

**qa1 DB — resposta GDS (lead 11131):**
```json
{
    "decision": "REJECT",
    "adverseReasonDescription": "['Rejected by CR Lambda Model']; UW_DENIED",
    "campaignId": 137,
    "lambdaSegment": 20,
    "isEligibleForExtraInfo": false,
    "creditLimit": 0,
    "decisionAgent": "GDS"
}
```

### Acao Necessaria

Para desbloquear os testes, o time do GDS/DataView360 precisa:
1. Configurar o campaign 137 para retornar `is_eligible_for_extra_info=true` quando o SSN 100000053 e rejeitado
2. OU fornecer um SSN de teste que o GDS ja retorna com `is_eligible_for_extra_info=true`
