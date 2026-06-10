-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/471

UOWN | Servicing | Allow custom amount entry for Partial Credit Card Refunds

Synopsis
Currently, when performing a Partial Refund for a credit card payment in the Servicing Portal, the system restricts the maximum refundable amount to the original installment value.
The requirement is to remove this restriction so that users can freely choose the refund amount without being constrained to the original installment value.

Business Objective
Improve operational flexibility for Agents handling refunds, enabling them to process credit card partial refunds for amounts different from the original installment, when necessary. 
This will streamline the refund process and avoid manual workarounds.

Feature Request | Business Requirements
Navigation Path to Feature:
Servicing Portal → Customer Information → History Dropdown → Payments → Select Credit Card Payment → Partial Refund.
      Update the frontend logic in the Partial Refund flow to allow custom amounts higher or lower than the original installment amount.
      Ensure there is no automatic limit imposed based on the original installment value.
      Maintain all existing validation rules related to refund processing, except for the original amount restriction.
      Ensure UI reflects the new flexibility and clearly allows amount input without restrictions.
      Validate that changes do not impact other refund types or payment methods.

Davi Artur
@davi.artur.gow
3 dias atrás
Maintainer
@jose.mendesdev Test steps

Navigation Path to Feature:

Servicing Portal → Customer Information → History Dropdown → Payments → Select Credit Card Payment → Partial Refund.

You can read the ticket description to understand better the requirements.
To complete this task, I just removed the paymentAmount field validation when the reverse reason is Partially Refund.
We need to guarantee that this change doesn't affect other types of refund or payment types as the ticket says: Validate that changes do not impact 
other refund types or payment methods

-----

UOWN | Servicing | Permitir entrada de valor customizado para Reembolso Parcial em Cartão de Crédito
Sinopse
Atualmente, ao realizar um Reembolso Parcial para um pagamento com cartão de crédito no Servicing Portal, o sistema restringe o valor máximo reembolsável ao valor da parcela original.
A exigência é remover essa restrição para que os usuários possam escolher livremente o valor do reembolso, sem ficarem limitados ao valor da parcela original.

Objetivo de Negócio
Melhorar a flexibilidade operacional para Agentes que lidam com reembolsos, permitindo processar reembolsos parciais em cartão de crédito com valores diferentes da parcela original, quando necessário.
Isso tornará o processo de reembolso mais ágil e evitará contornos manuais.

Requisição de Feature | Requisitos de Negócio
Navegação: Servicing Portal → Customer Information → History Dropdown → Payments → Selecionar pagamento com Cartão de Crédito → Partial Refund.
Atualizar a lógica do frontend no fluxo de Reembolso Parcial para permitir valores customizados, maiores ou menores que o valor da parcela original.
Garantir que não haja limite automático imposto com base no valor da parcela original.
Manter todas as regras de validação existentes relacionadas ao processamento de reembolsos, exceto a restrição baseada no valor original.
Garantir que a UI reflita a nova flexibilidade e permita claramente a entrada do valor sem restrições.
Validar que as mudanças não impactem outros tipos de reembolso ou métodos de pagamento.

Davi Artur @davi.artur.gow
@jose.mendesdev Passos de teste
Caminho de Navegação para a Feature:
Servicing Portal → Customer Information → History Dropdown → Payments → Selecionar pagamento com Cartão de Crédito → Partial Refund.
Você pode ler a descrição do ticket para entender melhor os requisitos.
Para completar esta tarefa, eu apenas removi a validação do campo paymentAmount quando o motivo de estorno (reverse reason) é “Partially Refund”.
Precisamos garantir que essa mudança não afete outros tipos de reembolso ou métodos de pagamento, conforme indicado no ticket: Validar que as mudanças não impactem outros tipos de reembolso ou métodos de pagamento.

Resumo:
Remover a limitação que atrela o valor do reembolso parcial ao valor da parcela original.
Manter demais validações.
Garantir que a alteração não afete outros fluxos de reembolso/métodos de pagamento.

-----

Alterações dev:
Visão geral 
0
Commits 
1
Pipelines 
1
Alterações 1
Comparar
e
 1 arquivo
+
14
−
3
 components/reverse-payment-modal/index.tsx 
+
14
−
3

