------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1049

🇺🇸 English
UOWN | Origination | Make Identity Verification Options (Seon and Intellicheck) Mutually Exclusive in the Origination Portal
Status: Open
Ticket created 3 weeks ago by Yuri Araujo

Synopsis
Currently, in the Merchant settings within the Origination portal, it is possible to enable both identity verification options (Seon and Intellicheck) simultaneously. However, these options should be mutually exclusive, as only one service can be used at a time.

Business Objective
Ensure a clearer and more consistent user experience when configuring identity verification for the Merchant, preventing integration conflicts and avoiding confusion about which service is being used. This also helps reduce potential configuration errors and support demands.

Feature Request | Business Requirements
Update the Merchant configuration interface in the Origination portal so that the identity verification options (Seon and Intellicheck) are mutually exclusive.
When one option is selected, the other must be automatically deselected or disabled.
Ensure this logic is also enforced at the backend level to prevent invalid configurations.
Add unit and integration tests to cover the new behavior.

Testing Steps
Verify if the checks: Require Intellicheck Id Verification and Require SEON Id Verification are now mutually exclusive, and that no other check was affected by the change.

-----

UOWN | Origination | Tornar as Opções de Verificação de Identidade (Seon e Intellicheck) Mutuamente Exclusivas no Portal Origination
Status: Aberto
Tíquete criado há 3 semanas por Yuri Araujo

Sinopse
Atualmente, nas configurações do Merchant dentro do portal Origination, é possível habilitar simultaneamente as duas opções de verificação de identidade (Seon e Intellicheck). 
No entanto, essas opções deveriam ser mutuamente exclusivas, pois apenas um serviço pode ser utilizado por vez.

Objetivo de Negócio
Garantir uma experiência de usuário mais clara e consistente ao configurar a verificação de identidade do Merchant, 
prevenindo conflitos de integração e evitando confusões sobre qual serviço está sendo utilizado. Isso também ajuda a reduzir potenciais 
erros de configuração e demandas de suporte.

Requisitos de Funcionalidade | Requisitos de Negócio
Atualizar a interface de configuração do Merchant no portal Origination para que as opções de verificação de identidade (Seon e Intellicheck) sejam mutuamente exclusivas.
Quando uma opção for selecionada, a outra deve ser automaticamente desmarcada ou desabilitada.
Garantir que essa lógica também seja aplicada no backend para evitar configurações inválidas.
Adicionar testes unitários e de integração para cobrir o novo comportamento.

Passos de Teste
Verifique se as opções: Exigir Verificação de Identidade Intellicheck e Exigir Verificação de Identidade SEON agora são mutuamente exclusivas, 
e se nenhuma outra opção foi afetada pela alteração.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

é possível habilitar simultaneamente as duas opções de verificação de identidade (Seon e Intellicheck).No entanto, essas opções deveriam ser mutuamente exclusivas, pois apenas um serviço pode ser utilizado por vez.
Quando uma opção for selecionada, a outra deve ser automaticamente desmarcada ou desabilitada.
Garantir que essa lógica também seja aplicada no backend para evitar configurações inválidas.
Exigir Verificação de Identidade Intellicheck e Exigir Verificação de Identidade SEON agora são mutuamente exclusivas, e se nenhuma outra opção foi afetada pela alteração.

-----

Ação exige dois cliques para troca de opção

Quando uma opção de verificação está marcada e o usuário tenta desmarcá-la para marcar a outra, é necessário realizar dois cliques:
O primeiro clique apenas remove o aviso de exclusão mútua (“Can’t be used with...”),
O segundo clique efetivamente realiza a desmarcação/marcação do checkbox.
Esse fluxo não é natural para o usuário. O esperado seria que a troca acontecesse já no primeiro clique, exibindo o aviso apenas como informação, sem exigir uma etapa extra de interação.

2. Aviso exibido de forma inconsistente após interação
Ao carregar a tela, se o usuário tentar marcar a opção desmarcada, o aviso de exclusão mútua não aparece (mesmo que a ação seja conflitante).
No entanto, após clicar em qualquer área da tela/componente, o aviso passa a ser exibido ao tentar realizar a mesma ação.
Isso indica que a exibição do aviso está dependente de um estado global de interação, tornando o comportamento inconsistente.

Sugestão:
O aviso deve ser exibido somente ao tentar realizar uma ação inválida (marcar ambas as opções), independentemente de interações prévias, e a troca de seleção deve ser permitida em um único clique.

-----

