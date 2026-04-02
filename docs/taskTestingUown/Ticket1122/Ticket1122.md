---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1122


UOWN | Origination | Merchant Settings – Investigate Duplicate Program Addition Generates Incorrect Log


BUG
In the Origination Portal, when using the Merchant Settings page to add programs to a merchant, if the same program is added again (already previously assigned), the system generates an incorrect log in the Merchant Modification History.
The log shows flags changing from false to null, which is misleading and not the expected behavior.


FIX
* Remove the incorrect log entries that show false → null when adding a duplicate program.
* If possible, add a new log entry that explicitly indicates: “Program already assigned to this merchant” or equivalent.
* Ensure no duplicate or misleading logs are generated in Merchant Modification History.
* Validate fix across different merchants and program assignment scenarios.


![alt text](image.png)

Steps-to-Reproduce
* Go to the Merchant Settings page in Origination.
* Add a program to a merchant.
* Attempt to add the same program again to the same merchant.
* Check the Merchant Modification History.


Expected Result:
* The system should prevent redundant or misleading logs.
* Ideally, generate a clear log entry stating that the program was already updated/added previously.


Actual Result:
A robust log is created, showing flags changing from false to null.

---



-----

deployament instructions
Assign the defaults that used to defined by the custom get

UPDATE uown_merchant m SET is_item_split = FALSE WHERE m.is_item_split IS NULL;
UPDATE uown_merchant m SET check_uw_for_verification = FALSE WHERE m.check_uw_for_verification IS NULL;
UPDATE uown_merchant m SET charge_processing_fee_before_esign = FALSE WHERE m.charge_processing_fee_before_esign IS NULL;
UPDATE uown_merchant m SET charge_processing_fee = FALSE WHERE m.charge_processing_fee IS NULL;
UPDATE uown_merchant m SET allow_change_to_expired = FALSE WHERE m.allow_change_to_expired IS NULL;
UPDATE uown_merchant m SET hold_deposit = FALSE WHERE m.hold_deposit IS NULL;
UPDATE uown_merchant m SET is_cc_required = FALSE WHERE m.is_cc_required IS NULL;
UPDATE uown_merchant m SET is_ach_required = FALSE WHERE m.is_ach_required IS NULL;
UPDATE uown_merchant m SET is_fpd_required = FALSE WHERE m.is_fpd_required IS NULL;
UPDATE uown_merchant m SET is_signed_to_funding = FALSE WHERE m.is_signed_to_funding IS NULL;
UPDATE uown_merchant m SET is_fraud_check_required = FALSE WHERE m.is_fraud_check_required IS NULL;
UPDATE uown_merchant m SET verify_email = FALSE WHERE m.verify_email IS NULL;
UPDATE uown_merchant m SET verify_phone = FALSE WHERE m.verify_phone IS NULL;
UPDATE uown_merchant m SET verify_ip = FALSE WHERE m.verify_ip IS NULL;
UPDATE uown_merchant m SET use_webhook = FALSE WHERE m.use_webhook IS NULL;
UPDATE uown_merchant m SET is_bank_verification_required = FALSE WHERE m.is_bank_verification_required IS NULL;
UPDATE uown_merchant m SET is_plaid_verification_required = FALSE WHERE m.is_plaid_verification_required IS NULL;
UPDATE uown_merchant m SET auto_deny_application = FALSE WHERE m.auto_deny_application IS NULL;
UPDATE uown_merchant m SET accept_new_apps = FALSE WHERE m.accept_new_apps IS NULL;
UPDATE uown_merchant m SET buyout_fee = 0 WHERE m.buyout_fee IS NULL;
UPDATE uown_merchant m SET use_sentilink = FALSE WHERE m.use_sentilink IS NULL;
UPDATE uown_merchant m SET use_neustar = FALSE WHERE m.use_neustar IS NULL;
UPDATE uown_merchant m SET send_finalize_notice = FALSE WHERE m.send_finalize_notice IS NULL;
UPDATE uown_merchant m SET esign_client = 'SIGNWELL' WHERE m.esign_client IS NULL;
UPDATE uown_merchant m SET record_signing_flow = FALSE WHERE m.record_signing_flow IS NULL;
UPDATE uown_merchant m SET return_lambda_score = FALSE WHERE m.return_lambda_score IS NULL;
UPDATE uown_merchant m SET is_deleted = FALSE WHERE m.is_deleted IS NULL;
UPDATE uown_merchant m SET remove_merchant_from_users = FALSE WHERE m.remove_merchant_from_users IS NULL;
UPDATE uown_merchant m SET cc_processing_fee_percent = 0 WHERE m.cc_processing_fee_percent IS NULL;
UPDATE uown_merchant m SET use_neuro_id_check = FALSE WHERE m.use_neuro_id_check IS NULL;
UPDATE uown_merchant m SET use_lexis_nexis = FALSE WHERE m.use_lexis_nexis IS NULL;
UPDATE uown_merchant m SET offer_insurance = FALSE WHERE m.offer_insurance IS NULL;


check if nulls still exist

