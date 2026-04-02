--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/991

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Melhorias na funcionalidade da guia de alertas

  Contexto:
    Dado que estou logado no sistema UOWN Origination
    E estou na guia "Alerts"

  Esquema do Cenario: Buscar alertas por leadPk
    Quando busco por um leadPk no campo de busca
    Então os resultados devem exibir apenas o LeadPk 

    Exemplos:
      | dataInicio  | dataFim    |
      | 2024-02-01  | 2024-02-10 |
      | 2024-03-05  | 2024-03-15 |
--> Acredito ser uma facilidade que melhora a usabilidade para o usuario, porém como o dev disse que pode demorar um pouco para 
ajustar e não é um requisito, não foi feito. <--    

  Esquema do Cenario: Buscar alertas por mensagem
    Quando realizo uma busca pela mensagem "<mensagem>"
    Então os resultados devem conter alertas relacionados à mensagem "<mensagem>"

    Exemplos:
      | mensagem              |
      | Erro no processamento |
      | Lead aprovado         |
--> OK <--      

  Cenario: Validar funcionalidade de paginação
    Quando navego pelas páginas de alertas
    Então a paginação deve permitir avançar e retroceder entre as páginas
    E devo conseguir alterar o número de itens exibidos por página
--> OK <--       

  Cenario: Exportar alertas via download CSV com filtros aplicados
    Dado que apliquei filtros nos alertas
    Quando exporto os alertas via download CSV
    Então o arquivo deve conter apenas os alertas filtrados
--> OK <--   

  Cenario: Exportar alertas via email CSV com filtros aplicados
    Dado que apliquei filtros nos alertas
    Quando exporto os alertas via email CSV
    Então o arquivo enviado por email deve conter apenas os alertas filtrados
--> OK <--

  Esquema do Cenario: Validar exportação de alertas filtrados por data
    Dado que apliquei um filtro de data de "<dataInicio>" até "<dataFim>"
    Quando exporto os alertas via "<metodoExportacao>"
    Então o arquivo exportado deve conter apenas alertas dentro desse período
--> OK <--
    Exemplos:
      | dataInicio  | dataFim    | metodoExportacao |
      | 2024-02-01  | 2024-02-10 | download CSV     |
      | 2024-03-05  | 2024-03-15 | email CSV        |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

* Inserir labels nos campos

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
Verify that the search for the message returns only results with alerts related to that message |  | PASS |
Verify that the pagination of the alerts pages allows navigation between pages and adjustment of the number of items displayed per page |  | PASS |
Verify that when exporting the message-filtered alerts to CSV, the file contains only the filtered alerts |  | PASS |
Verify that when exporting the message-filtered alerts via email in CSV, the file sent contains only the filtered alerts |  | PASS |
Verify that when exporting the date-filtered alerts, the file sent via email and CSV contains only alerts within the specified period |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
1.
Verificar se a busca pela mensagem retorna apenas resultados com alertas relacionados a essa mensagem
Verify that the search for the message returns only results with alerts related to that message

2.
Verificar se a paginação das páginas de alertas permite navegar entre páginas e ajustar o número de itens exibidos por página
Verify that the pagination of the alerts pages allows navigation between pages and adjustment of the number of items displayed per page

3.
Verificar se, ao exportar os alertas filtrados por mensagem para CSV, o arquivo contém exclusivamente os alertas filtrados
Verify that when exporting the message-filtered alerts to CSV, the file contains only the filtered alerts

4.
Verificar se, ao exportar os alertas filtrados por mensagem por e-mail em CSV, o arquivo enviado contém apenas os alertas filtrados
Verify that when exporting the message-filtered alerts via email in CSV, the file sent contains only the filtered alerts

5.
Verificar se, ao exportar os alertas filtrados por data, o arquivo enviado por e-mail e CSV contém apenas alertas dentro do período especificado
Verify that when exporting the date-filtered alerts, the file sent via email and CSV contains only alerts within the specified period

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
Verify that the search for the message returns only results with alerts related to that message |  | PASS |
Verify that the pagination of the alerts pages allows navigation between pages and adjustment of the number of items displayed per page |  | PASS |
Verify that when exporting the message-filtered alerts to CSV, the file contains only the filtered alerts |  | PASS |
Verify that when exporting the message-filtered alerts via email and CSV, the file sent contains only the filtered alerts |  | PASS |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

OK in stg

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------