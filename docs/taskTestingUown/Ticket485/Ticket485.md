------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/485

deploy steps
Run this command to create the templates

curl --location 'https://svc-{{env}}.uownleasing.com/uown/loadTemplates?company=KORNERSTONE' \
--header 'Content-Type: application/json' \
--header 'Authorization: <AUTH_TOKEN>' \
--data '[
"KORNERSTONE_CustomerPortalReminderEmail",
"KORNERSTONE_Delinquency60DayOfferEmail",
"KORNERSTONE_PaidInFullEmail",
"KORNERSTONE_SettledInFullEmail",
"KORNERSTONE_DaysPastDueMonthlyEmail",
"KORNERSTONE_Delinquency90DayOfferEmail",
"KORNERSTONE_PaymentDeclineEmail",
"KORNERSTONE_Delinquency150DayOfferEmail",
"KORNERSTONE_DelinquencyReminderEmail",
"KORNERSTONE_PaymentReceiptEmail",
"KORNERSTONE_Delinquency30DayOfferEmail",
"KORNERSTONE_FirstPaymentDefaultEmail",
"KORNERSTONE_SecondLease-PaidOff",
"KORNERSTONE_RecurringPaymentReminder",
"KORNERSTONE_RecurringPaymentReminderSms",
"KORNERSTONE_PaymentDeclineSms",
"KORNERSTONE_DaysPastDueMonthlySms",
"KORNERSTONE_Delinquency60DayOfferSms",
"KORNERSTONE_Delinquency90DayOfferSms",
"KORNERSTONE_Delinquency150DayOfferSms",
"KORNERSTONE_CustomerPortalReminderSms"
]'

UOWN | Servicing | Modify templates’ header and content to reflect KS for accounts with companyId Kornerstone

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 2 arquivos
+
6
−
0
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/com/uo
‎wnleasing/dms/common‎

db/
‎repo‎

Template
‎Repo.java‎
+2 -0

ser
‎vice‎

TemplateSe
‎rvice.java‎
+4 -0

 src/main/java/com/uownleasing/dms/common/db/repo/TemplateRepo.java 
+
2
−
0

