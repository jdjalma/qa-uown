----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/466

UOWN | Servicing | Mandate user to enter invalid reason when credit card is marked invalid

Marcos Silvano @marcos.pacheco.silva
test instructions
In the credit cards modal now when toggling the invalid card option it will require the invalid reason to be filled

-----

UOWN | Servicing | Exigir que o usuário informe o motivo de invalidação quando o cartão de crédito for marcado como inválido

Marcos Silvano @marcos.pacheco.silva
instruções de teste
No modal de cartões de crédito, ao alternar a opção “cartão inválido”, agora será obrigatório preencher o motivo da invalidação.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://jam.dev/c/cdbd5763-5ade-4702-b79c-888f056a9778
https://jam.dev/c/d4df6355-b074-4f29-8a2f-487a6f1ff416

@marcos.pacheco.silva I have encountered a difficulty that prevents me from continuing with the test. I cannot mark the card as valid or invalid because when I click on the button to deactivate it returns:
Application error: a client-side exception has occurred (see the browser console for more information).
In QA1, when I try to set the card’s validity it succeeds as expected.

-----

Verificar se, ao invalidar um cartão de crédito, só é possível prosseguir após informar o motivo da invalidação e se, ao informar, esse motivo é registrado nos logs e armazenado no banco de dados.
Verify that when invalidating a credit card, you can proceed only after providing the invalidation reason, and that once provided, this reason is logged and persisted in the database.

Verificar se, ao alterar o motivo de invalidação, o novo motivo aparece corretamente nos logs e é gravado no banco de dados.
Verify that when updating the invalidation reason, the new reason is correctly recorded in the logs and saved to the database.

Verificar se, ao tornar o cartão válido novamente, o campo de motivo de invalidação não é exibido, a ação é registrada nos logs e a flag is_valid = true é armazenada no banco de dados.
Verify that when revalidating the card, the invalidation reason field is not shown, the action is logged, and the is_valid = true flag is stored in the database.

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify that when invalidating a credit card, you can proceed only after providing the invalidation reason, and that once provided, this reason is logged and persisted in the database. |  | PASS |
| 10617 | Progress Mobility | Verify that when updating the invalidation reason, the new reason is correctly recorded in the logs and saved to the database. |  | PASS |
| 10617 | Progress Mobility | Verify that when revalidating the card, the invalidation reason field is not shown, the action is logged, and the is_valid = true flag is stored in the database. |  | PASS |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify that when invalidating a credit card, you can proceed only after providing the invalidation reason, and that once provided, this reason is logged and persisted in the database. | ![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_1_](/uploads/138d222bac9a69ed37e0f7e948da1665/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_1_.png){width=1433 height=742}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_2_](/uploads/27ad29ef8d9c39d0f8a2eef9923fe7aa/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_2_.png){width=1433 height=742}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_3_](/uploads/642f3b855027734f7b508381f8ccde18/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_3_.png){width=1433 height=742}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_4_](/uploads/18280ccff30fb6c342cd4621b89ae0da/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_4_.png){width=1433 height=742}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_5_](/uploads/7b3aa8b4a3df1da31f92e452dfbc7303/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_5_.png){width=1433 height=742}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_6_](/uploads/e6300403931c0e8aa41522a0b63b79f1/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_6_.png){width=1173 height=66}![qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_7_](/uploads/cc7e5cde26905e35185a413f4d86b3ff/qa2-466-c1-InvalidarCartaoPermiteProsseguirInformarInvalidReasonVerificarLogBancoDeDados_7_.png){width=684 height=35} | PASS |
| 10617 | Progress Mobility | Verify that when updating the invalidation reason, the new reason is correctly recorded in the logs and saved to the database. | ![qa2-466-c2-AlterarInvalidReason_1_](/uploads/7c26393c9a881a131f44ffc62a3da13f/qa2-466-c2-AlterarInvalidReason_1_.png){width=1437 height=741}![qa2-466-c2-AlterarInvalidReason_2_](/uploads/00486a4efce22af9571bb31d08d5c852/qa2-466-c2-AlterarInvalidReason_2_.png){width=1437 height=741}![qa2-466-c2-AlterarInvalidReason_3_](/uploads/d269559e61137edfdf05eee4e28a5335/qa2-466-c2-AlterarInvalidReason_3_.png){width=1437 height=741}![qa2-466-c2-AlterarInvalidReason_4_](/uploads/83b91672d03eaa6308afa66695720eac/qa2-466-c2-AlterarInvalidReason_4_.png){width=1160 height=38}![qa2-466-c2-AlterarInvalidReason_5_](/uploads/5e3463ceb9a2fc9f9ebc14cd9a8e08bb/qa2-466-c2-AlterarInvalidReason_5_.png){width=665 height=38} | PASS |
| 10617 | Progress Mobility | Verify that when revalidating the card, the invalidation reason field is not shown, the action is logged, and the is_valid = true flag is stored in the database. | ![qa2-466-c3-TornarCartaoValido_1_](/uploads/8e45f0b432ec6111cc57df0194806efc/qa2-466-c3-TornarCartaoValido_1_.png){width=1437 height=741}![qa2-466-c3-TornarCartaoValido_2_](/uploads/45ce10026342c3c89d50d5f7b796f670/qa2-466-c3-TornarCartaoValido_2_.png){width=1437 height=741}![qa2-466-c3-TornarCartaoValido_3_](/uploads/157fb40b8cb9cf0fa88add70849c02df/qa2-466-c3-TornarCartaoValido_3_.png){width=1437 height=741}![qa2-466-c3-TornarCartaoValido_4_](/uploads/40bc03a5bfda9b3bbcd00efced21b385/qa2-466-c3-TornarCartaoValido_4_.png){width=1160 height=58}![qa2-466-c3-TornarCartaoValido_5_](/uploads/8b2fb575f8280af02fdda3f2349a96b3/qa2-466-c3-TornarCartaoValido_5_.png){width=1437 height=741} | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se, ao invalidar um cartão de crédito, só é possível prosseguir após informar o motivo da invalidação e se, ao informar, esse motivo é registrado nos logs e armazenado no banco de dados.
Verify that when invalidating a credit card, you can proceed only after providing the invalidation reason, and that once provided, this reason is logged and persisted in the database.

Verificar se, ao alterar o motivo de invalidação, o novo motivo aparece corretamente nos logs e é gravado no banco de dados.
Verify that when updating the invalidation reason, the new reason is correctly recorded in the logs and saved to the database.

Verificar se, ao tornar o cartão válido novamente, o campo de motivo de invalidação não é exibido, a ação é registrada nos logs e a flag is_valid = true é armazenada no banco de dados.
Verify that when revalidating the card, the invalidation reason field is not shown, the action is logged, and the is_valid = true flag is stored in the database.



Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206336 | Progress Mobility | Verify that when invalidating a credit card, you can proceed only after providing the invalidation reason, and that once provided, this reason is logged and persisted in the database. |  | PASS |
| 206336 | Progress Mobility | Verify that when updating the invalidation reason, the new reason is correctly recorded in the logs and saved to the database. |  | PASS |
| 206336 | Progress Mobility | Verify that when revalidating the card, the invalidation reason field is not shown, the action is logged, and the is_valid = true flag is stored in the database. |  | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------