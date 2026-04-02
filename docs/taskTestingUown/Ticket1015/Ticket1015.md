------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1015

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Set a default minimum value for new leases.

Synopsis
We need to set a minimum lease amount (U$ 250,00). However, the merchant can edit this value if necessary.

Business Objective
Ensure all lease agreements meet the business requirements.

Feature Request | Business Requirements        
The system should enforce a default minimum lease amount of $250.
Merchants should be able to configure and update this amount as needed.

Fernando Martins @fernandogmartins
Testing Steps:

Verify is the new field exists on the merchant configuration
https://gitlab.com/-/project/62182534/uploads/edfc2b41cc1a8b641db2138e3d52fec3/image.png

Validate if the value can be changed, and if the information is being saved.
Verify that when creating a new lease, it will block leases that have a total value lower than the minimum amount from the merchant. 
If the merchant has no minimum amount defined, it should be 250.
https://gitlab.com/-/project/62182534/uploads/77b12324d763b028c2b13fadc903eea2/image.png

Validate if the invoices can be created and finished as usual when the total amount is more than the minimum amount defined.

API
Verify if the endpoints sendApplication and sendInvoice are validating the minimum lease value.

-----

UOWN | Originação | Definir um valor mínimo padrão para novos contratos.

Sinopse
Precisamos estabelecer um valor mínimo de contrato (US$ 250,00). No entanto, o comerciante pode editar esse valor, se necessário.

Objetivo de Negócio
Garantir que todos os acordos de contrato atendam aos requisitos de negócio.

Solicitação de Recurso | Requisitos de Negócio
O sistema deve impor um valor mínimo padrão de contrato de US$ 250.
    verificar valor 249,99
    verificar valor 250,00
Os comerciantes devem poder configurar e atualizar esse valor conforme necessário.

Fernando Martins @fernandogmartins
Passos de Teste:

Verificar se o novo campo existe na configuração do comerciante
https://gitlab.com/-/project/62182534/uploads/edfc2b41cc1a8b641db2138e3d52fec3/image.png
    Verificar se é possivel marcar/desmarcar o campo.
    verificar payload ao marcar/desmarcar
    verificar preview ao marcar/desmarcar
    verificar response ao marcar/desmarcar
    verificar log ao marcar/desmarcar
    verificar banco de dados ao marcar/desmarcar

Validar se o valor pode ser alterado e se a informação está sendo salva.
Confirmar que, ao criar um novo contrato, o sistema bloqueia contratos com valor total inferior ao mínimo definido pelo comerciante.
Se o comerciante não tiver um valor mínimo definido, deve ser 250.
https://gitlab.com/-/project/62182534/uploads/77b12324d763b028c2b13fadc903eea2/image.png

Validar se as faturas podem ser criadas e concluídas normalmente quando o valor total exceder o mínimo definido.
    criar faturas via interface
    criar faturas via API

API
Verificar se os endpoints sendApplication e sendInvoice estão validando o valor mínimo do contrato.

Incluir Testes:

* Criar um lease para um merchant configurado como protection plan e optar por participar e nao participar do plano de protecao
* Criar um lease pela interface para o estado  CA
* Criar um lease pela interface para o estado  TX

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da Tarefa
Definir um valor mínimo padrão para novos contratos
O sistema deve impor um valor mínimo padrão de contrato de US$ 250,00, podendo ser alterado pelos comerciantes. 
Contratos com valor inferior devem ser bloqueados. 
O campo de configuração do valor mínimo deve estar disponível nas configurações do comerciante.

🧪 Cenários de Teste Gherkin


Scenario 1 – Verificar existência do campo de configuração do valor mínimo no perfil do comerciante

Scenario: 1 - Verificar campo de configuração do valor mínimo de contrato no perfil do comerciante
  Given que o usuário acessa a configuração do perfil do comerciante
  When visualiza as configurações do comerciante
  Then o campo para exibir Valor mínimo de locação em 250,00 e deve estar visível e editável

