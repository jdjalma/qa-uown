--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1163


UOWN | Origination | Add a "Cancel Lease Button" in the Yellow Summary Bar


Synopsis
Implement a Cancel Lease action in Origination and apply the same Refund Payments decision logic in Servicing.
The feature must allow the user to explicitly choose whether previously captured payments should be refunded when a lease is cancelled or modified.

ORIGINATION AND SERVICING


Business Objective
Today, when a lease is cancelled or modified, the system automatically decides whether payments should be refunded — creating confusion, inconsistencies and potential financial errors.
Business needs explicit control in both Origination (during Funding stage) and Servicing (for active accounts) to decide whether the customer’s payments must be refunded when a lease is cancelled.
This feature adds clarity, prevents unwanted refunds, and ensures compliance with operational and financial rules.


Feature Request | Business Requirements

Add a new button: Cancel Lease
    Available when the lead is in Funding or eligible status.
When the user clicks Cancel Lease, open a modal containing:
    1. Mandatory Comment Field
        Required to explain why the lease is being cancelled.
    2. Refund Payments? (checkbox)
        Default: unchecked
        Text: “Refund all payments captured for this application?”
After saving:
    System sends the flag to the backend.
    Backend performs cancellation following the selected optio

![alt text](image.png)


Testing Steps

Overview
The Cancel Lease button allows users to cancel all items in a lease when the lease status is Signed, Funding, or Funded. This action triggers the same backend flow as manually deleting all items. Users can optionally choose to refund all payments captured for the application when cancelling the lease.


Prerequisites
A lease with status: SIGNED, FUNDING, or FUNDED
The lease must have at least one item

Test Cases

1. Button Visibility
Steps:
1. Navigate to the lease page
2. Check the main header (customer summary section)
Expected:
Cancel Lease button appears in the header when lease status is SIGNED, FUNDING, or FUNDED
Button does NOT appear for other statuses (e.g., UW_APPROVED, CONTRACT_CREATED)
![alt text](image-1.png)

2. Confirmation Modal
Steps:
1. Click the "Cancel Lease" button
2. Review the confirmation modal
Expected:
    Modal appears with title: "Please confirm you want to cancel the lease:"
    Warning message displays: "CAUTION: By clicking CANCEL LEASE, you will cancel all items in this lease. This action cannot be undone."
    Comment input: Confirm the it's present and required.
    Checkbox option: "Refund all payments captured for this application"
    Primary button: "Cancel Lease"
    Secondary button: "Cancel" (closes modal)
![alt text](image-2.png)

3. Successful Cancellation Without Refund
Steps:
1. Click "Cancel Lease" button
2. Leave the "Refund all payments captured for this application" checkbox unchecked
3. Click "Cancel Lease" in the confirmation modal
Expected:
    Success toast: "Lease cancelled successfully."
    All items are set to CANCELLED status
    Lead status updates to INVOICE_CANCELLED
    Activity log refreshes
    Modal closes automatically
    refundPaymentsOnCancel is set to false in the backend request

4. Successful Cancellation With Refund
Steps:
1. Click "Cancel Lease" button
2. Check the "Refund all payments captured for this application" checkbox
3. Click "Cancel Lease" in the confirmation modal
Expected:
Success toast: "Lease cancelled successfully."
All items are set to CANCELLED status
Lead status updates to INVOICE_CANCELLED
Activity log refreshes
Modal closes automatically
refundPaymentsOnCancel is set to true in the backend request
Backend processes payment refunds

5. Error Handling - Account Time Restriction
Steps:
1. Use a lease where the account activation date is more than 80 days ago
2. Click "Cancel Lease" and confirm (with or without refund checkbox)

Expected:
    Error toast displays: "Cannot modify lease after 80 days from account activation date"
    Modal closes
    Lease remains unchanged
    No API call is made (or API call fails with error)

6. Error Handling - Inactive Account
Steps:
1. Use a lease with an inactive account status
2. Click "Cancel Lease" and confirm (with or without refund checkbox)
Expected:
Error toast displays: "Cannot modify lease with inactive account"
Modal closes
Lease remains unchanged

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# **UOWN | Origination | Adicionar Botão "Cancelar Contrato" na Barra Amarela de Resumo**

## **📌 Sinopse**

Implemente uma ação de Cancelar Contrato no sistema de Originação e aplique a mesma lógica de decisão de Reembolso de Pagamentos no Servicing.
Essa funcionalidade deve permitir que o usuário escolha explicitamente se os pagamentos previamente capturados devem ser reembolsados quando um contrato for cancelado ou modificado.

**Aplicável em**: **ORIGINAÇÃO** e **SERVICING**

## **🎯 Objetivo de Negócio**

