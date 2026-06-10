------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1003

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Update Contract Templates in System

Synopsis
New contract templates have been provided and need to be updated in the system. The changes include formatting adjustments (bolding, removing, and updating statements) 
along with some additional modifications.

Business Objective
Ensure that the latest contract templates are properly integrated into the system.

Feature Request | Business Requirements    
* Replace existing contract templates with the newly provided versions.   
* Ensure all contracts from the shared folder LeaseDocs_Templates_022025Edits are updated in the system.  
* Validate whether the contract templates retain their formatting and content structure as per the list of changes below:
AL: Made changes to OTHER CHARGES section.
CA: Updated Rental Period to Renewal Period throughout.
CT: Several Changes – added in a section for disclaimer for liability waiver after "Loss of or Damage to the Property:  "section. "Reinstatement" section text changed.
DE: Updated NOTICE TO THE LESSEE
IA: Updated TOTAL COST
IL: Size of disclosures updated and updated other language.
IN: Added statement about reading whole document, changed to 120 days for returns.
ME: Changed pickup fee amount to $7.50.
MS: - For MS – Add an initial line next to each one of the numbers that are present with a black line and white letters.
NE: Removed collection fee, NSF fee, acct change fee.
NY: Bolded the section related to maintenance responsibilities and transfer of warranty.
OH: Changed size of initial payment, loss/damage disclosures,
TX: Bolded reinstatement provisions.
WV: Replaced cash price with retail value throughout, added rent-to-own charge at the end of the breakdown near the end of the document.
WI: Made attorney’s fees and court costs white font.
WY: Reordered OTHER CHARGES. Added in a NOTICE regarding liability waiver.

-----

UOWN | Originação | Atualizar Modelos de Contratos no Sistema

Sinopse
Novos modelos de contratos foram fornecidos e precisam ser atualizados no sistema. As alterações incluem ajustes de formatação (negrito, remoção e atualização de declarações)
juntamente com algumas modificações adicionais.

Objetivo de Negócio
Garantir que os modelos de contratos mais recentes sejam devidamente integrados ao sistema.
Solicitação de Recurso | Requisitos de Negócio

Substituir os modelos de contratos existentes pelas versões recém-fornecidas.
Garantir que todos os contratos da pasta compartilhada LeaseDocs_Templates_022025Edits sejam atualizados no sistema.
Validar se os modelos de contratos mantêm sua formatação e estrutura de conteúdo conforme a lista de alterações abaixo:
AL: Fez alterações na seção OUTRAS COBRANÇAS.
CA: Atualizou Período de Aluguel para Período de Renovação em todo o documento.
CT: Várias alterações - adicionada uma seção para isenção de responsabilidade após a seção "Perda ou Dano à Propriedade:". Texto da seção "Reintegração" alterado.
DE: Atualizou AVISO AO LOCATÁRIO
IA: Atualizou CUSTO TOTAL
IL: Tamanho das divulgações atualizado e outra linguagem atualizada.
IN: Adicionou declaração sobre ler todo o documento, alterou para 120 dias para devoluções.
ME: Alterou o valor da taxa de coleta para $7,50.
MS: - Para MS – Adicionar uma linha inicial ao lado de cada um dos números que estão presentes com uma linha preta e letras brancas.
NE: Removeu taxa de cobrança, taxa NSF, taxa de alteração de conta.
NY: Colocou em negrito a seção relacionada às responsabilidades de manutenção e transferência de garantia.
OH: Alterou o tamanho do pagamento inicial, divulgações de perda/dano.
TX: Colocou em negrito as disposições de reintegração.
WV: Substituiu preço à vista por valor de varejo em todo o documento, adicionou taxa de aluguel com opção de compra no final da discriminação próxima ao final do documento.
WI: Colocou honorários advocatícios e custas judiciais em fonte branca.
WY: Reordenou OUTRAS COBRANÇAS. Adicionou um AVISO sobre renúncia de responsabilidade.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

📋 Requisito da Tarefa
Atualizar os modelos de contratos com base nas versões mais recentes fornecidas, 
garantindo que as alterações de formatação e conteúdo sejam corretamente refletidas no sistema. Isso inclui ajustes de formatação (como negrito) 
e atualizações de declarações em várias seções do contrato, conforme as alterações especificadas para cada estado (por exemplo, CA, TX, NY, etc.).


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar a atualização do modelo de contrato com as alterações da seção "OUTRAS COBRANÇAS" para AL