Visualizado
@@ -11,6 +11,8 @@ public interface TemplateRepo extends JpaRepository<Template, Long> {

    Optional<Template> findByTemplateInfo_TemplateNameIgnoreCaseAndTemplateInfo_Current(String name , Boolean isCurrent);

    Optional<Template> findByTemplateInfo_TemplateNameIgnoreCaseAndTemplateInfo_CurrentAndTemplateInfo_ClientTypeIgnoreCase(String name, Boolean isCurrent, String clientType);

    Optional<Template> findByTemplateInfo_TemplateNameIgnoreCaseAndTemplateInfo_VersionNumber(String name , long versionNumber);

    List<Template> findAllByTemplateInfo_Current(Boolean current);
 src/main/java/com/uownleasing/dms/common/service/TemplateService.java 
+
4
−
0

Visualizado
@@ -78,6 +78,10 @@ public class TemplateService {
        return templateRepo.findByTemplateInfo_TemplateNameIgnoreCaseAndTemplateInfo_Current(templateName,true).orElse(null);
    }

    public Template getCurrentTemplateByNameAndClientType(String templateName, String clientType) {
        return templateRepo.findByTemplateInfo_TemplateNameIgnoreCaseAndTemplateInfo_CurrentAndTemplateInfo_ClientTypeIgnoreCase(templateName, true, clientType).orElse(null);
    }

    public List<Template> getAllCurrentTemplates(){
        List<Template> templates = templateRepo.findAllByTemplateInfo_Current(true);
        return CollectionUtils.isEmpty(templates) ? null : templates;

---

 19 arquivos
+
4960
−
4
Arquivos
19
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

rest
‎/svc‎

SvcSweepsCon
‎troller.java‎
+0 -1

ser
‎vice‎

Correspondenc
‎eService.java‎
+1 -0

resources/corresp
‎ondence/templates‎

korne
‎rstone‎

customer-portal-r
‎eminder-email.html‎
+303 -0

days-past-due-mo
‎nthly-email.html‎
+328 -0

delinquency-150-da
‎y-offer-email.html‎
+330 -0

delinquency-30-da
‎y-offer-email.html‎
+343 -0

delinquency-60-da
‎y-offer-email.html‎
+330 -0

delinquency-90-da
‎y-offer-email.html‎
+330 -0

delinquency-rem
‎inder-email.html‎
+328 -0

first-payment-de
‎fault-email.html‎
+323 -0

paid-in-ful
‎l-email.html‎
+338 -0

payment-decli
‎ne-email.html‎
+322 -0

payment-recei
‎pt-email.html‎
+447 -0

recurring-payment-
‎reminder-email.html‎
+349 -0

second-lease-opportun
‎ity-paid-account.html‎
+546 -0

settled-in-fu
‎ll-email.html‎
+339 -0

 src/main/java/com/uownleasing/svc/service/CorrespondenceService.java 
+
1
−
0

Visualizado
@@ -75,6 +75,7 @@ public class CorrespondenceService {
        Map<String, Object> dataMap = new HashMap<>();
        try {
            Template template = templateService.getCurrentTemplateByName(correspondenceRequest.getTemplateName());

            checkRules(correspondenceRequest);
            log.debug("TEMPLATE {}", template);

 src/main/resources/correspondence/templates/kornerstone/customer-portal-reminder-email.html  0 → 100644
+
303
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Customer Portal Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>

    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">Getting started with your lease-to-own purchase plan is easy - at <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank"><span
        style="color:#8FC31F;"><span style="font-size: 14px">kornerstonecredit.com</span></span></strong></a> you can
        view your account details, update important information, make a payment, and more. All you need is your <span
          style="color:#8FC31F;"><span style="font-size: 14px">email address or mobile number</span></span> to receive
        your verification code and be on your way to managing your account with ease.
      </div>
    </div>
    <div style="
      overflow: visible;
      background-color: #8FC31F;
	  padding: 15px 0;
	  font-family: Helvetica Neue;
	  border-radius: 10px;
	  margin: auto;
	  width: 220px;
    ">
      <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" ;
         style="text-decoration:none;">
        <button
          style="font-size: 20px; color: white; cursor: pointer; display: block; background: transparent; border: none; width: 100%; text-align:center">
        <span style="font-size: 20px; color: white; display: block; text-align:center">
          GO TO THE PORTAL
        </span>
        </button>
      </a>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
	      text-decoration: none;
      ">
        <a target="_blank" th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" ;
           style="text-decoration: none">www.kornerstoneliving.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/days-past-due-monthly-email.html  0 → 100644
+
328
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Days Past Due Monthly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Dear, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br>We have made several attempts to reach you by phone, email and text. Your account <span
        th:text=" ${CommonDataPojo.accountPK}"></span> is now over <span
        th:text=" ${CommonDataPojo.daysDelinquent}"></span> days past due.
        <br><br> It is imperative that you reach out to our Account Management Department at <a href="tel:877-357-5474">877-357-5474</a>
        to make your payment. You may also make your payment online by visiting <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/delinquency-150-day-offer-email.html  0 → 100644
+
330
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Offers 150+ days Weekly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Hi, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br>Take advantage of the 75% discount off your account <span th:text=" ${CommonDataPojo.accountPK}"></span>
        balance to close out. Great opportunity to settle your debt and stop collection activity. This means you only
        need to pay $<span th:text=" ${CommonDataPojo.balance}"></span>, if you settle this month.
        <br><br>Please go online to <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to pay the reduced lump sum payment of $<span th:text=" ${CommonDataPojo.balance}"></span> or call our account
        management department at <a href="tel:877-357-5474">877-357-5474</a> for more options.
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/delinquency-30-day-offer-email.html  0 → 100644
+
343
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Offers 31 to 60 days Weekly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Hi, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br>Your account <span th:text=" ${CommonDataPojo.accountPK}"></span> with Uown Leasing is past due by <span
        th:text=" ${CommonDataPojo.daysDelinquent}"></span> days. If needed, we can work out short term arrangements
        that fit your schedule.
        <br><br> Please go online to <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to make a payment or reach out to our account management department at <a
        href="tel:877-357-5474">877-357-5474</a> for more options.
        <br><br> If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;"></div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/delinquency-60-day-offer-email.html  0 → 100644
+
330
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Offers 61 to 90 days Weekly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Hi, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br> Your account <span th:text=" ${CommonDataPojo.accountPK}"></span> with Uown Leasing is now
        significantly past due. Call us to take advantage of an early payoff option at 30% off your account balance if
        you settle this month.
        <br><br> Please go online to <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to pay the reduced lump sum payment of $<span th:text=" ${CommonDataPojo.balance}"></span> or call our account
        management department at <a href="tel:877-357-5474">877-357-5474</a> for more options.
        <br><br> If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/delinquency-90-day-offer-email.html  0 → 100644
+
330
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Offers 91 to 150 days Weekly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Hi, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br>We are offering to settle your Uown account <span th:text=" ${CommonDataPojo.accountPK}"></span> at 50%
        off your account balance. This means you only need to pay a reduced lump sum payment of $<span
        th:text=" ${CommonDataPojo.balance}"></span> if you settle this month.
        <br><br>Please go online to <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        to make a payment or call our account management department at <a href="tel:877-357-5474">877-357-5474</a> for
        more options.
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
        <br><br>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/delinquency-reminder-email.html  0 → 100644
+
328
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Days Past Due Weekly Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Dear, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">
        <br><br>Our records show that your account <span th:text=" ${CommonDataPojo.accountPK}"></span> is overdue by
        <span th:text=" ${CommonDataPojo.daysDelinquent}"></span> days. We were not successful in processing your last
        payment. Please go online to <a
        th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        or reach out to our account management department at <a href="tel:877-357-5474">877-357-5474</a> to make your
        payment
        <br><br>If you do not wish to own the merchandise you are leasing, you can surrender the merchandise to us at
        any time. Please contact us at <a href="tel:877-357-5474">877-357-5474</a> if you are interested in surrendering
        the merchandise.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 460;"><i>Don’t forget there are great early payoff options. Check your lease
        for the discounts available to you.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/first-payment-default-email.html  0 → 100644
+
323
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone First Payment Default Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Dear, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">Thank you for entering into a lease purchase agreement with Uown
        Leasing. Unfortunately, we were not successful in processing your first payment based on the account information
        that you provided. We want to ensure you will not lose your 90-day option under your lease. Please go online to
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        or reach out to our account management department at <a href="tel:877-353-8696">877-353-8696</a> to make your
        payment.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 430;"><i>Thank You.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/paid-in-full-email.html  0 → 100644
+
338
−
0

Visualizado
Marcos Silvano
changed this file in version 17 of the diff 1 dia atrás
Responder…
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Paid in Full Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">406 w South Jordan Parkway Suite 600
        <br>South Jordan, UT 84095
        <br>Phone: (888) 521-5111
        <br>Email: Accountmanagement@Uownleasing.com
Marcos Silvano
Marcos Silvano
@marcos.pacheco.silva
1 dia atrás
Autor
Maintainer
Which address can be used as replacement

Editado 1 dia atrás por Marcos Silvano
Responder…
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
      ">
      <div style="margin: 0 auto;margin-top: 35px;width: 500;">
        Date: <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">Personal and Confidential for:
        <br><span th:text=" ${CommonDataPojo.customerFirstName}"></span> <span
          th:text=" ${CommonDataPojo.customerLastName}"></span>
        <br><span th:text=" ${CommonDataPojo.customerStreetAddress1}"></span> <span
          th:text=" ${CommonDataPojo.customerStreetAddress2}"></span>
        <br><span th:text=" ${CommonDataPojo.customerCity}"></span> , <span
          th:text=" ${CommonDataPojo.customerState}"></span> <span th:text=" ${CommonDataPojo.customerZipCode}"></span>
        <br><br>Kornerstone Account Number: <span th:text=" ${CommonDataPojo.accountPK}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">Dear <span th:text=" ${CommonDataPojo.customerFirstName}"></span> <span
        th:text=" ${CommonDataPojo.customerLastName}"></span>,
        <br>
        <br>This letter confirms that on <span th:text="'' +  ${CommonDataPojo.paymentDate}"></span> we processed a
        payment in the amount of <span th:text=" ${CommonDataPojo.lastPaymentAmount}"></span>. The above referenced
        account is now closed and paid in full.*
        <br>
        <br>Customer satisfaction is our primary focus. Our goal is to provide you with the best quality products at the
        most reasonable price.
        <br><br> Thank you for choosing Kornerstone! <br><br>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">* If any lease term payments do not clear, the paid/settled in full
        status of the account will be voided.
      </div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/payment-decline-email.html  0 → 100644
+
322
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Payment Decline Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Dear, <span
        th:text=" ${CommonDataPojo.customerFirstName}"></span>:
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">Thank you for your business. Unfortunately, we were not successful in
        processing your last payment. Please go online to <a
          th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
        or reach out to our account management department at <a href="tel:877-357-5474">877-357-5474</a> to make your
        payment.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">You may also reply to this email directly if this is more convenient
        and receive a response within 24 hours.
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 430;"><i>Thank You.</i></div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/payment-receipt-email.html  0 → 100644
+
447
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Recurring Payment Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
      <div style="margin: 0 auto;width: 344px;margin-top: 30px;">Payment Receipt</div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
      <div style="margin: 0 auto;margin-top: 35px;">
        <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
		line-height: 23px
      ">
      <div style="margin: 35px auto;width: 500;">
        <span th:text="${CommonDataPojo.customerFirstName} + ' ' + ${CommonDataPojo.customerLastName}"></span>
        <br><span th:text="${CommonDataPojo.customerStreetAddress1}"></span>
        <br><span
        th:text="${CommonDataPojo.customerCity} + ', ' + ${CommonDataPojo.customerState} + ' ' + ${CommonDataPojo.customerZipCode}"></span>
        <br>Phone: <span th:text="${CommonDataPojo.customerPhoneNumbers}"></span>
        <br>Email: <span th:text="${CommonDataPojo.customerEmailAddresses}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
		margin-bottom: 35px
      ">
      <div style="margin: 0 auto;margin-top: 35px;width: 500;">
        <hr>
        ACCT #: <span th:text="${CommonDataPojo.accountPK}"></span>
        <br><br>RECEIPT #: <span th:text="${CommonDataPojo.receiptNum}"></span>
        <hr>
      </div>
    </div>
    <div style="
            text-align: center;
            margin-top: 35px;
            font-family: Helvetica Neue;
            overflow: visible;
            width: 83%;
            height: 190px;
            border-radius: 14px;
            background-color: rgba(247, 247, 247, 1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
			margin: auto;
            ">
      <div style="
          overflow: visible;
          width: 30%;
          height: 35px;
		  margin-top: 5px;
          float: left;
        ">
        <div style="margin-top: -2px;font-weight: bold;font-size: 14px;">
          Contract #:
        </div>
        <div style="font-weight: bold;font-size: 14px;"><span th:text="'KORNERSTONE_' + ${CommonDataPojo.leadPK}"></span></div>
      </div>
      <div style="
          overflow: visible;
          width: 30%;
          height: 30px;
          /*border-radius: 14px;
          background-color: rgba(247, 247, 247, 1);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);*/
          margin: 0 3%;
          float: left;
        ">
        <div style="margin-top: 3px;font-weight: bold;font-size: 14px;">
          Term:
        </div>
        <div style="font-weight: bold;font-size: 14px;"><span th:text="${CommonDataPojo.paymentFrequency}"></span></div>
      </div>
      <div style="
          overflow: visible;
          width: 30%;
          height: 30px;
          float: left;
        ">
        <div style="margin-top: 3px;font-weight: bold;font-size: 14px;">
          Due:
        </div>
        <div style="font-weight: bold;font-size: 14px;"><span
          th:text="${#temporals.format(CommonDataPojo.dueDate,'MMM dd, yyyy')}"></span></div>
      </div>
      <div style="
          overflow: visible;
          width: 15%;
          height: 35px;
          /*border-radius: 14px;
          background-color: rgba(247, 247, 247, 1);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);*/
		  margin-top: 36px;
		  margin-left: -25px;
          float: left;
        ">
        <div style="font-weight: bold;font-size: 14px;text-align: right;">Paid:</div>
        <div style="margin-top: 4px;font-weight: bold;font-size: 14px;text-align: right;">Tax:</div>
        <div style="margin-top: 4px;font-weight: bold;font-size: 14px;text-align: right;">Total:</div>
        <div style="margin-top: 2px;font-weight: bold;font-size: 14px;text-align: right;"><br><br>Next Due:</div>
      </div>
      <div style="
          overflow: visible;
          width: 20%;
          height: 35px;
		  margin-top: 35px;
          float: left;
        ">
        <div style="margin-left: 7px;font-weight: bold;font-size: 15px;text-align: left; color: #5bcbf5;"><span
          th:text="${CommonDataPojo.paidWithoutTaxAmount}"></span></div>
        <div style="margin-top: 3px;margin-left: 7px;font-weight: bold;font-size: 14px;text-align: left;"><span
          th:text="${CommonDataPojo.totalTax}"></div>
        <div style="margin-top: 3px;margin-left: 7px;font-weight: bold;font-size: 14px;text-align: left;"><span
          th:text="${CommonDataPojo.paidAmount}"></span></div>
        <div
          style="margin-top: 3px;margin-left: 7px;font-weight: bold;font-size: 14px;text-align: left; color: #5bcbf5;">
          <br><br><span th:text="${#temporals.format(CommonDataPojo.nextPaymentDueDate,'MMM dd, yyyy')}"></span></div>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
		line-height: 23px
      ">
      <div style="margin: 35px auto;width: 500;">* Balance: <span th:text="${CommonDataPojo.balance}"></span>
        <br>* Payoff Amount: <span th:text="${CommonDataPojo.payOffAmountBeforeEPOExpiry}"></span>
        <br>* Includes taxes and other charges
        <br><br>If you pay off now you save:
        <br><span th:text="${CommonDataPojo.savedAmount}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
		margin-bottom: 35px
      ">
      <div style="margin: 0 auto;margin-top: 35px;width: 500;">
        <hr>
        Total Paid: <span th:text="${CommonDataPojo.totalPaidAmount}"></span>
        <hr>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 21px;
        color: #8FC31F;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">Thank you for your business!
      </div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/kornerstone/recurring-payment-reminder-email.html  0 → 100644
+
349
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org"><head>
  <title>Kornerstone Recurring Payment Reminder Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z" />
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z" />
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z" />
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
    <div style="margin: 0 auto;margin-top: 35px;">
      <span th:text = "${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>

    </div>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
    <div style="margin: 0 auto;width: 275px;margin-top: 30px;"><span th:text=" ${CommonDataPojo.customerFirstName}+ ' '+ ${CommonDataPojo.customerLastName}"></span>, your payment of
      $<span th:text = "${CommonDataPojo.nextPaymentDueAmount}"></span> is due in 3 days.</div>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        color: #222222;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto;width: 420;">Thank you for your previous payment(s). <br>We appreciate great customers like you. <br>Your next payment is due on <span th:text = "${#temporals.format(CommonDataPojo.nextPaymentDueDate,'MMMdd, yyyy')}"></span>.</div>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto;width: 420;">You have <span th:text = "${CommonDataPojo.remainingNumberOfPayments}"></span> payments remaining to gain ownership of your item(s).</div>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 20px;
        color: #8FC31F;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto;width: 420;"><i>Don’t forget! <br>Kornerstone offers great early payoff options.</i></div>
  </div>
  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 10px;
        color: #777777;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto; width: 420px;">
      * <span th:text="'$' + ${CommonDataPojo.convenienceFee}"></span> Convenience Fee charged by processor on all Debit or Credit Card Payments. ACH payments are not subject to the fee.
      If you would like to switch your payment method to ACH, please log into the customer portal at&nbsp;
      <a href="https://app.kornerstonecredit.com/Authentication/Login" target="_blank" rel="noopener noreferrer">
        app.kornerstonecredit.com/Authentication/Login
      </a>.
    </div>
  </div>


  <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
    <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: #8FC31F;
        text-transform: uppercase;
      ">
      WE’RE HERE TO HELP!
    </div>
    <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>
    <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
      <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
    </p>
    <div style="margin: 23px 0">
      <div style="width: 572px; display: block; height: 53px">
        <div style="width: 377px; margin: 0px auto">
          <div
            style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
          >
            Mon - Sat<span style="font-style: normal; font-weight: normal"
          >: 9am - 10pm ET</span
          ><br />
            Sun<span style="font-style: normal; font-weight: normal"
          >: 11am - 9pm ET</span
          >
          </div>
        </div>
      </div>
      <div style="width: 572px; display: block; height: 53px">
        <div style="width: 572px">
          <div
            style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
          >
            cs@kornerstoneliving.com<br />
            (877) 353-8696
          </div>
        </div>
      </div>
    </div>
    <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
      FOLLOW US ON SOCIAL MEDIA!
    </div>
    <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
      <div style="margin: 0 auto; display: inline-block">
        <a
          href="https://www.facebook.com/Kornerstoneliving/"
          target="_blank"
          style="float: left; margin: 0 15px"
        >
          <svg
            style="
                  overflow: visible;
                  width: 19.77px;
                  height: 19.771px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
            viewBox="0 0 24 24"
            fill="#8FC31F"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/kornerstoneliving"
          target="_blank"
          style="float: left"
        >
          <svg
            style="
                  overflow: visible;
                  width: 19.781px;
                  height: 19.777px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
            viewBox="0 0 24 24"
            fill="#8FC31F"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
            />
          </svg>
        </a>
      </div>
    </div>
  </div>
  <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
    <img
      style="height: 38px; overflow: visible; margin: 6px"
      src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png"
    />
  </div>
</div>
</body></html>

 src/main/resources/correspondence/templates/kornerstone/second-lease-opportunity-paid-account.html  0 → 100644
+
546
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
  <head>
    <title>Kornerstone Second Lease Opportunity Paid Accounts Email</title>
  </head>
  <body>
    <div style="width: 600px">
      <div
        style="
          overflow: visible;
          height: 52px;
          margin: 7px 0;
          clear: both;
          text-align: center;
        "
      >
        <svg
          style="height: 62px; overflow: visible"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 305.75 71.75"
        >
          <defs>
            <style>
              .st0 {
                fill: #231f20;
              }

              .st1 {
                fill: #8dc63f;
              }
            </style>
          </defs>
          <g>
            <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z" />
            <path
              class="st0"
              d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
            />
            <path
              class="st0"
              d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
            />
            <path
              class="st0"
              d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
            />
            <path
              class="st0"
              d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
            />
            <path
              class="st0"
              d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
            />
            <path
              class="st0"
              d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
            />
            <path
              class="st0"
              d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
            />
            <path
              class="st0"
              d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
            />
            <path
              class="st0"
              d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
            />
            <path
              class="st0"
              d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
            />
            <polygon
              class="st0"
              points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
            />
          </g>
          <polygon
            class="st1"
            points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
          />
          <g>
            <path
              class="st1"
              d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
            />
            <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z" />
            <path
              class="st1"
              d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
            />
            <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z" />
            <path
              class="st1"
              d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
            />
            <path
              class="st1"
              d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
            />
          </g>
        </svg>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 12px;
          color: #707070;
        "
      >
        <div style="margin: 0 auto; margin-top: 35px">
          <span
            th:text="${#dates.format(#dates.createNow(), 'dd MMM yyyy')}"
          ></span>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-weight: bold;
          font-size: 20px;
          color: #8fc31f;
        "
      >
        <div style="margin: 0 auto; width: 400px; margin-top: 30px">
          Thank You,
          <span
            th:text=" ${CommonDataPojo.customerFirstName}+ ' '+ ${CommonDataPojo.customerLastName}"
          ></span
          >.
        </div>
        <div style="margin: 0 auto; width: 350; margin-top: 0px">
          Congratulations, on succesfully paying off your lease with Kornerstone
          <span
            th:text="${CommonDataPojo.newApprovalAmount} + ' to be used at ' + ${CommonDataPojo.merchantLocationName}"
          ></span
          >.
        </div>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          color: #777777;
          margin: 20px 0;
        "
      >
        <div style="margin: 35px auto; width: 420">
          Since you are such a great customer, we invite you to open another
          Kornerstone lease to purchase more great items.
        </div>
      </div>

      <div
        style="
          overflow: visible;
          background-color: #8fc31f;
          padding: 15px 0;
          font-family: Helvetica Neue;
        "
      >
        <div
          id="Rectangle_52"
          width="600"
          height="52"
          style="text-align: center"
        >
          <span style="font-size: 20px; color: rgba(255, 255, 255, 1)">
            NO MONEY DOWN!
          </span>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          color: #8fc31f;
          margin-top: 20px;
          margin-bottom: 15px;
        "
      >
        <i>Why utilize a lease-to-own transaction today?</i>
      </div>
      <div
        style="
          overflow: visible;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 14px;
          color: rgba(34, 34, 34, 1);
        "
      >
        It’s an affordable pathway to ownership of your product(s)!
      </div>
      <div
        style="
          text-align: center;
          min-height: 150px;
          /* width: 600px; */
          margin-top: 35px;
          font-family: Helvetica Neue;
        "
      >
        <div
          style="
            overflow: visible;
            width: 30%;
            height: 125px;
            border-radius: 14px;
            background-color: rgba(247, 247, 247, 1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
            margin: 0 5%;
            float: left;
            margin-left: 100px;
          "
        >
          <div>
            <svg
              style="
                overflow: visible;
                margin-top: 20px;
                width: 26.79px;
                height: 30.61px;
                transform: matrix(1, 0, 0, 1, 0, 0);
              "
              xmlns="http://www.w3.org/2000/svg"
              width="26.79"
              height="30.61"
              viewBox="0 0 26.79 30.61"
              fill="none"
            >
              <path
                d="M26.79 26.07C26.79 28.5495 24.7795 30.61 22.365 30.61H4.425C2.01054 30.61 0 28.5495 0 26.07V11.1962H26.79V26.07ZM10.0675 15.4139C8.27087 15.414 6.97671 16.5934 6.97671 18.3059V18.3408C6.97678 20.0746 8.20399 21.0078 9.81562 21.0078C10.6558 21.0078 11.3146 20.713 11.7819 20.2458C11.7415 21.5987 11.0911 22.8094 9.75087 22.8096C9.06575 22.8096 8.51254 22.5615 7.95021 22.1582L7.17537 23.2213C7.91317 23.7399 8.71549 24.0433 9.75262 24.0434C11.9887 24.0434 13.3555 22.4111 13.3555 19.5195V19.4365C13.3555 17.7239 12.9277 16.8109 12.2773 16.2344C11.7113 15.7424 11.0249 15.4139 10.0675 15.4139ZM16.3987 15.4139C14.7164 15.4141 13.4585 17.1281 13.4585 19.6644V19.7938C13.4585 22.3427 14.6719 24.0434 16.3542 24.0434C18.0362 24.0432 19.2939 22.3302 19.294 19.7939V19.6633C19.2939 17.1146 17.8807 15.4139 16.3987 15.4139ZM16.3542 16.6836C17.4831 16.6837 18.2563 17.8111 18.2563 19.6753V19.7939C18.2562 21.6579 17.4829 22.7744 16.3987 22.7744C15.301 22.774 14.4961 21.6574 14.4961 19.7824V19.6644C14.4961 17.8115 15.2817 16.6836 16.3542 16.6836ZM10.0893 16.6416C11.1033 16.6418 11.7188 17.2964 11.7188 18.2231V18.2354C11.7185 19.1371 11.1028 19.7938 10.1055 19.7938C9.12038 19.7936 8.48047 19.2008 8.48047 18.2119V18.1875C8.48047 17.3207 9.07538 16.6416 10.0893 16.6416ZM19.3204 0C20.2214 0 20.9517 0.761649 20.9517 1.70139V3.82639H23.3656C25.7801 3.82639 26.79 5.88686 26.79 8.36633V8.64861H0V8.36633C0 5.88686 2.01054 3.82639 4.425 3.82639H5.8387V1.70139C5.8387 0.761649 6.56907 0 7.47012 0C8.37117 0 9.1015 0.761649 9.1015 1.70139V3.82639H17.8891V1.70139C17.8891 0.761649 18.6194 0 19.3204 0Z"
                fill="#8FC31F"
              />
            </svg>
          </div>
          <div style="margin-top: 10px; font-weight: bold; font-size: 14px">
            90-Day Special
          </div>
          <div style="font-weight: bold; font-size: 14px">
            Program Available
          </div>
        </div>
        <div
          style="
            overflow: visible;
            width: 30%;
            height: 125px;
            border-radius: 14px;
            background-color: rgba(247, 247, 247, 1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
            float: left;
          "
        >
          <div>
            <svg
              style="
                overflow: visible;
                margin-top: 26px;
                width: 30px;
                height: 24px;
                transform: matrix(1, 0, 0, 1, 0, 0);
              "
              width="31"
              height="27"
              viewBox="0 0 31 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.6855 0C28.6205 0 30.9999 2.33955 31 5.22559V21.7744C30.9999 24.6604 28.6205 27 25.6855 27H5.31445C2.37953 27 0.000121138 24.6604 0 21.7744V5.22559C0.000121201 2.33955 2.37953 0 5.31445 0H25.6855ZM3.54297 21.7744C3.54309 22.7364 4.3362 23.5166 5.31445 23.5166H25.6855C26.6638 23.5166 27.4569 22.7364 27.457 21.7744V12.9561H3.54297V21.7744ZM5.31445 3.4834C4.33619 3.4834 3.54309 4.26364 3.54297 5.22559V9.47168H27.457V5.22559C27.4569 4.26364 26.6638 3.4834 25.6855 3.4834H5.31445Z"
                fill="#8FC31F"
              />
            </svg>
          </div>
          <div style="margin-top: 12px; font-weight: bold; font-size: 14px">
            Payment Up to
          </div>
          <div style="font-weight: bold; font-size: 14px">13 Months</div>
        </div>
      </div>
      <div style="text-align: center">
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 16px;
            color: #8fc31f;
          "
        >
          <i>Kornerstone reports all payment activity to TransUnion Credit Bureau,</i>
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: italic;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
            margin-top: -15px;
          "
        >
          which may have an impact on your credit score.
        </p>
      </div>
      <div style="text-align: center">
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 16px;
            color: #8fc31f;
            margin-top: 30px;
          "
        >
          <i>Now that you are approved…</i>
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: italic;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
          "
        >
          Kornerstone is easy to use and will help you acquire your item(s) fast.
        </p>
      </div>
      <div
        style="
          background-color: rgba(247, 247, 247, 1);
          padding: 30px 0;
          width: 572px;
          margin-left: 12px;
          margin-top: 41px;
        "
      >
        <div
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 18px;
            color: rgba(34, 34, 34, 1);
            text-transform: uppercase;
          "
        >
          WE’RE HERE TO HELP!
        </div>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
          "
        >
          Call the number below to speak to one of<br />our customer service
          representatives.
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 14px;
            color: #8fc31f;
          "
        >
          <a
            th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}"
            target="_blank"
            >kornerstonecredit.com</a
          >
        </p>
        <div style="margin: 23px 0">
          <div style="width: 572px; display: block; height: 53px">
            <div style="width: 377px; margin: 0px auto">
              <div
                style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
              >
                Mon - Sat<span style="font-style: normal; font-weight: normal"
                  >: 9am - 10pm ET</span
                ><br />
                Sun<span style="font-style: normal; font-weight: normal"
                  >: 11am - 9pm ET</span
                >
              </div>
            </div>
          </div>
          <div style="width: 572px; display: block; height: 53px">
            <div style="width: 572px">
              <div
                style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
              >
                cs@kornerstoneliving.com<br />
                (877) 353-8696
              </div>
            </div>
          </div>
        </div>
        <div
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
            text-transform: uppercase;
            margin: 13px 0;
            clear: both;
          "
        >
          FOLLOW US ON SOCIAL MEDIA!
        </div>
        <div
          style="
            display: block;
            margin-bottom: 10px;
            height: 20px;
            text-align: center;
          "
        >
          <div style="margin: 0 auto; display: inline-block">
            <a
              href="https://www.facebook.com/Kornerstoneliving/"
              target="_blank"
              style="float: left; margin: 0 15px"
            >
              <svg
                style="
                  overflow: visible;
                  width: 19.77px;
                  height: 19.771px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
                viewBox="0 0 24 24"
                fill="#8FC31F"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/kornerstoneliving"
              target="_blank"
              style="float: left"
            >
              <svg
                style="
                  overflow: visible;
                  width: 19.781px;
                  height: 19.777px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
                viewBox="0 0 24 24"
                fill="#8FC31F"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          height: 52px;
          background-color: #8fc31f;
          margin: -1px 0;
          clear: both;
          text-align: center;
        "
      >
        <img
          style="height: 38px; overflow: visible; margin: 6px"
          src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png"
        />
      </div>
    </div>
  </body>
</html>

e new correspondence added
R1.47.0_kornerstone_new_correspondence_added
para
R1.47.0
Visão geral 9
Commits 
34
Pipelines 
22
Alterações 
19
Abrir os tópicos 3
Comparar
e
 19 arquivos
+
4960
−
4
Arquivos
19
Pesquisar (por exemplo, *.vue) (F)

src/
‎main‎

java/com/uow
‎nleasing/svc‎

rest
‎/svc‎

SvcSweepsCon
‎troller.java‎
+0 -1

ser
‎vice‎

Correspondenc
‎eService.java‎
+1 -0

resources/corresp
‎ondence/templates‎

korne
‎rstone‎

customer-portal-r
‎eminder-email.html‎
+303 -0

days-past-due-mo
‎nthly-email.html‎
+328 -0

delinquency-150-da
‎y-offer-email.html‎
+330 -0

delinquency-30-da
‎y-offer-email.html‎
+343 -0

delinquency-60-da
‎y-offer-email.html‎
+330 -0

delinquency-90-da
‎y-offer-email.html‎
+330 -0

delinquency-rem
‎inder-email.html‎
+328 -0

first-payment-de
‎fault-email.html‎
+323 -0

paid-in-ful
‎l-email.html‎
+338 -0

payment-decli
‎ne-email.html‎
+322 -0

payment-recei
‎pt-email.html‎
+447 -0

recurring-payment-
‎reminder-email.html‎
+349 -0

second-lease-opportun
‎ity-paid-account.html‎
+546 -0

settled-in-fu
‎ll-email.html‎
+339 -0

 src/main/resources/correspondence/templates/kornerstone/second-lease-opportunity-paid-account.html  0 → 100644
+
546
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
  <head>
    <title>Kornerstone Second Lease Opportunity Paid Accounts Email</title>
  </head>
  <body>
    <div style="width: 600px">
      <div
        style="
          overflow: visible;
          height: 52px;
          margin: 7px 0;
          clear: both;
          text-align: center;
        "
      >
        <svg
          style="height: 62px; overflow: visible"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          viewBox="0 0 305.75 71.75"
        >
          <defs>
            <style>
              .st0 {
                fill: #231f20;
              }

              .st1 {
                fill: #8dc63f;
              }
            </style>
          </defs>
          <g>
            <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z" />
            <path
              class="st0"
              d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
            />
            <path
              class="st0"
              d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
            />
            <path
              class="st0"
              d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
            />
            <path
              class="st0"
              d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
            />
            <path
              class="st0"
              d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
            />
            <path
              class="st0"
              d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
            />
            <path
              class="st0"
              d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
            />
            <path
              class="st0"
              d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
            />
            <path
              class="st0"
              d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
            />
            <path
              class="st0"
              d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
            />
            <polygon
              class="st0"
              points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
            />
          </g>
          <polygon
            class="st1"
            points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
          />
          <g>
            <path
              class="st1"
              d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
            />
            <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z" />
            <path
              class="st1"
              d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
            />
            <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z" />
            <path
              class="st1"
              d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
            />
            <path
              class="st1"
              d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
            />
          </g>
        </svg>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 12px;
          color: #707070;
        "
      >
        <div style="margin: 0 auto; margin-top: 35px">
          <span
            th:text="${#dates.format(#dates.createNow(), 'dd MMM yyyy')}"
          ></span>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-weight: bold;
          font-size: 20px;
          color: #8fc31f;
        "
      >
        <div style="margin: 0 auto; width: 400px; margin-top: 30px">
          Thank You,
          <span
            th:text=" ${CommonDataPojo.customerFirstName}+ ' '+ ${CommonDataPojo.customerLastName}"
          ></span
          >.
        </div>
        <div style="margin: 0 auto; width: 350; margin-top: 0px">
          Congratulations, on succesfully paying off your lease with Kornerstone
          <span
            th:text="${CommonDataPojo.newApprovalAmount} + ' to be used at ' + ${CommonDataPojo.merchantLocationName}"
          ></span
          >.
        </div>
      </div>
      <div
        style="
          overflow: visible;
          white-space: normal;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          color: #777777;
          margin: 20px 0;
        "
      >
        <div style="margin: 35px auto; width: 420">
          Since you are such a great customer, we invite you to open another
          Kornerstone lease to purchase more great items.
        </div>
      </div>

      <div
        style="
          overflow: visible;
          background-color: #8fc31f;
          padding: 15px 0;
          font-family: Helvetica Neue;
        "
      >
        <div
          id="Rectangle_52"
          width="600"
          height="52"
          style="text-align: center"
        >
          <span style="font-size: 20px; color: rgba(255, 255, 255, 1)">
            NO MONEY DOWN!
          </span>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 16px;
          color: #8fc31f;
          margin-top: 20px;
          margin-bottom: 15px;
        "
      >
        <i>Why utilize a lease-to-own transaction today?</i>
      </div>
      <div
        style="
          overflow: visible;
          text-align: center;
          font-family: Helvetica Neue;
          font-style: normal;
          font-weight: normal;
          font-size: 14px;
          color: rgba(34, 34, 34, 1);
        "
      >
        It’s an affordable pathway to ownership of your product(s)!
      </div>
      <div
        style="
          text-align: center;
          min-height: 150px;
          /* width: 600px; */
          margin-top: 35px;
          font-family: Helvetica Neue;
        "
      >
        <div
          style="
            overflow: visible;
            width: 30%;
            height: 125px;
            border-radius: 14px;
            background-color: rgba(247, 247, 247, 1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
            margin: 0 5%;
            float: left;
            margin-left: 100px;
          "
        >
          <div>
            <svg
              style="
                overflow: visible;
                margin-top: 20px;
                width: 26.79px;
                height: 30.61px;
                transform: matrix(1, 0, 0, 1, 0, 0);
              "
              xmlns="http://www.w3.org/2000/svg"
              width="26.79"
              height="30.61"
              viewBox="0 0 26.79 30.61"
              fill="none"
            >
              <path
                d="M26.79 26.07C26.79 28.5495 24.7795 30.61 22.365 30.61H4.425C2.01054 30.61 0 28.5495 0 26.07V11.1962H26.79V26.07ZM10.0675 15.4139C8.27087 15.414 6.97671 16.5934 6.97671 18.3059V18.3408C6.97678 20.0746 8.20399 21.0078 9.81562 21.0078C10.6558 21.0078 11.3146 20.713 11.7819 20.2458C11.7415 21.5987 11.0911 22.8094 9.75087 22.8096C9.06575 22.8096 8.51254 22.5615 7.95021 22.1582L7.17537 23.2213C7.91317 23.7399 8.71549 24.0433 9.75262 24.0434C11.9887 24.0434 13.3555 22.4111 13.3555 19.5195V19.4365C13.3555 17.7239 12.9277 16.8109 12.2773 16.2344C11.7113 15.7424 11.0249 15.4139 10.0675 15.4139ZM16.3987 15.4139C14.7164 15.4141 13.4585 17.1281 13.4585 19.6644V19.7938C13.4585 22.3427 14.6719 24.0434 16.3542 24.0434C18.0362 24.0432 19.2939 22.3302 19.294 19.7939V19.6633C19.2939 17.1146 17.8807 15.4139 16.3987 15.4139ZM16.3542 16.6836C17.4831 16.6837 18.2563 17.8111 18.2563 19.6753V19.7939C18.2562 21.6579 17.4829 22.7744 16.3987 22.7744C15.301 22.774 14.4961 21.6574 14.4961 19.7824V19.6644C14.4961 17.8115 15.2817 16.6836 16.3542 16.6836ZM10.0893 16.6416C11.1033 16.6418 11.7188 17.2964 11.7188 18.2231V18.2354C11.7185 19.1371 11.1028 19.7938 10.1055 19.7938C9.12038 19.7936 8.48047 19.2008 8.48047 18.2119V18.1875C8.48047 17.3207 9.07538 16.6416 10.0893 16.6416ZM19.3204 0C20.2214 0 20.9517 0.761649 20.9517 1.70139V3.82639H23.3656C25.7801 3.82639 26.79 5.88686 26.79 8.36633V8.64861H0V8.36633C0 5.88686 2.01054 3.82639 4.425 3.82639H5.8387V1.70139C5.8387 0.761649 6.56907 0 7.47012 0C8.37117 0 9.1015 0.761649 9.1015 1.70139V3.82639H17.8891V1.70139C17.8891 0.761649 18.6194 0 19.3204 0Z"
                fill="#8FC31F"
              />
            </svg>
          </div>
          <div style="margin-top: 10px; font-weight: bold; font-size: 14px">
            90-Day Special
          </div>
          <div style="font-weight: bold; font-size: 14px">
            Program Available
          </div>
        </div>
        <div
          style="
            overflow: visible;
            width: 30%;
            height: 125px;
            border-radius: 14px;
            background-color: rgba(247, 247, 247, 1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
            float: left;
          "
        >
          <div>
            <svg
              style="
                overflow: visible;
                margin-top: 26px;
                width: 30px;
                height: 24px;
                transform: matrix(1, 0, 0, 1, 0, 0);
              "
              width="31"
              height="27"
              viewBox="0 0 31 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.6855 0C28.6205 0 30.9999 2.33955 31 5.22559V21.7744C30.9999 24.6604 28.6205 27 25.6855 27H5.31445C2.37953 27 0.000121138 24.6604 0 21.7744V5.22559C0.000121201 2.33955 2.37953 0 5.31445 0H25.6855ZM3.54297 21.7744C3.54309 22.7364 4.3362 23.5166 5.31445 23.5166H25.6855C26.6638 23.5166 27.4569 22.7364 27.457 21.7744V12.9561H3.54297V21.7744ZM5.31445 3.4834C4.33619 3.4834 3.54309 4.26364 3.54297 5.22559V9.47168H27.457V5.22559C27.4569 4.26364 26.6638 3.4834 25.6855 3.4834H5.31445Z"
                fill="#8FC31F"
              />
            </svg>
          </div>
          <div style="margin-top: 12px; font-weight: bold; font-size: 14px">
            Payment Up to
          </div>
          <div style="font-weight: bold; font-size: 14px">13 Months</div>
        </div>
      </div>
      <div style="text-align: center">
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 16px;
            color: #8fc31f;
          "
        >
          <i>Kornerstone reports all payment activity to TransUnion Credit Bureau,</i>
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: italic;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
            margin-top: -15px;
          "
        >
          which may have an impact on your credit score.
        </p>
      </div>
      <div style="text-align: center">
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 16px;
            color: #8fc31f;
            margin-top: 30px;
          "
        >
          <i>Now that you are approved…</i>
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: italic;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
          "
        >
          Kornerstone is easy to use and will help you acquire your item(s) fast.
        </p>
      </div>
      <div
        style="
          background-color: rgba(247, 247, 247, 1);
          padding: 30px 0;
          width: 572px;
          margin-left: 12px;
          margin-top: 41px;
        "
      >
        <div
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 18px;
            color: rgba(34, 34, 34, 1);
            text-transform: uppercase;
          "
        >
          WE’RE HERE TO HELP!
        </div>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
          "
        >
          Call the number below to speak to one of<br />our customer service
          representatives.
        </p>
        <p
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: normal;
            font-size: 14px;
            color: #8fc31f;
          "
        >
          <a
            th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}"
            target="_blank"
            >kornerstonecredit.com</a
          >
        </p>
        <div style="margin: 23px 0">
          <div style="width: 572px; display: block; height: 53px">
            <div style="width: 377px; margin: 0px auto">
              <div
                style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
              >
                Mon - Sat<span style="font-style: normal; font-weight: normal"
                  >: 9am - 10pm ET</span
                ><br />
                Sun<span style="font-style: normal; font-weight: normal"
                  >: 11am - 9pm ET</span
                >
              </div>
            </div>
          </div>
          <div style="width: 572px; display: block; height: 53px">
            <div style="width: 572px">
              <div
                style="
                  overflow: visible;
                  font-family: Helvetica Neue;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 14px;
                  color: #8fc31f;
                  text-align: center;
                "
              >
                cs@kornerstoneliving.com<br />
                (877) 353-8696
              </div>
            </div>
          </div>
        </div>
        <div
          style="
            overflow: visible;
            text-align: center;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: rgba(34, 34, 34, 1);
            text-transform: uppercase;
            margin: 13px 0;
            clear: both;
          "
        >
          FOLLOW US ON SOCIAL MEDIA!
        </div>
        <div
          style="
            display: block;
            margin-bottom: 10px;
            height: 20px;
            text-align: center;
          "
        >
          <div style="margin: 0 auto; display: inline-block">
            <a
              href="https://www.facebook.com/Kornerstoneliving/"
              target="_blank"
              style="float: left; margin: 0 15px"
            >
              <svg
                style="
                  overflow: visible;
                  width: 19.77px;
                  height: 19.771px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
                viewBox="0 0 24 24"
                fill="#8FC31F"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/kornerstoneliving"
              target="_blank"
              style="float: left"
            >
              <svg
                style="
                  overflow: visible;
                  width: 19.781px;
                  height: 19.777px;
                  transform: matrix(1, 0, 0, 1, 0, 0);
                "
                viewBox="0 0 24 24"
                fill="#8FC31F"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div
        style="
          overflow: visible;
          height: 52px;
          background-color: #8fc31f;
          margin: -1px 0;
          clear: both;
          text-align: center;
        "
      >
        <img
          style="height: 38px; overflow: visible; margin: 6px"
          src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png"
        />
      </div>
    </div>
  </body>
</html>
 src/main/resources/correspondence/templates/kornerstone/settled-in-full-email.html  0 → 100644
+
339
−
0

Visualizado
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Settled in Full Email</title>
</head>
<body>
<div style="width: 600px">
  <div style="
	      overflow: visible;
	      height: 52px;
	      margin: 7px 0;
	      clear: both;
	      text-align: center;
	      ">
    <svg
      style="height: 62px; overflow: visible"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 305.75 71.75"
    >
      <defs>
        <style>
          .st0 {
            fill: #231f20;
          }

          .st1 {
            fill: #8dc63f;
          }
        </style>
      </defs>
      <g>
        <path class="st0" d="M33.06,32.98h-7.01V4.27h7.01v28.71Z"/>
        <path
          class="st0"
          d="M72.9,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM65.85,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03-.08.91-.12,2.21-.12,3.91s.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M100.31,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4s1.15,2.92,1.15,4.55c0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM91.74,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06s.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M126.42,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M151.45,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <path
          class="st0"
          d="M179.01,32.98h-8.15l-5.09-10.69h-2.39v10.69h-7.05V4.27h11.37c2.06,0,3.82.43,5.29,1.29,1.47.86,2.59,1.99,3.35,3.4.77,1.4,1.15,2.92,1.15,4.55,0,1.8-.46,3.34-1.36,4.62-.91,1.28-2.01,2.24-3.31,2.89l6.19,11.97ZM170.45,13.52c0-.51-.12-.99-.37-1.43-.24-.44-.6-.8-1.07-1.07-.47-.27-1.01-.4-1.63-.4h-4.01v5.79h4.01c.62,0,1.16-.13,1.63-.4.47-.27.82-.62,1.07-1.06.24-.44.37-.91.37-1.42Z"
        />
        <path
          class="st0"
          d="M201.79,24.2c0,1.88-.5,3.5-1.49,4.86-.99,1.37-2.33,2.4-4.02,3.1-1.69.7-3.55,1.05-5.58,1.05-2.38,0-4.44-.28-6.2-.85-1.76-.56-3.32-1.54-4.69-2.93l4.53-4.53c.71.71,1.64,1.22,2.8,1.55,1.16.32,2.36.48,3.6.48,2.74,0,4.12-.86,4.12-2.58,0-.73-.19-1.3-.57-1.69-.38-.39-1.01-.65-1.89-.77l-3.47-.49c-2.55-.35-4.47-1.2-5.77-2.54-1.31-1.35-1.97-3.28-1.97-5.77,0-1.75.42-3.3,1.27-4.68.85-1.37,2.06-2.44,3.64-3.22,1.58-.77,3.44-1.16,5.56-1.16s3.96.27,5.54.82c1.58.54,2.96,1.41,4.15,2.61l-4.43,4.43c-.74-.74-1.53-1.2-2.38-1.4-.85-.2-1.88-.3-3.07-.3-1.13,0-1.99.27-2.58.81-.59.54-.89,1.16-.89,1.85,0,.51.19.96.57,1.34.45.45,1.1.73,1.97.85l3.47.47c2.52.37,4.4,1.16,5.65,2.38.75.72,1.29,1.6,1.62,2.63.33,1.03.5,2.25.5,3.67Z"
        />
        <path
          class="st0"
          d="M224.3,10.56h-7.07v22.43h-7.05V10.56h-7.07v-6.28h21.19v6.28Z"
        />
        <path
          class="st0"
          d="M248.05,18.63v.96c0,1.6-.06,2.98-.17,4.14-.11,1.15-.38,2.27-.8,3.35-.42,1.08-1.06,2.05-1.93,2.91-1.06,1.06-2.23,1.87-3.51,2.41-1.28.54-2.78.82-4.52.82-1.17,0-2.22-.12-3.16-.36-.94-.24-1.8-.6-2.6-1.07-.79-.47-1.54-1.07-2.25-1.79-1.26-1.26-2.06-2.69-2.4-4.29-.34-1.6-.51-3.64-.51-6.1v-1.93c0-2.47.17-4.51.51-6.11.34-1.61,1.14-3.04,2.4-4.3,1.09-1.09,2.27-1.9,3.53-2.42,1.27-.52,2.76-.79,4.48-.79s3.23.27,4.51.8c1.27.53,2.45,1.34,3.52,2.41.87.87,1.51,1.84,1.93,2.92.42,1.08.69,2.2.8,3.36.11,1.15.17,2.53.17,4.14v.97ZM241,18.63c0-2.44-.08-4.11-.25-5-.16-.89-.43-1.58-.8-2.05-.26-.37-.65-.67-1.15-.91-.51-.24-1.07-.35-1.68-.35s-1.15.11-1.63.34c-.49.23-.88.54-1.18.92-.24.3-.43.67-.58,1.11-.15.44-.27,1.12-.34,2.03s-.12,2.21-.12,3.91.04,2.98.12,3.89c.08.91.19,1.58.34,2.02.15.43.34.8.58,1.1.67.87,1.61,1.3,2.82,1.3s2.17-.43,2.84-1.3c.37-.51.63-1.2.8-2.06.16-.86.25-2.51.25-4.95Z"
        />
        <path
          class="st0"
          d="M275.18,32.98h-6.16l-9.2-14.43v14.43h-7.05V4.27h6.17l9.19,14.43V4.27h7.05v28.71Z"
        />
        <path
          class="st0"
          d="M300.21,32.98h-19.51V4.27h19.51v6.28h-12.46v4.8h10.65v6.28h-10.65v5.06h12.46v6.28Z"
        />
        <polygon
          class="st0"
          points="51.43 4.27 43.36 4.27 32.13 18.63 43.36 32.98 51.43 32.98 40.19 18.63 51.43 4.27"
        />
      </g>
      <polygon
        class="st1"
        points="22.51 4.27 14.45 4.27 3.21 18.63 14.45 32.98 22.51 32.98 11.27 18.63 22.51 4.27"
      />
      <g>
        <path
          class="st1"
          d="M163.81,60.41h12.16v5.66h-19.64v-28.29h7.48v22.63Z"
        />
        <path class="st1" d="M189.85,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M203.95,37.77l5.81,17.1,5.86-17.1h8.15l-10.63,28.29h-6.71l-10.63-28.29h8.15Z"
        />
        <path class="st1" d="M237.19,66.06h-7.48v-28.29h7.48v28.29Z"/>
        <path
          class="st1"
          d="M270.34,37.77v28.29h-6.04l-11.44-15.66v15.66h-7.03v-28.29h5.95l11.53,15.87v-15.87h7.03Z"
        />
        <path
          class="st1"
          d="M301.55,51.1v3.03c0,8.45-4.37,12.34-11.44,12.34s-12.25-3.9-12.25-12.34v-3.85c0-9.1,5.18-12.92,12.25-12.92s10.54,3.61,11.44,9.14h-7.12c-.32-1.76-1.62-3.48-4.32-3.48-3.11,0-4.78,2.05-4.78,6.68v4.43c0,4.63,1.67,6.68,4.78,6.68s4.01-1.72,4.28-4.06h-4.14v-5.66h11.31Z"
        />
      </g>
    </svg>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">406 w South Jordan Parkway Suite 600
        <br>South Jordan, UT 84095
        <br>Phone: (888) 521-5111
        <br>Email: Accountmanagement@Uownleasing.com
Marcos Silvano
Marcos Silvano
@marcos.pacheco.silva
1 dia atrás
Autor
Maintainer
It can be replaced with which address

Responder…
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
      ">
      <div style="margin: 0 auto;margin-top: 35px;width: 500;">
        Date: <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">Personal and Confidential for:
        <br><span th:text=" ${CommonDataPojo.customerFirstName}"></span> <span
          th:text=" ${CommonDataPojo.customerLastName}"></span>
        <br><span th:text=" ${CommonDataPojo.customerStreetAddress1}"></span> <span
          th:text=" ${CommonDataPojo.customerStreetAddress2}"></span>
        <br><span th:text=" ${CommonDataPojo.customerCity}"></span> , <span
          th:text=" ${CommonDataPojo.customerState}"></span> <span th:text=" ${CommonDataPojo.customerZipCode}"></span>
        <br><br>Kornerstone Account Number: <span th:text=" ${CommonDataPojo.accountPK}"></span>
      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: left;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 500;">Dear <span th:text=" ${CommonDataPojo.customerFirstName}"></span> <span
        th:text=" ${CommonDataPojo.customerLastName}"></span>,
        <br>
        <br>This letter confirms that on <span th:text="'' +  ${CommonDataPojo.paymentDate}"></span> we processed a
        payment in the amount of <span th:text=" ${CommonDataPojo.lastPaymentAmount}"></span>. The above referenced
        account is now closed and (settled) in full.*
        <br>
        <br>Customer satisfaction is our primary focus. Our goal is to provide you with the best quality products at the
        most reasonable price.
        <br><br> Thank you for choosing Kornerstone! <br><br>

      </div>
    </div>
    <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
        margin: 20px 0;
      ">
      <div style="margin: 35px auto;width: 420;">* If any lease term payments do not clear, the paid/settled in full
        status of the account will be voided.
      </div>
    </div>
    <div style="
            background-color: rgba(247,247,247,1);
            padding: 30px 0;
            width: 572px;
            margin-left: 12px;
            margin-top: 41px;
            ">
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
      ">
        WE’RE HERE TO HELP!
      </div>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
      ">
        Call the number below to speak to one of<br>our customer service representatives.
      </p>
      <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #8FC31F;
      ">
        <a th:href="'https://app.kornerstonecredit.com/Authentication/Login' + ${CommonDataPojo.customerPortalParameters}" target="_blank">kornerstonecredit.com</a>
      </p>
      <div style="margin: 23px 0;">
        <div style="
      width: 572px;
      display: block;
      height: 60px;
      ">
          <div style="width: 377px;margin: 0px auto;">
            <div style="
            overflow: visible;
            font-family: Helvetica Neue;
            font-style: normal;
            font-weight: bold;
            font-size: 14px;
            color: #8FC31F;
            text-align: center;
          ">
              Mon - Fri<span style="font-style: normal; font-weight: normal;">: 7am - 7pm MST</span><br>
              Sat<span style="font-style: normal; font-weight: normal;">: 7am-3:30pm MST</span><br />
              Sun<span style="font-style: normal; font-weight: normal;">: Closed</span>
            </div>
          </div>
        </div>
        <div style="
      width: 572px;
      display: block;
      height: 53px;
      ">
          <div style="width: 572px;">
            <div style="
			    overflow: visible;
			    font-family: Helvetica Neue;
			    font-style: normal;
			    font-weight: bold;
			    font-size: 14px;
			    color: #8FC31F;
			    text-align: center;
			  ">
              cs@kornerstoneliving.com<br>
              (888) 521-5111
            </div>
          </div>
        </div>
      </div>
      <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: rgba(34, 34, 34, 1);
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
        FOLLOW US ON SOCIAL MEDIA!
      </div>
      <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
        <div style="margin: 0 auto; display: inline-block;">
          <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
            <svg style="
            overflow: visible;
            width: 19.77px;
            height: 19.771px;
            transform: matrix(1, 0, 0, 1, 0, 0);
          " viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>

          <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
            <svg style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
        	" viewBox="0 0 24 24" fill="#8FC31F" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
      <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
    </div>
  </div>
</div>
</body>
</html>

 src/main/resources/correspondence/templates/finalize-purchase-email.html 
+
1
−
1

Visualizado
@@ -125,7 +125,7 @@
        color: rgba(94, 203, 245, 1);
	      text-decoration: none;
      ">
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}"; style="text-decoration: none">www.uownleasing.com</a>
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}" style="text-decoration: none">www.uownleasing.com</a>
    </p>
    <div style="margin: 23px 0;">
      <div style="
 src/main/resources/correspondence/templates/initial-payment-receipt-email.html 
+
1
−
1

Visualizado
@@ -185,7 +185,7 @@
        color: rgba(94, 203, 245, 1);
	      text-decoration: none;
      ">
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}" ;="" style="text-decoration: none">www.uownleasing.com</a>
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}" style="text-decoration: none">www.uownleasing.com</a>
    </p>
    <div style="margin: 23px 0;">
      <div style="
 src/main/resources/correspondence/templates/send-application-email.html 
+
1
−
1

Visualizado
@@ -138,7 +138,7 @@
        color: rgba(94, 203, 245, 1);
	      text-decoration: none;
      ">
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}"; style="text-decoration: none">www.uownleasing.com</a>
      <a th:href="'https://portal.uownleasing.com' + ${CommonDataPojo.customerPortalParameters}" style="text-decoration: none">www.uownleasing.com</a>
    </p>
    <div style="margin: 23px 0;">
      <div style="

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### **TESTES DE TEMPLATES KORNERSTONE**

7. **Teste: Template - customer-portal-reminder-email**
   - Validar renderização do logo Kornerstone
   - Validar link para `kornerstonecredit.com`
   - Validar dados dinâmicos: `customerFirstName`, `customerPortalParameters`
   - Validar horários MST corretos

8. **Teste: Template - days-past-due-monthly-email**
   - Validar dados: `accountPK`, `daysDelinquent`
   - Validar link de pagamento
   - Validar número de telefone: `877-357-5474`
   - Validar opção de devolução de mercadoria

9. **Teste: Template - delinquency-30-day-offer-email**
   - Validar oferta de desconto
   - Validar dados: `accountPK`, `balance`
   - Validar link de pagamento
   - Validar CTA "GO TO THE PORTAL"

10. **Teste: Template - delinquency-60-day-offer-email**
    - Validar oferta de desconto 60 dias
    - Validar dados dinâmicos corretos
    - Validar formatação HTML

11. **Teste: Template - delinquency-90-day-offer-email**
    - Validar oferta de desconto 90 dias
    - Validar dados dinâmicos corretos
    - Validar formatação HTML

12. **Teste: Template - delinquency-150-day-offer-email**
    - Validar oferta de desconto 150+ dias
    - Validar dados dinâmicos corretos
    - Validar formatação HTML

13. **Teste: Template - delinquency-reminder-email**
    - Validar conteúdo de lembrete
    - Validar dados: `accountPK`, `daysDelinquent`
    - Validar contato de suporte

14. **Teste: Template - first-payment-default-email**
    - Validar aviso de primeiro pagamento em atraso
    - Validar dados: `accountPK`
    - Validar opções de pagamento

15. **Teste: Template - paid-in-full-email**
    - Validar confirmação de pagamento completo
    - Validar dados: `accountPK`, `lastPaymentAmount`
    - Validar status de conta fechada

16. **Teste: Template - payment-decline-email**
    - Validar aviso de pagamento recusado
    - Validar dados: `accountPK`
    - Validar instruções para novo pagamento

17. **Teste: Template - payment-receipt-email**
    - Validar recibo de pagamento
    - Validar dados: `accountPK`, `paymentAmount`, `paymentDate`
    - Validar saldo restante

18. **Teste: Template - recurring-payment-reminder-email**
    - Validar lembrete de pagamento recorrente
    - Validar dados: `accountPK`, `nextPaymentDate`
    - Validar valor do pagamento

19. **Teste: Template - second-lease-opportunity-paid-account**
    - Validar oferta de segunda oportunidade
    - Validar dados: `customerFirstName`, `newApprovalAmount`, `merchantLocationName`
    - Validar CTA "NO MONEY DOWN"
    - Validar benefícios: 90-Day Special, Payment up to 13 Months

20. **Teste: Template - settled-in-full-email**
    - Validar carta de liquidação
    - Validar dados: `customerFirstName`, `customerLastName`, `accountPK`, `paymentDate`, `lastPaymentAmount`
    - Validar endereço Kornerstone
    - Validar aviso de rescisão

### **TESTES DE CORREÇÕES HTML**

21. **Teste: Template - finalize-purchase-email (correção)**
    - Validar que `;` foi removido do atributo `th:href`
    - Validar que link ainda funciona corretamente

22. **Teste: Template - initial-payment-receipt-email (correção)**
    - Validar que `;` foi removido do atributo `th:href`
    - Validar que link ainda funciona corretamente

23. **Teste: Template - send-application-email (correção)**
    - Validar que `;` foi removido do atributo `th:href`
    - Validar que link ainda funciona corretamente

### **TESTES DE INTEGRAÇÃO**

24. **Teste: Fluxo completo - Correspondência Kornerstone**
    - Criar conta com `companyId = "Kornerstone"`
    - Disparar evento de correspondência
    - Validar que template Kornerstone é selecionado
    - Validar que email é enviado com conteúdo correto

25. **Teste: Fluxo completo - Compatibilidade com outras empresas**
    - Criar conta com `companyId` diferente de Kornerstone
    - Disparar evento de correspondência
    - Validar que template padrão é selecionado
    - Validar que email é enviado com conteúdo correto

26. **Teste: Renderização de templates**
    - Validar que todos os 14 templates Kornerstone renderizam sem erros
    - Validar que variáveis Thymeleaf são processadas corretamente
    - Validar que imagens carregam corretamente

27. **Teste: Responsividade de emails**
    - Validar que templates Kornerstone são responsivos em mobile
    - Validar que layout se adapta a diferentes larguras
    - Validar que imagens escalam corretamente

28. **Teste: Dados dinâmicos - CommonDataPojo**
    - Validar que todos os campos esperados estão presentes
    - Validar que valores são renderizados corretamente
    - Validar que valores nulos são tratados

29. **Teste: Links e CTAs**
    - Validar que todos os links em templates Kornerstone funcionam
    - Validar que `customerPortalParameters` é adicionado corretamente
    - Validar que números de telefone são clicáveis

30. **Teste: Branding Kornerstone**
    - Validar que logo Kornerstone aparece em todos os templates
    - Validar que cores Kornerstone (#8FC31F, #231f20) são consistentes
    - Validar que fontes são Helvetica Neue conforme design

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

curl --location 'https://svc-{{env}}.uownleasing.com/uown/loadTemplates' \
--header 'Content-Type: application/json' \
--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' \
--data '[
    "KcCustomerPortalReminderEmail",-
    "KcDaysPastDueMonthlyEmail",
    "KcDelinquency150DayOfferEmail",
    "KcDelinquency30DayOfferEmail",
    "KcDelinquency60DayOfferEmail",
    "KcDelinquency90DayOfferEmail",
    "KcDelinquencyReminderEmail",
    "KcFirstPaymentDefaultEmail",
    "KcPaidInFullEmail",
    "KcPaymentDeclineEmail",
    "KcPaymentReceiptEmail",
    "KcSecondLease-PaidOff",
    "KcSettledInFullEmail"
]'

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin

> ![Screenshot_at_Dec_09_15-11-00](/uploads/21be9cf0a00d001efb8c2470ac7b8bcb/Screenshot_at_Dec_09_15-11-00.png){width=423 height=600}
> ![Screenshot_at_Dec_09_16-32-17](/uploads/0f7425ebae085ae95ae598aaa07d4eb9/Screenshot_at_Dec_09_16-32-17.png){width=360 height=600}
> ![Screenshot_at_Dec_09_16-45-17](/uploads/143a2723ef209d79fc4d9d7723fefb7c/Screenshot_at_Dec_09_16-45-17.png){width=356 height=600}
> ![Screenshot_at_Dec_09_16-45-55](/uploads/f5992e98b9665165b27b4bdc19629e5d/Screenshot_at_Dec_09_16-45-55.png){width=356 height=600}
> ![Screenshot_at_Dec_09_16-53-57](/uploads/aba2ea2b0ac78263964c42ec0714de34/Screenshot_at_Dec_09_16-53-57.png){width=353 height=600}
> ![Screenshot_at_Dec_09_17-27-42](/uploads/7b80c203a35daec0ecd6d148faa3e6d5/Screenshot_at_Dec_09_17-27-42.png){width=308 height=600}
> ![Screenshot_at_Dec_09_20-55-15](/uploads/5cc226d34927bf858df6fcdcaf9fef12/Screenshot_at_Dec_09_20-55-15.png){width=319 height=600}
> ![Screenshot_at_Dec_09_16-33-38](/uploads/de893941c5d996b75388c09eb6735ca3/Screenshot_at_Dec_09_16-33-38.png){width=420 height=600}
> ![Screenshot_at_Dec_09_16-33-58](/uploads/5c61d1cbdf51fbe85d92417931c1ae40/Screenshot_at_Dec_09_16-33-58.png){width=358 height=600}

> **| PASS |**

> ```

---

> ## Tests in qa2

***Operating hours adjustments, phone number update, and customer portal access URL update***

![image](/uploads/d93258bcc4cced62854c97759d5a6c32/image.png){width=420 height=600}
![image](/uploads/4fb22570ab03e267f13bed4df15e0d2f/image.png){width=601 height=600}


---

***Uown maintains the same redirection to the customer portal.***

![image](/uploads/86a4e23019d3cd3a792003d4706955e9/image.png){width=442 height=600}
![image](/uploads/076792453d864cb40627db5c508c5ce4/image.png){width=377 height=278}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