🔍 Verifique se o campo de valor mínimo do contrato está visível e permite edição nas configurações do comerciante.
📝 Explicação: Este teste garante que o recurso esteja acessível e funcional na interface.
✅ Resultado Esperado: O campo aparece e pode ser ativado ou desativado.

-----

Scenario 2 – Verificar comportamento ao marcar e desmarcar o campo de valor mínimo

Scenario: 2 - Verificar comportamento do sistema ao ativar ou desativar o valor mínimo no perfil do comerciante
  Given que o comerciante acessa o campo de valor mínimo
  When o valor mínimo  a configuração
  Then o sistema deve atualizar o preview, payload, response, log e banco de dados conforme a ação

🔍 Verifique se, ao salvar a alteração do valor mínimo de locação, essa mudança é refletida no preview, no payload e na response, além de confirmar se um log é registrado e se o valor é armazenado corretamente no banco de dados
📝 Explicação: Garante que o sistema propague corretamente a mudança da configuração.
✅ Resultado Esperado: Todas as áreas refletem o estado correto da configuração.

quando tento salvar com valor menor que 
-----

Scenario 3 – Validar comportamento ao salvar novo valor mínimo configurado pelo comerciante

Scenario: 3 - Validar se o comerciante pode alterar e salvar o valor mínimo de contrato
  Given que o comerciante acessa o campo de valor mínimo
  When insere um novo valor e salva
  Then o novo valor deve ser persistido e refletido nas próximas validações de contratos

🔍 Verifique se o valor mínimo de locação configurado pelo comerciante é salvo corretamente no banco de dados e um log é registrado
📝 Explicação: Garante que o sistema respeita a configuração personalizada do comerciante.
✅ Resultado Esperado: O novo valor mínimo é persistido corretamente.

-----

Scenario 4 – Bloquear criação de contrato com valor inferior ao mínimo definido

Scenario: 4 - Bloquear contratos com valor inferior ao mínimo configurado
  Given que o valor mínimo definido pelo comerciante é 250
  When o usuário tenta criar um contrato com valor total de 249.99
  Then o sistema deve bloquear a criação do contrato com mensagem de erro apropriada

🔍 Verifique se o sistema impede contratos com valor inferior ao valor mínimo de locação configurado
📝 Explicação: Garante que a regra de negócio é aplicada corretamente.
✅ Resultado Esperado: Contrato é bloqueado com mensagem informativa.

curl --location 'https://svc-qa1.uownleasing.com/uown/los/sendApplication' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' \
--data-raw '{
    "userName": "payTomorrow",
    "setupPassword": "U0wn_payTomorrow",
    "merchantNumber": "OL90294-0001",
    "mainFirstName": "Denise",
    "mainLastName": "Priestley",
    "mainDOB": "01011980",
    "mainSSN": "047987795",
    "emailAddress": "DeniseAPriestley@teleworm.us",
    "mainAddress1": "59 E STERLING POND CIR",
    "mainCity": "SPRING",
    "mainStateOrProvince": "TX",
    "mainPostalCode": "77382",
    "mainCellPhone": "2032865410",
    "mainEmployerName": "Best Buy",
    "mainPastBankruptcy": false,
    "mainCurrentOrFutureBankruptcy": false,
    "languagePreference": "E",
    "iovationFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "mainPayFrequency": "WEEKLY",
    "mainNextPayDate": "04132025",
    "mainLastPayDate": "04062025",
    "mainEmploymentDuration": "_1_TO_2_YEARS",
    "shipToSameAsConsumer": true,
    "merchandiseSubtotal": "249.99",
    "discountAmount": "0.00",
    "deliveryCharge": "0.00",
    "installationCharge": "0.00",
    "salesTax": "0.00",
    "miscellaneousFees": "0.00",
    "depositAmount": "0.00",
    "orderTotal": "249.99",
    "invoiceNumber": "R91931",
    "lineItem": [
        {
            "lineItemLineNumber": "317",
            "lineItemSerialNumber": "S94712065",
            "lineItemProductNumber": "A561SKU283",
            "lineItemProductDescription": "Ottoman",
            "lineItemProductCategory": "Seating",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "144.28",
            "lineItemBasePrice": "144.28",
            "lineItemTaxAmount": "0.00",
            "lineItemExtendedPrice": "144.28"
        },
        {
            "lineItemLineNumber": "318",
            "lineItemSerialNumber": "M68484397",
            "lineItemProductNumber": "A333SKU4444",
            "lineItemProductDescription": "Recliner",
            "lineItemProductCategory": "Seating",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "105.71",
            "lineItemBasePrice": "105.71",
            "lineItemTaxAmount": "0.00",
            "lineItemExtendedPrice": "105.71"
        }
    ]
}
'