Scenario: 1 - Verificar a atualização do modelo de contrato com as alterações na seção "OUTRAS COBRANÇAS" para AL
  Given que o modelo de contrato do estado AL foi atualizado
  When o usuário acessa o contrato de AL
  Then a seção "OUTRAS COBRANÇAS" deve refletir as alterações feitas
  And o conteúdo da seção "OUTRAS COBRANÇAS" deve estar conforme as alterações fornecidas


🔍 Verifique se a seção "OUTRAS COBRANÇAS" no contrato de AL foi atualizada corretamente de acordo com as alterações fornecidas.
📝 Explicação: Este cenário valida que a seção "OUTRAS COBRANÇAS" no contrato de AL foi atualizada corretamente com as alterações especificadas.
✅ Resultado Esperado: A seção "OUTRAS COBRANÇAS" no contrato de AL deve refletir as alterações corretamente.

-----

Scenario 2 – Verificar a atualização do modelo de contrato para CA, alterando "Período de Aluguel" para "Período de Renovação"

Scenario: 2 - Verificar a atualização do modelo de contrato para CA, alterando "Período de Aluguel" para "Período de Renovação"
  Given que o modelo de contrato do estado CA foi atualizado
  When o usuário acessa o contrato de CA
  Then o termo "Período de Aluguel" deve ser substituído por "Período de Renovação"

🔍 Verifique se o termo "Período de Aluguel" foi substituído corretamente por "Período de Renovação" no contrato do estado CA.
📝 Explicação: Esse cenário valida que o termo foi substituído corretamente no contrato de CA.
✅ Resultado Esperado: O termo "Período de Aluguel" deve ser substituído por "Período de Renovação".

-----

Scenario 3 – Verificar a inclusão da seção de isenção de responsabilidade após "Perda ou Dano à Propriedade" no modelo de contrato CT

Scenario: 3 - Verificar a inclusão da seção de isenção de responsabilidade após "Perda ou Dano à Propriedade" no modelo de contrato CT
  Given que o modelo de contrato do estado CT foi atualizado
  When o usuário acessa o contrato de CT
  Then uma nova seção de isenção de responsabilidade deve ser exibida após a seção "Perda ou Dano à Propriedade"

🔍 Verifique se a nova seção de isenção de responsabilidade foi incluída corretamente após a seção "Perda ou Dano à Propriedade" no contrato do estado CT.
📝 Explicação: Esse cenário valida que a nova seção de isenção de responsabilidade foi adicionada corretamente no contrato de CT.
✅ Resultado Esperado: A seção de isenção de responsabilidade deve ser adicionada corretamente após "Perda ou Dano à Propriedade".

-----

Scenario 4 – Verificar a atualização da seção "AVISO AO LOCATÁRIO" no modelo de contrato DE

Scenario: 4 - Verificar a atualização da seção "AVISO AO LOCATÁRIO" no modelo de contrato DE
  Given que o modelo de contrato do estado DE foi atualizado
  When o usuário acessa o contrato de DE
  Then a seção "AVISO AO LOCATÁRIO" deve estar atualizada conforme as modificações fornecidas

🔍 Verifique se a seção "AVISO AO LOCATÁRIO" foi atualizada corretamente no contrato do estado DE, conforme as modificações fornecidas.
📝 Explicação: Esse cenário valida que a seção "AVISO AO LOCATÁRIO" foi atualizada corretamente no contrato de DE.
✅ Resultado Esperado: A seção "AVISO AO LOCATÁRIO" deve ser atualizada corretamente no contrato de DE.

-----

Scenario 5 – Verificar a atualização do valor de "CUSTO TOTAL" no modelo de contrato IA

Scenario: 5 - Verificar a atualização do valor de "CUSTO TOTAL" no modelo de contrato IA
  Given que o modelo de contrato do estado IA foi atualizado
  When o usuário acessa o contrato de IA
  Then o valor de "CUSTO TOTAL" deve refletir a atualização fornecida

🔍 Verifique se o valor de "CUSTO TOTAL" foi atualizado corretamente no contrato do estado IA.
📝 Explicação: Esse cenário valida que o valor de "CUSTO TOTAL" foi atualizado corretamente no contrato de IA.
✅ Resultado Esperado: O valor de "CUSTO TOTAL" deve ser atualizado corretamente no contrato de IA.

-----

Scenario 6 – Verificar a exibição correta do texto atualizado em "Tamanho das divulgações" no modelo de contrato IL

