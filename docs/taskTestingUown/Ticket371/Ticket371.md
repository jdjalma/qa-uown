------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/371

# UOWN | Servicing | Document Upload Fails and Hides Existing Files – NullPointerException

**Status:** Open  
**Ticket created:** 1 week ago by Yuri Araujo  
**Type:** BUG

It was reported by an Agent that when trying to upload a document to an account in the Production environment, the document was not uploaded, and additionally, the list of previously existing documents stopped being displayed.

- **Error:** "Internal Server Error"
- **Message:** "Request processing failed; nested exception is java.lang.NullPointerException: Cannot invoke 'com.uownleasing.dms.common.enumeration.CorrespondenceType.equals(Object)' because the return value of 'com.uownleasing.dms.common.db.embeddable.StoredDocInfo.getCorrespondenceType()' is null"
- **Path:** "/uown/svc/getFilesForAccount"

This behavior was also reproduced in Sandbox and Staging environments. However, in those cases, the list of existing documents was not cleared, only the upload failed.

---

## Expected Fix

- Document upload must work correctly.
- The absence of data in CorrespondenceType should not cause an API failure.
- The document list must remain visible (as it disappeared in Production).

---

## Testing Steps

1. Check if the document upload no longer results in an error and displays a toast success message:

   ![Success toast](73119e71-1dc2-4094-811d-00d53841c51b.png)

2. If the document takes too long to upload, an informative message should appear:

   ![Upload in progress](423c0be7-2a69-4919-b585-1499edfffd78.png)

3. After upload, the normal success message should be displayed:

   ![Successful upload](d21e4a35-a457-466f-b666-ded8220fdae9.png)

4. The list of existing documents must remain visible after upload, even in case of failure.

-----

# UOWN | Servicing | Falha no Upload de Documentos e Ocultação de Arquivos Existentes – NullPointerException

**Status:** Aberto  
**Tíquete criado:** 1 semana atrás por Yuri Araujo  
**Tipo:** BUG

Foi reportado por um agente que ao tentar fazer o upload de um documento para uma conta no ambiente de Produção, o documento não foi enviado, 
e além disso, a lista de documentos existentes parou de ser exibida.

- **Erro:** "Internal Server Error"
- **Mensagem:** "Request processing failed; nested exception is java.lang.NullPointerException: Cannot invoke 'com.uownleasing.dms.common.enumeration.CorrespondenceType.equals(Object)' because the return value of 'com.uownleasing.dms.common.db.embeddable.StoredDocInfo.getCorrespondenceType()' is null"
- **Path:** "/uown/svc/getFilesForAccount"

Esse comportamento também foi reproduzido nos ambientes de Sandbox e Staging. No entanto, nesses casos, a lista de documentos existentes não foi ocultada, apenas o upload falhou.

---

## Correção esperada

- O upload de documentos deve funcionar corretamente.
- A ausência de dados em CorrespondenceType não pode causar falha na API.
- A lista de documentos deve permanecer visível (como desapareceu em Produção).

---

## Passos para Teste

1. Verifique se o upload de documentos não resulta mais em erro e exibe uma mensagem toast de sucesso:

   ![Toast de sucesso](73119e71-1dc2-4094-811d-00d53841c51b.png)

2. Se o documento demorar para ser enviado, deve aparecer uma mensagem informativa:

   ![Upload em andamento](423c0be7-2a69-4919-b585-1499edfffd78.png)

3. Após o upload, a mensagem de sucesso deve ser exibida normalmente:

   ![Upload realizado](d21e4a35-a457-466f-b666-ded8220fdae9.png)

4. A lista de documentos existentes deve continuar visível após upload, mesmo em caso de falha.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Upload de documento válido
Realizar upload de um arquivo permitido (por exemplo, PDF ou DOCX pequeno).
Esperado: upload realizado com sucesso e toast/mensagem positiva exibida.
A lista de documentos continua visível e mostra o novo arquivo.
png
PDF
excel
DOCX
txt
jpeg

2. Ausência de Document Type
Realizar upload ou buscar lista de documentos onde um dos arquivos esteja com o campo Document Type nulo no backend (simular ou forçar via banco/dados de teste).
Esperado: a API não lança erro 500/NullPointerException, lista continua visível, outros dados aparecem normalmente.
O sistema trata o arquivo com Document Type nulo de forma "graceful" (por exemplo, exibe “Tipo desconhecido” ou oculta o campo).
--> Quando selecionamos um tipo de documento e removemos, exibe o aviso informando que é obrigatorio selecionar o arquivo, porém ao clicar em "Add document" o aviso é removido, nesse caso o aviso deve se manter até selecionar o tipo de documento

