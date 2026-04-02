---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/133

UOWN | Customer Portal | Default to Active Account and Enforce Read-Only on Inactive Accounts



Synopsis
As a customer, when I have multiple accounts, I want the portal to default to my active account and clearly prevent edits on non-active accounts so I don’t attempt actions that aren’t allowed.
Customers may have multiple accounts and can switch between them. The portal must always open showing the active account by default. If the customer is viewing an account that is not ACTIVE, all pages for that account must be read-only, and payment/card/bank actions must be blocked with clear visual indication.



Synopsis
As a customer, when I have multiple accounts, I want the portal to default to my active account and clearly prevent edits on non-active accounts so I don’t attempt actions that aren’t allowed.
Customers may have multiple accounts and can switch between them. The portal must always open showing the active account by default. If the customer is viewing an account that is not ACTIVE, all pages for that account must be read-only, and payment/card/bank actions must be blocked with clear visual indication.



Features and Requirements



        
      
1. Default Account Selection
    When a customer with multiple accounts signs in or navigates to the account area, the portal must default to the ACTIVE account view.
2. Read-Only Enforcement on Non-Active Accounts
    If the customer is on an account that is not ACTIVE, all pages for that account must be read-only.
    The customer must not be able to:
        Make any payments.
        Add any cards or bank data.
3. Visual Representation (Clarity for Read-Only)
    Display a clear read-only banner/label indicating the account is Not Active and view-only.
    Disable or hide interactive controls related to payments and funding sources (buttons/inputs), and show a tooltip or helper text explaining why the action is unavailable.
4. Front-End Behavior
    Disable submission controls and inputs on non-active accounts across all relevant pages (Payment, Wallet, Account Details, etc.).
    Ensure the account switcher clearly shows which account is ACTIVE. 
5. Back-End Enforcement
    Server must reject payment creation and card/bank add requests for non-active accounts to guarantee the rule even if FE controls are bypassed.



Testing Steps

Log in to the customer portal using an email or phone number associated with more than one account, where one account is active and the other is inactive (statuses: PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL; other inactive statuses are already filtered out by the backend and not displayed in the portal).

Confirm that after logging in, the current account displayed is always the active one, if an active account exists.
Switch to the inactive account:
![alt text](image.png)

On the overview page, verify that shortcuts for accessing features are no longer available and that a message indicates the account is paid in full:
![alt text](image-1.png)

Check the sidebar and confirm that the option to make a payment is hidden:
![alt text](image-2.png)

Verify that the payment methods page is now read-only:
![alt text](image-3.png)

Finally, confirm that the update contact info page is also read-only:
![alt text](image-4.png)

---

UOWN | Portal do Cliente | Conta Ativa como Padrão e Bloqueio de Edição em Contas Inativas
Sinopse

Como cliente, quando possuo múltiplas contas, quero que o portal abra sempre na minha conta ativa por padrão e impeça claramente qualquer edição em contas inativas, para evitar tentar ações que não são permitidas.

Clientes podem ter várias contas e alternar entre elas.
O portal deve sempre abrir exibindo a conta ativa por padrão.
Se o cliente estiver visualizando uma conta que não está ATIVA, todas as páginas dessa conta devem ser somente leitura (read-only), e ações relacionadas a pagamentos, cartões e contas bancárias devem ser bloqueadas, com uma indicação visual clara desse bloqueio.

Funcionalidades e Requisitos
1. Seleção Padrão de Conta
Quando um cliente com múltiplas contas faz login ou acessa a área de contas, o portal deve exibir por padrão a conta com status ACTIVE.

2. Bloqueio de Edição em Contas Inativas
Se o cliente estiver em uma conta que não é ACTIVE, todas as páginas dessa conta devem estar em modo somente leitura.
O cliente não deve conseguir:
Realizar pagamentos.
Adicionar cartões ou dados bancários.

3. Representação Visual (Clareza de Leitura)
Exibir um banner ou rótulo claro informando que a conta está “Não Ativa / Somente Visualização”.
Desabilitar ou ocultar os controles interativos relacionados a pagamentos e fontes de financiamento (botões e inputs).
Mostrar tooltip ou mensagem explicativa informando por que a ação está indisponível.

4. Comportamento no Front-End
Desabilitar botões e campos de entrada em todas as páginas relacionadas a contas inativas (Pagamentos, Carteira, Detalhes da Conta, etc.).
Garantir que o seletor de contas (account switcher) destaque claramente qual conta está ATIVA.

