---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/472


Update Transactions page to new columns (will send attachments). Also, default Transactions page view to “Active Transactions”


Test instructions

There are changes in the 'payment-transaction' page on servicing portal.
payment transaction

The columns for payment-transaction are differente and should be to following
> paymentNumber
> paymentDate
> totalPaymentAmount
> receivableType
> appliedDueDate
> daysLate
> paymentDue
> appliedAmount
> remainingDue
> carryOver
> nextDueDate
> paymentType
> reversedDate
> user
> scheduledType
> postingDate
> pastDueAmount
> reversed / refunded

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Atualizar a página de Transações para novas colunas (enviarei anexos). Também, definir a visualização padrão da página de Transações para "Transações Ativas"

Instruções de teste

Há mudanças na página 'payment-transaction' no portal de atendimento.
payment transaction

As colunas para payment-transaction são diferentes e devem ser as seguintes
> paymentNumber
> paymentDate
> totalPaymentAmount
> receivableType
> appliedDueDate
> daysLate
> paymentDue
> appliedAmount
> remainingDue
> carryOver
> nextDueDate
> paymentType
> reversedDate
> user
> scheduledType
> postingDate
> pastDueAmount
> reversed / refunded

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 3 arquivos
+
53
−
21
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/
‎transactions‎

inde
‎x.tsx‎
+17 -13

domain
‎/stores‎

payme
‎nt.tsx‎
+5 -2

ut
‎ils‎

data-table-
‎columns.tsx‎
+31 -6

 components/transactions/index.tsx 
+
17
−
13

Visualizado
import React, {useCallback, useEffect, useState} from 'react';
import {Container, Input} from 'reactstrap';
import {transactionsTableColumns} from '@utils/data-table-columns';
import DataTable from 'react-data-table-component';
import {Observer} from 'mobx-react';
import {PaymentStore} from '@stores/payment';
import {convertNumberToCurrency} from '@uownleasing/common-utilities';
@@ -9,10 +8,12 @@ import config from '@config/project-config';
import classNames from 'classnames';
import styles from './index.module.scss';
import {PaymentTransaction} from '@models/payment-transaction';
import {FilterTable} from '@uownleasing/common-ui';
import {ConditionalStyles, TableRow} from 'react-data-table-component';