Atualmente, quando um contrato é cancelado ou modificado, o sistema decide automaticamente se os pagamentos devem ser reembolsados, criando confusão, inconsistências e possíveis erros financeiros.
A necessidade do negócio é ter um controle explícito, tanto em Originação (na fase de Funding) quanto no Servicing (para contas ativas), sobre a decisão de reembolso de pagamentos no caso de cancelamento de contrato.
Essa funcionalidade traz mais clareza, previne reembolsos indesejados e garante conformidade com as regras operacionais e financeiras.

## **📌 Requisito da Funcionalidade**

Adicionar um novo botão: **Cancelar Contrato**

* O botão deve estar disponível quando o lead estiver nos status **Funding** ou **Eligible**.

Ao clicar em **Cancelar Contrato**, deve ser exibida uma modal com os seguintes campos:

1. **Campo de Comentário** (obrigatório)

   * O campo deve ser preenchido para justificar o cancelamento do contrato.
2. **Reembolsar Pagamentos?** (checkbox)

   * Padrão: desmarcado
   * Texto: “Reembolsar todos os pagamentos capturados para esta aplicação?”

Após salvar:
* O sistema envia a flag para o backend.
* O backend realiza o cancelamento de acordo com a opção selecionada.

![alt text](image.png)

---

## **🧪 Etapas de Teste**

**Visão Geral**
O botão "Cancelar Contrato" permite aos usuários cancelar todos os itens de um contrato quando o status do contrato é **Signed**, **Funding**, ou **Funded**. Essa ação aciona o mesmo fluxo do backend que a exclusão manual de todos os itens. Os usuários podem, opcionalmente, escolher reembolsar todos os pagamentos capturados ao cancelar o contrato.

### **Pré-requisitos**
* Um contrato com status: **SIGNED**, **FUNDING**, ou **FUNDED**
* O contrato deve ter pelo menos um item.

### **Casos de Teste**

**1. Visibilidade do Botão**

* **Passos**:
  1. Navegar até a página do contrato.
  2. Verificar o cabeçalho principal (seção de resumo do cliente).
* **Esperado**:
  O botão **Cancelar Contrato** aparece no cabeçalho quando o status do contrato é **SIGNED**, **FUNDING**, ou **FUNDED**.
  O botão NÃO aparece para outros status (ex: **UW_APPROVED**, **CONTRACT_CREATED**).

![alt text](image-1.png)

**2. Modal de Confirmação**

* **Passos**:
  1. Clicar no botão **Cancelar Contrato**.
  2. Verificar a modal de confirmação.
* **Esperado**:
  * A modal aparece com o título: "Por favor, confirme que deseja cancelar o contrato:"
  * Mensagem de aviso: "CUIDADO: Ao clicar em CANCELAR CONTRATO, você cancelará todos os itens deste contrato. Esta ação não pode ser desfeita."
  * Campo de comentário: Confirmar que está presente e é obrigatório.
  * Opção de checkbox: "Reembolsar todos os pagamentos capturados para esta aplicação"
  * Botão primário: "Cancelar Contrato"
  * Botão secundário: "Cancelar" (fecha a modal)

![alt text](image-2.png)

**3. Cancelamento com Sucesso Sem Reembolso**

* **Passos**:
  1. Clicar no botão **Cancelar Contrato**.
  2. Deixar a caixa de "Reembolsar todos os pagamentos capturados para esta aplicação" desmarcada.
  3. Clicar em "Cancelar Contrato" na modal de confirmação.
* **Esperado**:
  * Toast de sucesso: "Contrato cancelado com sucesso."
  * Todos os itens são definidos como status **CANCELLED**.
  * O status do lead é atualizado para **INVOICE_CANCELLED**.
  * O log de atividade é atualizado.
  * A modal fecha automaticamente.
  * O campo **refundPaymentsOnCancel** é definido como **false** na requisição do backend.

**4. Cancelamento com Sucesso Com Reembolso**

* **Passos**:
  1. Clicar no botão **Cancelar Contrato**.
  2. Marcar a caixa "Reembolsar todos os pagamentos capturados para esta aplicação".
  3. Clicar em "Cancelar Contrato" na modal de confirmação.
* **Esperado**:
  * Toast de sucesso: "Contrato cancelado com sucesso."
  * Todos os itens são definidos como status **CANCELLED**.
  * O status do lead é atualizado para **INVOICE_CANCELLED**.
  * O log de atividade é atualizado.
  * A modal fecha automaticamente.
  * O campo **refundPaymentsOnCancel** é definido como **true** na requisição do backend.
  * O backend processa o reembolso dos pagamentos.

**5. Tratamento de Erro - Restrição de Tempo de Conta**

* **Passos**:
  1. Usar um contrato onde a data de ativação da conta seja superior a 80 dias.
  2. Clicar em **Cancelar Contrato** e confirmar (com ou sem caixa de reembolso marcada).
* **Esperado**:
  * Toast de erro: "Não é possível modificar o contrato após 80 dias da data de ativação da conta."
  * A modal fecha.
  * O contrato permanece inalterado.
  * Nenhuma chamada à API é feita (ou a chamada à API falha com erro).

