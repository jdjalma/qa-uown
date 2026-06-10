--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1061

## UOWN | Origination | Add New Options to "Log Type" Dropdown and "Log Activity" Filter in Notes Table (Merchant Page)

**Status:** Open
**Ticket created 4 weeks ago by Yuri Araujo**

### Synopsis
On the Edit Merchant page within the Origination Portal, there is a section called Notes where users can add manual records. Currently, the note creation modal includes a dropdown labeled Log Type, and the table also features a Log Activity filter.

### Business Objective
Enhance the categorization and filtering of notes added by users in the portal, enabling better organization, traceability, and clarity of interactions logged with Merchants. This improves user experience and historical tracking within the system.

### Feature Request | Business Requirements
- Update the Log Type dropdown in the "Add Note" modal within the Notes table to include the following options:
- PEO Support
- Review
- Customer Assistance
- POP Shipment
- Outreach - Merchant
- Outreach - Platform
- Outreach - ISR
- Escalation
- Other
- Ensure these same options are also available and functional in the Log Activity filter, accessed via the Filters button in the Notes table.
- The options must be displayed exactly as listed (case-sensitive, with correct spacing and hyphenation).
- Validate UI consistency and correct behavior across all environments (QA, Staging).
- Ensure the new categories are properly saved, searchable, and displayed in existing and new records.
- Validate against provided screenshots and current UI behavior.

### Steps to Reproduce
1. Access the Origination Portal.
2. Follow the flow as outlined in the mockup (Screenshot-2) attached to the ticket.
3. Navigate through the interface as shown in the mock.

### Expected Result
- The new options in the selection dropdown should appear correctly.
- After selecting an option and submitting the flow, you should be able to search for the new log entry that was added as part of this implementation.


-----

## UOWN | Origination | Adicionar Novas Opções ao Dropdown "Log Type" e Filtro "Log Activity" na Tabela de Notas (Página do Merchant)

**Status:** Aberto
**Ticket criado há 4 semanas por Yuri Araujo**

### Sinopse
Na página de edição do Merchant dentro do Origination Portal, existe uma seção chamada Notas onde os usuários podem adicionar registros manuais. Atualmente, o modal de criação de nota inclui um dropdown chamado Log Type, e a tabela também possui um filtro Log Activity.

### Objetivo de Negócio
Aprimorar a categorização e o filtro das notas adicionadas pelos usuários no portal, permitindo melhor organização, rastreabilidade e clareza nas interações registradas com os Merchants. Isso melhora a experiência do usuário e o acompanhamento histórico dentro do sistema.

### Requisitos da Feature | Requisitos de Negócio
- Atualizar o dropdown Log Type no modal "Add Note" da tabela de Notas para incluir as seguintes opções:
- PEO Support
- Review
- Customer Assistance
- POP Shipment
- Outreach - Merchant
- Outreach - Platform
- Outreach - ISR
- Escalation
- Other
- Garantir que essas mesmas opções estejam disponíveis e funcionais no filtro Log Activity, acessado pelo botão Filters na tabela de Notas.
- As opções devem ser exibidas exatamente como listadas (case sensitive, com espaçamento e hifenização corretos).
- Validar a consistência da UI e o comportamento correto em todos os ambientes (QA, Staging).
- Garantir que as novas categorias sejam corretamente salvas, pesquisáveis e exibidas em registros existentes e novos.
- Validar conforme os prints fornecidos e comportamento atual da UI.

### Passos para Reproduzir
1. Acessar o Origination Portal.
2. Seguir o fluxo conforme indicado no mockup (Screenshot-2) anexado ao ticket.
3. Navegar pela interface conforme mostrado no mock.

### Resultado Esperado
- As novas opções no dropdown de seleção devem aparecer corretamente.
- Após selecionar uma opção e submeter o fluxo, deve ser possível buscar a nova entrada de log adicionada como parte desta implementação.


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Verificar se todas as novas opções ("PEO Support", "Review", "Customer Assistance", "POP Shipment", "Outreach - Merchant", "Outreach - Platform", "Outreach - ISR", "Escalation", "Other") estão disponíveis no dropdown "Log Type" ao adicionar uma nova nota.
Verificar se as mesmas opções estão disponíveis no filtro "Log Activity" na tabela de Notas.
Verificar se, ao selecionar um novo tipo de log e salvar a nota, é possível pesquisar e exibir essa nota usando o filtro.
Verificar se as opções estão exibidas exatamente conforme especificado, incluindo caixa, espaçamento e hifenização.
Verificar se as novas categorias são corretamente salvas, pesquisáveis e exibidas tanto em registros existentes quanto novos.
Validar se todas as novas opções só são exibidas na página de merchants

tests in qa1