SELECT 
COUNT(CASE WHEN m.is_item_split IS NULL THEN 1 END) AS is_item_split_null_count,
COUNT(CASE WHEN m.check_uw_for_verification IS NULL THEN 1 END) AS check_uw_for_verification_null_count,
COUNT(CASE WHEN m.charge_processing_fee_before_esign IS NULL THEN 1 END) AS charge_processing_fee_before_esign_null_count,
COUNT(CASE WHEN m.charge_processing_fee IS NULL THEN 1 END) AS charge_processing_fee_null_count,
COUNT(CASE WHEN m.allow_change_to_expired IS NULL THEN 1 END) AS allow_change_to_expired_null_count,
COUNT(CASE WHEN m.hold_deposit IS NULL THEN 1 END) AS hold_deposit_null_count,
COUNT(CASE WHEN m.is_cc_required IS NULL THEN 1 END) AS is_cc_required_null_count,
COUNT(CASE WHEN m.is_ach_required IS NULL THEN 1 END) AS is_ach_required_null_count,
COUNT(CASE WHEN m.is_fpd_required IS NULL THEN 1 END) AS is_fpd_required_null_count,
COUNT(CASE WHEN m.is_signed_to_funding IS NULL THEN 1 END) AS is_signed_to_funding_null_count,
COUNT(CASE WHEN m.is_fraud_check_required IS NULL THEN 1 END) AS is_fraud_check_required_null_count,
COUNT(CASE WHEN m.verify_email IS NULL THEN 1 END) AS verify_email_null_count,
COUNT(CASE WHEN m.verify_phone IS NULL THEN 1 END) AS verify_phone_null_count,
COUNT(CASE WHEN m.verify_ip IS NULL THEN 1 END) AS verify_ip_null_count,
COUNT(CASE WHEN m.use_webhook IS NULL THEN 1 END) AS use_webhook_null_count,
COUNT(CASE WHEN m.is_bank_verification_required IS NULL THEN 1 END) AS is_bank_verification_required_null_count,
COUNT(CASE WHEN m.is_plaid_verification_required IS NULL THEN 1 END) AS is_plaid_verification_required_null_count,
COUNT(CASE WHEN m.auto_deny_application IS NULL THEN 1 END) AS auto_deny_application_null_count,
COUNT(CASE WHEN m.accept_new_apps IS NULL THEN 1 END) AS accept_new_apps_null_count,
COUNT(CASE WHEN m.buyout_fee IS NULL THEN 1 END) AS buyout_fee_null_count,
COUNT(CASE WHEN m.use_sentilink IS NULL THEN 1 END) AS use_sentilink_null_count,
COUNT(CASE WHEN m.use_neustar IS NULL THEN 1 END) AS use_neustar_null_count,
COUNT(CASE WHEN m.send_finalize_notice IS NULL THEN 1 END) AS send_finalize_notice_null_count,
COUNT(CASE WHEN m.esign_client IS NULL THEN 1 END) AS esign_client_null_count,
COUNT(CASE WHEN m.record_signing_flow IS NULL THEN 1 END) AS record_signing_flow_null_count,
COUNT(CASE WHEN m.return_lambda_score IS NULL THEN 1 END) AS return_lambda_score_null_count,
COUNT(CASE WHEN m.is_deleted IS NULL THEN 1 END) AS is_deleted_null_count,
COUNT(CASE WHEN m.remove_merchant_from_users IS NULL THEN 1 END) AS remove_merchant_from_users_null_count,
COUNT(CASE WHEN m.cc_processing_fee_percent IS NULL THEN 1 END) AS cc_processing_fee_percent_null_count,
COUNT(CASE WHEN m.use_neuro_id_check IS NULL THEN 1 END) AS use_neuro_id_check_null_count,
COUNT(CASE WHEN m.use_lexis_nexis IS NULL THEN 1 END) AS use_lexis_nexis_null_count,
COUNT(CASE WHEN m.offer_insurance IS NULL THEN 1 END) AS offer_insurance_null_count
FROM uown_merchant m;

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ALTERACOES DEV:

Comparar
e
 3 arquivos
+
110
−
109
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/merc
‎hant-info-panels‎

add-or-edit-
‎merchant.tsx‎
+101 -101

merchant-inf
‎ormation.tsx‎
+1 -0

mod
‎els‎

merchant-s
‎ettings.ts‎
+8 -8

 components/merchant-info-panels/add-or-edit-merchant.tsx 
+
101
−
101

Visualizado
@@ -36,7 +36,7 @@ import {convertArrayToString, createOption} from './merchant-helper';
import {differenceWith} from 'lodash';
import {TERMINATION_REASONS} from './settings';
import {useRouter} from 'next/router';
import { ProgramStore } from '@stores/program';
import {ProgramStore} from '@stores/program';

interface AddOrEditMerchantProps {
  accountStore: AccountStore;
@@ -99,7 +99,7 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
    allProgramOptions,
    createInventoryCategory,
    isLoadingMerchantData,
    programStore
    programStore,
  } = props;

  const router = useRouter();