Visualizado
@@ -65,9 +65,20 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
    },
    validationSchema: Yup.object({
      comment: Yup.string().required('Comment is required.').min(1).max(500),
      paymentAmount: Yup.number()
        .required('Payment amount is required')
        .min(0.01),
      paymentAmount: Yup.number().when('reverseReason', {
        is: (reason: string) => reason !== 'Partially Refund',
        then: (schema) =>
          schema
            .required('Payment amount is required')
            .min(0.01)
            .max(
              initialPaymentAmount,
              `You can not refund more than the initial payment amount of ${initialPaymentAmountCurrency}`,
            ),
        otherwise: (schema) => schema
            .required('Payment amount is required')
            .min(0.01),
      }),
      reverseReason: Yup.string().required('Reverse reason is required.'),
    }),
    onSubmit: async (values) => {

Visão geral 
1
Commits 
1
Pipelines 
1
Alterações 3
Abrir o tópico 1
Comparar
e
 3 arquivos
+
6
−
10
Arquivos
3
Search (e.g. *.vue) (F)

components/rever
‎se-payment-modal‎

inde
‎x.tsx‎
+1 -5

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 components/reverse-payment-modal/index.tsx 
+
1
−
5

Visualizado
@@ -67,11 +67,7 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
      comment: Yup.string().required('Comment is required.').min(1).max(500),
      paymentAmount: Yup.number()
        .required('Payment amount is required')
        .min(0.01)
        .max(
          initialPaymentAmount,
          `You can not refund more than the initial payment amount of ${initialPaymentAmountCurrency}`,
        ),
        .min(0.01),
      reverseReason: Yup.string().required('Reverse reason is required.'),
    }),
    onSubmit: async (values) => {
 package.json 
+
1
−
1

Visualizado
@@ -29,7 +29,7 @@
    "@tim-soft/react-spring-web": "^9.0.0-beta.36",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.373",
    "@uownleasing/common-ui": "0.0.375",
Davi Artur
Davi Artur
@davi.artur.gow
4 dias atrás
Autor
Maintainer
activity logs improvement

Editado 4 dias atrás por Davi Artur
Responder…
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1802,10 +1802,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.373":
  version "0.0.373"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.373.tgz#a665f17a1bc991587d6dd214525eb1e371d2cdbd"
  integrity sha512-zlluBiBpk4EhAQVmbDnRh3v/QxomHmKyneApkX439Ngi37T8N90wuvpDVrXQ44ZMrQ9mM4DwvV7Wgikg3kZYmw==
"@uownleasing/common-ui@0.0.375":
  version "0.0.375"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.375.tgz#dc9e24c334ec141d8642ac3c17c2019cf70e511a"
  integrity sha512-POaHxR5+f4CBs37g4pJ413xTcY0CR/qzg9fFG1yc5z7zO6hkdgG75QcnF9ARuSSnVDxAtAGye1JOIE+fL7mXIw==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"
            
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_AllowCustomAmountEntryForParcialCreditCardRefunds_Ticket471

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2
> ```gherkin
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"
> Examples:
> | env | state | merchant       | ccPaymentAmount | ccRefundAmountLower | ccRefundAmountEqual | ccRefundAmountGreater | commentShort | commentLong                                                                                                                                                                                                                                                     > | browser |
> | qa2 | NY    | ProgressMobility |  50.00           | 10.00               | 50.00               | 51.00                 | ok          |Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam libero tempore, cum soluta nobis est eligendi opt| chrome  |  
> | PASS | LeadPk: 13417 | AccountPk: 10794 | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_AllowCustomAmountEntryForParcialCreditCardRefunds_Ticket471_QA2_2025_08_25_1033_13820.html](/uploads/acac879ee1d89b909672797d94bcfce4/R7.1.25.43.0_AllowCustomAmountEntryForParcialCreditCardRefunds_Ticket471_QA2_2025_08_25_1033_13820.html)
>
>
>
![471-qa2-_1_](/uploads/e65643902a37c7aafe1fe389fade4368/471-qa2-_1_.png){width=487 height=57}
![471-qa2-_2_](/uploads/9c0ced956d3eedf84957d185b0cacb7b/471-qa2-_2_.png){width=896 height=310}
![471-qa2-_3_](/uploads/0db177e2c3a02023c7b17488cc2e0383/471-qa2-_3_.png){width=896 height=358}
![471-qa2-_4_](/uploads/c59ce2258f7e1b18c91ed4ab40432746/471-qa2-_4_.png){width=559 height=356}
![471-qa2-_5_](/uploads/c64ce09d232b6d6008ab49324343dd86/471-qa2-_5_.png){width=561 height=344}
![image](/uploads/69c8ba94c486b4cd642eaf2b02873867/image.png)
![image](/uploads/5f0890f5865119d9cf4601cdbfceaca3/image.png)
>
>
>




> ## Tests in qa2
> ```gherkin
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"
> Examples:
> | env | state | merchant       | ccPaymentAmount | ccRefundAmountLower | ccRefundAmountEqual | ccRefundAmountGreater | commentShort | commentLong                                                                                                                                                                                                                                                     > | browser |
> | qa2 | NY    | ProgressMobility |  50.00           | 10.00               | 50.00               | 51.00                 | ok          |Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam libero tempore, cum soluta nobis est eligendi opt| chrome  |  
> | PASS | LeadPk: 13417 | AccountPk: 10794 | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_AllowCustomAmountEntryForParcialCreditCardRefunds_Ticket471_QA2_2025_08_25_1033_13820.html](/uploads/acac879ee1d89b909672797d94bcfce4/R7.1.25.43.0_AllowCustomAmountEntryForParcialCreditCardRefunds_Ticket471_QA2_2025_08_25_1033_13820.html)
>
>
>
![471-qa2-_1_](/uploads/e65643902a37c7aafe1fe389fade4368/471-qa2-_1_.png){width=487 height=57}
![471-qa2-_2_](/uploads/9c0ced956d3eedf84957d185b0cacb7b/471-qa2-_2_.png){width=896 height=310}
![471-qa2-_3_](/uploads/0db177e2c3a02023c7b17488cc2e0383/471-qa2-_3_.png){width=896 height=358}
![471-qa2-_4_](/uploads/c59ce2258f7e1b18c91ed4ab40432746/471-qa2-_4_.png){width=559 height=356}
![471-qa2-_5_](/uploads/c64ce09d232b6d6008ab49324343dd86/471-qa2-_5_.png){width=561 height=344}
![image](/uploads/69c8ba94c486b4cd642eaf2b02873867/image.png)
![image](/uploads/5f0890f5865119d9cf4601cdbfceaca3/image.png)
>
>
>

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"
> Examples:
> | env | state | merchant       | ccPaymentAmount | ccRefundAmountLower | ccRefundAmountEqual | ccRefundAmountGreater | commentShort | commentLong                                                                                                                                                                                                                                                     > | browser |
> | stg | NY    | ProgressMobility |  50.00           | 10.00               | 50.00               | 51.00                 | ok          |Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam libero tempore, cum soluta nobis est eligendi opt| chrome  |  
> | PASS | LeadPk: 13417 | AccountPk: 10794 | Merchant: Progress Mobility | 
> ```
>
>

>
>
>

>
>
>