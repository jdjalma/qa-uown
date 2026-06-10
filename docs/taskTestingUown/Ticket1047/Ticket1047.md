------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1047

UOWN | Origination | Fix SSN Parsing Issue in Primary Applicant Panel on Origination

BUG
In the Primary Applicant panel within the Origination, attempting to edit any information triggers an error stating that the SSN (Social Security Number) is invalid. This issue is caused by a parsing problem due to the use of a dash (-) as a mask in the SSN format (e.g., 123-45-6789), which is not being properly handled by the component.

FIX
Update the SSN parsing logic on common-ui to correctly handle masked values with dashes (-), or normalize/remove the masking characters before validation. Ensure that information editing in the Primary Applicant form works as expected even when the SSN is formatted with dashes.

Fernando Martins @fernandogmartins
Testing Steps
Verify that the parsing error no longer occurs and that SSN information can be saved without using dashes (-).
Confirm that the success message appears correctly upon saving.

-----

UOWN | Originação | Corrigir Problema de Parsing do SSN no Painel de Solicitante Principal
Status: Aberto
Criado por: Yuri Araujo
Tipo: BUG
Data: 3 semanas atrás

Descrição do Problema
No painel de Solicitante Principal dentro do módulo de Originação, ao tentar editar qualquer informação, um erro é exibido informando que o SSN (Social Security Number) é inválido.
Esse problema ocorre devido a uma falha no parsing do valor do SSN quando está formatado com traços (“-”), 
por exemplo, 123-45-6789. O componente não está tratando corretamente esse formato, resultando no erro de validação.

Como Corrigir
Atualizar a lógica de parsing do SSN no common-ui para lidar corretamente com valores mascarados usando traços (“-”).
Alternativamente, normalizar/remover caracteres de máscara antes da validação.
Garantir que a edição de informações no formulário de Solicitante Principal funcione corretamente mesmo quando o SSN estiver formatado com traços.

Passos para Teste
Verifique se o erro de parsing não ocorre mais e se é possível salvar o SSN mesmo inserindo o valor sem traços (ex: 356436454):
Confirme que a mensagem de sucesso aparece corretamente após salvar:
O sistema deve aceitar SSNs tanto com quanto sem máscara (traços) no momento da validação/salvamento.
O usuário não pode receber o erro "Please enter a valid SSN." ao informar um SSN válido, independentemente do formato.

-----

Variações de Teste para o Campo SSN
1. Formatos Válidos
Apenas dígitos:
123456789
(Sem nenhum caractere especial ou espaço)

Com traços:
123-45-6789
(Formato tradicional americano)

Com espaços (caso o campo permita):
123 45 6789
(Nem sempre permitido, mas vale testar para garantir tratamento)

2. Formatos Inválidos
Com letras:
123-AB-6789, A23456789

Com caracteres especiais diferentes de traço:
123/45/6789, 123.45.6789, 123_45_6789

Com menos de 9 dígitos:
123-45-678
12345678

Com mais de 9 dígitos:
1234567890
123-45-67890

Só traços, sem números:
---, - - -

Campo vazio:
``

Espaços extras antes, no meio ou depois:
123-45-6789
123 -45-6789

3. Testes de Limite
Dígitos consecutivos iguais:
111-11-1111
(Em alguns sistemas pode ser inválido, vale checar a regra de negócio)

Dígitos repetidos, mas formatados corretamente:
999-99-9999

4. Testes de Máscara
Inserção automática de traços pelo componente (caso a máscara seja aplicada no input):
Digitar só números e verificar se o campo coloca os traços sozinho

Inserção manual dos traços:
O usuário digita os traços manualmente

Pasta/Cola no campo:
Colar um SSN com e sem traços direto no campo

✅ O que esperar em cada caso:
Válidos: O campo deve aceitar e permitir salvar sem erros.
Inválidos: O campo deve exibir a mensagem de erro “Please enter a valid SSN.” ou equivalente, impedindo o salvamento.
Vazios: Deve exibir mensagem de campo obrigatório, se for o caso.

-----

tests in qa1