@@ -296,7 +296,7 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
      isActive: handleBoolInitialValue(merchantBeingEdited?.isActive || false),
      routingNumber: merchantBeingEdited?.bankAccountInfo?.routingNumber || '',
      accountNumber: merchantBeingEdited?.bankAccountInfo?.accountNumber || '',
      isSignedToFunding: merchantBeingEdited?.isSignedToFunding,
      isSignedToFunding: merchantBeingEdited?.isSignedToFunding ?? false,
      isFraudCheckRequired: handleBoolInitialValue(
        merchantBeingEdited?.isFraudCheckRequired || false,
      ),
@@ -422,29 +422,29 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
      contactPhone: Yup.string().required('Contact Phone is Required'),
      validStates: Yup.array().min(1, 'Please select at least one valid state'),
      taxExemptedStates: Yup.array().nullable(),
      checkUwForVerification: Yup.boolean().nullable(),
      checkUwForVerification: Yup.boolean().default(false),
      isActive: Yup.boolean().nullable(),
      esignClient: Yup.string().nullable().required('eSign Client is Required'),
      isSignedToFunding: Yup.boolean().nullable(),
      isFraudCheckRequired: Yup.boolean().nullable(),
      verifyEmail: Yup.boolean().nullable(),
      verifyPhone: Yup.boolean().nullable(),
      verifyIp: Yup.boolean().nullable(),
      useWebhook: Yup.boolean().nullable(),
      isItemSplit: Yup.boolean().nullable(),
      isSignedToFunding: Yup.boolean().default(false),
      isFraudCheckRequired: Yup.boolean().default(false),
      verifyEmail: Yup.boolean().default(false),
      verifyPhone: Yup.boolean().default(false),
      verifyIp: Yup.boolean().default(false),
      useWebhook: Yup.boolean().default(false),
      isItemSplit: Yup.boolean().default(false),
      ccProcessingFeePercent: Yup.number().when(['isItemSplit'], {
        is: (isItemSplit) => isItemSplit,
        then: Yup.number().required('CC Processing Fee is required.'),
        otherwise: Yup.number().nullable(),
        otherwise: Yup.number().default(0),
      }),
      recordSigningFlow: Yup.boolean().nullable(),
      recordSigningFlow: Yup.boolean().default(false),
      verifyPhoneBeforeSigning: Yup.boolean().nullable(),
      isDeleted: Yup.boolean().nullable(),
      acceptNewApps: Yup.boolean().nullable(),
      isDeleted: Yup.boolean().default(false),
      acceptNewApps: Yup.boolean().default(true),
      sendAutomatedFundingReport: Yup.boolean().nullable(),
      isBankVerificationRequired: Yup.boolean().nullable(),
      isAchRequired: Yup.boolean().nullable(),
      isCcRequired: Yup.boolean().nullable(),
      isBankVerificationRequired: Yup.boolean().default(false),
      isAchRequired: Yup.boolean().default(false),
      isCcRequired: Yup.boolean().default(false),
      approvalAmountIncrease: Yup.number().required(
        'Approval Amount Increase is required.',
      ),
@@ -463,10 +463,10 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
        otherwise: Yup.string().nullable(),
      }),
      postMessage: Yup.boolean().nullable(),
      removeMerchantFromUsers: Yup.boolean().nullable(),
      removeMerchantFromUsers: Yup.boolean().default(false),
      merchantSupport: Yup.string().nullable(),
      useLexisNexis: Yup.boolean().nullable(),
      useNeuroIdCheck: Yup.boolean().nullable(),
      useLexisNexis: Yup.boolean().default(false),
      useNeuroIdCheck: Yup.boolean().default(false),
      twoDayFundingException: Yup.boolean().nullable(),
      fiveDayFundingException: Yup.boolean().nullable(),
      offerInsurance: Yup.boolean().default(() => false),