const conditionalActivityLogTableStyles = [
const conditionalActivityLogTableStyles: ConditionalStyles<TableRow>[] = [
  {
    when: (row: PaymentTransaction) =>
    when: (row: PaymentTransaction & TableRow) =>
      row.cancelledOrReversed ||
      row.scheduledType?.toLowerCase()?.includes('REFUND_PAYMENT'),
    style: {
@@ -23,7 +24,7 @@ const conditionalActivityLogTableStyles = [
];

interface TransactionProps {
  transactions: PaymentTransaction[];
  transactions: Array<TableRow & PaymentTransaction>;
  paymentStore?: PaymentStore;
}

@@ -31,9 +32,9 @@ const Transactions = ({transactions, paymentStore}: TransactionProps) => {
  const [activeTransactionFilters, setActiveTransactionFilters] = useState(
    true,
  );
  const [filteredTransactions, setFilteredTransactions] = useState(
    transactions,
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    Array<TableRow & PaymentTransaction>
  >(transactions);

  useEffect(() => {
    let filteredResults = [...(paymentStore?.transactions || [])];
@@ -49,9 +50,12 @@ const Transactions = ({transactions, paymentStore}: TransactionProps) => {
    setFilteredTransactions(filteredResults);
  }, [transactions, activeTransactionFilters]);

  const handleTransactionsFilter = useCallback((value: string) => {
    setActiveTransactionFilters(value.toLowerCase() !== 'all transactions');
  }, [setActiveTransactionFilters]);
  const handleTransactionsFilter = useCallback(
    (value: string) => {
      setActiveTransactionFilters(value.toLowerCase() !== 'all transactions');
    },
    [setActiveTransactionFilters],
  );

  return (
    <Container fluid={true}>
@@ -124,15 +128,15 @@ const Transactions = ({transactions, paymentStore}: TransactionProps) => {
                  onChange={(event) =>
                    handleTransactionsFilter(event.target.value)
                  }
                  defaultValue="Active Transactions"
                  >
                  defaultValue="Active Transactions">
                  <option>All Transactions</option>
                  <option>Active Transactions</option>
                </Input>
              </div>
            </div>
            <div className={classNames('mt-3', styles?.transactionBox)}>
              <DataTable
              <FilterTable
                isResizeable
                columns={transactionsTableColumns()}
                striped={true}
                data={filteredTransactions}
 domain/stores/payment.tsx 
+
5
−
2

Visualizado
@@ -17,11 +17,12 @@ import {
  ScheduledPayments,
} from '@models/index';
import {SendEmailCSVParams} from '@uownleasing/common-ui';
import {TableRow} from 'react-data-table-component';

export class PaymentStore extends BaseStore {
  @observable
  @persist('list')
  transactions: PaymentTransaction[] = [];
  transactions: Array<TableRow & PaymentTransaction> = [];

  @observable
  @persist('object')
@@ -87,7 +88,9 @@ export class PaymentStore extends BaseStore {
  };

  @action
  setTransactions = (transactions: PaymentTransaction[]): void => {
  setTransactions = (
    transactions: Array<TableRow & PaymentTransaction>,
  ): void => {
    this.transactions = transactions;
  };

---


 8 arquivos
+
206
−
286
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

customer-i
‎nfo-panels‎

payment-tran
‎sactions.tsx‎
+0 -1

transa
‎ctions‎

inde
‎x.tsx‎
+33 -35

domain
‎/stores‎

custom
‎er.tsx‎
+0 -32

mod
‎els‎

payment-tra
‎nsaction.ts‎
+20 -40

pa
‎ges‎

customer-i
‎nformation‎

[accou
‎nt].tsx‎
+2 -3

payment-t
‎ransaction‎

[accou
‎nt].tsx‎
+7 -26

ut
‎ils‎

data-table-
‎columns.tsx‎
+143 -148

serv
‎er.js‎
+1 -1

 components/customer-info-panels/payment-transactions.tsx 
+
0
−
1

Visualizado
@@ -18,7 +18,6 @@ import classNames from 'classnames';

interface PaymentTransactionsPanelProps {
  accountPk: number;
  //lastThreePayments: PaymentTransaction[];
  lastThreePayments: Payment[];
  top3ACHPayments: ACHPayment[];
  lastThreeCCPayments: CreditCardTransaction[];
 components/transactions/index.tsx 
+
33
−
35

Visualizado
import React, {useEffect, useState} from 'react';
import React, {useCallback, useEffect, useState} from 'react';
import {Container, Input} from 'reactstrap';
import {paymentTransactionTableColumns} from '@utils/data-table-columns';
import {transactionsTableColumns} from '@utils/data-table-columns';
import DataTable from 'react-data-table-component';
import {Observer} from 'mobx-react';
import {PaymentStore} from '@stores/payment';
import {convertNumberToCurrency} from '@uownleasing/common-utilities';
import {PaymentTransaction} from '@models/index';
import config from '@config/project-config';
import classNames from 'classnames';
import styles from './index.module.scss';
import {PaymentTransaction} from '@models/payment-transaction';

const conditionalActivityLogTableStyles = [
  {
    when: (row) => row?.transactionInfo?.cancelledOrReversed,
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
    },
  },
  {
    when: (row) => row?.transactionInfo?.transactionType === 'REFUND_PAYMENT',
    when: (row: PaymentTransaction) =>
      row.cancelledOrReversed ||
      row.scheduledType?.toLowerCase()?.includes('REFUND_PAYMENT'),
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
@@ -32,30 +27,31 @@ interface TransactionProps {
  paymentStore?: PaymentStore;
}

const Transactions = (props: TransactionProps) => {
  const {transactions, paymentStore} = props;

  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
const Transactions = ({transactions, paymentStore}: TransactionProps) => {
  const [activeTransactionFilters, setActiveTransactionFilters] = useState(
    true,
  );
  const [filteredTransactions, setFilteredTransactions] = useState(
    transactions,
  );

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const handleTransactionsFilter = (value) => {
    let filteredResults = paymentStore?.transactions || [];
    if (value.toLowerCase() === 'all transactions') {
      setFilteredTransactions(filteredResults);
    } else {
      filteredResults = filteredResults.filter((result) => {
        return !(
          result.transactionInfo?.cancelledOrReversed ||
          result?.transactionInfo?.transactionType === 'PAYMENT_REVERSAL'
        );
      });
      setFilteredTransactions(filteredResults);
    let filteredResults = [...(paymentStore?.transactions || [])];
    if (activeTransactionFilters) {
      filteredResults = filteredResults.filter(
        (result) =>
          !(
            result.cancelledOrReversed ||
            result.scheduledType?.toLowerCase()?.includes('PAYMENT_REVERSAL')
          ),
      );
    }
  };
    setFilteredTransactions(filteredResults);
  }, [transactions, activeTransactionFilters]);

  const handleTransactionsFilter = useCallback((value: string) => {
    setActiveTransactionFilters(value.toLowerCase() !== 'all transactions');
  }, [setActiveTransactionFilters]);

  return (
    <Container fluid={true}>
@@ -127,7 +123,9 @@ const Transactions = (props: TransactionProps) => {
                  type="select"
                  onChange={(event) =>
                    handleTransactionsFilter(event.target.value)
                  }>
                  }
                  defaultValue="Active Transactions"
                  >
                  <option>All Transactions</option>
                  <option>Active Transactions</option>
                </Input>
@@ -135,12 +133,12 @@ const Transactions = (props: TransactionProps) => {
            </div>
            <div className={classNames('mt-3', styles?.transactionBox)}>
              <DataTable
                columns={paymentTransactionTableColumns()}
                columns={transactionsTableColumns()}
                striped={true}
                data={filteredTransactions}
                pagination={true}
                paginationPerPage={10}
                defaultSortFieldId={'transactionCreatedtime'}
                defaultSortFieldId="paymentDate"
                defaultSortAsc={false}
                customStyles={config?.tableStyles}
                conditionalRowStyles={conditionalActivityLogTableStyles}

---


 8 arquivos
+
182
−
284
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

customer-i
‎nfo-panels‎

payment-tran
‎sactions.tsx‎
+0 -1

transa
‎ctions‎

inde
‎x.tsx‎
+33 -35

domain
‎/stores‎

custom
‎er.tsx‎
+0 -32

mod
‎els‎

payment-tra
‎nsaction.ts‎
+20 -40

pa
‎ges‎

customer-i
‎nformation‎

[accou
‎nt].tsx‎
+2 -3

payment-t
‎ransaction‎

[accou
‎nt].tsx‎
+7 -26

ut
‎ils‎

data-table-
‎columns.tsx‎
+119 -146

serv
‎er.js‎
+1 -1

 components/customer-info-panels/payment-transactions.tsx 
+
0
−
1

Visualizado
@@ -18,7 +18,6 @@ import classNames from 'classnames';

interface PaymentTransactionsPanelProps {
  accountPk: number;
  //lastThreePayments: PaymentTransaction[];
  lastThreePayments: Payment[];
  top3ACHPayments: ACHPayment[];
  lastThreeCCPayments: CreditCardTransaction[];
 components/transactions/index.tsx 
+
33
−
35

Visualizado
import React, {useEffect, useState} from 'react';
import React, {useCallback, useEffect, useState} from 'react';
import {Container, Input} from 'reactstrap';
import {paymentTransactionTableColumns} from '@utils/data-table-columns';
import {transactionsTableColumns} from '@utils/data-table-columns';
import DataTable from 'react-data-table-component';
import {Observer} from 'mobx-react';
import {PaymentStore} from '@stores/payment';
import {convertNumberToCurrency} from '@uownleasing/common-utilities';
import {PaymentTransaction} from '@models/index';
import config from '@config/project-config';
import classNames from 'classnames';
import styles from './index.module.scss';
import {PaymentTransaction} from '@models/payment-transaction';

const conditionalActivityLogTableStyles = [
  {
    when: (row) => row?.transactionInfo?.cancelledOrReversed,
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
    },
  },
  {
    when: (row) => row?.transactionInfo?.transactionType === 'REFUND_PAYMENT',
    when: (row: PaymentTransaction) =>
      row.cancelledOrReversed ||
      row.scheduledType?.toLowerCase()?.includes('REFUND_PAYMENT'),
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
@@ -32,30 +27,31 @@ interface TransactionProps {
  paymentStore?: PaymentStore;
}

const Transactions = (props: TransactionProps) => {
  const {transactions, paymentStore} = props;

  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
const Transactions = ({transactions, paymentStore}: TransactionProps) => {
  const [activeTransactionFilters, setActiveTransactionFilters] = useState(
    true,
  );
  const [filteredTransactions, setFilteredTransactions] = useState(
    transactions,
  );

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const handleTransactionsFilter = (value) => {
    let filteredResults = paymentStore?.transactions || [];
    if (value.toLowerCase() === 'all transactions') {
      setFilteredTransactions(filteredResults);
    } else {
      filteredResults = filteredResults.filter((result) => {
        return !(
          result.transactionInfo?.cancelledOrReversed ||
          result?.transactionInfo?.transactionType === 'PAYMENT_REVERSAL'
        );
      });
      setFilteredTransactions(filteredResults);
    let filteredResults = [...(paymentStore?.transactions || [])];
    if (activeTransactionFilters) {
      filteredResults = filteredResults.filter(
        (result) =>
          !(
            result.cancelledOrReversed ||
            result.scheduledType?.toLowerCase()?.includes('PAYMENT_REVERSAL')
          ),
      );
    }
  };
    setFilteredTransactions(filteredResults);
  }, [transactions, activeTransactionFilters]);

  const handleTransactionsFilter = useCallback((value: string) => {
    setActiveTransactionFilters(value.toLowerCase() !== 'all transactions');
  }, [setActiveTransactionFilters]);

  return (
    <Container fluid={true}>
@@ -127,7 +123,9 @@ const Transactions = (props: TransactionProps) => {
                  type="select"
                  onChange={(event) =>
                    handleTransactionsFilter(event.target.value)
                  }>
                  }
                  defaultValue="Active Transactions"
                  >
                  <option>All Transactions</option>
                  <option>Active Transactions</option>
                </Input>
@@ -135,12 +133,12 @@ const Transactions = (props: TransactionProps) => {
            </div>
            <div className={classNames('mt-3', styles?.transactionBox)}>
              <DataTable
                columns={paymentTransactionTableColumns()}
                columns={transactionsTableColumns()}
                striped={true}
                data={filteredTransactions}
                pagination={true}
                paginationPerPage={10}
                defaultSortFieldId={'transactionCreatedtime'}
                defaultSortFieldId="paymentDate"
                defaultSortAsc={false}
                customStyles={config?.tableStyles}
                conditionalRowStyles={conditionalActivityLogTableStyles}

---


 8 arquivos
+
206
−
286
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

customer-i
‎nfo-panels‎

payment-tran
‎sactions.tsx‎
+0 -1

transa
‎ctions‎

inde
‎x.tsx‎
+33 -35

domain
‎/stores‎

custom
‎er.tsx‎
+0 -32

mod
‎els‎

payment-tra
‎nsaction.ts‎
+20 -40

pa
‎ges‎

customer-i
‎nformation‎

[accou
‎nt].tsx‎
+2 -3

payment-t
‎ransaction‎

[accou
‎nt].tsx‎
+7 -26

ut
‎ils‎

data-table-
‎columns.tsx‎
+143 -148

serv
‎er.js‎
+1 -1

 components/customer-info-panels/payment-transactions.tsx 
+
0
−
1

Visualizado
@@ -18,7 +18,6 @@ import classNames from 'classnames';

interface PaymentTransactionsPanelProps {
  accountPk: number;
  //lastThreePayments: PaymentTransaction[];
  lastThreePayments: Payment[];
  top3ACHPayments: ACHPayment[];
  lastThreeCCPayments: CreditCardTransaction[];
 components/transactions/index.tsx 
+
33
−
35

Visualizado
import React, {useEffect, useState} from 'react';
import React, {useCallback, useEffect, useState} from 'react';
import {Container, Input} from 'reactstrap';
import {paymentTransactionTableColumns} from '@utils/data-table-columns';
import {transactionsTableColumns} from '@utils/data-table-columns';
import DataTable from 'react-data-table-component';
import {Observer} from 'mobx-react';
import {PaymentStore} from '@stores/payment';
import {convertNumberToCurrency} from '@uownleasing/common-utilities';
import {PaymentTransaction} from '@models/index';
import config from '@config/project-config';
import classNames from 'classnames';
import styles from './index.module.scss';
import {PaymentTransaction} from '@models/payment-transaction';

const conditionalActivityLogTableStyles = [
  {
    when: (row) => row?.transactionInfo?.cancelledOrReversed,
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
    },
  },
  {
    when: (row) => row?.transactionInfo?.transactionType === 'REFUND_PAYMENT',
    when: (row: PaymentTransaction) =>
      row.cancelledOrReversed ||
      row.scheduledType?.toLowerCase()?.includes('REFUND_PAYMENT'),
    style: {
      color: '#e50000',
      textDecoration: 'line-through',
@@ -32,30 +27,31 @@ interface TransactionProps {
  paymentStore?: PaymentStore;
}

const Transactions = (props: TransactionProps) => {
  const {transactions, paymentStore} = props;

  const [filteredTransactions, setFilteredTransactions] =
    useState(transactions);
const Transactions = ({transactions, paymentStore}: TransactionProps) => {
  const [activeTransactionFilters, setActiveTransactionFilters] = useState(
    true,
  );
  const [filteredTransactions, setFilteredTransactions] = useState(
    transactions,
  );

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const handleTransactionsFilter = (value) => {
    let filteredResults = paymentStore?.transactions || [];
    if (value.toLowerCase() === 'all transactions') {
      setFilteredTransactions(filteredResults);
    } else {
      filteredResults = filteredResults.filter((result) => {
        return !(
          result.transactionInfo?.cancelledOrReversed ||
          result?.transactionInfo?.transactionType === 'PAYMENT_REVERSAL'
        );
      });
      setFilteredTransactions(filteredResults);
    let filteredResults = [...(paymentStore?.transactions || [])];
    if (activeTransactionFilters) {
      filteredResults = filteredResults.filter(
        (result) =>
          !(
            result.cancelledOrReversed ||
            result.scheduledType?.toLowerCase()?.includes('PAYMENT_REVERSAL')
          ),
      );
    }
  };
    setFilteredTransactions(filteredResults);
  }, [transactions, activeTransactionFilters]);

  const handleTransactionsFilter = useCallback((value: string) => {
    setActiveTransactionFilters(value.toLowerCase() !== 'all transactions');
  }, [setActiveTransactionFilters]);

  return (
    <Container fluid={true}>
@@ -127,7 +123,9 @@ const Transactions = (props: TransactionProps) => {
                  type="select"
                  onChange={(event) =>
                    handleTransactionsFilter(event.target.value)
                  }>
                  }
                  defaultValue="Active Transactions"
                  >
                  <option>All Transactions</option>
                  <option>Active Transactions</option>
                </Input>
@@ -135,12 +133,12 @@ const Transactions = (props: TransactionProps) => {
            </div>
            <div className={classNames('mt-3', styles?.transactionBox)}>
              <DataTable
                columns={paymentTransactionTableColumns()}
                columns={transactionsTableColumns()}
                striped={true}
                data={filteredTransactions}
                pagination={true}
                paginationPerPage={10}
                defaultSortFieldId={'transactionCreatedtime'}
                defaultSortFieldId="paymentDate"
                defaultSortAsc={false}
                customStyles={config?.tableStyles}
                conditionalRowStyles={conditionalActivityLogTableStyles}


---


 5 arquivos
+
97
−
60
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

po
‎jo‎

Transacti
‎onDto.java‎
+38 -0

rest
‎/svc‎

SvcAccountCo
‎ntroller.java‎
+2 -1

ser
‎vice‎

CSVFileSe
‎rvice.java‎
+2 -3

SvAccountS
‎ervice.java‎
+54 -56

resourc
‎es/sqls‎

getTransa
‎ctions.sql‎
+1 -0

 src/main/java/com/uownleasing/svc/pojo/TransactionDto.java  0 → 100644
+
38
−
0

Visualizado
package com.uownleasing.svc.pojo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uownleasing.common.enumeration.ReceivableType;
import com.uownleasing.svc.utility.DateUtils;
import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TransactionDto {
    private long paymentNumber;
    private LocalDateTime paymentDate;
    private Double totalPaymentAmount;
    private ReceivableType receivableType;
    private LocalDate appliedDueDate;
    private int daysLate;
    private Double paymentDue;
    private Double appliedAmount;
    private Double remainingDue;
    private Double carryOver;
    private LocalDate nextDueDate;
    private String paymentType;
    @JsonProperty("reversed / refunded")
    private String status;
    private LocalDate reversedDate;
    private String user;
    private String scheduledType;
    private LocalDate postingDate;
    private Double pastDueAmount;
    private boolean cancelledOrReversed;

    public void setPaymentDate(Timestamp timestamp) {
        this.paymentDate = DateUtils.getLocalDateTimeFromSqlTimestamp(timestamp);
    }
}
 src/main/java/com/uownleasing/svc/rest/svc/SvcAccountController.java 
+
2
−
1

Visualizado
@@ -125,7 +125,8 @@ public class SvcAccountController {
    }

    @GetMapping("/getTransactions/{accountPk}")
    public List<TransactionDetails> getTransactions(@PathVariable(name = "accountPk")@Positive(message = "Please provide valid account pk") long accountPk){
    public List<TransactionDto> getTransactions(
        @PathVariable(name = "accountPk") @Positive(message = "Please provide valid account pk") long accountPk) {
        return accountService.getTransactions(accountPk);
    }

 src/main/java/com/uownleasing/svc/service/CSVFileService.java 
+
2
−
3

Visualizado
@@ -196,9 +196,8 @@ public class CSVFileService {
            setFileData("open.to.buy.report", "Open To Buy Report", csv);
        } else if (request.getEndpoint().contains("getTransactions")) {
            long accountPk = ((Integer) request.getParameters().get("accountPk")).longValue();
            List<TransactionDetails> transactions = accountService.getTransactions(accountPk);
            csv.setInfo(formData(transactions, request.getKeys(), request.getRowPks(),
                    TransactionDetails::getTransactionInfo));
            List<TransactionDto> transactions = accountService.getTransactions(accountPk);
            csv.setInfo(formData(transactions, request.getKeys(), request.getRowPks(), null));
            setFileData("transaction.history", "Transaction History for Account " + accountPk, csv);
        } else if (request.getEndpoint().contains("getAllActiveMerchants")) {
            List<Merchant> results = merchantService.getAllActiveMerchants();

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

O sistema deve exibir a coluna paymentNumber na página de payment-transaction.
O sistema deve exibir a coluna paymentDate na página de payment-transaction.
O sistema deve exibir a coluna totalPaymentAmount na página de payment-transaction.
O sistema deve exibir a coluna receivableType na página de payment-transaction.
O sistema deve exibir a coluna appliedDueDate na página de payment-transaction.
O sistema deve exibir a coluna daysLate na página de payment-transaction.
O sistema deve exibir a coluna paymentDue na página de payment-transaction.
O sistema deve exibir a coluna appliedAmount na página de payment-transaction.
O sistema deve exibir a coluna remainingDue na página de payment-transaction.
O sistema deve exibir a coluna carryOver na página de payment-transaction.
O sistema deve exibir a coluna nextDueDate na página de payment-transaction.
O sistema deve exibir a coluna paymentType na página de payment-transaction.
O sistema deve exibir a coluna reversedDate na página de payment-transaction.
O sistema deve exibir a coluna user na página de payment-transaction.
O sistema deve exibir a coluna scheduledType na página de payment-transaction.
O sistema deve exibir a coluna postingDate na página de payment-transaction.
O sistema deve exibir a coluna pastDueAmount na página de payment-transaction.
O sistema deve exibir a coluna reversed / refunded na página de payment-transaction.
O sistema deve definir "Active Transactions" como visualização padrão ao carregar a página de payment-transaction.


O sistema deve filtrar transações canceladas ou revertidas quando a opção "Active Transactions" está selecionada.
O sistema deve exibir todas as transações quando a opção "All Transactions" é selecionada.
O sistema deve ordenar as transações por paymentDate em ordem decrescente por padrão.
O sistema deve integrar corretamente com o endpoint /getTransactions/{accountPk} para recuperar as transações.
O sistema deve aplicar estilos condicionais de linha para transações canceladas ou revertidas (cor vermelha com tachado).
O sistema deve manter as funcionalidades de paginação, filtragem e ordenação após as alterações.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
ok in stg

> ## Tests in stg

The 18 requested columns (paymentNumber, paymentDate, totalPaymentAmount, receivableType, appliedDueDate, daysLate, paymentDue, appliedAmount, remainingDue, carryOver, nextDueDate, paymentType, reversedDate, user, scheduledType, postingDate, pastDueAmount, reversed/refunded) have been implemented and are visible on the payment-transaction page

> ![image](/uploads/222948db0384cdf1b1a6dacd6f895998/image.png)
> ![image](/uploads/011aefaa3d831151bb472d701557d538/image.png)


**|PASS|**

---

**The system should set "Active Transactions" as the default view of the payment-transaction page upon loadingRetry**

> ![image](/uploads/172ca983eee1d5a0a91f64409cc07c39/image.png)
> ![image](/uploads/afeca4a9e46851232b5631c09ffe4f1b/image.png)

**|PASS|**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------