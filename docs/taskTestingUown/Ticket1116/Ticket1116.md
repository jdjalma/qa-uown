----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1116

UOWN | Origination | Add Bulk Notes Functionality in Merchant Settings Page

Synopsis
As a business user, I want to add notes to multiple merchants at once so that I can manage merchant updates more efficiently without repeating the process individually.
In the Origination Portal, on the Merchant and Merchant Modification History pages, users can add notes through a button at the bottom table, which opens a modal to select the note type. The business team requested the ability to perform this same action in bulk.
To achieve this, a similar Add Note button should be added to the Merchant Settings page, allowing users to apply notes to multiple merchants simultaneously.

Business Objective
The current process requires users to add notes one merchant at a time, creating inefficiencies when updates must be applied broadly. By enabling bulk note creation in the Merchant Settings page, the business team gains:
    Increased efficiency by reducing repetitive manual work.
    Consistency in applying notes across many merchants.
    Greater autonomy in managing merchant updates without relying on technical support.

Feature Request | Business Requirements
    Add an Add Note button to the Merchant Settings page, similar to the one already available on Merchant and Merchant Modification History pages.
    Allow users to select multiple merchants from the Merchant Settings page.
    Enable creation of a note through a modal with the existing Note Type dropdown.
    Apply the created note to all selected merchants in bulk.
    Ensure system validations are respected for all merchants when applying notes.
    Provide feedback to the user (confirmation or error) for the bulk operation.
    Ensure notes are saved correctly in the database for each selected merchant.
    Log the bulk operation for audit purposes, including user, timestamp, note type, and merchants impacted.
    Maintain consistency in UI/UX with the existing Add Note functionality in other pages.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Adicionar funcionalidade de notas em massa na página de configurações do comerciante


Sinopse
Como usuário empresarial, quero adicionar notas a vários comerciantes ao mesmo tempo para poder gerenciar as atualizações dos comerciantes com mais eficiência, sem repetir o processo individualmente.
No Portal de Origem, no Comerciante e Histórico de modificações do comerciante páginas, os usuários podem adicionar notas através de um botão na tabela inferior, que abre um modal para selecionar o tipo de nota. A equipe de negócios solicitou a capacidade de executar essa mesma ação em massa.
Para conseguir isso, um semelhante Adicionar nota botão deve ser adicionado ao Configurações do comerciante página, permitindo que os usuários apliquem notas a vários comerciantes simultaneamente.

Objetivo do negócio
O processo atual exige que os usuários adicionem notas a um comerciante por vez, criando ineficiências quando as atualizações devem ser aplicadas de forma ampla. Ao habilitar a criação de notas em massa na página Configurações do comerciante, a equipe de negócios ganha:
* Maior eficiência ao reduzir o trabalho manual repetitivo.
* Consistência na aplicação de notas em muitos comerciantes.
* Maior autonomia no gerenciamento de atualizações de comerciantes sem depender de suporte técnico.


Solicitação de recurso | Requisitos de negócios
* Adicionar um Adicionar nota botão para o Configurações do comerciante página, semelhante à já disponível nas páginas Merchant e Merchant Modification History.
* Permitir que os usuários o façam selecione vários comerciantes na página Configurações do comerciante.
* Permitir a criação de uma nota através de um modal com o existente Tipo de nota suspenso.
* Aplique a nota criada a todos os comerciantes selecionados em massa.
* Garanta que as validações do sistema sejam respeitadas por todos os comerciantes ao aplicar notas.
* Forneça feedback ao usuário (confirmação ou erro) para a operação em massa.
* Certifique-se de que as notas sejam salvas corretamente no banco de dados de cada comerciante selecionado.
* Registre a operação em massa para fins de auditoria, incluindo usuário, registro de data e hora, tipo de nota e comerciantes afetados.
* Mantenha a consistência na UI/UX com a funcionalidade Add Note existente em outras páginas.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Adicionar nota em massa na página Configurações do Comerciante

Cenário: Criar nota em massa para múltiplos comerciantes a partir de Configurações do Comerciante
Dado que o usuário está autenticado na página "Configurações do Comerciante"
E a lista de comerciantes exibe checkboxes de seleção
E há um botão "Adicionar nota" consistente com a página "Merchant"
E estão selecionados múltiplos comerciantes (pelo menos 2)

