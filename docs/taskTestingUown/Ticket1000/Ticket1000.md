--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1000

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Include Username in BE Calls During Signing Flow

Feature Request | Business Requirements
Modify the Frontend Origination to send the username in all API requests to the backend during the signing flow.
Send the username as IFrame or MerchantPortal, depending on where the user is executing the flow.

Marcos Silvano @marcos.pacheco.silva

Test instructions:
scenario 1
user logged in the portal

assertions:

After completing the signing flow logged in the portal, the notes for that lead should includes entries for internal logs by a user id 'MerchantPortal-'

------------------------------------------------------------

scenario 2
user logged not logged in the portal (simulating a customer using the completeApplication)

assertions:

Complete the signing flow, the notes in this situation must have entries in the internal logs by a user id 'MerchantPortal'

------------------------------------------------------------

scenario 3
user completes the signflow in an iframe (tireagent)

not completely reproducible outside staging

assertions:

Same assertions as the other scenarios but the user id must be 'IFrame'

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: UOWN Origination - Incluir Username nas chamadas BE durante o fluxo de assinatura

  # Cenário 1: Usuário logado no portal
  Scenario: Usuario logado no portal
    Given que o usuário esteja logado no portal
    When o usuário completa o fluxo de assinatura
    Then as notas do lead devem incluir entradas de logs internos com user id "MerchantPortal-"

  # Cenário 2: Usuário não logado no portal (simulando cliente no completeApplication)
  Scenario: Usuario não logado no portal
    Given que o usuário não esteja logado no portal
    When o usuário completa o fluxo de assinatura
    Then as notas do lead devem incluir entradas de logs internos com user id "MerchantPortal"

  # Cenário 3: Usuário completa o fluxo de assinatura via iFrame
  Scenario: Usuario completa o fluxo via iFrame
    Given que o usuário acesse o fluxo de assinatura por meio de iFrame (ex.: TireAgent)
    When o usuário finaliza o fluxo de assinatura
    Then as notas do lead devem incluir entradas de logs internos com user id "IFrame"

Observações sobre cada cenário:

Cenário 1: 
Testa o caso em que o usuário está logado diretamente no portal (Merchant Portal). 
Ao concluir a assinatura, deve haver registros de log indicando que o usuário é "MerchantPortal-" (com hífen no final).

Cenário 2: 
Simula o cliente que acessa o fluxo (por exemplo, via link) sem estar logado no portal. 
Nesse caso, os registros de log devem mostrar "MerchantPortal" (sem hífen).

Cenário 3: 
O usuário conclui a assinatura em um potal de parceiro.
Aqui, os registros devem mostrar "IFrame" como user id.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12042 | WeGetFinancing | Verify that, when accessing the flow without being logged into the portal, the log records indicate "MerchantPortal" (without a hyphen) |  | PASS |
| 12049 | Pay Tomorrow | Verify that, upon completing the subscription with the user logged in directly to the Merchant Portal, the log records indicate "MerchantPortal-" (with a hyphen at the end) |  | PASS |
| 12053 | Tire Agent | Verify that, upon completing the subscription in a partner portal, the log records indicate "IFrame" as the user ID |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao concluir a assinatura com o usuário logado diretamente no Merchant Portal, os registros de log indicam "MerchantPortal-" (com hífen no final)
Verify that, upon completing the subscription with the user logged in directly to the Merchant Portal, the log records indicate "MerchantPortal-" (with a hyphen at the end)

Verifique se, ao acessar o fluxo sem estar logado no portal, os registros de log indicam "MerchantPortal" (sem hífen)
Verify that, when accessing the flow without being logged into the portal, the log records indicate "MerchantPortal" (without a hyphen)

Verifique se, ao concluir a assinatura em um portal de parceiro, os registros de log indicam "IFrame" como user ID
Verify that, upon completing the subscription in a partner portal, the log records indicate "IFrame" as the user ID

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**html para usar no site**

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Full-Screen Iframe</title>
<style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden; /* Para evitar rolagem */
        }
 
        iframe {
            width: 100vw;
            height: 100vh;
            border: 2px; /* Remove a borda do iframe */
        }
</style>
</head>
<body>
<h1>The iframe element</h1>
 
<iframe src="http://localhost:3000/completeApplication?uuid=78144dbf-02d8-40ba-a8d6-c795a618b9a0_3972141221077663744&selectedPaymentFrequency=MONTHLY&isBranded=false" title="Full Screen Iframe">
</iframe>
 
</body>
</html>

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12042 | WeGetFinancing | Verify that, when accessing the flow without being logged into the portal, the log records indicate "MerchantPortal" (without a hyphen) |  | PASS |
| 12049 | Pay Tomorrow | Verify that, upon completing the subscription with the user logged in directly to the Merchant Portal, the log records indicate "MerchantPortal-" (with a hyphen at the end) |  | PASS |
| 12053 | Tire Agent | Verify that, upon completing the subscription in a partner portal, the log records indicate "IFrame" as the user ID |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------