3. Lista de documentos permanece visível
Após tentativas de upload bem-sucedidas, mal-sucedidas (por erro de arquivo, timeout, etc.) e em cenários com arquivos problemáticos.
Esperado: em nenhum cenário a lista desaparece da tela.
--> Quando o tipo de documento selecionado é removido do campo exibe o aviso informando obrigatoriedade de seleção do tipo de documento, porém ao clicar em adicionar o aviso é removido e deve ser mantido até a seleção do tipo de documento
--> Quando selecionado a opção "Please select a document type" e adicionado documento o mesmo não é salvo

4. Upload de arquivo muito grande
Tentar fazer upload de arquivo acima do limite permitido pelo sistema.
Esperado: mensagem de erro clara, upload não realizado, lista de documentos permanece visível, sem erro 500.
--> WARN - O tamanho de arquivo limite aceito é 24MB, porém ao tentar adicionar documento de 20MB é retornado erro, sugiro ajustar o limite para 20MB e ao adicionar arquivos de 20MB ou mais retornar mensagem de tamanho limite permitido.

5. Upload de arquivo com tamanho zerado
Tentar fazer upload de arquivo vazio (0 bytes).
Esperado: mensagem de erro clara (ex: "Arquivo vazio não permitido"), sem travar sistema/API, lista de documentos continua visível.
-->OK - Aviso exibido informando que arquivo não foi selecionado e deve ser selecionado

6. Upload de arquivo inválido (tipo não permitido)
Tentar fazer upload de arquivo de tipo não suportado (ex: .exe, .bat, etc.).
Esperado: erro amigável ("Tipo de arquivo não suportado"), lista visível, nada de erro 500.
--> WARN - Aceita qualquer tipo de arquivo

7. Não selecionar visible to borrower
--> fica true deve ficar null

8. editar
--> ERROR - nao salva edicao

9. fazer download
OK


10. buscar por documentos
--> ERROR - Ao realizar busca nao e possivel visualizar todos os documentos ou realizar outra busca


11. visible to borrower em website
--> ERROR - Documentos adicionados com visible to borrower true não são exibidos para o cliente no portal website


12. Visible to borrower exibir yes ou no ao inves de true ou false <--
Estamos exibindo yes ou true podemos exibir sim ou nao

-----

## Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | -------- | --------- | --------- | ------ | ----------- |
| 3931 and 3925     | Progress Mobility        | Upload de um arquivo permitido (png, PDF, excel, DOCX, txt, jpeg). |            | PASS | -- |
| 3925 and 3931      | X        | Ausência de Document Type |            | PASS | Aviso obrigatório deve permanecer até seleção do tipo de documento. |
| 3931 | Progress Mobility | Lista de documentos permanece visível após uploads bem ou mal sucedidos. |            | PASS | Aviso de obrigatoriedade deve ser mantido até seleção, documentos não salvos se tipo for "Please select a document type". |
| 3931 | Progress Mobility | Upload de arquivo muito grande  |            | PASS | Limite aceito é 24MB, erro aos 20MB. Sugerido ajustar limite para 20MB e mensagem clara. |
| 3931 | Progress Mobility | Upload de arquivo com tamanho zerado |            | PASS | -- |
| 3931 | Progress Mobility | Upload de arquivo inválido .exe, .bat, etc. |            | PASS | Aceita qualquer tipo atualmente. |
| 3931 | Progress Mobility | Não selecionar visible to borrower |            | PASS | Atualmente fica true. |
| 3930 | Progress Mobility | Editar documento |            | PASS | ERRO – Não salva edição. |
| 3931 | Progress Mobility | Fazer download |            | PASS | -- |
| 3931 and 3932 | Progress Mobility | Buscar por documentos |            | PASS | Após busca, não é possível visualizar todos os documentos ou buscar novamente. |
| 3932 | Progress Mobility | visible to borrower em website |            | PASS | Documentos adicionados com visible to borrower true pelo portal servicing antes de adicionar algum documento pelo portal origination, não aparecem para o cliente no portal website. |

Em todos os testes a lista de documentos se manteve visível na interface
Em "visible to borrower", atualmente exibe yes/true, sugerido exibir sim/não.  
Todos os erros encontrados não são escopo dessa tarefa, por isso será analisado a necessidade de criação de backlog.