| LeadPk/AccountPk | Test Case                                             | Test Data  | Status | Observation                                                                                    |
| ------ | -------------------------------------------| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------  |
| 9057 and 3929 | Inserir SSN apenas com dígitos                           |            | PASS   | Aceito normalmente                                                                             |
| 9057 and 3929 | Inserir SSN no formato tradicional americano com traços  |            | PASS   | Aceito normalmente                                                                             |
| 9057 and 3929 | Inserir SSN com espaços entre números                    |            | PASS   | Não aceita colar SSN contendo espaço e não aceita digitar espaço                               |
| 9057 and 3929 | Inserir SSN com letras                                   |            | PASS   | Não aceita colar SSN contendo letra e não aceita digitar letra                                 |
| 9057 and 3929 | Inserir SSN com caracteres especiais (/, ., _)           |            | PASS   | Não aceita colar SSN contendo caractere especial e não aceita digitar caractere especial       |
| 9057 and 3929 | Inserir SSN com menos de 9 dígitos                       |            | PASS   | Exibe validação de                                                                             |
| 9057 and 3929 | Inserir SSN com mais de 9 dígitos                        |            | PASS   | Exibe validação de erro                                                                        |
| 9057 and 3929 | Inserir apenas traços                                    |            | PASS   | Não aceita colar SSN com traço e não aceita digitar traço                                      |
| 9057 and 3929 | Deixar o campo vazio                                     |            | PASS   | Exibe validação de campo obrigatório                                                           |
| 9057 and 3929 | Inserir SSN com espaços extras antes, no meio ou depois  |            | PASS   | Não aceita colar SSN com espaço e não aceita digitar espaço ou traço extra                     |
| 9057 and 3929 | Inserir SSN com dígitos consecutivos iguais              |            | PASS   | Aceito normalmente                                                                             |
| 9057 and 3929 | Inserir SSN com dígitos repetidos, mas formatado correto |            | PASS   | Aceito normalmente                                                                             |
| 9057 and 3929 | Verificar inserção automática de traços pelo componente  |            | PASS   | Traços inseridos automaticamente                                                               |
| 9057 and 3929 | Inserção manual dos traços                               |            | PASS   | Aceito normalmente                                                                             |
| 9057 and 3929 | Colar SSN no campo (com e sem traços)                    |            | PASS   | Aceito normalmente                                                                             |

-----

tests in qa1

| LeadPk/AccountPk | Test Case                                             | Test Data  | Status | Observation                                                                                   |
| ---------------- | ----------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| 9057 and 3929    | Enter SSN with only digits                            |            | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN in traditional American format with dashes  |            | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN with spaces between numbers                 |            | PASS   | Does not accept pasting SSN with space and does not allow typing space                        |
| 9057 and 3929    | Enter SSN with letters                                |            | PASS   | Does not accept pasting SSN with letters and does not allow typing letters                    |
| 9057 and 3929    | Enter SSN with special characters (/, ., _)           |            | PASS   | Does not accept pasting SSN with special characters and does not allow typing special chars    |
| 9057 and 3929    | Enter SSN with less than 9 digits                     |            | PASS   | Displays validation error                                                                     |
| 9057 and 3929    | Enter SSN with more than 9 digits                     |            | PASS   | Displays validation error                                                                     |
| 9057 and 3929    | Enter only dashes                                     |            | PASS   | Does not accept pasting SSN with dash and does not allow typing dash                          |
| 9057 and 3929    | Leave the field empty                                 |            | PASS   | Displays required field validation                                                            |
| 9057 and 3929    | Enter SSN with extra spaces before, in the middle, or after |        | PASS   | Does not accept pasting SSN with space and does not allow typing extra space or dash          |
| 9057 and 3929    | Enter SSN with consecutive identical digits           |            | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN with repeated digits but correct format     |            | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Check automatic dash insertion by the component       |            | PASS   | Dashes inserted automatically                                                                 |
| 9057 and 3929    | Manual insertion of dashes                            |            | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Paste SSN into the field (with and without dashes)    |            | PASS   | Accepted normally                                                                             |

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

tests in stg