**6. Tratamento de Erro - Conta Inativa**

* **Passos**:
  1. Usar um contrato com status de conta inativa.
  2. Clicar em **Cancelar Contrato** e confirmar (com ou sem caixa de reembolso marcada).
* **Esperado**:
  * Toast de erro: "Não é possível modificar o contrato com conta inativa."
  * A modal fecha.
  * O contrato permanece inalterado.

---

 5 arquivos
+
216
−
1
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

cancel-lease-co
‎nfirmation-modal‎

index.mo
‎dule.scss‎
+40 -0

inde
‎x.tsx‎
+86 -0

customer
‎-summary‎

inde
‎x.tsx‎
+86 -1

layout
‎s/auth‎

inde
‎x.tsx‎
+2 -0

mod
‎els‎

invoice-resp
‎onse-type.ts‎
+2 -0

 components/cancel-lease-confirmation-modal/index.module.scss  0 → 100644
+
40
−
0

Visualizado
.confirmationModal {
  font-family: var(--regular-font);

  span {
    font-family: var(--bold-font) !important;
  }

  &__header {
    font-family: var(--bold-font);
    font-size: 20px;
    font-weight: 500;
    line-height: 1.42;
    text-align: left;
    color: var(--primary-font);
  }

  &__saveButton {
    background: var(--primary);
    color: var(--white);
    font-size: 14px;
    width: 120px;
    height: 45px;
    border: 0;
  }

  &__cancelButton {
    background: var(--default-page-background-color);
    color: var(--black);
    font-size: 14px;
    width: 120px;
    height: 45px;
    border: 0;
  }
}

.cancelLeaseModal__checkbox {
  font-family: var(--regular-font);
  margin-left: 8px;
}
 components/cancel-lease-confirmation-modal/index.tsx  0 → 100644
+
86
−
0

Visualizado
import React from 'react';
import {Form} from 'reactstrap';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {InputField, Modal} from '@uownleasing/common-ui';
import styles from './index.module.scss';

interface CancelLeaseConfirmationModalProps {
  displayCancelLeaseConfirmationModal: boolean;
  setDisplayCancelLeaseConfirmationModal: (boolean) => void;
  handleCancelLease?: (refundAllPayments: boolean, comment: string) => void;
}

const CancelLeaseConfirmationModal = (
  props: CancelLeaseConfirmationModalProps,
) => {
  const {
    displayCancelLeaseConfirmationModal,
    setDisplayCancelLeaseConfirmationModal,
    handleCancelLease,
  } = props;

  const initialValues = {
    refundAllPayments: false,
    comment: '',
  };

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: Yup.object({
      comment: Yup.string()
        .trim()
        .required('Comment is required.'),
      refundAllPayments: Yup.boolean().optional(),
    }),
    onSubmit: async (values) => {
      const {refundAllPayments, comment} = values;
      await handleCancelLease?.(refundAllPayments, comment);
      setDisplayCancelLeaseConfirmationModal(false);
      formik?.resetForm();
    },
  });

  return (
    <Modal
      isOpen={displayCancelLeaseConfirmationModal}
      setIsOpen={setDisplayCancelLeaseConfirmationModal}
      title="Please confirm you want to cancel the lease:"
      onPrimaryButtonSubmit={formik?.handleSubmit}
      primaryButtonText="Cancel Lease"
      isPrimaryButtonDisabled={!formik.isValid}
      hasFooter>
      <Form id="cancelLeaseForm" onSubmit={formik.handleSubmit}>
        <div className={styles?.confirmationModal}>
          <span>CAUTION:</span> By clicking <span>CANCEL LEASE</span>, you will
          cancel all items in this lease.
          This action cannot be undone.
        </div>

        <div className="d-flex align-items-center mt-2">
          <InputField
            formik={formik}
            name="refundAllPayments"
            type="checkbox"
            isModifiedCheckbox
          />
          <div className={styles?.cancelLeaseModal__checkbox}>
            Refund all payments captured for this application
          </div>
        </div>

        <InputField
          formik={formik}
          name="comment"
          type="text"
          placeholder="Enter Comment"
          label="Comment:"
          isLabelBold={true}
        />
      </Form>
    </Modal>
  );
};

export default CancelLeaseConfirmationModal;
 components/customer-summary/index.tsx 
+
86
−
1

