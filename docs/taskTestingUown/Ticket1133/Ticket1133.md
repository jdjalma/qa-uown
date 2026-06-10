------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1133


UOWN | Origination | Add Program Group Dropdown to Clone Programs in Program page



Synopsis
In the Programs page within the Origination Portal, when the user clicks on Add New Program, there is a Clone option.
This cloning process should be improved by adding a dropdown field that lists all available Program Groups.
Selecting a group will display the programs associated with that group, allowing the user to choose one to clone more efficiently.


Business Objective
Currently, users can only search for a specific program name to clone, which makes the process slower and less intuitive.
By introducing the Program Group dropdown, users will:
    Easily locate programs organized by group;
    Improve the speed and accuracy of program selection;
    Reduce manual search effort and potential errors.


Feature Request | Business Requirements
    On the Programs page, when selecting Add New Program → Clone, add a new dropdown field labeled Program Group.
    The dropdown must list all existing Program Groups available in the system.
    Upon selecting a Program Group, display the list of programs belonging to that group.
    Allow the user to choose any program from the displayed list to clone.
    Maintain all existing behaviors of the cloning process after program selection.
    Ensure the UI layout remains intuitive and consistent with existing Origination Portal design patterns.
    Validate that program groups and their associated programs are fetched correctly from the backend.
    Add testing to confirm that group filtering and cloning behave as expected.      


🧪 Test Case: Clone Program Group

Preconditions
    At least one program group exists in the system.
    User is on the Program Form screen.

Steps and Expected Results

1. Click on Clone Group button
    ✅ The program form behind the modal must disappear.
    ✅ The Clone Group modal must be displayed.
2. Close the modal
    Clicking the Cancel button, the X (close) button, or the Save button must:
        ✅ Close the modal.
        ✅ Re-render (show again) the program form that was previously hidden.

3. Required field validation
    ✅ You cannot clone a group without providing a new program group name.
    ✅ The first input (Program Group Name) must always be filled before enabling the Save button.

4. Program selection
    ✅ You must be able to select multiple programs from the list.
    ✅ The Select All checkbox must correctly select and deselect all programs.

5. Clone validation
    After cloning, verify that each cloned program name follows the format:
        originalProgramName + "_" + newGroupName
    Example:
    test GNK cloned into group José's Group → test GNK_José's Group

6. Database verification
    ✅ Check directly in the database that all cloned program records were successfully created.
    ✅ All fields must be identical to the original, except:

7. Group name duplication validation
    ✅ You must not be able to clone programs with a group name that already exists in the database.
    ✅ An error message must be displayed indicating that the group name is already in use.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Adicionar Dropdown de Grupo de Programa ao Clonar Programas na página Programas

Sinopse

Na página Programas dentro do Portal Origination, quando o usuário clica em Adicionar Novo Programa, há a opção Clonar.
Esse processo de clonagem deve ser aprimorado com a adição de um campo dropdown que liste todos os Grupos de Programas disponíveis.

Ao selecionar um grupo, devem ser exibidos os programas associados a ele, permitindo que o usuário escolha de forma mais rápida e eficiente qual programa deseja clonar.

Objetivo de Negócio
Atualmente, os usuários só conseguem buscar pelo nome específico de um programa para cloná-lo, o que torna o processo mais lento e menos intuitivo.
Com a introdução do dropdown de Grupo de Programa, os usuários poderão:
Localizar facilmente programas organizados por grupo;

Aumentar a velocidade e a precisão na seleção de programas;
Reduzir o esforço manual de busca e possíveis erros.
Requisitos da Funcionalidade / Requisitos de Negócio
Na página Programas, ao selecionar Adicionar Novo Programa → Clonar, adicionar um novo campo dropdown rotulado Grupo de Programa.
O dropdown deve listar todos os Grupos de Programas existentes no sistema.
Ao selecionar um grupo, deve ser exibida a lista de programas pertencentes a esse grupo.
Permitir que o usuário escolha qualquer programa dessa lista para clonar.
Manter todos os comportamentos existentes do processo de clonagem após a seleção do programa.
Garantir que o layout da interface permaneça intuitivo e consistente com os padrões visuais do Portal Origination.
Validar que os grupos de programas e seus programas associados sejam obtidos corretamente do backend.
Adicionar testes para confirmar que o filtro por grupo e o processo de clonagem funcionam conforme esperado.

🧪 Caso de Teste: Clonar Grupo de Programas
Pré-condições

Deve existir pelo menos um grupo de programas cadastrado no sistema.

O usuário deve estar na tela de Formulário de Programa.

Passos e Resultados Esperados

Clicar no botão “Clonar Grupo”
✅ O formulário de programa atrás do modal deve desaparecer.
✅ O modal de Clonar Grupo deve ser exibido.

Fechar o modal
Ao clicar em Cancelar, no X (fechar) ou em Salvar:
✅ O modal deve ser fechado.
✅ O formulário de programa anteriormente oculto deve ser exibido novamente.

Validação de campo obrigatório
✅ Não é possível clonar um grupo sem informar o novo nome do grupo de programa.
✅ O primeiro campo (Nome do Grupo de Programa) deve estar preenchido para habilitar o botão Salvar.

