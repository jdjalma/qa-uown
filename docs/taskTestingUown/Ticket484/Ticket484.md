--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/484


UOWN | Servicing | Add reverse convenience fee flag in Payments page
Testing Steps
Prerequisites

User must have the "Refund Payments [Edit]" servicing permission.

Test Procedure


Verify Refund Convenience Fee Flag

Initiate a full refund process.
Confirm that the refund convenience fee flag is displayed when "Fully Refund" is selected.
Reference:
![alt text](image.png)

Validate Refund Processing

Execute a full refund and confirm the payment processes normally.
Repeat the process for reserve and partial refund types.
Ensure all refund types complete without errors.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 7 arquivos
+
67
−
12
Arquivos
7
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

payment
‎-history‎

inde
‎x.tsx‎
+2 -2

reverse-pa
‎yment-modal‎

index.mo
‎dule.scss‎
+14 -0

inde
‎x.tsx‎
+28 -7

domain
‎/stores‎

payme
‎nt.tsx‎
+9 -2

mod
‎els‎

inde
‎x.ts‎
+1 -0

refund-payme
‎nt-request.ts‎
+7 -0

serv
‎er.js‎
+6 -1

 components/payment-history/index.tsx 
+
2
−
2

Visualizado
@@ -7,7 +7,7 @@ import Payment from '@models/payment';
import config from '@config/project-config';
import ReversePaymentModal from 'components/reverse-payment-modal';
import UpdatePaymentModal from 'components/modals/update-payment';
import {ResponseType, ReversePaymentRequest} from '@models/index';
import {RefundPaymentRequest, ResponseType, ReversePaymentRequest} from '@models/index';
import {FilterTable} from '@uownleasing/common-ui';
import {TableRow} from 'react-data-table-component';

@@ -38,7 +38,7 @@ interface PaymentHistoryTableProps {
  reversePayment: (
    reversePaymentRequest: ReversePaymentRequest,
  ) => Promise<ResponseType>;
  refundPayment: (queryParameters: string) => Promise<ResponseType>;
  refundPayment: (refundPaymentRequest: RefundPaymentRequest) => Promise<ResponseType>;
  updatePayment: (payment: Payment) => Promise<ResponseType>;
  isLoading: boolean;
}
 components/reverse-payment-modal/index.module.scss  0 → 100644
+
14
−
0

Visualizado
.refundFeeCheckbox {
  display: flex;
  align-items: center;
  
  input {
    position: relative;
    margin: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
  }
}
 components/reverse-payment-modal/index.tsx 
+
28
−
7

Visualizado
@@ -2,7 +2,7 @@ import React from 'react';
import {Col, Form, FormGroup, Row} from 'reactstrap';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {ReversePaymentRequest, ResponseType} from '@models/index';
import {RefundPaymentRequest, ReversePaymentRequest, ResponseType} from '@models/index';
import {
  convertNumberToCurrency,
  formatDate,
@@ -11,6 +11,7 @@ import {
} from '@uownleasing/common-utilities';
import {InputField, Modal} from '@uownleasing/common-ui';
import Payment from 'models/payment';
import styles from './index.module.scss';

interface ReversePaymentModalProps {
  displayReversePaymentModal: boolean;
@@ -19,7 +20,7 @@ interface ReversePaymentModalProps {
  reversePayment: (
    reversePaymentRequest: ReversePaymentRequest,
  ) => Promise<ResponseType>;
  refundPayment: (queryParameters: string) => Promise<ResponseType>;
  refundPayment: (refundPaymentRequest: RefundPaymentRequest) => Promise<ResponseType>;
  hasReversePaymentModifyPermission: boolean;
  hasRefundPaymentsModifyPermission: boolean;
}
@@ -62,6 +63,7 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
      paymentAmount: initialPaymentAmount,
      comment: '',
      reverseReason: 'Reverse',
      refundFee: true,
    },
    validationSchema: Yup.object({
      comment: Yup.string().required('Comment is required.').min(1).max(500),
@@ -79,18 +81,21 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
        comment = '',
        reverseReason = 'Reverse',
        paymentAmount = 0,
        refundFee = true,
      } = values;
      const isRefund =
        isEqual(reverseReason, 'Fully Refund') ||
        isEqual(reverseReason, 'Partially Refund');
      const isPartialRefund = isEqual(reverseReason, 'Partially Refund');
      const isFullyRefund = isEqual(reverseReason, 'Fully Refund');

      const response = isRefund
        ? await refundPayment(
            `?paymentPks=${paymentPk}&comment=${comment}${
              isPartialRefund ? `&amount=${paymentAmount}` : ''
            }`,
          )
        ? await refundPayment({
            paymentPk: paymentPk,
            refundFee: isFullyRefund ? refundFee : false,
            comment: comment,
            amount: isPartialRefund ? paymentAmount : initialPaymentAmount,
          })
        : await reversePayment({
            paymentPk: paymentPk,
            comment: comment,
@@ -205,6 +210,22 @@ const ReversePaymentModal = (props: ReversePaymentModalProps) => {
          />
        </Col>
      </Row>
      {isEqual(formik?.values?.reverseReason, 'Fully Refund') && (
        <Row className="mt-3">
          <Col sm={4} className="pop-up-form__key">
            Refund Convenience Fee
          </Col>
          <Col className="pop-up-form__value">
            <div className={styles.refundFeeCheckbox}>
              <InputField
                formik={formik}
                name="refundFee"
                type="checkbox"
              />
            </div>
          </Col>
        </Row>
      )}
      <Form id="revertPaymentForm" className="mt-3">
        <FormGroup row>
          <Col sm={4} className="pop-up-form__key">


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1


> ```gherkin

> ![image](/uploads/619ec8dca454b49cea13f79dafc8bd24/image.png){width=900 height=352}

![image](/uploads/48f3d126ae7ecb5a3e94e9768a07747b/image.png){width=900 height=386}

![image](/uploads/3e315dd0a810bd244039e7cec3785354/image.png){width=900 height=283}

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg


> ```gherkin

> ![image](/uploads/284e3b4ee29f442aed483d549ff02c9d/image.png){width=900 height=215}

> ![image](/uploads/8b1a66f305cb3b83a381eda21fa883b7/image.png){width=900 height=282}

> ![image](/uploads/6c8792a9e4c60001a6ac314046d29c0e/image.png){width=900 height=286}

![image](/uploads/9d7681a0aaa87e775dc0bafeb2a54ad4/image.png){width=900 height=265}

![image](/uploads/a432763c67652838fb064efefca3679f/image.png){width=900 height=304}

![image](/uploads/724a347c2ed3e4a950c48e514879a98c/image.png){width=900 height=174}

![image](/uploads/2e4340664795d43dfb7bc1b0172e46b0/image.png){width=900 height=286}

> **| PASS |**
> ```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------