## Action requires two clicks to switch option
When one verification option is selected and the user tries to deselect it in order to select the other, two clicks are required:  
- The first click only removes the mutual exclusion warning (“Can’t be used with...”).
- The second click actually performs the deselection/selection of the checkbox.
This flow is not natural for the user. The expected behavior is that the switch should happen on the first click, showing the warning only as information, without requiring an extra interaction step.

---

## Warning is shown inconsistently after interaction
When the page is loaded, if the user tries to select the previously unselected option, the mutual exclusion warning does **not** appear (even if the action is conflicting).
However, after clicking anywhere else on the page/component, the warning starts appearing when trying to perform the same action.
This indicates that the warning display is dependent on some global interaction state, making the behavior inconsistent.

---

**Suggestion:**  
The warning should be displayed only when the user tries to perform an invalid action (selecting both options), regardless of previous interactions, and the selection switch should be allowed in a single click.

-----

- Tests in qa1
@fernandogmartins 
## Action requires two clicks to switch option
When one verification option is selected and the user tries to deselect it in order to select the other, two clicks are required:  
- The first click only removes the mutual exclusion warning (“Can’t be used with...”).
- The second click actually performs the deselection/selection of the checkbox.
This flow is not natural for the user. The expected behavior is that the switch should happen on the first click, showing the warning only as information, without requiring an extra interaction step.
![1049-qa1-ERROR-AvisoExibidoAoTentarDesmarcarOpcaoMarcadaParaMarcarOutraRemoveOAvisoDaVisualizacaoAoClicarNovamenteDesmarcaOpcao-AoClicarParaDesmarcarDeveDesmarcarENaoPedirUmCliqueAdicional-_1_](/uploads/bac51f7a771fc2b89a9ca8c2ed8ad138/1049-qa1-ERROR-AvisoExibidoAoTentarDesmarcarOpcaoMarcadaParaMarcarOutraRemoveOAvisoDaVisualizacaoAoClicarNovamenteDesmarcaOpcao-AoClicarParaDesmarcarDeveDesmarcarENaoPedirUmCliqueAdicional-_1_.mp4)
---

## Warning is shown inconsistently after interaction
When the page is loaded, if the user tries to select the previously unselected option, the mutual exclusion warning does **not** appear (even if the action is conflicting).
However, after clicking anywhere else on the page/component, the warning starts appearing when trying to perform the same action.
This indicates that the warning display is dependent on some global interaction state, making the behavior inconsistent.
![1049-qa1-ERROR-NaoExibeAvisoAoRecarregarTelaETentarMarcarOpcaoDesmarcada-DeveMarcarOpcaoAoCarregarTela-_1_](/uploads/0b832a8a1386c0bbeca6297cd5f3d6b6/1049-qa1-ERROR-NaoExibeAvisoAoRecarregarTelaETentarMarcarOpcaoDesmarcada-DeveMarcarOpcaoAoCarregarTela-_1_.mp4)
---

**Suggestion:**  
The warning should be displayed only when the user tries to perform an invalid action (selecting both options), regardless of previous interactions, and the selection switch should be allowed in a single click.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se, ao selecionar a opção Intellicheck e alternar para Seon, somente uma opção de verificação de identidade se mantém selecionada.
Verify if, when selecting the Intellicheck option and switching to Seon, only one identity verification option remains selected.

Verifique se, ao selecionar a opção Seon e alternar para Intellicheck, somente uma opção de verificação de identidade se mantém selecionada.
Verify if, when selecting the Seon option and switching to Intellicheck, only one identity verification option remains selected.

Verifique se, ao deixar ambas as opções de verificação de identidade desmarcadas, é possível salvar sem erros.
Verify if, when leaving both identity verification options unselected, it is possible to save without errors.

Verifique se, ao criar um novo comerciante, é possível selecionar o verificador de identidade e somente uma opção de verificação de identidade se mantém selecionada.
Verify if, when creating a new merchant, it is possible to select the identity verifier and only one identity verification option remains selected.

Verifique se, ao clonar um comerciante, é possível selecionar o verificador de identidade e somente uma opção de verificação de identidade se mantém selecionada.Verify if, when cloning a merchant, it is possible to select the identity verifier and only one identity verification option remains selected.
Verify if, when cloning a merchant, it is possible to select the identity verifier and only one identity verification option remains selected.

-----

Tests in qa1

