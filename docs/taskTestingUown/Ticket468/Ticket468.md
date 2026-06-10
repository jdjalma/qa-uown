------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/468

UOWN | Servicing | Improve file name display in Servicing logs and Customer Portal documents

Synopsis
Improvement in the display of file names in the Documents section of the Customer Portal and in the log table of the Servicing portal, 
based on the solution already implemented in the Origination portal. The goal is to make file names more readable, clean, and user-friendly, 
enhancing the overall navigation experience.

Business Objective
Standardize the way file names are presented across the three portals (Origination, Customer Portal, and Servicing), 
ensuring consistency and improving clarity and usability of the information displayed to users.

Feature Request | Business Requirements
* Apply the improved file name display in the Documents tab of the Customer Portal, following the pattern implemented in the Origination portal.
* Apply the same improvement in the log table of the Documents tab in the Servicing portal, replacing long and cluttered text with readable file names.
* Validate responsiveness across different screen sizes.
* Ensure there are no regressions in the current file display behavior.
* If possible, assess the reuse or centralization of display components across the portals.
* CHECK IMAGE BELOW

Davi Artur @davi.artur.gow
Test Case: Validate standardized and readable file name display
Scope:
Ensure the improved file name formatting is correctly applied and consistent across the following environments:
* Customer Portal
* Servicing Portal
* Origination Portal
What to validate:
* File names are displayed in a clean, readable, and user-friendly format
* Layout is responsive on different screen sizes
* No regressions in existing file display behavior

-----

UOWN | Atendimento | Melhorar a exibição de nomes de arquivos nos logs do Atendimento e nos documentos do Portal do Cliente

Resumo

Melhoria na exibição de nomes de arquivos na seção Documentos do Portal do Cliente e na tabela de logs do Portal de Atendimento, com base na solução já implementada no Portal de Originação. O objetivo é tornar os nomes dos arquivos mais legíveis, limpos e amigáveis ao usuário, melhorando a experiência geral de navegação.

Objetivo de Negócio

Padronizar a forma como os nomes dos arquivos são apresentados nos três portais (Originação, Portal do Cliente e Atendimento), garantindo consistência e melhorando a clareza e a usabilidade das informações exibidas aos usuários.

Solicitação de Recurso | Requisitos de Negócio





Aplicar a exibição aprimorada de nomes de arquivos na aba Documentos do Portal do Cliente, seguindo o padrão implementado no Portal de Originação.



Aplicar a mesma melhoria na tabela de logs da aba Documentos no Portal de Atendimento, substituindo textos longos e desorganizados por nomes de arquivos legíveis.



Validar a responsividade em diferentes tamanhos de tela.



Garantir que não haja regressões no comportamento atual de exibição de arquivos.



Se possível, avaliar a reutilização ou centralização de componentes de exibição entre os portais.



VERIFICAR A IMAGEM ABAIXO

Davi Artur @davi.artur.gow

Caso de Teste: Validar a exibição padronizada e legível de nomes de arquivos

Escopo:
Garantir que a formatação aprimorada de nomes de arquivos seja corretamente aplicada e consistente nos seguintes ambientes:
Portal do Cliente
Portal de Servicing
Portal de Origination

O que verificar:
Os nomes dos arquivos são exibidos em um formato limpo, legível e amigável ao usuário.
O layout é responsivo em diferentes tamanhos de tela.
Não há regressões no comportamento atual de exibição de arquivos.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

4. Testes recomendados:
Upload com arquivos com nomes longos e confusos.

Upload em diferentes navegadores e telas.

Consistência de exibição entre Customer Portal, Servicing Portal e Origination Portal.

1. Upload manual de arquivos com nomes “ruins”
Upload de arquivo com nome como: DRIVERSLICENSE_2024-06-25_Luiz@XPTO_v2_FINAL.pdf
Esperado: Exibe apenas "Drivers License" (ou nome amigável definido).
--> ERRO - O nome armazenado foi DRIVERSLICENSE_2024-06-25_Luiz@XPTO_v2_FINAL.pdf, nesse caso devemos armazenar o nome do arquivo e exibnir apenas "Drivers License" no frontend