@@ -493,96 +493,96 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
        );
      if (!hasCreateOrUpdateMerchantLogPermissionOnly) {
        let requestData: MerchantInfo = {
          merchantPK: merchantBeingEdited?.merchantPK || null,
          merchantPK: merchantBeingEdited?.merchantPK,
          refMerchantCode: values?.merchantCode?.trim(),
          merchantName: values?.merchantName?.trim() || '',
          locationName: values?.locationName?.trim() || '',
          legalName: values?.legalName?.trim() || '',
          locationAddress1: values?.merchantAddress?.trim() || '',
          city: values?.merchantCity?.trim() || '',
          state: values?.merchantState?.trim() || '',
          zipCode: values?.merchantZipCode?.trim() || '',
          country: values?.merchantCountry?.trim() || '',
          county: values?.merchantCounty?.trim() || '',
          phoneNumber: values?.merchantPhone?.trim() || '',
          fax: values?.merchantFax?.trim() || '',
          merchantUrl: values?.merchantUrl?.trim() || '',
          merchantName: values?.merchantName?.trim() ?? '',
          locationName: values?.locationName?.trim() ?? '',
          legalName: values?.legalName?.trim() ?? '',
          locationAddress1: values?.merchantAddress?.trim() ?? '',
          city: values?.merchantCity?.trim() ?? '',
          state: values?.merchantState?.trim() ?? '',
          zipCode: values?.merchantZipCode?.trim() ?? '',
          country: values?.merchantCountry?.trim() ?? '',
          county: values?.merchantCounty?.trim() ?? '',
          phoneNumber: values?.merchantPhone?.trim() ?? '',
          fax: values?.merchantFax?.trim() ?? '',
          merchantUrl: values?.merchantUrl?.trim() ?? '',
          category: values?.merchantCategory
            ? values?.merchantCategory.toUpperCase().trim()
            : null,
          salesRepCode: values?.salesRepCode?.trim() || '',
          username: values?.merchantUsername?.trim() || '',
          apiKey: values?.merchantAPIKey?.trim() || '',
          peakCampaignId: values?.peakCampaignId || 0,
          offPeakCampaignId: values?.offPeakCampaignId || 0,
          clientType: values?.clientType || null,
          salesRepCode: values?.salesRepCode?.trim() ?? '',
          username: values?.merchantUsername?.trim() ?? '',
          apiKey: values?.merchantAPIKey?.trim() ?? '',
          peakCampaignId: values?.peakCampaignId ?? 0,
          offPeakCampaignId: values?.offPeakCampaignId ?? 0,
          clientType: values?.clientType,
          inventoryCategory: (
            values?.inventoryCategory?.label?.trim() || 'OTHER'
            values?.inventoryCategory?.label?.trim() ?? 'OTHER'
          ).toUpperCase(),
          primaryContactName: values?.contactName?.trim() || '',
          primaryContactPhone: values?.contactPhone?.trim() || '',
          primaryContactFax: values?.contactFax?.trim() || '',
          primaryContactEmail: values?.contactEmail?.trim() || '',
          altContactName: values?.alternateContactName?.trim() || '',
          altContactPhone: values?.alternateContactPhone?.trim() || '',
          altContactFax: values?.alternateContactFax?.trim() || '',
          altContactEmail: values?.alternateContactEmail?.trim() || '',
          numDaysApprovalExp: Number(values?.numDaysApprovalExp) || 0,
          allowChangeToExpired: values?.allowChangeToExpired || false,
          numDaysLeaseDocExp: Number(values?.numDaysLeaseExp) || 0,
          dealerDiscountOverride: Number(values?.dealerDiscount) / 100 || 0,
          dealerRebateOverride: Number(values?.dealerRebate) / 100 || 0,
          storeTimings: values?.storeTimings?.trim() || '',
          merchantType: values?.merchantType?.trim() || 'ONLINE',
          primaryContactName: values?.contactName?.trim() ?? '',
          primaryContactPhone: values?.contactPhone?.trim() ?? '',
          primaryContactFax: values?.contactFax?.trim() ?? '',
          primaryContactEmail: values?.contactEmail?.trim() ?? '',
          altContactName: values?.alternateContactName?.trim() ?? '',
          altContactPhone: values?.alternateContactPhone?.trim() ?? '',
          altContactFax: values?.alternateContactFax?.trim() ?? '',
          altContactEmail: values?.alternateContactEmail?.trim() ?? '',
          numDaysApprovalExp: Number(values?.numDaysApprovalExp ?? 0),
          allowChangeToExpired: values?.allowChangeToExpired ?? false,
          numDaysLeaseDocExp: Number(values?.numDaysLeaseExp ?? 0),
          dealerDiscountOverride: Number(values?.dealerDiscount ?? 0) / 100,
          dealerRebateOverride: Number(values?.dealerRebate ?? 0) / 100,
          storeTimings: values?.storeTimings?.trim() ?? '',
          merchantType: values?.merchantType?.trim() ?? 'ONLINE',
          dealerRebateType: (
            values?.dealerRebateType?.trim() || ''
            values?.dealerRebateType?.trim() ?? ''
          ).toUpperCase(),
          esignMode: values?.esignMode?.trim() || 'EMBEDDED',
          esignMode: values?.esignMode?.trim() ?? 'EMBEDDED',
          esignClient: values?.esignClient,
          defaultLoanAmount: convertCurrencyToFloat(
            values?.defaultLoanAmount || 0,
            values?.defaultLoanAmount ?? 0,
          ),
          minimumLeaseAmount: convertCurrencyToFloat(
            values?.minimumLeaseAmount || 0,
            values?.minimumLeaseAmount ?? 0,
          ),
          validStates: convertArrayToString(values?.validStates)?.trim() || '',
          validStates: convertArrayToString(values?.validStates)?.trim() ?? '',
          taxExemptedStates:
            convertArrayToString(values?.taxExemptedStates)?.trim() || '',
            convertArrayToString(values?.taxExemptedStates)?.trim() ?? '',
          chargeProcessingFeeBeforeEsign:
            values?.chargeProcessingFeeBeforeEsign || false,
          isIntellicheckRequired: values?.isIntellicheckRequired || false,
          isSeonIdCheckRequired: values?.isSeonIdCheckRequired || false,
          holdDeposit: values?.holdDeposit || false,
          platformFee: Number(values?.platformFee) / 100 || 0,
          platFormFeeType: values?.platFormFeeType?.trim() || 'MONTHLY',
            values?.chargeProcessingFeeBeforeEsign ?? false,
          isIntellicheckRequired: values?.isIntellicheckRequired ?? false,
          isSeonIdCheckRequired: values?.isSeonIdCheckRequired ?? false,
          holdDeposit: values?.holdDeposit ?? false,
          platformFee: Number(values?.platformFee ?? 0) / 100,
          platFormFeeType: values?.platFormFeeType?.trim() ?? 'MONTHLY',
          allowedFrequencies: convertArrayToString(
            values?.allowedFrequencies,
          )?.trim(),
          checkUwForVerification: values?.checkUwForVerification || false,
          isActive: values?.isActive || false,
          isSignedToFunding: values?.isSignedToFunding || false,
          isFraudCheckRequired: values?.isFraudCheckRequired || false,
          verifyEmail: values?.verifyEmail || false,
          verifyPhone: values?.verifyPhone || false,
          verifyIp: values?.verifyIp || false,
          useWebhook: values?.useWebhook || false,
          isItemSplit: values?.isItemSplit || false,
          checkUwForVerification: values?.checkUwForVerification ?? false,
          isActive: values?.isActive ?? false,
          isSignedToFunding: values?.isSignedToFunding ?? false,
          isFraudCheckRequired: values?.isFraudCheckRequired ?? false,
          verifyEmail: values?.verifyEmail ?? false,
          verifyPhone: values?.verifyPhone ?? false,
          verifyIp: values?.verifyIp ?? false,
          useWebhook: values?.useWebhook ?? false,
          isItemSplit: values?.isItemSplit ?? false,
          ccProcessingFeePercent:
            Number(values?.ccProcessingFeePercent) / 100 || 0,
          clonedFrom: values?.clonedFrom || null,
          clonedFromName: values?.clonedFromName?.trim() || '',
          verifyPhoneBeforeSigning: values?.verifyPhoneBeforeSigning || false,
            Number(values?.ccProcessingFeePercent ?? 0) / 100,
          clonedFrom: values?.clonedFrom,
          clonedFromName: values?.clonedFromName?.trim() ?? '',
          verifyPhoneBeforeSigning: values?.verifyPhoneBeforeSigning ?? false,
          approvalAmountIncrease:
            Number(values?.approvalAmountIncrease) / 100 || 0,
          chargeProcessingFee: values?.chargeProcessingFee || false,
          isDeleted: values?.isDeleted || false,
          acceptNewApps: values?.acceptNewApps || false,
            Number(values?.approvalAmountIncrease ?? 0) / 100,
          chargeProcessingFee: values?.chargeProcessingFee ?? true,
          isDeleted: values?.isDeleted ?? false,
          acceptNewApps: values?.acceptNewApps ?? false,
          lendingCategoryList: convertArrayToString(
            values?.lendingCategoryList,
          )?.trim(),
          buyoutFee: convertCurrencyToFloat(values?.buyoutFee || 0),
          buyoutFee: convertCurrencyToFloat(values?.buyoutFee ?? 0),
          sendAutomatedFundingReport:
            values?.sendAutomatedFundingReport || false,
            values?.sendAutomatedFundingReport ?? false,
          fundingReportFrequency: convertArrayToString(
            values?.fundingReportFrequency,
          )?.trim(),
@@ -596,13 +596,13 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
            values?.mergedFundingReportEmails,
          )?.trim(),
          isBankVerificationRequired:
            values?.isBankVerificationRequired || false,
          isCcRequired: values?.isCcRequired || false,
          isAchRequired: values?.isAchRequired || false,
          webhookUrl: values?.webhookUrl?.trim() || '',
          useNeustar: values?.useNeustar || false,
          useSentilink: values?.useSentilink || false,
          postMessage: values?.postMessage || false,
            values?.isBankVerificationRequired ?? false,
          isCcRequired: values?.isCcRequired ?? true,
          isAchRequired: values?.isAchRequired ?? true,
          webhookUrl: values?.webhookUrl?.trim() ?? '',
          useNeustar: values?.useNeustar ?? false,
          useSentilink: values?.useSentilink ?? false,
          postMessage: values?.postMessage ?? false,
          recordSigningFlow: values?.recordSigningFlow,
          returnLambdaScore: values?.returnLambdaScore,
          removeMerchantFromUsers: values?.removeMerchantFromUsers,
@@ -622,16 +622,16 @@ const AddOrEditMerchant = (props: AddOrEditMerchantProps) => {
          ? existingMerchantData(requestData)
          : requestData;
        let bankAccountRequestData: BankAccountInfo = {
          merchantPK: merchantBeingEdited?.merchantPK || 0,
          name: merchantBeingEdited?.bankAccountInfo?.name || '',
          city: merchantBeingEdited?.bankAccountInfo?.city || '',
          state: merchantBeingEdited?.bankAccountInfo?.state || '',
          merchantPK: merchantBeingEdited?.merchantPK ?? 0,
          name: merchantBeingEdited?.bankAccountInfo?.name ?? '',
          city: merchantBeingEdited?.bankAccountInfo?.city ?? '',
          state: merchantBeingEdited?.bankAccountInfo?.state ?? '',
          bankTypeUsed:
            BankTypeEnum[
              merchantBeingEdited?.bankAccountInfo?.bankTypeUsed || ''
              merchantBeingEdited?.bankAccountInfo?.bankTypeUsed ?? ''
            ],
          routingNumber: values?.routingNumber || '',
          accountNumber: values?.accountNumber || '',
          routingNumber: values?.routingNumber ?? '',
          accountNumber: values?.accountNumber ?? '',
          empty: merchantBeingEdited?.bankAccountInfo?.empty,
        };
        bankAccountRequestData = merchantBeingEdited

---

Alterações 1
Todas os tópico foram resolvidos!
Comparar
e
 1 arquivo
+
1
−
134
 src/main/java/com/uownleasing/svc/pojo/MerchantInfo.java 
+
1
−
134

Visualizado
@@ -10,13 +10,10 @@ import javax.persistence.*;
import javax.validation.*;
import java.math.*;
import java.time.*;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@Data
@Valid
@ToString
public class MerchantInfo {
    @Transient
    private long merchantPK;
@@ -215,134 +212,4 @@ public class MerchantInfo {
    private String terminationReason;

    private Boolean isSeonIdCheckRequired = Boolean.FALSE;

    public Boolean getIsItemSplit() {
        return this.isItemSplit != null && this.isItemSplit;
    }

    public Boolean getCheckUwForVerification() {
        return checkUwForVerification == null ? Boolean.FALSE : checkUwForVerification;
    }

    public Boolean getChargeProcessingFeeBeforeEsign() {
        return chargeProcessingFeeBeforeEsign == null ? Boolean.FALSE : chargeProcessingFeeBeforeEsign;
    }

    public Boolean getChargeProcessingFee() {
        return chargeProcessingFee == null ? Boolean.TRUE : chargeProcessingFee;
    }

    public Boolean getAllowChangeToExpired(){
        return allowChangeToExpired == null ? Boolean.FALSE : allowChangeToExpired;
    }

    public Boolean getHoldDeposit() {
        return holdDeposit == null ? Boolean.FALSE : holdDeposit;
    }

    public Boolean getIsCcRequired() {
        return Objects.requireNonNullElse(this.isCcRequired, false);
    }

    public Boolean getIsAchRequired() {
        return Objects.requireNonNullElse(this.isAchRequired, false);
    }

    public Boolean getIsFpdRequired() {
        return Objects.requireNonNullElse(this.isFpdRequired, false);
    }

    public Boolean getIsSignedToFunding() {
        return Objects.requireNonNullElse(this.isSignedToFunding, false);
    }

    public Boolean getIsFraudCheckRequired(){
        return isFraudCheckRequired == null ? Boolean.FALSE : isFraudCheckRequired;
    }

    public Boolean getVerifyEmail(){
        return verifyEmail == null ? Boolean.FALSE : verifyEmail;
    }

    public Boolean getVerifyPhone(){
        return verifyPhone == null ? Boolean.FALSE : verifyPhone;
    }

    public Boolean getVerifyIp(){
        return verifyIp == null ? Boolean.FALSE : verifyIp;
    }

    public Boolean getUseWebhook() {
        return useWebhook == null ? Boolean.FALSE : useWebhook;
    }

    public Boolean getIsBankVerificationRequired() {
        return isBankVerificationRequired == null ? Boolean.FALSE : isBankVerificationRequired;
    }

    public Boolean getIsPlaidVerificationRequired() {
        return isPlaidVerificationRequired == null ? Boolean.FALSE : isPlaidVerificationRequired;
    }

    public Boolean getAutoDenyApplication() {
        return autoDenyApplication == null ? Boolean.FALSE : autoDenyApplication;
    }

    public Boolean getAcceptNewApps() {
        return (acceptNewApps == null) ? Boolean.TRUE : acceptNewApps;
    }

    public BigDecimal getBuyoutFee() {
        return buyoutFee == null ? BigDecimal.ZERO : buyoutFee;
    }

    public Boolean getUseSentilink() {
        return this.useSentilink==null ? Boolean.FALSE : this.useSentilink;
    }

    public Boolean getUseNeustar() {
        return this.useNeustar==null ? Boolean.FALSE : this.useNeustar;
    }

    public Boolean getSendFinalizeNotice() {
        return this.sendFinalizeNotice==null? Boolean.FALSE : this.sendFinalizeNotice;
    }

    public EsignClientEnum getEsignClient() {
        return this.esignClient==null ? EsignClientEnum.SIGNWELL : this.esignClient;
    }

    public Boolean getRecordSigningFlow() {
        return recordSigningFlow == null ? Boolean.FALSE : recordSigningFlow;
    }

    public Boolean getReturnLambdaScore() {
        return returnLambdaScore == null ? Boolean.FALSE : returnLambdaScore;
    }

    public Boolean getIsDeleted(){
        if(this.isDeleted == null)
            return false;
        return this.isDeleted;
    }

    public Boolean getRemoveMerchantFromUsers() {
        return removeMerchantFromUsers != null && removeMerchantFromUsers;
    }

    public BigDecimal getCcProcessingFeePercent() {
        return this.ccProcessingFeePercent ==null ? BigDecimal.ZERO : this.ccProcessingFeePercent;
    }

    public Boolean getUseNeuroIdCheck() {
        return this.useNeuroIdCheck==null ? Boolean.FALSE : this.useNeuroIdCheck;
    }

    public Boolean getUseLexisNexis() {
        return this.useLexisNexis==null ? Boolean.FALSE : this.useLexisNexis;
    }

    public Boolean getOfferInsurance() {
        return this.offerInsurance == null ? Boolean.FALSE : this.offerInsurance;
    }
}

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Marcos é para verificar os logs gerados quando incluir ou remover programas de merchants pela configuracao do merchant e pela tela de atualizacao em massa?
 
Então não precisa ser programas
 
mas e naquela pagina lá
 
pode um checkbox da pagina do merchant, por exemplo?
 
sim
 
mas acontece esporadicamente, tem que editar varios de uma vez para fazer aparecer
 
Eu coloquei um campo null no banco de dados e na interface marquei true e salvei, gerou o log
 
 
Este log esta conforme o esperado? eu entendi que nao que a correção é para evitar gerar esse log, é isso mesmo?
 
Jose  Mendes
Eu coloquei um campo null no banco de dados e na interface marquei true e salvei, gerou o log      📷      Este log esta conforme o esperado? eu entendi que nao que a correção é para evitar gerar esse log, é isso mesmo?
sim?
 
mas eu esse change do isFraudCheckRequired ta estranho
 
não vi isso acontecer
 
mas assim não faça manipulações direto no banco; porque parte da mudança foi um script para não existir nullo em algumas colunas
 
é entao mas sem mudar no banco eu nao sei se vou encontrar um campo null, mas blz.
E tem uns campos especificos ou sao todos? tanto na config do merchant tanto nas alteracoes em massa?
 
Jose  Mendes
é entao mas sem mudar no banco eu nao sei se vou encontrar um campo null, mas blz.  E tem uns campos especificos ou sao todos? tanto na config do merchant tanto nas alteracoes em massa?
Mas o bug não e ter campo nullo
 
esse query aqui tem as colunas que não podem ser nulas https://gitlab.com/uown/frontend/origination/-/issues/1122#note_2863077665
(check if nulls still exist

SELECT 
    COUNT(CASE WHEN m.is_item_split IS NULL THEN 1 END) AS is_item_split_null_count,
    COUNT(CASE WHEN m.check_uw_for_verification IS NULL THEN 1 END) AS check_uw_for_verification_null_count,
    COUNT(CASE WHEN m.charge_processing_fee_before_esign IS NULL THEN 1 END) AS charge_processing_fee_before_esign_null_count,
    COUNT(CASE WHEN m.charge_processing_fee IS NULL THEN 1 END) AS charge_processing_fee_null_count,
    COUNT(CASE WHEN m.allow_change_to_expired IS NULL THEN 1 END) AS allow_change_to_expired_null_count,
    COUNT(CASE WHEN m.hold_deposit IS NULL THEN 1 END) AS hold_deposit_null_count,
    COUNT(CASE WHEN m.is_cc_required IS NULL THEN 1 END) AS is_cc_required_null_count,
    COUNT(CASE WHEN m.is_ach_required IS NULL THEN 1 END) AS is_ach_required_null_count,
    COUNT(CASE WHEN m.is_fpd_required IS NULL THEN 1 END) AS is_fpd_required_null_count,
    COUNT(CASE WHEN m.is_signed_to_funding IS NULL THEN 1 END) AS is_signed_to_funding_null_count,
    COUNT(CASE WHEN m.is_fraud_check_required IS NULL THEN 1 END) AS is_fraud_check_required_null_count,
    COUNT(CASE WHEN m.verify_email IS NULL THEN 1 END) AS verify_email_null_count,
    COUNT(CASE WHEN m.verify_phone IS NULL THEN 1 END) AS verify_phone_null_count,
    COUNT(CASE WHEN m.verify_ip IS NULL THEN 1 END) AS verify_ip_null_count,
    COUNT(CASE WHEN m.use_webhook IS NULL THEN 1 END) AS use_webhook_null_count,
    COUNT(CASE WHEN m.is_bank_verification_required IS NULL THEN 1 END) AS is_bank_verification_required_null_count,
    COUNT(CASE WHEN m.is_plaid_verification_required IS NULL THEN 1 END) AS is_plaid_verification_required_null_count,
    COUNT(CASE WHEN m.auto_deny_application IS NULL THEN 1 END) AS auto_deny_application_null_count,
    COUNT(CASE WHEN m.accept_new_apps IS NULL THEN 1 END) AS accept_new_apps_null_count,
    COUNT(CASE WHEN m.buyout_fee IS NULL THEN 1 END) AS buyout_fee_null_count,
    COUNT(CASE WHEN m.use_sentilink IS NULL THEN 1 END) AS use_sentilink_null_count,
    COUNT(CASE WHEN m.use_neustar IS NULL THEN 1 END) AS use_neustar_null_count,
    COUNT(CASE WHEN m.send_finalize_notice IS NULL THEN 1 END) AS send_finalize_notice_null_count,
    COUNT(CASE WHEN m.esign_client IS NULL THEN 1 END) AS esign_client_null_count,
    COUNT(CASE WHEN m.record_signing_flow IS NULL THEN 1 END) AS record_signing_flow_null_count,
    COUNT(CASE WHEN m.return_lambda_score IS NULL THEN 1 END) AS return_lambda_score_null_count,
    COUNT(CASE WHEN m.is_deleted IS NULL THEN 1 END) AS is_deleted_null_count,
    COUNT(CASE WHEN m.remove_merchant_from_users IS NULL THEN 1 END) AS remove_merchant_from_users_null_count,
    COUNT(CASE WHEN m.cc_processing_fee_percent IS NULL THEN 1 END) AS cc_processing_fee_percent_null_count,
    COUNT(CASE WHEN m.use_neuro_id_check IS NULL THEN 1 END) AS use_neuro_id_check_null_count,
    COUNT(CASE WHEN m.use_lexis_nexis IS NULL THEN 1 END) AS use_lexis_nexis_null_count,
    COUNT(CASE WHEN m.offer_insurance IS NULL THEN 1 END) AS offer_insurance_null_count
FROM uown_merchant m;)
Sign in · GitLab
GitLab.com
 
em todos os campos?
 
todos os campos daquela query
 
os outros caso eles não forem obrigatorios eles podem ser nulos
 
Ou acho que não gasta test instructions não
 
nao, ta de boa
 
oque já tem no ticket devia ser o suficiente ja q e um bug; tem os steps para reproduzir o erro e talz
 
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




1. Ao atualizar múltiplas opções de configuração do comerciante pela página de Configurações do Comerciante, o usuário deve visualizar um resumo truncado do log e ao visualizar o Histórico de Modificações do Comerciante, o usuário deve visualizar o log completo com todas as alterações realizadas
1. When updating multiple merchant configuration options through the Merchant Settings page, the user should see a truncated summary of the log.
When viewing the Merchant Modification History, the user should see the complete log showing all changes made

2. Quando um usuário atualiza múltiplos campos booleanos (Require Credit Card Before Signing, Require Bank Info Before Signing, Require Bank Validation, Verify Phone Before Signing, Hold Deposit, Charge Processing Fee, Charge Processing Fee at Sign, Allow Change to Expired, Move from Signed to Funding, Check UW for Verification, Post Message, Record Signing Flow, Return Lambda Score, Use LexisNexis, Use Neuro ID, Two Day Funding Exception, Five Day Funding Exception, Use Webhook, Allow Purchase Option, Offer Protection Plan, Auto Deny Application, Require Plaid Verification, Is Fraud Check Required, Verify Phone, Verify Email, Verify IP, Use Neustar, Use Sentilink) pela página de alterações em massa dos Comerciantes, o log exibido deve mostrar somente duas linhas resumidas enquanto o Histórico de Modificações exibe o log completo  
2. When a user updates multiple boolean fields (Require Credit Card Before Signing, Require Bank Info Before Signing, Require Bank Validation, Verify Phone Before Signing, Hold Deposit, Charge Processing Fee, Charge Processing Fee at Sign, Allow Change to Expired, Move from Signed to Funding, Check UW for Verification, Post Message, Record Signing Flow, Return Lambda Score, Use LexisNexis, Use Neuro ID, Two Day Funding Exception, Five Day Funding Exception, Use Webhook, Allow Purchase Option, Offer Protection Plan, Auto Deny Application, Require Plaid Verification, Is Fraud Check Required, Verify Phone, Verify Email, Verify IP, Use Neustar, Use Sentilink) through the Merchant Bulk Edit page, the log displayed should show only two summarized lines, while the Modification History must display the full detailed log



> ## Tests in qa1


> ```gherkin

> **When updating multiple merchant configuration options through the Merchant Settings page, the user should see a truncated summary of the log.When viewing the Merchant Modification History, the user should see the complete log showing all changes made**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **When a user updates multiple boolean fields (Require Credit Card Before Signing, Require Bank Info Before Signing, Require Bank Validation, Verify Phone Before Signing, Hold Deposit, Charge Processing Fee, Charge Processing Fee at Sign, Allow Change to Expired, Move from Signed to Funding, Check UW for Verification, Post Message, Record Signing Flow, Return Lambda Score, Use LexisNexis, Use Neuro ID, Two Day Funding Exception, Five Day Funding Exception, Use Webhook, Allow Purchase Option, Offer Protection Plan, Auto Deny Application, Require Plaid Verification, Is Fraud Check Required, Verify Phone, Verify Email, Verify IP, Use Neustar, Use Sentilink) through the Merchant Bulk Edit page, the log displayed should show only two summarized lines, while the Modification History must display the full detailed log**

> !

> **| PASS |**
> ```

---

