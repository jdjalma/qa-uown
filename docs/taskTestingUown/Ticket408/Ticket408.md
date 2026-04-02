---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/408



UOWN | SVC | Update ACH Rerun Payment Date to Current Date



Synopsis
As a system user, I want rerun ACH payments to have the payment date set to the current date so that records reflect when the rerun actually occurred, not the original posting date.
Currently, when rerunning an ACH payment, the system assigns the original ACH transaction posting date as the payment date. The requirement is to update this behavior so that the payment date reflects the rerun date (current date).



Feature Request | Business Requirements
Update ACH rerun payment date to the current date and NOT the original ach transaction posting date



Test instructions
The rerun sweeps shouldn't change the posting date for ACH payments

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Atualizar a Data de Pagamento de Reexecução ACH para a Data Atual
Sinopse

Como usuário do sistema, quero que os pagamentos ACH reexecutados (rerun) tenham a data de pagamento definida como a data atual, para que os registros reflitam o momento em que a reexecução realmente ocorreu — e não a data original de postagem da transação.

Atualmente, ao reexecutar um pagamento ACH, o sistema atribui a data de postagem da transação original como data de pagamento.
A solicitação é atualizar esse comportamento para que a data de pagamento reflita a data da reexecução (data atual).

Requisitos da Funcionalidade / Requisitos de Negócio

Atualizar a data de pagamento dos pagamentos ACH reexecutados para que corresponda à data atual, e não à data original da transação ACH.

Garantir que a mudança afete apenas os pagamentos reexecutados (reruns) e não os originais.

Manter a consistência do histórico e evitar qualquer alteração indevida nas datas originais de postagem.

Instruções de Teste
Ao reexecutar (rerun) um pagamento ACH, verifique que a data de pagamento é atualizada para a data corrente.
As rotinas de varredura (sweeps) não devem alterar a data de postagem (posting date) dos pagamentos ACH originais.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 1 arquivo
+
5
−
7
 src/main/java/com/uownleasing/svc/service/ACHPaymentService.java 
+
5
−
7

Visualizado
@@ -465,13 +465,13 @@ public class ACHPaymentService extends SvACHPaymentService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String reRunACHPayment(String achPk) {
        try {
            Optional<SvACHPayment> svACHPayment = svACHPaymentRepo.findByPk(Long.valueOf(achPk));
            Optional<SvACHPayment> svACHPayment = svACHPaymentRepo.findByPk(Long.parseLong(achPk));
            if (svACHPayment.isPresent()) {
                SvReceivable receivable = null;
                ACHPayment achPayment = svACHPayment.get().getAchPayment();
                if(achPayment.getOriginalACHPk() == null && achPayment.getNumberOfTries() == 1) {
                    if (configurationManagement.getBoolean(configurationPath + "create.nsf.fee.receivable.on.rerun", Boolean.TRUE)) {
                        if (configurationManagement.getBoolean(configurationPath + "nsf.fee.receivable.on.rerun.due.date.as.posting.date", Boolean.TRUE)) {
                    if (Boolean.TRUE.equals(configurationManagement.getBoolean(configurationPath + "create.nsf.fee.receivable.on.rerun", Boolean.TRUE))) {
                        if (Boolean.TRUE.equals(configurationManagement.getBoolean(configurationPath + "nsf.fee.receivable.on.rerun.due.date.as.posting.date", Boolean.FALSE))) {
                            receivable = createNSFFeeReceivable(achPayment, achPayment.getPostingDate());
                        } else {
                            receivable = createNSFFeeReceivable(achPayment, null);
@@ -483,11 +483,10 @@ public class ACHPaymentService extends SvACHPaymentService {
                ACHPayment reRunACHPayment = new ACHPayment();
                reRunACHPayment.setUsername(configurationManagement.getString(configurationPath + "default.username.for.rerun.ach.payments", "SYSTEM_RERUN"));
                reRunACHPayment.setAmount(achPayment.getAmount());
                //String comments = "\nReturn Code : " + achPayment.getReturnCode() + " Return Date Time : " + achPayment.getReturnDateTimestamp() + "\n";
                reRunACHPayment.setComments(" RERUN ATTEMPT ON " + LocalDate.now() + " FOR ACH WITH CONFIRMATION NUMBER "+ achPayment.getPk());
                reRunACHPayment.setAchProcessType(ACHProcessType.RERUN);
                reRunACHPayment.setAchType(ACHType.ACHDebit);
                reRunACHPayment.setPostingDate(achPayment.getPostingDate());
                reRunACHPayment.setPostingDate(LocalDate.now());
                reRunACHPayment.setAccountPk(achPayment.getAccountPk());
                reRunACHPayment.setOriginalACHPk(achPayment.getPk());
                if (achPayment.getBankData() != null) {
@@ -499,7 +498,7 @@ public class ACHPaymentService extends SvACHPaymentService {

                //create ACH payment for NSF Fee
                if (receivable != null) {
                    if (configurationManagement.getBoolean(configurationPath +"create.ach.payment.for.nsf.fee.on.rerun", Boolean.TRUE)) {
                    if (Boolean.TRUE.equals(configurationManagement.getBoolean(configurationPath +"create.ach.payment.for.nsf.fee.on.rerun", Boolean.TRUE))) {
                        ACHPayment nsfFeePayment = new ACHPayment();
                        try {
                            nsfFeePayment.setAmount(receivable.getReceivableInfo().getTotalAmount());
@@ -510,7 +509,6 @@ public class ACHPaymentService extends SvACHPaymentService {
                            nsfFeePayment.setAccountPk(achPayment.getAccountPk());
                            nsfFeePayment.setOriginalACHPk(achPayment.getPk());
                            //After sendAch, numberOfTries increases to 1. default is 0
                            //nsfFeePayment.setNumberOfTries(nsfFeePayment.getNumberOfTries() + 1);
                            if (achPayment.getBankData() != null) {
                                nsfFeePayment.setBankData(achPayment.getBankData());
                                nsfFeePayment.setBankAccountType(achPayment.getBankAccountType());

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Now, the posting date will reflect the date of the sweep execution.