| LeadPk/AccountPk | Test Case                                             | Test Data  | Status | Observation                                                                                   |
| ---------------- | ----------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| 9057 and 3929    | Enter SSN with only digits                            |     --     | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN in traditional American format with dashes  |      ![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_1_](/uploads/50ac159ca32ed053567ab89ce6490686/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_1_.png){width=1438 height=738}![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_2_](/uploads/aa6bab22246cf0238ccfbd71f2595507/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_2_.png){width=1438 height=738}![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_3_](/uploads/702fa3033a666d6ee3a6d9488af27740/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_3_.png){width=402 height=39}![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_4_](/uploads/6e7dc9cf08c9eb501cd4c4bfa0ee1a83/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_4_.png){width=354 height=360}![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_5_](/uploads/68526e8618d45b69c45b3aee2bc36d9f/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_5_.png){width=1437 height=743}{{1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-(6).png}}![1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_7_](/uploads/529cd5c47988102f305fa28364b204ac/1047-qa1-origination-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_7_.png){width=402 height=42}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_1_](/uploads/cbabd8219c44b987484174b0c66c4cc1/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_1_.png){width=419 height=331}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_2_](/uploads/f3784c922b5c736eecbd1cc99b4b0079/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_2_.png){width=1437 height=737}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_3_](/uploads/04995df5cc6fd7158df205b7de12fc36/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_3_.png){width=1437 height=737}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_4_](/uploads/56f76f7eaf8a54a208902d28c9f7ae77/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_4_.png){width=414 height=324}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_5_](/uploads/da065982ad8372e03e6f7476397da43a/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_5_.png){width=1437 height=741}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_6_](/uploads/7e4b32fca1ecafbaef9f6954a651e6dc/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_6_.png){width=1437 height=741}![1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_7_](/uploads/b14cc8672f1d58e5df6ba0dda691532e/1047-qa1-servicing-OK-ApenasDigitosSemCaractereEspecialOuEspaco-_7_.png){width=419 height=43}      | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN with spaces between numbers                 |     --     | PASS   | Does not accept pasting SSN with space and does not allow typing space                        |
| 9057 and 3929    | Enter SSN with letters                                |     --     | PASS   | Does not accept pasting SSN with letters and does not allow typing letters                    |
| 9057 and 3929    | Enter SSN with special characters (/, ., _)           |     --     | PASS   | Does not accept pasting SSN with special characters and does not allow typing special chars    |
| 9057 and 3929    | Enter SSN with less than 9 digits                     |      ![1047-qa1-origination-CampoIncompleto-OK-_1_](/uploads/a5499b3e4e087586602f7ed7fc2917ed/1047-qa1-origination-CampoIncompleto-OK-_1_.png){width=1432 height=741}![1047-qa1-servicing-CampoIncompleto-OK-_1_](/uploads/a0050adf668f3714ee405d6ad14594f3/1047-qa1-servicing-CampoIncompleto-OK-_1_.png){width=1432 height=741}      | PASS   | Displays validation error                                                                     |
| 9057 and 3929    | Enter SSN with more than 9 digits                     |     --     | PASS   | Displays validation error                                                                     |
| 9057 and 3929    | Enter only dashes                                     |     --     | PASS   | Does not accept pasting SSN with dash and does not allow typing dash                          |
| 9057 and 3929    | Leave the field empty                                 |     ![1047-qa1-servicing-CampoVazio-OK-_1_](/uploads/5b8c234bb8a12c6464f7750aacab61d7/1047-qa1-servicing-CampoVazio-OK-_1_.png){width=396 height=549}![1047-qa1-origination-CampoVazio-OK-_1_](/uploads/88afe208ad6775fc62a677b78fe3bfdc/1047-qa1-origination-CampoVazio-OK-_1_.png){width=357 height=590}       | PASS   | Displays required field validation                                                            |
| 9057 and 3929    | Enter SSN with extra spaces before, in the middle, or after |   --   | PASS   | Does not accept pasting SSN with space and does not allow typing extra space or dash          |
| 9057 and 3929    | Enter SSN with consecutive identical digits           |     --     | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Enter SSN with repeated digits but correct format     |     --     | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Check automatic dash insertion by the component       |     --     | PASS   | Dashes inserted automatically                                                                 |
| 9057 and 3929    | Manual insertion of dashes                            |    --      | PASS   | Accepted normally                                                                             |
| 9057 and 3929    | Paste SSN into the field (with and without dashes)    |    --      | PASS   | Accepted normally                                                                             |

-----

