--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/986

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Orirgination |Switch Search Panel to the Left for Better User Experience.


Davi Artur @davi.artur.gow

Test Steps for the Search Panel Update


1. Responsiveness Test on Leads Page

Objective: Ensure that the search panel with filters adapts properly to different screen sizes.
- Open the Leads Page in a desktop browser.
- Verify that the search panel is correctly positioned on the left side.
- Test clicking and interacting with filters on each screen size to confirm usability.
- Validate that the page layout does not break at any resolution.


2. Functionality Test on Another Page

Objective: Ensure that filters continue to function as expected.
- Navigate to the overview where filters are used.
- Verify that all filters are visible and positioned correctly.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

quais validacoes de SSN existem em um campo de digitar SSN? Aceita apenas numeros.Outros campos: leadPk,accountPk, phone number
quais validacoes de email existem em um campo de digitar email?


filtros de busca:
data inicial e data final
SSN
email
leadPk
accouuntPk
phone number
customer name
state
lead status
internal status
Merchant
location
search
*criar cenários para os filtros de busca e cenários combinando esses filtros de busca, combinando no minimo 4 filtros simultaneamente. em todos os cenários analisar os resultados apresentados comparando com os filtros inseridos.




--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Feature: Switch Search Panel to the Left for Better User Experience and Search Filter Validations

  # Responsiveness and Layout Validation for Search Panel on Leads Page

  Scenario: 1 - Verificar se o painel de busca está posicionado à esquerda na página de Leads
    Given que a página de Leads está aberta em um navegador desktop
    When o usuário observa o posicionamento do painel de busca
    Then o painel de busca deve estar corretamente posicionado à esquerda

  Scenario: 2 - Verificar se os filtros do painel de busca são clicáveis
    Given que a página de Leads está aberta em um navegador desktop
    When o usuário interage com cada filtro do painel de busca
    Then os filtros devem ser clicáveis e abrir as opções correspondentes

  Scenario: 3 - Verificar que o layout da página de Leads permanece consistente em diversas resoluções
    Given que a página de Leads está aberta em um navegador desktop configurado para resoluções 1920x1080, 1366x768 e 360x640
    When o usuário visualiza a página em cada resolução
    Then o layout da página não deve quebrar
    And os elementos do painel de busca devem permanecer visíveis e funcionais

  # Responsiveness Test on Smartphone Resolution

  Scenario: 4 - Verificar adaptabilidade do painel de busca em resolução de smartphone
    Given que a página de Leads está aberta em um dispositivo móvel com resolução de smartphone
    When o usuário verifica o posicionamento do painel de busca com filtros
    Then o painel de busca deve se adaptar adequadamente à tela do smartphone
    And os filtros devem ser acessíveis e funcionais sem distorções no layout

  # Search Filter Test: Data Inicial e Data Final

  Scenario: 5 - Validar funcionamento dos filtros de Data Inicial e Data Final
    Given que leads estão disponíveis no sistema
    When o usuário insere a Data Inicial "01/01/2025" e a Data Final "31/01/2025" nos filtros de data
    And clica no botão de busca
    Then os resultados devem apresentar leads com datas de criação entre "01/01/2025" e "31/01/2025"
    And a validação dos resultados deve ser confirmada no banco de dados

  # Search Filter Combination Test: SSN, Email, LeadPk e Phone Number

  Scenario: 6 - Validar combinação dos filtros SSN, Email, LeadPk e Phone Number
    Given que leads com os dados SSN "123456789", Email "teste@dominio.com", LeadPk "L12345" e Phone Number "1122334455" estão cadastrados
    When o usuário insere os filtros SSN "123456789", Email "teste@dominio.com", LeadPk "L12345" e Phone Number "1122334455" e clica no botão de busca
    Then os resultados apresentados devem corresponder aos leads com os dados filtrados
    And a validação dos resultados deve ser confirmada no banco de dados
    
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |
| X | X |  |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário 1
Português: Verifique se o painel de busca está à esquerda na página de Leads.
Inglês: Verify if the search panel is on the left of the Leads page.

Cenário 2
Português: Verifique se os filtros do painel de busca são clicáveis.
Inglês: Verify if the search panel filters are clickable.

Cenário 3
Português: Verifique se o layout da página de Leads permanece consistente em resoluções 1920x1080, 1366x768 e 360x640.
Inglês: Verify if the Leads page layout remains consistent at 1920x1080, 1366x768, and 360x640 resolutions.

Cenário 4
Português: Verifique se o painel de busca se adapta à resolução de smartphone.
Inglês: Verify if the search panel adapts to smartphone resolution.

Cenário 5
Português: Verifique se os filtros SSN , Email , LeadPk  e Phone Number retornam os leads correspondentes.
Inglês: Verify if the SSN , Email , LeadPk , and Phone Number filters return the corresponding leads.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |  Observation |
| ------ | ------ | ------ | ------ |
| Verify if the search panel is on the left of the Leads page |  | PASS | | 
| Verify if the search panel filters are clickable |  | PASS | | 
| Verify if the Leads page layout remains consistent at 1920x1080, 1366x768, and 360x640 resolutions |  | PASS | | 
| Verify if the search panel adapts to smartphone resolution. |  | PASS | Smartphone resolution isn't user-friendly, but it matches the previous behavior/layout | 
| Verify if the SSN , Email , LeadPk , and Phone Number filters return the corresponding leads |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------