2. Documentos com templateName
Upload ou visualização de documento que tenha templateName definido no metadata.
--> testar no svc
Esperado: Exibir exatamente o templateName.

3. Documentos Lease Agreement
Documento cujo path inclui "Lease Agreement", especialmente PDFs.
Esperado: Exibir "Signed Lease Agreement" ou "Lease Agreement" conforme a extensão.
--> ok

4. Remoção de símbolos e limpeza
Testar nomes com muitos underscores, números, datas, hífens etc.
Esperado: Nome final exibido sem esses caracteres, com espaçamento amigável.
--> ERRO - Erro-Nao Esta Tornando O Nome Amigavel-Sugestao Exibir O Document Type De Forma Amigavel

5. Documentos sem templateName e nomes aleatórios
Upload de arquivo chamado welcome-EMAIL_2024-04-30-16-40-02.html
Esperado: Exibe "Welcome Email" ou formato equivalente legível.
--> ERRO - O nome gerado nao é Welcome Email

6. Responsividade
Validar que a exibição do nome amigável funciona bem em diferentes larguras de tela (desktop, tablet, mobile).
--> RETESTAR - será testado apos ajuste do nome amigável

7. Consistência em todas as telas
Verificar que o nome aparece igual nas três áreas: Origination, Servicing e Customer Portal.
--> OK

8. Não exibição de extensões
A extensão do arquivo não é exibida no nome final apresentado ao usuário.
--> ERRO - extensão do arquivo é exibido.

9. Fallback para path limpo
Quando não houver template ou padrão reconhecido, exibir o nome limpo extraído do path.
--> Essa regra será melhorada para exibir o nome amigável e não exibir o nome do arquivo

10. Manter rastreabilidade
Garantir que o nome exibido seja amigável, mas o nome original ainda deve ser armazenado para fins administrativos (auditoria, download, rastreio técnico).
--> Ainda não sei a tabela do banco de dados que guarda os documentos

-----

Quando usuários fazem upload manual, o nome do arquivo vem do sistema de arquivos do usuário e pode ser confuso, longo, cheio de caracteres especiais, datas, números de protocolo, etc. Isso realmente pode prejudicar a experiência, especialmente quando o objetivo é padronizar e tornar a visualização dos nomes limpa e amigável.
Nesse caso podemos exibir um nome amigável?
Exibir um nome amigável, baseado no tipo do documento
* Ao fazer o upload, já sugerir um nome padrão baseado no tipo selecionado no dropdown, já que no dropdown so temos opções fixas
    * Ex: Selecionou DRIVERSLICENSE → Sugerir: "Carteira de Motorista".
    * Selecionou PAYSTUB → Sugerir: "Holerite" ou "Comprovante de Pagamento".

Normalizar o nome do arquivo automaticamente
    * Remover caracteres especiais, underscores, números excessivos, datas desnecessárias, etc.
    * Ex: driverslicense_2023-02-18_Luiz@124512.pdf → Drivers License.pdf. Caso tenha mais de uma diverslicense o usuario pode se orientar pela data e hora e havendo duvidas tem a possibilidade de fazer download e visualizar arquivo.
* Transformar em maiúsculas/minúsculas padronizadas.
* Substituir underline ou hífen por espaço.

Exibir apenas o nome amigável no portal
* No frontend, mostrar só o nome amigável para o usuário, mas manter o nome original salvo no backend, se necessário para rastreabilidade.

Dessa forma nossa Interface se torna mais padronizada e profissional.
Reduzimos o risco de exposição de dados pessoais em nomes de arquivo.
Evitamos poluição visual, facilitamos a busca e leitura rápida pelo usuário.

** SUGESTAO * * --> Edição manual do nome amigável antes de finalizar o upload.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Melhorando a Exibição dos Nomes de Arquivos em Uploads Manuais

Quando os usuários fazem upload manual de documentos, o nome do arquivo vem diretamente do sistema de arquivos do usuário. Frequentemente, esses nomes são confusos, longos e cheios de caracteres especiais, datas, números de protocolo, versões e outros elementos que dificultam a identificação. Isso pode prejudicar a experiência do usuário, especialmente quando o objetivo é exibir nomes de documentos de forma limpa e amigável.