Enter SSN with only digits                            
Enter SSN in traditional American format with dashes  
Enter SSN with spaces between numbers                 
Enter SSN with letters                                
Enter SSN with special characters (/, ., _)           
Enter SSN with less than 9 digits                     
Enter SSN with more than 9 digits                     
Enter only dashes                                     
Leave the field empty                                 
Enter SSN with extra spaces before, in the middle, or after
Enter SSN with consecutive identical digits           
Enter SSN with repeated digits but correct format     
Check automatic dash insertion by the component       
Manual insertion of dashes                            
Paste SSN into the field (with and without dashes)    

-----------------------------------------------------


1. Inserir SSN somente com números (válido)
Exemplo: 123456789
Esperado: Aceitar e formatar automaticamente.
| LeadPk 23600 / AccountPk 206300 |


2. Inserir SSN no formato americano tradicional (com traços) (válido)
Exemplo: 123-45-6789
Esperado: Aceitar o valor.
| LeadPk 23601 / AccountPk 206301 |


3. Inserir SSN com espaços extras (inválido)
Exemplo: 123 45 6789, 12 3456789, 123456 789
Esperado: Campo não aceita espaços.
| LeadPk 23602 / AccountPk 206302 |


4. Inserir SSN com caracteres especiais (inválido)
Exemplo: 123/45.6789, 123_45_6789
Esperado: Campo não aceita caracteres especiais.
| LeadPk 23603 / AccountPk 206303 |


5. Inserir SSN com letras (inválido)
Exemplo: 12A-45-6789
Esperado: Campo não aceita letras.
| LeadPk 23604 / AccountPk 206304 |


6. Inserir SSN com menos de 9 dígitos (inválido)
Exemplo: 12345678
Esperado: Exibe aviso "Please enter a valid SSN".
| LeadPk 23605 / AccountPk 206305 |


7. Inserir SSN com mais de 9 dígitos (inválido)
Exemplo: 1234567890
Esperado: Campo não aceita mais que 9 numeros.
| LeadPk 23603 / AccountPk 206303 |


8. Inserir SSN com apenas traços ou campo vazio (inválido)
Exemplo: --- ou campo vazio
Esperado: Campo não aceita "-".
| LeadPk 23603 / AccountPk 206303 |


11. Testar inserção automática de traços ao digitar SSN
Exemplo: Digitar 123456789 e verificar se vira 123-45-6789
Esperado: Sistema insere traços automaticamente.
| LeadPk 23603 / AccountPk 206303 |


12. Testar colar SSN no campo (com e sem traços)
Exemplo: Colar 123456789 ou 123-45-6789
Esperado: Aceitar e formatar corretamente.
| LeadPk 23603 / AccountPk 206303 |

------

