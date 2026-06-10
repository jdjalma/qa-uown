------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/324

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Fix Desactivar o AutoPagamento CC para CHANNEL_PAYMENTS

Sinopse
A validação para desativar o pagamento automático para cartões de crédito inválidos foi implementada e está funcionando para cartões USAEPAY, mas não está funcionando para CHANNEL_PAYMENTS.
CHANNEL_PAYMENTS --> Atualizar cartão tanto em DENIED como em ERROR
Log --> Criar apenas se autoPayTypes contiver CC e remover CC de lá, criar um log
SvCreditCard update --> Update autoPay, isValidCard, invalidRazão no Cartão de Crédito      
Display --> Show isValidCard, invalidRazão na secção de Informação Financeira FE (& Ver Todos)

davi marra @davimarrauownlasing

Passos para Reprodução - No Portal de Manutenção
Acesse o Portal de Serviços.
Navegue até os detalhes da conta na qual você deseja alterar o método de pagamento.
Clique no “Faça Payment” opção no canto superior esquerdo.

Na página de pagamento:
Selecionar Tipo de Pagamento = Pagamento com Cartão de Crédito.
Escolha a opção Use informações únicas do cartão.
Preencha os detalhes do cartão de crédito e envie a solicitação.
Outra opção é "Usar informações de cartão existentes para"
Escolha um cartão na lista e envie a solicitação.

Para realizar o teste, é necessário ter cartões com os seguintes status de erro:
Cartão expirado
Erro no número do cartão
Conta fechada
Cartão de espera (todas as variantes)
Uma vez que um desses cartões é usado, é possível ver as colunas que precisam ser atualizadas no uown_sv_credit_card_transaction e uown_sv_credit_card tabela no banco de dados:

is_valid_card= FALSO
auto_pay= FALSO
invalid_card_reason= Com a mensagem do motivo do erro.
SQL para ver na base de dados (selecione cct.status, cct.auto_pay, cct.is_valid_card, cct.invalid_card_reason, * de uown_sv_credit_card_transaction cct order por cct.row_created_timestamp desc;)

davi marra @davimarrauownleasing
Casos de teste adicionais:
Se a conta tiver um cartão de pagamento automático que não seja o mesmo que o cartão negado, o autoPay ainda deverá conter CC na conta.
Se a conta não tiver outro cartão de pagamento automático, o CC deverá ser removido de autoPayTypes
------------------------------------------------------------------------------------------------------------------------------------------------------------------
Mumu:
José, posso publicar a branch em qa1? Ou espera tu concluir algum teste?
o erro que eu adicionei na lista foi esse aqui --> card declined (00)
 
Jose:
Pode publicar.
 
Mumu:
o número do cartão que a princípio estora esse erro é esse aqui 
--> 4000300011112220 
--> 123
--> card declined (00)
eu vou ir fazendo testes paralelos junto contigo.
no caso vou estar usando o dev1 
essa demanda é estranha demais e me assusta.
 
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Desativação do AutoPagamento CC para CHANNEL_PAYMENTS

  Cenário: Realizar pagamento com cartão expirado 4000300011112220
    Dado que estou no Portal de Serviços na seção de detalhes da conta
    Quando seleciono "Faça Payment"
    E escolho "Pagamento com Cartão de Crédito"
    E insiro um cartão de crédito expirado e envio a solicitação
    Então o pagamento deve ser negado
    E as colunas na tabela "uown_sv_credit_card_transaction" devem ser atualizadas:
      | is_valid_card | auto_pay | invalid_card_reason |
      | FALSO        | FALSO    | Cartão expirado     |

  Cenário: Verificar impacto em autoPay quando há outro cartão válido 4000300011112220
    Dado que a conta tem um cartão de pagamento automático válido diferente do cartão negado
    Quando um pagamento é negado para um cartão inválido
    Então o campo autoPay ainda deve conter "CC" na conta

  Cenário: Verificar impacto em autoPay quando não há outro cartão válido 4000300011112220
    Dado que a conta não tem outro cartão de pagamento automático válido
    Quando um pagamento é negado para um cartão inválido
    Então "CC" deve ser removido de autoPayTypes
------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique que, ao tentar realizar um pagamento com o cartão expirado 4000300011112220, o pagamento é negado e as colunas is_valid_card, auto_pay e invalid_card_reason na tabela "uown_sv_credit_card_transaction" são atualizadas para FALSO, FALSO e "Cartão expirado", respectivamente.
Verify that when attempting a payment with the expired card 4000300011112220, the payment is declined and the is_valid_card, auto_pay, and invalid_card_reason columns in the "uown_sv_credit_card_transaction" table are updated to FALSE, FALSE, and "Cartão expirado", respectively.

