------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1138

UOWN | Origination | CSV and Email Export Buttons Download Only Partial Results


BUG
In the Origination Portal, on pages such as Leads and others containing filter tables, the Download CSV and Send by Email buttons are not functioning as expected.
The correct behavior should be to download or send all results from the current search query.
However, the current implementation is only downloading a partial set of results (typically limited to the first page of data).
This behavior causes incomplete exports and inaccurate data sharing.

FIX
Update the CSV and Email export logic to include all filtered search results, not just the current page.
Ensure the backend handles large datasets efficiently to prevent performance degradation.
Apply the same correction across all pages in Origination that include the CSV and Email export feature.
Test exports with both small and large datasets to confirm full and accurate data inclusion.
Validate that the Email export feature also sends complete data aligned with the CSV download behavior.

Access the Leads page (or any other page with the CSV and Email export feature).
Perform a search or apply filters that return multiple pages of results.
Click on the Download CSV or Send by Email button.
Observe that the generated file/email includes only partial data (e.g., first page).
Expected Result:
The CSV download and Email export features should include all search results from the query, regardless of pagination.
Actual Result:
Only a subset of the results (partial data, usually the first page) is included in the CSV or email export.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Botões de Exportação CSV e E-mail Fazem Download Apenas de Resultados Parciais

BUG
No Portal de Originação, em páginas como Leads e outras que contêm tabelas com filtros, os botões Download CSV e Enviar por E-mail não estão funcionando conforme o esperado.
O comportamento correto deveria ser baixar ou enviar todos os resultados da consulta atual.
No entanto, a implementação atual está baixando apenas um conjunto parcial de resultados (geralmente limitado à primeira página de dados).
Esse comportamento causa exportações incompletas e compartilhamento incorreto de dados.

CORREÇÃO
Atualizar a lógica de exportação de CSV e E-mail para incluir todos os resultados filtrados da pesquisa, e não apenas a página atual.
Garantir que o backend lide com grandes volumes de dados de forma eficiente, para evitar degradação de desempenho.
Aplicar a mesma correção em todas as páginas do módulo de Originação que possuam a funcionalidade de exportação CSV e E-mail.
Testar exportações com conjuntos de dados pequenos e grandes para confirmar a inclusão completa e precisa das informações.
Validar que o recurso de exportação por E-mail também envie os dados completos, alinhados com o comportamento do download CSV.

Passos para Reproduzir:
Acesse a página de Leads (ou qualquer outra com a funcionalidade de exportação CSV e E-mail).
Realize uma busca ou aplique filtros que retornem múltiplas páginas de resultados.
Clique no botão Download CSV ou Enviar por E-mail.
Observe que o arquivo/e-mail gerado contém apenas dados parciais (ex.: apenas a primeira página).

Resultado Esperado:
Os recursos de download CSV e exportação por E-mail devem incluir todos os resultados da consulta, independentemente da paginação.

Resultado Atual:
Apenas um subconjunto dos resultados (dados parciais, geralmente a primeira página) é incluído no CSV ou na exportação por e-mail.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Usuário baixa todos os leads desde o comeco do ano 2000 até 10/21/2025 com a paginacao exibindo 15 resultados por página
Usuário baixa 2006 leads filtrados entre 10/15/2023 até 10/21/2025 com a paginacao exibindo 50 resultados por página
Usuário envia para seu email todos os leads retornados da busca no periodo de 10/15/2023 e 10/21/2025
usuário baixa todos os leads retornados na busca no periodo de 01/01/2025 e 10/21/2025
usuário envia para seu email todos os leads retornados na busca no periodo de 01/01/2025 e 10/21/2025
Usuário está em funding queue visualizando 10 registros por página e baixa todos os registros filtrados entre 01/01/2000 e 10/21/2025
Usuário envia via email 841 registros filtrados em funding queue, visualizando 10 registros por página
Usuário esta visualizando os primeiros 40 resultados de 161 filtrados em funding queue e realiza o download
Usuário envia para seu email 161 registros provenientes da busca realizada em funding queue
Usuário baixa 218 resultados provenientes de uma busca realizada entre 01/01/2020 e 10/21/2025 em funding modification history
Usuário envia email contendo 216 resultados provenientes de uma busca realizada no periodo de 01/01/2025 e 10/21/2025 em funding modification history
    **Email nao chegou**
