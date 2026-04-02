------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1064

# UOWN | Origination | Add "Reference Merchant Code" Field to Sales Rep Section (renamed: Merchant Info) on Lead Page

## Status
Open
Ticket created 4 weeks ago by Yuri Araujo

## Synopsis
In the Origination Portal, when accessing a lead and viewing customer information, there is a section currently labeled **Sales Rep** that displays data related to the sales representative. This section should be renamed to **Merchant Info**, as it will now include broader merchant-related details.

### New Fields to be Added:
- **Reference Merchant Code** – displays the merchant code linked to the lead.
- **Client Type** – displays the type of client associated with the merchant.

See screenshot for visual guidance.

## Business Objective
Provide greater visibility and context regarding the Merchant associated with the lead directly within the UI, supporting business teams and customer service with easier tracking and analysis.

## Feature Request | Business Requirements
- Rename **Sales Rep** section to **Merchant Info** on the lead detail page.
- Add **Reference Merchant Code** field.
- Add **Client Type** field.
- The new fields should be placed **below the Primary Email field**, as shown in the provided mockup.
- Values must reflect data from the **linked Merchant entity**.
- Fields must be **read-only** and **only visible if data is available**.
- Ensure proper display and data retrieval in all environments: **Sandbox, QA, and Staging**.
- Validate against mockup and ensure **cross-browser and responsive compatibility**.


------

# UOWN | Origination | Adicionar campo "Reference Merchant Code" à seção Sales Rep (renomeada para Merchant Info) na página de Lead

## Status
Aberto
Tíquete criado há 4 semanas por Yuri Araujo

## Sinopse
No Portal Origination, ao acessar um lead e visualizar as informações do cliente, há uma seção atualmente chamada **Sales Rep**, que exibe dados relacionados ao representante de vendas. Essa seção deve ser renomeada
para **Merchant Info**, pois agora incluirá informações mais amplas relacionadas ao merchant.

### Novos Campos a Serem Adicionados:
- **Reference Merchant Code** – exibe o código do merchant vinculado ao lead.
- **Client Type** – exibe o tipo de cliente associado ao merchant.

Ver imagem para referência visual.

## Objetivo de Negócio
Oferecer maior visibilidade e contexto sobre o merchant vinculado ao lead diretamente na interface,
auxiliando as equipes de negócios e atendimento com rastreamento e análise facilitados.

## Requisitos da Funcionalidade
- Renomear a seção **Sales Rep** para **Merchant Info** na página de detalhes do lead.
- Adicionar o campo **Reference Merchant Code**.
- Adicionar o campo **Client Type**.
- Os novos campos devem ser posicionados **abaixo do campo Primary Email**, conforme mostrado no mockup.
- Os valores devem refletir os dados da **entidade Merchant vinculada**.
- Os campos devem ser **somente leitura** e **exibidos apenas se houver dados disponíveis**.
- Garantir a exibição correta e a obtenção dos dados nos ambientes: **Sandbox, QA e Staging**.
- Validar visualmente com o mockup e garantir **compatibilidade responsiva e entre navegadores**.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

✅ Requisitos Extraídos
[RF001] Renomear a seção Sales Rep para Merchant Info na página de detalhes do lead.
[RF002] Adicionar o campo Reference Merchant Code na seção Merchant Info.
[RF003] Adicionar o campo Client Type na seção Merchant Info.
[RF004] Posicionar os novos campos abaixo do campo Primary Email.
[RF005] Os valores devem refletir os dados da entidade Merchant vinculada.
[RF006] Os campos devem ser somente leitura.
[RF007] Os campos devem ser exibidos apenas se houver dados disponíveis.
[RF008] Garantir exibição correta nos ambientes Sandbox, QA e Staging.
[RF009] Validar visualmente com base no mockup.
[RNF001] Garantir compatibilidade entre navegadores.
[RNF002] Garantir responsividade (tamanhos de tela variados).

-----

