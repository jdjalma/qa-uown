-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1078

UOWN | Origination | Enable users to resume plaid application

# test instructions

The use should be able to reuse the application link to resume Plaid application if for whatever reason the application is interrupted

## expected behavior

| application situation                                           | lead status | internal status | expected screen            |
| --------------------------------------------------------------- | ----------- | --------------- | -------------------------- |
| user closes Plaid modal and reopens the link                    | UW_REVIEW   | PLAID_ABANDONED | submit plaid screen        |
| user submits plaid                                              | PENDING_UW  | PLAID_SUBMITTED | application expired screen |
| user closes application page before Plaid                       | NEW         | NEW             | submit application screen  |
| user closes application page while submitting plaid information | UW_REVIEW   | PLAID_PENDING   | submit plaid screen        |

-----

UOWN | Originação | Permitir que usuários retomem a aplicação Plaid

instruções de teste
O usuário deve conseguir reutilizar o link da aplicação para retomar o fluxo do Plaid caso, por qualquer motivo, a aplicação seja interrompida.

comportamento esperado
| situação da aplicação                                          | status do lead | status interno   | tela esperada              |
| -------------------------------------------------------------- | -------------- | ---------------- | -------------------------- |
| usuário fecha o modal do Plaid e reabre o link                 | UW\_REVIEW     | PLAID\_ABANDONED | tela de envio do Plaid     |
| usuário envia o Plaid                                          | PENDING\_UW    | PLAID\_SUBMITTED | tela de aplicação expirada |
| usuário fecha a página da aplicação antes do Plaid             | NEW            | NEW              | tela de envio da aplicação |
| usuário fecha a página da aplicação enquanto envia dados Plaid | UW\_REVIEW     | PLAID\_PENDING   | tela de envio do Plaid     |


-----

Alterações dev:
Visão geral 
20
Commits 
41
Pipelines 
19
Alterações 10
Abrir os tópicos 2
Comparar
e
 10 arquivos