Usuário envia email contendo 218 resultados provenientes de uma busca realizada no periodo de 01/01/2025 e 10/21/2025 em funding modification history
    **Email nao chegou**    
Usuário envia um segundo email contendo 2 resultados provenientes de uma busca realizada no periodo de 10/01/2025 e 10/21/2025 em funding modification history
    **Email nao chegou**
Usuário envia todos os resultados entregues na busca de modification reports do final de outubro de 2000 até 10/21/2025
Usuário envia 523 resultados entregues na busca de modification reports do inicio de 2025 até 10/21/2025
Usuário baixa 58000 registros provenientes de uma busca realizada entre 10/01/2025 e 10/21/2025 em merchant modification history
    **entrega resultados divergentes dos filtrados quando e filtrado mais de 1000 resultados**
Usuário visualiza os primeiros 100 resultados de 1812 retornados da busca realizada em merchant modification history no periodo de 10/20/2025 e 21/10/2025
    **entrega resultados divergentes dos filtrados quando e filtrado mais de 1000 resultados**
Usuário todos os resultados retornados da busca realizada em merchant modification history no periodo de 10/20/2025 e 21/10/2025 selecionando o merchant Progress Mobility
Usuário filtra resultados para o merchant Saslow`s Jewelers entre 10/01/2025 e 10/21/2025 e realiza download` em merchant modification history
    **entrega resultados divergentes dos filtrados quando e filtrado mais de 1000 resultados**
Usuário filtra resultados entre 10/20/2025 e 10/21/2025 e realiza download em merchant modification history
    **entrega resultados divergentes dos filtrados quando e filtrado mais de 1000 resultados**    
Usuário faz o download de 1316 alertas geradas entre 21/10/2000/ e 10/21/2025
Usuário envia via email 1316 alertas geradas entre 21/10/2000/ e 10/21/2025
Usuário envia via email 185 alertas geradas entre 10/01/2000/ e 10/21/2025
Usuário faz o download de 372 logs de erro gerados entre 21/10/2000/ e 10/21/2025
Usuário envia via email de 372 logs de erro gerados entre 21/10/2000/ e 10/21/2025
Usuário Realiza busca de merchants ativos selecionando colunas que serao visualizadas e faz download
Usuário Realiza busca de merchants ativos selecionando colunas que serao visualizadas e envia resultados via email
    **Nao respeita as colunas selecionadas para visualizacao no documento enviado no email**
Usuário baixa 3 resultados de rebate
Usuário envio para seu email 3 resultados de rebate
Usuário baixa 2168 registros de blacklist
Usuário envia para seu email 2168 registros de blacklist
    **Email nao chegou**
Usuário envia para seu email 52 registros de blacklist
    **Email nao chegou**    
Usuário baixa 2168 registros de blacklist
Usuário envia para seu email 2168 registros de blacklist
    **Email nao chegou**    
Usuário baixa 52 registros de blacklist    
Usuário envia para seu email 191 registros de blacklist
    **Email nao chegou**  
Usuário recebe em seu email registros de open to buy filtrados entre 01/01/2000 e 10/21/2025    

-----