#### Exibição de Nome Amigável com Base no Tipo de Documento

- Ao fazer o upload, sugerir automaticamente um nome padrão de acordo com o tipo de documento selecionado no dropdown (que possui opções fixas).
    - Exemplo: Selecionou `DRIVERSLICENSE` → Sugerir: "Carteira de Motorista".
    - Selecionou `PAYSTUB` → Sugerir: "Holerite" ou "Comprovante de Pagamento".

#### Normalização do Nome do Arquivo

- Remover caracteres especiais, underscores, números excessivos, datas desnecessárias etc.
    - Exemplo: `driverslicense_2023-02-18_Luiz@124512.pdf` → "Drivers License".
    - Caso haja mais de um documento do mesmo tipo, o usuário pode se orientar pela data/hora do upload ou, em caso de dúvida, baixar o arquivo para conferência.
- Aplicar padronização de maiúsculas e minúsculas.
- Substituir underlines ou hífens por espaço.

#### Interface do Usuário

- No frontend, mostrar apenas o nome amigável para o usuário, mantendo o nome original salvo no banco de dados para rastreabilidade, se necessário.

#### Benefícios

- Interface mais padronizada e profissional.
- Redução do risco de exposição de dados pessoais em nomes de arquivos.
- Menos poluição visual, facilitando a busca e a leitura rápida dos nomes dos documentos.

-----

### Improving File Name Display for Manual Uploads

When users manually upload documents, the file name comes directly from the user's file system. Often, these names are confusing, lengthy, and full of special characters, dates, protocol numbers, version info, and other elements that make identification harder. This can negatively impact the user experience, especially when the goal is to provide a clean and user-friendly view of document names.

#### Displaying a Friendly Name Based on Document Type

- When uploading, automatically suggest a default name according to the document type selected in the (fixed options) dropdown.
    - Example: Selected `DRIVERSLICENSE` → Suggest: "Driver's License".
    - Selected `PAYSTUB` → Suggest: "Pay Stub" or "Proof of Payment".

#### Normalizing the File Name

- Remove special characters, underscores, excessive numbers, unnecessary dates, etc.
    - Example: `driverslicense_2023-02-18_Luiz@124512.pdf` → "Drivers License".
    - If there is more than one document of the same type, the user can use the upload date/time for orientation, or download and check the file if in doubt.
- Apply standardized capitalization.
- Replace underscores or hyphens with spaces.

#### User Interface

- On the frontend, show only the friendly name to the user, while keeping the original file name stored in the database for traceability if needed.

#### Benefits

- More standardized and professional interface.
- Reduced risk of exposing personal data in file names.
- Less visual clutter, making it easier for users to quickly search and read document names.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


### Improving File Name Display for Manual Uploads

@davi.artur.gow When users manually upload documents, the file name comes directly from the user's file system. Often, these names are confusing, lengthy, and full of special characters, dates, protocol numbers, version info, and other elements that make identification harder. This can negatively impact the user experience, especially when the goal is to provide a clean and user-friendly view of document names.

#### Displaying a Friendly Name Based on Document Type

- When uploading, automatically suggest a default name according to the document type selected in the (fixed options) dropdown.
    - Example: Selected `DRIVERSLICENSE` → Suggest: "Driver's License".
    - Selected `PAYSTUB` → Suggest: "Pay Stub" or "Proof of Payment".

#### Normalizing the File Name

- Remove special characters, underscores, excessive numbers, unnecessary dates, etc.
    - Example: `driverslicense_2023-02-18_Luiz@124512.pdf` → "Drivers License".
    - If there is more than one document of the same type, the user can use the upload date/time for orientation, or download and check the file if in doubt.
- Apply standardized capitalization.
- Replace underscores or hyphens with spaces.

#### User Interface

- On the frontend, show only the friendly name to the user, while keeping the original file name stored in the database for traceability if needed.

#### Benefits

