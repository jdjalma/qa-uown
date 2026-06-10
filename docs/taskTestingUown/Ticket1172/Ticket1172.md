------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1172


UOWN | Origination | Required comment not shown in UW_DENIED → UW_APPROVED flow


BUG
In the portals, changing a Lead status requires an obligatory comment.
However, when updating the leadStatus from UW_DENIED → UW_APPROVED, the system opens only the Amount modal and does not open the comment modal. This allows the status to be changed without providing a mandatory comment, violating the expected workflow.

Current Result
    The status is updated without requiring a comment.
    The comment modal does not appear in this scenario.


FIX
    When changing status from UW_DENIED → UW_APPROVED, the system must:
    Display the comment modal as mandatory.
    Allow proceeding only after the comment is submitted.
    The status must not be updated without a comment.

![alt text](image.png)
![alt text](image-1.png)
Steps-to-Reproduce
    Access any lead with status UW_DENIED.
    Change the status to UW_APPROVED.
    Notice the system displays only the Amount modal.
    Complete the process without being asked for a comment.


Testing Steps
Confirm that, when changing a UW_DENIED lease to approved,
![alt text](image-2.png)
A comment section is now present and is required to be filled
![alt text](image-3.png)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

## UOWN | Origination | Comentário obrigatório não exibido no fluxo UW_DENIED → UW_APPROVED

### BUG

Nos portais, a mudança de status de um Lead exige um comentário obrigatório.
No entanto, ao atualizar o **leadStatus de UW_DENIED → UW_APPROVED**, o sistema abre apenas o modal de **Amount** e não exibe o modal de **comentário**. Isso permite que o status seja alterado sem fornecer um comentário obrigatório, violando o fluxo esperado.

### Resultado Atual

* O status é atualizado sem exigir um comentário.
* O modal de comentário não aparece nesse cenário.

---

## FIX

Ao alterar o status de **UW_DENIED → UW_APPROVED**, o sistema deve:

* Exibir o modal de comentário como obrigatório.
* Permitir prosseguir apenas após o envio do comentário.
* O status **não deve** ser atualizado sem um comentário.

---

## Steps-to-Reproduce (Passos para Reproduzir)

1. Acessar qualquer lead com status **UW_DENIED**.
2. Alterar o status para **UW_APPROVED**.
3. Observar que o sistema exibe apenas o modal de Amount.
4. Concluir o processo sem ser solicitado um comentário.

---

## Testing Steps (Passos de Teste)

Confirme que, ao alterar um lease de **UW_DENIED para UW_APPROVED**:

* Uma seção de comentário é exibida e é obrigatória para prosseguir.

---

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


 3 arquivos
+
22
−
7
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

customer
‎-summary‎

inde
‎x.tsx‎
+7 -1

input-approva
‎l-amount-modal‎

inde
‎x.tsx‎
+5 -3

layout
‎s/auth‎

inde
‎x.tsx‎
+10 -3

 components/customer-summary/index.tsx 
+
7
−
1