Quando o botão "Adicionar nota" é acionado
E é exibido um modal "Adicionar nota" com o dropdown "Tipo de nota"
E é selecionado um tipo de nota válido
E a descrição da nota é informada
E a criação da nota é confirmada

Então o sistema valida os dados para todos os comerciantes selecionados
E aplica a nota a cada comerciante aprovado na validação
E salva corretamente as notas no banco de dados
E registra a operação em massa para auditoria (usuário, data/hora, tipo de nota, comerciantes afetados)
E apresenta confirmação de sucesso ao usuário (incluindo a quantidade atualizada)
E para quaisquer comerciantes com falha na validação ou processamento, exibe feedback de erro por item sem abortar a operação dos demais
E a UI/UX permanece consistente com a funcionalidade "Adicionar nota" existente em outras páginas


-----

> Feature: Add bulk note on the Merchant Settings page
> 
> Scenario: Create a bulk note for multiple merchants from Merchant Settings
> Given the user is authenticated on the "Merchant Settings" page
> And the merchant list displays selection checkboxes
> And an "Add Note" button exists, consistent with the "Merchant" page
> And multiple merchants are selected (at least 2)
> 
> When the "Add Note" button is triggered
> And an "Add Note" modal is displayed with the "Note Type" dropdown
> And a valid note type is selected
> And the note description is provided
> And the note creation is confirmed
> 
> Then the system validates data for all selected merchants
> And applies the note to each merchant that passes validation
> And correctly saves the notes to the database
> And logs the bulk operation for audit (user, timestamp, note type, affected merchants)
> And presents a success confirmation to the user (including the updated count)
> And for any merchants that fail validation or processing, shows per-item error feedback without aborting the operation for others
> And the UI/UX remains consistent with the existing "Add Note" functionality on other pages


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg

> ```gherkin
> Feature: Add bulk note on the Merchant Settings page
> 
> ### Scenario: Add notes to multiple merchants from Merchant Settings
> Given that I am authenticated and navigate to the "Merchant Settings" page
> And I view the list of merchants with selection checkboxes
> And there is an "Add Note" button consistent with the "Merchant" and "Merchant Modification History" pages
> And I select multiple merchants (at least 2)
> 
> When I click the "Add Note" button
> And a modal "Add Note" is displayed with the existing "Note Type" dropdown
> And I select a valid note type
> And I fill in the note description
> And I confirm the creation of the note
> 
> Then the system validates the data for all selected merchants
> And applies the created note to each merchant that passed validation
> And correctly saves the notes in the database for each selected merchant
> And logs the bulk operation for audit purposes with: user, date/time, note type, and affected merchants
> And provides user feedback with a success confirmation
> And for any merchants that fail validation, it returns error feedback
> And the UI/UX remains consistent with the existing "Add Note" functionality on other pages
>
> | PASS |
> ```

![Screenshot_at_Oct_28_14-41-41](/uploads/2af97c0c0490bb3f5a3216b50c054f70/Screenshot_at_Oct_28_14-41-41.png)
![Screenshot_at_Oct_28_14-41-53](/uploads/7aacb90590136d730e4adc1fe08aa026/Screenshot_at_Oct_28_14-41-53.png)
![Screenshot_at_Oct_28_14-42-22](/uploads/c4de49b4bd24f5c353497e4f50edeb6c/Screenshot_at_Oct_28_14-42-22.png)
![Screenshot_at_Oct_28_14-42-38](/uploads/79ff16f0d30e2084937bae5742d001c7/Screenshot_at_Oct_28_14-42-38.png)
![Screenshot_at_Oct_28_14-42-54](/uploads/d8f9d1455407eb7b18c47c6f9ec6e366/Screenshot_at_Oct_28_14-42-54.png)
![Screenshot_at_Oct_28_14-43-18](/uploads/c93cd455506e625f4014329f36658b1c/Screenshot_at_Oct_28_14-43-18.png)
![Screenshot_at_Oct_28_14-43-27](/uploads/11d385bca685b0415835d0605c38de58/Screenshot_at_Oct_28_14-43-27.png)

---