- More standardized and professional interface.
- Reduced risk of exposing personal data in file names.
- Less visual clutter, making it easier for users to quickly search and read document names.

---

![468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_1_](/uploads/e907981fe994a3f0b73e40f5760435ed/468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_1_.png){width=921 height=745}

![468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_2_](/uploads/fede04557bee0298d2e20bfc15c73628/468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_2_.png){width=921 height=745}

![468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_7_](/uploads/5a2006b8b85c80c8710f6bd705df778e/468-qa1-BadNames-Erro-DeveExibirNomeAmigavelExibindoNomeDoArquivo-_7_.png){width=1438 height=747}

-----

Solicitado melhoria no cenário onde o usuario insere documento manualmente, nome do documento deve ser o tipo exibido mais amigavelmente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

-----

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
|--------|----------|-----------|-----------|--------|-------------|
| X | X | Dado que o documento possui o campo `templateName` no metadata<br>Quando o documento for exibido<br>Então a interface deve mostrar o `templateName` como nome amigável | - | PASS | - |
| X | X | Dado que o caminho do documento contém "Lease Agreement"<br>Quando o documento for exibido<br>Então deve ser mostrado "Lease Agreement" ou "Signed Lease Agreement" conforme o caso | - | PASS | - |
| X | X | Dado que eu faço upload de um arquivo com nome grande <br>Quando o sistema processa o nome do arquivo<br>Então o nome original deve ser exibido truncado com "..." e tooltip deve conter o nome completo | OK - Nome truncado corretamente e tooltip exibe o nome original completo | PASS | - |
| X | X | Dado que visualizo documentos em diferentes tamanhos de tela<br>Quando a interface é renderizada<br>Então os nomes devem ser exibidos de forma clara | - | PASS | - |
| X | X | Dado que eu abro a lista de documentos nos três portais<br>Quando comparo a exibição dos nomes<br>Então os nomes devem ser consistentes (com truncamento e tooltip) entre Origination, Atendimento e Portal do Cliente | - | PASS | - |
| X | X | Dado que faço upload de um arquivo com extensão ".pdf"<br>Quando o nome do arquivo é exibido<br>Então a extensão deve ser exibida no nome original, inclusive no tooltip | OK - Extensão mantida como parte do nome original (comportamento aprovado) | PASS | - |


-----

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
|--------|----------|-----------|-----------|--------|-------------|
| X | X | Verifique se a interface exibe o campo `templateName` presente no metadata como um nome amigável ao mostrar o documento. | - | PASS | - |
| X | X | Verifique se documentos cujo caminho contenha "Lease Agreement" são exibidos com os nomes "Lease Agreement" ou "Signed Lease Agreement", conforme o caso. | - | PASS | - |
| X | X | Verifique se, ao fazer upload de um arquivo com nome grande, o nome é truncado com "..." e o nome completo é exibido no tooltip. | OK - Nome truncado corretamente e tooltip exibe o nome original completo | PASS | - |
| X | X | Verifique se os nomes dos documentos são exibidos de forma clara em diferentes tamanhos de tela. | - | PASS | - |
| X | X | Verifique se os nomes dos documentos são consistentes (com truncamento e tooltip) entre os portais de Origination, Atendimento e Portal do Cliente. | - | PASS | - |
| X | X | Verifique se, ao fazer upload de um arquivo com extensão ".pdf", essa extensão é mantida tanto no nome exibido quanto no tooltip. | OK - Extensão mantida como parte do nome original (comportamento aprovado) | PASS | - |

Tests in qa1