-----


## Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | -------- | --------- | --------- | ------ | ----------- |
| 3931 and 3925 | Progress Mobility | Upload a permitted file (png, PDF, Excel, DOCX, txt, jpeg). | | PASS | -- |
| 3925 and 3931 |  Progress Mobility | Absence of Document Type | | PASS | The required warning must remain until document type is selected. |
| 3931 | Progress Mobility | Document list remains visible after successful or failed uploads. | | PASS | Required warning must be maintained until selection; documents are not saved if the type is "Please select a document type". |
| 3931 | Progress Mobility | Upload a very large file | | PASS | Accepted file size limit is 24MB, error occurs at 20MB. Suggested to adjust the limit to 20MB and display a clear message. |
| 3931 | Progress Mobility | Upload a zero-size file | | PASS | -- |
| 3931 | Progress Mobility | Upload an invalid file type (.exe, .bat, etc.) | | PASS | Currently accepts any file type. |
| 3931 | Progress Mobility | Do not select visible to borrower | | PASS | Currently defaults to true. |
| 3930 | Progress Mobility | Edit document | | PASS | ERROR – Edit is not saved. |
| 3931 | Progress Mobility | Download | | PASS | -- |
| 3931 and 3932 | Progress Mobility | Search for documents | | PASS | After search, it is not possible to view all documents or perform a new search. |
| 3932 | Progress Mobility | visible to borrower in website | | PASS | Documents added with visible to borrower true through the servicing portal before adding any document via origination portal are not visible to the client on the website portal. |

In all tests, the document list remained visible in the interface.  
For "visible to borrower", currently shows true/false; it is suggested to display yes/no.  
All errors found are not in the scope of this task, therefore, the need for backlog creation will be evaluated.

