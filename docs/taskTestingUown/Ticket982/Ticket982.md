------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/982

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Originação | Exibir mensagem apropriada quando um cliente que é NEGADO vai para o URL finalizeApp para SYNCHRONY.

Pedido de Funcionalidade | Requisitos de Negócio
Lista de Recursos /Requisitos a serem implementados pela Equipe de Desenvolvimento:
Na última página (página de aprovação), o BE deve verificar o status do lead 
para retornar a mensagem apropriada (semelhante ao que retornamos no novo envio de inscrição após a negação) 
e antes de enviar o e-mail de aprovação. A partir de agora, ele lança um NPE

Davi Artur @davi.artur.gow

@jose.memesdev

Caso de teste: Exibir Mensagem Adequada para Clientes NEGADOS no URL do Aplicativo Finalizar para SINCRONIZAÇÃO

Característica/Requisito:
Na página final (página de aprovação), o back-end (BE) deve verificar o status do lead para retornar uma mensagem apropriada se o cliente estiver NEGADO.
Esta mensagem deve ser semelhante à retornada após o envio de um novo pedido ser negado.
A verificação deve acontecer antes de enviar o e-mail de aprovação.
Certifique-se de que nenhuma Exceção de Ponteiro Nulo (NPE) seja lançada ao acessar o URL finalizeApp para clientes NEGADOS.

Pré-condições:
O usuário deve ter um status NEGADO no sistema.

Passos:
Envie um aplicativo como SYNCHRONY sendo o comerciante. Você pode usar o carteiro para criar o aplicativo. Se necessário, você pode entrar em contato comigo para que o corpo realize o pedido.
acesse o URL do aplicativo finalize para SYNCHRONY: /finalizeApplication com um aplicativo que tem um NEGADO status de lead.
Observe a resposta retornada pelo backend na página final (aprovação).

Resultado Esperado:
A mensagem Sorry, unfortunately your application is not accepted. é exibido para o lead, semelhante ao retornado após um novo envio de inscrição ser negado.
Não Exceção de Ponteiro Nulo (NPE) deve ser lançado durante o processo.
O e-mail de aprovação não deve ser enviado para um cliente NEGADO.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cenário: Verificar exibição de mensagem para cliente NEGADO ao acessar finalizeApp
  Dado que um usuário possui um status NEGADO no sistema
  Quando o usuário acessa a URL "/finalizeApplication" para SYNCHRONY
  Então a mensagem "Sorry, unfortunately your application is not accepted." deve ser exibida
  E nenhuma Exceção de Ponteiro Nulo (NPE) deve ser lançada
  E nenhum e-mail de aprovação deve ser enviado para o usuário

Cenário: Verificar resposta do backend para cliente NEGADO
  Dado que um usuário possui um status NEGADO no sistema
  Quando uma requisição é feita para o endpoint "/finalizeApplication" via API
  Então a resposta do backend deve conter a mensagem "Sorry, unfortunately your application is not accepted."
  E o código de status HTTP deve ser "200 OK"
  E nenhuma Exceção de Ponteiro Nulo (NPE) deve ser lançada na resposta

Cenário: Criar aplicação via API para um usuário SYNCHRONY e negar manualmente no banco
  Dado que um usuário cria um novo aplicativo via API com SYNCHRONY como comerciante
  E o status do lead é alterado manualmente para NEGADO no banco de dados
  Quando o usuário acessa a URL "/finalizeApplication"
  Então a mensagem "Sorry, unfortunately your application is not accepted." deve ser exibida
  E nenhuma Exceção de Ponteiro Nulo (NPE) deve ser lançada
  E nenhum e-mail de aprovação deve ser enviado para o usuário

Cenário: Verificar que clientes aprovados acessam normalmente a URL finalizeApp
  Dado que um usuário possui um status APROVADO no sistema
  Quando o usuário acessa a URL "/finalizeApplication" para SYNCHRONY
  Então a página final de aprovação deve ser exibida corretamente
  E um e-mail de aprovação deve ser enviado para o usuário

------------------------------------------------------------------------------------------------------------------------------------------------------------------

| LeadPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| 8117 | Verify if the "DENIED" message is correctly displayed to the client when accessing finalizeApp. |  | PASS |
| 8117 | Validate the backend response when the client receives a "DENIED" status. |  | PASS |
| 8117 | Create an application via API for a SYNCHRONY user, manually deny it in the database, and ensure the denial message is displayed. |  | PASS |
| 8118 and 8119 | Ensure that approved clients can access the finalizeApp URL normally. |  | PASS |