-----

Scenario 5 – Permitir criação de contrato com valor igual ou superior ao mínimo

Scenario: 5 - Permitir contratos com valor igual ou superior ao mínimo configurado
  Given que o valor mínimo definido é 250
  When o usuário cria um contrato com valor total de 250 ou superior
  Then o sistema deve permitir a criação do contrato normalmente

🔍 Verifique se contratos com valor igual ou acima do valor deinido para valor mínimo de locação são aceitos pelo sistema
📝 Explicação: Garante que valores válidos não sejam erroneamente bloqueados.
✅ Resultado Esperado: Contrato é criado com sucesso.

-----

Scenario 6 – Validar comportamento da API sendApplication

Scenario: 6 - Validar se a API sendApplication respeita o valor mínimo de contrato
  Given que é feita uma chamada para o endpoint sendApplication
  When o payload contém um valor de contrato inferior ao mínimo configurado
  Then a API deve retornar erro e rejeitar a criação do contrato

🔍 Verifique se a API bloqueia corretamente aplicações com valores abaixo do mínimo.
📝 Explicação: Garante a validação da regra de valor mínimo na camada de backend.
✅ Resultado Esperado: API retorna erro apropriado.

-----

Scenario 7 – Validar comportamento da API sendInvoice

Scenario: 7 - Validar se a API sendInvoice respeita o valor mínimo de contrato
  Given que é feita uma chamada para o endpoint sendInvoice
  When o payload contém um valor de contrato inferior ao mínimo configurado
  Then a API deve retornar erro e não processar a fatura

🔍 Verifique se o endpoint sendInvoice valida o valor mínimo antes de processar a fatura.
📝 Explicação: Impede criação de faturas ilegítimas via API.
✅ Resultado Esperado: Fatura é rejeitada quando o valor não cumpre o mínimo.

-----

Scenario 8 – Criar lease com plano de proteção (opt-in e opt-out)

Scenario: 8 - Criar lease com plano de proteção ativado e desativado
  Given que o merchant está configurado com plano de proteção
  When o usuário cria um lease optando por participar e outro por não participar do plano
  Then o sistema deve respeitar a escolha e aplicar corretamente o valor do contrato

🔍 Verifique se o plano de proteção é opcional e influencia corretamente o valor final do lease.
📝 Explicação: Garante flexibilidade da regra conforme a escolha do cliente.
✅ Resultado Esperado: Contratos são tratados conforme a escolha do plano.

OptIn: 8321 e 8322
OptOut: 8323
-----

Scenario 9 – Criar lease pela interface para estado da Califórnia (CA)

Scenario: 9 - Criar lease pela interface para o estado CA
  Given que o usuário seleciona o estado CA na criação do contrato
  When um contrato válido é preenchido e enviado
  Then o sistema deve aceitar e processar corretamente o lease

🔍 Verifique se a criação do contrato no estado da Califórnia ocorre com sucesso.
📝 Explicação: Valida aplicação da regra para localização específica.
✅ Resultado Esperado: Lease criado com sucesso no estado CA.

8315 e 8324
-----

Scenario 10 – Criar lease pela interface para o estado do Texas (TX)