Seleção de programas
✅ Deve ser possível selecionar múltiplos programas da lista.
✅ A caixa de seleção Selecionar Todos deve marcar e desmarcar todos os programas corretamente.

Validação da clonagem
Após clonar, verificar que cada programa clonado segue o formato:
nomeProgramaOriginal + "_" + novoNomeGrupo
Exemplo:
test GNK clonado para o grupo Grupo do José → test GNK_Grupo do José

Verificação no banco de dados
✅ Confirmar diretamente no banco que todos os registros de programas clonados foram criados com sucesso.
✅ Todos os campos devem ser idênticos aos do original, exceto:
(a especificação do campo pode ser completada conforme o sistema define exceções, ex.: IDs, datas, grupo, etc.)

Validação de duplicação de nome de grupo
✅ Não deve ser possível clonar programas usando um nome de grupo que já exista no banco de dados.
✅ Deve ser exibida uma mensagem de erro informando que o nome do grupo já está em uso.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 3 arquivos
+
58
−
39
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/
‎uownleasing/svc‎

ser
‎vice‎

MerchantProgr
‎amService.java‎
+3 -3

uti
‎lity‎

MerchantProgr
‎amMapper.java‎
+1 -1

test/java/com/
‎uownleasing/svc‎

MerchantProgram
‎MapperTest.java‎
+54 -35

 src/main/java/com/uownleasing/svc/service/MerchantProgramService.java 
+
3
−
3

Visualizado
@@ -139,11 +139,11 @@ public class MerchantProgramService {

        for (var programPk : programsPk) {

        var programToClone = merchantProgramRepo.findByPk(programPk);
            var programToClone = merchantProgramRepo.findByPk(programPk);

        var newProgram = MerchantProgramMapper.clone(programToClone, groupName);
            var newProgram = MerchantProgramMapper.clone(programToClone, groupName);

        merchantPrograms.add(newProgram);
            merchantPrograms.add(newProgram);
        }
        return merchantPrograms;
    }
 src/main/java/com/uownleasing/svc/utility/MerchantProgramMapper.java 
+
1
−
1

