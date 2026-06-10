------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1088

UOWN | Originação | Incluir taxa de compra na tela de termos do contrato
Aberto
  Tíquete criado 6 dias atráspor 
Yuri Araujo
Sinopse
Este bilhete destina-se a implementar a exibição da taxa fixa de compra de 90 dias no Tela de Termos do Contrato no fluxo de aplicação do cliente. Essa mudança faz parte de uma estratégia promocional maior que inclui a distribuição de cartões-presente e é necessária para visibilidade jurídica e comercial. A lógica de backend (alteração de SQL) já está em vigor para aplicar a taxa ao contrato de locação gerado; este ticket se concentra exclusivamente na atualização da UI para maior clareza e conformidade.

Objetivo do negócio
Permita que os clientes visualizem e reconheçam a taxa fixa de aquisição antes de assinar seus contratos de locação, garantindo transparência e alinhamento com os termos promocionais. A promoção começa 7 de agosto, e esta atualização da UI é essencial para a conscientização do cliente e conformidade regulatória durante a execução do contrato.

Solicitação de recurso | Requisitos de negócios
Atualizar a tela dos Termos do Contrato incluir o valor fixo da taxa de aquisição de 90 dias, em um formato claro e proeminente.
Incluir taxa sobre o valor do EPO
O documento do contrato de arrendamento já contém a taxa de aquisição por meio de uma alteração de SQL. Não são necessárias alterações na geração de documentos neste ticket.
Nenhuma alteração é necessária no módulo de geração de contratos ou assinatura de documentos, apenas a tela "termos de acordo" que precede o documento.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Aplicar taxa de compra ao pagar o saldo de EPO dentro do período elegível
  Dado uma conta com saldo de EPO disponível para quitação antecipada
  E a data de pagamento está dentro do período elegível de 90 dias para quitação
  Quando for realizado o pagamento do valor total do saldo de EPO
  Então a taxa de compra deve ser adicionada ao valor total do saldo de EPO pago
  E o log deve registrar o valor total pago incluindo a taxa de compra
  E no banco de dados, nas transações de cartão de crédito, deve ser armazenado o valor pago incluindo a taxa de compra


-----

> ## Tests in sandbox
> ```gherkin
> Given an account with an EPO balance available for early payoff
>
> ### Scenario: Apply buyout fee when paying the EPO balance within the eligible period
> And the payment date is within the 90-day early payoff eligibility period
> When the full EPO balance amount is paid
> Then the buyout fee should be added to the total EPO balance paid
> And the log should record the total amount paid including the buyout fee
> And in the database, in the credit card transactions, the total amount paid including the buyout fee should be stored
> | ERROR | LeadPk: 91292 | AccountPk: 5857 | Merchant: Progress Mobility | 
> The purchase fee is not added to the total amount of the EPO balance paid
> ```
>
>

>
>
------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in -
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> 