**User downloads all leads from the beginning of the year 2000 until 10/21/2025 with pagination displaying 15 results per page.**
**User downloads 2006 leads filtered between 10/15/2023 and 10/21/2025 with pagination displaying 50 results per page.**
**User sends to their email all leads returned from the search within the period 10/15/2023 to 10/21/2025.**
**User downloads all leads returned from the search within the period 01/01/2025 to 10/21/2025.**
**User sends to their email all leads returned from the search within the period 01/01/2025 to 10/21/2025.**
**User is in the funding queue viewing 10 records per page and downloads all records filtered between 01/01/2000 and 10/21/2025.**
**User sends via email 841 records filtered in the funding queue, viewing 10 records per page.**
**User is viewing the first 40 results out of 161 filtered in the funding queue and downloads them.**
**User sends to their email 161 records from the search performed in the funding queue.**
**User downloads 218 results from a search performed between 01/01/2020 and 10/21/2025 in funding modification history.**
**User sends all results returned from the search in modification reports from the end of October 2000 to 10/21/2025.**
**User sends 523 results returned from the search in modification reports from the beginning of 2025 to 10/21/2025.**
**User downloads 1316 alerts generated between 10/21/2000 and 10/21/2025.**
**User sends via email 1316 alerts generated between 10/21/2000 and 10/21/2025.**
**User sends via email 185 alerts generated between 10/01/2000 and 10/21/2025.**
**User downloads 372 error logs generated between 10/21/2000 and 10/21/2025.**
**User sends via email 372 error logs generated between 10/21/2000 and 10/21/2025.**
**User performs a search for active merchants, selecting the columns to be displayed, and downloads the results.**
**User downloads 3 rebate results.**
**User sends to their email 3 rebate results.**
**User downloads 52 blacklist records.**
**User receives in their email open-to-buy records filtered between 01/01/2000 and 10/21/2025.**

**User sends to their email 191 blacklist records.**
--> Email did not arrive <--
* User sends to their email 2168 blacklist records.
--> Email did not arrive <--
* User sends to their email 52 blacklist records.
--> Email did not arrive <--

* User sends an email containing 216 results from a search performed between 01/01/2025 and 10/21/2025 in funding modification history.
-->Email did not arrive <--
* User sends an email containing 218 results from a search performed between 01/01/2025 and 10/21/2025 in funding modification history.
--> Email did not arrive <--
* User sends a second email containing 2 results from a search performed between 10/01/2025 and 10/21/2025 in funding modification history.
--> Email did not arrive <--

* User downloads 58,000 records from a search performed between 10/01/2025 and 10/21/2025 in merchant modification history.
--> Delivers results that differ from the filters when more than 1000 results are filtered <--
* User views the first 100 results out of 1812 returned from the search performed in merchant modification history during the period 10/20/2025 to 10/21/2025.
--> Delivers results that differ from the filters when more than 1000 results are filtered <--
* User filters results for the merchant Saslow's Jewelers between 10/01/2025 and 10/21/2025 and downloads them in merchant modification history.
--> Delivers results that differ from the filters when more than 1000 results are filtered <--
* User filters results between 10/20/2025 and 10/21/2025 and downloads them in merchant modification history.
--> Delivers results that differ from the filters when more than 1000 results are filtered <--

* User performs a search for active merchants, selecting the columns to be displayed, and sends the results via email.
--> Does not respect the selected columns for display in the document sent by email <--






> ## Tests in qa2

**User downloads all leads from the of the october year 2000 until 10/21/2025 with pagination displaying 15 results per page.**

![Screenshot_at_Oct_21_13-11-06](/uploads/3a01e600784a3846192010c105a7435d/Screenshot_at_Oct_21_13-11-06.png)

![Screenshot_at_Oct_21_13-17-49](/uploads/b1e419cb8451bc0a65fefe16a5fd4816/Screenshot_at_Oct_21_13-17-49.png)

![Screenshot_at_Oct_21_13-18-10](/uploads/216c2a1505a01ff3ac12b5a83e27bdc2/Screenshot_at_Oct_21_13-18-10.png)

![Screenshot_at_Oct_21_13-18-33](/uploads/74e27a589b99c713df40ec72f6b388cb/Screenshot_at_Oct_21_13-18-33.png)

![Screenshot_at_Oct_21_13-19-04](/uploads/4cdaeb16e56d134fe69d307a5c82f98e/Screenshot_at_Oct_21_13-19-04.png){width=738 height=22}

![Screenshot_at_Oct_21_13-19-27](/uploads/49187de8ebe3c4a572da3104b687106e/Screenshot_at_Oct_21_13-19-27.png){width=594 height=22}

> **| PASS |**

---