| Merchant | Test Case | Test Data | Status |
| -------- | --------- | --------- | ------ |
| Progress Mobility | Verify if, when selecting the Intellicheck option and switching to Seon, only one identity verification option remains selected. |  | PASS |
| Progress Mobility | Verify if, when selecting the Seon option and switching to Intellicheck, only one identity verification option remains selected. |  | PASS |
| Progress Mobility | Verify if, when leaving both identity verification options unselected, it is possible to save without errors. |  | PASS |
| -- | Verify if, when creating a new merchant, it is possible to select the identity verifier and only one identity verification option remains selected. |  | PASS |
| WeGetFinancing | Verify if, when cloning a merchant, it is possible to select the identity verifier and only one identity verification option remains selected. |  | PASS |

-----

Tests in qa1

| Merchant | Test Case | Test Data | Status |
| -------- | --------- | --------- | ------ |
| Progress Mobility | Verify if, when selecting the Intellicheck option and switching to Seon, only one identity verification option remains selected. | ![1049-qa1-OK-SeonSelecionado-_1_](/uploads/2d0fa9450cc49063dcbd11b0ed7a79d1/1049-qa1-OK-SeonSelecionado-_1_.png){width=261 height=93}![1049-qa1-OK-SeonSelecionado-_2_](/uploads/2f3e18de1347390c720710e37e259d85/1049-qa1-OK-SeonSelecionado-_2_.png){width=171 height=55}![1049-qa1-OK-SeonSelecionado-_3_](/uploads/cfbac460121c2383612a9d5de8ed5494/1049-qa1-OK-SeonSelecionado-_3_.png){width=162 height=18}![1049-qa1-OK-SeonSelecionado-_4_](/uploads/68fd6483d6c883ffb16bc064b8357e77/1049-qa1-OK-SeonSelecionado-_4_.png){width=1170 height=54}![1049-qa1-OK-SeonSelecionado-_5_](/uploads/e1625ce391487bc40d5e29dda0cbcff2/1049-qa1-OK-SeonSelecionado-_5_.png){width=1440 height=744} | PASS |
| Progress Mobility | Verify if, when selecting the Seon option and switching to Intellicheck, only one identity verification option remains selected. | ![1049-qa1-OK-IntellicheckSelecionado_1_](/uploads/f9c8f1edfd8ea81ebe7486a229d34548/1049-qa1-OK-IntellicheckSelecionado_1_.png){width=232 height=47}![1049-qa1-OK-IntellicheckSelecionado_2_](/uploads/0dc100d897f10b9510f87ffcf8d585c5/1049-qa1-OK-IntellicheckSelecionado_2_.png){width=156 height=56}![1049-qa1-OK-IntellicheckSelecionado_3_](/uploads/00024aa51a8f83417eee390abe793730/1049-qa1-OK-IntellicheckSelecionado_3_.png){width=162 height=21}![1049-qa1-OK-IntellicheckSelecionado_4_](/uploads/74df715d09d70c5f414fe5637571abfb/1049-qa1-OK-IntellicheckSelecionado_4_.png){width=1171 height=45}![1049-qa1-OK-IntellicheckSelecionado_5_](/uploads/2cfd7b9e90e45aee95e1eabab4b3054d/1049-qa1-OK-IntellicheckSelecionado_5_.png){width=709 height=94} | PASS |
| Progress Mobility | Verify if, when leaving both identity verification options unselected, it is possible to save without errors. | ![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_1_](/uploads/786f7c3f436c0babb57102a1622fc300/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_1_.png){width=226 height=45}![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_2_](/uploads/d88b03d4959db46bceff16c33146da6d/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_2_.png){width=168 height=54}![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_3_](/uploads/a3ba3b4961fe2bb8e1eb034ec5c1a54b/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_3_.png){width=176 height=18}![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_4_](/uploads/c67fc44a0b1b933710c24ecda35f83e9/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_4_.png){width=158 height=15}![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_5_](/uploads/faba340ddf4d49d8217dac51a1145a96/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_5_.png){width=825 height=76}![1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_6_](/uploads/177f42509cc02108d14bf3ca06ba4d4a/1049-qa1-OK-VerificacaoIdentidadeNaoAtivadoDuasOpcoesDesmarcadas-_6_.png){width=1170 height=43} | PASS |
| -- | Verify if, when creating a new merchant, it is possible to select the identity verifier and only one identity verification option remains selected. | ![1049-qa1-OK-NewMerchant-_1_](/uploads/a72476f1741f352cbc27c72bd86418d2/1049-qa1-OK-NewMerchant-_1_.png){width=1439 height=741}![1049-qa1-OK-NewMerchant-_2_](/uploads/cdbd5eec8c58446faa3555111d04a96b/1049-qa1-OK-NewMerchant-_2_.png){width=263 height=95}![1049-qa1-OK-NewMerchant-_3_](/uploads/fa544cd56b84288d15f22996e9b40108/1049-qa1-OK-NewMerchant-_3_.png){width=263 height=95}![1049-qa1-OK-NewMerchant-_4_](/uploads/370e9f86989fa0e307737952f7217475/1049-qa1-OK-NewMerchant-_4_.png){width=263 height=95}![1049-qa1-OK-NewMerchant-_5_](/uploads/c5786ab9683e566ce396e3ce3d88e08d/1049-qa1-OK-NewMerchant-_5_.png){width=263 height=95}![1049-qa1-OK-NewMerchant-_6_](/uploads/bdd106f1e150e124a5f2cd3cb595e976/1049-qa1-OK-NewMerchant-_6_.png){width=263 height=95} | PASS |
| WeGetFinancing | Verify if, when cloning a merchant, it is possible to select the identity verifier and only one identity verification option remains selected. | ![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_1_](/uploads/4adbee291f3f29562421c82c516a2c1f/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_1_.png){width=351 height=329}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_2_](/uploads/1594a3f9e74913b0451c23cb5761a4e1/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_2_.png){width=256 height=92}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_3_](/uploads/c453b31509e066b161eb3979e1bdfcab/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_3_.png){width=256 height=92}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_4_](/uploads/e292f1e2151ad6121df83b15c565e713/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_4_.png){width=256 height=92}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_5_](/uploads/3c95be65c8d0587e8192a5c773015641/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_5_.png){width=256 height=92}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_6_](/uploads/0bc55e4afe3e316acb3cf392afae659b/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_6_.png){width=256 height=92}![1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_7_](/uploads/2e5b6f6856d2471a3d1bd451505e32c1/1049-qa1-OK-CloneNewMerchant-ExibeAsDuasOpcoesDesmarcadas-_7_.png){width=256 height=92} | PASS |