Scenario: 6 - Verificar a exibição correta do texto atualizado em "Tamanho das divulgações" no modelo de contrato IL
  Given que o modelo de contrato do estado IL foi atualizado
  When o usuário acessa o contrato de IL
  Then o texto atualizado na seção "Tamanho das divulgações" deve ser exibido corretamente

🔍 Verifique se o texto atualizado em "Tamanho das divulgações" é exibido corretamente no contrato de IL.
📝 Explicação: Este cenário valida que o texto atualizado da seção "Tamanho das divulgações" foi exibido corretamente no contrato de IL.
✅ Resultado Esperado: O texto atualizado da seção "Tamanho das divulgações" deve ser exibido corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------


📋 Requisito da Tarefa
Atualizar os modelos de contratos com base nas versões mais recentes fornecidas, 
garantindo que as alterações de formatação e conteúdo sejam corretamente refletidas no sistema. Isso inclui ajustes de formatação (como negrito) 
e atualizações de declarações em várias seções do contrato, conforme as alterações especificadas para cada estado (por exemplo, CA, TX, NY, etc.).


🧪 Cenários de Teste Gherkin

Scenario 1 – Verificar a atualização do modelo de contrato com as alterações da seção "OUTRAS COBRANÇAS" para AL

Scenario: 1 - Verificar a atualização do modelo de contrato com as alterações na seção "OUTRAS COBRANÇAS" para AL
  Given que o modelo de contrato do estado AL foi atualizado
  When o usuário acessa o contrato de AL
  Then a seção "OUTRAS COBRANÇAS" deve refletir as alterações feitas
  And o conteúdo da seção "OUTRAS COBRANÇAS" deve estar conforme as alterações fornecidas


🔍 Verifique se a seção "OUTRAS COBRANÇAS" no contrato de AL foi atualizada corretamente de acordo com as alterações fornecidas.
📝 Explicação: Este cenário valida que a seção "OUTRAS COBRANÇAS" no contrato de AL foi atualizada corretamente com as alterações especificadas.
✅ Resultado Esperado: A seção "OUTRAS COBRANÇAS" no contrato de AL deve refletir as alterações corretamente.

-----

Scenario 2 – Verificar a atualização do modelo de contrato para CA, alterando "Período de Aluguel" para "Período de Renovação"

Scenario: 2 - Verificar a atualização do modelo de contrato para CA, alterando "Período de Aluguel" para "Período de Renovação"
  Given que o modelo de contrato do estado CA foi atualizado
  When o usuário acessa o contrato de CA
  Then o termo "Período de Aluguel" deve ser substituído por "Período de Renovação"

🔍 Verifique se o termo "Período de Aluguel" foi substituído corretamente por "Período de Renovação" no contrato do estado CA.
📝 Explicação: Esse cenário valida que o termo foi substituído corretamente no contrato de CA.
✅ Resultado Esperado: O termo "Período de Aluguel" deve ser substituído por "Período de Renovação".

-----

Scenario 3 – Verificar a inclusão da seção de isenção de responsabilidade após "Perda ou Dano à Propriedade" no modelo de contrato CT

Scenario: 3 - Verificar a inclusão da seção de isenção de responsabilidade após "Perda ou Dano à Propriedade" no modelo de contrato CT
  Given que o modelo de contrato do estado CT foi atualizado
  When o usuário acessa o contrato de CT
  Then uma nova seção de isenção de responsabilidade deve ser exibida após a seção "Perda ou Dano à Propriedade"

🔍 Verifique se a nova seção de isenção de responsabilidade foi incluída corretamente após a seção "Perda ou Dano à Propriedade" no contrato do estado CT.
📝 Explicação: Esse cenário valida que a nova seção de isenção de responsabilidade foi adicionada corretamente no contrato de CT.
✅ Resultado Esperado: A seção de isenção de responsabilidade deve ser adicionada corretamente após "Perda ou Dano à Propriedade".

-----

Scenario 4 – Verificar a atualização da seção "AVISO AO LOCATÁRIO" no modelo de contrato DE

Scenario: 4 - Verificar a atualização da seção "AVISO AO LOCATÁRIO" no modelo de contrato DE
  Given que o modelo de contrato do estado DE foi atualizado
  When o usuário acessa o contrato de DE
  Then a seção "AVISO AO LOCATÁRIO" deve estar atualizada conforme as modificações fornecidas