**User downloads 2006 leads filtered between 10/15/2023 and 10/21/2025 with pagination displaying 50 results per page.**

![Screenshot_at_Oct_21_13-20-23](/uploads/d99dfbd97922e9e2104b456b934e4ea2/Screenshot_at_Oct_21_13-20-23.png)

![Screenshot_at_Oct_21_13-20-47](/uploads/66e1cfe5b9cc99fe29f8f7dc5096b2f6/Screenshot_at_Oct_21_13-20-47.png)

![Screenshot_at_Oct_21_13-21-03](/uploads/85aa26cee6cc9ada173e977f4d078299/Screenshot_at_Oct_21_13-21-03.png){width=736 height=24}

![Screenshot_at_Oct_21_13-21-22](/uploads/074eb23d67dc0c628f9a56cea265f553/Screenshot_at_Oct_21_13-21-22.png){width=752 height=29}

> **| PASS |**

---

**User sends to their email all leads returned from the search within the period 10/15/2023 to 10/21/2025.**

![Screenshot_at_Oct_21_14-25-56](/uploads/4fd01ac1c8470beb77c1b38e8d7ab285/Screenshot_at_Oct_21_14-25-56.png)

![Screenshot_at_Oct_21_14-29-23](/uploads/c9ea9ce3acbe99bcd6c74dc965df0186/Screenshot_at_Oct_21_14-29-23.png)

![Screenshot_at_Oct_21_14-51-29](/uploads/75b942ac36d58c3a9641440ddf56dcce/Screenshot_at_Oct_21_14-51-29.png){width=782 height=21}

![Screenshot_at_Oct_21_14-51-37](/uploads/585bc974d7e6d39f9d39c8a629793f8d/Screenshot_at_Oct_21_14-51-37.png){width=781 height=23}

> **| PASS |**

---

**User downloads all leads returned from the search within the period 01/01/2025 to 10/21/2025.**

![Screenshot_at_Oct_21_14-52-24](/uploads/843c3de1862d4b9b91a7ad6d60e75895/Screenshot_at_Oct_21_14-52-24.png)

![Screenshot_at_Oct_21_14-52-57](/uploads/28241e10d68ca7ff9d1e735eb4f369a4/Screenshot_at_Oct_21_14-52-57.png)

![Screenshot_at_Oct_21_14-53-16](/uploads/58e95e93335b346d77f32d7a71827fe1/Screenshot_at_Oct_21_14-53-16.png)

![Screenshot_at_Oct_21_14-53-36](/uploads/e3fb28b4836264242a13fb09b3fb66d6/Screenshot_at_Oct_21_14-53-36.png){width=755 height=24}

> **| PASS |**

---

**User sends to their email all leads returned from the search within the period 01/01/2025 to 10/21/2025.**

![Screenshot_at_Oct_21_14-54-38](/uploads/5ccd40a18e699e5236244c8066a97054/Screenshot_at_Oct_21_14-54-38.png)

![Screenshot_at_Oct_21_14-55-35](/uploads/feb34447522f017e16def7bfa3be9843/Screenshot_at_Oct_21_14-55-35.png)

![Screenshot_at_Oct_21_14-56-11](/uploads/a845f1fed16a4a130979a7641997982d/Screenshot_at_Oct_21_14-56-11.png)

![Screenshot_at_Oct_21_15-01-26](/uploads/154f85e2fe36be0d4c76547227745e6a/Screenshot_at_Oct_21_15-01-26.png){width=780 height=23}

> **| PASS |**

---

**User is in the funding queue viewing 10 records per page and downloads all records filtered between 01/01/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_15-36-59](/uploads/7502ec6d6530563e90fb28a52c35a388/Screenshot_at_Oct_21_15-36-59.png)

![Screenshot_at_Oct_21_15-37-32](/uploads/a474bc8c995e5dcc61227e2a41e7d2dc/Screenshot_at_Oct_21_15-37-32.png)

![Screenshot_at_Oct_21_15-37-46](/uploads/48f519294c602e4565a8fdfaa507b51b/Screenshot_at_Oct_21_15-37-46.png)