-----

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | -------- | --------- | --------- | ------ | ----------- |
| 3931 and 3925 | Progress Mobility | Upload a permitted file (png, PDF, Excel, DOCX, txt, jpeg). | ![371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_3_](/uploads/2315e2c471735fe5d0a485269ffcb5fc/371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_3_.png){width=1438 height=742}![371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_4_](/uploads/acf4d6e591abe7ebc3b97ee8f647db89/371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_4_.png){width=1438 height=742}![371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_5_](/uploads/800bd02d066e25be9d8e5ebd13d5f576/371-qa1-c1-servicing-OK-UploadDocumentoValido-DOCX-_5_.png){width=1073 height=51}![371-qa1-c1-servicing-OK-UploadDocumentoValido-EXCEL-_1_](/uploads/9539c3995f1fd2918bc086df38f539e9/371-qa1-c1-servicing-OK-UploadDocumentoValido-EXCEL-_1_.png){width=930 height=327}![371-qa1-c1-servicing-OK-UploadDocumentoValido-PDF-_2_](/uploads/45d359f4b4c59911aaeb996e298e1f0e/371-qa1-c1-servicing-OK-UploadDocumentoValido-PDF-_2_.png){width=1439 height=740}![371-qa1-c1-servicing-OK-UploadDocumentoValido-PDF-_4_](/uploads/169f4e4c2e627043e8e1d5e4f08a848e/371-qa1-c1-servicing-OK-UploadDocumentoValido-PDF-_4_.png){width=1170 height=37}![371-qa1-c1-servicing-OK-UploadDocumentoValido-PNG-_2_](/uploads/a5d9fb560566683f928752b93a295eb9/371-qa1-c1-servicing-OK-UploadDocumentoValido-PNG-_2_.png){width=1440 height=744}![371-qa1-c1-servicing-OK-UploadDocumentoValido-TXT-_3_](/uploads/fa4b3dc7bef7b7b8c9dbb9a28747dfd7/371-qa1-c1-servicing-OK-UploadDocumentoValido-TXT-_3_.png){width=1437 height=740} | PASS | -- |
| 3925 and 3931 | X | Absence of Document Type | ![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__2_](/uploads/7f7f1d0595b894d6bebd82cd252d9ae4/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__2_.png){width=1437 height=741}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__3_](/uploads/4699f862834dc733acc213bb8b99e05c/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__3_.png){width=1437 height=741}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__6_](/uploads/4aae5f02b5f0ba6109a33ebff1d4ae83/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E1__6_.png){width=1169 height=156}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__1_](/uploads/1fa6bf68753bfba5ee4e392c1f3a2986/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__1_.png){width=1067 height=74}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__4_](/uploads/a1482bb9ee2c7ac072f52e0a0bec3f1b/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__4_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__5_](/uploads/3ba0e699772facbb83f1147c03a179a9/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__5_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__6_](/uploads/b8ddd8e837d406fdec116b989c07767e/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-DeveAdicionarOArquivoSemTipoDocumento_E2__6_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_1_](/uploads/11eca04880bacc768700a4a5d9da0c51/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_1_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_2_](/uploads/f6826b509777c504dd5376eb20ddac14/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_2_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_3_](/uploads/ee883f03fab9b874dc9c33cf9d162a49/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_3_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_4_](/uploads/df835b86b520cce23ba16189096b4a81/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_4_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_5_](/uploads/f701bd7d897e3d4b6cd5ff444fa942b5/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_5_.png){width=1439 height=742}![371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_6_](/uploads/5c46410a026ca86d87770c90026fa53b/371-qa1-c2-servicing-ERROR-AusenciaDocumentType-QuandoRemovidoDocumentTypeExibeAvisoAoClicarEmAdicionarAvisoERemovido-_6_.png){width=1439 height=742} | PASS | The required warning must remain until document type is selected. |
| 3931 | Progress Mobility | Document list remains visible after successful or failed uploads. | ![371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_1_](/uploads/ebb791483415f828bada7f17e703bebb/371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_1_.png){width=890 height=741}![371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_2_](/uploads/809fecc2145132986bdd197a0cdc9615/371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_2_.png){width=1440 height=741}![371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_3_](/uploads/59c5c8a7ae47087e1f50fe54047edf37/371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_3_.png){width=1440 height=741}![371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_4_](/uploads/c42f91740a4ff6ba0667fc50258a2ba0/371-qa1-c3-servicing-OK-ListaDocumentosPermaneceVisivel-_4_.png){width=1440 height=741} | PASS | Required warning must be maintained until selection; documents are not saved if the type is "Please select a document type". |
| 3931 | Progress Mobility | Upload a very large file | ![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_1_](/uploads/cf07fba0350cc095ee33bd0e790b0075/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_1_.png){width=890 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_2_](/uploads/bea2aff94013fb08c66ed9f5c2eb8f8e/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_2_.png){width=890 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_3_](/uploads/68746bcb6a4071b8f3a3168c4fdde1a8/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_3_.png){width=890 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_4_](/uploads/806b3dcde77ebfabb4c7f0bd286fd6fa/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_4_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_5_](/uploads/0233c6febc3006a0e6d044d120273b09/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_5_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_6_](/uploads/a42c492ced8de1b925c95676c8d04979/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_6_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_7_](/uploads/de91054a0582da56537f0a62ea28e512/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_7_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_8_](/uploads/20214f6131748763129b2ed0f781f894/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_8_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_9_](/uploads/4c541a2ce8061209eb13de87d28fe84e/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_9_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_10_](/uploads/467e9b27dbdb8eaa5bd7615e740766eb/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_10_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_11_](/uploads/18cff105576e61248a82b68409cb5548/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_11_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_12_](/uploads/7aa691ac1255666ab055a47e5703e083/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_12_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_13_](/uploads/d6fa6ff15ce0a9ea7a6837d955f3657a/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_13_.png){width=1440 height=741}![371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_14_](/uploads/250524babdc4ae9c4740aba88f61e069/371-qa1-c4-servicing-OK-ArquivoMuitoGrande-_14_.png){width=1065 height=40} | PASS | Accepted file size limit is 24MB, error occurs at 20MB. Suggested to adjust the limit to 20MB and display a clear message. |
| 3931 | Progress Mobility | Upload a zero-size file |![371-qa1-c5-servicing-OK-ArquivoTamanhoZerado-_2_](/uploads/a5f03ee901bc49962f635adeee4f0e9e/371-qa1-c5-servicing-OK-ArquivoTamanhoZerado-_2_.png){width=1437 height=741} | PASS | -- |
| 3931 | Progress Mobility | Upload an invalid file type (.exe, .bat, etc.) | ![371-qa1-c6-servicing-ERROR-UploadArquivoInvalido-AceitaQualquerTipoDeArquivo-_1_](/uploads/827b415d9dca3f99c2088dbdff7c7dad/371-qa1-c6-servicing-ERROR-UploadArquivoInvalido-AceitaQualquerTipoDeArquivo-_1_.png){width=1437 height=741}![371-qa1-c6-servicing-ERROR-UploadArquivoInvalido-AceitaQualquerTipoDeArquivo-_2_](/uploads/1062798204fc1a541884778d6f28aaf1/371-qa1-c6-servicing-ERROR-UploadArquivoInvalido-AceitaQualquerTipoDeArquivo-_2_.png){width=1437 height=741} | PASS | Currently accepts any file type. |
| 3931 | Progress Mobility | Do not select visible to borrower | ![371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_1_](/uploads/cc005737683269f6860be593ea872bb7/371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_1_.png){width=1437 height=741}![371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_2_](/uploads/34e135c73f4fe2a19be74eb41b2dea7b/371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_2_.png){width=1437 height=741}![371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_3_](/uploads/f58b0d6bca91bbf3a9a9a08857c3c1da/371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_3_.png){width=1437 height=741}![371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_4_](/uploads/1e8c5e1ecffb2bc719a6c99cdf1ecb16/371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_4_.png){width=1437 height=741}![371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_5_](/uploads/f720bc3c00f209b1568cea766520f160/371-qa1-c7-servicing-ERROR-NaoSelecionarVisibleToBorrower-ArmazenaTrueAoDeixarCampoLimpo-_5_.png){width=1074 height=41} | PASS | Currently defaults to true. |
| 3930 | Progress Mobility | Edit document | ![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__1_](/uploads/96f9e5de91a3cd22e96b758c79095ab5/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__1_.png){width=1143 height=51}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__2_](/uploads/f5916062971c3273a3f3be5ddb646122/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__2_.png){width=1437 height=737}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__3_](/uploads/5e571eabd0a78caf3194b65bccbcc3d9/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__3_.png){width=1437 height=737}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__4_](/uploads/b5fbf7450c24e98475fed6852abc2cc4/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__4_.png){width=1437 height=737}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__5_](/uploads/65a1924fd2a57a21c2687dbda5fa0b21/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__5_.png){width=1437 height=737}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__6_](/uploads/e2cc2d283b86e734a6f2d4e493a4d5a9/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__6_.png){width=972 height=737}![371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__7_](/uploads/3c39ec7bad7ac7b15da9db4e47a66edd/371-qa1-c8-servicing-ERROR-editar-NaoSalvaEdicao-_E2__7_.png){width=1143 height=61} | PASS | ERROR – Edit is not saved. |
| 3931 | Progress Mobility | Download | -- | PASS | -- |
| 3931 and 3932 | Progress Mobility | Search for documents | ![371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__1_](/uploads/44f6db00c2139a80e43d47db68c3cd97/371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__1_.png){width=1434 height=741}![371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__2_](/uploads/c7280dc4754e4b2f1805d70faaab5c22/371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__2_.png){width=752 height=742}![371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__3_](/uploads/16ac5bc5b6b5d49239f9ba8578086705/371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__3_.png){width=752 height=742}![371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__4_](/uploads/d5d288901018070dbd3e3e642a39b856/371-qa1-c10-servicing-ERROR-buscarPorDocumentos-AoRealizarBuscaNaoExibeTodosOsDocumentosAposBusca-_E1__4_.png){width=752 height=742} | PASS | After search, it is not possible to view all documents or perform a new search. |
| 3932 | Progress Mobility | visible to borrower in website | ![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_1_](/uploads/1bc843c1138c4ff0c9b00a38d8d507dd/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_1_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_2_](/uploads/589cd6f09a572012bc3910db2eb0ed43/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_2_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_3_](/uploads/2563f623bbde8e56fce8200bef239747/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_3_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_4_](/uploads/94f660e64e06c24ad2c1eb4a9bf01160/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_4_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_5_](/uploads/6e7a68603e1c36f378536469fb120bd8/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_5_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_6_](/uploads/407860596cada4fa2e6e4f98437cc3a1/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_6_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_7_](/uploads/8c42e1d889a87b9f7dc3c04437128b8f/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_7_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_8_](/uploads/acc10d19ab90463081b3abda1ae4ffe8/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_8_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_9_](/uploads/19e2ac5528c2399cea93426958507c57/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_9_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_10_](/uploads/356456f8d11c7331094a6dadd4c9f651/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_10_.png){width=1439 height=741}![371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_11_](/uploads/f4d33fc611962724a6735a8a702a5cec/371-qa1-c11-ERROR-visibleToBorrowerTrueExibeWebsite-QuandoAdicionaEmServicingNaoExibeWebsiteSomenteSeAdicionarEmOrigination-_11_.png){width=1439 height=741} | PASS | Documents added with visible to borrower true through the servicing portal before adding any document via origination portal are not visible to the client on the website portal. |