5. Validação no Back-End
O servidor deve rejeitar requisições de criação de pagamentos e adição de cartões/contas bancárias para contas inativas, garantindo a regra mesmo que o front-end seja burlado.

Passos de Teste

Login
Acesse o portal do cliente utilizando um e-mail ou número de telefone vinculado a mais de uma conta (uma ativa e outra inativa).
As contas inativas podem ter status:
PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL.
Outros status inativos já são filtrados pelo backend e não aparecem no portal.

Verificar Conta Padrão
Confirme que, após o login, o portal abre exibindo a conta ativa, se existir uma.

Trocar para Conta Inativa
Altere para a conta inativa.
Na página de visão geral (overview), verifique se:
Os atalhos de acesso rápido a recursos não estão mais disponíveis.
É exibida uma mensagem informando que a conta está quitada / paga.


Verificar Menu Lateral
No menu lateral, confirme que a opção “Fazer Pagamento” está oculta.


Verificar Página de Métodos de Pagamento
Acesse a página de Métodos de Pagamento e confirme que está em modo somente leitura (read-only).


Verificar Página de Informações de Contato
Acesse a página de Atualização de Informações de Contato e confirme que também está em modo somente leitura.


✅ Resultado Esperado:
O portal deve sempre abrir na conta ativa, e todas as contas inativas devem ser somente leitura, sem permitir qualquer ação de edição ou pagamento, com mensagens e bloqueios visuais claros para o usuário.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 1 arquivo
+
7
−
0
 src/main/java/com/uownleasing/svc/common/db/repository/SvCustomerRepo.java 
+
7
−
0

Visualizado
@@ -4,6 +4,7 @@ import com.uownleasing.common.enumeration.*;
import com.uownleasing.svc.common.db.entity.*;
import com.uownleasing.svc.common.db.entity.SvCustomer;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.*;
import java.util.*;
@@ -33,5 +34,11 @@ public interface SvCustomerRepo extends JpaRepository<SvCustomer, Long>, SvCommo

    void removeCustomersByAccount_Pk(long accountPk);

    @Query("SELECT a FROM SvAccount a WHERE a.pk IN :pks AND a.accountInfo.accountStatus NOT IN (" +
            "com.uownleasing.common.enumeration.AccountStatus.PAID_OUT, " +
            "com.uownleasing.common.enumeration.AccountStatus.PAID_OUT_EARLY, " +
            "com.uownleasing.common.enumeration.AccountStatus.PAID_OUT_EARLY_EPO, " +
            "com.uownleasing.common.enumeration.AccountStatus.SETTLED_IN_FULL)")
    List<SvAccount> findNonPaidOutAccountsByPks(@Param("pks") List<Long> pks);

}

---


 8 arquivos
+
198
−
125
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

account
‎-summary‎

inde
‎x.tsx‎
+33 -30

side
‎-bar‎

inde
‎x.tsx‎
+23 -15

layout/aut
‎henticated‎

inde
‎x.tsx‎
+4 -1

pa
‎ges‎

manage-paym
‎ent-methods‎

inde
‎x.tsx‎
+41 -21

over
‎view‎

inde
‎x.tsx‎
+4 -2

pay
‎ment‎

inde
‎x.tsx‎
+4 -2

update-
‎contact‎

inde
‎x.tsx‎
+66 -54

utils
‎/hooks‎

useAccoun
‎tStatus.ts‎
+23 -0

 components/account-summary/index.tsx 
+
33
−
30