![Screenshot_at_Oct_21_15-39-21](/uploads/cc865d438091727208e811f9793f5fe2/Screenshot_at_Oct_21_15-39-21.png){width=754 height=27}

> **| PASS |**

---

**User sends via email 841 records filtered in the funding queue, viewing 10 records per page.**

![Screenshot_at_Oct_21_15-40-34](/uploads/33eeef945a17e30bf98c0d0318aff3ed/Screenshot_at_Oct_21_15-40-34.png)

![Screenshot_at_Oct_21_15-43-39](/uploads/8f6384a10f95ac27c837a74543f17c6c/Screenshot_at_Oct_21_15-43-39.png)

![Screenshot_at_Oct_21_15-45-41](/uploads/fc13d733b07895129b446d38c4faa371/Screenshot_at_Oct_21_15-45-41.png){width=829 height=28}

> **| PASS |**

---

**User is viewing the first 40 results out of 161 filtered in the funding queue and downloads them.**

![Screenshot_at_Oct_21_15-51-26](/uploads/4977b0bb729b2367a1c33cb7c48d3fcc/Screenshot_at_Oct_21_15-51-26.png)

![Screenshot_at_Oct_21_15-53-28](/uploads/626888c2ae0d7509fcae26bd85b9ea2d/Screenshot_at_Oct_21_15-53-28.png)

![Screenshot_at_Oct_21_15-53-46](/uploads/7acd6ed794041b60b8299f6d67e7dd46/Screenshot_at_Oct_21_15-53-46.png)!

![Screenshot_at_Oct_21_15-54-02](/uploads/a192ea46dce7c615768b82000ab45268/Screenshot_at_Oct_21_15-54-02.png){width=746 height=23}

> **| PASS |**

---

**User sends to their email 161 records from the search performed in the funding queue.**

![Screenshot_at_Oct_21_15-54-27](/uploads/861246d3918110c82874388c260c0edb/Screenshot_at_Oct_21_15-54-27.png)

![Screenshot_at_Oct_21_15-56-40](/uploads/aecb27f0850f971064913e63f5f3f407/Screenshot_at_Oct_21_15-56-40.png)

![Screenshot_at_Oct_21_15-57-13](/uploads/af8e42c25b0cb384df96f8a272e95596/Screenshot_at_Oct_21_15-57-13.png){width=828 height=29}

> **| PASS |**

---

![Screenshot_at_Oct_21_15-54-27](/uploads/8ddbdf6aa7bd4e35b432afdfe101b27a/Screenshot_at_Oct_21_15-54-27.png)

![Screenshot_at_Oct_21_15-56-40](/uploads/71d16782406c1bdf744233c15ac39d3b/Screenshot_at_Oct_21_15-56-40.png)

![Screenshot_at_Oct_21_15-57-13](/uploads/be26f4cb53854218e47be9baccc45eed/Screenshot_at_Oct_21_15-57-13.png){width=828 height=29}

> **| PASS |**

---

**User downloads 218 results from a search performed between 01/01/2000 and 10/21/2025 in funding modification history.**

![Screenshot_at_Oct_21_16-00-38](/uploads/9cc4edcd86d1cd179e561fe313cc3245/Screenshot_at_Oct_21_16-00-38.png)

![Screenshot_at_Oct_21_16-00-55](/uploads/a31e0a396cec55637d064025412b5abe/Screenshot_at_Oct_21_16-00-55.png)

![Screenshot_at_Oct_21_16-01-19](/uploads/03d1302debedf4680280e177cccebd99/Screenshot_at_Oct_21_16-01-19.png){width=252 height=24}

---

**User sends all results returned from the search in modification reports from the end of October 2000 to 10/21/2025.**

![Screenshot_at_Oct_21_16-19-34](/uploads/565a1ea5ea8bc3c3df44a7dba7ed945b/Screenshot_at_Oct_21_16-19-34.png)

![Screenshot_at_Oct_21_16-19-51](/uploads/dcdf381ee853e3611de81de7215b3eb5/Screenshot_at_Oct_21_16-19-51.png)