In all tests, the document list remained visible in the interface.  
For "visible to borrower", currently shows true/false; it is suggested to display yes/no.  
All errors found are not in the scope of this task, therefore, the need for backlog creation will be evaluated.

-----

Upload a permitted file (png, PDF, Excel, DOCX, txt, jpeg).
Absence of Document Type
Document list remains visible after successful or failed uploads.
Upload a very large file
Upload a zero-size file
Upload an invalid file type (.exe, .bat, etc.)
Do not select visible to borrower
Edit document
Download
Search for documents
visible to borrower in website

Faça upload de um arquivo permitido (png, PDF, Excel, DOCX, txt, jpeg). - deve aceitar todos
Ausência de Tipo de Documento - aceita salvar sem o tipo comportamento do sistema
Lista de documentos permanece visível após uploads bem-sucedidos ou com falha. - PASS
Faça upload de um arquivo muito grande - PASS
Faça upload de um arquivo com tamanho zero - PASS - sistema retorna aviso informando para selecionar arquivo válido
Visível para o tomador no site - PASS

-----

> ## Tests in -
> ```gherkin
> ### Funcionalidade: Upload de Documentos
>
> Cenário: Faça upload de um arquivo permitido (png, PDF, Excel, DOCX, txt, jpeg)
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário seleciona e faz upload de um arquivo permitido (png, PDF, Excel, DOCX, txt, jpeg)
> Então o sistema deve aceitar o upload do arquivo
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Cenário: Ausência de Tipo de Documento
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário faz upload de um arquivo sem selecionar o tipo de documento
> Então o sistema aceita salvar sem o tipo de documento, conforme o comportamento do sistema
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Cenário: Lista de documentos permanece visível após uploads bem-sucedidos ou com falha.
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário realiza uploads bem-sucedidos ou com falha
> Então a lista de documentos permanece visível
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Cenário: Faça upload de um arquivo muito grande
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário tenta fazer upload de um arquivo muito grande
> Então o sistema trata a situação adequadamente
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Cenário: Faça upload de um arquivo com tamanho zero
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário faz upload de um arquivo com tamanho zero
> Então o sistema retorna aviso informando para selecionar arquivo válido
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Cenário: Visível para o tomador no site
> Dado que o usuário está na tela de upload de documentos
> Quando o usuário faz upload de um documento selecionando a opção "Visible to Borrower"
> Então o documento enviado fica visível para o tomador no portal do cliente
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
> ### Feature: Document Upload
> 
> ### Scenario: Upload a permitted file (png, PDF, Excel, DOCX, txt, jpeg)
> Given the user is on the document upload screen
> When the user selects and uploads a permitted file (png, PDF, Excel, DOCX, txt, jpeg)
> Then the system must accept the file upload
> | PASS | AccountPk 206399 | Merchant Progress Mobility | 
> ```
>