> ## Tests in stg
> ```gherkin
>
> ### Scenario: Inserir SSN somente com números (válido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "123456789" no campo
> Then o sistema aceita e formata automaticamente como "123-45-6789"
> | PASS | LeadPk 23600 / AccountPk 206300 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN no formato americano tradicional (com traços) (válido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "123-45-6789" no campo
> Then o sistema aceita o valor sem erros
> | PASS | LeadPk 23601 / AccountPk 206301 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com espaços extras (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "123 45 6789" ou "12 3456789" ou "123456 789" no campo
> Then o sistema não aceita espaços
> | PASS | LeadPk 23602 / AccountPk 206302 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com caracteres especiais (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "123/45.6789" ou "123_45_6789" no campo
> Then o sistema não aceita caracteres especiais
> | PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com letras (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "12A-45-6789" no campo
> Then o sistema não aceita letras
> | PASS | LeadPk 23604 / AccountPk 206304 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com menos de 9 dígitos (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "12345678" no campo
> Then o sistema exibe aviso "Please enter a valid SSN"
> | PASS | LeadPk 23605 / AccountPk 206305 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com mais de 9 dígitos (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "1234567890" no campo
> Then o campo não aceita mais que 9 números
> | PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Inserir SSN com apenas traços ou campo vazio (inválido)
> Given o usuário acessa o campo de SSN no cadastro
> When digita "---" ou deixa o campo vazio
> Then o campo não aceita apenas traços ou vazio
> | PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Testar inserção automática de traços ao digitar SSN
> Given o usuário acessa o campo de SSN no cadastro
> When digita "123456789" sem traços
> Then o sistema insere traços automaticamente, exibindo "123-45-6789"
> | PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
> ### Scenario: Testar colar SSN no campo (com e sem traços)
> Given o usuário acessa o campo de SSN no cadastro
> When cola "123456789" ou "123-45-6789" no campo
> Then o sistema aceita e formata corretamente como "123-45-6789"
> | PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>

-----

>Tests in stg
> ```gherkin
>
> ```gherkin
>### Scenario: Enter SSN using only numbers (valid)
>Given the user accesses the SSN field in the registration form
>When they type "123456789" in the field
>Then the system accepts and automatically formats it as "123-45-6789"
>| PASS | LeadPk 23600 / AccountPk 206300 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN in traditional American format (with dashes) (valid)
>Given the user accesses the SSN field in the registration form
>When they type "123-45-6789" in the field
>Then the system accepts the value without errors
>| PASS | LeadPk 23601 / AccountPk 206301 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with extra spaces (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "123 45 6789" or "12 3456789" or "123456 789" in the field
>Then the system does not accept spaces
>| PASS | LeadPk 23602 / AccountPk 206302 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with special characters (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "123/45.6789" or "123_45_6789" in the field
>Then the system does not accept special characters
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with letters (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "12A-45-6789" in the field
>Then the system does not accept letters
>| PASS | LeadPk 23604 / AccountPk 206304 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with less than 9 digits (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "12345678" in the field
>Then the system displays the warning "Please enter a valid SSN"
>| PASS | LeadPk 23605 / AccountPk 206305 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with more than 9 digits (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "1234567890" in the field
>Then the field does not accept more than 9 numbers
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with only dashes or empty field (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "---" or leave the field empty
>Then the field does not accept only dashes or empty value
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Test automatic insertion of dashes when typing SSN
>Given the user accesses the SSN field in the registration form
>When they type "123456789" without dashes
>Then the system automatically inserts dashes, displaying "123-45-6789"
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Test pasting SSN in the field (with and without dashes)
>Given the user accesses the SSN field in the registration form
>When they paste "123456789" or "123-45-6789" in the field
>Then the system accepts and formats correctly as "123-45-6789"
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>


>Tests in stg
> ```gherkin
>
>### Scenario: Enter SSN using only numbers (valid)
>Given the user accesses the SSN field in the registration form
>When they type "123456789" in the field
>Then the system accepts and automatically formats it as "123-45-6789"
>| PASS | LeadPk 23600 / AccountPk 206300 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN in traditional American format (with dashes) (valid)
>Given the user accesses the SSN field in the registration form
>When they type "123-45-6789" in the field
>Then the system accepts the value without errors
>| PASS | LeadPk 23601 / AccountPk 206301 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with extra spaces (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "123 45 6789" or "12 3456789" or "123456 789" in the field
>Then the system does not accept spaces
>| PASS | LeadPk 23602 / AccountPk 206302 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with special characters (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "123/45.6789" or "123_45_6789" in the field
>Then the system does not accept special characters
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with letters (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "12A-45-6789" in the field
>Then the system does not accept letters
>| PASS | LeadPk 23604 / AccountPk 206304 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with less than 9 digits (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "12345678" in the field
>Then the system displays the warning "Please enter a valid SSN"
>| PASS | LeadPk 23605 / AccountPk 206305 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with more than 9 digits (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "1234567890" in the field
>Then the field does not accept more than 9 numbers
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Enter SSN with only dashes or empty field (invalid)
>Given the user accesses the SSN field in the registration form
>When they type "---" or leave the field empty
>Then the field does not accept only dashes or empty value
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Test automatic insertion of dashes when typing SSN
>Given the user accesses the SSN field in the registration form
>When they type "123456789" without dashes
>Then the system automatically inserts dashes, displaying "123-45-6789"
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>
> ```gherkin
>### Scenario: Test pasting SSN in the field (with and without dashes)
>Given the user accesses the SSN field in the registration form
>When they paste "123456789" or "123-45-6789" in the field
>Then the system accepts and formats correctly as "123-45-6789"
>| PASS | LeadPk 23603 / AccountPk 206303 | Progress Mobility |
> ```
>

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------