🔍 Verifique se a seção "AVISO AO LOCATÁRIO" foi atualizada corretamente no contrato do estado DE, conforme as modificações fornecidas.
📝 Explicação: Esse cenário valida que a seção "AVISO AO LOCATÁRIO" foi atualizada corretamente no contrato de DE.
✅ Resultado Esperado: A seção "AVISO AO LOCATÁRIO" deve ser atualizada corretamente no contrato de DE.

-----

Scenario 5 – Verificar a atualização do valor de "CUSTO TOTAL" no modelo de contrato IA

Scenario: 5 - Verificar a atualização do valor de "CUSTO TOTAL" no modelo de contrato IA
  Given que o modelo de contrato do estado IA foi atualizado
  When o usuário acessa o contrato de IA
  Then o valor de "CUSTO TOTAL" deve refletir a atualização fornecida

🔍 Verifique se o valor de "CUSTO TOTAL" foi atualizado corretamente no contrato do estado IA.
📝 Explicação: Esse cenário valida que o valor de "CUSTO TOTAL" foi atualizado corretamente no contrato de IA.
✅ Resultado Esperado: O valor de "CUSTO TOTAL" deve ser atualizado corretamente no contrato de IA.

-----

Scenario 6 – Verificar a exibição correta do texto atualizado em "Tamanho das divulgações" no modelo de contrato IL

Scenario: 6 - Verificar a exibição correta do texto atualizado em "Tamanho das divulgações" no modelo de contrato IL
  Given que o modelo de contrato do estado IL foi atualizado
  When o usuário acessa o contrato de IL
  Then o texto atualizado na seção "Tamanho das divulgações" deve ser exibido corretamente

🔍 Verifique se o texto atualizado em "Tamanho das divulgações" é exibido corretamente no contrato de IL.
📝 Explicação: Este cenário valida que o texto atualizado da seção "Tamanho das divulgações" foi exibido corretamente no contrato de IL.
✅ Resultado Esperado: O texto atualizado da seção "Tamanho das divulgações" deve ser exibido corretamente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

AL: Verifiquei se as alterações na seção "OUTRAS COBRANÇAS" foram aplicadas corretamente, garantindo que as modificações estavam visíveis e refletindo a nova formatação.
AL: Verify that the changes in the "OTHER CHARGES" section were applied correctly, ensuring that the modifications were visible and reflected the new formatting.

CA: Validei se a alteração do "Período de Aluguel" para "Período de Renovação" foi aplicada de maneira consistente em todo o documento, com a terminologia ajustada conforme a solicitação.
CA: Verify that the change from "Rental Period" to "Renewal Period" was consistently applied throughout the document, with the terminology adjusted as requested.


CT: Testei as alterações em "Reintegração" e verifiquei se a nova seção de isenção de responsabilidade foi inserida corretamente após a seção "Perda ou Dano à Propriedade", garantindo que o conteúdo estivesse correto.
CT: Verify that the new disclaimer section was inserted correctly after the "Loss or Damage to Property" section, and that the "Reinstatement" section was modified according to the requested changes.


DE: Verifiquei se a atualização do "AVISO AO LOCATÁRIO" foi realizada de acordo com as modificações fornecidas, com a nova formatação e conteúdo refletidos no contrato.
DE: Verify that the update to the "NOTICE TO TENANT" section was implemented correctly, with the new formatting and content reflecting the changes.


IA: Validei a atualização do "CUSTO TOTAL", garantindo que a alteração foi aplicada corretamente no modelo de contrato.
IA: Verify that the update to the "TOTAL COST" section was applied correctly in the contract model.


IL: Testei se o tamanho das divulgações foi ajustado conforme a solicitação, e se a nova linguagem foi incorporada corretamente.
IL: Verify that the size of the disclosures was updated as requested and that the new language was incorporated correctly.


IN: Verifiquei se a declaração sobre a leitura de todo o documento foi adicionada corretamente e se a alteração para 120 dias para devoluções foi refletida.
IN: Verify that the statement regarding reading the entire document was added correctly and that the change to 120 days for returns was reflected.


ME: Testei se o valor da taxa de coleta foi alterado para $7,50 conforme solicitado, e se a modificação foi corretamente aplicada no modelo.
ME: Verify that the collection fee was changed to $7.50 as requested and that the modification was correctly applied.


