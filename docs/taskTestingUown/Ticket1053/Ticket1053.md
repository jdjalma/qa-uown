        ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        https://gitlab.com/uown/frontend/origination/-/issues/1053

        UOWN | Origination | Investigate Unchanged Columns Generating Incorrect Logs on the Merchants Page

        Synopsis
        It has been identified that when saving changes on the Merchants page, the logs are including values from specific columns that were not actually modified.
        This results in unnecessarily long and inaccurate log entries, compromising the clarity of the change history.

        Business Objective
        Reduce the generation of unnecessary logs and ensure the change history reflects only actual modifications,
        improving traceability and avoiding confusion during audit and support analysis.

        Feature Request | Business Requirements
        Investigate the logging logic on the Merchants page to understand why columns are being included even when their values have not changed.
        Adjust the logging logic so that only fields with actual changes are recorded
        Validate that after the fix, logs reflect only the real modifications made by users
        Ensure there is no collateral impact on other areas of the system that rely on the same logging mechanism.

        Davi Artur @davi.artur.gow
        Test Steps
        This issue was generated because I worked on an item to remove trailing white spaces of the fields when updating a merchant.
        You can test it by:
        * Inserting empty white spaces in the string-type fields of a merchant directly in the database. (storeTimes is a good one)
        * Then, saving the merchant via the application.
        Expected behavior:
        * The fields that had trailing white spaces removed by the FE should not be logged as changes.

        -----

        UOWN | Origem | Investigar Colunas Não Alteradas Gerando Logs Incorretos na Página de Comerciantes

        Sinopse
        Foi identificado que, ao salvar alterações na página de Comerciantes, os logs estão incluindo valores de colunas específicas que não foram de fato modificadas.
        Isso resulta em entradas de log desnecessariamente longas e imprecisas, comprometendo a clareza do histórico de alterações.

        Objetivo de Negócio
        Reduzir a geração de logs desnecessários e garantir que o histórico de alterações reflita apenas as modificações reais,
        melhorando a rastreabilidade e evitando confusão durante auditorias e análises de suporte.

        Solicitação de Funcionalidade | Requisitos de Negócio
        Investigar a lógica de logging na página de Comerciantes para entender por que colunas estão sendo incluídas mesmo quando seus valores não foram alterados.
        Ajustar a lógica de logging para que apenas os campos com alterações reais sejam registrados.
        Validar que, após a correção, os logs reflitam apenas as modificações reais feitas pelos usuários.
        Garantir que não haja impacto colateral em outras áreas do sistema que dependam do mesmo mecanismo de logging.

        Davi Artur @davi.artur.gow
        Passos de Teste
        Esse problema foi gerado porque eu trabalhei em um item para remover espaços em branco à direita dos campos ao atualizar um comerciante.
        Você pode testá-lo da seguinte forma:
        Inserir espaços em branco no final dos campos do tipo string de um comerciante diretamente no banco de dados. (storeTimes é uma boa opção)
        Em seguida, salvar o comerciante por meio da aplicação.
        Comportamento Esperado:
        Os campos que tiveram espaços em branco removidos pelo frontend (FE) não devem ser registrados como alterações nos logs.

        ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        [ ]Ao salvar alterações na página de Comerciantes, os logs estão incluindo valores de colunas específicas que não foram de fato modificadas.
        [ ]Isso resulta em entradas de log desnecessariamente longas e imprecisas, comprometendo a clareza do histórico de alterações.
        [ ]apenas os campos com alterações reais sejam registrados
        [ ]os logs reflitam apenas as modificações reais feitas pelos usuários.
        [ ]Garantir que não haja impacto colateral em outras áreas do sistema que dependam do mesmo mecanismo de logging(pagina com log)
        [ ]Esse problema foi gerado porque eu trabalhei em um item para remover espaços em branco à direita dos campos ao atualizar um comerciante.
        [ ]Inserir espaços em branco no final dos campos do tipo string de um comerciante diretamente no banco de dados. (storeTimes é uma boa opção)
        [ ]Os campos que tiveram espaços em branco removidos pelo frontend (FE) não devem ser registrados como alterações nos logs.

        [ ]Verificar o ambiente de teste: Confirme que o ambiente de desenvolvimento ou teste está configurado corretamente, com acesso ao banco de dados e à aplicação.
        [ ]Identificar colunas afetadas: Liste as colunas da página de Comerciantes (ex.: storeTimes) que estão sendo registradas nos logs mesmo sem alterações.
        [ ]Inserir espaços em branco no banco de dados: Adicione espaços em branco à direita em campos do tipo string (ex.: storeTimes) de um comerciante diretamente no banco de dados.
        [ ]Salvar o comerciante na aplicação: Acesse a página de Comerciantes na aplicação, edite e salve o comerciante sem alterar os valores, apenas salvando após a inserção dos espaços.
        [ ]Verificar os logs gerados: Consulte os logs após o salvamento e confirme se os campos com espaços em branco removidos (ex.: storeTimes) estão sendo registrados como alterações.
        [ ]Ajustar a lógica de logging: Modifique a lógica de logging para registrar apenas campos com alterações reais, excluindo aqueles onde apenas espaços em branco foram removidos.
        [ ]Testar novamente após ajuste: Repita os passos de inserção de espaços e salvamento, verificando se os logs agora refletem apenas mudanças reais (os campos com espaços removidos não devem aparecer).
        [ ]Validar outras colunas: Teste outras colunas da página de Comerciantes para garantir que a lógica ajustada funcione corretamente em todos os campos afetados.
        [ ]Checar impacto colateral: Analise outras áreas do sistema que usam o mesmo mecanismo de logging para assegurar que não haja efeitos indesejados (ex.: logs ausentes em outras funcionalidades).
        [ ]Documentar os resultados: Registre os testes realizados, incluindo capturas de tela dos logs antes e depois da correção, para validação e auditoria.
        [ ]Solicitar revisão: Envie o checklist preenchido e os resultados para revisão por um colega ou supervisor (ex.: Davi Artur @davi.artur.gow) para aprovação.

        campos alterados no banco de dados:
        locationName
        legalName
        locationAddress1
        zipCode
        salesRepCode
        primaryContactPhone
        primaryContactEmail
        altContactName
        storeTimings

        -----

        When testing the functionality after adding blank spaces to the database and saving the record through the interface, logs were generated indicating changes in fields where only the final blank spaces had been automatically removed by the application.
            The expectation is that no logs will be generated for fields where only trailing spaces were removed.

            ![Screenshot_11](/uploads/a940d6c7d83a9331bf5a67dbf5e2e275/Screenshot_11.png){width=346 height=18}
            ![Screenshot_12](/uploads/35a5593d68b03685993a4cbd9aed8542/Screenshot_12.png){width=381 height=18}
            ![Screenshot_13](/uploads/52764a50ada8d6775f636f13f814c867/Screenshot_13.png){width=332 height=21}
            ![Screenshot_14](/uploads/264ce5cf0ff7bc0106d1565d7995612d/Screenshot_14.png){width=281 height=20}![Screenshot_15](/uploads/da2cda74067645e02e37f15fd1168d2d/Screenshot_15.png){width=281 height=21}![Screenshot_16](/uploads/75d71214d7d5f6d3fe16c6bb86e37163/Screenshot_16.png){width=304 height=19}
            ![Screenshot_17](/uploads/a05dfc136afb6581448b8b8ec93b213d/Screenshot_17.png){width=328 height=21}
            ![Screenshot_18](/uploads/fc6cdd2299f4cb90c79af4c8e8299006/Screenshot_18.png){width=1029 height=19}
            ![Screenshot_19](/uploads/498c38940cd15c0fb4931693b35ae982/Screenshot_19.png){width=1437 height=279}
            ![Screenshot_20](/uploads/7db88077558d6051e16b59a80a226d64/Screenshot_20.png){width=1437 height=742}

            ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


            Verificar se não é gerado log ao adicionar espaços em branco no inicio e fim nos campos location name, legal name, address, email e storeTimes via banco de dados
            Verificar se não é gerado log ao adicionar espaços em branco no inicio e fim nos campos location name, legal name, address, email e storeTimes via interface

            -----

            Tests in qa1

            | Test Case                                                                                                                                                         | Test Data | Status |
            | ------                                                                                                                                                            | ------    | ------ |
            | Verificar se não é gerado log ao adicionar espaços em branco no início e fim nos campos location name, legal name, address, email e storeTimes via banco de dados |           | PASS   |
            | Verificar se não é gerado log ao adicionar espaços em branco no início e fim nos campos location name, legal name, address, email e storeTimes via interface      |           | PASS   |

            -----

            Tests in qa1

            | Test Case                                                                                                                                                         | Test Data | Status |
            | ------                                                                                                                                                            | ------    | ------ |
            | Verify that no log is generated when adding spaces at the beginning and end of the fields location name, legal name, address, email, and storeTimes via database  |           | PASS   |
            | Verify that no log is generated when adding spaces at the beginning and end of the fields location name, legal name, address, email, and storeTimes via interface |           | PASS   |

            -----

            Tests in qa1

            | Test Case                                                                                                                                                         | Test Data                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Status |
            | ------                                                                                                                                                            | ------                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ------ |
            | Verify that no log is generated when adding spaces at the beginning and end of the fields location name, legal name, address, email, and storeTimes via database  | ![1053-qa1c1-EspacoInicioFimBD-_1_](/uploads/0b5ba5b8611e867e6e50e12e67ba72c9/1053-qa1c1-EspacoInicioFimBD-_1_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_2_](/uploads/ccfec6261a38f602d6e73460f17dc0c3/1053-qa1c1-EspacoInicioFimBD-_2_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_3_](/uploads/e4ad61b88095eec5473801bfc0059541/1053-qa1c1-EspacoInicioFimBD-_3_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_4_](/uploads/bdf0d53f226b7238661549a7e8b6eeb0/1053-qa1c1-EspacoInicioFimBD-_4_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_5_](/uploads/41762e405f5618377740af9ab4ff05a4/1053-qa1c1-EspacoInicioFimBD-_5_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_6_](/uploads/14df9539e3dcdae04d118a3f88154847/1053-qa1c1-EspacoInicioFimBD-_6_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_7_](/uploads/662c9210655c61bddc4b06743c0f490f/1053-qa1c1-EspacoInicioFimBD-_7_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_8_](/uploads/6ca404aced84c6e013d6d766711112d6/1053-qa1c1-EspacoInicioFimBD-_8_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_9_](/uploads/cbd499b036803ba84529fb62e75a45ec/1053-qa1c1-EspacoInicioFimBD-_9_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_10_](/uploads/144267b3bd76bdd480c70b86085350b0/1053-qa1c1-EspacoInicioFimBD-_10_.png){width=1173 height=53}![1053-qa1c1-EspacoInicioFimBD-_11_](/uploads/d2e0e35d43be1027063c91b09c5854c8/1053-qa1c1-EspacoInicioFimBD-_11_.png){width=1437 height=740}![1053-qa1c1-EspacoInicioFimBD-_12_](/uploads/cce84f6ff477c02d102de2faa02b3395/1053-qa1c1-EspacoInicioFimBD-_12_.png){width=1134 height=78} | PASS   |
            | Verify that no log is generated when adding spaces at the beginning and end of the fields location name, legal name, address, email, and storeTimes via interface | ![1053-qa1-c2-EspacosInicioFimInterface-_1_](/uploads/2f26fc841f3a7a59b52b05e72da13ba5/1053-qa1-c2-EspacosInicioFimInterface-_1_.png){width=207 height=62}![1053-qa1-c2-EspacosInicioFimInterface-_2_](/uploads/bfb32134ba1233ed5a8fde4a0a167c28/1053-qa1-c2-EspacosInicioFimInterface-_2_.png){width=207 height=57}![1053-qa1-c2-EspacosInicioFimInterface-_3_](/uploads/38ce13389fac2387d122112ca0b363c2/1053-qa1-c2-EspacosInicioFimInterface-_3_.png){width=207 height=57}![1053-qa1-c2-EspacosInicioFimInterface-_4_](/uploads/ed5822ebe448dfdf2a601d75992dff03/1053-qa1-c2-EspacosInicioFimInterface-_4_.png){width=183 height=60}![1053-qa1-c2-EspacosInicioFimInterface-_5_](/uploads/4e75085408bff60127619ebc580678b0/1053-qa1-c2-EspacosInicioFimInterface-_5_.png){width=124 height=53}![1053-qa1-c2-EspacosInicioFimInterface-_6_](/uploads/7d5ab17e7f7efb0ff043bfb3f5b2270a/1053-qa1-c2-EspacosInicioFimInterface-_6_.png){width=395 height=57}![1053-qa1-c2-EspacosInicioFimInterface-_7_](/uploads/693894019a3c8f0bd386c007747f297f/1053-qa1-c2-EspacosInicioFimInterface-_7_.png){width=395 height=57}![1053-qa1-c2-EspacosInicioFimInterface-_8_](/uploads/0a7a31d6aaa0acfd00e3338846f1f787/1053-qa1-c2-EspacosInicioFimInterface-_8_.png){width=1439 height=742}![1053-qa1-c2-EspacosInicioFimInterface-_9_](/uploads/0e3705594aaae3962c6941717d3f3083/1053-qa1-c2-EspacosInicioFimInterface-_9_.png){width=1439 height=742}![1053-qa1-c2-EspacosInicioFimInterface-_10_](/uploads/6c7781210993f25cae9837e753663e41/1053-qa1-c2-EspacosInicioFimInterface-_10_.png){width=1179 height=121}                                                                                                        | PASS   |

    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ok in qa1

    ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



    locationName
    legalName
    locationAddress1
    zipCode
    salesRepCode
    primaryContactPhone
    primaryContactEmail
    altContactName
    storeTimings

    -----

    Scenario Outline: Não gerar log ao salvar merchant com espaços no início e fim do campo <campo> via <origem>
        Quando altero o campo <campo> <origem>, adicionando espaços no início e no fim do valor
        E salvo o merchant pela interface sem modificar o valor do campo <campo>
        Então não deve ser gerado log de alteração para o campo <campo>

        Examples:
            | campo               | origem               |
            | locationName        | diretamente no banco |
            | legalName           | diretamente no banco |
            | locationAddress1    | diretamente no banco |
            | zipCode             | diretamente no banco |
            | salesRepCode        | diretamente no banco |
            | primaryContactPhone | diretamente no banco |
            | primaryContactEmail | diretamente no banco |
            | altContactName      | diretamente no banco |
            | storeTimings        | diretamente no banco |

-----

> ## Tests in stg
> ```gherkin
> Scenario Outline: Do not log when saving merchant with leading and trailing spaces in <field> via <source>
> When I update the <field> <source>, adding spaces at the beginning and end of the value
> And I save the merchant via the UI without modifying the <field> value
> Then no change log should be generated for the <field> field
>
> Examples:
> | field                | source               | Status | Merchant |
> | -------------------- | -------------------- | ------ |          |
> | locationName         | directly in database |  PASS  |          |
> | legalName            | directly in database |  PASS  |          |
> | locationAddress1     | directly in database |  PASS  |          |
> | zipCode              | directly in database |  PASS  |          |
> | salesRepCode         | directly in database |  PASS  |          |
> | primaryContactPhone  | directly in database |  PASS  |          |
> | primaryContactEmail  | directly in database |  PASS  |          |
> | altContactName       | directly in database |  PASS  |          |
> | storeTimings         | directly in database |  PASS  |          |
> ```
>


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