Feature: Exibição da seção Merchant Info na página de Lead

  Scenario: Exibir a seção Merchant Info com novos campos
  Dado que eu acesso um lead com dados de merchant vinculados
  Quando eu visualizo a página de detalhes do lead
  Então eu devo ver a seção rotulada como "Merchant Info"
  E os campos "Reference Merchant Code" e "Client Type" devem ser exibidos abaixo do campo "Primary Email"
  E os valores devem corresponder aos dados do merchant vinculado
  E os campos devem ser somente leitura

  Scenario: Ocultar campos quando os dados do merchant não estiverem disponíveis
  Dado que eu acesso um lead sem dados de merchant vinculados
  Quando eu visualizo a página de detalhes do lead
  Então os campos "Reference Merchant Code" e "Client Type" não devem ser exibidos

  Scenario: Os campos devem refletir corretamente os dados do merchant
  Dado que um merchant está vinculado a um lead
  Quando os dados do merchant forem alterados
  Então os valores atualizados devem ser exibidos na seção "Merchant Info"

  Scenario Outline: Exibir corretamente a seção Merchant Info em todos os ambientes
    Dado que eu acesso a página do lead no ambiente <environment>
    Quando eu visualizo a seção "Merchant Info"
    Então os campos devem ser preenchidos corretamente se os dados do merchant estiverem disponíveis

    Examples:
      | environment |
      | Sandbox     |
      | QA          |
      | Staging     |

  Scenario: Validar interface com base no mockup
  Dado que eu visualizo a página de detalhes do lead com dados de merchant
  Quando eu comparo a interface com o mockup fornecido
  Então o layout da seção "Merchant Info" deve corresponder exatamente ao mockup

  Scenario: Compatibilidade entre navegadores
  Dado que eu abro a página de detalhes do lead em diferentes navegadores
  Quando eu visualizo a seção "Merchant Info"
  Então a seção e os campos devem ser exibidos de forma consistente entre os navegadores

  Scenario: Comportamento responsivo da seção Merchant Info
      Dado que eu abro a página de detalhes do lead em dispositivos com diferentes tamanhos de tela
      Quando eu visualizo a seção "Merchant Info"
      Então a seção deve se ajustar e permanecer legível


      Tests in qa1

      | LeadPk   | Merchant   | Test Case                                                            | Test Data   | Status   | Observation                                                                                                                                            |
      | -------- | ---------- | -------------------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
      | 20458    | 7098       | Exibir a seção Merchant Info com novos campos                        |      -      | PASS     |                                                                                                                                                        |
      | 20459    | —          | Ocultar campos quando os dados do merchant não estiverem disponíveis |      -      | PASS     |                                                                                                                                                        |
      | 20460    | 8247       | Os campos devem refletir corretamente os dados do merchant           |      -      | PASS     |                                                                                                                                                        |
      | 20462    | 7098       | Validar interface com base no mockup                                 |      -      | PASS     |                                                                                                                                                        |
      | 20463    | 8247       | Compatibilidade entre navegadores                                    |      -      | PASS     |                                                                                                                                                        |
      | 20464    | 1320       | Comportamento responsivo da seção Merchant Info em Telas mobile      |      -      | PASS     | Acredito que os usuários mobile não acessam esse painel pelo celular, mas, caso o façam, será necessário realizar ajustes para garantir a usabilidade. |

-----

Tests in qa1

| LeadPk   | Merchant   | Test Case                                                            | Test Data   | Status   | Observation                                                                                                              |
| -------- | ---------- | -------------------------------------------------------------------- | ----------- | -------- | -------------------------------------------------------------------------------------------------------------------------|
| 20458    | 7098       | Display the Merchant Info section with new fields                    |      -      | PASS     |                                                                                                                          |
| 20459    | —          | Hide fields when merchant data is not available                      |      -      | PASS     |                                                                                                                          |
| 20460    | 8247       | Fields should reflect the correct merchant data                      |      -      | PASS     |                                                                                                                          |
| 20462    | 7098       | Validate UI based on the mockup                                      |      -      | PASS     |                                                                                                                          |
| 20463    | 8247       | Cross-browser compatibility                                          |      -      | PASS     |                                                                                                                          |
| 20464    | 1320       | Responsive behavior of Merchant Info section on mobile screens       |      -      | PASS     | I believe mobile users don't access this panel via phone, but if they do, adjustments will be needed to ensure usability.|

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

      | LeadPk   | Merchant   | Test Case                                                            | Test Data   | Status   | Observation                                                                                                                                   |
      | -------- | ---------- | -------------------------------------------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      |     |        | Exibir a seção Merchant Info com novos campos                        |      -      | PASS     |                                                                                                                                                        |
      |     |        | Exibir "-" quando os dados do merchant não estiverem disponíveis     |      -      | PASS     |                                                                                                                                                        |
      |     |        | Os campos devem refletir corretamente os dados do merchant           |      -      | PASS     |                                                                                                                                                        |
      |     |        | Validar interface com base no mockup                                 |      -      | PASS     |                                                                                                                                                        |
      |     |        | Compatibilidade entre navegadores                                    |      -      | PASS     |                                                                                                                                                        |
      |     |        | Comportamento responsivo da seção Merchant Info em Telas mobile      |      -      | PASS     | Acredito que os usuários mobile não acessam esse painel pelo celular, mas, caso o façam, será necessário realizar ajustes para garantir a usabilidade. |

