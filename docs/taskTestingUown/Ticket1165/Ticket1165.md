-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1165


UOWN | Origination | Add "refundPayments" flag on "Move to Signed" and "Modify Lease"


Testing Steps

Overview
Send to Signed with Refund Payments: Added refund payments checkbox option when sending a lead to SIGNED status
Modify Lease - Cancel Lease Button: When modifying a lease and deleting all items, the Save button changes to "Cancel Lease" and opens the cancel lease confirmation modal

Test Cases - Send to Signed with Refund Payments
1. Refund Checkbox Visibility
Steps:
Navigate to a lead with status READY_TO_FUND, FUNDING, or FUNDED
Click "Send to Signed" button
Observe the comment modal
Expected:
Modal appears with title "Add a Comment"
Comment input field is present and required
Checkbox appears: "Refund all payments captured for this application"

2. Send to Signed Without Refund
Steps:
Click "Send to Signed" button
Leave the refund checkbox unchecked
Enter a comment
Click "Save"
Expected:
Success toast: "Successfully changed the lead status to signed."
Lead status changes to SIGNED
No payments are refunded
Activity log refreshes

3. Send to Signed With Refund
Steps:
Click "Send to Signed" button
Check the "Refund all payments captured for this application" checkbox
Enter a comment
Click "Save"
Expected:
Success toast: "Successfully changed the lead status to signed."
Lead status changes to SIGNED
Payments are refunded
Activity log refreshes

Test Cases - Modify Lease Cancel Lease Button
1. Button Text Changes When All Items Deleted
Steps:
Navigate to a lease with status SIGNED, FUNDING, or FUNDED
Click "Modify Lease" button
Click "Continue" in the warning modal
Delete all items
Expected:
Save button text changes to "Cancel Lease"
Button is still in the same position (left side of footer)

2. Cancel Lease Modal Opens
Steps:
2. Click the "Cancel Lease" button
Expected:
Cancel lease confirmation modal opens

3. Successful Cancellation Without Refund
Steps:
2. Leave refund checkbox unchecked
3. Enter a comment
4. Click "Cancel Lease" in the confirmation modal
Expected:
Success toast: "Lease cancelled successfully."
Both modals close (cancel lease modal AND customer lease modal)
All items are set to CANCELLED status
Lead status updates to INVOICE_CANCELLED
Activity log refreshes
No payments are refunded

4. Successful Cancellation With Refund
Steps:
2. Check the refund checkbox
3. Enter a comment
4. Click "Cancel Lease" in the confirmation modal
Expected:
Success toast: "Lease cancelled successfully."
Both modals close
All items are set to CANCELLED status
Lead status updates to INVOICE_CANCELLED
Payments are refunded
Activity log refreshes

5. Button Stays as "Save" When Items Remain
Steps:
Navigate to a lease with status SIGNED, FUNDING, or FUNDED
Click "Modify Lease" button
Click "Continue" in the warning modal
Delete some items but keep at least one item active
Expected:
Button text remains "Save" (does NOT change to "Cancel Lease")
Clicking "Save" saves the invoice normally
No cancel lease modal appears

6. Button Stays as "Save" for Unsigned Leases
Steps:
Navigate to a lease with status UW_APPROVED or CONTRACT_CREATED
Open the customer lease modal (via "Create Lease" or other method)
Delete all items
Expected:
Button text remains "Save" (does NOT change to "Cancel Lease")
This feature only works when modifying signed/funded leases via "Modify Lease" button

Notes
The "Cancel Lease" button in modify lease flow only appears when:
Lease is being modified (via "Modify Lease" button)
All items have been deleted (status = CANCELLED)
The refund checkbox in "Send to Signed" only appears when changing status to SIGNED
Both features require a comment before submission
The refund checkbox is optional in both features




-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 1 arquivo
+
18
−
4
 src/main/java/com/uownleasing/svc/service/application/SendInvoiceService.java 
+
18
−
4