> 
> ```gherkin
> ### Scenario: Absence of Document Type
> Given the user is on the document upload screen
> When the user uploads a file without selecting the document type
> Then the system accepts saving without the document type, according to the system behavior
> | PASS | AccountPk 206399 | Merchant Progress Mobility | 
> ```
>

> 
> ```gherkin
> ### Scenario: Document list remains visible after successful or failed uploads.
> Given the user is on the document upload screen
> When the user performs successful or failed uploads
> Then the document list remains visible
> | PASS | AccountPk 206399 | Merchant Progress Mobility | 
> ```
>

> 
> ```gherkin
> ### Scenario: Upload a very large file
> Given the user is on the document upload screen
> When the user tries to upload a very large file
> Then the system handles the situation appropriately
> | PASS | LeadPk 24041 / AccountPk 206399 | Merchant Progress Mobility | 
> ```
>

> 
> ```gherkin
> ### Scenario: Upload a file with zero size
> Given the user is on the document upload screen
> When the user uploads a file with zero size
> Then the system returns a warning asking to select a valid file
> | PASS | AccountPk 206399 | Merchant Progress Mobility | 
> ```
>

> 
> ```gherkin
> ### Scenario: Visible to the borrower on the site
> Given the user is on the document upload screen
> When the user uploads a document selecting the "Visible to Borrower" option
> Then the uploaded document becomes visible to the borrower in the client portal
> | PASS | LeadPk 24038 / AccountPk 206399 | Merchant Progress Mobility | 
> ```
>