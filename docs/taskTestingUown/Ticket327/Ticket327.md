------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/327

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Investigar e Corrigir Verificações de Exibição e Backend de Mensagens de Erro Após “Criar Lease”

BUG
Os usuários estão encontrando uma mensagem de erro ao tentar enviar SMS após finalizar um contrato. Embora o erro apareça, 
os e-mails ainda estão sendo recebidos com sucesso, indicando que o processo de locação foi concluído, mas exibe incorretamente uma mensagem de falha.

FIXAR
Investigar e corrigir o tratamento de mensagens de erro para garantir que ele só aparece em cenários de falha reais.
Implementar validações de back-end para verificar se o SMS foi enviado antes de exibir um erro.

Passos para Reprodução
Clique em “Criar Lease” na aplicação.
Selecione uma opção de pagamento e prossiga.
Observe que uma mensagem de erro aparece, mesmo que um e-mail ainda seja recebido com sucesso.

Mark Silvano @marcos.pacheco.silva
instruções do teste de QA
Embora não seja possível testar totalmente os recursos de SMS fora da produção, 
testes para garantir que a criação de locação permaneça funcional após as alterações serem feitas são necessários.

Para cobrir as alterações, crie um novo contrato de arrendamento sem usar a API para que o botão "criar contrato de arrendamento" seja exibido e, 
em seguida, prossiga para concluir a criação do contrato de arrendamento - nenhum erro deve ser apresentado ao fazê-lo.
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Validação de mensagens de erro após criação de lease e manipulação de invoices

  Cenário: Criar lease via interface e verificar se a mensagem de erro é exibida
    Dado que o usuário acessa a aplicação
    E o usuário clica em "Criar Lease"
    Quando o usuário seleciona uma opção de pagamento e prossegue
    Então a criação do lease deve ser concluída sem exibir mensagens de erro incorretas
    E um e-mail de confirmação deve ser recebido
    Mas nenhuma mensagem de erro de SMS deve ser exibida erroneamente

  Cenário: Alterar um invoice inserindo itens e alterando dados
    Dado que o usuário acessa a aplicação
    E um invoice já foi criado
    Quando o usuário adiciona novos itens ao invoice
    Então os novos itens devem ser exibidos corretamente no invoice atualizado

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8125 | WeGetFinancing | Verify if an error message is returned when creating a lease via the interface |  | PASS |
| 8128 and 8129 | WeGetFinancing | Verify if an error occurs when modifying an invoice by adding items and updating data |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se, ao criar um lease via interface, é retornada uma mensagem de erro
Verify if an error message is returned when creating a lease via the interface

Verificar se ocorre um erro ao alterar um invoice, inserindo itens e modificando dados
Verify if an error occurs when modifying an invoice by adding items and updating data

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
|  |  | Verify if an error message is returned when creating a lease via the interface |  | PASS |
|  |  | Verify if an error occurs when modifying an invoice by adding items and updating data |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------