Visualizado
@@ -16,6 +16,7 @@ import com.uownleasing.svc.pojo.LeadModificationsInfo;
import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.rest.CalculatorRequest;
import com.uownleasing.svc.pojo.rest.CalculatorResults;
import com.uownleasing.svc.pojo.rest.CancelAccountRequest;
import com.uownleasing.svc.pojo.rest.InvoiceInformation;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.cc.CCRunRefundService;
@@ -104,6 +105,8 @@ public class SendInvoiceService {

    private final CreateAndSendContractService sendContractService ;

    private final CancelAccountService cancelAccountService;

    protected String configurationPath = "com.uownleasing.svc.service.SendInvoiceService.";

    public AuthorizationResponse createInvoiceRequest(AuthorizationRequest authorizationRequest) {
@@ -464,10 +467,8 @@ public class SendInvoiceService {
            //cancel protection plan if exists
            cancelProtectionPlanService.cancelProtectionPlanAsync(losLead.getPk());
//            leadService.updateFundingTransaction(invoiceInformation);
            if(losLead.getLeadInfo().getAccountPk() != null && losLead.getLeadInfo().getAccountPk() > 0){
                losToSvcImportService.updateAccountFromLead(losLead, Boolean.FALSE);
                svAlertService.createOrUpdate(losLead.getLeadInfo().getAccountPk(), "Account has been cancelled due to Invoice cancellation on lead "+losLead.getPk());
            }
            cancelAccountIfExists(losLead, invoiceInformation.getComment(),
                Boolean.TRUE.equals(invoiceInformation.getRefundPaymentsOnCancel()));
        }
        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation]  End. LeadStatus : "+losLead.getLeadInfo().getLeadStatus());
        losLead = leadManagementService.createOrUpdateLead(losLead.getLeadInfo());
@@ -475,6 +476,19 @@ public class SendInvoiceService {
        return invoiceInformation;//getInvoiceInformation(invoiceInformation.getInvoiceInfo().getLeadPk());
    }

    private void cancelAccountIfExists(LosLead losLead, String comment, boolean refundPayments) {
        if(losLead.getLeadInfo().getAccountPk() != null && losLead.getLeadInfo().getAccountPk() > 0) {
            String finalComment = StringUtils.isNotBlank(comment)
                ? comment
                : "Invoice cancelled" + (refundPayments ? ", refunding payments per user request" : "");
            CancelAccountRequest cancelAccountRequest = new CancelAccountRequest(losLead, refundPayments, finalComment);
            cancelAccountService.cancelAccountForLead(cancelAccountRequest);

            svAlertService.createOrUpdate(losLead.getLeadInfo().getAccountPk(),
                "Account has been cancelled due to Invoice cancellation on lead " + losLead.getPk());
        }
    }

    private void validateUWStatus(LosLead lead) {
        if (configurationManagement.getBoolean(configurationPath + "validate.uw.for.invoice.information", true)) {
            lead.getLeadInfo().setNotes("[createOrUpdate InvoiceInformation][validateUWStatus]");

--


 7 arquivos
+
166
−
10
Arquivos
7
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

add-comm
‎ent-modal‎

inde
‎x.tsx‎
+27 -3

customer-i
‎nfo-panels‎

docume
‎nts.tsx‎
+13 -0

customer-l
‎ease-modal‎

inde
‎x.tsx‎
+32 -6

customer
‎-summary‎

inde
‎x.tsx‎
+10 -1

domain
‎/stores‎

custom
‎er.tsx‎
+37 -0

mod
‎els‎

change-lead-st
‎atus-request.ts‎
+1 -0

pages/c
‎ustomers‎

[leadP
‎k].tsx‎
+46 -0

 components/add-comment-modal/index.tsx 
+
27
−
3

Visualizado
@@ -18,6 +18,7 @@ interface AddCommentModalProps {
  title?: string;
  primaryButtonText?: string;
  checkboxTitle?: string;
  newStatus?: string;
}

const AddCommentModal = (props: AddCommentModalProps) => {
@@ -29,11 +30,15 @@ const AddCommentModal = (props: AddCommentModalProps) => {
    title,
    primaryButtonText,
    checkboxTitle,
    newStatus,
  } = props;

  const isSignedStatus = newStatus === 'SIGNED';

  const initialValues = {
    comment: '',
    isChecked: false,
    refundPaymentsIfExists: false,
  };

  const formik = useFormik({
@@ -41,10 +46,12 @@ const AddCommentModal = (props: AddCommentModalProps) => {
    validationSchema: Yup.object({
      comment: Yup.string().required('Comment is required.'),
      isChecked: Yup.boolean().optional(),
      refundPaymentsIfExists: Yup.boolean().optional(),
    }),
    onSubmit: async (values) => {
      const {comment, isChecked} = values;
      await handleSave({comment: comment}, isChecked);
      const {comment, isChecked, refundPaymentsIfExists} = values;
      const refundValue = isSignedStatus ? refundPaymentsIfExists : isChecked;
      await handleSave({comment: comment}, refundValue);
      setDisplayAddCommentModal(false);
      formik?.resetForm();
    },
@@ -71,7 +78,24 @@ const AddCommentModal = (props: AddCommentModalProps) => {
          label="Comment:"
        />

        {checkboxTitle && (
        {isSignedStatus && (
          <div className="d-flex mt-3">
            <InputField
              formik={formik}
              name="refundPaymentsIfExists"
              type="checkbox"
              isModifiedCheckbox
            />
            <div
              className={classNames(
                'd-flex justify-content-center align-items-center',
                styles?.commentModal__checkbox,
              )}>
              Refund all payments captured for this application
            </div>
          </div>
        )}
        {checkboxTitle && !isSignedStatus && (
          <div className="d-flex mt-3">
            <InputField
              formik={formik}
 components/customer-info-panels/documents.tsx 
+
13
−
0

Visualizado
@@ -42,6 +42,13 @@ interface DocumentsPanelProps {
  serverTimeOffset: number;
  isAddNewInvoice: boolean;
  loading: boolean;
  setDisplayCancelLeaseConfirmationModal?: (
    displayCancelLeaseConfirmationModal: boolean,
  ) => void;
  handleCancelLease?: (
    refundAllPayments: boolean,
    comment: string,
  ) => Promise<void>;
}

const DocumentsPanel = (props: DocumentsPanelProps) => {
@@ -59,6 +66,8 @@ const DocumentsPanel = (props: DocumentsPanelProps) => {
    serverTimeOffset,
    isAddNewInvoice,
    loading,
    setDisplayCancelLeaseConfirmationModal,
    handleCancelLease,
  } = props;

  const [
@@ -249,6 +258,10 @@ const DocumentsPanel = (props: DocumentsPanelProps) => {
          isAddNewInvoice={isAddNewInvoice}
          addNewInvoice={customerStore?.addNewLease}
          newInvoiceMaxAmount={newInvoiceMaxAmount}
          setDisplayCancelLeaseConfirmationModal={
            setDisplayCancelLeaseConfirmationModal
          }
          handleCancelLease={handleCancelLease}
        />
      )}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

# UOWN | Originação | Adicionar flag "refundPayments" em "Move to Signed" e "Modify Lease"

## Passos de Teste

### Visão Geral

* **Send to Signed com Refund Payments:** Adicionada a opção de checkbox para reembolsar pagamentos ao enviar um lead para o status SIGNED.
* **Modify Lease - Botão Cancel Lease:** Ao modificar um lease e deletar todos os itens, o botão Save muda para "Cancel Lease" e abre o modal de confirmação de cancelamento.

---

## Casos de Teste – Send to Signed com Refund Payments

### 1. Visibilidade do Checkbox de Reembolso

**Passos:**

1. Navegue até um lead com status READY_TO_FUND, FUNDING ou FUNDED.
2. Clique no botão “Send to Signed”.
3. Observe o modal de comentário.

**Esperado:**

* Modal aparece com o título **"Add a Comment"**.
* Campo de comentário presente e obrigatório.
* Checkbox exibido: **"Refund all payments captured for this application"**.

---

### 2. Send to Signed Sem Reembolso

**Passos:**

1. Clique em “Send to Signed”.
2. Deixe o checkbox de reembolso desmarcado.
3. Insira um comentário.
4. Clique em “Save”.

**Esperado:**

* Toast de sucesso: **"Successfully changed the lead status to signed."**
* Status do lead muda para **SIGNED**.
* Nenhum pagamento é reembolsado.
* Activity log é atualizado.

---

### 3. Send to Signed Com Reembolso

**Passos:**

1. Clique em “Send to Signed”.
2. Marque o checkbox **"Refund all payments captured for this application"**.
3. Insira um comentário.
4. Clique em “Save”.

**Esperado:**

* Toast de sucesso: **"Successfully changed the lead status to signed."**
* Status do lead muda para **SIGNED**.
* Pagamentos são reembolsados.
* Activity log é atualizado.

---

## Casos de Teste – Modify Lease (Botão Cancel Lease)

### 1. Texto do Botão Muda Quando Todos os Itens São Deletados

**Passos:**

1. Navegue até um lease com status SIGNED, FUNDING ou FUNDED.
2. Clique no botão **"Modify Lease"**.
3. Clique em “Continue” no modal de aviso.
4. Delete todos os itens.

**Esperado:**

* Texto do botão Save muda para **"Cancel Lease"**.
* Botão permanece na mesma posição (lado esquerdo do rodapé).

---

### 2. Modal de Cancelamento Abre

**Passos:**

1. Clique no botão **"Cancel Lease"**.

**Esperado:**

* Modal de confirmação de cancelamento do lease é exibido.

---

### 3. Cancelamento Bem-Sucedido Sem Reembolso

**Passos:**

1. Deixe o checkbox de reembolso desmarcado.
2. Insira um comentário.
3. Clique em **"Cancel Lease"** no modal de confirmação.

**Esperado:**

* Toast de sucesso: **"Lease cancelled successfully."**
* Ambos os modais se fecham (cancel lease modal + customer lease modal).
* Todos os itens são definidos como **CANCELLED**.
* Status do lead muda para **INVOICE_CANCELLED**.
* Activity log é atualizado.
* Nenhum pagamento é reembolsado.

---

### 4. Cancelamento Bem-Sucedido Com Reembolso

**Passos:**

1. Marque o checkbox de reembolso.
2. Insira um comentário.
3. Clique em **"Cancel Lease"** no modal de confirmação.

**Esperado:**

* Toast de sucesso: **"Lease cancelled successfully."**
* Ambos os modais se fecham.
* Todos os itens são definidos como **CANCELLED**.
* Status do lead muda para **INVOICE_CANCELLED**.
* Pagamentos são reembolsados.
* Activity log é atualizado.

---

### 5. Botão Permanece "Save" Quando Há Itens Restantes

**Passos:**

1. Navegue até um lease com status SIGNED, FUNDING ou FUNDED.
2. Clique em “Modify Lease”.
3. Clique em “Continue” no modal de aviso.
4. Delete alguns itens, mas mantenha pelo menos um ativo.

**Esperado:**

* Texto do botão permanece **"Save"** (não muda para "Cancel Lease").
* Ao clicar em "Save", o invoice é salvo normalmente.
* Modal de cancelamento **não** aparece.

---

### 6. Botão Permanece "Save" para Leases Não Assinados

**Passos:**

1. Navegue até um lease com status UW_APPROVED ou CONTRACT_CREATED.
2. Abra o customer lease modal (via “Create Lease” ou outro método).
3. Delete todos os itens.

**Esperado:**

* Texto do botão permanece **"Save"** (não vira "Cancel Lease").
* Esse recurso só funciona ao modificar leases assinados/funded via “Modify Lease”.

---

## Notas

* O botão **"Cancel Lease"** no fluxo de modify lease só aparece quando:

  * O lease está sendo modificado (via botão "Modify Lease")
  * Todos os itens foram deletados (status = CANCELLED)
* O checkbox de reembolso no “Send to Signed” só aparece ao mudar o status para **SIGNED**
* Ambos os recursos exigem comentário antes da submissão
* O checkbox de reembolso é opcional em ambos os fluxos

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

### **1. Exibição do checkbox de reembolso**
O modal “Add a Comment” deve ser exibido ao clicar em **Send to Signed** para leads nos status READY_TO_FUND, FUNDING ou FUNDED.
O modal deve conter um campo de comentário obrigatório.
O checkbox **"Refund all payments captured for this application"** deve aparecer **somente** quando o novo status for **SIGNED**.
O checkbox não deve aparecer para outros status.

### **2. Envio para Signed sem reembolso**
2.1 Se o checkbox não for marcado, o sistema deve enviar o lead para status **SIGNED** sem realizar reembolso.
2.2 Deve aparecer toast de sucesso: **"Successfully changed the lead status to signed."**
2.3 O activity log deve ser atualizado.
2.4 Nenhum pagamento deve ser reembolsado.

### **3.a Envio para Signed com reembolso**
3.1 Se o checkbox for marcado, o sistema deve enviar o lead par **SIGNED** com reembolso dos pagamentos.
3.2 Deve aparecer toast de sucesso: **"Successfully changed the lead status to signed."**
3.3 O activity log deve ser atualizado.
3.4 Pagamentos capturados devem ser reembolsados.
3.5 O backend deve enviar o parâmetro **refundPayments = true** no `handleSave`.

---

### **4. Alteração do botão Save → Cancel Lease**
4.1 Ao abrir Modify Lease para leases SIGNED, FUNDING ou FUNDED e deletar **todos** os itens, o botão Save deve mudar para **“Cancel Lease”**.
4.2 A posição do botão não deve mudar.
4.3 O botão **não** deve mudar se houver pelo menos um item ativo.
4.4 O botão **não** deve mudar para leases UW_APPROVED ou CONTRACT_CREATED.

### **5. Exibição do modal de cancelamento**
5.1 Ao clicar em **Cancel Lease**, o modal de confirmação de cancelamento deve ser exibido.
5.2 O modal deve conter campo obrigatório de comentário.
5.3 O modal deve conter checkbox opcional para **refund payments**.

### **6. Cancelamento sem reembolso**
6.1 Se o checkbox não for marcado, o lease deve ser cancelado sem refund.
6.2 Toast exibido: **"Lease cancelled successfully."**
6.3 Ambos os modais devem ser fechados.
6.4 Todos os itens devem ser marcados como **CANCELLED**.
6.5 Status do lead atualizado para **INVOICE_CANCELLED**.
6.6 Activity log deve ser atualizado.
6.7 Nenhum pagamento deve ser reembolsado.
6.8 Backend deve enviar **refundPayments = false** no `CancelAccountRequest`.

### **7. Cancelamento com reembolso**

7.1 Se o checkbox for marcado, o lease deve ser cancelado com refund.
7.2 Toast exibido: **"Lease cancelled successfully."**
7.3 Ambos os modais devem ser fechados.
7.4 Todos os itens devem ser marcados como **CANCELLED**.
7.5 Status do lead atualizado para **INVOICE_CANCELLED**.
7.6 Pagamentos devem ser reembolsados.
7.7 Activity log deve ser atualizado.
7.8 Backend deve enviar **refundPayments = true**.
7.9 O comentário enviado deve ser usado; caso vazio, o backend deve gerar:
*“Invoice cancelled, refunding payments per user request”*.

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2

---

### 1. Display of the Refund Checkbox
* The “Add a Comment” modal must be displayed when clicking **Send to Signed** for leads in the statuses **READY_TO_FUND**, **FUNDING**, or **FUNDED**.
* The modal must include a mandatory comment field.
* The checkbox **"Refund all payments captured for this application"** must appear **only** when the new status is **SIGNED**.
* The checkbox must not appear for any other status.

![Screenshot_at_Dec_11_00-17-06](/uploads/30f50b26e8df10b11a5db2b9944584ba/Screenshot_at_Dec_11_00-17-06.png){width=900 height=105}
![Screenshot_at_Dec_11_00-17-28](/uploads/f6c7e7d35c4490e7d39d21191ca0b4f2/Screenshot_at_Dec_11_00-17-28.png){width=900 height=183}
![Screenshot_at_Dec_11_00-23-33](/uploads/5a2b73af18ce62d477faecb138dc63fb/Screenshot_at_Dec_11_00-23-33.png){width=900 height=106}
![Screenshot_at_Dec_11_00-24-52](/uploads/9f4610307cb46ecd84120e006a811b8c/Screenshot_at_Dec_11_00-24-52.png){width=900 height=267}

**| PASS |**

---

### 2. Sending to Signed Without Refund
* If the checkbox is not selected, the system must update the lead to **SIGNED** without issuing any refund.
* A success toast must appear: **"Successfully changed the lead status to signed."**
* The activity log must be updated.
* No payments should be refunded.

![Screenshot_at_Dec_11_08-40-57](/uploads/e89387bb04a044592e1867f4f22e188b/Screenshot_at_Dec_11_08-40-57.png){width=900 height=170}
![Screenshot_at_Dec_11_08-41-08](/uploads/30510f4c7d3e8c04605538f1e90e2899/Screenshot_at_Dec_11_08-41-08.png){width=900 height=170}
![Screenshot_at_Dec_11_08-41-19](/uploads/93b0167f17cb291be741467297c25c01/Screenshot_at_Dec_11_08-41-19.png){width=900 height=170}
![Screenshot_at_Dec_11_08-41-40](/uploads/4f958dce99df96e17dcc3a71bf467a3a/Screenshot_at_Dec_11_08-41-40.png){width=900 height=199}
![Screenshot_at_Dec_11_08-45-49](/uploads/44de47e9f599c956c31e7f6603d1be80/Screenshot_at_Dec_11_08-45-49.png){width=900 height=234}
![Screenshot_at_Dec_11_08-46-53](/uploads/c5d0448219170d125943251a2e3e2e67/Screenshot_at_Dec_11_08-46-53.png){width=900 height=446}
![Screenshot_at_Dec_11_08-48-12](/uploads/58b925c926ddd413d76112ce0a7a8c4f/Screenshot_at_Dec_11_08-48-12.png){width=900 height=421}
![Screenshot_at_Dec_11_08-48-30](/uploads/cb0f5bb5c689f0e70d7fffd6bbf74a50/Screenshot_at_Dec_11_08-48-30.png){width=900 height=200}
![Screenshot_at_Dec_11_08-48-41](/uploads/180ab8b51dfda4d721f47fb956730d47/Screenshot_at_Dec_11_08-48-41.png){width=900 height=171}
![Screenshot_at_Dec_11_08-48-56](/uploads/0ee6beaa3dde79eada3a4a1a67a63bee/Screenshot_at_Dec_11_08-48-56.png){width=900 height=170}
![Screenshot_at_Dec_11_08-51-57](/uploads/264bfcba54379c365053b39d0dac6c81/Screenshot_at_Dec_11_08-51-57.png){width=900 height=172}

**| PASS |**

---

### 3. Sending to Signed With Refund
* If the checkbox is selected, the system must update the lead to **SIGNED** and refund the payments.
* A success toast must appear: **"Successfully changed the lead status to signed."**
* The activity log must be updated.
* Captured payments must be refunded.
* The backend must send the parameter **refundPayments = true**.

![Screenshot_at_Dec_16_13-51-38](/uploads/fb1a66d86a128684082ef02493db2f05/Screenshot_at_Dec_16_13-51-38.png){width=900 height=181}
![Screenshot_at_Dec_16_13-54-04](/uploads/1486f34016d0b89e9af57d4a6729deea/Screenshot_at_Dec_16_13-54-04.png){width=900 height=398}
![Screenshot_at_Dec_16_13-54-15](/uploads/2ae8846a57465f577e5af7a2d68814ec/Screenshot_at_Dec_16_13-54-15.png){width=900 height=390}
![Screenshot_at_Dec_16_13-54-29](/uploads/72e5fdc1c699922fd05592c1e25db22e/Screenshot_at_Dec_16_13-54-29.png){width=900 height=207}
![Screenshot_at_Dec_16_13-54-46](/uploads/6b57aca6df6d4a80bf29149de188c54b/Screenshot_at_Dec_16_13-54-46.png){width=900 height=151}

**| PASS |**

`refundPaymentsIfExists` is sent as `true`, but the response returns `paymentsRefunded` as `false`.

---

### 4. Changing the Save Button to “Cancel Lease”
* When opening **Modify Lease** for leases in statuses **SIGNED**, **FUNDING**, or **FUNDED**, and **all** items are deleted, the **Save** button must change to **“Cancel Lease”**.
* The button’s position must remain unchanged.
* The button must **not** change if there is at least one active item.
* The button must **not** change for leases in statuses **UW_APPROVED** or **CONTRACT_CREATED**.

![Screenshot_at_Dec_11_08-58-31](/uploads/c2b61d55b0813d4f87e9ba1bbd41e4e5/Screenshot_at_Dec_11_08-58-31.png){width=900 height=211}
![Screenshot_at_Dec_11_09-06-03](/uploads/444620269f3704f782a5e0c0f0c93003/Screenshot_at_Dec_11_09-06-03.png){width=821 height=600}
![Screenshot_at_Dec_11_09-06-22](/uploads/c04af7c6132445031219258420cad925/Screenshot_at_Dec_11_09-06-22.png){width=900 height=372}
![Screenshot_at_Dec_11_09-06-33](/uploads/c842974d527915e9bfd66832513f11d8/Screenshot_at_Dec_11_09-06-33.png){width=900 height=376}

**| PASS |**

---

### 5. Modify Lease Without Refund
* If the checkbox is not selected, the lease must be cancelled without issuing any refund.
* The toast displayed must be: **"Lease cancelled successfully."**
* Both modals must be closed.
* All items must be marked as **CANCELLED**.
* The lead status must be updated to **INVOICE_CANCELLED**.
* The activity log must be updated.
* No payments should be refunded.
* The backend must send **refundPayments = false** in the `CancelAccountRequest`.

![Screenshot_at_Dec_11_09-07-11](/uploads/a52d0c824fccea14fda3a6d03a6b3cc1/Screenshot_at_Dec_11_09-07-11.png){width=900 height=357}
![Screenshot_at_Dec_11_09-08-04](/uploads/9e3b82a7c85daa3de7c3e31d5806a37e/Screenshot_at_Dec_11_09-08-04.png){width=900 height=443}
![Screenshot_at_Dec_11_09-08-55](/uploads/7cc8ea592c9d5ee293a7902f7f2efbdf/Screenshot_at_Dec_11_09-08-55.png){width=900 height=446}
![Screenshot_at_Dec_11_09-09-36](/uploads/5e645745f93dde99d08dc800297cb317/Screenshot_at_Dec_11_09-09-36.png){width=536 height=600}
![Screenshot_at_Dec_11_09-10-00](/uploads/b1b9ef2f6817935d4ed2421f016f2a6a/Screenshot_at_Dec_11_09-10-00.png){width=900 height=171}
![Screenshot_at_Dec_11_09-10-10](/uploads/6a5b7110be3083eafd39c989c43719a4/Screenshot_at_Dec_11_09-10-10.png){width=900 height=170}
![Screenshot_at_Dec_11_09-10-46](/uploads/3768c682cae79389108f963b94eabadb/Screenshot_at_Dec_11_09-10-46.png){width=900 height=170}
![image](/uploads/9d5e9b815cb6f47bfb2efd0dbe4922f2/image.png){width=900 height=37}

**| PASS |**

---

### 6. Modify Lease With Refund
* If the checkbox is selected, the lease must be cancelled with a refund.
* The toast displayed must be: **"Lease cancelled successfully."**
* Both modals must be closed.
* All items must be marked as **CANCELLED**.
* The lead status must be updated to **INVOICE_CANCELLED**.
* Payments must be refunded.
* The activity log must be updated.
* The backend must send **refundPayments = true**.
* The submitted comment must be used; if the comment is empty, the backend must generate the following default message:
  *“Invoice cancelled, refunding payments per user request”*.

![image](/uploads/a2d421595b85bd1e3e39e5e9d5ab5ec2/image.png){width=900 height=455}
![image](/uploads/145245d1ae05ad2e6c5520ee36583620/image.png){width=900 height=467}
![image](/uploads/a6d1cbbf369fe097d91226fad3b4a1ba/image.png){width=900 height=204}
![image](/uploads/f6400cc640e3fdc9c9f1c4eef625e6ce/image.png){width=900 height=151}
![image](/uploads/e80a7b6e1b3797c479fbc089879caa6b/image.png){width=900 height=51}

---



**| PASS |**



---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg


### 1. Sending to Signed Without Refund
* If the checkbox is not selected, the system must update the lead to **SIGNED** without issuing any refund.
* A success toast must appear: **"Successfully changed the lead status to signed."**
* The activity log must be updated.
* No payments should be refunded.

![Screenshot_at_Dec_16_14-31-41](/uploads/777d85cb83da0461ac36308707591fec/Screenshot_at_Dec_16_14-31-41.png){width=900 height=209}
![Screenshot_at_Dec_16_14-32-52](/uploads/9c525657b21171191a282c0b74d87ab9/Screenshot_at_Dec_16_14-32-52.png){width=900 height=387}
![Screenshot_at_Dec_16_14-33-02](/uploads/9538ea39e0da13128f6f7c2c1911b203/Screenshot_at_Dec_16_14-33-02.png){width=349 height=178}
![Screenshot_at_Dec_16_14-33-12](/uploads/1dc7d1df60a4f2a245a72f01401ef005/Screenshot_at_Dec_16_14-33-12.png){width=900 height=203}

**| PASS |**

---

### 2. Sending to Signed With Refund
* If the checkbox is selected, the system must update the lead to **SIGNED** and refund the payments.
* A success toast must appear: **"Successfully changed the lead status to signed."**
* The activity log must be updated.
* Captured payments must be refunded.
* The backend must send the parameter **refundPayments = true**.

![Screenshot_at_Dec_16_14-34-32](/uploads/61e7109f56d01de2eef63c5804e86f2a/Screenshot_at_Dec_16_14-34-32.png){width=900 height=452}
![Screenshot_at_Dec_16_14-34-43](/uploads/2b04efa6d8211629b942f6c274a2ca12/Screenshot_at_Dec_16_14-34-43.png){width=518 height=187}
![Screenshot_at_Dec_16_14-34-54](/uploads/49660f3a6bb0db2ad14f8fec52f08133/Screenshot_at_Dec_16_14-34-54.png){width=900 height=253}

**| PASS |**

`refundPaymentsIfExists` is sent as `true`, but the response returns `paymentsRefunded` as `false`.

---

### 3. Changing the Save Button to “Cancel Lease”
* When opening **Modify Lease** for leases in statuses **SIGNED**, **FUNDING**, or **FUNDED**, and **all** items are deleted, the **Save** button must change to **“Cancel Lease”**.
* The button’s position must remain unchanged.
* The button must **not** change if there is at least one active item.
* The button must **not** change for leases in statuses **UW_APPROVED** or **CONTRACT_CREATED**.

![Screenshot_at_Dec_16_14-48-09](/uploads/722f80fa5e5ab6483b7a48fa90912898/Screenshot_at_Dec_16_14-48-09.png){width=900 height=230}
![Screenshot_at_Dec_16_14-48-59](/uploads/4fa997e8587bc1db99958e33b0505c94/Screenshot_at_Dec_16_14-48-59.png){width=799 height=600}
![Screenshot_at_Dec_16_14-49-53](/uploads/4089a1aaf15a8fd6300e6143b32244a7/Screenshot_at_Dec_16_14-49-53.png){width=900 height=458}
![Screenshot_at_Dec_16_14-50-02](/uploads/75039e8c39251b6b3207d1fdb2647091/Screenshot_at_Dec_16_14-50-02.png){width=900 height=234}

**| PASS |**

---

### 4. Modify Lease Without Refund
* If the checkbox is not selected, the lease must be cancelled without issuing any refund.
* The toast displayed must be: **"Lease cancelled successfully."**
* Both modals must be closed.
* All items must be marked as **CANCELLED**.
* The lead status must be updated to **INVOICE_CANCELLED**.
* The activity log must be updated.
* No payments should be refunded.
* The backend must send **refundPayments = false** in the `CancelAccountRequest`.



**| PASS |**

---

### 5. Modify Lease With Refund
* If the checkbox is selected, the lease must be cancelled with a refund.
* The toast displayed must be: **"Lease cancelled successfully."**
* Both modals must be closed.
* All items must be marked as **CANCELLED**.
* The lead status must be updated to **INVOICE_CANCELLED**.
* Payments must be refunded.
* The activity log must be updated.
* The backend must send **refundPayments = true**.
* The submitted comment must be used; if the comment is empty, the backend must generate the following default message:
  *“Invoice cancelled, refunding payments per user request”*.

![Screenshot_at_Dec_16_14-52-22](/uploads/9cb540a576965a3fdef5f5e58bb88ba3/Screenshot_at_Dec_16_14-52-22.png){width=804 height=600}
![Screenshot_at_Dec_16_14-53-13](/uploads/b4a3e4ffdb8fed9eb3e3f47c09c80df0/Screenshot_at_Dec_16_14-53-13.png){width=900 height=457}
![Screenshot_at_Dec_16_14-54-06](/uploads/4c16c799185b795b322ded6175a133dc/Screenshot_at_Dec_16_14-54-06.png){width=529 height=600}
![Screenshot_at_Dec_16_14-54-18](/uploads/dc27f9ddcd3ad646b829a7049184e378/Screenshot_at_Dec_16_14-54-18.png){width=900 height=305}

**| PASS |**

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------