![Screenshot_at_Oct_21_16-20-35](/uploads/bbcf7f395c3006588907d156b7ac9a16/Screenshot_at_Oct_21_16-20-35.png)

![Screenshot_at_Oct_21_16-22-12](/uploads/5d993e671f84e0e2220a15541d82242b/Screenshot_at_Oct_21_16-22-12.png){width=623 height=28}

> **| PASS |**

---

**User sends 523 results returned from the search in modification reports from the beginning of 2025 to 10/21/2025.**

![Screenshot_at_Oct_21_16-28-17](/uploads/e38a6855fd46192f8e191d25b3856bf6/Screenshot_at_Oct_21_16-28-17.png)

![Screenshot_at_Oct_21_16-29-26](/uploads/c7c180873be7d63731beff0b6092163c/Screenshot_at_Oct_21_16-29-26.png)

![Screenshot_at_Oct_21_16-31-15](/uploads/7e56d86c5466e670dc0e0bb5295efa87/Screenshot_at_Oct_21_16-31-15.png){width=624 height=25}

> **| PASS |**

---

**User downloads 1316 alerts generated between 10/21/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_17-22-22](/uploads/ddb888df0e1a2223d703b312ef4ded75/Screenshot_at_Oct_21_17-22-22.png)

![Screenshot_at_Oct_21_17-24-10](/uploads/614d892888c3085a96c5f60763746da1/Screenshot_at_Oct_21_17-24-10.png)

![Screenshot_at_Oct_21_17-24-27](/uploads/fbb8c21a46a21acb095cffe2f77e0b83/Screenshot_at_Oct_21_17-24-27.png)

![Screenshot_at_Oct_21_17-25-11](/uploads/8c6ddd30e5856c44d769d9bc471dc920/Screenshot_at_Oct_21_17-25-11.png){width=455 height=24}

> **| PASS |**

---

**User sends via email 1316 alerts generated between 10/21/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_17-26-00](/uploads/11fb7c2a7d08f42f0f921399e1d91af4/Screenshot_at_Oct_21_17-26-00.png)

![Screenshot_at_Oct_21_17-26-20](/uploads/c1a133f08dfbd49145737c11c0185bbf/Screenshot_at_Oct_21_17-26-20.png)

![Screenshot_at_Oct_21_17-26-41](/uploads/8915a094066b61a2eca431abbeac0b9b/Screenshot_at_Oct_21_17-26-41.png)

![Screenshot_at_Oct_21_17-30-47](/uploads/b4ace9b1f7f88e952924a07b59c367d0/Screenshot_at_Oct_21_17-30-47.png){width=378 height=27}

> **| PASS |**

---

**User sends via email 185 alerts generated between 10/01/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_17-33-46](/uploads/8e65d47fc08ca02079244c51fd3e05a5/Screenshot_at_Oct_21_17-33-46.png)

![Screenshot_at_Oct_21_17-34-56](/uploads/8507e9806e2f5699a7f52263d13d4cd8/Screenshot_at_Oct_21_17-34-56.png)

![Screenshot_at_Oct_21_17-35-17](/uploads/0610e7bf822c09452f021019e5411bb0/Screenshot_at_Oct_21_17-35-17.png)

![Screenshot_at_Oct_21_17-36-42](/uploads/831d185b2cdd1992b342f5cb53376623/Screenshot_at_Oct_21_17-36-42.png){width=392 height=23}

> **| PASS |**

---

**User downloads 372 error logs generated between 10/21/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_17-38-30](/uploads/463fee086b87cb8822c7bd7cad136b76/Screenshot_at_Oct_21_17-38-30.png)

![Screenshot_at_Oct_21_17-39-06](/uploads/1fc54a0a4109408edc3ad73c9efcd709/Screenshot_at_Oct_21_17-39-06.png)

![Screenshot_at_Oct_21_17-39-26](/uploads/3b132e6683bc613658cbc45de5ac6998/Screenshot_at_Oct_21_17-39-26.png)

![Screenshot_at_Oct_21_17-39-51](/uploads/ee458f61ed357f4ed10c208bec815452/Screenshot_at_Oct_21_17-39-51.png)