Scenario: 10 - Criar lease pela interface para o estado TX
  Given que o usuário seleciona o estado TX na criação do contrato
  When um contrato válido é preenchido e enviado
  Then o sistema deve aceitar e processar corretamente o lease


🔍 Verifique se o lease é processado corretamente para o estado do Texas.
📝 Explicação: Garante funcionamento do sistema em estados com possíveis regras diferentes.
✅ Resultado Esperado: Lease criado com sucesso no estado TX.

8323, 8322, 8321, e 8320

-----

Scenario: 11 - Criar lease com valor dos produtos abaixo de 250, mas com taxas que elevam o total acima do mínimo

Scenario: 11 - Criar lease com valor dos produtos abaixo de 250, mas com taxas que elevam o total acima do mínimo
  Given que o comerciante possui o valor mínimo de contrato configurado como 250
  And o usuário preenche o contrato com produtos cujo subtotal é inferior a 250
  And adiciona taxas e encargos que elevam o valor total acima de 250
  When o contrato é enviado para processamento
  Then o sistema deve aceitar o lease e criar o contrato normalmente

🔍 Verifique se o sistema permite a criação de contratos cujo subtotal dos produtos é menor que $250, mas o valor final (com taxas) ultrapassa o mínimo configurado.
📝 Explicação: Esse cenário garante que o sistema considera o total final (e não apenas o valor dos produtos) para aplicar a regra de valor mínimo.
✅ Resultado Esperado: Contrato aceito e lease criado com sucesso.

-----

Scenario 12 – Tentar criar novo invoice abaixo de 250 após cancelamento de invoice válido

Scenario: 12 - Impedir novo invoice com valor abaixo de 250 após cancelamento de invoice válido
  Given que o usuário cria um lease com valor total acima de 250
  And o invoice inicial é cancelado
  When o usuário tenta criar um novo invoice com valor inferior a 250
  Then o sistema deve rejeitar o novo invoice devido ao valor mínimo de contrato

🔍 Verifique se o sistema impede a criação de um novo invoice com valor abaixo do mínimo, mesmo após cancelamento de um anterior válido.
📝 Explicação: Garante que a regra de valor mínimo continue sendo aplicada mesmo em fluxos alternativos como cancelamento e nova tentativa.
✅ Resultado Esperado: O novo invoice é rejeitado com mensagem informando o não cumprimento do valor mínimo.

-----

Scenario 13 – Configurar valor mínimo acima de 250 e validar rejeição de lease abaixo do mínimo configurado

Scenario: 13 - Impedir criação de lease com valor abaixo do Minimum Lease Amount configurado
  Given que o comerciante configura o Minimum Lease Amount como 300
  And o usuário tenta criar um lease com valor total de 280
  When o contrato é enviado para processamento
  Then o sistema deve rejeitar o lease com base no novo valor mínimo configurado

🔍 Verifique se o sistema respeita o valor mínimo personalizado definido pelo comerciante e impede leases abaixo desse valor.
📝 Explicação: Esse cenário garante que a personalização da configuração Minimum Lease Amount esteja sendo aplicada corretamente.
✅ Resultado Esperado: O lease é rejeitado com mensagem de validação relacionada ao valor mínimo do comerciante.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.
Verifique se a alteração do valor mínimo de locação é refletida no preview, payload e response, e confirme se um log é registrado e o valor é armazenado corretamente no banco de dados.
Check if saving the minimum rental value change reflects in the preview, payload, and response, and confirm if a log is recorded and the value is correctly stored in the database.

2.
Confirme se o valor mínimo de locação definido pelo comerciante é salvo corretamente no banco de dados e um log é registrado.
Verify if the minimum rental value set by the merchant is correctly saved in the database and a log is recorded.

3.
Garanta que o sistema impede contratos com valores abaixo do valor mínimo de locação configurado.
Ensure the system prevents contracts with values below the configured minimum rental value.

4.
Confirme que o sistema aceita contratos com valores iguais ou acima do valor mínimo de locação definido.
Confirm the system accepts contracts with values equal to or above the defined minimum rental value.