Visualizado
@@ -14,13 +14,14 @@ import ResendESignModal from 'components/resend-esign-modal';
import {Collapse} from '@components/collapse';
import AddCommentModal from '../add-comment-modal';
import ModifyLeaseConfirmationModal from '../modify-lease-confirmation-modal';
import CancelLeaseConfirmationModal from '../cancel-lease-confirmation-modal';
import styles from './index.module.scss';
import {CustomerStatus} from '@enums/CustomerStatus';
import ExpiredToApprovedModal, {
  ExpiredToApprovedRequest,
} from '@components/modals/expired-to-approved';
import {ResponseType} from '@uownleasing/common-ui';
import {ChangeLeadStatusRequest, Permissions} from '@models';
import {ChangeLeadStatusRequest, Permissions, GetInvoiceInfoResponseType, Item} from '@models';
import ConfirmationModal from '@components/modals/confirmation-modal';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretLeft, faCaretRight} from '@fortawesome/pro-light-svg-icons';
@@ -75,6 +76,11 @@ interface CustomerSummaryProps {
  checkRemainingApprovalAmount: (leadPk: number) => Promise<ResponseType>;
  sendTrustPilotInvitation: (leadPk: number) => Promise<ResponseType>;
  blacklistAllItemsForLead: (leadPk: number) => Promise<ResponseType>;
  createOrUpdateInvoiceInfo: (
    createOrUpdateInvoiceInfoRequest: GetInvoiceInfoResponseType,
    isCreateInvoice: boolean,
  ) => Promise<ResponseType>;
  invoiceInfo: GetInvoiceInfoResponseType;
}

const CustomerSummary = (props: CustomerSummaryProps) => {
@@ -117,6 +123,8 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
    checkRemainingApprovalAmount,
    sendTrustPilotInvitation,
    blacklistAllItemsForLead,
    createOrUpdateInvoiceInfo,
    invoiceInfo,
  } = props;

  const [isMovedToServicingDisabled, setIsMovedToServicingDisabled] =
@@ -152,6 +160,10 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
    displayModifyLeaseConfirmationModal,
    setDisplayModifyLeaseConfirmationModal,
  ] = useState(false);
  const [
    displayCancelLeaseConfirmationModal,
    setDisplayCancelLeaseConfirmationModal,
  ] = useState(false);

  const isMoveToServicingShown =
    status &&
@@ -372,6 +384,57 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
    }
  };

  const handleCancelLease = async (
    refundAllPayments: boolean = false,
    comment: string = '',
  ) => {
    if (invoiceInfo?.items?.length) {
      const cancelledItems = invoiceInfo.items.map((item: Item) => {
        const updatedItem = {...item};
        if (updatedItem.itemInfo) {
          updatedItem.itemInfo = {
            ...updatedItem.itemInfo,
            status: 'CANCELLED',
          };
        }
        return updatedItem;
      });

      const createOrUpdateInvoiceInfoRequest: GetInvoiceInfoResponseType = {
        invoiceInfo: invoiceInfo.invoiceInfo,
        merchantInfo: invoiceInfo.merchantInfo,
        items: cancelledItems,
        refundPaymentsOnCancel: refundAllPayments,
        comment: comment,
      };

      const response = await createOrUpdateInvoiceInfo(
        createOrUpdateInvoiceInfoRequest,
        false,
      );

      const errorMessage = response?.message;

      if (response?.status === 200 && !errorMessage) {
        showToast('success', 'Lease cancelled successfully.');
        setReloadActivityLog(true);
        setDisplayCancelLeaseConfirmationModal(false);
      } else {
        showToast(
          'error',
          errorMessage || 'An error occurred while cancelling the lease.',
        );
        setDisplayCancelLeaseConfirmationModal(false);
      }
    } else {
      showToast('error', 'No items found to cancel.');
      setDisplayCancelLeaseConfirmationModal(false);
    }
  };

  const isCancelLeaseButtonShown =
    status === 'SIGNED' || status === 'FUNDING' || status === 'FUNDED';

  return (
    <div
      id="customer-summary"
@@ -711,6 +774,16 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
                  </Button>
                </div>
              )}

              {isCancelLeaseButtonShown && invoiceInfo && (
                <div id="btn" className="mx-2 d-flex flex-row">
                  <Button
                    className={styles?.customerSummary__primaryButton}
                    onClick={() => setDisplayCancelLeaseConfirmationModal(true)}>
                    Cancel Lease
                  </Button>
                </div>
              )}
            </div>
          </Collapse>
        </div>
@@ -775,6 +848,18 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
          handleSubmit={handleSubmit}
        />
      )}

      {displayCancelLeaseConfirmationModal && (
        <CancelLeaseConfirmationModal
          displayCancelLeaseConfirmationModal={
            displayCancelLeaseConfirmationModal
          }
          setDisplayCancelLeaseConfirmationModal={
            setDisplayCancelLeaseConfirmationModal
          }
          handleCancelLease={handleCancelLease}
        />
      )}
    </div>
  );
};
 layouts/auth/index.tsx 
+
2
−
0