| LeadPk | Merchant | Test Case                                                                                                                               | Test Data | Status | Ovservation                              |
| ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ | --------------------------------------   |
| X      | X        | Verificar se todas as novas opções estão disponíveis no dropdown "Log Type" ao adicionar uma nova nota.                                 | -         | PASS   |                                          |
| X      | X        | Verificar se todas as novas opções estão disponíveis no filtro "Log Activity" na tabela de Notas.                                       | -         | PASS   |                                          |
| X      | X        | Verificar se, ao selecionar um novo tipo de log e salvar a nota, é possível pesquisar e exibir essa nota usando o filtro.               | -         | PASS   |                                          |
| X      | X        | Verificar se as opções no dropdown e filtro estão exibidas exatamente conforme especificado (case, espaçamento e hifenização corretos). | -         | PASS   |                                          |
| X      | X        | Verificar se as novas categorias são corretamente salvas, pesquisáveis e exibidas tanto em registros existentes quanto novos.           | -         | PASS   |                                          |



Tests in qa1

| Test Case                                                                                                                                | Test Data | Status |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| Verify that all new options are available in the "Log Type" dropdown when adding a new note.                                             | -         | PASS   |
| Verify that all new options are available in the "Log Activity" filter in the Notes table.                                               | -         | PASS   |
| Verify that after selecting a new log type and saving the note, it is possible to search and display this note using the filter.         | -         | PASS   |
| Verify that the options in the dropdown and filter are displayed exactly as specified (case, spacing, and hyphenation are correct).      | -         | PASS   |
| Verify that the new categories are correctly saved, searchable, and displayed in both existing and new records.                          | -         | PASS   |

-----

Tests in qa1

