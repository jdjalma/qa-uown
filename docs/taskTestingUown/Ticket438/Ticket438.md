---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/438

UOWN | SERVICING | Review account closure (90-days) logic considering debt payment excluding fees

Synopsis
It was identified that, in some scenarios, the system automatically closes an account (90-days) even when the total amount paid includes fees, which may indicate that the principal debt has not been fully paid.
The account closure logic must be reviewed and adjusted to ensure that an account is only closed after confirming that the total principal debt amount (excluding fees) has been fully paid.

Business Objective
Prevent incorrect account closures in Servicing by ensuring financial consistency, correct payment interpretation, and reduced operational and reconciliation risks.

Feature Request | Business Requirements


Context / Problem Statement
    * The system has an automatic 90-days account closure logic
    * In some observed cases:
        * The account was closed
        * The total paid amount included fees
        * This suggests the principal debt may not have been fully settled
    * This behavior may result in incorrect account closures
Proposed Requirement (Subject to Validation)
    * Before closing an account under the 90-days rule, the system should:
        * Verify that the total amount paid corresponds only to the principal debt, excluding fees   
    * The account must not be closed if:
        * The paid amount includes fees and
        * The principal debt has not been fully paid
Expected Behavior
    * An account should only be closed under 90-days when:
        * The full principal debt amount has been paid
        * Fees are not considered part of the debt payoff amount
    * Automatic closures should be prevented when this condition is not met

![alt text](image.png)

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## UOWN | SERVICING | Revisar lógica de encerramento de conta (90 dias) considerando pagamento da dívida **excluindo taxas**

### **Sinopse**

Foi identificado que, em alguns cenários, o sistema encerra automaticamente uma conta após 90 dias mesmo quando o valor total pago inclui **taxas**, o que pode indicar que a **dívida principal** não foi totalmente quitada.

A lógica de encerramento de conta deve ser revisada e ajustada para garantir que uma conta seja encerrada **somente após a confirmação de que o valor total da dívida principal (excluindo taxas) foi integralmente pago**.

---

### **Objetivo de Negócio**

Evitar encerramentos incorretos de contas no módulo de **Servicing**, garantindo consistência financeira, interpretação correta dos pagamentos e redução de riscos operacionais e de conciliação.

---

### **Solicitação de Funcionalidade | Requisitos de Negócio**

#### **Contexto / Declaração do Problema**

* O sistema possui uma lógica automática de encerramento de conta após 90 dias.
* Em alguns casos observados:

  * A conta foi encerrada;
  * O valor total pago incluía taxas;
  * Isso sugere que a dívida principal pode não ter sido totalmente quitada.
* Esse comportamento pode resultar em encerramentos incorretos de contas.

---

#### **Requisito Proposto (Sujeito à Validação)**

Antes de encerrar uma conta com base na regra dos 90 dias, o sistema deve:

* Verificar se o valor total pago corresponde **exclusivamente à dívida principal**, **excluindo taxas**.

A conta **não deve ser encerrada** se:

* O valor pago incluir taxas **e**
* A dívida principal não tiver sido totalmente quitada.

---









---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


src/main/java/com/uownleasing/svc/service/AccountAmountsService.java