MS: Verifiquei se foi adicionada uma linha inicial ao lado de cada um dos números, com uma linha preta e letras brancas, conforme exigido.
MS: Verify that an initial line was added next to each of the numbers with a black line and white letters, as required.


NE: Validei se a taxa de cobrança, taxa NSF e taxa de alteração de conta foram removidas, conforme o requisito de modificação.
NE: Verify that the service charge, NSF fee, and account change fee were removed as per the modification request.


NY: Verifiquei se a seção relacionada às responsabilidades de manutenção e transferência de garantia foi colocada em negrito, conforme solicitado.
NY: Verify that the section related to maintenance responsibilities and warranty transfer was bolded as requested.


OH: Testei se o tamanho do pagamento inicial foi alterado conforme o requisito, e se as divulgações sobre perda/dano foram atualizadas de acordo.
OH: Verify that the initial payment size was changed as requested, and that the disclosures regarding loss/damage were updated accordingly.


TX: Verifiquei se as disposições de reintegração foram colocadas em negrito, conforme especificado.
TX: Verify that the reinstatement provisions were bolded as specified.


WV: Validei se o preço à vista foi substituído por "valor de varejo" em todo o documento e se a taxa de aluguel com opção de compra foi adicionada corretamente no final da discriminação.
WV: Verify that the "cash price" was replaced by "retail value" throughout the document, and that the rent-to-own fee was added correctly near the end of the itemization.


WI: Testei se os honorários advocatícios e custas judiciais foram exibidos em fonte branca, conforme a modificação solicitada.
WI: Verify that attorney's fees and court costs were displayed in white font as requested.


WY: Verifiquei se a seção "OUTRAS COBRANÇAS" foi reorganizada corretamente e se um "AVISO sobre renúncia de responsabilidade" foi adicionado conforme solicitado.
WY: Verify that the "OTHER CHARGES" section was reorganized correctly, and that a "Disclaimer" was added as requested.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| State | Test Case | Test Data | Status |
| -------- | --------- | --------- | ------ |
| AL | Verify that the changes in the "OTHER CHARGES" section were applied correctly, ensuring that the modifications were visible and reflected the new formatting. |  | PASS |
| CA | Verify that the change from "Rental Period" to "Renewal Period" was consistently applied throughout the document, with the terminology adjusted as requested. |  | PASS |
| CT | Verify that the new disclaimer section was inserted correctly after the "Loss or Damage to Property" section, and that the "Reinstatement" section was modified according to the requested changes. |  | PASS |
| IA | Verify that the update to the "TOTAL COST" section was applied correctly in the contract model. |  | PASS |
| IL | Verify that the size of the disclosures was updated as requested and that the new language was incorporated correctly. |  | PASS |
| IN | Verify that the statement regarding reading the entire document was added correctly and that the change to 120 days for returns was reflected. |  | PASS |
| MS | Verify that an initial line was added next to each of the numbers with a black line and white letters, as required. |  | PASS |
| NE | Verify that the service charge, NSF fee, and account change fee were removed as per the modification request. |  | PASS |
| NY | Verify that the section related to maintenance responsibilities and warranty transfer was bolded as requested. |  | PASS |
| OH | Verify that the initial payment size was changed as requested, and that the disclosures regarding loss/damage were updated accordingly. |  | PASS |
| TX | Verify that the reinstatement provisions were bolded as specified. |  | PASS |
| WV | Verify that the "cash price" was replaced by "retail value" throughout the document, and that the rent-to-own fee was added correctly near the end of the itemization. |  | PASS |
| WI | Verify that attorney's fees and court costs were displayed in white font as requested. |  | PASS |
| WY | Verify that the "OTHER CHARGES" section was reorganized correctly, and that a "Disclaimer" was added as requested. |  | PASS |

-----

Tests in stg