+
133
−
13
Arquivos
10
Search (e.g. *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

con
‎fig‎

PlaidCon
‎fig.java‎
+4 -0

pojo
‎/rest‎

ApplicationSta
‎tusRequest.java‎
+0 -1

CanContinue
‎Request.java‎
+8 -0

CanContinueR
‎esponse.java‎
+16 -0

rest
‎/los‎

LosApplication
‎Controller.java‎
+8 -0

ser
‎vice‎

appli
‎cation‎

ContinueApplica
‎tionService.java‎
+69 -0

GetApplicationSt
‎atusService.java‎
+5 -6

SendApplicati
‎onService.java‎
+0 -1

pl
‎aid‎

PlaidSer
‎vice.java‎
+22 -3

Application
‎Service.java‎
+1 -2

 src/main/java/com/uownleasing/svc/service/application/SendApplicationService.java 
+
0
−
1

Visualizado
@@ -518,7 +518,6 @@ public class SendApplicationService {
        boolean isPlaidVerificationRequired = merchant.getMerchantInfo().getIsPlaidVerificationRequired();
        int plaidMinLambdaSegment = plaidConfig.getMinLambdaSegment();
        int plaidMaxLambdaSegment = plaidConfig.getMaxLambdaSegment();
        //Integer lambdaSegment = uwResponse.getLambdaSegment();
        boolean applicationApproved = response.getTransactionStatus().equalsIgnoreCase(AppApprovalStatus.APPROVED.getStatus());
        log.debug("Application Request Plaid isPlaidVerificationRequired:{} applicationApproved:{} lambdaSegment:{} minLambdaSegment:{} maxLambdaSegment:{}",
            isPlaidVerificationRequired, applicationApproved, lambdaSegment, plaidMinLambdaSegment, plaidMaxLambdaSegment);
 src/main/java/com/uownleasing/svc/service/plaid/PlaidService.java 
+
22
−
3

Visualizado
@@ -5,9 +5,13 @@ import com.fasterxml.jackson.databind.ObjectMapper;
import com.uownleasing.common.enumeration.EmailType;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.pojo.UWInfo;
import com.uownleasing.dms.common.util.ExceptionUtils;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.los.common.service.LosAddressService;
import com.uownleasing.los.common.service.LosCustomerService;
import com.uownleasing.los.common.service.LosEmailService;
import com.uownleasing.los.common.service.LosPhoneService;
import com.uownleasing.svc.config.LosOutboundCall;
import com.uownleasing.svc.config.PlaidConfig;
import com.uownleasing.svc.db.entity.PlaidUser;
@@ -26,6 +30,7 @@ import org.springframework.web.client.HttpServerErrorException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.uownleasing.svc.pojo.plaid.ConsumerReportPermissiblePurpose.EXTENSION_OF_CREDIT;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
@@ -57,18 +62,33 @@ public class PlaidService {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    public Boolean canContinuePlaid(LeadStatus applicationStatus, boolean isPlaidVerificationRequired, LosUWData losUWData) {
        Integer lambdaSegment = Optional.ofNullable(losUWData).map(LosUWData::getUwInfo).map(UWInfo::getLambdaSegment).orElse(null);
        int plaidMinLambdaSegment = plaidConfig.getMinLambdaSegment();
        int plaidMaxLambdaSegment = plaidConfig.getMaxLambdaSegment();
        log.debug("{} Application Request Plaid isPlaidVerificationRequired:{} applicationApproved:{}" +
                " lambdaSegment:{} minLambdaSegment:{} maxLambdaSegment:{}",
            LOG_SUFFIX, isPlaidVerificationRequired, applicationStatus, lambdaSegment, plaidMinLambdaSegment, plaidMaxLambdaSegment);
        return isPlaidVerificationRequired && lambdaSegment != null
            && (plaidMinLambdaSegment < lambdaSegment && lambdaSegment <= plaidMaxLambdaSegment)
            && applicationStatus.equals(LeadStatus.UW_REVIEW);
    }

    public void sendPlaidStatus(PlaidLinkEvent plaidLinkEvent) {
        String message = "";
        LosLead lead = leadService.getByLeadPk(plaidLinkEvent.getLeadPk());
        LeadStatus internalStatus = null;
        LeadStatus leadStatus = null;
        if (plaidLinkEvent.getEventName().equals(PlaidLinkEventType.ON_SUCCESS)) {
            message = "Awaiting webhook from Plaid.";
            leadStatus = LeadStatus.PENDING_UW;
            internalStatus = LeadStatus.PLAID_SUBMITTED;
        } else if (plaidLinkEvent.getEventName().equals(PlaidLinkEventType.ON_EXIT)) {
            message = "Plaid process abandoned by customer.";
            leadStatus = LeadStatus.UW_REVIEW;
            internalStatus = LeadStatus.PLAID_ABANDONED;
        }
        updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, internalStatus, LOG_SUFFIX + "[sendPlaidStatus] " + message, message, LogType.INTERNAL);
        updateLeadStatusService.updateLeadStatus(lead, leadStatus, internalStatus, LOG_SUFFIX + "[sendPlaidStatus] " + message, message, LogType.INTERNAL);
Marcos Silvano
Marcos Silvano
@marcos.pacheco.silva
3 dias atrás
Autor
Maintainer
scenarios	lead status	internal status	can continue application
set on sendApplication	UW_REVIEW	PLAID_PENDING	✅
set if any error in plaid process	UW_REVIEW	PLAID_ERROR	✅
set when Plaid user token is created	UW_REVIEW	PLAID_PENDING	✅
set when Plaid link token is created	UW_REVIEW	PLAID_IN_PROCESS	✅
set when the user after the user submits is application to Plaid	PENDING_UW*	PLAID_SUBMITTED	❌
set if users closes plaid modal	UW_REVIEW	PLAID_ABANDONED	✅
set if an errors occurs processing the webhook report	UW_ERROR	PLAID_ERROR	❓
set if the user is declined due to it's plaid score	UW_DENIED	PLAID_FAILED	❌
set if user is approved due to it's plaid score	UW_APPROVED	PLAID_SUCCESS	❌
I forgot to change the lead status when the PLAID_SUBMITTED

Editado 3 dias atrás por Marcos Silvano
Responder…
    }

    public void processWebhookEvent(PlaidWebhook webhook) {
@@ -167,7 +187,6 @@ public class PlaidService {
        user.setClientUserId(lead.getLeadInfo().getUuid());
        String ssnLast4 = losCustomer.getCustomerInfo().getSsn().substring(losCustomer.getCustomerInfo().getSsn().length() - 4);


        List<String> phones = losPhones.stream().map(phone -> phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber()).toList();
        user.setConsumerReportUserIdentity(losCustomer.getCustomerInfo().getFirstName(), losCustomer.getCustomerInfo().getLastName(),
            phones, losEmails.stream().map(e -> e.getEmailInfo().getEmailAddress()).toList(), ssnLast4, losCustomer.getCustomerInfo().getDateOfBirth().format(ISO_LOCAL_DATE));
 src/main/java/com/uownleasing/svc/service/ApplicationService.java 
+
1
−
2

Visualizado
@@ -95,7 +95,6 @@ public class ApplicationService {

    private final String configurationPath = "com.uownleasing.svc.service.ApplicationService";


    public ApplicationResponse createApplication(ApplicationRequest applicationRequest){
       return  sendApplicationService.createApplication(applicationRequest);
    }
@@ -169,7 +168,7 @@ public class ApplicationService {
    }

    public ApplicationStatusResponse getApplicationStatus(ApplicationStatusRequest request) {
        return  applicationStatusService.getApplicationStatus(request);
        return applicationStatusService.getApplicationStatus(request);
    }

    public String createApplication(@Valid String request) {

Visão geral 
2
Commits 
9
Pipelines 
7
Alterações 7
Todas os tópico foram resolvidos!
Comparar
e
 7 arquivos
+
201
−
73
Arquivos
7
Search (e.g. *.vue) (F)

compo
‎nents‎

plaid-bank-
‎verification‎

inde
‎x.tsx‎
+3 -3

send-appli
‎cation-form‎

inde
‎x.tsx‎
+63 -11

verify-ph
‎one-number‎

inde
‎x.tsx‎
+46 -35

domain
‎/stores‎

utili
‎ty.tsx‎
+29 -19

mod
‎els‎

can-continue-
‎application.ts‎
+11 -0

get-application-s
‎tatus-response.ts‎
+47 -5

serv
‎er.js‎
+2 -0

 components/verify-phone-number/index.tsx 
+
46
−
35

Visualizado
import companyLogoImg from '@images/company-logo-login.svg';
import {Button, InputField, ResponseType} from '@uownleasing/common-ui';
import {showToast, unformatPhoneAndCard} from '@uownleasing/common-utilities';
import classNames from 'classnames';
import {useFormik} from 'formik';
import Image from 'next/image';
import React from 'react';
import {Form} from 'reactstrap';
import * as Yup from 'yup';
import styles from './index.module.scss';
import Image from 'next/image';
import companyLogoImg from '@images/company-logo-login.svg';
import {showToast, unformatPhoneAndCard} from '@uownleasing/common-utilities';
import {Form} from 'reactstrap';

interface VerifyPhoneNumberProps {
  leadPk: number;
@@ -18,8 +18,11 @@ interface VerifyPhoneNumberProps {
  setPhoneVerified: (phoneVerified: boolean) => void;
}

const VerifyPhoneNumber = (props: VerifyPhoneNumberProps) => {
  const {leadPk, verifyPhoneNumber, setPhoneVerified} = props;
export const VerifyPhoneNumber: React.FC<VerifyPhoneNumberProps> = ({
  leadPk,
  verifyPhoneNumber,
  setPhoneVerified,
}) => {
  const formik = useFormik({
    initialValues: {
      phoneNumber: '',
@@ -31,8 +34,10 @@ const VerifyPhoneNumber = (props: VerifyPhoneNumberProps) => {
      const {phoneNumber = ''} = values;
      if (phoneNumber) {
        const convertedPhone = unformatPhoneAndCard(phoneNumber);
        const response = await verifyPhoneNumber(leadPk, convertedPhone);
        const {status, message, data} = response;
        const {status, message, data} = await verifyPhoneNumber(
          leadPk,
          convertedPhone,
        );

        if (status === 200 && data?.isPhoneVerified) {
          setPhoneVerified(data?.isPhoneVerified);
@@ -50,7 +55,38 @@ const VerifyPhoneNumber = (props: VerifyPhoneNumberProps) => {
      }
    },
  });
  return (
    <>
      <div className={classNames('mb-3', styles?.phonePageContainer__title)}>
        Personal Verification
      </div>

      <Form
        id="verify-phone-number-form"
        onSubmit={formik?.handleSubmit}
        className="d-flex align-items-md-center flex-column flex-md-row">
        Please enter the phone number you used for the application:
        <InputField
          data-nid-target="verifyPhoneNumber"
          className="mx-md-3 my-2 my-md-0"
          formik={formik}
          name="phoneNumber"
          type="phone-number"
          placeholder="(xxx) xxx-xxxx"
          maxLength={14}
        />
        <Button
          form="verify-phone-number-form"
          type="submit"
          buttonStyle="primary">
          CONTINUE
        </Button>
      </Form>
    </>
  );
};

const VerifyPhoneNumberWrapped: React.FC<VerifyPhoneNumberProps> = (props) => {
  return (
    <div className={classNames('min-vh-100', styles?.phonePageContainer)}>
      <div
@@ -66,36 +102,11 @@ const VerifyPhoneNumber = (props: VerifyPhoneNumberProps) => {
      <div className="p-4 d-flex flex-column w-100 h-100">
        <div
          className={classNames('p-4 w-100', styles?.phonePageContainer__body)}>
          <div
            className={classNames('mb-3', styles?.phonePageContainer__title)}>
            Personal Verification
          </div>

          <Form
            id="verify-phone-number-form"
            onSubmit={formik?.handleSubmit}
            className="d-flex align-items-md-center flex-column flex-md-row">
            Please enter the phone number you used for the application:
            <InputField
              data-nid-target="verifyPhoneNumber"
              className="mx-md-3 my-2 my-md-0"
              formik={formik}
              name="phoneNumber"
              type="phone-number"
              placeholder="(xxx) xxx-xxxx"
              maxLength={14}
            />
            <Button
              form="verify-phone-number-form"
              type="submit"
              buttonStyle="primary">
              CONTINUE
            </Button>
          </Form>
          <VerifyPhoneNumber {...props} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(VerifyPhoneNumber);
export default React.memo(VerifyPhoneNumberWrapped);
 domain/stores/utility.tsx 
+
29
−
19

Visualizado
@@ -27,6 +27,7 @@ import {
  PlaidLinkOnExitMetadata,
  PlaidLinkOnSuccessMetadata,
} from 'react-plaid-link';
import {CanContinueApplication} from 'models/can-continue-application';

interface SendRequestProps extends AxiosRequestConfig {
  isHandleLoader?: boolean;
@@ -288,31 +289,40 @@ export class UtilityStore extends BaseStore {
  @action
  getApplicationStatus = async (
    targetUuid?: string,
  ): Promise<GetApplicationStatusResponse> => {
    const uuid = targetUuid || this?.uuid || '';
  ): Promise<
    GetApplicationStatusResponse & {isCustomerAbleToSubmitApplication: boolean}
  > => {
    const response = await this?.sendRequest({
      method: 'POST',
      url: '/uown/los/getApplicationStatus',
      data: {
        uuid: uuid,
      },
      data: {uuid: targetUuid || this?.uuid || ''},
    });
    let isCustomerAbleToSubmitApplication = false;
    if (
      response?.status === 200 &&
      response?.data?.applicationFound &&
      !response?.data?.status &&
      !response?.data?.applicationSubmitted
    ) {
      isCustomerAbleToSubmitApplication = true;
    if (response.status !== 200) {
      return {
        applicationFound: false,
        applicationSubmitted: false,
        transactionStatus: '',
        isCustomerAbleToSubmitApplication: false,
      };
    }
    const getApplicationStatusResponse: GetApplicationStatusResponse = {
      isCustomerAbleToSubmitApplication: isCustomerAbleToSubmitApplication,
      refMerchantCode: response?.data?.refMerchantCode,
      leadPk: response?.data?.leadPk,
      requiresPlaidVerification: response?.data?.requiresPlaidVerification,
    return {
      ...(response?.data ?? {}),
      isCustomerAbleToSubmitApplication:
        response?.data?.applicationFound &&
        !response?.data?.applicationSubmitted,
    };
    return getApplicationStatusResponse;
  };

  @action
  canContinueApplication = async (
    targetUuid: string,
  ): Promise<Partial<CanContinueApplication>> => {
    const resp = await this.sendRequest({
      method: 'POST',
      url: '/uown/los/canContinueApplication',
      data: {uuid: targetUuid},
    });
    return resp.status === 200 ? resp.data : {};
  };

  @action
 models/can-continue-application.ts  0 → 100644
+
11
−
0

Visualizado
export type CanContinueApplication = {
  leadPk: number;
  leadFound: boolean;
  canContinueApplication: boolean;
  canContinuePlaid: boolean;
  verifyPhone: boolean;
  isApplicationApprovedOrBeyond?: boolean;
  merchantLocationName?: string;
  refMerchantCode?: string;
  customerFirstName?: string;
};
 models/get-application-status-response.ts 
+
47
−
5

Visualizado
export interface GetApplicationStatusResponse {
  isCustomerAbleToSubmitApplication: boolean;
  refMerchantCode: string;
  leadPk: number;
  requiresPlaidVerification: boolean;
export type GetApplicationStatusResponse = {
  transactionStatus: string;
  applicationFound: boolean;
  applicationSubmitted: boolean;

  applicationCreatedTimestamp?: string;

  customerFirstName?: string;
  customerLastName?: string;
  appUuid?: string;
  leadPk?: number;

  merchantInvoiceNumber?: string;
  totalInvoiceAmount?: number;

  currentStatus?: string;
  statusDescription?: string;

  hasSignedLease?: boolean;
  hasLeaseMod?: boolean;
  canContinue?: boolean;

  approvedAmount?: number;
  openToBuy?: number;
  accountBalance?: number;
  lastPayment?: number;

  lastPaymentDate?: string;
  paymentDueDate?: string;

  merchantName?: string;
  merchantProgramName?: string;
  merchantPk?: number;
  refMerchantCode?: string;
  locationId?: string; // only for v1

  fundRequestDateTime?: string;
  fundedDateTime?: string;

  amountToBeFunded?: number;
  merchantDiscountPercent?: number;
  merchantDiscountAmount?: number;
  merchantRebatePercent?: number;
  merchantRebateAmount?: number;
  merchantRebateType?: string;

  // lineItem: LineItemInfo[];
};
 server.js 
+
2
−
0

Visualizado
@@ -90,6 +90,7 @@ const amsURL = IS_SERVER ? process.env.AMS_URL : env.AMS_URL;

const unauthenticatedRoutes = [
  '/uown/los/getApplicationStatus',
  '/uown/los/canContinueApplication',
  '/uown/los/sendApplication',
  '/uown/los/getMissingRequiredFields',
  '/uown/los/getFinalizeApplicationFields',
@@ -122,6 +123,7 @@ const permissionsMapping = {
      '/authentication/verifyResetCode',
      '/authentication/completeReset',
      '/uown/los/getApplicationStatus',
      '/uown/los/canContinueApplication',
      '/uown/los/sendApplication',
      '/uown/los/getPlaidToken',
      '/uown/los/sendData',

In a few scenarios in plaid operations set the lead status to PENDING_UW to enable the applications to be resumed I'm setting the status as UW_REVIEW.
Following here is a table of lead and internal status and my vision if it shouldn't be allowed to resume the application



scenarios
lead status
internal status
can continue application




set on sendApplication
UW_REVIEW
PLAID_PENDING
✅


set if any error in plaid process
PENDING_UW
PLAID_ERROR

✅*


set when Plaid user token is created
PENDING_UW
PLAID_PENDING

✅*


set when Plaid link token is created
PENDING_UW
PLAID_IN_PROCESS

✅*


set when the user after the user submits is application to Plaid
PENDING_UW*
PLAID_SUBMITTED
❌


set if users closes plaid modal
UW_REVIEW
PLAID_ABANDONED
✅


set if an errors occurs processing the webhook report
UW_ERROR
PLAID_ERROR
✅


set if the user is declined due to it's plaid score
UW_DENIED
PLAID_FAILED
❌


set if user is approved due to it's plaid score
UW_APPROVED
PLAID_SUCCESS
❌




can continue application with asterisks aren't set to true without this change

Visão geral 
0
Commits 1
Pipelines 1
Alterações 1
Comparar
e
 1 arquivo
+
10
−
10
 src/main/java/com/uownleasing/svc/service/plaid/PlaidService.java 
+
10
−
10

Visualizado
@@ -116,19 +116,19 @@ public class PlaidService {
        if (!linkResponse.getStatusCode().is2xxSuccessful()) {
            String message = (String) linkResponse.getBody();
            log.error("{}{}Failed to create PLAID link token for user: {}", LOG_SUFFIX, logSuffix, message);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + " failure to generate token for PLAID", message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + " failure to generate token for PLAID", message, LogType.INTERNAL);
            return getMessageResponse(HttpStatus.INTERNAL_SERVER_ERROR, "failure to generate token for PLAID");
        }
        if (linkResponse.getBody() == null) {
            log.error("{}{}Unexpected response from PLAID when creating link token for leadPk: {}", LOG_SUFFIX, logSuffix, lead.getPk());
            String message = LOG_SUFFIX + logSuffix + " expected response generating link token for PLAID";
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, message, message, LogType.INTERNAL);
            return getMessageResponse(HttpStatus.INTERNAL_SERVER_ERROR, "expected response generating link token for PLAID");
        }

        log.debug("{}{} linkToken created for leadPk:{} with webhook url: {}", LOG_SUFFIX, logSuffix, lead.getPk(), webhookUrl);
        String linkToken = ((LinkTokenResponse) linkResponse.getBody()).getLinkToken();
        updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_IN_PROCESS, LOG_SUFFIX + logSuffix + " Plaid link token created", "Plaid link token created", LogType.INTERNAL);
        updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_IN_PROCESS, LOG_SUFFIX + logSuffix + " Plaid link token created", "Plaid link token created", LogType.INTERNAL);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("token", linkToken, "provider", "PLAID"));
    }

@@ -144,21 +144,21 @@ public class PlaidService {
        LosCustomer losCustomer = losCustomerService.getPrimaryCustomer(lead.getPk());
        if (losCustomer == null) {
            String message = messagePrefix + " personal information";
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, message);
        }

        List<LosPhone> losPhones = losPhoneService.getPhonesByLeadPk(lead.getPk());
        if (losPhones.isEmpty()) {
            String message = messagePrefix + " phone number";
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, message);
        }

        LosAddress losAddress = losAddressService.getHomeAddressForPrimaryCustomerForLead(lead.getPk());
        if (losAddress == null) {
            String message = messagePrefix + " address information";
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            throw new HttpServerErrorException(HttpStatus.BAD_REQUEST, message);
        }

@@ -178,7 +178,7 @@ public class PlaidService {
        if (!response.getStatusCode().is2xxSuccessful()) {
            String message = (String) response.getBody();
            log.error("{}{}Failed to create PLAID user for new lead: {}", LOG_SUFFIX, logSuffix, message);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + "Failed to create Plaid user", message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + "Failed to create Plaid user", message, LogType.INTERNAL);
            throw new HttpServerErrorException(response.getStatusCode(), "Something went wrong. Please contact Uown support.");
        }

@@ -186,7 +186,7 @@ public class PlaidService {
        if (userResponseBody == null || userResponseBody.getUserToken() == null) {
            log.error("{}{}Unexpected response from the PLAID createUser: {}", LOG_SUFFIX, logSuffix, response.getBody());
            String message = "Unexpected response from Plaid /user/create";
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please contact Uown support.");
        }

@@ -196,10 +196,10 @@ public class PlaidService {
        } catch (JsonProcessingException e) {
            String message = "Unable to parse user info sent to plaid, leadPk: " + lead.getPk();
            log.warn("{}{}{}", LOG_SUFFIX, logSuffix, message);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_ERROR, LOG_SUFFIX + logSuffix + message, message, LogType.INTERNAL);
            throw new HttpServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please contact Uown support.");
        }
        updateLeadStatusService.updateLeadStatus(lead, LeadStatus.PENDING_UW, LeadStatus.PLAID_PENDING, LOG_SUFFIX + logSuffix + " Plaid user created", "Plaid user created", LogType.INTERNAL);
        updateLeadStatusService.updateLeadStatus(lead, LeadStatus.UW_REVIEW, LeadStatus.PLAID_PENDING, LOG_SUFFIX + logSuffix + " Plaid user created", "Plaid user created", LogType.INTERNAL);
        return plaidUserRepo.save(new PlaidUser(lead.getPk(), userResponseBody.getUserId(), userResponseBody.getUserToken(), userInfo));
    }

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos de Teste – Funcionais (da tarefa)

O usuário deve conseguir reutilizar o link da aplicação para retomar o fluxo do Plaid caso a aplicação seja interrompida.
Se o usuário fechar o modal do Plaid e reabrir o link, o sistema deve exibir a tela de envio do Plaid (leadStatus = UW_REVIEW, internalStatus = PLAID_ABANDONED).
Se o usuário enviar o Plaid, o sistema deve exibir a tela de aplicação expirada (leadStatus = PENDING_UW, internalStatus = PLAID_SUBMITTED).
Se o usuário fechar a página da aplicação antes de abrir o Plaid, o sistema deve exibir a tela de envio da aplicação (leadStatus = NEW, internalStatus = NEW).
Se o usuário fechar a página da aplicação enquanto envia dados do Plaid, o sistema deve exibir a tela de envio do Plaid (leadStatus = UW_REVIEW, internalStatus = PLAID_PENDING).

Requisitos de Teste – Técnicos (das alterações dev)
O serviço deve permitir verificar se o usuário pode continuar a aplicação via endpoint /canContinueApplication, retornando corretamente os campos canContinueApplication e canContinuePlaid.

O serviço deve atualizar corretamente os status do lead e interno em cada cenário de Plaid:
Envio de aplicação: UW_REVIEW / PLAID_PENDING (pode continuar).
Erro no processo Plaid: UW_REVIEW / PLAID_ERROR (pode continuar).
Criação de token de usuário Plaid: UW_REVIEW / PLAID_PENDING (pode continuar).
Criação de link token Plaid: UW_REVIEW / PLAID_IN_PROCESS (pode continuar).
Usuário envia a aplicação ao Plaid: PENDING_UW / PLAID_SUBMITTED (não pode continuar).
Usuário fecha o modal Plaid: UW_REVIEW / PLAID_ABANDONED (pode continuar).
Erro no webhook Plaid: UW_ERROR / PLAID_ERROR (avaliar se pode continuar).
Usuário é recusado por score Plaid: UW_DENIED / PLAID_FAILED (não pode continuar).
Usuário é aprovado por score Plaid: UW_APPROVED / PLAID_SUCCESS (não pode continuar).

O método PlaidService.canContinuePlaid() deve respeitar as regras de:
isPlaidVerificationRequired = true
lambdaSegment dentro dos limites configurados (plaidMinLambdaSegment < λ ≤ plaidMaxLambdaSegment)
applicationStatus = UW_REVIEW
Logs (log.debug, log.error, log.warn) devem registrar mensagens adequadas para cada cenário (abandoned, submitted, in process, error).

O endpoint /getApplicationStatus deve retornar o campo isCustomerAbleToSubmitApplication corretamente de acordo com:
applicationFound = true e applicationSubmitted = false → true.
Caso contrário → false.

O fluxo de criação de usuário Plaid deve validar dados obrigatórios (customer info, phone, address). Em caso de ausência, deve:
Atualizar status para UW_REVIEW / PLAID_ERROR.
Retornar erro HTTP adequado (400 ou 500).

O front-end deve:
Exibir tela correta de acordo com o par de status recebido da API.
Tratar corretamente a chamada canContinueApplication para habilitar ou não a retomada do processo.
Garantir que verifyPhoneNumber funcione integrando o novo contrato (leadPk, convertedPhone).

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------