---

![1049-qa1-OK-IntellicheckSeonNenhumSelecionado-_1_](/uploads/84d33ff2d4af974e5363f7dbdbf99d5a/1049-qa1-OK-IntellicheckSeonNenhumSelecionado-_1_.mp4)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg


Verifique se, ao selecionar a opção Intellicheck e trocar para Seon, apenas uma opção de verificação de identidade permanece selecionada.
Verifique se, ao selecionar a opção Seon e trocar para Intellicheck, apenas uma opção de verificação de identidade permanece selecionada.
Verifique se, ao deixar ambas as opções de verificação de identidade desmarcadas, é possível salvar sem erros.
Verifique se, ao criar um novo merchant, é possível selecionar o verificador de identidade e apenas uma opção de verificação de identidade permanece selecionada.
Verifique se, ao clonar um merchant, é possível selecionar o verificador de identidade e apenas uma opção de verificação de identidade permanece selecionada.


Verify if, when selecting the Intellicheck option and switching to Seon, only one identity verification option remains selected.
Verify if, when selecting the Seon option and switching to Intellicheck, only one identity verification option remains selected.
Verify if, when leaving both identity verification options unselected, it is possible to save without errors.
Verify if, when creating a new merchant, it is possible to select the identity verifier and only one identity verification option remains selected.
Verify if, when cloning a merchant, it is possible to select the identity verifier and only one identity verification option remains selected.
OL90294-0001_clone

------


> ## Tests in qa1
> ```gherkin
>
> ### Scenario: Selecionar Intellicheck e trocar para Seon
>  Given que a opção Intellicheck está selecionada
>  When o usuário troca para a opção Seon
>  Then apenas uma opção de verificação de identidade permanece selecionada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Selecionar Seon e trocar para Intellicheck
>  Given que a opção Seon está selecionada
>  When o usuário troca para a opção Intellicheck
>  Then apenas uma opção de verificação de identidade permanece selecionada
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Deixar ambas opções de verificação de identidade desmarcadas
>  Given que ambas as opções de verificação de identidade estão desmarcadas
>  When o usuário tenta salvar
>  Then é possível salvar sem erros
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
> ```gherkin
> ### Scenario: Criar novo merchant e selecionar verificador de identidade
>  Given que um novo merchant está sendo criado
>  When o usuário seleciona o verificador de identidade
>  Then apenas uma opção de verificação de identidade permanece selecionada
> | PASS | LeadPk / AccountPk | Merchant |
> ```
>
> ```gherkin
> ### Scenario: Clonar merchant e selecionar verificador de identidade
>  Given que um merchant está sendo clonado
>  When o usuário seleciona o verificador de identidade
>  Then apenas uma opção de verificação de identidade permanece selecionada
> | PASS | LeadPk / AccountPk | Merchant |
> ```
>