Tests in qa1

| LeadPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| 8117 | Verify if the "DENIED" message is correctly displayed to the client when accessing finalizeApp. | ![982-c1_1_-Screenshot_From_2025-02-16_15-08-51](/uploads/9d8e86a271b44c430ba06031f02b8c74/982-c1_1_-Screenshot_From_2025-02-16_15-08-51.png)![982-c1_1_-Screenshot_From_2025-02-16_15-09-02](/uploads/179e69f8c407b21249aeca4d3b523e41/982-c1_1_-Screenshot_From_2025-02-16_15-09-02.png)![982-c1_1_-Screenshot_From_2025-02-16_15-09-05](/uploads/ec3457049f1ceec4a6064c46f6359560/982-c1_1_-Screenshot_From_2025-02-16_15-09-05.png) | PASS |
| 8117 | Validate the backend response when the client receives a "DENIED" status. | ![982-c2_1_Screenshot_From_2025-02-16_15-09-16](/uploads/2231f33db6dc4e1e29f97949fc095651/982-c2_1_Screenshot_From_2025-02-16_15-09-16.png)![982-c2_1_Screenshot_From_2025-02-16_15-09-19](/uploads/abcc1274fba8d270fa9f6ecc79fb201e/982-c2_1_Screenshot_From_2025-02-16_15-09-19.png) | PASS |
| 8117 | Create an application via API for a SYNCHRONY user, manually deny it in the database, and ensure the denial message is displayed. | ![982-c3_1_-Screenshot_From_2025-02-16_15-08-29](/uploads/5bb03a5287da00055c37b58da90f1740/982-c3_1_-Screenshot_From_2025-02-16_15-08-29.png)![982-c3_1_-Screenshot_From_2025-02-16_15-08-30](/uploads/2e1d628034d2ef818872eb7b70e817d8/982-c3_1_-Screenshot_From_2025-02-16_15-08-30.png)![982-c3_1_-Screenshot_From_2025-02-16_15-08-31](/uploads/49f06d2655c8154a1561070d093e60d1/982-c3_1_-Screenshot_From_2025-02-16_15-08-31.png)![982-c3_1_-Screenshot_From_2025-02-16_15-09-16](/uploads/19a702465a2df139fb747093d5b09f5c/982-c3_1_-Screenshot_From_2025-02-16_15-09-16.png)![982-c3_1_-Screenshot_From_2025-02-16_15-09-19](/uploads/17c0a2a513ce59d4f2e4858bdc3fc7e1/982-c3_1_-Screenshot_From_2025-02-16_15-09-19.png)![982-c1_1_-Screenshot_From_2025-02-16_15-09-05](/uploads/6b92a1cdfb3886a1ddfabb4165ae976c/982-c1_1_-Screenshot_From_2025-02-16_15-09-05.png)![982-c3_1_-Screenshot_From_2025-02-16_15-09-50](/uploads/4e6eb6d69f8579f43fc16e1a28a30aef/982-c3_1_-Screenshot_From_2025-02-16_15-09-50.png) | PASS |
| 8123 | Ensure that approved clients can access the finalizeApp URL normally. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se a mensagem "NEGADO" é exibida corretamente para o cliente ao acessar o finalizeApp.
Verify if the "DENIED" message is correctly displayed to the client when accessing finalizeApp.

Validar a resposta do backend quando o cliente recebe um status de "NEGADO".
Validate the backend response when the client receives a "DENIED" status.

Criar uma aplicação via API para um usuário SYNCHRONY, negar manualmente no banco de dados e garantir que a mensagem de negação seja exibida.
Create an application via API for a SYNCHRONY user, manually deny it in the database, and ensure the denial message is displayed.

Garantir que clientes aprovados consigam acessar normalmente a URL finalizeApp.
Ensure that approved clients can access the finalizeApp URL normally.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in staging

| LeadPk | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ |
| 19948 | Verify if the "DENIED" message is correctly displayed to the client when accessing finalizeApp. |  | PASS |
| 19950 | Validate the backend response when the client receives a "DENIED" status. |  | PASS |
| 19951 | Create an application via API for a SYNCHRONY user, manually deny it in the database, and ensure the denial message is displayed. |  | PASS |
| 19952 | Ensure that approved clients can access the finalizeApp URL normally. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------