![Screenshot_at_Oct_28_14-45-55](/uploads/828b636bdda41ef26e70869aa3f3e57d/Screenshot_at_Oct_28_14-45-55.png)
![Screenshot_at_Oct_28_14-46-19](/uploads/80b21b22d47c25556cd74b2782e0c47a/Screenshot_at_Oct_28_14-46-19.png)
![Screenshot_at_Oct_28_14-47-28](/uploads/c30240f0ae717f71c64215e36ea0eaa8/Screenshot_at_Oct_28_14-47-28.png)
![Screenshot_at_Oct_28_14-48-24](/uploads/85d6135d655bbccdc199ce03ea88cd73/Screenshot_at_Oct_28_14-48-24.png)
![Screenshot_at_Oct_28_14-50-04](/uploads/ff60b4da7f970c42d88e3c39fd7776b6/Screenshot_at_Oct_28_14-50-04.png)
![Screenshot_at_Oct_28_14-51-40](/uploads/dd2cd2c3c160e250770afe788206cbb0/Screenshot_at_Oct_28_14-51-40.png)
![Screenshot_at_Oct_28_14-51-50](/uploads/13e1b33692c095c1503fbb57cd9a0875/Screenshot_at_Oct_28_14-51-50.png)
![Screenshot_at_Oct_28_14-52-22](/uploads/98028dbcb1c5f25dd15c4d98b308ad67/Screenshot_at_Oct_28_14-52-22.png)
![Screenshot_at_Oct_28_14-52-29](/uploads/876084be4d70e43b43e930f267012dac/Screenshot_at_Oct_28_14-52-29.png)
![Screenshot_at_Oct_28_14-53-00](/uploads/2ee557a0cba3c9db8845c64c4845a011/Screenshot_at_Oct_28_14-53-00.png)
![Screenshot_at_Oct_28_14-53-12](/uploads/26fa576d14461675c7905c586e7bc173/Screenshot_at_Oct_28_14-53-12.png)
![Screenshot_at_Oct_28_14-53-29](/uploads/2f8b7b812091ed9e1cb975996fc93b1c/Screenshot_at_Oct_28_14-53-29.png)
![Screenshot_at_Oct_28_14-53-45](/uploads/73eb1714cfdcf52e4e5aeb5c602e86e6/Screenshot_at_Oct_28_14-53-45.png)
![Screenshot_at_Oct_28_14-54-14](/uploads/28864bae0828bb2bb2fdec9a3360f25c/Screenshot_at_Oct_28_14-54-14.png)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg

**1090 merchants receive an internal note**

> ![Screenshot_at_Oct_28_14-51-40](/uploads/9624d8e06f15d206728e8340ad07c2fc/Screenshot_at_Oct_28_14-51-40.png)
> ![Screenshot_at_Oct_28_14-51-50](/uploads/13dc360f10c116ef24ad2af34c0ece8c/Screenshot_at_Oct_28_14-51-50.png)
> ![Screenshot_at_Oct_28_14-52-22](/uploads/a00605942d839deb790c8d3d3c855977/Screenshot_at_Oct_28_14-52-22.png)
> ![Screenshot_at_Oct_28_14-52-29](/uploads/c81cd573240ec47791f592c549cca473/Screenshot_at_Oct_28_14-52-29.png)
> ![Screenshot_at_Oct_28_14-53-00](/uploads/304d8242f089b6fb7789289a9549a507/Screenshot_at_Oct_28_14-53-00.png)
> ![Screenshot_at_Oct_28_14-53-12](/uploads/589e65a8e895b1365ef8450b76519f47/Screenshot_at_Oct_28_14-53-12.png)
> ![Screenshot_at_Oct_28_14-53-29](/uploads/dc6a8c513ad753018a21c233ee786555/Screenshot_at_Oct_28_14-53-29.png)
> ![Screenshot_at_Oct_28_14-53-45](/uploads/3091b4500126dbd0cd3becd11a4664ab/Screenshot_at_Oct_28_14-53-45.png)
> ![Screenshot_at_Oct_28_14-54-14](/uploads/2619283265eafb165115493640962a92/Screenshot_at_Oct_28_14-54-14.png)

> **| PASS |**

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------