| LeadPk/AccouuntPk | Merchant | Test Case | Test Data | Status | Observation |
|--------|----------|-----------|-----------|--------|-------------|
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if the interface displays the `templateName` field from the metadata as a friendly name when the document is shown. | - | PASS | - |
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if documents whose path contains "Lease Agreement" are displayed with the name "Lease Agreement" or "Signed Lease Agreement", as appropriate. | - | PASS | - |
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if, when uploading a file with a long name, the name is truncated with "..." and the full name is displayed in the tooltip. | OK - Name correctly truncated and tooltip shows the full original name | PASS | - |
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if document names are displayed clearly across different screen sizes. | - | PASS | - |
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if document names are consistent (with truncation and tooltip) across Origination, Support, and Customer Portals. | - | PASS | - |
| 9405 and 9042/3534 and 3994 | Progress Mobility | Check if, when uploading a file with the ".pdf" extension, it is preserved in both the displayed name and the tooltip. | OK - Extension preserved as part of the original name (approved behavior) | PASS | - |


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in stg
> ```gherkin
> Check if the interface displays the `templateName` field from the metadata as a friendly name when the document is shown.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Check if documents whose path contains "Lease Agreement" are displayed with the name "Lease Agreement" or "Signed Lease Agreement", as appropriate.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Check if, when uploading a file with a long name, the name is truncated with "..." and the full name is displayed in the tooltip. 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Check if document names are displayed clearly across different screen sizes. 
> | PASS | -- | -- | 
> ```
>

> 
> ```gherkin
> Check if document names are consistent (with truncation and tooltip) across Origination, Support, and Customer Portals. 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>

> 
> ```gherkin
> Check if, when uploading a file with the ".pdf" extension, it is preserved in both the displayed name and the tooltip.
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>




> ## Tests in stg
> ```gherkin
>
> Check if the interface displays the templateName field from the metadata as a friendly name when the document is shown.
> | PASS | LeadPk 23668 / AccountPk 206336 | Merchant Progress Mobility | 
> ```
>
![468-stg-c1-OK-_1_](/uploads/d5fdfa0dae24517748a742bb58955592/468-stg-c1-OK-_1_.png){width=1437 height=745}![468-stg-c1-OK-_2_](/uploads/d729eac80b36a1d8626b31cb03e97ad7/468-stg-c1-OK-_2_.png){width=1433 height=735}![468-stg-c1-OK-_3_](/uploads/0b9fc5b9dc1b25b2cd1e110b3c03d7bb/468-stg-c1-OK-_3_.png){width=1431 height=747}
> 
> ```gherkin
> Check if documents whose path contains Lease Agreement are displayed with the name Lease Agreement or Signed Lease Agreement, as appropriate.
> | PASS | LeadPk 11087 | Merchant 2808 | 
> ```
>
![468-stg-c2-OK-_1_](/uploads/5b3e8d3f7771270877ba19566f68b3f5/468-stg-c2-OK-_1_.png){width=1437 height=735}
> 
> ```gherkin
> Check if, when uploading a file with a long name, the name is truncated with "..." and the full name is displayed in the tooltip. 
> | PASS | AccountPk 206336 | Merchant Progress Mobility | 
> ```
>
![468-stg-c3-_1_](/uploads/6b12b4392dda15f990056191d5943ccd/468-stg-c3-_1_.png){width=834 height=741}![468-stg-c3-_2_](/uploads/c6fa3be3eb3dc9e25307f820b509d5ba/468-stg-c3-_2_.png){width=1428 height=730}![468-stg-c3-_3_](/uploads/65f7f3b2ee877445561612f46da76f8a/468-stg-c3-_3_.png){width=1433 height=339}
> 
> ```gherkin
> Check if document names are displayed clearly across different screen sizes. 
> | PASS | -- | -- | 
> ```
> 
> ```gherkin
> Check if document names are consistent (with truncation and tooltip) across Origination, > > > Support, and Customer Portals. 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
![468-stg-c5-OK-_1__](/uploads/d60bebca9a30feb3f1a9086b6885dc2c/468-stg-c5-OK-_1__.png){width=1437 height=745}![468-stg-c5-OK-_2__](/uploads/41e7ef1ce35f2a7cfe6f228df397d797/468-stg-c5-OK-_2__.png){width=1433 height=735}![468-stg-c5-OK-_3__](/uploads/8473195432624f9e3deaf3093724eaba/468-stg-c5-OK-_3__.png){width=1431 height=747}
> 
> ```gherkin
> Check if, when uploading a file with the ".pdf" extension, it is preserved in both the displayed name and the tooltip.
> | PASS | -- | -- | 
> ```
>