| State | Test Case | Test Data | Status |
| -------- | --------- | --------- | ------ |
| AL | Verify that the changes in the "OTHER CHARGES" section were applied correctly, ensuring that the modifications were visible and reflected the new formatting. | ![stg-1003-AL_1_](/uploads/18ebe1a93d5c5445b26639f4ecea4cd8/stg-1003-AL_1_.png){width=1406 height=679} | PASS |
| CA | Verify that the change from "Rental Period" to "Renewal Period" was consistently applied throughout the document, with the terminology adjusted as requested. | ![stg-1003-CA_1_](/uploads/92e4fa68ac3e29838705f737112256f9/stg-1003-CA_1_.png){width=1406 height=679} | PASS |
| CT | Verify that the new disclaimer section was inserted correctly after the "Loss or Damage to Property" section, and that the "Reinstatement" section was modified according to the requested changes. | ![stg-1003-CT_1_](/uploads/753eb49d17d4b6b379e2bb5de735a348/stg-1003-CT_1_.png){width=1406 height=679}![stg-1003-CT_2_](/uploads/e777c89fc95e897473f29a63a74db1ef/stg-1003-CT_2_.png){width=1406 height=679} | PASS |
| IA | Verify that the update to the "TOTAL COST" section was applied correctly in the contract model. | ![stg-1003-IA_1_](/uploads/4bf711d926c117d7e2116b5615c68ff0/stg-1003-IA_1_.png){width=1406 height=679} | PASS |
| IL | Verify that the size of the disclosures was updated as requested and that the new language was incorporated correctly. | ![stg-1003-IL_1_](/uploads/8bfb6773ddc6997bd22842618e095a9b/stg-1003-IL_1_.png){width=1406 height=679}![stg-1003-IL_2_](/uploads/84a5b2dcdabc968ad743b1cb04681307/stg-1003-IL_2_.png){width=1406 height=679}![stg-1003-IL_3_](/uploads/94300e2d080d3dbfec0965a3ca20b242/stg-1003-IL_3_.png){width=1406 height=679} | PASS |
| IN | Verify that the statement regarding reading the entire document was added correctly and that the change to 120 days for returns was reflected. | ![stg-1003-IN_1_](/uploads/cc8149ee71175870a2ec45d21f2406ea/stg-1003-IN_1_.png){width=1406 height=679}![stg-1003-IN_2_](/uploads/906c707e328a7fccc4003802c465fb5c/stg-1003-IN_2_.png){width=1406 height=679} | PASS |
| MS | Verify that an initial line was added next to each of the numbers with a black line and white letters, as required. | ![stg-1003-MS_1_](/uploads/258fde38175f58f2bbfe84dac6183728/stg-1003-MS_1_.png){width=1406 height=679}![stg-1003-MS_2_](/uploads/af9a5dc6594bb1ed252bda871bbecd3f/stg-1003-MS_2_.png){width=1406 height=679} | PASS |
| NE | Verify that the service charge, NSF fee, and account change fee were removed as per the modification request. | ![stg-1003-NE_1_](/uploads/69ee866afc849a52fa3f9027930e6ef7/stg-1003-NE_1_.png){width=1406 height=679} | PASS |
| NY | Verify that the section related to maintenance responsibilities and warranty transfer was bolded as requested. | ![stg-1003-NY_1_](/uploads/de165fc9955123ded92f353df62a7a9e/stg-1003-NY_1_.png){width=1406 height=679} | PASS |
| OH | Verify that the initial payment size was changed as requested, and that the disclosures regarding loss/damage were updated accordingly. | ![stg-1003-OH_1_](/uploads/b767f8f9943c8383462f06f9c27447b3/stg-1003-OH_1_.png){width=1406 height=679}![stg-1003-OH_2_](/uploads/6a11f6ef87a5161bb17f48cc50953408/stg-1003-OH_2_.png){width=1406 height=679} | PASS |
| TX | Verify that the reinstatement provisions were bolded as specified. | ![stg-1003-TX_1_](/uploads/94da9d3d973a2f53c288cbf8dc76e64b/stg-1003-TX_1_.png){width=1406 height=679} | PASS |
| WV | Verify that the "cash price" was replaced by "retail value" throughout the document, and that the rent-to-own fee was added correctly near the end of the itemization. | ![stg-1003-WV_1_](/uploads/716db3fb08b7c9836e675047949d02ae/stg-1003-WV_1_.png){width=1406 height=679} | PASS |
| WI | Verify that attorney's fees and court costs were displayed in white font as requested. | ![stg-1003-WI_1_](/uploads/33bc4848b11ee8d532161afd7aa160d4/stg-1003-WI_1_.png){width=1406 height=679}![stg-1003-WI_2_](/uploads/ae0eaf1e641ffd00ef72fdf258cc24d2/stg-1003-WI_2_.png){width=1406 height=679} | PASS |
| WY | Verify that the "OTHER CHARGES" section was reorganized correctly, and that a "Disclaimer" was added as requested. | ![stg-1003-WY_1_](/uploads/8d4b5873d3c2cce32125e81c565ea537/stg-1003-WY_1_.png){width=1440 height=810} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------