------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/987

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Standardize Document and Record Naming for Improved Readability

Testing Steps:

Origination:
-Check if documents are being formatted by the logic:
-Name being the template name from the response of getFilesForLead as default, using the file name if there is no template name.
-Date time being removed.
-For the document Lease Agreement, it should display Signed Lease Agreement in the case of it being a pdf.
- Check if the records (look for leases form tire agent) are being formatted by the logic:
- Is named as Recording (number), with the first numbers being the oldest, and being organized in the order of most recent.


UOWN | Originação | Padronizar a Nomeação de Documentos e Registros para Melhor Legibilidade

Passos de Teste:

Originação:
-Verificar se os documentos estão sendo formatados pela lógica:
-Nome sendo o nome do modelo a partir da resposta de getFilesForLead como padrão, usando o nome do arquivo se não houver nome de modelo.
-Data e hora sendo removidas.
-Para o documento Lease Agreement, deve exibir Signed Lease Agreement se for um PDF.
-Verificar se os registros (buscar leases do Tire Agent) estão sendo formatados pela lógica:
-São nomeados como Recording (número), com os primeiros números sendo os mais antigos, e organizados na ordem do mais recente.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisito da Tarefa
UOWN | Originação | Padronizar a Nomeação de Documentos e Registros para Melhor Legibilidade

Passos de Teste:
Documentos:
Verificar se os documentos estão sendo formatados pela lógica:
- O nome deve ser o nome do template retornado por getFilesForLead como padrão; se não houver template, usar o nome do arquivo.
- Data e hora devem ser removidas.
- Para o documento Lease Agreement, se for um PDF, deve exibir "Signed Lease Agreement".
Registros:
- Verificar se os registros (buscando leases do Tire Agent) estão sendo formatados pela lógica:
- Devem ser nomeados como "Recording (número)", onde os números refletem a ordem dos registros (os mais antigos com números menores, organizados do mais recente).

-----

Cenários de Teste
1. Scenario: Validate Document Naming Format

Scenario: Validate that documents are formatted correctly according to the naming logic
  Given que o usuário acessa a tela de Origination com os documentos retornados por getFilesForLead
  When observar a formatação dos documentos exibidos
  Then o documento deve exibir o nome do template se existir, ou o nome do arquivo caso o template não esteja presente
  And a data e hora não devem ser exibidas no nome do documento
  And para o documento Lease Agreement em formato PDF, o nome deve ser exibido como "Signed Lease Agreement"

Explicação:
Este cenário testa a formatação dos nomes dos documentos conforme a lógica definida. Espera-se que:

Se houver um nome de template, ele seja usado; caso contrário, o nome do arquivo é utilizado.
As informações de data/hora são removidas do nome.
Para documentos do tipo Lease Agreement em PDF, o nome apresentado seja "Signed Lease Agreement".
Resultado Esperado:
- Os documentos na tela devem seguir a formatação especificada sem exibir data/hora e, no caso dos Lease Agreement em PDF, apresentar o nome "Signed Lease Agreement".

Frase de evidência:
Verifique se os documentos estão sendo formatados conforme a lógica, utilizando o nome do template (ou o nome do arquivo, se o template não estiver presente), sem data/hora, e exibindo "Signed Lease Agreement" para Lease Agreement em PDF.

-----

2. Scenario: Validate Record Naming Format

Scenario: Validate that records are formatted correctly as "Recording (número)"
  Given que o usuário acessa a tela de Origination com os registros de leases provenientes do Tire Agent
  When observar a formatação dos registros exibidos
  Then cada registro deve ser nomeado como "Recording (número)"
  And os números devem refletir a ordem dos registros, onde os registros mais antigos recebem números menores e a lista é organizada do mais recente

Explicação:
Este cenário valida a formatação dos registros. Espera-se que os registros sejam nomeados com a palavra "Recording" seguida de um número que indique a ordem cronológica, 
garantindo que os registros mais antigos tenham números menores e a ordem geral seja do mais recente para o mais antigo.

Resultado Esperado:
Os registros devem ser apresentados na tela como "Recording (número)", organizados corretamente conforme a ordem temporal dos registros.

Frase de evidência:
Verifique se os registros estão sendo formatados como "Recording (número)", com a numeração refletindo a ordem cronológica dos registros 
(os mais antigos com números menores e organizados do mais recente).

-----

3. Scenario: Validate Manual Document Insertion

Scenario: Validate that a document can be inserted manually
  Given que o usuário acessa a tela de Origination e seleciona a opção para inserir documentos manualmente
  When o usuário preenche os campos obrigatórios (como tipo de arquivo, arquivo, se é visible para o mutuario e a descrição) e clica no botão "upload"
  Then o documento deve ser inserido com sucesso na base de dados
  And o documento inserido deve ser exibido na lista de documentos com a formatação correta, conforme a lógica definida

Explicação:
Este cenário testa a funcionalidade de inserção manual de documentos. Ele garante que o usuário possa acessar a opção de inserção manual, preencher os campos obrigatórios e salvar o documento corretamente. Após a inserção, o documento deve ser exibido na lista de documentos com a formatação esperada (sem data/hora, com nome do template ou nome do arquivo, e "Signed Lease Agreement" para Lease Agreement em PDF).

Resultado Esperado:
O sistema deve inserir o documento com sucesso e exibi-lo na lista de documentos, aplicando a formatação correta. O documento deve ser salvo na base de dados e visualizado na interface do usuário de acordo com as regras definidas.

Frase de evidência:
Verifique se é possível inserir documentos manualmente e se o documento inserido é exibido corretamente na lista com a formatação definida.

------------------------------------------------------------------------------------------------------------------------------------------------------------------Tests in **

Confirme se os documentos seguem a lógica de formatação: nome do template (ou nome do arquivo, se não houver template), sem data/hora, e "Signed Lease Agreement" para Lease Agreement em PDF.
Verify that documents follow the formatting logic: template name (or file name if no template), no date/time, and "Signed Lease Agreement" for Lease Agreement in PDF.

Confirme se os registros são formatados como "Recording (número)", com numeração em ordem cronológica (menores para os mais antigos, exibidos do mais recente).
Verify that records are formatted as "Recording (number)," with numbering in chronological order (lower numbers for older records, displayed from most recent).

Confirme se é possível adicionar documentos manualmente e se o documento inserido aparece na lista com a formatação correta.
Verify that manual document insertion is possible and the inserted document appears in the list with the correct formatting.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12225 | Tire Agent | Verify that documents follow the formatting logic: template name (or file name if no template), no date/time, and "Signed Lease Agreement" for Lease Agreement in PDF. |  | PASS |
| 12225 | Tire Agent | Verify that records are formatted as "Recording (number)," with numbering in chronological order (lower numbers for older records, displayed from most recent). |  | PASS |
| 12225 | Tire Agent | Verify that manual document insertion is possible and the inserted document appears in the list with the correct formatting. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 20202 | Tire Agent | Verify that documents follow the formatting logic: template name (or file name if no template), no date/time, and "Signed Lease Agreement" for Lease Agreement in PDF. |  | PASS |
| 20202 | Tire Agent | Verify that records are formatted as "Recording (number)," with numbering in chronological order (lower numbers for older records, displayed from most recent). |  | PASS |
| 20202 | Tire Agent | Verify that manual document insertion is possible and the inserted document appears in the list with the correct formatting. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------