Visualizado
@@ -17,6 +17,7 @@ import {
import {Button} from '@uownleasing/common-ui';
import styles from './index.module.scss';
import {AccountSummary} from '@models';
import {useAccountStatus} from '@utils/hooks/useAccountStatus';

interface AccountSummaryProps {
  accountSummary: AccountSummary;
@@ -37,18 +38,34 @@ const AccountSummaryContainer = (props: AccountSummaryProps) => {
    pastDueAmount,
    contractBalance,
    epoBalance,
    accountStatus,
  } = accountSummary || {};

  const isAccountPaidOut =
    accountStatus === 'PAID_OUT' || accountStatus === 'PAID_OUT_EARLY';
  const {isAccountInactive} = useAccountStatus(accountSummary);

  const isApproved =
    typeof remainingApprovalAmount === 'number' && remainingApprovalAmount > 0;

  const handleCardFooterClick = (action: string) => {
    if (isAccountInactive) return;

    switch (action) {
      case 'makePayment':
      case 'payToCurrent':
        setAmountToPaySelector('');
        router.push('/payment');
        break;
      case 'payOff':
        setAmountToPaySelector('EPO');
        router.push('/payment');
        break;
      default:
        break;
    }
  };

  return (
    <>
      {isAccountPaidOut ? (
      {isAccountInactive ? (
        <Row
          className={classNames(
            styles?.accountPaidOutContainer,
@@ -180,13 +197,12 @@ const AccountSummaryContainer = (props: AccountSummaryProps) => {
              </div>

              <CardFooter
                className={styles?.accountSummaryContainer__card__footer}>
                className={classNames(
                  styles?.accountSummaryContainer__card__footer,
                )}>
                <div
                  className={classNames(styles?.accountSummaryContainer__btn)}
                  onClick={() => {
                    setAmountToPaySelector('');
                    router.push('/payment');
                  }}>
                  onClick={() => handleCardFooterClick('makePayment')}>
                  Make a Payment
                </div>
              </CardFooter>
@@ -277,13 +293,12 @@ const AccountSummaryContainer = (props: AccountSummaryProps) => {
              </div>

              <CardFooter
                className={styles?.accountSummaryContainer__card__footer}>
                className={classNames(
                  styles?.accountSummaryContainer__card__footer,
                )}>
                <div
                  className={classNames(styles?.accountSummaryContainer__btn)}
                  onClick={() => {
                    setAmountToPaySelector('');
                    router.push('/payment');
                  }}>
                  onClick={() => handleCardFooterClick('payToCurrent')}>
                  Pay to Current
                </div>
              </CardFooter>
@@ -328,17 +343,6 @@ const AccountSummaryContainer = (props: AccountSummaryProps) => {
                  </div>
                </div>
              </div>

              {/* <CardFooter>
                <div
                  className={classNames(styles?.accountSummaryContainer__btn)}
                  onClick={() => {
                    setAmountToPaySelector('');
                    router.push('/payment');
                  }}>
                  Make a Payment
                </div>
              </CardFooter> */}
            </Card>
          </Col>

@@ -381,13 +385,12 @@ const AccountSummaryContainer = (props: AccountSummaryProps) => {
              </div>

              <CardFooter
                className={styles?.accountSummaryContainer__card__footer}>
                className={classNames(
                  styles?.accountSummaryContainer__card__footer,
                )}>
                <div
                  className={classNames(styles?.accountSummaryContainer__btn)}
                  onClick={() => {
                    setAmountToPaySelector('EPO');
                    router.push('/payment');
                  }}>
                  onClick={() => handleCardFooterClick('payOff')}>
                  Pay Off
                </div>
              </CardFooter>


---


 1 arquivo
+
33
−
16
 src/main/java/com/uownleasing/svc/service/SvCustomerService.java 
+
33
−
16

Visualizado
@@ -233,14 +233,23 @@ public class SvCustomerService{
        loginAttempt = loginAttemptRepo.save(loginAttempt);
        String code = String.valueOf(new Random().nextInt(899999) + 100000);
        Matcher matcher = Pattern.compile("^(?!.*@)[0-9-]+$").matcher(emailOrPhone);
        List<SvAccount> accounts;
        if (matcher.matches()) {
            emailOrPhone = StringUtils.isNotBlank(emailOrPhone) ? emailOrPhone.replaceAll("-", "") : emailOrPhone;
            List<SvAccount> accounts = phoneService.getActiveAccountsByPhoneNumber(emailOrPhone);
//               List<SvPhone> phones = phoneService.getPhonesByPhoneNumber(emailOrPhone);
            accounts = phoneService.getActiveAccountsByPhoneNumber(emailOrPhone);
            if (accounts == null || accounts.isEmpty()) {
                throw new SvcException("We could not find an active account for customer with phone number " + emailOrPhone + " in our system");
            }
            loginAttempt.setAccountPks(accounts.stream().map(account -> String.valueOf(account.getPk())).collect(Collectors.joining(",")));
        } else {
            accounts = emailService.getActiveAccountsByEmailAddress(emailOrPhone);
            if (accounts == null || accounts.isEmpty()) {
                throw new SvcException("We could not find an active account for customer with email " + emailOrPhone + " in our system");
            }
        }

        loginAttempt.setAccountPks(accounts.stream().map(account -> String.valueOf(account.getPk())).collect(Collectors.joining(",")));

        if (matcher.matches()) {
            SmsQueue sms = new SmsQueue();
            sms.setTemplateName("SendVerificationCode");
            sms.setAccountPk(accounts.get(0).getPk());
@@ -250,15 +259,6 @@ public class SvCustomerService{
            loginAttempt.setSmsId(smsService.sendText(sms));
            svLoggingService.createActivityLog(accounts.get(0).getPk(), LogType.CORRESPONDENCE, false, null, "LOGIN ATTEMPT: Verification Code Sent to " + emailOrPhone, SvThreadAttributes.getUsername());
        } else {
            //List<SvEmail> emails = emailService.getEmailsByEmailAddress(emailOrPhone);
            List<SvAccount> accounts = emailService.getActiveAccountsByEmailAddress(emailOrPhone);

            if (accounts == null || accounts.isEmpty()) {
                throw new SvcException("We could not find an active account for customer with email " + emailOrPhone + " in our system");
            }
//            LoginAttempt finalLoginAttempt = loginAttempt;
            loginAttempt.setAccountPks(accounts.stream().map(svAccount -> String.valueOf(svAccount.getPk())).collect(Collectors.joining(",")));
//            emails.stream().forEach(email -> finalLoginAttempt.setAccountPks(finalLoginAttempt.getAccountPks()+","+email.getAccount().getPk()));
            EmailQueue email = new EmailQueue();
            email.setAccountPk(accounts.get(0).getPk());
            email.setEmailBody("Your verification code is " + code);
@@ -286,13 +286,22 @@ public class SvCustomerService{
        loginAttempt.setGivenCodes(loginAttempt.getGivenCodes() != null ? loginAttempt.getGivenCodes() + "," + code : code);
        loginAttemptRepo.save(loginAttempt);
        List<Long> accountPks = Stream.of(loginAttempt.getAccountPks().split(",")).map(Long::parseLong).collect(Collectors.toList());

        Collections.sort(accountPks, (pk1, pk2) -> {
            AccountStatus s1 = customerService.getPrimaryCustomer(pk1).getAccount().getAccountInfo().getAccountStatus();
            AccountStatus s2 = customerService.getPrimaryCustomer(pk2).getAccount().getAccountInfo().getAccountStatus();
            return Boolean.compare(!AccountStatus.ACTIVE.equals(s1), !AccountStatus.ACTIVE.equals(s2));
        });

        Long primaryAccountPk = accountPks.get(0);

        if(!loginAttempt.getCode().equals(code)){
            svLoggingService.createActivityLog(accountPks.get(0),
            svLoggingService.createActivityLog(primaryAccountPk,
                LogType.INTERNAL, "Login attempt " + loginAttempt.getNumberOfAttempts() + " failed due to mismatched code: " + code, SvThreadAttributes.getUsername());
            throw new SvcException("Given code doesn't match the code sent");
        }
        if(loginAttempt.getExpirationTime().compareTo(LocalDateTime.now()) < 0){
            svLoggingService.createActivityLog(accountPks.get(0),
            svLoggingService.createActivityLog(primaryAccountPk,
                LogType.INTERNAL, String.format("Login attempt " + loginAttempt.getNumberOfAttempts() + " failed due to expired code: code -> %s; expiration -> %s", code, loginAttempt.getExpirationTime()),
                SvThreadAttributes.getUsername());
            throw new SvcException("Code has expired");
@@ -305,7 +314,7 @@ public class SvCustomerService{
            svCustomerRepo.save(customer);
        }

        svLoggingService.createActivityLog(accountPks.get(0),
        svLoggingService.createActivityLog(primaryAccountPk,
            LogType.INTERNAL, String.format("Login Success using code %s at %s; Attempt %d", code, LocalDateTime.now(), loginAttempt.getNumberOfAttempts()),
            SvThreadAttributes.getUsername());
        result.setAccountPks(accountPks);
@@ -321,7 +330,14 @@ public class SvCustomerService{
        List<SvPhone> phones = phoneService.getPhonesByCustomerPK(customerPk);
        PhoneInfo phone = CollectionUtils.isNotEmpty(phones) ? phones.get(0).getPhoneInfo() : null;
        SvAddress address = addressService.getHomeAddressForCustomer(customerPk);
        return new BasicCustomerData(customerInfo.getFirstName(), customerInfo.getLastName(), customerInfo.getDateOfBirth(), email != null ? email.getEmailInfo().getEmailAddress() : null, phone != null ? phone.getAreaCode()+phone.getPhoneNumber() : null, address != null ? address.getAddressInfo() : null);
        return new BasicCustomerData(
            customerInfo.getFirstName(),
            customerInfo.getLastName(),
            customerInfo.getDateOfBirth(),
            email != null ? email.getEmailInfo().getEmailAddress() : null,
            phone != null ? phone.getAreaCode() + phone.getPhoneNumber() : null,
            address != null ? address.getAddressInfo() : null
        );
    }

    public List<CategoryDTO> getZendeskEmailCategories() {
@@ -341,4 +357,5 @@ public class SvCustomerService{
    }

    public record CategoryDTO(String value, String label, String to) {}

}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



Quando um cliente com múltiplas contas faz login, o portal deve exibir por padrão a conta com status ACTIVE.
When a customer with multiple accounts logs in, the portal must display by default the account with ACTIVE status.

Quando um cliente alterna para uma conta com status PAID_OUT, todas as páginas dessa conta devem ser somente leitura.
When a customer switches to an account with PAID_OUT status, all pages for that account must be read-only.

Quando um cliente alterna para uma conta com status PAID_OUT_EARLY, todas as páginas dessa conta devem ser somente leitura.
When a customer switches to an account with PAID_OUT_EARLY status, all pages for that account must be read-only.


Quando um cliente alterna para uma conta com status PAID_OUT_EARLY_EPO, todas as páginas dessa conta devem ser somente leitura.
When a customer switches to an account with PAID_OUT_EARLY_EPO status, all pages for that account must be read-only.

Quando um cliente alterna para uma conta com status SETTLED_IN_FULL, todas as páginas dessa conta devem ser somente leitura.
When a customer switches to an account with SETTLED_IN_FULL status, all pages for that account must be read-only.

Quando um cliente está visualizando uma conta inativa, a página de resumo da conta deve exibir uma mensagem indicando que a conta está quitada/paga.
When a customer is viewing an inactive account, the account summary page should display a message indicating that the account is paid off.

Quando um cliente está visualizando uma conta inativa, os atalhos de acesso rápido para pagamentos devem estar ocultos na página de resumo da conta.
When a customer is viewing an inactive account, quick-access shortcuts for payments must be hidden on the overview page.

Quando um cliente está visualizando uma conta inativa, a opção "Fazer Pagamento" deve estar oculta no menu lateral.
When a customer is viewing an inactive account, the “Make a Payment” option must be hidden from the sidebar.

Quando um cliente está visualizando uma conta inativa e acessa a página de Métodos de Pagamento, essa página deve estar em modo somente leitura.
When a customer is viewing an inactive account and accesses the Payment Methods page, this page must be read-only.

Quando um cliente está visualizando uma conta inativa e acessa a página de Atualização de Informações de Contato, essa página deve estar em modo somente leitura.
When a customer is viewing an inactive account and accesses the Update Contact Information page, this page must be read-only.

Quando um cliente tem sua conta inativa reativada para status ACTIVE, a página de visão geral deve exibir os atalhos de acesso rápido para pagamentos
When a customer has their inactive account reactivated to ACTIVE status, the overview page should display quick access shortcuts for payments

Quando um cliente tem sua conta inativa reativada para status ACTIVE, a opção "Fazer Pagamento" deve estar visível no menu lateral
When a customer has their inactive account reactivated to ACTIVE status, the "Make Payment" option should be visible in the sidebar menu

Quando um cliente tem sua conta inativa reativada para status ACTIVE, a página de Métodos de Pagamento deve permitir edição e adição de novos métodos
When a customer has their inactive account reactivated to ACTIVE status, the Payment Methods page should allow editing and adding new methods

Quando um cliente tem sua conta inativa reativada para status ACTIVE, a página de Atualização de Informações de Contato deve permitir edição dos dados
When a customer has their inactive account reactivated to ACTIVE status, the Update Contact Information page should allow editing of data

Quando um cliente tem sua conta inativa reativada para status ACTIVE, o servidor deve aceitar requisições de criação de pagamentos
When a customer has their inactive account reactivated to ACTIVE status, the server should accept payment creation requests

Quando um cliente tem sua conta inativa reativada para status ACTIVE, o servidor deve aceitar requisições de adição de cartões de crédito
When a customer has their inactive account reactivated to ACTIVE status, the server should accept credit card addition requests

Quando um cliente tem sua conta inativa reativada para status ACTIVE, o servidor deve aceitar requisições de adição de informações de conta bancária
When a customer has their inactive account reactivated to ACTIVE status, the server should accept bank account information addition requests

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Se a conta for quitada, deve oferecer o plano de protecao?



> ## Tests in qa2


> ```gherkin

> **When a customer with multiple accounts logs in, the portal must display by default the account with ACTIVE status.**

> ![Screenshot_at_Oct_26_18-05-45](/uploads/4d1fe1150f8fa72f310706de0997f070/Screenshot_at_Oct_26_18-05-45.png)
> ![Screenshot_at_Oct_26_18-05-46](/uploads/23c815cf578c6053b8581cd31411e6b4/Screenshot_at_Oct_26_18-05-46.png)
> ![Screenshot_at_Oct_26_18-03-25](/uploads/f63cb6a3d6df99a50524e54a03b1069e/Screenshot_at_Oct_26_18-03-25.png)
> ![Screenshot_at_Oct_26_18-05-33](/uploads/499e75d72a3c1470678dba0c92d24e80/Screenshot_at_Oct_26_18-05-33.png)
> ![Screenshot_at_Oct_26_18-05-43](/uploads/6abafe5f9cbc3a79d9e0ffe3da7d0605/Screenshot_at_Oct_26_18-05-43.png)
> ![Screenshot_at_Oct_26_18-05-44](/uploads/d71353b937f5e6fd80ecc88bf36a039a/Screenshot_at_Oct_26_18-05-44.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer switches to an account with PAID_OUT status, all pages for that account must be read-only.**

> ![Screenshot_at_Oct_26_18-16-38](/uploads/8ae0a18deae5a15a90a034fa8ee19a14/Screenshot_at_Oct_26_18-16-38.png)
> ![image](/uploads/e2284f32ad505615287a264043c5a511/image.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer switches to an account with PAID_OUT_EARLY status, all pages for that account must be read-only.**

> ![Screenshot_at_Oct_26_18-18-22](/uploads/35f11645786559d97cd4ae36e9be5e17/Screenshot_at_Oct_26_18-18-22.png)
> ![Screenshot_at_Oct_26_18-18-23](/uploads/e1e4ff123b3337e2a9f570e91a19c460/Screenshot_at_Oct_26_18-18-23.png)
> ![Screenshot_at_Oct_26_18-18-24](/uploads/0fc63ef94043d5cf94b9abc6f7c811d2/Screenshot_at_Oct_26_18-18-24.png)
> ![Screenshot_at_Oct_26_18-18-25](/uploads/da2fac5a6b8d23cd0c05b983ab73bebd/Screenshot_at_Oct_26_18-18-25.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer switches to an account with PAID_OUT_EARLY_EPO status, all pages for that account must be read-only.**

> ![Screenshot_at_Oct_26_18-17-14](/uploads/abf1c262845c1c9abfa098251b452867/Screenshot_at_Oct_26_18-17-14.png)
> ![Screenshot_at_Oct_26_18-17-30](/uploads/e61648d75ae43d80e93bb20edeaf54f4/Screenshot_at_Oct_26_18-17-30.png)
> ![image](/uploads/29e9bdea49db5544167236b29d05115e/image.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer switches to an account with SETTLED_IN_FULL status, all pages for that account must be read-only.**

> ![Screenshot_at_Oct_26_18-07-23](/uploads/bdc0d76c418004900a19ab649e17577a/Screenshot_at_Oct_26_18-07-23.png)
> ![Screenshot_at_Oct_26_18-21-06](/uploads/18f55de0e531a22f852187318fc9ebee/Screenshot_at_Oct_26_18-21-06.png)
> ![Screenshot_at_Oct_26_18-21-20](/uploads/36208012d25eb097a5fb39eb0addd5e6/Screenshot_at_Oct_26_18-21-20.png)
> ![Screenshot_at_Oct_26_18-22-36](/uploads/886e70b46ee6e4c8917eb37c48d44325/Screenshot_at_Oct_26_18-22-36.png)
> ![Screenshot_at_Oct_26_22-14-24](/uploads/a98c1355031094db06bd740e24fe615f/Screenshot_at_Oct_26_22-14-24.png)
> ![Screenshot_at_Oct_26_22-14-51](/uploads/01ee1c24a1912118b72e54cdad28e75f/Screenshot_at_Oct_26_22-14-51.png)
> ![Screenshot_at_Oct_26_23-59-17](/uploads/06900808b907c4cb9ef478ff1bd8cd74/Screenshot_at_Oct_26_23-59-17.png)
> ![Screenshot_at_Oct_26_23-59-30](/uploads/571ca39ab4c775b7f216d93e604c891c/Screenshot_at_Oct_26_23-59-30.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer is viewing an inactive account, the account summary page should display a message indicating that the account is paid off.**

> 

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer is viewing an inactive account, quick-access shortcuts for payments must be hidden on the overview page.**

> ![image](/uploads/057cdec4c0db81f1db481a9d515fd48b/image.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer is viewing an inactive account, the “Make a Payment” option must be hidden from the sidebar.**

> ![Screenshot_at_Oct_26_18-22-36](/uploads/5d17883afff4f656350d3bcf3dd744dc/Screenshot_at_Oct_26_18-22-36.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer is viewing an inactive account and accesses the Payment Methods page, this page must be read-only.**

> ![Screenshot_at_Oct_26_18-22-36](/uploads/31c1b5eddf2838ff6b9c869bb445b968/Screenshot_at_Oct_26_18-22-36.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer is viewing an inactive account and accesses the Update Contact Information page, this page must be read-only.**

> ![Screenshot_at_Oct_26_22-14-51](/uploads/539e1920d45288883c934b358f997f20/Screenshot_at_Oct_26_22-14-51.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the overview page should display quick access shortcuts for payments**

> ![Screenshot_at_Oct_26_22-56-11](/uploads/94ef2efa87e0c81d7f05c1deb4e2ba44/Screenshot_at_Oct_26_22-56-11.png)
> ![Screenshot_at_Oct_26_22-56-36](/uploads/f9d1d0be1053ca8a652f43c47e3a8bf0/Screenshot_at_Oct_26_22-56-36.png)
> ![Screenshot_at_Oct_26_22-58-25](/uploads/533c44966ba697d42714cffc72254f12/Screenshot_at_Oct_26_22-58-25.png)
> ![Screenshot_at_Oct_26_22-58-40](/uploads/2111739dfac37f91d8e624c83e3ddfa5/Screenshot_at_Oct_26_22-58-40.png)
> ![Screenshot_at_Oct_26_23-00-41](/uploads/225229f5f811a420bf3b37aa70d31163/Screenshot_at_Oct_26_23-00-41.png)
> ![Screenshot_at_Oct_26_23-00-54](/uploads/71939c0c41ca481ea6e3fc745cf0b857/Screenshot_at_Oct_26_23-00-54.png)
> ![Screenshot_at_Oct_26_23-01-13](/uploads/d32e301c06c43f40186c7e0b59cd8604/Screenshot_at_Oct_26_23-01-13.png)
> ![Screenshot_at_Oct_26_23-01-26](/uploads/4f9d357790075efacf0a8e9ee5a43d2d/Screenshot_at_Oct_26_23-01-26.png)
> ![Screenshot_at_Oct_26_23-01-47](/uploads/aef8b2fcfa1f5366a854197ee870b076/Screenshot_at_Oct_26_23-01-47.png)
> ![Screenshot_at_Oct_26_23-02-08](/uploads/a3a0f04be5a8591110ef8d9898bfc224/Screenshot_at_Oct_26_23-02-08.png)
> ![Screenshot_at_Oct_26_23-09-06](/uploads/428609a86e1fd65f48f7f7b25ac0e808/Screenshot_at_Oct_26_23-09-06.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the "Make Payment" option should be visible in the sidebar menu**

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the Payment Methods page should allow editing and adding new methods**

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the Update Contact Information page should allow editing of data**

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the server should accept payment creation requests**

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the server should accept credit card addition requests**

> **| PASS |**
> ```

---

> ```gherkin

> **When a customer has their inactive account reactivated to ACTIVE status, the server should accept bank account information addition requests**

> **| PASS |**
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