![Screenshot_at_Oct_21_17-40-22](/uploads/9fe3fb39d9ab54e021e0c56734cac844/Screenshot_at_Oct_21_17-40-22.png){width=394 height=23}

> **| PASS |**

---

**User sends via email 372 error logs generated between 10/21/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_17-40-58](/uploads/d9db39860ff4c477017625561ead6ef0/Screenshot_at_Oct_21_17-40-58.png)

![Screenshot_at_Oct_21_17-41-14](/uploads/caa80f311aff4e8717a6fc61f894dbb6/Screenshot_at_Oct_21_17-41-14.png)

![Screenshot_at_Oct_21_17-41-28](/uploads/ba013186a72ce27abea8343ad046b2ed/Screenshot_at_Oct_21_17-41-28.png)

![Screenshot_at_Oct_21_17-46-09](/uploads/ec3a04911b5d30bd0978ef4ccfa2d286/Screenshot_at_Oct_21_17-46-09.png){width=616 height=34}

> **| PASS |**

---

**User performs a search for active merchants, selecting the columns to be displayed, and downloads the results.**

![Screenshot_at_Oct_21_17-48-43](/uploads/ede779c4ea1013bcf3d71a29fc89fbb2/Screenshot_at_Oct_21_17-48-43.png)

![Screenshot_at_Oct_21_17-49-39](/uploads/424e595e0fb6b6702f23a5a3e4d9b431/Screenshot_at_Oct_21_17-49-39.png)

![Screenshot_at_Oct_21_17-50-38](/uploads/9baeafa0bf1949d7069ab0b437d87de9/Screenshot_at_Oct_21_17-50-38.png){width=262 height=26}

> **| PASS |**

---

**User downloads 3 rebate results.**

![Screenshot_at_Oct_21_20-02-18](/uploads/fe80d7ebd56b89933d3eb1402d87d9ad/Screenshot_at_Oct_21_20-02-18.png)

![Screenshot_at_Oct_21_20-02-40](/uploads/ac8834efd4b1e7b1fd981a65d48ed42d/Screenshot_at_Oct_21_20-02-40.png){width=245 height=52}

> **| PASS |**

---

**User sends to their email 3 rebate results.**

![Screenshot_at_Oct_21_20-03-08](/uploads/b88a135cc81156db6d30822d902a2a7a/Screenshot_at_Oct_21_20-03-08.png)

![Screenshot_at_Oct_21_20-03-32](/uploads/603a8079bc14c9a8a5377989ef27458f/Screenshot_at_Oct_21_20-03-32.png)

![Screenshot_at_Oct_21_20-03-52](/uploads/922aefc32ca57c3caee0f3223531376e/Screenshot_at_Oct_21_20-03-52.png)

![Screenshot_at_Oct_21_20-39-12](/uploads/76baa16002a03778d68795e0a35af61a/Screenshot_at_Oct_21_20-39-12.png){width=340 height=92}

> **| PASS |**

---

**User downloads 2168 blacklist records.**

![Screenshot_at_Oct_21_20-46-59](/uploads/06790da77061de55881836cbbb10421d/Screenshot_at_Oct_21_20-46-59.png)

![Screenshot_at_Oct_21_20-47-38](/uploads/d115d9bf6dd57e3d111ef5f004ff4c2c/Screenshot_at_Oct_21_20-47-38.png)

![Screenshot_at_Oct_21_20-48-18](/uploads/a9c2fc2f6fe141a1d94e7b8c78eb3202/Screenshot_at_Oct_21_20-48-18.png){width=199 height=25}

> **| PASS |**

---

**User downloads 52 blacklist records.**

![Screenshot_at_Oct_21_20-55-27](/uploads/0b216b19687617e55b97c3eb0bc5eebb/Screenshot_at_Oct_21_20-55-27.png)

![Screenshot_at_Oct_21_20-56-06](/uploads/8bd9057fc0c472fda0e58339559e68c1/Screenshot_at_Oct_21_20-56-06.png)