Verifique que, quando um pagamento é negado para um cartão inválido e a conta possui outro cartão de pagamento automático válido, o campo autoPay permanece configurado com "CC".
Verify that when a payment is declined for an invalid card and the account has another valid automatic payment card, the autoPay field remains set to "CC".


Verifique que, quando um pagamento é negado para um cartão inválido e não há outro cartão de pagamento automático válido, o valor "CC" é removido de autoPayTypes.
Verify that when a payment is declined for an invalid card and there is no other valid automatic payment card, the "CC" value is removed from autoPayTypes.

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 3638 | Msa PowerSports | Verify that when attempting a payment with the expired card 4000300011112220, the payment is declined and the is_valid_card, auto_pay, and invalid_card_reason columns in the "uown_sv_credit_card_transaction" table are updated to FALSE, FALSE, and "Cartão expirado", respectively. |  | PASS |
| 3640 | MSA Powersports | Verify that when a payment is declined for an invalid card and the account has another valid automatic payment card, the autoPay field remains set to "CC". |  | PASS |
| 3638 | MSA Powersports | Verify that when a payment is declined for an invalid card and there is no other valid automatic payment card, the "CC" value is removed from autoPayTypes. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| AccountPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 205917 | Tire Agent | Verify that when attempting a payment with the expired card 4000300011112220, the payment is declined and the is_valid_card, auto_pay, and invalid_card_reason columns in the "uown_sv_credit_card_transaction" table are updated to FALSE, FALSE, and "Expired Card", respectively. |  | PASS | -- |
| 205914 | MSA Powersports | Verify that when a payment is declined for an invalid card and the account has another valid automatic payment card, the autoPay field remains set to "CC". | ![324-c2_1_-Screenshot_From_2025-02-23_23-53-36](/uploads/315f0b37a7e0e6cee592dfd7bd218cea/324-c2_1_-Screenshot_From_2025-02-23_23-53-36.png)![324-c2_1_-Screenshot_From_2025-02-23_23-53-37](/uploads/0e125488ee3e8a28871dd534608dcb22/324-c2_1_-Screenshot_From_2025-02-23_23-53-37.png)![324-c2_1_-Screenshot_From_2025-02-23_23-53-38](/uploads/a12558cd4e02d269a007986dfd465580/324-c2_1_-Screenshot_From_2025-02-23_23-53-38.png)![324-c2_1_-Screenshot_From_2025-02-23_23-53-39](/uploads/d21a8036df06435d949f67cdb9385a5f/324-c2_1_-Screenshot_From_2025-02-23_23-53-39.png)![324-c2_1_-Screenshot_From_2025-02-23_23-54-00](/uploads/5162a35c42f8edf1ca40eafc56a32bc8/324-c2_1_-Screenshot_From_2025-02-23_23-54-00.png) | PASS | -- |
| 205914 | MSA Powersports | Verify that when a payment is declined for an invalid card and there is no other valid automatic payment card, the "CC" value is removed from autoPayTypes. | ![324-c3_1_-Screenshot_From_2025-02-23_23-57-32](/uploads/ff1de69a31de212f0837953ddcbdf956/324-c3_1_-Screenshot_From_2025-02-23_23-57-32.png)![324-c3_1_-Screenshot_From_2025-02-23_23-57-35](/uploads/6a988c0c22be9b19a6835c5dcf64752d/324-c3_1_-Screenshot_From_2025-02-23_23-57-35.png)![324-c3_1_-Screenshot_From_2025-02-23_23-57-44](/uploads/d12f7ad59738f1ffef98b8469991ef46/324-c3_1_-Screenshot_From_2025-02-23_23-57-44.png)![324-c3_1_-Screenshot_From_2025-02-23_23-59-59](/uploads/b401ab044a71fa3156fa300252c70265/324-c3_1_-Screenshot_From_2025-02-23_23-59-59.png)![324-c3_1_-Screenshot_From_2025-02-24_00-01-47](/uploads/c44b9060bae18c7919ef7df5de4ad446/324-c3_1_-Screenshot_From_2025-02-24_00-01-47.png)![324-c3_1_-Screenshot_From_2025-02-24_00-01-54](/uploads/cd4715cd3364d3ce3656fcba1e292652/324-c3_1_-Screenshot_From_2025-02-24_00-01-54.png)![324-c3_1_-Screenshot_From_2025-02-24_00-02-16](/uploads/079b9acbbd55975c471f8d57dd9062c0/324-c3_1_-Screenshot_From_2025-02-24_00-02-16.png)![324-c3_1_-Screenshot_From_2025-02-24_00-02-35](/uploads/4cc100130a0b0a73d373fe6b39f0b8a5/324-c3_1_-Screenshot_From_2025-02-24_00-02-35.png) | PASS | -- |

------------------------------------------------------------------------------------------------------------------------------------------------------------------