-----

--merchant_name MyEyeMed
--location Eyemed Georgia
--primary contact name hey there
--primary contact phone 5108273724
--primary email contact abilapatte@777part.com
--client type MY_EYE_MED
--ref merchant code EM0001-001

-----

### Scenario: Exibir a seção Merchant Info com novos campos
Given estou visualizando o painel do merchant  
When acesso a seção Merchant Info  
Then a seção deve ser exibida com os novos campos  
| PASS |  |

### Scenario: Exibir "-" quando os dados do merchant não estiverem disponíveis
Given estou visualizando o painel do merchant  
When não existem dados cadastrados para o merchant  
Then a seção Merchant Info deve exibir "-" para os campos sem informação  
| PASS |  |

### Scenario: Os campos devem refletir corretamente os dados do merchant
Given estou visualizando o painel do merchant  
When o merchant possui dados cadastrados  
Then todos os campos devem refletir corretamente as informações do merchant  
| PASS |  |

### Scenario: Validar interface com base no mockup
Given estou visualizando a seção Merchant Info  
When comparo a interface com o mockup fornecido  
Then a interface deve seguir fielmente o layout do mockup  
| PASS |  |

### Scenario: Compatibilidade entre navegadores
Given estou visualizando a seção Merchant Info  
When acesso por diferentes navegadores  
Then a seção deve ser exibida corretamente em todos os navegadores suportados  
| PASS |  |

### Scenario: Comportamento responsivo da seção Merchant Info em Telas mobile
Given estou visualizando a seção Merchant Info em um dispositivo mobile  
When acesso pelo celular  
Then a seção deve apresentar comportamento responsivo  
| PASS |  | Acredito que os usuários mobile não acessam esse painel pelo celular, mas, caso o façam, será necessário realizar ajustes para garantir a usabilidade. |

-----


> ## Tests in stg
> ```gherkin
>
>### Scenario: Display the Merchant Info section with new fields
>Given I am viewing the merchant panel
>When I access the Merchant Info section
>Then the section should be displayed with the new fields
>| PASS | 19860 | MyEyeMed |
> ```
>
![1064-stg-origination-c1-_1_](/uploads/82473f3e65be2e5a77a84d0424971e18/1064-stg-origination-c1-_1_.png){width=1416 height=474}
>
> ```gherkin
>### Scenario: Display "-" when merchant data is not available
>Given I am viewing the merchant panel
>When there is no data registered for the merchant
>Then the Merchant Info section should display "-" for fields without information
>| PASS | 19860 | MyEyeMed |
> ```
>
![1064-stg-origination-c2-_1_](/uploads/02be84458ce6c2b6a441acbee0cea3f4/1064-stg-origination-c2-_1_.png){width=1416 height=474}
>
> ```gherkin
>### Scenario: Fields must correctly reflect the merchant data
>Given I am viewing the merchant panel
>When the merchant has data registered
>Then all fields should correctly reflect the merchant's information
>| PASS | 19860 | MyEyeMed |
> ```
>
![1064-stg-origination-c3-_1_](/uploads/77a67a9e61f149a4d7b87123260c7fe9/1064-stg-origination-c3-_1_.png){width=1419 height=402}![1064-stg-origination-c3-_2_](/uploads/b092554871c73f67d12b9c202a35f4e8/1064-stg-origination-c3-_2_.png){width=505 height=222}![1064-stg-origination-c3-_3_](/uploads/90749fb9a9f6a4afaa7cd8ff4f3ac456/1064-stg-origination-c3-_3_.png){width=1424 height=483}
>
> ```gherkin
>### Scenario: Validate interface based on the mockup
>Given I am viewing the Merchant Info section
>When I compare the interface with the provided mockup
>Then the interface should faithfully follow the mockup layout
>| PASS | 19860 | MyEyeMed |
> ```
>
> ```gherkin
>### Scenario: Compatibility across browsers
>Given I am viewing the Merchant Info section
>When I access it through different browsers
>Then the section should be displayed correctly in all supported browsers
>| PASS | 19860 | MyEyeMed |
> ```
>
> ```gherkin
>### Scenario: Responsive behavior of the Merchant Info section on mobile screens
>Given I am viewing the Merchant Info section on a mobile device
>When I access it through a cellphone
>Then the section should present responsive behavior
>| PASS | 19860 | MyEyeMed | Users do not access this page from mobile devices. |
> ```
>
![1064-stg-mobile-c6-_1_](/uploads/bdd47af0bad1830b86c31242609b4d15/1064-stg-mobile-c6-_1_.jpg)