![Screenshot_at_Oct_21_20-56-38](/uploads/6ae55fdad1dd7e3f5cd980f096031a60/Screenshot_at_Oct_21_20-56-38.png){width=232 height=26}

> **| PASS |**

---

**User receives in their email open-to-buy records filtered between 01/01/2000 and 10/21/2025.**

![Screenshot_at_Oct_21_21-02-26](/uploads/3f9a755465fb0f0fc35f012e0c17b5a8/Screenshot_at_Oct_21_21-02-26.png)

![Screenshot_at_Oct_21_21-03-36](/uploads/9166a46b30ff8aaccdc0638b71c172ce/Screenshot_at_Oct_21_21-03-36.png)

![Screenshot_at_Oct_21_21-17-06](/uploads/9b91e3f105fa0e8fd2224915a03b50f0/Screenshot_at_Oct_21_21-17-06.png)

> **| PASS |**

---

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg



> ## Tests in stg

**User downloads all leads from the of the october year 2000 until 10/21/2025 with pagination displaying 15 results per page.**

> 

> **| PASS |**

---

**User downloads 2006 leads filtered between 10/15/2023 and 10/21/2025 with pagination displaying 50 results per page.**

> 


> **| PASS |**

---

**User sends to their email all leads returned from the search within the period 10/15/2023 to 10/21/2025.**

> 


> **| PASS |**

---

**User downloads all leads returned from the search within the period 01/01/2025 to 10/21/2025.**

![Screenshot_at_Oct_21_14-52-24](/uploads/843c3de1862d4b9b91a7ad6d60e75895/Screenshot_at_Oct_21_14-52-24.png)

![Screenshot_at_Oct_21_14-52-57](/uploads/28241e10d68ca7ff9d1e735eb4f369a4/Screenshot_at_Oct_21_14-52-57.png)

![Screenshot_at_Oct_21_14-53-16](/uploads/58e95e93335b346d77f32d7a71827fe1/Screenshot_at_Oct_21_14-53-16.png)

![Screenshot_at_Oct_21_14-53-36](/uploads/e3fb28b4836264242a13fb09b3fb66d6/Screenshot_at_Oct_21_14-53-36.png){width=755 height=24}

> **| PASS |**

---

**User sends to their email all leads returned from the search within the period 01/01/2025 to 10/21/2025.**

> 


> **| PASS |**

---

**User is in the funding queue viewing 10 records per page and downloads all records filtered between 01/01/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User sends via email 841 records filtered in the funding queue, viewing 10 records per page.**

> 


> **| PASS |**

---

**User is viewing the first 40 results out of 161 filtered in the funding queue and downloads them.**

> 


> **| PASS |**

---

**User sends to their email 161 records from the search performed in the funding queue.**

> 


> **| PASS |**

---

> 


> **| PASS |**

---

**User downloads 218 results from a search performed between 01/01/2000 and 10/21/2025 in funding modification history.**

> 


> **| PASS |**

---

**User sends all results returned from the search in modification reports from the end of October 2000 to 10/21/2025.**

> 


> **| PASS |**

---

**User sends 523 results returned from the search in modification reports from the beginning of 2025 to 10/21/2025.**

> 


> **| PASS |**

---

**User downloads 1316 alerts generated between 10/21/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User sends via email 1316 alerts generated between 10/21/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User sends via email 185 alerts generated between 10/01/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User downloads 372 error logs generated between 10/21/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User sends via email 372 error logs generated between 10/21/2000 and 10/21/2025.**

> 


> **| PASS |**

---

**User performs a search for active merchants, selecting the columns to be displayed, and downloads the results.**

> 


> **| PASS |**

---

**User downloads 3 rebate results.**

> 


> **| PASS |**

---

**User sends to their email 3 rebate results.**

> 


> **| PASS |**

---

**User downloads 2168 blacklist records.**

> 


> **| PASS |**

---

**User downloads 52 blacklist records.**

> 


> **| PASS |**

---

**User receives in their email open-to-buy records filtered between 01/01/2000 and 10/21/2025.**

> 


> **| PASS |**

---

