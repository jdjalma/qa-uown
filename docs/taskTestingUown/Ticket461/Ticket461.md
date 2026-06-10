----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/461

UOWN | Servicing | Preserve Previous Fields When Changing Date in Search Filters

BUG
A bug has been found on the search filter where, when searching in any field and then changing the date, all previously entered fields are cleared. For example:
When searching using any field, the search works as expected. However, if the DATE field is modified, all other filters are reset/cleared.

FIX
Fix this functionality to ensure that users can perform consecutive searches while modifying the DATE field without losing previously entered fields.

Davi Artur @davi.artur.gow
@jose.mendesdev Looking at the record, I think that's possible to understand what must be tested, if you needed more information about how to test this task, text me on teams

-----

UOWN | Atendimento | Preservar Campos Anteriores ao Alterar Data em Filtros de Busca

BUG
Foi encontrado um bug no filtro de busca onde, ao pesquisar em qualquer campo e então alterar a data, todos os campos previamente preenchidos são limpos. Por exemplo:

Ao buscar usando qualquer campo, a pesquisa funciona conforme esperado.

Entretanto, se o campo DATA for modificado, todos os outros filtros são resetados/limpados.

CORREÇÃO
Ajustar essa funcionalidade para garantir que os usuários possam realizar buscas consecutivas modificando o campo DATA sem perder os campos já preenchidos.

Davi Artur @davi.artur.gow
@jose.mendesdev Analisando o registro, acredito que já é possível entender o que deve ser testado; se você precisar de mais informações sobre como testar esta tarefa, me mande uma mensagem no Teams.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se, ao inserir um ou mais parâmetros de busca e executar a pesquisa, ao alterar a(s) data(s) para uma nova consulta, os parâmetros já preenchidos permanecem inalterados.
Verify that when one or more search parameters are entered and the search is executed, changing the date(s) for a subsequent search does not clear the previously entered parameters.

-----

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when one or more search parameters are entered and the search is executed, changing the date(s) for a subsequent search does not clear the previously entered parameters. |  | PASS |

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when one or more search parameters are entered and the search is executed, changing the date(s) for a subsequent search does not clear the previously entered parameters. | ![qa2-461-c1_1_](/uploads/7cce07fbdad7280c61bcd3eac068782a/qa2-461-c1_1_.png){width=1438 height=249}![qa2-461-c1_2_](/uploads/fb6c3e4dd40cc83154d1a25ff210c613/qa2-461-c1_2_.png){width=1438 height=351}![qa2-461-c1_3_](/uploads/70c88423f7a56c7b337af76d94a67a26/qa2-461-c1_3_.png){width=1438 height=730}![qa2-461-c1_4_](/uploads/27e1ebf48ac669de1a0793c3c1dc1ccb/qa2-461-c1_4_.png){width=1438 height=730}![qa2-461-c1_5_](/uploads/32f8a0df827b25d4cdc3d7179380a954/qa2-461-c1_5_.png){width=1438 height=730}![qa2-461-c1_6_](/uploads/1604a36b5a4229911dbdfc50efe0a6e7/qa2-461-c1_6_.png){width=1438 height=730}![qa2-461-c1_7_](/uploads/24bc619bfd2130e6ae881fbc629cb44b/qa2-461-c1_7_.png){width=1438 height=730}![qa2-461-c1_8_](/uploads/be930ffc9bd88c613673ce568ee8dd57/qa2-461-c1_8_.png){width=1438 height=730}![qa2-461-c1_9_](/uploads/972a781e43b55e1f77dfe9e9088218d7/qa2-461-c1_9_.png){width=1438 height=730}![qa2-461-c1_10_](/uploads/c9b599e0dd63e6e160b30ad18464a779/qa2-461-c1_10_.png){width=1438 height=730}![qa2-461-c1_11_](/uploads/88c1188c175a5e8261c15977a300bf67/qa2-461-c1_11_.png){width=1438 height=730}![qa2-461-c1_12_](/uploads/8340fac87564f9f75cf7b32cf7cf7523/qa2-461-c1_12_.png){width=1438 height=730}![qa2-461-c1_13_](/uploads/c6bfadf9b931f6807ee8bee5b7e66d10/qa2-461-c1_13_.png){width=1438 height=730}![qa2-461-c1_14_](/uploads/69669c8afbb286a7718e14b67d7ec498/qa2-461-c1_14_.png){width=1438 height=730}![qa2-461-c1_15_](/uploads/ed348179c341a5c87eb91a8422c69a5d/qa2-461-c1_15_.png){width=1438 height=730}![qa2-461-c1_16_](/uploads/0175d1ca70fb3ca42cc453396b0cbf92/qa2-461-c1_16_.png){width=1438 height=730}![qa2-461-c1_17_](/uploads/86a031eb14a3419b06c6487ebbbda6f3/qa2-461-c1_17_.png){width=1438 height=730}![qa2-461-c1_18_](/uploads/c9e2253259b826455dbfa3e1878ce9c4/qa2-461-c1_18_.png){width=1438 height=730}![qa2-461-c1_19_](/uploads/f92e9c195a4d371c5884ad5e9f7c9d72/qa2-461-c1_19_.png){width=1438 height=730}![qa2-461-c1_20_](/uploads/c2345c35f6dd52c60620fe1d9e44318a/qa2-461-c1_20_.png){width=1438 height=730}![qa2-461-c1_21_](/uploads/488b4a3855c725b05965636d2aea4e78/qa2-461-c1_21_.png){width=1438 height=730}![qa2-461-c1_22_](/uploads/5c67adf3defed356be9169e3a11a7e2b/qa2-461-c1_22_.png){width=1168 height=72} | PASS |
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when one or more search parameters are entered and the search is executed, changing the date(s) for a subsequent search does not clear the previously entered parameters. |  | PASS |
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------