Visualizado
@@ -12,7 +12,7 @@ public class MerchantProgramMapper {
            return null;
        }
        MerchantProgram clone = new MerchantProgram();
        BeanUtils.copyProperties(original, clone, "pk");
        BeanUtils.copyProperties(original, clone, "pk", "merchantPrograms", "rowCreatedTimestamp", "rowUpdatedTimestamp");
        ProgramInfo originalInfo = original.getProgramInfo();
        if (originalInfo != null) {
            ProgramInfo clonedInfo = new ProgramInfo();
 src/test/java/com/uownleasing/svc/MerchantProgramMapperTest.java 
+
54
−
35

Visualizado
@@ -3,6 +3,7 @@ import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.uownleasing.common.enumeration.LendingCategoryType;
import com.uownleasing.svc.db.entity.MerchantToProgram;
import com.uownleasing.svc.enumeration.MerchantProgramType;
import com.uownleasing.svc.pojo.ProgramInfo;
import org.junit.jupiter.api.Test;
@@ -11,54 +12,72 @@ import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.utility.MerchantProgramMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class MerchantProgramMapperTest {

    @Test
    void shouldCloneMerchantProgramWithAllFieldsAndGivenGroupName() {
        // Arrange
        ProgramInfo originalInfo = new ProgramInfo();
        originalInfo.setProgramId("P001");
        originalInfo.setProgramName("TestProgram");
        originalInfo.setPeakCampaignId(10);
        originalInfo.setOffPeakCampaignId(20);
        originalInfo.setMoneyFactor(BigDecimal.valueOf(1.5));
        originalInfo.setQuickPayPct(BigDecimal.valueOf(5.0));
        originalInfo.setPayoffDiscount(BigDecimal.valueOf(3.5));
        originalInfo.setChargeAppFeeIfDeliveryIsZero(true);
        originalInfo.setDealerDiscount(BigDecimal.valueOf(2.0));
        originalInfo.setMaxDollarAmount(BigDecimal.valueOf(10000));
        originalInfo.setDealerRebate(BigDecimal.valueOf(500));
        originalInfo.setEpoDays(15);
        originalInfo.setEpoFeePercent(BigDecimal.valueOf(1.2));
        originalInfo.setMinCartAmount(BigDecimal.valueOf(100));
        originalInfo.setMaxCartAmount(BigDecimal.valueOf(1000));
        originalInfo.setTermMonths(24);
        originalInfo.setProgramType(MerchantProgramType.SAME_AS_CASH);
        originalInfo.setLendingCategoryType(LendingCategoryType.LTO);
        originalInfo.setAllowedFrequencyOverride("test_frequency");
        originalInfo.setStates("CA,TX,FL");
        originalInfo.setProcessingFeeOverride(BigDecimal.valueOf(25.50));
        originalInfo.setAmountChargedAtSigning(BigDecimal.valueOf(50.0));
        originalInfo.setGroupName("OldGroup");

    void shouldCloneMerchantProgramWithUpdatedGroupNameAndIndependentCollections() {
        ProgramInfo originalInfo = buildProgramInfo();
        MerchantProgram original = new MerchantProgram();
        original.setProgramInfo(originalInfo);
        original.setMerchantPrograms(new HashSet<>(Set.of(new MerchantToProgram())));
        original.setPk(123L);
        original.setRowCreatedTimestamp(LocalDateTime.now());
        original.setRowUpdatedTimestamp(LocalDateTime.now());

        String groupName = "NewGroup";
        String newGroupName = "NewGroup";

        // Act
        MerchantProgram cloned = MerchantProgramMapper.clone(original, groupName);
        MerchantProgram cloned = MerchantProgramMapper.clone(original, newGroupName);

        // Assert
        assertThat(cloned).isNotNull();
        assertThat(cloned.getProgramInfo()).isNotNull();

        ProgramInfo clonedInfo = cloned.getProgramInfo();
        assertThat(clonedInfo.getProgramName()).isEqualTo(originalInfo.getProgramName() + "_" + groupName);
        assertThat(clonedInfo.getGroupName()).isEqualTo("NewGroup");
        assertThat(clonedInfo).isNotNull();
        assertThat(clonedInfo.getProgramName()).isEqualTo(originalInfo.getProgramName() + "_" + newGroupName);
        assertThat(clonedInfo.getGroupName()).isEqualTo(newGroupName);

        assertThat(clonedInfo)
            .usingRecursiveComparison()
            .ignoringFields("programName", "groupName")
            .ignoringFields("programName", "groupName", "programPk")
            .isEqualTo(originalInfo);

        assertThat(cloned.getMerchantPrograms()).isEmpty();
        assertThat(cloned.getPk()).isEqualTo(0);
        assertThat(cloned.getRowCreatedTimestamp()).isNull();
        assertThat(cloned.getRowUpdatedTimestamp()).isNull();
    }

    private ProgramInfo buildProgramInfo() {
        ProgramInfo info = new ProgramInfo();
        info.setProgramId("P001");
        info.setProgramName("TestProgram");
        info.setPeakCampaignId(10);
        info.setOffPeakCampaignId(20);
        info.setMoneyFactor(BigDecimal.valueOf(1.5));
        info.setQuickPayPct(BigDecimal.valueOf(5.0));
        info.setPayoffDiscount(BigDecimal.valueOf(3.5));
        info.setChargeAppFeeIfDeliveryIsZero(true);
        info.setDealerDiscount(BigDecimal.valueOf(2.0));
        info.setMaxDollarAmount(BigDecimal.valueOf(10000));
        info.setDealerRebate(BigDecimal.valueOf(500));
        info.setEpoDays(15);
        info.setEpoFeePercent(BigDecimal.valueOf(1.2));
        info.setMinCartAmount(BigDecimal.valueOf(100));
        info.setMaxCartAmount(BigDecimal.valueOf(1000));
        info.setTermMonths(24);
        info.setProgramType(MerchantProgramType.SAME_AS_CASH);
        info.setLendingCategoryType(LendingCategoryType.LTO);
        info.setAllowedFrequencyOverride("test_frequency");
        info.setStates("CA,TX,FL");
        info.setProcessingFeeOverride(BigDecimal.valueOf(25.50));
        info.setAmountChargedAtSigning(BigDecimal.valueOf(50.0));
        info.setGroupName("OldGroup");
        return info;
    }
}

---


 5 arquivos
+
20
−
14
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

clone-pro
‎gram-group‎

inde
‎x.tsx‎
+12 -6

progra
‎m-form‎

inde
‎x.tsx‎
+3 -3

domain
‎/stores‎

progr
‎am.tsx‎
+2 -2

pages/p
‎rograms‎

inde
‎x.tsx‎
+1 -1

serv
‎er.js‎
+2 -2

 components/clone-program-group/index.tsx 
+
12
−
6

Visualizado
@@ -74,7 +74,7 @@ interface CloneProgramProps {
  formik: FormikProps<FormValues>;
  programGroups: Options[];
  setIsShowFormBehind: (boolean) => void;
  cloneManyPrograms: (body: {
  clonePrograms: (body: {
    groupName: string;
    programPks: string[];
  }) => Promise<ResponseType>;
@@ -84,7 +84,7 @@ export const CloneProgramGroup = ({
  getAllMerchantPrograms,
  programGroups,
  setIsShowFormBehind,
  cloneManyPrograms,
  clonePrograms,
}: CloneProgramProps) => {
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [programs, setAllPrograms] = useState<ResponseData[]>([]);
@@ -94,9 +94,15 @@ export const CloneProgramGroup = ({
      programGroupName: '',
      programGroup: '',
    },
    validate: ({programGroupName}) => {
      if (!programGroupName) {
        return {programGroupName: 'Program group name cannot be empty.'};
      }
      return {};
    },
    onSubmit: async (values) => {
      const body = {
        groupName: values.programGroupName,
        groupName: values.programGroupName.trim(),
        programPks: [],
      };
      for (const [key, value] of Object.entries(values)) {
@@ -105,15 +111,15 @@ export const CloneProgramGroup = ({
        }
      }
      if (body.programPks.length === 0) {
        showToast('error', 'Select at least one merchant to clone.');
        showToast('error', 'Select at least one program to clone.');
        return;
      }
      const {message, status} = await cloneManyPrograms(body);
      const {message, status} = await clonePrograms(body);
      if (status >= 400) {
        showToast('error', message);
        return;
      }
      showToast('success', 'Merchants successfully cloned!');
      showToast('success', 'Programs successfully cloned!');
      setIsShowFormBehind(true);
      setIsCloneModalOpen(false);
    },
 components/program-form/index.tsx 
+
3
−
3

Visualizado
@@ -32,7 +32,7 @@ interface ProgramFormProps {
    isGetAll?: boolean,
  ) => Promise<ResponseType>;
  getMerchantProgramsGroupName: () => Promise<ResponseType>;
  cloneManyPrograms: (body: {
  clonePrograms: (body: {
    groupName: string;
    programPks: string[];
  }) => Promise<ResponseType>;
@@ -48,7 +48,7 @@ const ProgramForm = (props: ProgramFormProps) => {
    setProgramLogs,
    getAllMerchantPrograms,
    getMerchantProgramsGroupName,
    cloneManyPrograms,
    clonePrograms,
    hasManageProgramGroupsPermission,
  } = props;

@@ -106,7 +106,7 @@ const ProgramForm = (props: ProgramFormProps) => {
                label: pg,
              }))}
              setIsShowFormBehind={setIsShowFormEnabled}
              cloneManyPrograms={cloneManyPrograms}
              clonePrograms={clonePrograms}
            />
          )}
        </div>
 domain/stores/program.tsx 
+
2
−
2

Visualizado
@@ -88,11 +88,11 @@ export class ProgramStore extends BaseStore {
  };

  @action
  cloneManyPrograms = async (body: any): Promise<ResponseType> => {
  clonePrograms = async (body: any): Promise<ResponseType> => {
    const utilityStore = this.rootStore?.utilityStore;
    const response = await utilityStore?.sendRequest({
      method: 'POST',
      url: '/uown/cloneManyPrograms',
      url: '/uown/clonePrograms',
      data: body,
      isHandleLoader: true,
    });

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


Comparar
e
 1 arquivo
+
2
−
0
 src/main/java/com/uownleasing/ams/environment/Uown.java 
+
2
−
0

Visualizado
@@ -306,6 +306,7 @@ public class Uown extends EnvironmentService {

                {"merchant programs [access]", "access", "programs", "", ""},
                {"merchant programs [modify]", "modify", "programs/create_or_update_program", "", ""},
                {"manage program groups [modify]", "modify", "programs/manage_program_groups", "", ""},
                {"get merchant programs [access]", "modify", "programs/get_all_merchant_programs", "", ""},

                {"lead_status_denied_to_approved [restricted/modify]", "restricted/modify", "lead_status_denied_to_approved", "", ""},
@@ -689,6 +690,7 @@ public class Uown extends EnvironmentService {

                    "merchant programs [access]",
                    "merchant programs [modify]",
                    "manage program groups [modify]",
                    "get merchant programs [access]",

                    "lead_status_denied_to_approved [restricted/modify]",

---


 8 arquivos
+
361
−
1
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/
‎uownleasing/svc‎

db/rep
‎ository‎

MerchantProg
‎ramRepo.java‎
+4 -0

po
‎jo‎

CloneProgram
‎sRequest.java‎
+15 -0

re
‎st‎

AdminContr
‎oller.java‎
+5 -0

ser
‎vice‎

MerchantProgr
‎amService.java‎
+50 -0

uti
‎lity‎

MerchantProgr
‎amMapper.java‎
+26 -0

test/java/com/
‎uownleasing/svc‎

MerchantFunding
‎ServiceTest.java‎
+1 -1

MerchantProgram
‎MapperTest.java‎
+64 -0

MerchantProgram
‎ServiceTest.java‎
+196 -0

 src/main/java/com/uownleasing/svc/db/repository/MerchantProgramRepo.java 
+
4
−
0

Visualizado
@@ -4,6 +4,7 @@ import com.uownleasing.svc.db.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

@@ -40,6 +41,9 @@ public interface MerchantProgramRepo extends JpaRepository<MerchantProgram, Long
        "WHERE ((:search IS NULL) or (:search IS NOT NULL and mp.program_name ilike CAST(:search AS VARCHAR)))", nativeQuery = true)
    Page<MerchantProgram> findAllMerchantProgramsBySearch(String search,  Pageable pageable);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM uown_merchant_program mp WHERE mp.group_name = :groupName)", nativeQuery = true)
    boolean existsByGroupName(@Param("groupName") String groupName);

    @Query(value = "SELECT mp.* FROM uown_merchant_program mp " +
        "JOIN uown_merchant_to_program mtp on mp.pk = mtp.program_pk and is_active = true " +
        "JOIN uown_merchant m on m.pk = :merchantPk and m.pk = mtp.merchant_pk and m.is_active = true and m.is_deleted = false " +
 src/main/java/com/uownleasing/svc/pojo/CloneProgramsRequest.java  0 → 100644
+
15
−
0

Visualizado
package com.uownleasing.svc.pojo;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
public class CloneProgramsRequest {
    private List<Long> programPks;
    private String groupName;
}
 src/main/java/com/uownleasing/svc/rest/AdminController.java 
+
5
−
0

Visualizado
@@ -263,6 +263,11 @@ public class AdminController {
        return merchantProgramService.findDistinctGroupNames();
    }

    @PostMapping(value="/clonePrograms")
    public void cloneManyPrograms(@RequestBody CloneProgramsRequest request){
        merchantProgramService.cloneManyPrograms(request.getProgramPks(), request.getGroupName());
    }

    @PostMapping("/updateMerchants")
    public void updateMerchants(@RequestBody MerchantsUpdateRequest request) {
        merchantService.updateMerchants(request);
 src/main/java/com/uownleasing/svc/service/MerchantProgramService.java 
+
50
−
0

Visualizado
@@ -7,6 +7,7 @@ import com.uownleasing.svc.db.repository.*;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.rest.MerchantProgramSearchResult;
import com.uownleasing.svc.utility.MerchantProgramMapper;
import lombok.*;
import lombok.extern.slf4j.*;
import org.apache.commons.lang3.*;
@@ -17,6 +18,7 @@ import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@@ -60,6 +62,40 @@ public class MerchantProgramService {
        return merchantProgram;
    }


    public void cloneManyPrograms(List<Long> programPks, String groupName) {
        if (StringUtils.isBlank(groupName)) {
            throw new SvcException("Program group cannot be empty.");
        }

        if (programPks.isEmpty()) {
            throw new SvcException("Select at least one merchant program to clone.");
        }

        if (merchantProgramRepo.existsByGroupName(groupName)) {
            throw new SvcException("A program group with this name already exists.");
        }

        var merchantPrograms = cloneMerchantPrograms(programPks, groupName);

        var merchantProgramsCreated = merchantProgramRepo.saveAllAndFlush(merchantPrograms);

        String programPksForLog = merchantProgramsCreated.stream()
            .map(mp -> String.valueOf(mp.getProgramInfo().getProgramPk()))
            .collect(Collectors.joining(", "));

        merchantLogService.createMerchantActivityLog(
            null,
            null,
            LogType.PROGRAM_DATA_CHANGE,
            String.format("Programs [%s] created and assigned to group %s", programPksForLog, groupName),
            null,
            null,
            null,
            ThreadAttributes.getUsername()
        );
    }

    public List<MerchantProgram> getMerchantProgramByMerchantPk(long merchantPk) {
        return merchantProgramRepo.findByMerchantPk(merchantPk);
    }
@@ -97,4 +133,18 @@ public class MerchantProgramService {
        state = "%" + state + "%";
        return merchantProgramRepo.findAllProgramsBySearchAndClientType(search, state, merchantPk);
    }

    private List<MerchantProgram> cloneMerchantPrograms(List<Long> programsPk, String groupName) {
        List<MerchantProgram> merchantPrograms = new ArrayList<>();

        for (var programPk : programsPk) {

        var programToClone = merchantProgramRepo.findByPk(programPk);

        var newProgram = MerchantProgramMapper.clone(programToClone, groupName);

        merchantPrograms.add(newProgram);
        }
        return merchantPrograms;
    }
}

---


 8 arquivos
+
728
−
205
Arquivos
8
Pesquisar (por exemplo, *.vue) (F)

compo
‎nents‎

clone-
‎program‎

inde
‎x.tsx‎
+45 -8

clone-pro
‎gram-group‎

index.mo
‎dule.scss‎
+105 -0

inde
‎x.tsx‎
+293 -0

progra
‎m-form‎

inde
‎x.tsx‎
+246 -193

domain
‎/stores‎

progr
‎am.tsx‎
+19 -1

pages/p
‎rograms‎

inde
‎x.tsx‎
+12 -2

ut
‎ils‎

data-table-
‎columns.tsx‎
+7 -0

serv
‎er.js‎
+1 -1

 components/clone-program/index.tsx 
+
45
−
8

Visualizado
@@ -8,7 +8,7 @@ import {
  Options,
  ResponseType,
} from '@uownleasing/common-ui';
import {FormikProps} from 'formik';
import {FormikProps, useFormik} from 'formik';
import {convertStringToOptionType} from '@utils/helper';

export interface ProgramInfo {
@@ -35,6 +35,7 @@ export interface ProgramInfo {
  states: string;
  processingFeeOverride: number | null;
  amountChargedAtSigning: number;
  groupName?: string;
}

interface FormValues {
@@ -71,27 +72,37 @@ interface CloneProgramProps {
    isGetAll?: boolean,
  ) => Promise<ResponseType>;
  formik: FormikProps<FormValues>;
  programGroups: string[];
}

export const CloneProgram = ({
  getAllMerchantPrograms,
  formik,
  programGroups,
}: CloneProgramProps) => {
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [programs, setAllPrograms] = useState<ResponseData[]>([]);
  const [programToclone, setProgramToClone] = useState<ProgramInfo | null>(
    null,
  );

  const [searchValue, setSearchValue] = useState('');

  const groupNameFilterFormik = useFormik({
    initialValues: {groupName: ''},
    onSubmit: () => {},
  });

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) =>
      program.programInfo.programName
        ?.toLowerCase()
        .includes(searchValue.toLowerCase()),
    return programs.filter(
      (program) =>
        program.programInfo.programName
          ?.toLowerCase()
          .includes(searchValue.toLowerCase()) &&
        (groupNameFilterFormik.values.groupName
          ? program.programInfo.groupName === groupNameFilterFormik.values.groupName
          : true),
    );
  }, [programs, searchValue]);
  }, [programs, searchValue, groupNameFilterFormik.values.groupName]);

  const getAllMerchPrograms = useCallback(
    async (
@@ -140,7 +151,20 @@ export const CloneProgram = ({
    <div className="d-flex">
      <DropdownButton
        isOpen={isCloneModalOpen}
        toggle={() => setIsCloneModalOpen((previous) => !previous)}
        toggle={(e) => {
          // Ignore clicks on filter options and scroll manager elements,
          // and only toggle the modal when the click is outside <body>.
          if (
            e.target?.className?.includes &&
            (e.target.className.includes('filter__option') ||
              e.target.className.includes('ScrollManager') ||
              e.target.className.includes('css-'))
          )
            return;
          if (e.target.localName !== 'body') {
            setIsCloneModalOpen((previous) => !previous);
          }
        }}
        persist
        isNav
        className={classNames(
@@ -155,6 +179,19 @@ export const CloneProgram = ({
          className={styles?.dropdownContainer__item}
          toggle={false}
          onClick={(e) => e?.preventDefault()}>
          <InputField
            style={{marginBottom: '1rem'}}
            formik={groupNameFilterFormik}
            name="groupName"
            label="Program Group"
            type="select"
            options={programGroups?.map((pg) => ({
              key: pg,
              value: pg,
              label: pg,
            }))}
          />
          <div style={{marginTop: '1rem'}}></div>
          <InputField
            name="search"
            placeholder="Search..."

---


Comparar
e
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

O sistema deve exibir o modal de clonagem de grupo ao clicar no botão "Clone Group".
The system should display the group cloning modal when clicking the "Clone Group" button.

O sistema deve ocultar o formulário de programa quando o modal de clonagem é aberto.
The system should hide the program form when the cloning modal is opened.

O sistema deve fechar o modal de clonagem ao clicar no botão "Save".
The system should close the cloning modal when clicking the "Save" button.

O sistema deve exibir novamente o formulário de programa após fechar o modal de clonagem.
The system should display the program form again after closing the cloning modal.

O sistema deve validar que o campo "Program Group Name" é obrigatório antes de permitir o clone.
The system should validate that the "Program Group Name" field is required before allowing the clone.

O sistema deve desabilitar o botão "Save" quando o campo "Program Group Name" está vazio.
The system should disable the "Save" button when the "Program Group Name" field is empty.
➡️ **Não está desabilitando o botão.**
➡️ **Not disabling the button.**

O sistema deve habilitar o botão "Save" quando o campo "Program Group Name" está preenchido.
The system should enable the "Save" button when the "Program Group Name" field is filled.
➡️ **Não está desabilitando o botão.**
➡️ **Not disabling the button.**

O sistema deve permitir selecionar múltiplos programas da lista.
The system should allow selecting multiple programs from the list.

O sistema deve marcar todos os programas quando a checkbox "Select All" é ativada.
The system should check all programs when the "Select All" checkbox is activated.

O sistema deve desmarcar todos os programas quando a checkbox "Select All" é desativada.
The system should uncheck all programs when the "Select All" checkbox is deactivated.

O sistema deve exibir a lista de programas filtrados pelo grupo selecionado no dropdown "Program Group".
The system should display the list of programs filtered by the selected group in the "Program Group" dropdown.

O sistema deve nomear cada programa clonado seguindo o formato: originalProgramName + "*" + newGroupName.
The system should name each cloned program following the format: originalProgramName + "*" + newGroupName.

O sistema deve criar registros clonados no banco de dados com todos os campos idênticos ao original, exceto **pk**, **merchantPrograms**, **rowCreatedTimestamp** e **rowUpdatedTimestamp**.
The system should create cloned records in the database with all fields identical to the original, except **pk**, **merchantPrograms**, **rowCreatedTimestamp**, and **rowUpdatedTimestamp**.

O sistema deve impedir a clonagem com nome de grupo que já existe no banco de dados.
The system should prevent cloning with a group name that already exists in the database.

O sistema deve exibir uma mensagem de erro quando o nome do grupo já está em uso.
The system should display an error message when the group name is already in use.

O sistema deve copiar todos os atributos do programa original para o programa clonado, incluindo **ProgramInfo**.
The system should copy all attributes from the original program to the cloned program, including **ProgramInfo**.

O sistema deve buscar corretamente todos os grupos de programas disponíveis do backend.
The system should correctly fetch all available program groups from the backend.

O sistema deve exibir o dropdown "Program Group" no modal de clonagem.
The system should display the "Program Group" dropdown in the cloning modal.

O sistema deve filtrar corretamente a lista de programas conforme o grupo selecionado no dropdown.
The system should correctly filter the program list according to the selected group in the dropdown.

O sistema deve manter a funcionalidade de busca por nome de programa enquanto filtra por grupo.
The system should maintain the program name search functionality while filtering by group.

O sistema deve criar um log de atividade quando programas forem clonados com sucesso.
The system should create an activity log when programs are successfully cloned.

O sistema deve registrar no log o **ProgramPk** dos programas criados e o nome do grupo.
The system should record in the log the **ProgramPk** of the created programs and the group name.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin

> **The system should display the group cloning modal when clicking the "Clone Group" button**

> ![Screenshot_at_Oct_24_11-43-38](/uploads/e31d3c053061cc848d748920b2a68621/Screenshot_at_Oct_24_11-43-38.png)
> ![Screenshot_at_Oct_24_11-43-58](/uploads/05e838dcf27169f30370cab69853487e/Screenshot_at_Oct_24_11-43-58.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should hide the program form when the cloning modal is opened**

> ![Screenshot_at_Oct_24_11-44-36](/uploads/f70c02b8f416177ce7e72f0f01a96ddb/Screenshot_at_Oct_24_11-44-36.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should close the cloning modal when clicking the "Save" button**
> ![image](/uploads/a3dc0d1ef74fe024ad86cba286407968/image.png)
> **| PASS |**
> ```


> ```gherkin

> **The system should display the program form again after closing the cloning modal**

> ![image](/uploads/d5e6f5f49baadebd4669ad3aba60d878/image.png)
> ![image](/uploads/a3b4b5529403b0196052bea9907e8d5b/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should validate that the "Program Group Name" field is required before allowing the clone**

> ![Screenshot_at_Oct_24_11-51-49](/uploads/30a8cc17f76bc31f3aa06a74e213c7b2/Screenshot_at_Oct_24_11-51-49.png)
> ![Screenshot_at_Oct_24_11-52-35](/uploads/9d5675c30ae31df25bb0764096425954/Screenshot_at_Oct_24_11-52-35.png)
> ![Screenshot_at_Oct_24_11-52-53](/uploads/0a1741edef74fa1cc67a677db1f333c8/Screenshot_at_Oct_24_11-52-53.png)
> ![Screenshot_at_Oct_24_11-53-09](/uploads/60ace0f28ef81430d7b37316ec24651b/Screenshot_at_Oct_24_11-53-09.png)
> ![Screenshot_at_Oct_24_11-53-09](/uploads/327c5060349119e7d2ade203e4bc7372/Screenshot_at_Oct_24_11-53-09.png)
> ![Screenshot_at_Oct_24_11-53-18](/uploads/afbcbd5c7914f1d152fdc7f1856d7ec9/Screenshot_at_Oct_24_11-53-18.png)
> ![Screenshot_at_Oct_24_11-53-28](/uploads/62011077d9be1aef7f78048f341e15df/Screenshot_at_Oct_24_11-53-28.png)

> **| PASS |**
> ```

---

> ```gherkin

> **The system should disable the "Save" button when the "Program Group Name" field is empty**

> ![Screenshot_at_Oct_24_11-49-31](/uploads/2e3005d9941954c7783080b302aab034/Screenshot_at_Oct_24_11-49-31.png)

> **| ERROR |** 
> @davi.artur.gow  Not disabling the save button.
> ```


> The system should enable the "Save" button when the "Program Group Name" field is filled.
> ```gherkin

> ** **

> ![image](/uploads/6cc363a1eecd4f34532c15276dfa4ff3/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should allow selecting multiple programs from the list**

> ![Screenshot_at_Oct_24_11-51-18](/uploads/4dbc756f2629cb1368f788e9740cf45d/Screenshot_at_Oct_24_11-51-18.png)
> ![Screenshot_at_Oct_24_11-51-49](/uploads/5d4ca373f8f83b271b2231f58f5e7951/Screenshot_at_Oct_24_11-51-49.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should check all programs when the "Select All" checkbox is activated**

> ![Screenshot_at_Oct_24_11-45-28](/uploads/de173a4ca2b5abe6f8c4fef9b7e3e7e4/Screenshot_at_Oct_24_11-45-28.png)
> ![Screenshot_at_Oct_24_11-51-49](/uploads/6ba63f1be502678480b785ca562ce252/Screenshot_at_Oct_24_11-51-49.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should uncheck all programs when the "Select All" checkbox is deactivated**

> ![image](/uploads/c0cbd39b4eff5adbaa05f1ce47165bec/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should display the list of programs filtered by the selected group in the "Program Group" dropdown**

> ![Screenshot_at_Oct_24_11-52-35](/uploads/efcee7ad524d9cd83a64215faa451290/Screenshot_at_Oct_24_11-52-35.png)
> ![Screenshot_at_Oct_24_11-52-53](/uploads/4371826009894603f4b41db2be0cc1a0/Screenshot_at_Oct_24_11-52-53.png)
> ![Screenshot_at_Oct_24_11-53-09](/uploads/54cc80998718c4c8a9524f026c473f35/Screenshot_at_Oct_24_11-53-09.png)
> ![Screenshot_at_Oct_24_11-53-18](/uploads/fd1fb63b7ab008f10584c36ae5a5c5e2/Screenshot_at_Oct_24_11-53-18.png)
> ![Screenshot_at_Oct_24_11-53-28](/uploads/545f50df85509faf66bdfc68fd2e8168/Screenshot_at_Oct_24_11-53-28.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should name each cloned program following the format: originalProgramName + "_" + newGroupName**

> ![image](/uploads/41976c35dd3e9c636d5f04dc852693ba/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should create cloned records in the database with all fields identical to the original, except pk, merchantPrograms, rowCreatedTimestamp, and rowUpdatedTimestamp**
>
> **| PASS |**
> ```


> ```gherkin

> **The system should prevent cloning with a group name that already exists in the database**

> ![image](/uploads/d4c024e614414d1a128ffdaec25de088/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should display an error message when the group name is already in use**

> ![Screenshot_at_Oct_24_11-54-59](/uploads/b7768be7b00516f65703060162f13796/Screenshot_at_Oct_24_11-54-59.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should copy all attributes from the original program to the cloned program, including ProgramInfo**

> ![Screenshot_at_Oct_24_13-03-06](/uploads/5a3692dbd7ccb14c42b213ed3f66c97e/Screenshot_at_Oct_24_13-03-06.png)
> ![Screenshot_at_Oct_24_13-03-19](/uploads/4eab1cd9c3f3ddad87fe19de3212f96c/Screenshot_at_Oct_24_13-03-19.png)
> ![Screenshot_at_Oct_24_13-03-37](/uploads/1a246c909f439233bab881df184a554a/Screenshot_at_Oct_24_13-03-37.png)

> **| PASS |**
> ```

> ```gherkin

> **The system should correctly filter the program list according to the selected group in the dropdown**

> ![Screenshot_at_Oct_24_11-52-53](/uploads/17a9e0b5243fffb18e55f56625c40d28/Screenshot_at_Oct_24_11-52-53.png)
> ![Screenshot_at_Oct_24_11-53-09](/uploads/56bb4eec29586559307f8b5a5171aba0/Screenshot_at_Oct_24_11-53-09.png)
> ![Screenshot_at_Oct_24_11-53-18](/uploads/6b77056085b17ed77efd89e7d3d5d5d6/Screenshot_at_Oct_24_11-53-18.png)
> ![Screenshot_at_Oct_24_11-53-28](/uploads/da52911ebbd625f679fea594287787ba/Screenshot_at_Oct_24_11-53-28.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should correctly filter the program list according to the selected group in the dropdown**
>
> **| PASS |**
> ```


> ```gherkin

> **The system should create an activity log when programs are successfully cloned**

> ![image](/uploads/3c41a885a2d44fbdaaead206e91219e7/image.png)

> **| PASS |**
> ```


> ```gherkin

> **The system should record in the log the ProgramPk of the created programs and the group name**

> ![image](/uploads/83df7d872f2721f09f04788af92b7ba3/image.png)

> **| PASS |**
> ```

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg

> ```gherkin

> **The system should display the group cloning modal when clicking the "Clone Group" button**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should hide the program form when the cloning modal is opened**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should close the cloning modal when clicking the "Save" button**
> 

> ```


> ```gherkin

> **The system should display the program form again after closing the cloning modal**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should validate that the "Program Group Name" field is required before allowing the clone**

> 

> **| PASS |**
> ```

---

> ```gherkin

> **The system should disable the "Save" button when the "Program Group Name" field is empty**

> 

> **| ERROR |** 
> @davi.artur.gow  Not disabling the save button.

> **| PASS |** 
> Now, when the name of the new program group is not entered, the user cannot save.

> 

> **| PASS |** 
> ```


> The system should enable the "Save" button when the "Program Group Name" field is filled.
> ```gherkin

> ** **

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should allow selecting multiple programs from the list**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should check all programs when the "Select All" checkbox is activated**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should uncheck all programs when the "Select All" checkbox is deactivated**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should display the list of programs filtered by the selected group in the "Program Group" dropdown**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should name each cloned program following the format: originalProgramName + "_" + newGroupName**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should create cloned records in the database with all fields identical to the original, except pk, merchantPrograms, rowCreatedTimestamp, and rowUpdatedTimestamp**
>
> **| PASS |**
> ```


> ```gherkin

> **The system should prevent cloning with a group name that already exists in the database**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should display an error message when the group name is already in use**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should copy all attributes from the original program to the cloned program, including ProgramInfo**

> 

> **| PASS |**
> ```

> ```gherkin

> **The system should correctly filter the program list according to the selected group in the dropdown**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should correctly filter the program list according to the selected group in the dropdown**
>
> **| PASS |**
> ```


> ```gherkin

> **The system should create an activity log when programs are successfully cloned**

> 

> **| PASS |**
> ```


> ```gherkin

> **The system should record in the log the ProgramPk of the created programs and the group name**

> 

> **| PASS |**
> ```

---


Programs [248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490] created and assigned to group CT Program