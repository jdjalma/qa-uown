------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/127

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Update the link of Consent for Electronic Disclosures

Update the Consent for Electronic Disclosures link: https://uownleasing.com/electronic-disclosures/
Change the text described as "Consent for Electric Disclosures" to "Consent for Electronic Disclosures".

-----

UOWN | Originação | Atualizar o link do Consentimento para Divulgações Eletrônicas

Atualizar o link do Consentimento para Divulgações Eletrônicas: https://uownleasing.com/electronic-disclosures/
Alterar o texto descrito como "Consent for Electric Disclosures" para "Consent for Electronic Disclosures".
    Assinar contrato com plano de proteção ativo para o merchant
    Assinar plano de proteção sem o plano de proteção

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Atualizar o link do Consentimento para Divulgações Eletrônicas para https://uownleasing.com/electronic-disclosures/ e alterar o texto descrito de "Consent for Electric Disclosures" para "Consent for Electronic Disclosures".    

-----

🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar se o link de Consentimento para Divulgações Eletrônicas foi atualizado corretamente

Scenario: 1 - Verificar se o link de Consentimento para Divulgações Eletrônicas foi atualizado corretamente
  Given que o usuário acessa a página de Consentimento para Divulgações Eletrônicas
  When o usuário clica no link "Consent for Electronic Disclosures"
  Then o usuário deve ser redirecionado para "https://uownleasing.com/electronic-disclosures/"

🔍 Verifique se o link de Consentimento para Divulgações Eletrônicas redireciona corretamente para o endereço atualizado.
📝 Explicação: Esse cenário valida se o link foi atualizado para o novo URL correto.
✅ Resultado Esperado: O link redireciona corretamente para o novo endereço.

-----

Scenario 2 – Verificar se o texto "Consent for Electric Disclosures" foi alterado para "Consent for Electronic Disclosures"

Scenario: 2 - Verificar se o texto "Consent for Electric Disclosures" foi alterado para "Consent for Electronic Disclosures"
  Given que o usuário acessa a página de Consentimento para Divulgações Eletrônicas
  When o usuário verifica o texto exibido na página
  Then o texto deve ser "Consent for Electronic Disclosures"

🔍 Verifique se o texto foi alterado de "Consent for Electric Disclosures" para "Consent for Electronic Disclosures".
📝 Explicação: Este cenário valida que o texto foi atualizado corretamente na página.
✅ Resultado Esperado: O texto exibido deve ser "Consent for Electronic Disclosures".

-----

Scenario 3 – Verificar o link de Consentimento para Divulgações Eletrônicas em diferentes navegadores

Scenario: 3 - Verificar o link de Consentimento para Divulgações Eletrônicas em diferentes navegadores
  Given que o usuário acessa a página de Consentimento para Divulgações Eletrônicas em diferentes navegadores
  When o usuário clica no link "Consent for Electronic Disclosures"
  Then o usuário deve ser redirecionado para "https://uownleasing.com/electronic-disclosures/" em todos os navegadores

🔍 Verifique se o link de Consentimento para Divulgações Eletrônicas funciona corretamente em diferentes navegadores (ex: Chrome, Firefox, Edge).
📝 Explicação: Esse cenário garante que o link seja funcional e redirecione corretamente em múltiplos navegadores.
✅ Resultado Esperado: O link funciona corretamente em diferentes navegadores.

-----

🧾 Resumo dos Requisitos e Cenários
Requisito	Cenário(s) que cobre
Atualizar o link para o Consentimento para Divulgações Eletrônicas	1, 2, 3
Alterar o texto de "Consent for Electric Disclosures" para "Consent for Electronic Disclosures"	2, 4, 5
Garantir que a alteração funcione em dispositivos móveis, diferentes navegadores e interfaces de edição de comerciantes	3, 4, 6

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se o link de Consentimento para Divulgações Eletrônicas redireciona corretamente para o endereço atualizado
Verify that the Consent for Electronic Disclosures link redirects correctly to the updated address

Verifique se o texto foi alterado de "Consent for Electric Disclosures" para "Consent for Electronic Disclosures."
Verify that the text has changed from "Consent for Electric Disclosures" to "Consent for Electronic Disclosures."

Verifique se o link de Consentimento para Divulgações Eletrônicas funciona corretamente em diferentes navegadores
Verify that the Consent for Electronic Disclosures link works correctly across different browsers

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8380 | Progress Mobility | Verify that the Consent for Electronic Disclosures link redirects correctly to the updated address |  | PASS |
| 8381 | Progress Mobility | Verify that the text has changed from "Consent for Electric Disclosures" to "Consent for Electronic Disclosures." |  | PASS |
| 8381 | Progress Mobility | Verify that the Consent for Electronic Disclosures link works correctly across different browsers |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23355 | Tire Agent | Verify that the Consent for Electronic Disclosures link redirects correctly to the updated address |  | PASS |
| -- | -- | Verify that the text has changed from "Consent for Electric Disclosures" to "Consent for Electronic Disclosures." |  | PASS |
| -- | -- | Verify that the Consent for Electronic Disclosures link works correctly across different browsers |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------