package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.ReceivableStatus;
import com.uownleasing.common.enumeration.ReceivableType;
import com.uownleasing.common.pojo.SchedSummaryInfo;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvReceivable;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.service.SvPaymentService;
import com.uownleasing.svc.migration.kornerstone.service.KSProtectionPlanService;
import com.uownleasing.svc.pojo.ContractBalance;
import com.uownleasing.svc.pojo.TotalContractAmount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class AccountAmountsService {

    private final SvAccountRepo accountRepo;
    private final SvPaymentService svPaymentService;
    private final KSProtectionPlanService protectionPlanService;

    public TotalContractAmount getTotalContractAmount(SvAccount account) {
        TotalContractAmount totalContractAmount = new TotalContractAmount();
        SchedSummaryInfo schedSummaryInfo = account.getSchedSummary().getSchedSummaryInfo();
        long accountPk = account.getPk();

        BigDecimal total = schedSummaryInfo.getTotalContractAmountWithTaxAndFees();
        BigDecimal contractAmount = total
            .subtract(schedSummaryInfo.getTaxAmount())
            .subtract(schedSummaryInfo.getProcessingFee())
            .setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal ppFees = protectionPlanService.getFeesToDate(accountPk);
        BigDecimal otherFees = getTotalFees(accountPk, false, false);

        // ---- HEADERS
        List<String> headers = new ArrayList<>(List.of(
            "ContractAmount ((Invoice * MoneyFactor)",
            "Processing Fee",
            "Total Tax",
            "Total Contract Amount With Tax and Fees",
            "Protection Plan AddOn To Date",
            "Other Fees (NSF, Reinstatement, Misc etc)",
            "Total"
        ));

        // ---- VALUES
        BigDecimal finalTotal = total.add(ppFees).add(otherFees);

        List<String> values = new ArrayList<>(List.of(
            contractAmount.toString(),
            schedSummaryInfo.getProcessingFee().toString(),
            schedSummaryInfo.getTaxAmount().toString(),
            total.toString(),
            ppFees.toString(),
            otherFees.toString(),
            finalTotal.toString()
        ));

        totalContractAmount.getBreakdown().add(headers);
        totalContractAmount.getBreakdown().add(values);
        totalContractAmount.setBalance(finalTotal.setScale(2, RoundingMode.HALF_EVEN));

        return totalContractAmount;
    }


    public ContractBalance getContractBalance(SvAccount account) {

        TotalContractAmount totalContractAmount = getTotalContractAmount(account);
        BigDecimal totalPaidAmount = getTotalPaymentAmount(account.getPk());

        ContractBalance contractBalance = new ContractBalance();

        BigDecimal finalBalance = totalContractAmount.getBalance().subtract(totalPaidAmount);

        contractBalance.setBalance(finalBalance.setScale(2, RoundingMode.HALF_EVEN));

        List<String> headers = new ArrayList<>(totalContractAmount.getBreakdown().get(0));
        headers.addAll(List.of("Total Paid Amount", "Balance"));

        List<String> values = new ArrayList<>(totalContractAmount.getBreakdown().get(1));
        values.addAll(List.of(
            totalPaidAmount.toString(),
            finalBalance.toString()
        ));

        contractBalance.getBreakdown().add(headers);
        contractBalance.getBreakdown().add(values);

        return contractBalance;
    }


    public BigDecimal getTotalPaymentAmount(long accountPk) {
        return svPaymentService.totalPaymentsMade(svPaymentService.getAllAppliedPaymentsForAccount(accountPk));
    }

    public List<ReceivableType> getNonFeeTypes() {
        return List.of(ReceivableType.REGULAR_PAYMENT, ReceivableType.EARLY_PAY_OFF, ReceivableType.PROCESSING_FEE, ReceivableType.PROTECTION_PLAN_FEE);
    }

    public BigDecimal getTotalFees(long accountPk, boolean onlyPaidFees, boolean onlyToDate) {
        SvAccount account = accountRepo.findByPk(accountPk);
        return getTotalFees(account, onlyPaidFees, onlyToDate);
    }

    public BigDecimal getTotalFees(SvAccount account, boolean onlyPaidFees, boolean onlyToDate) {
        Predicate<SvReceivable> isOtherFee = r -> !getNonFeeTypes().contains(r.getReceivableInfo().getReceivableType());
        return getReceivablesByPredicate(account, onlyPaidFees, onlyToDate, isOtherFee);
    }

    public BigDecimal getProtectionPlanFees(SvAccount account, boolean onlyPaidFees, boolean onlyToDate) {
        return getReceivablesByPredicate(account, onlyPaidFees, onlyToDate, r -> r.getReceivableInfo().getReceivableType().equals(ReceivableType.PROTECTION_PLAN_FEE));
    }

    private BigDecimal getReceivablesByPredicate(SvAccount account, boolean onlyPaidFees, boolean onlyToDate, Predicate<SvReceivable> filters) {
        return account.getReceivables().stream()
            .filter(r -> filters.test(r)
                && r.getReceivableInfo().getStatus() == ReceivableStatus.ACTIVE
                && (!onlyToDate || !r.getReceivableInfo().getDueDate().isAfter(LocalDate.now())))
            .map(r -> onlyPaidFees
                ? r.getReceivableInfo().getPartialPaymentAmount()
                : r.getReceivableInfo().getTotalAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}




src/main/java/com/uownleasing/svc/service/PostPaymentService.java

package com.uownleasing.svc.service;
import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.SchedSummaryInfo;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.db.repository.SvPaymentRepo;
import com.uownleasing.svc.common.db.repository.SvReceivableRepo;
import com.uownleasing.svc.common.db.repository.SvTransactionRepo;
import com.uownleasing.svc.common.service.LoggingService;
import com.uownleasing.svc.common.service.SvAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class PostPaymentService {

    private final UownAllocationService allocationService;

    private final SvPaymentRepo svPaymentRepo;

    private final SvAccountRepo accountRepo;

    private final SvReceivableRepo receivableRepo;

    private final SvAlertService alertService;

    private final SvTransactionRepo transactionRepo;

    private final LoggingService loggingService;

    private final EpoEligibleService epoEligibleService;

    private final RewindPaymentsService rewindPaymentsService;

    private final AccountAmountsService accountAmountsService;

    private final String configPath = "com.uownleasing.svc.service.PostPaymentService.";

    public List<SvAllocation> postPaymentToAccount(long paymentPk) {
        return postPaymentToAccount(svPaymentRepo.locateByPk(paymentPk), null);
    }

    public List<SvAllocation> postPaymentToAccount(SvPayment svPayment, TransactionType transactionType) {
        long accountPk = svPayment.getPaymentInfo().getAccountPk();
        log.info("[postPaymentToAccount] accountPk {} payment amount {} type {} strategy {} transactionType {} ", accountPk, svPayment.getPaymentInfo().getPaymentAmount(), svPayment.getPaymentInfo().getPaymentType(), svPayment.getPaymentInfo().getAllocationStrategy(), transactionType);
        List<SvAllocation> allocations = new ArrayList<>();
        SvAccount svAccount = svPayment.getAccount();

        SchedSummaryInfo schedSummaryInfo = svAccount.getSchedSummary().getSchedSummaryInfo();
        List<SvReceivable> receivables = new ArrayList<>();
        svAccount.getAccountInfo().setNotes("[RewindReplayService][postPaymentToAccount] Payment Pk " + svPayment.getPk() + ", $" + svPayment.getPaymentInfo().getPaymentAmount() + ", strategy :" + svPayment.getPaymentInfo().getAllocationStrategy() + " received.");
        if (svPayment.getPaymentInfo().getAllocationStrategy() == null || svPayment.getPaymentInfo().getAllocationStrategy() == AllocationStrategy.DEFAULT) {
            List<SvReceivable> allReceivables = receivableRepo.findNextUnPaidOrPartiallyPaidReceivables(svAccount.getPk(), svPayment.getPaymentInfo().getPaymentAmount());
            if (CollectionUtils.isNotEmpty(allReceivables)) {
                log.info("[postPaymentToAccount] accountPk {} Number of unpaid or partially paid receivables are {}", allReceivables.size());
                SvReceivable receivable1 = allReceivables.get(0);
                receivables.add(receivable1);
                Boolean isRegularReceivableFound = receivable1.getReceivableInfo().getReceivableType() == ReceivableType.REGULAR_PAYMENT ? true : false;
                if (allReceivables.size() > 1) {
                    LocalDate lowestDue = receivable1.getReceivableInfo().getDueDate();
                    for (int i = 1; i < allReceivables.size(); i++) {
                        SvReceivable tempReceivable = allReceivables.get(i);
                        if (!isRegularReceivableFound || tempReceivable.getReceivableInfo().getDueDate().compareTo(lowestDue) <= 0 ||
                            tempReceivable.getReceivableInfo().getDueDate().compareTo(LocalDate.now()) <= 0) {
                            receivables.add(tempReceivable);
                            if (!isRegularReceivableFound) {
                                isRegularReceivableFound = tempReceivable.getReceivableInfo().getReceivableType() == ReceivableType.REGULAR_PAYMENT ? true : false;
                            }
                            lowestDue = tempReceivable.getReceivableInfo().getDueDate();
                            log.info("[postPaymentToAccount] accountPk {} Finding all receivables due on {}", accountPk, lowestDue);
                        } else {
                            log.info("[postPaymentToAccount] accountPk {} Found Regular receivable, total receivables found {}", accountPk, receivables.size());
                            break;
                        }
                    }
                }
            }
        } else if (svPayment.getPaymentInfo().getAllocationStrategy() == AllocationStrategy.EPO_ONLY) {
            receivables = List.of(receivableRepo.getActiveEpoReceivable(svAccount.getPk()));
        } else {
            receivables = receivableRepo.findAllUnPaidOrPartiallyPaidReceivables(svAccount.getPk());
        }
        SvReceivable epoReceivable = receivableRepo.getActiveEpoReceivable(svAccount.getPk());

        if (epoReceivable == null && (receivables == null || receivables.isEmpty())) {
            alertService.createOrUpdate(svAccount.getPk(), "Payment received but is not allocated to any receivable or epo");
            return allocations;
        }

        if (svPayment.getPaymentInfo().getPaymentType() == PaymentType.DEPOSIT) {
            return allocationService.allocatePaymentToReceivables(svPayment, List.of(epoReceivable), false, transactionType);
        }
        List<SvTransaction> lateTransactions = transactionRepo.getLatePaymentTransactions(svAccount.getPk());
        //Check if EARLY_PAY_OFF is applicable.

        if (epoEligibleService.is90DayPayoffEligible(svAccount, true) && epoReceivable != null) {
            svAccount.getAccountInfo().setNotes("90 days eligibility flag ? " + svAccount.getAccountInfo().getIs90DayEligibleOverride());
            svAccount.getAccountInfo().setNotes("Account is eligible for 90 Day EPO");
            payOffEPO(epoReceivable);
        } else {
            String notes = "epoReceivable active ? " + (epoReceivable != null)
                + ", DqAsOfDate : " + schedSummaryInfo.getDelinquencyAsOfDate()
                + ", EarlyPayoffDateExpiry : " + schedSummaryInfo.getEarlyPayoffDateExpiry()
                + ", No Late payment transaction  ? " + (lateTransactions == null || lateTransactions.isEmpty())
                + ", 90 days eligibility flag ? " + svAccount.getAccountInfo().getIs90DayEligibleOverride();
            svAccount.getAccountInfo().setNotes(notes);
            log.info("[postPaymentToAccount] accountPk {} Not EPO Eligible, Notes {}", accountPk, notes);
            svAccount.getAccountInfo().setNotes("Not eligible for 90 Day EPO");
        }
        if (svAccount.getAccountInfo().getAccountStatus() == AccountStatus.ACTIVE) {
            //receivables.add(epoReceivable);
            log.info("[postPaymentToAccount] accountPk {} allocating Payment To Receivables", accountPk);
            allocations = allocationService.allocatePaymentToReceivables(svPayment, receivables, true, transactionType);
        }
        return allocations;
    }

    private void payOffEPO(SvReceivable epoReceivable) {
        String logSuffix = "[PostPaymentService][payOffEPO]";
        SvAccount svAccount = epoReceivable.getAccount();
        List<SvPayment> paidPayments = svAccount.getPayments().stream().filter(payment -> payment.getPaymentInfo().getStatus() == PaymentStatus.PAID).collect(Collectors.toList());
        BigDecimal totalPaymentAmount = accountAmountsService.getTotalPaymentAmount(svAccount.getPk());
        BigDecimal regularFees = accountAmountsService.getTotalFees(svAccount, false, false);
        // Only include protection plan fees that are due as of today when calculating EPO payoff
        BigDecimal protectionPlanFees = accountAmountsService.getProtectionPlanFees(svAccount, false, true);
        BigDecimal paymentAmountExcludingFees = totalPaymentAmount.subtract(regularFees).subtract(protectionPlanFees);
        BigDecimal EPOTotalPaymentAmount = epoReceivable.getReceivableInfo().getTotalAmount();
        log.info("{} EPO Verification - Receivable Amount: {}, Regular Fees: {}, Protection Plan Fees: {}, Payment Excluding Fees: {}",
            logSuffix, EPOTotalPaymentAmount, regularFees, protectionPlanFees, paymentAmountExcludingFees);
        if (paymentAmountExcludingFees.compareTo(epoReceivable.getReceivableInfo().getTotalAmount()) >= 0) {
            BigDecimal extraPaymentAmount = paymentAmountExcludingFees.subtract(epoReceivable.getReceivableInfo().getTotalAmount()).setScale(2, RoundingMode.HALF_EVEN);
            loggingService.createActivityLog(svAccount.getPk(), LogType.STATUS_CHANGE, "Allocating all payment[s] amount to EPO", null);
            svAccount.getAccountInfo().setNotes(logSuffix + " Rewinding all paid payments to allocate to EPO");
            rewindPaymentsService.rewindPayments(paidPayments);
            for (SvPayment svPayment : paidPayments) {
                epoReceivable.getReceivableInfo().setNotes(logSuffix + " Allocating paymentPk " + svPayment.getPk() + ", Amount $" + svPayment.getPaymentInfo().getPaymentAmount());
                allocationService.allocatePaymentToReceivables(svPayment, List.of(epoReceivable), false, null);
            }
            String notes = String.format("Total payment received ($%s) satisfies EPO amount ($%s), Regular Fees: ($%s), Protection Plan Fees: ($%s). Account is PAID_OUT_EARLY_EPO",
                totalPaymentAmount, EPOTotalPaymentAmount, regularFees, protectionPlanFees);
            alertService.createOrUpdate(svAccount.getPk(), notes);
            epoReceivable.getReceivableInfo().setAllocationStatus(ReceivableAllocationStatus.PAID_IN_FULL);
            epoReceivable.getReceivableInfo().setComment("Total payment received so far $" + totalPaymentAmount);
            // receivableRepo.updateReceivablesToNotApplicable(svAccount.getPk());
            svAccount.getAccountInfo().setAccountStatus(AccountStatus.PAID_OUT_EARLY_EPO);
            loggingService.createActivityLog(svAccount.getPk(), LogType.STATUS_CHANGE, notes, null);
            svAccount.getAccountInfo().setPayOffDate(LocalDate.now());
            accountRepo.save(svAccount);
            if (extraPaymentAmount.compareTo(BigDecimal.ZERO) > 0) {
                alertService.createOrUpdate(svAccount.getPk(), "Over payment $" + extraPaymentAmount + " is not allocated");
                svAccount.getAccountInfo().setNotes(logSuffix + " Extra payment amount $" + extraPaymentAmount);
                svAccount.getAccountInfo().setOverPaymentAmount(extraPaymentAmount);
            }
        } else {
                svAccount.getAccountInfo().setNotes(String.format("%s Total paid ($%s) does not satisfy EPO receivable amount ($%s), Regular Fees: ($%s), Protection Plan Fees: ($%s)",
                logSuffix, totalPaymentAmount, EPOTotalPaymentAmount, regularFees, protectionPlanFees));
            accountRepo.save(svAccount);
        }
    }
}

package com.uownleasing.svc.migration.kornerstone.service;

import com.uownleasing.common.enumeration.ReceivableAllocationStatus;
import com.uownleasing.common.enumeration.ReceivableType;
import com.uownleasing.svc.common.db.entity.SvReceivable;
import com.uownleasing.svc.common.db.repository.SvReceivableRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class KSProtectionPlanService {

    private final SvReceivableRepo receivableRepo;

    public List<SvReceivable> getProtectionPlanReceivables(long accountPk) {
        return Optional.ofNullable(
                receivableRepo.findActiveReceivableByType(accountPk, ReceivableType.PROTECTION_PLAN_FEE)
            )
            .orElseGet(Collections::emptyList);
    }

    public BigDecimal getFeesToDate(long accountPk) {
        return Optional.ofNullable(
                receivableRepo.findActiveReceivableByType(accountPk, ReceivableType.PROTECTION_PLAN_FEE)
            )
            .orElseGet(Collections::emptyList)
            .stream()
            .filter(r -> !r.getReceivableInfo().getDueDate().isAfter(LocalDate.now()))
            .map(r -> r.getReceivableInfo().getTotalAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal getFeesPaidToDate(long accountPk) {
        return Optional.ofNullable(
                receivableRepo.findActiveReceivableByType(accountPk, ReceivableType.PROTECTION_PLAN_FEE)
            )
            .orElseGet(Collections::emptyList)
            .stream()
            .filter(r -> r.getReceivableInfo().getAllocationStatus() == ReceivableAllocationStatus.PAID_IN_FULL || r.getReceivableInfo().getAllocationStatus() == ReceivableAllocationStatus.PARTIALLY_PAID )
            .map(r -> r.getReceivableInfo().getPartialPaymentAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

}


---------------------------------------------------------------------------------------------------------------------------------------------------------


---

## Requisitos de Comportamento — Encerramento de Conta (90 Dias) Excluindo Taxas

1. O sistema deve avaliar a elegibilidade de encerramento de conta pela regra de 90 dias apenas após o processamento completo dos pagamentos aplicados à conta.

2. O sistema deve calcular o valor total pago considerando todos os pagamentos com status **PAID** associados à conta.

3. O sistema deve calcular separadamente:

   * a dívida principal (regular payments / early payoff);
   * as taxas regulares (NSF, reinstatement, misc, etc.);
   * as taxas de Protection Plan, respeitando a data de vencimento quando aplicável.

4. O sistema deve desconsiderar taxas regulares e taxas de Protection Plan no cálculo do valor pago utilizado para quitação da dívida principal.

5. O sistema deve calcular o **valor pago excluindo taxas** subtraindo do total pago:

   * todas as taxas regulares;
   * as taxas de Protection Plan devidas até a data atual.

6. O sistema deve comparar o valor pago excluindo taxas com o valor total da dívida principal associada ao receivable de Early Pay Off (EPO).

7. A conta deve ser considerada quitada antecipadamente (90-day EPO) somente quando o valor pago excluindo taxas for **igual ou superior** ao valor total da dívida principal.

8. O sistema não deve encerrar a conta pela regra de 90 dias quando o valor pago atingir o montante total apenas por inclusão de taxas.

9. Quando a condição de quitação antecipada for atendida:

   * todos os pagamentos pagos devem ser revertidos (rewind);
   * os valores devem ser realocados integralmente ao receivable de EPO.

10. Após a realocação bem-sucedida para o receivable de EPO, o sistema deve:

    * marcar o receivable de EPO como **PAID_IN_FULL**;
    * atualizar o status da conta para **PAID_OUT_EARLY_EPO**;
    * registrar a data de payoff da conta.

11. O sistema deve registrar logs de auditoria e atividades sempre que ocorrer mudança de status relacionada à quitação antecipada.

12. O sistema deve gerar alertas informativos detalhando:

    * o valor total pago;
    * o valor da dívida principal;
    * os valores de taxas regulares;
    * os valores de taxas de Protection Plan consideradas.

13. Caso o valor pago excluindo taxas seja inferior ao valor da dívida principal:

    * a conta deve permanecer ativa;
    * nenhum encerramento automático deve ocorrer;
    * o estado atual da conta deve ser preservado.

14. O sistema deve registrar notas explicativas na conta sempre que a condição de quitação antecipada não for atendida, indicando claramente os valores considerados no cálculo.

15. Caso exista pagamento excedente após a quitação da dívida principal:

    * o sistema deve registrar o valor como **overpayment**;
    * o valor excedente não deve ser automaticamente alocado;
    * um alerta deve ser criado informando o pagamento excedente.

16. A lógica de encerramento automático não deve considerar taxas como parte do valor necessário para quitação da dívida principal, independentemente do tipo de taxa.

17. O comportamento de encerramento deve ser consistente entre cálculos de saldo, elegibilidade de EPO e mudança de status da conta.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## Cenário 1 — Encerrar conta quando o principal é totalmente quitado

```gherkin
Cenário: Quitar conta via Early Payoff quando o principal é totalmente pago
  Dado que a conta possui um receivable ativo de Early Payoff
  E existem pagamentos PAID suficientes para cobrir o valor principal excluindo taxas
  Quando um pagamento é processado
  Então o sistema deve realocar todos os pagamentos para o Early Payoff
  E marcar o Early Payoff como PAID
  E atualizar o status da conta para PAID_OUT_EARLY_EPO
  E registrar a data de quitação
  E gerar logs e alerta com o resumo do pagamento
```
11190
---

## Cenário 2 — Não encerrar conta quando apenas taxas completam o valor pago

```gherkin
Cenário: Não quitar conta quando apenas taxas completam o pagamento
  Dado que a conta possui um receivable ativo de Early Payoff
  E existem pagamentos PAID que atingem o total apenas com inclusão de taxas
  Mas o valor pago excluindo taxas é menor que o principal do Early Payoff
  Quando um pagamento é processado
  Então o status da conta deve permanecer ACTIVE
  E nenhum valor deve ser realocado para o Early Payoff
  E o sistema deve registrar um log de pagamento na conta

```
11191
---

---

## Cenário 3 — Manter conta ativa quando o valor pago excluindo taxas é insuficiente

```gherkin
Cenário: Manter conta ativa quando o valor pago excluindo taxas é inferior ao principal do Early Payoff
  Dado que a conta possui um receivable ativo de Early Payoff com valor principal definido
  E existem pagamentos com status PAID associados à conta
  E o valor total pago excluindo todas as taxas é menor que o valor da dívida principal do Early Payoff
  Quando um pagamento é processado para a conta
  Então o status da conta deve permanecer ACTIVE
  E o receivable de Early Payoff não deve ser marcado como PAID_IN_FULL
  E o sistema deve registrar logs informando os valores de principal e taxas considerados
```

---

## Cenário 4 — Registrar overpayment após quitação do principal

```gherkin
Cenário: Registrar overpayment quando o valor pago excede o principal do Early Payoff
  Dado que a conta possui um receivable ativo de Early Payoff com valor principal definido
  E existem pagamentos com status PAID associados à conta
  E o valor total pago excluindo todas as taxas é maior que o valor da dívida principal do Early Payoff
  Quando a conta é encerrada por Early Payoff
  Então o sistema deve calcular o valor excedente
  E registrar o overpayment na conta
  E gerar um alerta informando o pagamento excedente não alocado
  E o valor excedente não deve ser alocado automaticamente
```

---

## Cenário 5 — Considerar apenas taxas de Protection Plan vencidas

```gherkin
Cenário: Considerar somente taxas de Protection Plan vencidas no cálculo do Early Payoff
  Dado que a conta possui receivables ativos de Protection Plan
  E existem taxas de Protection Plan com data de vencimento futura
  Quando o cálculo do Early Payoff é executado
  Então apenas as taxas de Protection Plan com vencimento até a data atual devem ser consideradas
  E taxas com vencimento futuro não devem impactar o cálculo
```

---

## Cenário 6 — Garantir consistência entre saldo, elegibilidade e encerramento

```gherkin
Cenário: Manter consistência entre cálculo de saldo, elegibilidade de Early Payoff e encerramento da conta
  Dado que a conta possui um receivable ativo de Early Payoff
  E existem pagamentos com status PAID associados à conta
  Quando os pagamentos são aplicados
  Então o cálculo de saldo deve utilizar a mesma lógica de exclusão de taxas do Early Payoff
  E a elegibilidade de Early Payoff deve considerar apenas o valor principal
  E a decisão de encerramento deve utilizar os mesmos valores calculados
```

---







---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: — Close account when the principal is fully paid
```markdown
- Given the account has an active Early Payoff receivable
- And there are PAID payments sufficient to cover the principal amount excluding fees
- When a payment is processed
- Then the system must reallocate all payments to the Early Payoff
- And mark the Early Payoff as PAID
- And update the account status to PAID_OUT_EARLY_EPO
- And record the payoff date
- And generate logs and an alert with the payment summary

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---

### Scenario 2: — Do not close account when only fees complete the paid amount
```markdown
- Given the account has an active Early Payoff receivable
- And there are PAID payments that reach the total only by including fees
- But the amount paid excluding fees is less than the Early Payoff principal
- When a payment is processed
- Then the account status must remain ACTIVE
- And no amount must be reallocated to the Early Payoff
- And the system must record a payment log on the account

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---

### Scenario 3: — Keep account active when the amount paid excluding fees is insufficient
```markdown
- Given the account has an active Early Payoff receivable with a defined principal amount
- And there are payments with PAID status associated with the account
- And the total amount paid excluding all fees is less than the Early Payoff principal debt
- When a payment is processed for the account
- Then the account status must remain ACTIVE
- And the Early Payoff receivable must not be marked as PAID_IN_FULL
- And the system must log the principal and fee amounts considered

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---

### Scenario 4: — Record overpayment after the principal payoff
```markdown
- Given the account has an active Early Payoff receivable with a defined principal amount
- And there are payments with PAID status associated with the account
- And the total amount paid excluding all fees is greater than the Early Payoff principal debt
- When the account is closed via Early Payoff
- Then the system must calculate the excess amount
- And record the overpayment on the account
- And trigger an alert informing the unallocated excess payment
- And the excess amount must not be allocated automatically

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---

### Scenario 5: — Consider only overdue Protection Plan fees
```markdown
- Given the account has active Protection Plan receivables
- And there are Protection Plan fees with future due dates
- When the Early Payoff calculation is executed
- Then only Protection Plan fees due up to the current date must be considered
- And fees with a future due date must not impact the calculation

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---

### Scenario 6: — Ensure consistency between balance, eligibility, and closure
```markdown
- Given the account has an active Early Payoff receivable
- And there are payments with PAID status associated with the account
- When the payments are applied
- Then the balance calculation must use the same fee-exclusion logic as Early Payoff
- And the Early Payoff eligibility must consider principal only
- And the closure decision must rely on the same calculated values

Examples:
| Merchant    | Vendor       | Result      |
| ----------- | ------------ | ----------- |
| UOWN        | ANY          | should      |
| KORNERSTONE | OMNIFUND     | should      |
| KORNERSTONE | NON_OMNIFUND | should not  |

| Field     | Value |
|-----------|-------|
| LeadPk    |       |
| AccountPk |       |
```

Screeshot

**PASS**

---




---------------------------------------------------------------------------------------------------------------------------------------------------------








---------------------------------------------------------------------------------------------------------------------------------------------------------