| Test Case                                                                                                                                | Test Data | Status |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| Verify that all new options are available in the "Log Type" dropdown when adding a new note.                                             | ![1061-qa1-OpcoesAdicionarLogMerchant-_2_](/uploads/40c7a7fdd6ea91fa248857f5e07794b6/1061-qa1-OpcoesAdicionarLogMerchant-_2_.png){width=933 height=741}![1061-qa1-OpcoesAdicionarLogMerchant-_3_](/uploads/d78ad948af20c882ddbc9125977f80d6/1061-qa1-OpcoesAdicionarLogMerchant-_3_.png){width=933 height=741}         | PASS   |
| Verify that all new options are available in the "Log Activity" filter in the Notes table.                                               | ![1061-qa1-Logs-_19_](/uploads/5a59b4be4ce8fc1c0078e3ccb42e166a/1061-qa1-Logs-_19_.png){width=939 height=741}![1061-qa1-Logs-_20_](/uploads/6ccf4131e3adf7b2ab6ccc2ca5070df4/1061-qa1-Logs-_20_.png){width=939 height=741}![1061-qa1-Logs-_21_](/uploads/7c3a2f8c6ebdea33a208f4427a773c03/1061-qa1-Logs-_21_.png){width=1437 height=741}![1061-qa1-Logs-_22_](/uploads/17152f1ed7385903a6cdcd9a4ea953fe/1061-qa1-Logs-_22_.png){width=1437 height=741}![1061-qa1-Logs-_23_](/uploads/51d0635145cb896118b7a1e9571d43e2/1061-qa1-Logs-_23_.png){width=1437 height=741}![1061-qa1-Logs-_24_](/uploads/6a2fe2724ceb5ca90b2e7252dcd3b112/1061-qa1-Logs-_24_.png){width=1193 height=123}        | PASS   |
| Verify that after selecting a new log type and saving the note, it is possible to search and display this note using the filter.         | ![1061-qa1-Logs-_2_](/uploads/112a8f41dd1c9f0acbc95703c21bde38/1061-qa1-Logs-_2_.png){width=1437 height=734}![1061-qa1-Logs-_3_](/uploads/65374e13c395c2d19c0e73d84ca2a2b9/1061-qa1-Logs-_3_.png){width=1437 height=734}![1061-qa1-Logs-_19_](/uploads/8e7f7f00fe40b9727227e617a1f9a0da/1061-qa1-Logs-_19_.png){width=939 height=741}![1061-qa1-Logs-_20_](/uploads/12d7c9bcdd705d1fe08a5b51b0c45bc1/1061-qa1-Logs-_20_.png){width=939 height=741}![1061-qa1-Logs-_21_](/uploads/3044cf1759227fc859e0187656c42acb/1061-qa1-Logs-_21_.png){width=1437 height=741}         | PASS   |
| Verify that the options in the dropdown and filter are displayed exactly as specified (case, spacing, and hyphenation are correct).      | ![1061-qa1-OpcoesAdicionarLogMerchant-_2_](/uploads/7ef2d11fee9b8d1fd2f55418153a55d9/1061-qa1-OpcoesAdicionarLogMerchant-_2_.png){width=933 height=741}![1061-qa1-OpcoesAdicionarLogMerchant-_3_](/uploads/2ea5a737559e3db863b2b347abb186ed/1061-qa1-OpcoesAdicionarLogMerchant-_3_.png){width=933 height=741}![1061-qa1-Logs-_19_](/uploads/288c2f1a998ad994c31265c0d8df310e/1061-qa1-Logs-_19_.png){width=939 height=741}![1061-qa1-Logs-_20_](/uploads/9ac6b0304f86aa06053e93d82e378ec7/1061-qa1-Logs-_20_.png){width=939 height=741}         | PASS   |
| Verify that the new categories are correctly saved, searchable, and displayed in both existing and new records.                          |![1061-qa1-Logs-_7_](/uploads/1e847dd986841033c954cfbcd7fa0b4e/1061-qa1-Logs-_7_.png){width=1437 height=734}![1061-qa1-Logs-_8_](/uploads/dc77948a8aac256f0e4aeb5068492a78/1061-qa1-Logs-_8_.png){width=1437 height=734}![1061-qa1-Logs-_9_](/uploads/e07d6d59fe3853e6de425e711e6ebc9c/1061-qa1-Logs-_9_.png){width=1438 height=739}![1061-qa1-Logs-_10_](/uploads/80fa991bb7fb9f54081adac2a686acd8/1061-qa1-Logs-_10_.png){width=1438 height=739}![1061-qa1-Logs-_11_](/uploads/c64e11ad90cafdf7c380a51ec16065b2/1061-qa1-Logs-_11_.png){width=1438 height=739}![1061-qa1-Logs-_12_](/uploads/784c0be9b283e3d8cb76f6fcc8a583f7/1061-qa1-Logs-_12_.png){width=1438 height=739}![1061-qa1-Logs-_13_](/uploads/91a6ff4d3f53366f82e6a4915acfeeab/1061-qa1-Logs-_13_.png){width=1438 height=739}![1061-qa1-Logs-_14_](/uploads/8c0337427b0d06244263faaa55b782fb/1061-qa1-Logs-_14_.png){width=1194 height=40}![1061-qa1-Logs-_15_](/uploads/28898613f8c6d14be4f6bc654a9f2094/1061-qa1-Logs-_15_.png){width=795 height=78}![1061-qa1-Logs-_16_](/uploads/152332c48153d4511aac0121c70cfa23/1061-qa1-Logs-_16_.png){width=1193 height=37}![1061-qa1-Logs-_17_](/uploads/813a1df29f390fce0fc9e0cab64412c7/1061-qa1-Logs-_17_.png){width=789 height=37}![1061-qa1-Logs-_18_](/uploads/40bd48e60049d51d418580339634e375/1061-qa1-Logs-_18_.png){width=1191 height=36}![1061-qa1-Logs-_19_](/uploads/2448e119058187f67894388fc0522a61/1061-qa1-Logs-_19_.png){width=939 height=741}![1061-qa1-Logs-_20_](/uploads/200712cd04706fc96e0c15e55b6a5dc7/1061-qa1-Logs-_20_.png){width=939 height=741}![1061-qa1-Logs-_21_](/uploads/ee37d0a7ee8a33da114edb4a4fc2d9f2/1061-qa1-Logs-_21_.png){width=1437 height=741}![1061-qa1-Logs-_22_](/uploads/7c43cc295e2f06c999b5afea08c46289/1061-qa1-Logs-_22_.png){width=1437 height=741}![1061-qa1-Logs-_23_](/uploads/d0b34f23da43f3414019e95d1f4896fe/1061-qa1-Logs-_23_.png){width=1437 height=741}![1061-qa1-Logs-_24_](/uploads/9741d2b2be53676d8a93c14ab7c66a3a/1061-qa1-Logs-_24_.png){width=1193 height=123}        | PASS   |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in stg


Verifique se todas as novas opções estão disponíveis no menu suspenso "Tipo de Log" ao adicionar uma nova nota.
Verifique se todas as novas opções estão disponíveis no filtro "Atividade de Log" na tabela de Notas.
Verifique se, após selecionar um novo tipo de log e salvar a nota, é possível pesquisar e exibir essa nota usando o filtro.
Verifique se as opções no menu suspenso e no filtro são exibidas exatamente como especificado (maiúsculas/minúsculas, espaçamento e hifenização corretos).
Verifique se as novas categorias são corretamente salvas, pesquisáveis e exibidas em registros existentes e novos.

> ## Tests in stg
> ```gherkin
Verify that all new options are available in the "Log Type" dropdown when adding a new note. 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
Verify that all new options are available in the "Log Activity" filter in the Notes table.  
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
Verify that after selecting a new log type and saving the note, it is possible to search and display this note using the filter. 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
Verify that the options in the dropdown and filter are displayed exactly as specified (case, spacing, and hyphenation are correct). 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
Verify that the new categories are correctly saved, searchable, and displayed in both existing and new records.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

-----