Visualizado
@@ -278,6 +278,8 @@ const AuthWrapper = (props: AuthWrapperProps) => {
            }
            sendTrustPilotInvitation={customerStore?.sendTrustpilotInvitation}
            blacklistAllItemsForLead={customerStore?.blacklistAllItemsForLead}
            createOrUpdateInvoiceInfo={customerStore?.createOrUpdateInvoiceInfo}
            invoiceInfo={customerStore?.invoiceInfo}
          />
          {isAlertsSummaryShown && (
            <AlertBlock
 models/invoice-response-type.ts 
+
2
−
0

Visualizado
@@ -8,4 +8,6 @@ export class GetInvoiceInfoResponseType {
  invoiceInfo: InvoiceInfo;
  items: Item[];
  fundingBankData?: FundingBankData;
  refundPaymentsOnCancel?: boolean;
  comment?: string;
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Cenários de Teste - Cancelar Contrato (Cancel Lease)

## Visibilidade do Botão

- O botão "Cancel Lease" deve estar visível no cabeçalho de resumo do cliente quando o status do contrato for SIGNED, FUNDING ou FUNDED
- O botão "Cancel Lease" não deve estar visível quando o status do contrato for diferente de SIGNED, FUNDING ou FUNDED
- O botão "Cancel Lease" não deve estar visível quando não houver informações de invoice carregadas

## Modal de Confirmação

- Ao clicar no botão "Cancel Lease", a modal de confirmação deve ser exibida com título, mensagem de aviso sobre cancelamento irreversível, campo de comentário obrigatório e checkbox de reembolso
- O checkbox "Refund all payments captured for this application" deve estar desmarcado por padrão
- Ao clicar no botão "Cancel" da modal, a modal deve ser fechada sem executar cancelamento

## Validação do Formulário

- Ao tentar cancelar o lease sem a inserção de comentário é exibido mensagem informando da obrigatoriedade de preenchimento do comentário

## Cancelamento com Sucesso

- Ao confirmar cancelamento, o sistema deve enviar refundPaymentsOnCancel como true quando checkbox marcado ou false quando desmarcado
- Ao confirmar cancelamento com sucesso, todos os itens devem ter status CANCELLED, o lead deve atualizar para INVOICE_CANCELLED, exibir toast de sucesso, atualizar log de atividade e fechar a modal
- O comentário informado deve ser enviado na requisição ao backend
- Quando refundPaymentsOnCancel for true, o backend deve processar o reembolso dos pagamentos

## Tratamento de Erros

- Ao tentar cancelar contrato com data de ativação superior a 80 dias, deve exibir erro específico, fechar modal e manter contrato inalterado
- Ao tentar cancelar contrato com conta inativa, deve exibir erro específico, fechar modal e manter contrato inalterado
- Ao tentar cancelar contrato sem itens, deve exibir erro "No items found to cancel."
- Quando a API retornar erro, o sistema deve exibir a mensagem retornada ou mensagem genérica de erro

## Comportamento do Formulário

- Ao submeter o formulário com sucesso, os campos devem ser resetados para valores iniciais (checkbox desmarcado e comentário vazio)

## Integração com Backend

- A requisição de cancelamento deve incluir invoiceInfo, merchantInfo, itens com status CANCELLED, refundPaymentsOnCancel e comment
- A requisição deve utilizar o método createOrUpdateInvoiceInfo com flag isCreateInvoice como false


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2


### Button Visibility

![Screenshot_at_Nov_28_08-20-06](/uploads/059f0099b3285d8e7846543052595623/Screenshot_at_Nov_28_08-20-06.png){width=900 height=94}
![Screenshot_at_Nov_28_08-20-42](/uploads/f40104268ef52f745e1c866d75507765/Screenshot_at_Nov_28_08-20-42.png){width=900 height=97}
![Screenshot_at_Nov_28_08-20-55](/uploads/cbb5fbee03ebd63a29b77579efc732f4/Screenshot_at_Nov_28_08-20-55.png){width=900 height=95}
![Screenshot_at_Nov_28_08-23-05](/uploads/d94cae2d55c25f194ba747f37a918976/Screenshot_at_Nov_28_08-23-05.png){width=900 height=93}
![Screenshot_at_Nov_28_08-23-36](/uploads/204221975ab477cc6b30db95b71fc843/Screenshot_at_Nov_28_08-23-36.png){width=900 height=94}
![Screenshot_at_Nov_28_08-24-02](/uploads/3815d37f9881987f0c67e94eaae8769d/Screenshot_at_Nov_28_08-24-02.png){width=900 height=95}
![Screenshot_at_Nov_28_08-24-53](/uploads/0e3d95396ee9d5c8e3073fb124fab69c/Screenshot_at_Nov_28_08-24-53.png){width=900 height=96}![Screenshot_at_Nov_28_08-25-27](/uploads/89a1d32a48f56f8474ae2390e339c138/Screenshot_at_Nov_28_08-25-27.png){width=900 height=94}
![Screenshot_at_Nov_28_08-26-00](/uploads/d2f90aae0c3e82c7bb2ac173825cd886/Screenshot_at_Nov_28_08-26-00.png){width=900 height=94}
![Screenshot_at_Nov_28_08-26-50](/uploads/24361303f72e9688b8b5956308e67201/Screenshot_at_Nov_28_08-26-50.png){width=900 height=93}
![Screenshot_at_Nov_28_08-27-55](/uploads/250ff36c4b8199349f327aff5ff396e2/Screenshot_at_Nov_28_08-27-55.png){width=900 height=93}

### Confirmation Modal
![Screenshot_at_Nov_28_09-05-23](/uploads/0c49597948f6452fef9e366b07ab31cc/Screenshot_at_Nov_28_09-05-23.png){width=900 height=208}
![Screenshot_at_Nov_28_09-10-12](/uploads/cdc0ac2b2eceb724b79539b35c335e24/Screenshot_at_Nov_28_09-10-12.png){width=751 height=360}
![Screenshot_at_Nov_28_09-10-23](/uploads/826f974367c2a8d99e6ea31c67ff7452/Screenshot_at_Nov_28_09-10-23.png){width=751 height=330}
![Screenshot_at_Nov_28_09-10-32](/uploads/15290c4625476573672cea4dbcfa599d/Screenshot_at_Nov_28_09-10-32.png){width=751 height=361}

### Successful Cancellation Without Refund
![Screenshot_at_Dec_10_22-43-18](/uploads/c9c3205930f0e972588fb1158100d48c/Screenshot_at_Dec_10_22-43-18.png){width=900 height=241}
![Screenshot_at_Dec_10_22-43-30](/uploads/e68d1e983de9b8295362e65b158339b6/Screenshot_at_Dec_10_22-43-30.png){width=900 height=245}
![Screenshot_at_Dec_10_22-43-44](/uploads/16284c04c8bdbcaf9630060798ea6f19/Screenshot_at_Dec_10_22-43-44.png){width=900 height=243}
![Screenshot_at_Dec_10_22-44-07](/uploads/91da466dbd8ab0836ca034df9c62b2f3/Screenshot_at_Dec_10_22-44-07.png){width=900 height=324}
![Screenshot_at_Dec_10_22-45-24](/uploads/0652f73c86b8945dd39a1ca56d31873d/Screenshot_at_Dec_10_22-45-24.png){width=900 height=273}
![Screenshot_at_Dec_10_22-48-03](/uploads/35acdceefc6bab810afbdf87095605f3/Screenshot_at_Dec_10_22-48-03.png){width=900 height=447}
![Screenshot_at_Dec_10_22-53-25](/uploads/fabe1c955ae5b9f88faba3cc2fa015b7/Screenshot_at_Dec_10_22-53-25.png){width=900 height=297}
![Screenshot_at_Dec_10_22-55-52](/uploads/cbf57140a966e2047c20360d722a3711/Screenshot_at_Dec_10_22-55-52.png){width=900 height=291}
![Screenshot_at_Dec_10_23-00-33](/uploads/d74ff756bded4de772fa340e74c263f6/Screenshot_at_Dec_10_23-00-33.png){width=900 height=238}
![Screenshot_at_Dec_10_23-00-40](/uploads/b15f68be250ab1a66c6900e0ba9846f4/Screenshot_at_Dec_10_23-00-40.png){width=900 height=239}
![Screenshot_at_Dec_10_23-00-48](/uploads/2035ec34260af2ffaebce6b8114e769a/Screenshot_at_Dec_10_23-00-48.png){width=900 height=239}

### Successful Cancellation With Refund
![Screenshot_at_Nov_28_14-17-51](/uploads/c4e6c896381b43b632d28f14caed079e/Screenshot_at_Nov_28_14-17-51.png){width=900 height=329}
![Screenshot_at_Nov_28_14-50-30](/uploads/3b1f200c4afca2a28ac6c847ff896f25/Screenshot_at_Nov_28_14-50-30.png){width=700 height=377}
![Screenshot_at_Nov_28_14-53-22](/uploads/2367ab8e8dad1d986e59ab1c9f0ca8cb/Screenshot_at_Nov_28_14-53-22.png){width=900 height=179}
![Screenshot_at_Nov_28_14-53-41](/uploads/49dd22c04534ce6245c0f2a68de4155a/Screenshot_at_Nov_28_14-53-41.png){width=900 height=177}
![Screenshot_at_Nov_28_15-08-24](/uploads/37d69a899c13b3e9c91a61c2ce88a0f7/Screenshot_at_Nov_28_15-08-24.png){width=802 height=600}
![Screenshot_at_Nov_28_15-10-38](/uploads/cf2a637acabb620659c728463326e8a9/Screenshot_at_Nov_28_15-10-38.png){width=900 height=164}
![Screenshot_at_Nov_28_15-11-07](/uploads/6e30534a0966af90066331323b72e159/Screenshot_at_Nov_28_15-11-07.png){width=900 height=157}
![Screenshot_at_Nov_28_15-11-18](/uploads/efc5f3e055fe3b4983b3a1e88f3910ab/Screenshot_at_Nov_28_15-11-18.png){width=900 height=196}
![Screenshot_at_Nov_28_15-11-31](/uploads/1eca62b7b20d557d9a1670f04c0fa246/Screenshot_at_Nov_28_15-11-31.png){width=900 height=220}
![Screenshot_at_Nov_28_15-44-57](/uploads/81caacf9bc7012f8ded8bd011c033586/Screenshot_at_Nov_28_15-44-57.png){width=900 height=82}
![Screenshot_at_Nov_28_15-45-09](/uploads/7566f019265bace8ab36334e4e1849d5/Screenshot_at_Nov_28_15-45-09.png){width=900 height=84}![Screenshot_at_Nov_28_15-45-23](/uploads/1295b99ae27b93ad599a281054a13d35/Screenshot_at_Nov_28_15-45-23.png){width=787 height=101}
![Screenshot_at_Nov_28_15-46-03](/uploads/e92ca40e40b7e73116343beb40952a9a/Screenshot_at_Nov_28_15-46-03.png){width=900 height=36}
![Screenshot_at_Nov_28_15-46-15](/uploads/9ceff0dd10e50e23c2d9d66d39a9cf1a/Screenshot_at_Nov_28_15-46-15.png){width=748 height=327}
![Screenshot_at_Nov_28_15-48-01](/uploads/6ffe2865707895dd961587cf5c0a5a29/Screenshot_at_Nov_28_15-48-01.png){width=900 height=501}
![Screenshot_at_Nov_28_15-49-33](/uploads/173837cbeb46682cdfdb64351df80964/Screenshot_at_Nov_28_15-49-33.png){width=808 height=600}
![Screenshot_at_Nov_28_15-50-40](/uploads/a641115797850eb97e06a0e2f0525c8c/Screenshot_at_Nov_28_15-50-40.png){width=900 height=152}
![Screenshot_at_Nov_28_15-50-49](/uploads/f16ef58583b0b845edb014c032f00d7f/Screenshot_at_Nov_28_15-50-49.png){width=900 height=107}
![Screenshot_at_Nov_28_15-50-59](/uploads/b35aafd75fcb11f96c103b1bc3e60069/Screenshot_at_Nov_28_15-50-59.png){width=900 height=120}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cancelar direto pela conta mudando o status para cancelado com e sem reembolso.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG






**| PASS |**

---

### Button Visibility



**| PASS |**

---

### Confirmation Modal



**| PASS |**

---

### Successful Cancellation Without Refund



**| PASS |**

---

### Successful Cancellation With Refund



**| PASS |**

---

**Cancellation with a direct refund to the account.**



**| PASS |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg

***Visibilidade do botão Cancel Lease***

O sistema deve exibir o botão **Cancel Lease** na barra de resumo (Yellow Summary Bar) **apenas** quando o lease estiver em um dos seguintes status:

* SIGNED
* FUNDING
* FUNDED

![image](/uploads/78f8c70857bcdaa558df4c3990ebfbfe/image.png){width=900 height=102}
![image](/uploads/d62c8aebf72fb466e8699097e76ad8a1/image.png){width=900 height=105}
![image](/uploads/d2d0680fa0f9c90b2589f0bec18a625e/image.png){width=900 height=97}

---

***Ocultação do botão para status não elegíveis***

O sistema **não deve exibir** o botão **Cancel Lease** quando o lease estiver em qualquer outro status, incluindo (mas não limitado a):

* UW_APPROVED
* CONTRACT_CREATED
* Outros status fora de SIGNED / FUNDING / FUNDED

![image](/uploads/0aacd10a4f08b8da0323730409b4fc6d/image.png){width=900 height=100}
![image](/uploads/f8b5116f3c77ae2a9f88280fe21f14f2/image.png){width=900 height=105}
![image](/uploads/e0f33da38112a05be34a061035c75ebc/image.png){width=900 height=100}

---

***Abertura do modal de confirmação***

Ao clicar no botão **Cancel Lease**, o sistema deve abrir um **modal de confirmação**.

O modal de confirmação deve conter obrigatoriamente:

* Título: *“Please confirm you want to cancel the lease:”*
* Mensagem de alerta informando que a ação é irreversível
* Campo de comentário
* Checkbox de refund
* Botão primário **Cancel Lease**
* Botão secundário **Cancel**

![image](/uploads/ead17e5593c1ac09f781c55a6ae9a85c/image.png){width=752 height=366}

---

***Comentário obrigatório***

O campo **Comment** deve ser **obrigatório**.
O sistema deve impedir a submissão do cancelamento caso o comentário não seja preenchido.

![image](/uploads/ead17e5593c1ac09f781c55a6ae9a85c/image.png){width=752 height=366}

---

***Checkbox “Refund Payments?” (estado padrão)***

O checkbox **“Refund all payments captured for this application?”** deve:

* Estar presente no modal
* Estar **desmarcado por padrão**

![image](/uploads/82faf478b012bd868577a896d3594ce3/image.png){width=746 height=332}

---

***Cancelamento sem refund***

Quando o usuário cancelar o lease **sem marcar** o checkbox de refund:

* O sistema deve cancelar o lease com sucesso
* Todos os itens do lease devem ser atualizados para status **CANCELLED**
* O status do lead deve ser atualizado para **INVOICE_CANCELLED**
* O activity log deve ser atualizado
* O modal deve ser fechado automaticamente
* O backend deve receber o flag `refundPaymentsOnCancel = false`



---

***Cancelamento com refund***

Quando o usuário cancelar o lease **com o checkbox de refund marcado**:

* O sistema deve cancelar o lease com sucesso
* Todos os itens do lease devem ser atualizados para status **CANCELLED**
* O status do lead deve ser atualizado para **INVOICE_CANCELLED**
* O activity log deve ser atualizado
* O modal deve ser fechado automaticamente
* O backend deve receber o flag `refundPaymentsOnCancel = true`

---

***Feedback visual de sucesso***

Após um cancelamento bem-sucedido (com ou sem refund), o sistema deve exibir um **toast de sucesso** informando que o lease foi cancelado com sucesso.

---

***Restrição de tempo (80 dias)***

O sistema deve **bloquear o cancelamento** do lease quando a data de ativação da conta for superior a **80 dias**, independentemente da opção de refund selecionada.

---

***Mensagem de erro para restrição de tempo***

Quando a regra dos 80 dias for violada:

* O sistema deve exibir a mensagem de erro:

  > “Cannot modify lease after 80 days from account activation date”
* O modal deve ser fechado
* O lease deve permanecer **inalterado**

---

***Restrição para conta inativa***

O sistema deve **bloquear o cancelamento** do lease quando a conta estiver com status **inativo**, independentemente da opção de refund selecionada.

---

***Mensagem de erro para conta inativa***

Quando a conta estiver inativa:

* O sistema deve exibir a mensagem de erro:

  > “Cannot modify lease with inactive account”
* O modal deve ser fechado
* O lease deve permanecer **inalterado**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




Below is the **English version**, keeping the same structure, intent, and QA-oriented wording, suitable for use directly in the ticket or test documentation.

---

### ***Cancel Lease Button Visibility***

The system must display the **Cancel Lease** button in the summary header (Yellow Summary Bar) **only** when the lease is in one of the following statuses.

---

### ***Button Hidden for Non-Eligible Statuses***

The system **must not display** the **Cancel Lease** button when the lease is in any other status, including (but not limited to):

* UW_APPROVED
* CONTRACT_CREATED
* Any status outside of SIGNED / FUNDING / FUNDED

---

### ***Confirmation Modal Opening***

When the user clicks the **Cancel Lease** button, the system must open a **confirmation modal**.

The confirmation modal must contain, at a minimum:

* Title: *“Please confirm you want to cancel the lease:”*
* Warning message indicating the action is irreversible
* Comment input field
* Refund checkbox
* Primary button **Cancel Lease**
* Secondary button **Cancel**

---

### ***Mandatory Comment***

The **Comment** field must be **mandatory**.
The system must prevent submission of the cancellation if the comment field is not filled in.

---

### ***“Refund Payments?” Checkbox (Default State)***

The **“Refund all payments captured for this application?”** checkbox must:

* Be present in the confirmation modal
* Be **unchecked by default**

---

### ***Cancellation Without Refund***

When the user cancels the lease **without checking** the refund checkbox:

* The system must successfully cancel the lease
* All lease items must be updated to **CANCELLED** status
* The lead status must be updated to **INVOICE_CANCELLED**
* The activity log must be updated
* The modal must close automatically
* The backend must receive the flag `refundPaymentsOnCancel = false`

---

### ***Cancellation With Refund***

When the user cancels the lease **with the refund checkbox checked**:

* The system must successfully cancel the lease
* All lease items must be updated to **CANCELLED** status
* The lead status must be updated to **INVOICE_CANCELLED**
* The activity log must be updated
* The modal must close automatically
* The backend must receive the flag `refundPaymentsOnCancel = true`
* The backend must initiate the **refund process for captured payments**

---

### ***Successful Visual Feedback***

After a successful cancellation (with or without refund), the system must display a **success toast** indicating that the lease was cancelled successfully.

---

### ***Time Restriction (80 Days)***

The system must **block lease cancellation** when the account activation date is greater than **80 days**, regardless of the refund option selected.

---

### ***Error Message for Time Restriction***

When the 80-day rule is violated:

* The system must display the error message:

  > “Cannot modify lease after 80 days from account activation date”

---

### ***Inactive Account Restriction***

The system must **block lease cancellation** when the account is in an **inactive** status, regardless of the refund option selected.

---

### ***Error Message for Inactive Account***

When the account is inactive:

* The system must display the error message:

  > “Cannot modify lease with inactive account”

---

If you want, I can also:

* Normalize this into **RF-numbered requirements**
* Convert it into **manual test cases (steps + expected results)**
* Adapt the language to match **UOWN QA standards exactly**