5.
Verifique se a API bloqueia corretamente aplicações com valores abaixo do mínimo
Verify if the API correctly blocks applications with values below the minimum

6.
Confirme se o endpoint sendInvoice valida o valor mínimo antes de processar a fatura
Check if the sendInvoice endpoint validates the minimum value before processing the invoice.

7.
Verifique se o sistema permite criar contratos cujo subtotal dos produtos é inferior a $250, mas o valor final (com taxas) supera o mínimo configurado
Confirm if the system allows creating contracts where the product subtotal is below $250, but the final value (with fees) exceeds the configured minimum

8.
Garanta que o sistema impede a criação de um novo invoice com valor abaixo do mínimo, mesmo após o cancelamento de um anterior válido
Ensure the system prevents creating a new invoice with a value below the minimum, even after canceling a previously valid one

9.
Confirme se o sistema respeita o valor mínimo personalizado do comerciante e impede locações abaixo desse valor
Verify if the system respects the merchant’s custom minimum value and prevents leases below it

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | -- | Check if saving the minimum rental value change reflects in the preview, payload, and response, and confirm if a log is recorded and the value is correctly stored in the database. |  | PASS |
| -- | -- | Verify if the minimum rental value set by the merchant is correctly saved in the database and a log is recorded. |  | PASS |
| 8315 | Progress Mobility | Ensure the system prevents contracts with values below the configured minimum rental value. |  | PASS |
| 8319 | Progress Mobility | Confirm the system accepts contracts with values equal to or above the defined minimum rental value. |  | PASS |
| 8319 | Progress Mobility | Verify if the API correctly blocks applications with values below the minimum |  | PASS |
| -- | Progress Mobility | Check if the sendInvoice endpoint validates the minimum value before processing the invoice. |  | PASS |
| 8325 | Progress Mobility | Confirm if the system allows creating contracts where the product subtotal is below $250, but the final value (with fees) exceeds the configured minimum |  | PASS |
| 8325 | Progress Mobility | Ensure the system prevents creating a new invoice with a value below the minimum, even after canceling a previously valid one |  | PASS |
| -- | Progress Mobility | Verify if the system respects the merchant’s custom minimum value and prevents leases below it |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.
Verifique se a alteração do valor mínimo de locação é refletida no preview, payload e response, e confirme se um log é registrado e o valor é armazenado corretamente no banco de dados.
Check if saving the minimum rental value change reflects in the preview, payload, and response, and confirm if a log is recorded and the value is correctly stored in the database

2.
Garanta que o sistema impede contratos com valores abaixo do valor mínimo de locação configurado
Ensure the system prevents contracts with values below the configured minimum rental value

3.
Verifique se a API bloqueia corretamente aplicações com valores abaixo do mínimo
Verify if the API correctly blocks applications with values below the minimum

4.
Confirme se o endpoint sendInvoice valida o valor mínimo antes de processar a fatura
Check if the sendInvoice endpoint validates the minimum value before processing the invoice

5.
Verifique se o sistema permite criar contratos cujo subtotal dos produtos é inferior a $250, mas o valor final (com taxas) supera o mínimo configurado
Confirm if the system allows creating contracts where the product subtotal is below $250, but the final value (with fees) exceeds the configured minimum

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | Progress Mobility | Check if saving the minimum rental value change reflects in the preview, payload, and response, and confirm if a log is recorded and the value is correctly stored in the database |  | PASS |
| -- | Progress Mobility | Ensure the system prevents contracts with values below the configured minimum rental value |  | PASS |
| -- | Progress Mobility | Verify if the API correctly blocks applications with values below the minimum |  | PASS |
| -- | Progress Mobility | Check if the sendInvoice endpoint validates the minimum value before processing the invoice |  | PASS |
| -- | Progress Mobility | Confirm if the system allows creating contracts where the product subtotal is below $250, but the final value (with fees) exceeds the configured minimum |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------