Visualizado
@@ -56,6 +56,7 @@ interface CustomerSummaryProps {
  setDisplayInputApprovalAmountModal: (
    displayInputApprovalAmountModal: boolean,
  ) => void;
  setIsChangingToApproved?: (isChangingToApproved: boolean) => void;
  setIsMoveContractToSignedModalOpen: (
    isMoveContractToSignedModalOpen: boolean,
  ) => void;
@@ -109,6 +110,7 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
    isEligibleToChangeApprovalStatus,
    setReloadActivityLog,
    setDisplayInputApprovalAmountModal,
    setIsChangingToApproved,
    setIsMoveContractToSignedModalOpen,
    setIsLeaseModified,
    isLoading,
@@ -679,6 +681,7 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
                      className={styles?.customerSummary__primaryButton}
                      onClick={() => {
                        setDisplayInputApprovalAmountModal(true);
                        setIsChangingToApproved?.(true);
                        setNewLeadStatus(CustomerStatus.UW_APPROVED);
                      }}>
                      Change to Approved
@@ -703,7 +706,10 @@ const CustomerSummary = (props: CustomerSummaryProps) => {
                  <div id="btn" className="mx-2 d-flex flex-row">
                    <Button
                      className={styles?.customerSummary__primaryButton}
                      onClick={() => setDisplayInputApprovalAmountModal(true)}>
                      onClick={() => {
                        setDisplayInputApprovalAmountModal(true);
                        setIsChangingToApproved?.(false);
                      }}>
                      Modify Approval Amount
                    </Button>
                  </div>
 components/input-approval-amount-modal/index.tsx 
+
5
−
3

Visualizado
@@ -15,6 +15,7 @@ interface InputApprovalAmountModalProps {
  handleClick?: (number: number, comment: string) => void;
  isLeadEligibleForAmtChange: boolean;
  leadStatus: string;
  isChangingToApproved?: boolean;
}

const InputApprovalAmountModal = (props: InputApprovalAmountModalProps) => {
@@ -25,6 +26,7 @@ const InputApprovalAmountModal = (props: InputApprovalAmountModalProps) => {
    handleClick,
    isLeadEligibleForAmtChange,
    leadStatus,
    isChangingToApproved = false,
  } = props;

  const isDenied = leadStatus === CustomerStatus.DENIED;
@@ -44,14 +46,14 @@ const InputApprovalAmountModal = (props: InputApprovalAmountModalProps) => {
        otherwise: Yup.number(),
      }),
      comment: Yup.string().when({
        is: () => isLeadEligibleForAmtChange || false,
        is: () => isLeadEligibleForAmtChange || isChangingToApproved,
        then: Yup.string().required('Comment is required.'),
        otherwise: Yup.string(),
      }),
    }),
    onSubmit: async (values) => {
      const {approvalAmount = 0, comment = ''} = values;
      if (initialApprovalAmount !== approvalAmount) {
      if (isChangingToApproved || initialApprovalAmount !== approvalAmount) {
        setDisplayInputApprovalAmountModal(false);
        handleClick(approvalAmount, comment);
      } else {
@@ -92,7 +94,7 @@ const InputApprovalAmountModal = (props: InputApprovalAmountModalProps) => {
              isLabelBold={true}
              min={0}
            />
            {isLeadEligibleForAmtChange && (
            {(isLeadEligibleForAmtChange || isChangingToApproved) && (
              <InputField
                className="mt-2"
                formik={formik}
 layouts/auth/index.tsx 
+
10
−
3

Visualizado
@@ -67,6 +67,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
  const [usersOnPage, setUsersOnPage] = useState([]);
  const [displayInputApprovalAmountModal, setDisplayInputApprovalAmountModal] =
    useState(false);
  const [isChangingToApproved, setIsChangingToApproved] = useState(false);
  const [isMoveContractToSignedModalOpen, setIsMoveContractToSignedModalOpen] =
    useState(false);
  const isShowingAlert = customerStore?.isShowingAlert || false;
@@ -153,6 +154,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
        leadPk: currentLeadPk,
        newLeadStatus: CustomerStatus.UW_APPROVED,
        approvalAmount: approvalAmount,
        comment: comment || '',
      });

      if (response?.status === 200) {
@@ -251,9 +253,13 @@ const AuthWrapper = (props: AuthWrapperProps) => {
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDING) ||
              isEqual(customerStore?.leadStatus, CustomerStatus.FUNDED)
            }
            setDisplayInputApprovalAmountModal={
              setDisplayInputApprovalAmountModal
            }
            setDisplayInputApprovalAmountModal={(value) => {
              setDisplayInputApprovalAmountModal(value);
              if (!value) {
                setIsChangingToApproved(false);
              }
            }}
            setIsChangingToApproved={setIsChangingToApproved}
            setIsMoveContractToSignedModalOpen={
              setIsMoveContractToSignedModalOpen
            }
@@ -696,6 +702,7 @@ const AuthWrapper = (props: AuthWrapperProps) => {
            customerStore?.leadInfo?.approvalAmount
          }
          leadStatus={customerStore?.leadStatus}
          isChangingToApproved={isChangingToApproved}
        />
      )}
      {hasChangeApprovalStatusPermission && isMoveContractToSignedModalOpen && (

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

---

## **Português**

* Ao mudar de **UW_DENIED → UW_APPROVED**, o modal exibido deve incluir um campo de comentário.
* O comentário deve ser **obrigatório** neste fluxo.
* Não deve ser possível prosseguir sem preencher o comentário.
* Uma mensagem de erro **“Comment is required.”** deve ser exibida caso tente enviar sem preenchê-lo.
* O status só deve ser atualizado após o preenchimento e envio do comentário.
* A requisição enviada deve conter o campo `comment` no payload.

---

* Em **“Modify Approval Amount”**, o comentário continua obrigatório.

---

* Aplicações **Denied**, mas com status interno diferente de **UW_DENIED**, mantêm o mesmo comportamento para mudança de status **denied → approved**.

---

* Em **“Set to expired”**, o comentário continua obrigatório.

---

* Em **“Change to Signed”**, o comentário continua obrigatório.

---

* Mudança de status via **API** permanece **sem obrigatoriedade** de preenchimento do comentário, mantendo o mesmo comportamento de **“Change to Signed”**.

---

## **English**

* When changing from **UW_DENIED → UW_APPROVED**, the displayed modal must include a comment field.
* The comment must be **mandatory** in this flow.
* It must not be possible to proceed without filling in the comment.
* An error message **“Comment is required.”** must be displayed if submission is attempted without a comment.
* The status must only be updated after the comment has been filled in and submitted.
* The request sent must include the `comment` field in the payload.

---

* In **“Modify Approval Amount”**, the comment remains mandatory.

---

* Applications that are **Denied** but have an internal status different from **UW_DENIED** must keep the same behavior when changing status from **denied → approved**.

---

* In **“Set to expired”**, the comment remains mandatory.

---

* In **“Change to Signed”**, the comment remains mandatory.

* Status changes performed via API remain without mandatory comment requirement, maintaining the same behavior as “Change to Signed”.

---

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
QA2

> ## Tests in qa2

* When changing from **UW_DENIED → UW_APPROVED**, the displayed modal must include a comment field.
* The comment must be **mandatory** in this flow.
* It must not be possible to proceed without filling in the comment.
* An error message **“Comment is required.”** must be displayed if submission is attempted without a comment.
* The status must only be updated after the comment has been filled in and submitted.
* The request sent must include the `comment` field in the payload.

![image](/uploads/b1f626b1273ad0aa96db77c6babbc376/image.png){width=900 height=44}
![Screenshot_at_Dec_11_23-57-30](/uploads/953a788f433900162da2992059836bb3/Screenshot_at_Dec_11_23-57-30.png){width=900 height=386}
![Screenshot_at_Dec_11_23-57-57](/uploads/463377b4b993d0540f88040b8e3c2da4/Screenshot_at_Dec_11_23-57-57.png){width=900 height=408}
![Screenshot_at_Dec_12_00-05-23](/uploads/9795bbf62ed8705e02a7dde1ed1a1e03/Screenshot_at_Dec_12_00-05-23.png){width=900 height=447}
![Screenshot_at_Dec_12_00-05-37](/uploads/9e969b5c8fc43a84c3389ea8b7b02be1/Screenshot_at_Dec_12_00-05-37.png){width=900 height=448}
![Screenshot_at_Dec_12_00-36-10](/uploads/053cc5d020b700fd06442bc3d96fc482/Screenshot_at_Dec_12_00-36-10.png){width=900 height=55}

**| PASS |**

---

* In **“Modify Approval Amount”**, the comment remains mandatory.

![Screenshot_at_Dec_12_00-43-54](/uploads/f252213fe5670d2ceac257ff38e1a430/Screenshot_at_Dec_12_00-43-54.png){width=900 height=414}
![Screenshot_at_Dec_12_00-45-28](/uploads/447e05ba794f895ff7b5ddbc44ea1036/Screenshot_at_Dec_12_00-45-28.png){width=900 height=133}

**| PASS |**

---

* Applications that are **Denied** but have an internal status different from **UW_DENIED** must keep the same behavior when changing status from **denied → approved**.

![Screenshot_at_Dec_12_00-52-18](/uploads/598b932c191b829419e14fe2d61f3183/Screenshot_at_Dec_12_00-52-18.png){width=900 height=98}
![Screenshot_at_Dec_12_00-52-36](/uploads/ff6dbfd5cbdcd504950f1cf244f07751/Screenshot_at_Dec_12_00-52-36.png){width=900 height=183}

**| PASS |**

---

* In **“Set to expired”**, the comment remains mandatory.

![Screenshot_at_Dec_12_01-31-16](/uploads/1c459933d701e7a81bc68cfb7cb4803c/Screenshot_at_Dec_12_01-31-16.png){width=900 height=232}

**| PASS |**

---

* In **“Change to Signed”**, the comment remains mandatory.

![Screenshot_at_Dec_12_01-30-59](/uploads/dee137761d27692e0a00a7dbb2543db4/Screenshot_at_Dec_12_01-30-59.png){width=900 height=266}

**| PASS |**

---

* Status changes performed via API remain without mandatory comment requirement, maintaining the same behavior as “Change to Signed”.

![Screenshot_at_Dec_12_01-24-13](/uploads/6d9549851284117b17ce81eceb7b3296/Screenshot_at_Dec_12_01-24-13.png){width=900 height=529}

**| PASS |**

---

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg

* When changing from **UW_DENIED → UW_APPROVED**, the displayed modal must include a comment field.
* The comment must be **mandatory** in this flow.
* It must not be possible to proceed without filling in the comment.
* An error message **“Comment is required.”** must be displayed if submission is attempted without a comment.
* The status must only be updated after the comment has been filled in and submitted.
* The request sent must include the `comment` field in the payload.

![image](/uploads/4739dd4d04a7a7d5f4ae928cbb9e5dd4/image.png){width=900 height=339}
![image](/uploads/4aa037915da024bf3e4ad54afbffb563/image.png){width=900 height=441}
![image](/uploads/3cf053d483c9ab5337476cc87a8050ad/image.png){width=900 height=322}

**| PASS |**

---

* In **“Modify Approval Amount”**, the comment remains mandatory.

![image](/uploads/1dce456f370c2553bfd64ab3b1d1a4bb/image.png){width=843 height=414}


**| PASS |**

---

* Applications that are **Denied** but have an internal status different from **UW_DENIED** must keep the same behavior when changing status from **denied → approved**.

![image](/uploads/1ad3df606f259ab3efb8aec00cc513c9/image.png){width=900 height=179}

**| PASS |**

---

* In **“Set to expired”**, the comment remains mandatory.

![image](/uploads/071d376c448b69516d705c10c7d72283/image.png){width=900 height=249}

**| PASS |**

---

* In **“Change to Signed”**, the comment remains mandatory.

![image](/uploads/e4a7580c329ff77ae292c9133473d37d/image.png){width=900 height=287}

**| PASS |**

---

* Status changes performed via API remain without mandatory comment requirement, maintaining the same behavior as “Change to Signed”.

![image](/uploads/5b93429056d4339bbdd103e723b138c7/image.png){width=900 height=498}
![image](/uploads/00f99eb1bd54994a7b515765ce745810/image.png){width=900 height=171}
![image](/uploads/90f12722db66f5c5b82baf2a044dabf4/image.png){width=900 height=57}

**| PASS |**

---

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------