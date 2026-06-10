---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1202

UOWN | Origination | Apply BDS-Specific Lease Fee and Funding Recalculation

Synopsis
Implement a BDS-specific financial rule where a fixed fee is displayed on the lease as a line item, not charged to the consumer, and deducted from the Amount To Be Funded.

Business Objective
For the BDS integration, the processing fee must behave like a fixed MDR:
      Visible on the lease for transparency
      Not charged to the consumer
      Absorbed by the merchant through a reduced funded amount
The current system does not support this behavior, preventing the integration from moving forward.

Feature Request | Business Requirements
Scope
Applies only to the following BDS merchant codes:
    KS15528
    KS15694
    KS17405
    KS17898
    KS17899
Must not impact non-BDS merchants.

Expected Result
      BDS merchants use $1.00 authorization for card validation.
      Other merchants continue using the default authorization amount.
      No impact to existing application flows.

Lease Line Item
    Add a lease line item named “Initial Payment”.
    Amount: $49
    This line item:
            Must appear on the lease
            Must not be charged to the consumer at any point
Amount To Be Funded Recalculation
    Automatically recalculate:
        Amount To Be Funded = Cash Price - $49
    Applied to every lease associated with BDS merchants.

Sowjanya Kaligineedi
@skaligineedi
1 semana atrás
Owner
@fernandogmartins Here are the changes you need to make for this.

Here are the changes to make :
$1 auth will be handled by creating programs with $1 processing fee override; Justin will assign these to merchants on PROD. On sandbox, update programs for these merchants with $1 processing fee override to test.
In EsignService (line 174), add $49 as an initial payment item in lease docs for configured merchants (since its display only, and not charged to customer). Make merchant reference codes configurable.

Update getFundingQueueDetails.sql to subtract $49 from amount to be funded if merchantRefCode is in the configured list. Apply this subtraction at: COALESCE(invoice.invoiceInfo.totalInvoiceAmount,0)  
COALESCE(invoice.invoiceInfo.depositAmount,0)
COALESCE(losSchedSummary.schedSummaryInfo.merchantDiscountAmount,0)
COALESCE(losSchedSummary.schedSummaryInfo.merchantRebateAmount,0)
invoice.invoiceInfo.taxAmount


Fernando Martins
@fernandogmartins
4 dias atrás
Maintainer

# Testing Steps

## 1. Implementation Overview

| Area | Location | Behavior |
|------|----------|----------|
| **Config** | `InitialPaymentConfig` | Reads eligible merchant ref codes and amount from configuration. |
| **Lease document** | `EsignService` | Appends a synthetic "Initial Payment" line to `losItems` when generating the lease document for eligible merchants (display only). |
| **Amount to be funded (LEASE)** | `getFundingQueueDetailsForLead.sql` / `LeadFundingService` | The LEASE funding query subtracts the configured amount (e.g. 49) from the amount to be funded when the merchant ref code is in the configured list. |

**Config keys (ConfigurationManagement):**

- `com.uownleasing.svc.initialPayment.merchantRefCodes` – Comma-separated ref codes (default: `KS15528,KS15694,KS17405,KS17898,KS17899`).
- `com.uownleasing.svc.initialPayment.amount` – Initial Payment amount (default: `49`).

---

## 2. Lease Document (EsignService)

**What to validate:** For an eligible merchant, the generated lease document includes a display-only "Initial Payment" line with the configured amount.

![image](/uploads/df35294587e5409a373869504c29c4f0/image.png){width=506 height=93}

### Steps

1. Create or use a lead whose merchant has a ref code in the configured `merchantRefCodes` (e.g. KS15528).
2. Insert the financial information in completeApplication, and proceed to the signing.
3. **Expected:** A line item with description "Initial Payment" and the configured amount (e.g. $49). It should be display-only (no separate charge logic).
4. Repeat with a lead whose merchant ref code is **not** in the list.
5. **Expected:** No "Initial Payment" line in the lease document.

---

## 3. Amount to Be Funded (LEASE)

**What to validate:** For LEASE invoice type, the amount to be funded is reduced by the configured Initial Payment amount when the merchant is eligible.

### 3.1 How it works

- `LeadFundingService.getFundingQueueDetailsForLead` uses the SQL named `getFundingQueueDetailsForLead` for LEASE.
- The SQL (in `getFundingQueueDetailsForLead.sql`) computes `amountToBeFunded` and subtracts the Initial Payment amount (e.g. 49) when `merchant.merchantInfo.refMerchantCode` is in the eligible list.

### 3.2 getFundingQueueDetails

**Endpoint:** `{{url}}/uown/getFundingQueueDetails/{{leadPk}}`

**Relevant fields to check:**


| Scenario | `merchantRefCode` | `amountToBeFunded` |
|----------|-------------------|---------------------|
| Without matching ref code | e.g. `OL90205-0079_clone_clone_clone_clone` | e.g. `700.00` |
| With matching ref code (e.g. KS17405) | e.g. `KS17405` | e.g. `651.00` (49 less than above) |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

components/customer-lease-modal/customer-lease-form.tsx
import {InputField} from '@uownleasing/common-ui';
import {
  convertNumberToCurrency,
  convertCurrencyToFloat,
  isEqual,
} from '@uownleasing/common-utilities';
import {
  manageCreateLeaseTableColumns,
  manageLeaseTableColumns,
} from '@utils/data-table-columns';
import {dataTableCustomStyles} from '@utils/helper';
import classNames from 'classnames';
import {MerchantInfo, Item} from '@models';
import React from 'react';
import DataTable from 'react-data-table-component';
import {Col, Form, Row} from 'reactstrap';
import styles from './index.module.scss';
import {FormikProps} from 'formik';

interface CustomerLeaseFormProps {
  formik: FormikProps<any>;
  itemsFormik: any;
  isStatusApproved: boolean;
  merchantInfo: MerchantInfo;
  isItemEdit: boolean;
  handleItemEdit: (item: Item, index: number) => void;
  handleItemDelete: (item: Item) => void;
  isEligibleToSettle: boolean;
  isFormDisabled: boolean;
  itemIndex: number;
  itemPk: number;
  handleItemSave: () => void;
}

const CustomerLeaseForm = (props: CustomerLeaseFormProps) => {
  const {
    formik,
    itemsFormik,
    isStatusApproved,
    merchantInfo,
    isItemEdit,
    handleItemEdit,
    handleItemDelete,
    isEligibleToSettle,
    isFormDisabled,
    itemIndex,
    itemPk,
    handleItemSave,
  } = props;

  const customDataTableStyling = {
    ...dataTableCustomStyles,
    responsiveWrapper: {
      style: {
        overflow: 'auto',
      },
    },
  };

  const createOrUpdateItemDataTable = [
    {
      numberOfItems: 0,
      model: '',
      itemDescription: '',
      totalPricePerItem: 0,
      totalPriceForItems: 0,
    },
  ];

  const totalValue = () => {
    const {
      deliveryFee = 0,
      installationFee = 0,
      miscFee = 0,
      salesTax = 0,
      downPayment = 0,
      merchandiseAmount = 0,
      discountAmount = 0,
      purchasedTotal = 0,
    } = formik?.values || {};

    const totalInvoiceAmount =
      convertCurrencyToFloat(merchandiseAmount) +
      convertCurrencyToFloat(deliveryFee) +
      convertCurrencyToFloat(installationFee) +
      convertCurrencyToFloat(miscFee) +
      convertCurrencyToFloat(salesTax) -
      convertCurrencyToFloat(downPayment) -
      convertCurrencyToFloat(discountAmount) -
      convertCurrencyToFloat(purchasedTotal);

    return totalInvoiceAmount;
  };

  const subTotal =
    (formik?.values?.merchandiseAmount || 0) -
      (formik?.values?.purchasedTotal || 0) || 0;

  const activeItems = (formik?.values?.items || []).filter(
    (item) => !isEqual(item?.itemInfo?.status, 'CANCELLED'),
  );

  const gridCount = !isStatusApproved && isEligibleToSettle ? 4 : 6;
  const isDisabled = !isStatusApproved && isFormDisabled;

  return (
    <Form id="settleLeaseForm" onSubmit={formik.handleSubmit}>
      <Row>
        <Col xs={12} lg={6} xl={gridCount} className="h-auto">
          <div className={classNames('h-100', styles?.settleLeaseForm__header)}>
            <div
              className={classNames(
                'px-3 py-2',
                styles?.settleLeaseForm__title,
              )}>
              Dealer Info
            </div>

            <div className="p-3">
              <div>
                {(merchantInfo?.merchantName || '') +
                  ' ' +
                  (merchantInfo?.refMerchantCode || '')}
              </div>

              <div className="mt-2">
                {merchantInfo?.city ? merchantInfo?.city + ', ' : ''}
                {merchantInfo?.state || ''}
              </div>

              <Row className="mt-4">
                <Col xs={12} lg={6}>
                  <InputField
                    formik={formik}
                    name="salesPerson"
                    label="Sales Person Name"
                    type="name"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>

                <Col xs={12} lg={6}>
                  <InputField
                    formik={formik}
                    name="invoiceNumber"
                    label="Invoice #"
                    type="text"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>
              </Row>

              <div
                className={classNames(
                  'd-flex flex-row align-items-center justify-content-between mt-4',
                  styles?.settleLeaseForm__delivery,
                )}>
                <div className={styles?.settleLeaseForm__deliveryTitle}>
                  Estimated Pick Up or Delivery Date
                </div>

                <div className={styles?.settleLeaseForm__dateInput}>
                  <InputField
                    formik={formik}
                    name="estimatedDeliveryDay"
                    type="date"
                    isDisabled={!isStatusApproved}
                  />
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={12} lg={6} xl={gridCount} className="h-auto mt-3 mt-lg-0">
          <div className={classNames('h-100', styles?.settleLeaseForm__header)}>
            <div
              className={classNames(
                'px-3 py-2',
                styles?.settleLeaseForm__title,
              )}>
              Shipping Info
            </div>

            <div className="p-3">
              {isStatusApproved ? (
                <>
                  <Row>
                    <Col xs={12} lg={6}>
                      <InputField
                        formik={formik}
                        name="firstName"
                        label="First Name"
                        type="name"
                        isLabelBold={true}
                        isLabel12px={true}
                        isDisabled={isDisabled}
                      />
                    </Col>

                    <Col
                      xs={12}
                      lg={6}
                      className={styles?.settleLeaseForm__formInput}>
                      <InputField
                        formik={formik}
                        name="lastName"
                        label="Last Name"
                        type="name"
                        isLabelBold={true}
                        isLabel12px={true}
                        isDisabled={isDisabled}
                      />
                    </Col>
                  </Row>

                  <Row
                    className={classNames(
                      'mt-4',
                      styles?.settleLeaseForm__formInput,
                    )}>
                    <Col>
                      <InputField
                        formik={formik}
                        name="customerPhoneNumber"
                        label="Phone Number"
                        type="phone-number"
                        isLabelBold={true}
                        isLabel12px={true}
                        maxLength={14}
                        isDisabled={isDisabled}
                      />
                    </Col>
                  </Row>
                </>
              ) : (
                <Row>
                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="customerName"
                      label="Customer Name"
                      type="name"
                      isLabelBold={true}
                      isLabel12px={true}
                      isDisabled={isDisabled}
                    />
                  </Col>

                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="customerPhoneNumber"
                      label="Phone Number"
                      type="phone-number"
                      maxLength={14}
                      isLabelBold={true}
                      isLabel12px={true}
                      isDisabled={isDisabled}
                    />
                  </Col>
                </Row>
              )}

              <Row
                className={classNames(
                  'mt-4',
                  styles?.settleLeaseForm__formInput,
                )}>
                <Col>
                  <InputField
                    formik={formik}
                    name="customerAddress"
                    label="Address"
                    type="text"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>
              </Row>

              <Row
                className={classNames(
                  'mt-4',
                  styles?.settleLeaseForm__formInput,
                )}>
                <Col xs={12} lg={6}>
                  <InputField
                    formik={formik}
                    name="customerCity"
                    label="City"
                    type="text"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>

                <Col
                  xs={12}
                  lg={3}
                  className={styles?.settleLeaseForm__formInput}>
                  <InputField
                    formik={formik}
                    name="customerState"
                    label="State"
                    type="text"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>

                <Col
                  xs={12}
                  lg={3}
                  className={styles?.settleLeaseForm__formInput}>
                  <InputField
                    formik={formik}
                    name="customerZipCode"
                    label="Zip Code"
                    type="text"
                    isLabelBold={true}
                    isLabel12px={true}
                    isDisabled={isDisabled}
                  />
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        {!isStatusApproved && isEligibleToSettle && (
          <Col xs={12} xl={4} className="h-auto mt-3 mt-xl-0">
            <div
              className={classNames('h-100', styles?.settleLeaseForm__header)}>
              <div
                className={classNames(
                  'px-3 py-2',
                  styles?.settleLeaseForm__title,
                )}>
                Bank Information
              </div>

              <div className="p-3">
                <Row>
                  <Col xs={12}>
                    <InputField
                      formik={formik}
                      name="bankAccountHolderName"
                      label="Account Holder Name"
                      type="name"
                      isLabelBold={true}
                      isLabel12px={true}
                      isDisabled={
                        isFormDisabled &&
                        formik?.values?.sendFundsToMerchantBankAccount
                      }
                    />
                  </Col>
                </Row>

                <Row
                  className={classNames(
                    'mt-4',
                    styles?.settleLeaseForm__formInput,
                  )}>
                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="bankName"
                      label="Bank Name"
                      isLabelBold={true}
                      isLabel12px={true}
                      isDisabled={
                        isFormDisabled &&
                        formik?.values?.sendFundsToMerchantBankAccount
                      }
                    />
                  </Col>

                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="bankAccountType"
                      label="Account Type"
                      placeholder="Type"
                      type="select"
                      options={['CHECKING', 'SAVINGS']}
                      isLabelBold={true}
                      isLabel12px={true}
                      isDisabled={
                        isFormDisabled &&
                        formik?.values?.sendFundsToMerchantBankAccount
                      }
                    />
                  </Col>
                </Row>

                <Row
                  className={classNames(
                    'mt-4',
                    styles?.settleLeaseForm__formInput,
                  )}>
                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="bankAccountNumber"
                      label="Account Number"
                      type="account-number"
                      isLabelBold={true}
                      isLabel12px={true}
                      min={5}
                      maxLength={17}
                      isDisabled={
                        isFormDisabled &&
                        formik?.values?.sendFundsToMerchantBankAccount
                      }
                    />
                  </Col>

                  <Col xs={12} lg={6}>
                    <InputField
                      formik={formik}
                      name="bankRoutingNumber"
                      label="Routing Number"
                      type="routing-number"
                      isLabelBold={true}
                      isLabel12px={true}
                      maxLength={9}
                      isDisabled={
                        isFormDisabled &&
                        formik?.values?.sendFundsToMerchantBankAccount
                      }
                    />
                  </Col>
                </Row>

                <Row
                  className={classNames(
                    'mt-3',
                    styles?.settleLeaseForm__formInput,
                  )}>
                  <Col className="d-flex align-items-center">
                    <InputField
                      formik={formik}
                      name="sendFundsToMerchantBankAccount"
                      type="checkbox"
                      isModifiedCheckbox
                      isDisabled={isDisabled}
                      onChange={(val) => {
                        const isChecked = val;
                        const {
                          bankAccountNumber,
                          bankRoutingNumber,
                          bankName,
                          bankAccountHolderName,
                          bankAccountType,
                        } = formik?.initialValues;
                        if (!isChecked) {
                          formik?.setValues({
                            ...formik?.values,
                            bankAccountNumber,
                            bankRoutingNumber,
                            bankName,
                            bankAccountHolderName,
                            bankAccountType,
                          });
                        }

                        formik?.setFieldTouched(
                          'bankRoutingNumber',
                          true,
                          true,
                        );
                        formik?.setFieldTouched(
                          'bankAccountNumber',
                          true,
                          true,
                        );
                        formik?.setFieldTouched('bankName', true, true);
                        formik?.setFieldTouched(
                          'bankAccountHolderName',
                          true,
                          true,
                        );
                        formik?.setFieldTouched('bankAccountType', true, true);
                      }}
                    />
                    <div className={styles?.settleLeaseForm__checkbox}>
                      Send Funds to Merchant Bank Account
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        )}
      </Row>

      <Row className="mt-2">
        <Col>
          {isStatusApproved && !isFormDisabled && (
            <DataTable
              columns={manageCreateLeaseTableColumns(itemsFormik)}
              striped={true}
              data={createOrUpdateItemDataTable || []}
              pagination={false}
              defaultSortAsc={false}
              customStyles={customDataTableStyling}
            />
          )}
        </Col>
      </Row>

      <Row className="mt-2">
        <Col>
          <DataTable
            columns={manageLeaseTableColumns(
              isFormDisabled,
              formik,
              isStatusApproved,
              isItemEdit,
              itemIndex,
              itemPk,
              handleItemEdit,
              handleItemDelete,
              handleItemSave,
            )}
            striped={true}
            data={activeItems || []}
            pagination={false}
            defaultSortAsc={false}
            customStyles={customDataTableStyling}
          />
        </Col>
      </Row>

      <Row className="d-flex justify-content-end">
        <Col xs={12} lg={3}>
          <div
            className={classNames(
              'mt-2 text-right',
              styles?.settleLeaseForm__subtotal,
            )}>
            Merchandise Total:{' '}
            {convertNumberToCurrency(formik?.values?.merchandiseAmount || 0)}
          </div>
          {formik?.values?.purchasedTotal > 0 && (
            <>
              <div
                className={classNames(
                  'mt-2 text-right',
                  styles?.['settleLeaseForm__purchased-total'],
                )}>
                Purchased Total: -
                {convertNumberToCurrency(formik?.values?.purchasedTotal)}
              </div>

              <div
                className={classNames(
                  'mt-2 text-right',
                  styles?.settleLeaseForm__subtotal,
                )}>
                Subtotal: {convertNumberToCurrency(subTotal)}
              </div>
            </>
          )}

          <InputField
            formik={formik}
            name="deliveryFee"
            label="Delivery Fee"
            className="mt-2"
            placeholder="$0.00"
            isDisabled={isDisabled}
            type="currency"
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />

          <InputField
            formik={formik}
            name="installationFee"
            label="Installation Fee"
            type="currency"
            className="mt-3"
            placeholder="$0.00"
            isDisabled={isDisabled}
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />

          <InputField
            formik={formik}
            name="miscFee"
            label="Misc. Fee"
            type="currency"
            className="mt-3"
            placeholder="$0.00"
            isDisabled={isDisabled}
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />

          <InputField
            formik={formik}
            name="downPayment"
            label="Down Payment"
            placeholder="$0.00"
            type="currency"
            className="mt-3"
            isDisabled={true}
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />

          <InputField
            formik={formik}
            name="salesTax"
            label="Sales Tax"
            placeholder="$0.00"
            type="currency"
            className="mt-3"
            isDisabled={isDisabled}
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />

          <InputField
            formik={formik}
            name="discountAmount"
            label="Discount"
            placeholder="$0.00"
            type="currency"
            className="mt-3"
            isDisabled={isDisabled}
            isTextRight={true}
            isLabelBold={true}
            isLabel12px={true}
          />
          <Row
            className={classNames('mt-3', styles?.settleLeaseForm__subtotal)}>
            <Col xs={2}>Total:</Col>

            <Col xs={10} className="text-right">
              {convertNumberToCurrency(totalValue())}
            </Col>
          </Row>
        </Col>
      </Row>
    </Form>
  );
};

export default CustomerLeaseForm;


utils/initial-payment-constants.ts


src/main/java/com/uownleasing/svc/config/InitialPaymentConfig.java
package com.uownleasing.svc.config;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Configurable Initial Payment: ref codes and amount read from ConfigurationManagement.
 * Config keys: com.uownleasing.svc.initialPayment.merchantRefCodes, com.uownleasing.svc.initialPayment.amount
 */
@Component
@RequiredArgsConstructor
public class InitialPaymentConfig {

    private static final String CONFIG_PATH = "com.uownleasing.svc.initialPayment.";
    private static final String DEFAULT_REF_CODES = "KS15528,KS15694,KS17405,KS17898,KS17899";
    private static final int DEFAULT_AMOUNT = 49;

    private final ConfigurationManagement configurationManagement;

    /** Comma-separated ref codes from config; default KS15528,KS15694,KS17405,KS17898,KS17899 */
    public List<String> getRefCodes() {
        String value = configurationManagement.getString(CONFIG_PATH + "merchantRefCodes", DEFAULT_REF_CODES);
        if (StringUtils.isBlank(value)) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(StringUtils::isNotBlank)
                .collect(Collectors.toList());
    }

    /** Amount from config (not charged to customer; deducted from amount to be funded). Default 49 */
    public BigDecimal getAmount() {
        int amount = configurationManagement.getInteger(CONFIG_PATH + "amount", DEFAULT_AMOUNT);
        return BigDecimal.valueOf(amount);
    }

    public boolean isEligible(String refMerchantCode) {
        return refMerchantCode != null && getRefCodes().contains(refMerchantCode);
    }
}


src/main/java/com/uownleasing/svc/service/EsignService.java
package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.ItemInfo;
import com.uownleasing.common.pojo.SqlConfigInfo;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.dms.common.converters.CommonConverter;
import com.uownleasing.dms.common.db.entity.EsignDocument;
import com.uownleasing.dms.common.enumeration.*;
import com.uownleasing.dms.common.pojo.*;
import com.uownleasing.dms.common.service.EsignDocumentService;
import com.uownleasing.dms.common.service.FreemarkerTemplateEngine;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.db.repository.LeadRepo;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.InitialPaymentConfig;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.enumeration.ClientType;
import com.uownleasing.svc.enumeration.FundingQueueStatus;
import com.uownleasing.svc.enumeration.MerchantType;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.CommonDataPojo;
import com.uownleasing.svc.pojo.CorrespondenceRequest;
import com.uownleasing.svc.pojo.EsignStatusResult;
import com.uownleasing.svc.pojo.rest.FundingStatusRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.beanutils.BeanUtils;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class EsignService extends EsignDocumentService {

    private final LosLeadService leadService;

    private final LeadFundingService leadFundingService;

    private final MerchantService merchantService;

    private final CorrespondenceService correspondenceService;

    private final CorrespondenceLogService correspondenceLogService;

    private final FreemarkerTemplateEngine freemarkerTemplateEngine;

    private final ConfigurationManagement configurationManagement;

    private final LosItemService losItemService;

    private final LosReceivableService losReceivableService;

    private final LosContractService losContractService;

    private final LeadRepo leadRepo;

    private final SvSqlConfigService sqlConfigService;

    private final WebhookService webhookService;

    private final EntityManager entityManager;

    private final UpdateLeadStatusService updateLeadStatusService;

    private final LosLoggingService losLoggingService;

    private final InitialPaymentConfig initialPaymentConfig;

    private final String CONFIG_PATH = "com.uownleasing.svc.service.EsignService.";


    public EsignResult sendDocumentForEsign(CorrespondenceRequest correspondenceRequest) {
        EsignResult result = new EsignResult();
        try {
            long start = System.currentTimeMillis();
            LosLead lead = leadService.getByLeadPk(correspondenceRequest.getLeadPk());
            Merchant merchant = merchantService.getMerchantByPk(lead.getLeadInfo().getMerchantPk());
            LosCustomer customer = lead.getLosCustomers().stream().findFirst().get();
            String state = customer.getLosAddresses().stream().findFirst().get().getAddressInfo().getState();
            if (merchant.getMerchantInfo().getMerchantType() != null
                && merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE) {
                state = merchant.getMerchantInfo().getState();
            }

            long getLeaseStart = System.currentTimeMillis();
            SqlConfigInfo getLeaseTemplate = sqlConfigService.getSqlConfigBySqlName("getLeaseTemplate").getSqlConfigInfo();
            String leaseSql = getLeaseTemplate.getSqlQuery();
            leaseSql = leaseSql.replaceAll("(?i):state", "'" + state + "'");
            leaseSql = leaseSql.replaceAll("(?i):merchantPk", "'" + merchant.getPk() + "'");
            leaseSql = leaseSql.replaceAll("(?i):clientType", "'" + merchant.getMerchantInfo().getClientType().name() + "'");

            ObjectMapper mapper = new ObjectMapper();
            Query query = entityManager.createNativeQuery(leaseSql);
            NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
            nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
            List<Map<String, Object>> leaseResult = nativeQuery.getResultList();
            log.debug("Results from getLeaseTemplate sql: {}", leaseResult);

            mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
            mapper.registerModule(new JavaTimeModule());
            mapper.registerModule(new Jdk8Module());
            TemplateInfo templateInfo;
            if (CollectionUtils.isNotEmpty(leaseResult)) {
                templateInfo = mapper.readValue(mapper.writeValueAsString(leaseResult.get(0)), TemplateInfo.class);
                log.debug("Template for esign: {}", templateInfo);
            } else {
                throw new SvcException("No Template found");
            }
            log.debug("********************[sendDocumentForEsign] Total Time taken for getLeaseTemplate {}********************", TimeUnit.MILLISECONDS.toMillis((System.currentTimeMillis() - getLeaseStart)) + "ms");

            CommonDataPojo commonDataPojo = correspondenceRequest.getCommonDataPojo();

            Map<String, Object> dataMap = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
            List<String> sqls = new LinkedList<>();
            SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("leasedocs");
            CollectionUtils.addIgnoreNull(sqls, sqlConfig != null ? sqlConfig.getSqlConfigInfo().getSqlQuery() : null);
            CollectionUtils.addIgnoreNull(sqls, templateInfo.getDataFieldsSQL());
            for (String sql : sqls) {
                log.debug("[ESIGNSERVICE] RUNNING SQL {}", sql);
                if (sql != null) {
                    sql = sql.replaceAll("(?i):leadPk", String.valueOf(correspondenceRequest.getLeadPk()));
                    dataMap = correspondenceService.getDataMap(sql, commonDataPojo);
                    commonDataPojo = (CommonDataPojo) dataMap.get("CommonDataPojo");
                }
            }
            long end1 = System.currentTimeMillis();
            log.info("[ESIGNSERVICE]Total Time taken until running sql{}", TimeUnit.MILLISECONDS.toMillis((end1 - start)) + "ms");
            Set<LosPaymentOptions> paymentOptions = lead.getLosPaymentOptions();
            if (CollectionUtils.isNotEmpty(paymentOptions)) {
                List<LosPaymentOptions> paymentOptionsList = paymentOptions.stream()
                    .sorted((o1, o2) -> o2.getSchedSummaryInfo().getTotalNumberOfPayments().compareTo(o1.getSchedSummaryInfo().getTotalNumberOfPayments()))
                    .collect(Collectors.toList());
                dataMap.put("losPaymentOptions", paymentOptionsList);
            }

            List<LosItem> itemsList = losItemService.getAllItemsForLeadInStatus(lead.getPk(), ItemStatus.ADDED_TO_CART);
            itemsList = CollectionUtils.isNotEmpty(itemsList)? itemsList:new ArrayList<>();
            List<LosItem> deliveredItems = losItemService.getAllItemsForLeadInStatus(lead.getPk(), ItemStatus.DELIVERED);
            List<LosItem> orderedItems = losItemService.getAllItemsForLeadInStatus(lead.getPk(), ItemStatus.ORDERED);
            Optional.ofNullable(deliveredItems).ifPresent(itemsList::addAll);
            Optional.ofNullable(orderedItems).ifPresent(itemsList::addAll);
            List<LosItem> newList = new ArrayList<>();

            if (CollectionUtils.isNotEmpty(itemsList)) {
                for (LosItem item : itemsList) {
                    LosItem newItem = new LosItem();
                    String itemDesc = item.getItemInfo().getItemDescription();
                    String itemCode = item.getItemInfo().getItemCode();
                    itemCode = StringUtils.isNotBlank(itemCode) ? itemCode.replaceAll("&", "and") : "";
                    itemCode = StringUtils.isNotBlank(itemCode) ? itemCode.replaceAll("\\W", " ") : "";
                    itemDesc = StringUtils.isNotBlank(itemDesc) ? itemDesc.replaceAll("&", "and") : "";
                    itemDesc = StringUtils.isNotBlank(itemDesc) ? itemDesc.replaceAll("\\W", " ") : "";
                    try {
                        ItemInfo itemInfo = new ItemInfo();
                        BeanUtils.copyProperties(itemInfo, item.getItemInfo());
                        itemInfo.setItemDescription(itemDesc);
                        itemInfo.setItemCode(itemCode);
                        newItem.setItemInfo(itemInfo);
                        newList.add(newItem);
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }
            }
            if (initialPaymentConfig.isEligible(merchant.getMerchantInfo().getRefMerchantCode())) {
                LosItem initialPaymentItem = new LosItem();
                ItemInfo initialPaymentInfo = new ItemInfo();
                BigDecimal amount = initialPaymentConfig.getAmount();
                initialPaymentInfo.setItemDescription("Initial Payment");
                initialPaymentInfo.setItemCode("INITIAL_PAYMENT");
                initialPaymentInfo.setNumberOfItems(1);
                initialPaymentInfo.setBasePricePerItem(amount);
                initialPaymentInfo.setTotalPricePerItem(amount);
                initialPaymentInfo.setTotalPriceForItems(amount);
                initialPaymentItem.setItemInfo(initialPaymentInfo);
                newList.add(initialPaymentItem);
            }
            log.debug("[EsignService]ITEMS LIST {}", newList);
            dataMap.put("losItems", newList);

            List<LosReceivable> losReceivables = losReceivableService.getUnpaidOrPartiallyPaidReceivables(lead.getPk());
            log.debug("[EsignService]RECEIVABLE LIST {}", losReceivables);
            dataMap.put("losReceivables", losReceivables == null ? new ArrayList<>() : losReceivables);

            log.debug("[ESIGNSERVICE] dataMap {}", dataMap);

            String mergedTemplate = templateInfo.getTemplateContent();
            mergedTemplate = freemarkerTemplateEngine.mergeDataIntoTemplateString(mergedTemplate, dataMap, templateInfo.getTemplateName());
            if (merchant.getMerchantInfo().getEsignClient() != null && merchant.getMerchantInfo().getEsignClient().equals(EsignClientEnum.PANDADOC)) {
                mergedTemplate = convertToPandaDoc(mergedTemplate, state);
            }

            String documentBase64String = "";
            try {
                documentBase64String = CommonConverter.convertWordXMLToBase64DocX(mergedTemplate);
            } catch (Throwable th) {
                th.printStackTrace();
            }

            long end2 = System.currentTimeMillis();
            log.info("[ESIGNSERVICE]Total Time taken until merge{}", TimeUnit.MILLISECONDS.toMillis((end2 - start)) + "ms");


            if (StringUtils.isBlank(documentBase64String)) {
                result.setResultCode(-1);
                result.setResult("Error Generating Esign Document");
                return result;
            }

            EsignInfo esignInfo = new EsignInfo();
            esignInfo.setEsignMode(correspondenceRequest.getEsignMode());
            esignInfo.setDocumentGroup(correspondenceRequest.getDocumentGroup() != null ? correspondenceRequest.getDocumentGroup() : DocumentGroup.LEASE);
            esignInfo.setLeadPk(correspondenceRequest.getLeadPk());
            esignInfo.setMerchantPk(merchant.getPk());
            esignInfo.setMerchantName(merchant.getMerchantInfo().getMerchantName());
            esignInfo.setBase64DocumentString(documentBase64String);
            if (merchant.getMerchantInfo().getEsignClient() == null || merchant.getMerchantInfo().getEsignClient().equals(EsignClientEnum.SIGNWELL)) {
                esignInfo.setClient(EsignClientEnum.SIGNWELL);
                if (SystemConfigurationManagement.isProduction()) {
                    esignInfo.setBaseURLForEsignClient(configurationManagement.getString(CONFIG_PATH + "uown.esign.base.url", "https://www.signwell.com/api/v1/"));
                    esignInfo.setAPI_KEY_FOR_ESIGN(configurationManagement.getString(CONFIG_PATH + "uown.esign.api.key", "YWNjZXNzOjhiNzIzMmVjYTQ0YzczYWY3NjZjY2EwOThhOWFiNzhh"));
                } else {
                    esignInfo.setBaseURLForEsignClient(configurationManagement.getString(CONFIG_PATH + "uown.esign.base.url", "https://www.signwell.com/api/v1/"));
                    esignInfo.setAPI_KEY_FOR_ESIGN(configurationManagement.getString(CONFIG_PATH + "uown.esign.api.key", "YWNjZXNzOmIyMzVkNWM4MWIxZTU4NjgyOGZjYTVhOTM2ZGUxYzhm"));
                }
            } else if (merchant.getMerchantInfo().getEsignClient().equals(EsignClientEnum.PANDADOC)) {
                esignInfo.setClient(EsignClientEnum.PANDADOC);
                if (SystemConfigurationManagement.isProduction()) {
                    esignInfo.setBaseURLForEsignClient(configurationManagement.getString(CONFIG_PATH + "uown.esign.pandadoc.base.url", "https://api.pandadoc.com/public/v1/documents"));
                    esignInfo.setAPI_KEY_FOR_ESIGN(configurationManagement.getString(CONFIG_PATH + "uown.esign.pandadoc.api.key", "7ea3ebd4448ad58152fc39b29c87612a54324301"));
                } else {
                    esignInfo.setBaseURLForEsignClient(configurationManagement.getString(CONFIG_PATH + "uown.esign.pandadoc.base.url", "https://api.pandadoc.com/public/v1/documents"));
                    esignInfo.setAPI_KEY_FOR_ESIGN(configurationManagement.getString(CONFIG_PATH + "uown.esign.pandadoc.api.key", "7ea3ebd4448ad58152fc39b29c87612a54324301"));
                }
                esignInfo.setNumberOfWaitTries(configurationManagement.getInteger(CONFIG_PATH + "uown.esign.pandadoc.wait.tries", 5));
                esignInfo.setMsToWait(configurationManagement.getLong(CONFIG_PATH + "uown.esign.pandadoc.ms.wait", 3000L));
            }


            esignInfo.setTestMode(configurationManagement.getBoolean(CONFIG_PATH + "uown.esign.test.mode", Boolean.TRUE));
            esignInfo.setMockResponseOnTest(configurationManagement.getBoolean(CONFIG_PATH + "uown.esign.mock.response.on.test", Boolean.TRUE));

            if (configurationManagement.getBoolean(CONFIG_PATH + "uown.send.email.embedded.url", Boolean.FALSE)) {
                esignInfo.setSendEmail(Boolean.TRUE);
            }
            String merchantRedirectUrl = lead.getLeadInfo().getMerchantRedirectUrl();

            String baseRedirectURL = System.getenv("SVC_URL");
            if (StringUtils.isNotBlank(baseRedirectURL)) {
                if (baseRedirectURL.lastIndexOf("-") > 0) {
                    baseRedirectURL = "https://origination-" + baseRedirectURL.substring(baseRedirectURL.lastIndexOf("-") + 1) + "/";
                } else {
                    baseRedirectURL = configurationManagement.getString(CONFIG_PATH + "redirect.base.url", "https://origination-dev1.uownleasing.com/");
                }
            } else {
                baseRedirectURL = configurationManagement.getString(CONFIG_PATH + "redirect.base.url", "https://origination-dev1.uownleasing.com/");
            }

            //String merchantRedirectFinal = (StringUtils.isNotBlank(merchantRedirectUrl))?"&merchantRedirect="+merchantRedirectUrl+"appComplete?event=%s&ata=%s":"";

            if (configurationManagement.getBoolean(CONFIG_PATH + "send.redirect.url.to.esign.client", Boolean.FALSE)) {
                if (StringUtils.isNotBlank(merchantRedirectUrl)) {
                    baseRedirectURL = merchantRedirectUrl;
                    String requestParams = configurationManagement.getString(CONFIG_PATH + "redirect.url.request.params", "?event=%s&ata=%s");
                    esignInfo.setRedirect_url_signed(String.format((baseRedirectURL + requestParams), "completed", lead.getLeadInfo().getUuid()));
                    esignInfo.setRedirect_url_declined(String.format((baseRedirectURL + requestParams), "canceled", lead.getLeadInfo().getUuid()));
                } else {
                    String requestParams = "";
                    Boolean postMessage = BooleanUtils.toBooleanDefaultIfNull(merchant.getMerchantInfo().getPostMessage(), false);
                    requestParams = postMessage == true ? "&postMessage=true" : "";
                    esignInfo.setRedirect_url_signed(baseRedirectURL + "appComplete?uuid=" + lead.getLeadInfo().getUuid() + requestParams);
                    esignInfo.setRedirect_url_declined(baseRedirectURL + "appComplete?uuid=" + lead.getLeadInfo().getUuid());
                }
            }
            log.debug("[ESIGNSERVICE]RedirectURLs {} {}", esignInfo.getRedirect_url_signed(), esignInfo.getRedirect_url_declined());
            esignInfo.setDocumentName(templateInfo.getDocumentName() + ".docx");
            //group checkboxes.
            esignInfo.setCheckBoxGroups(toCheckboxGroups(commonDataPojo != null && commonDataPojo.getShowPreAuth()));
            esignInfo.setReceiverName(customer.getCustomerInfo().getFirstName());
            String customerEmailAddress = Optional.of(customer.getLosEmails()).map(losEmails -> losEmails.stream().findFirst().get().getEmailInfo().getEmailAddress()).get();
            if (commonDataPojo != null && StringUtils.isNotBlank(commonDataPojo.getCustomerEmailAddresses())) {
                customerEmailAddress = commonDataPojo.getCustomerEmailAddresses();
            }
            esignInfo.setReceiverEmailAddress(customerEmailAddress);
            if (SystemConfigurationManagement.isProduction()) {
                esignInfo.setSenderEmailAddress(configurationManagement.getString(CONFIG_PATH + "from.email.uown", "signwell@uownleasing.com"));
            } else {
                esignInfo.setSenderEmailAddress(configurationManagement.getString(CONFIG_PATH + "from.email.uown", "uown.dev@uownleasing.com"));
            }
            esignInfo.setSenderName("UOWN");
            esignInfo.setSubject(templateInfo.getSubject());
            esignInfo.setTemplateName(templateInfo.getTemplateName());
            esignInfo.setLocation(Location.LOS);
            esignInfo.setContractNumber(commonDataPojo.getContractNumber());
            Integer expiryDays = 0;
            if (configurationManagement.getBoolean(CONFIG_PATH + "pick.from.config", Boolean.FALSE)) {
                expiryDays = configurationManagement.getInteger(CONFIG_PATH + merchant.getMerchantInfo().getRefMerchantCode(), 1);
            } else {
                expiryDays = merchant.getMerchantInfo().getNumDaysLeaseDocExp();
            }
            esignInfo.setExpiresInDays(expiryDays);
            esignInfo.setTemplateVersion(templateInfo.getVersionNumber());
            result = sendDocument(esignInfo);

            long end3 = System.currentTimeMillis();
            log.info("[ESIGNSERVICE]Total Time taken after return from esign {}", TimeUnit.MILLISECONDS.toMillis((end3 - start)) + "ms");
            return result;
        } catch (Exception e) {
            log.error("[sendDocumentForEsign] Error generating document for esign", e);

            correspondenceLogService.logCorrespondence(null, correspondenceRequest.getLeadPk(), null,
                CorrespondenceType.ESIGN, SystemSource.LOS, new HashMap<>(), "Error Generating Document: " + e.getMessage());

            result.setResultCode(-1);
            result.setResult("Error Generating Document: " + e.getMessage());
            return result;
        }
    }



    public EsignStatusResult getEsignStatus(Long esignDocPk) {
        EsignDocumentStatusResult esignDocumentStatusResult = super.getDocumentStatus(esignDocPk);
        log.debug("[EsignService]esignDocumentStatusResult {}", esignDocumentStatusResult);
        EsignStatusResult result = new EsignStatusResult();
        result.fromEsignDocumentStatusResult(esignDocumentStatusResult, false);

        log.info("[EsignService]EsignStatusResult before parsing fields {}", result);

        if(!configurationManagement.getBoolean(CONFIG_PATH +"parse.cc.peek.consent.on", Boolean.TRUE)){
            return result;
        }
        // Fetch the configurable status values
        String statusConfig = configurationManagement.getString(CONFIG_PATH + "esign.status.to.check.for.parsing.cc.peek.consent.values", "SIGNED,COMPLETED,STORED");
        // Split the status configuration into a list
        List<String> validStatuses = List.of(statusConfig.split(","));
        EsignStatus documentStatus = esignDocumentStatusResult.getEsignStatus();
        // Only process if the status is valid
        if (!validStatuses.contains(documentStatus.name())) {
            return result; // Return early if the status is not valid
        }
        result.fromEsignDocumentStatusResult(esignDocumentStatusResult, true);

        log.info("[EsignService]EsignStatusResult after parsing fields {}", result);

        LosLead lead = leadService.getByLeadPk(result.getLeadPk());
        boolean newConsent = result.getCcPeekConsent();
        boolean existingConsent = Boolean.TRUE.equals(lead.getLeadInfo().getCcPeekConsent());
        String notes = (newConsent != existingConsent)
            ? String.format("CC Peek Consent changed from %s to %s", existingConsent, newConsent)
            : String.format("CC Peek Consent set to %s", newConsent);
        // Update lead only if consent has changed
        //if (newConsent != existingConsent) {
        lead.getLeadInfo().setCcPeekConsent(newConsent);
        lead.getLeadInfo().setNotes("[ESIGNSERVICE][parseCCPeekConsent] " + notes);
        leadService.createOrUpdateLead(lead.getLeadInfo());
        //}
        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, notes, ThreadAttributes.getUsername());
        log.info("[EsignService]EsignStatusResult before return{}", result);
        return result;
    }


    private List<CheckboxGroup> toCheckboxGroups(Boolean preAuthConsent){
        List<CheckboxGroup> checkboxGroups = new ArrayList<>();
        if(preAuthConsent) {
            CheckboxGroup checkboxGroup = new CheckboxGroup();
            checkboxGroup.setGroupName("preauth");
            checkboxGroup.setCheckboxIds(List.of( "preauthyes", "preauthno"));
            checkboxGroup.setRequired(true);
            checkboxGroup.setExactValue(1);
            checkboxGroup.setValidation("exact");
            checkboxGroups.add(checkboxGroup);
        }
        log.info("[ESIGNSERVICE] preAuthConsent {} checkboxGroup{}", preAuthConsent,checkboxGroups);
        return checkboxGroups;
    }

    public ContractStatus getContractStatusFromEsignStatus(EsignStatus status) {
        switch (status) {
            case REQUEST_RECEIVED:
            case SENT_TO_ESIGN_CLIENT:
            case SENT_TO_CUSTOMER:
            case IN_PROGRESS:
            case REMINDER_SENT:
            case VIEWED:
                return ContractStatus.SENT;
            case CANCELLED:
                return ContractStatus.CANCELLED;
            case COMPLETED:
            case STORED:
            case SIGNED:
                return ContractStatus.SIGNED;
            case ERROR:
            case UNKNOWN:
                return ContractStatus.ERROR;
            case EXPIRED:
                return ContractStatus.EXPIRED;
            case WAITING:
                return ContractStatus.NEW;
        }
        return ContractStatus.ERROR;
    }

    public List<LosContract> eSignDocumentStatus(List<LosContract> losContracts, Function<String, Boolean> interruptFunc, String baseConfig) {
        List<LosContract> losContractList = new ArrayList<>();
        for (LosContract losContract : losContracts) {
            if (interruptFunc != null && baseConfig != null && interruptFunc.apply(baseConfig)) break;
            EsignStatusResult esignStatusResult = getEsignStatus(losContract.getContractInfo().getEsignDocumentPk());
            EsignStatus esignStatus = esignStatusResult.getEsignStatus();
            losContract.getContractInfo().setContractStatus(getContractStatusFromEsignStatus(esignStatus));
            if (esignStatus == EsignStatus.COMPLETED || esignStatus == EsignStatus.SIGNED) {
                EsignDocument esignDocument = super.getEsignDocumentByPk(losContract.getContractInfo().getEsignDocumentPk());
                losContract.getContractInfo().setSignedTime(esignDocument.getEsignInfo().getDocSignedTimeStamp());
            }
            losContract = losContractService.createOrUpdate(losContract.getContractInfo());
            losContractList.add(losContract);
            if (losContract.getContractInfo().getContractStatus() == ContractStatus.SIGNED) {
                LosLead losLead = leadRepo.findByPk(losContract.getLosLead().getPk());
                losLead.getLeadInfo().setNotes("[EsignService] [esignDocumentStatus] Contract is signed. LeadStatus " + losLead.getLeadInfo().getLeadStatus());
                if (!configurationManagement.getString(CONFIG_PATH + "leadStatus.to.not.update.esignDocumentStatus","CANCELLED_CONTRACT,CANCELLED_DUP_DENIAL,CANCELLED_DUP_SSN,DENIED,EXPIRED,INCOMPLETE,ORDER_CANCELLED,UW_DENIED,UW_ERROR,NEW,PENDING_UW,UW_REVIEW,FUNDING,FUNDED").contains(losLead.getLeadInfo().getLeadStatus().name())) {
                    String notes = "[EsignService] [esignDocumentStatus] Updated leadStatus to SIGNED";
                    updateLeadStatusService.updateLeadStatus(losLead, LeadStatus.SIGNED, LeadStatus.SIGNED, notes, null, null);
                    webhookService.sendWebhookLeadUpdate(losLead.getPk(), LeadStatus.SIGNED);

                    updateLeadStatus(losLead);
                } else {
                    losLead.getLeadInfo().setNotes("[EsignService] [esignDocumentStatus] leadStatus is already " + losLead.getLeadInfo().getLeadStatus() + ". NOT updated to SIGNED");
                }
                leadService.createOrUpdateLead(losLead.getLeadInfo());
            }
        }
        return losContractList;
    }

    public List<LosContract> eSignDocumentStatus(List<LosContract> losContracts) {
        return eSignDocumentStatus(losContracts, null, null);
    }

    public EsignResult getCompletedDocument(Long esignDocPk) {
        return super.getCompletedDocument(esignDocPk);
    }

    public String convertToPandaDoc(String mergedTemplate, String state) {
        String template = mergedTemplate.replaceAll("(?i)\\{\\{signature:1:y:::customerSign:120:40}}", "{s:user:______________}")
            .replaceAll("(?i)\\{\\{initial:1:y::::25:25}}", "{i:user:__}");
        if (state.equalsIgnoreCase("CA")) {
            return template.replace("<w:gridCol w:w=\"432\"/>", "<w:gridCol w:w=\"2421\"/>").replace("<w:gridCol w:w=\"950\"/>", "<w:gridCol w:w=\"2421\"/>");
        } else if (state.equalsIgnoreCase("AL")) {
            return template.replace("<w:gridCol w:w=\"829\"/>", "<w:gridCol w:w=\"2421\"/>");
        }
        return template;
    }

    //
    public Boolean updateLeadStatus(LosLead losLead){
        Boolean result = false;
        if(losLead != null){
            losLead.getLeadInfo().setNotes("[EsignService][updateLeadStatus] LeadStatus "+losLead.getLeadInfo().getLeadStatus());
        }
        if(losLead == null || losLead.isFundingorBeyond()){
            return result;
        }
        ClientType clientType = merchantService.getMerchantByLeadPk(losLead.getPk()).getMerchantInfo().getClientType();
        losLead.getLeadInfo().setNotes("[EsignService[updateLeadStatus] clientType "+clientType);
        if(clientType == null)
            return result;

        Boolean isSignedToFunding = Boolean.FALSE;
        if(merchantService.getMerchantByLeadPk(losLead.getPk()) != null) {
            isSignedToFunding = merchantService.getMerchantByLeadPk(losLead.getPk()).getMerchantInfo().getIsSignedToFunding();
        }
        if(isSignedToFunding){
            leadFundingService.updateFundingStatus(new FundingStatusRequest(List.of(losLead.getPk()), FundingQueueStatus.FUNDING));
            losLead.getLeadInfo().setNotes(String.format("[EsignService][updateLeadStatus] Moved to servicing for %s, refCode : %s",
                clientType, merchantService.getMerchantByLeadPk(losLead.getPk()).getMerchantInfo().getRefMerchantCode()));
            result = true;
        }
        return result;
    }
}


src/main/java/com/uownleasing/svc/service/LeadService.java
package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.enumeration.UnderwritingStatus;
import com.uownleasing.common.pojo.*;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.dms.common.db.entity.EmailQueue;
import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.AttachmentType;
import com.uownleasing.dms.common.enumeration.CorrespondenceType;
import com.uownleasing.dms.common.enumeration.EmailBodyType;
import com.uownleasing.dms.common.enumeration.Location;
import com.uownleasing.dms.common.pojo.AttachmentInfo;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.repository.ApplicationRepo;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.CommonDataPojo;
import com.uownleasing.svc.pojo.CorrespondenceRequest;
import com.uownleasing.svc.pojo.PreviousLeadsInfo;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import com.uownleasing.svc.utility.Snowflake;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class LeadService {
    private final ApplicationRepo appRepo;

    private final LosLeadService losLeadService;

    private final UpdateLeadStatusService updateLeadStatusService;

    private final LosEmploymentService employmentService;

    private final LosBankAccountService bankAccountService;

    private final LosReceivableService receivableService;

    private final MerchantService merchantService;

    private final LosInvoiceService invoiceService;

    private final LosItemService itemService;

    private final LosCreditCardService ccService;

    private final LosCustomerService customerService;

    private final UnderwritingService uwService;

    private final ConfigurationManagement configurationManagement;

    private final EntityManager entityManager;

    private final ObjectMapper mapper = new ObjectMapper();

    private final SvSqlConfigService sqlConfigService;

    private final LosLoggingService losLoggingService;

    private final CorrespondenceService correspondenceService;

    private final EmailQService emailQService;

    private final SmsService smsService;

    private final BlackListService blackListService;

    private final String configurationPath = "com.uownleasing.svc.service.LeadService.";

    public LosLead getMostRecentLeadForSsn(String ssn) {
        List<LosLead> leads = appRepo.getMostRecentLeadForSsn(ssn);
        return leads == null || leads.isEmpty() ? null : leads.get(0);
    }

    public LosLead getMostRecentLeadsForSsnAndMerchantPk(String ssn, Long merchantPk) {
        List<LosLead> leads = appRepo.getMostRecentLeadForSsnAndMerchantPk(ssn, merchantPk);
        return leads == null || leads.isEmpty() ? null : leads.get(0);
    }

    public LosUWData checkForDeniedUW(LosLead lead, List<LosLead> previousLeads, BigDecimal approvalAmount) {
        log.info("[LeadService][checkForDeniedUW] New lead {}, approvalAmount {}", lead.getPk(), approvalAmount);
        if (CollectionUtils.isNotEmpty(previousLeads)) {
            LosLead oldLead = previousLeads.get(previousLeads.size()-1);
            LosUWData uw = oldLead.getLosUWData();
            if(uw != null && uw.getUwInfo().getUwStatus().equals(UnderwritingStatus.DENIED)){
                log.info("[LeadService][checkForDeniedUW] Most recent lead {} is denied", oldLead.getPk());
                return uwService.copyUnderwriting(oldLead, lead, approvalAmount);
            }
        }
        return null;
    }

    public LosUWData createOrRetrieveUWForLead(LosLead lead, PreviousLeadsInfo previousLeadsInfo) {
        return uwService.createUnderwritingForLead(lead, previousLeadsInfo);
    }
//        List<LosLead> previousLeads = previousLeadsInfo.getPreviousLeads();
//        BigDecimal approvalAmount = previousLeadsInfo.getApprovalAmount();
//        Boolean checkExistingUw = configurationManagement.getBoolean("check.existing.uw.data.exists.for.lead", true);
//        LosCustomer customer = lead.getLosCustomers().iterator().next();
////        if(otherLead == null) {
////            otherLead = getMostRecentLeadForSsn(customer.getCustomerInfo().getSsn());
////        }
//        Boolean otherLeadExists = previousLeads != null && !previousLeads.isEmpty();
//        if(!checkExistingUw || !otherLeadExists){
//            uwData = uwService.runUnderwriting(lead);
//        }else{
//            String oldLeadPks = previousLeads.stream().map(l -> String.valueOf(l.getPk()))
//                .collect(Collectors.joining(", ", "", ""));
//            LosLead oldLead = previousLeads.get(previousLeads.size()-1);
//            uwData = checkForDeniedUW(lead, previousLeads, approvalAmount);
//            if (uwData == null) {
//                LosEmail oldEmail = oldLead.getLosEmails().iterator().next();
//                LosPhone oldPhone = oldLead.getLosPhones().iterator().next();
//                LosAddress oldAddress = oldLead.getLosAddresses().iterator().next();
//
//                LosEmail email = lead.getLosEmails().iterator().next();
//                LosPhone phone = lead.getLosPhones().iterator().next();
//                LosAddress address = lead.getLosAddresses().iterator().next();
//
//                String changed = "";
//                if (configurationManagement.getBoolean(configurationPath + "get.mismatched.lead.info", true)) {
//                    if (oldEmail != null && email != null && !oldEmail.getEmailInfo().getEmailAddress().trim().equalsIgnoreCase(email.getEmailInfo().getEmailAddress().trim()))
//                        changed += String.format("; Email: %s changed to %s", oldEmail.getEmailInfo().getEmailAddress(), email.getEmailInfo().getEmailAddress());
//                    if (oldPhone != null && phone != null && (!oldPhone.getPhoneInfo().getPhoneNumber().equals(phone.getPhoneInfo().getPhoneNumber())
//                        || !oldPhone.getPhoneInfo().getAreaCode().trim().equals(phone.getPhoneInfo().getAreaCode().trim())))
//                        changed += String.format("; Phone: (%s) %s changed to (%s) %s", oldPhone.getPhoneInfo().getAreaCode(), oldPhone.getPhoneInfo().getPhoneNumber(),
//                            phone.getPhoneInfo().getAreaCode(), phone.getPhoneInfo().getPhoneNumber());
//                    if (oldAddress != null && address != null && !oldAddress.getAddressInfo().getZipCode().trim().equals(address.getAddressInfo().getZipCode().trim()))
//                        changed += String.format("; Zipcode: %s changed to %s", oldAddress.getAddressInfo().getZipCode(), address.getAddressInfo().getZipCode());
//
//                    if (StringUtils.isNotBlank(changed)) {
//                        lead.getLeadInfo().setNotes("[LeadService][createOrRetrieveUWForLead] Data mismatch: " + changed);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Data mismatch for UW: " + changed, ThreadAttributes.getUsername());
//                    }
//                }
//
//                if (StringUtils.isBlank(changed)) {
//                    lead.getLeadInfo().setSsnAlreadyExists(true);
//                    lead.getLeadInfo().setNotes("Copying UW due to data match");
//                    lead.getLeadInfo().setNotes("Given ssn " + customer.getCustomerInfo().getSsn().substring(5) + " already exists on lead(s) " + oldLeadPks);
//                    uwData = uwService.copyUnderwriting(previousLeads.get(0), lead, approvalAmount);
//                    // if not eligible set uw status to DENIED & create log -> uwDataRepo.save(uwData)
//                } else {
//                    if (configurationManagement.getBoolean(configurationPath + "check.old.lead.info.for.match", false)) {
//                        lead.getLeadInfo().setNotes("Rerunning UW due to data mismatch" + changed);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Rerunning UW due to data mismatch", ThreadAttributes.getUsername());
//                        lead.getLeadInfo().setRerunUnderwriting(Boolean.TRUE);
//                        uwData = uwService.runUnderwriting(lead);
//                    } else {
//                        lead.getLeadInfo().setSsnAlreadyExists(true);
//                        lead.getLeadInfo().setNotes("Given ssn " + customer.getCustomerInfo().getSsn().substring(5) + " already exists on lead(s) " + oldLeadPks);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Copying UW regardless of data mismatch", ThreadAttributes.getUsername());
//                        uwData = uwService.copyUnderwriting(previousLeads.get(0), lead, approvalAmount);
//                    }
//                }
//            }
//        }
//        return uwData;



    public FinancialInformation getFinancialInfoForLead(long leadPk){
        FinancialInformation financialInformation = new FinancialInformation();
        financialInformation.setLeadPk(leadPk);
        LosEmployment employment = employmentService.getPrimaryEmploymentByLeadPk(leadPk);
        financialInformation.setEmploymentInfo(employment != null ? employment.getEmploymentInfo() : null);
        List<LosBankAccount> bankAccounts = bankAccountService.getAllBankAccountsForLead(leadPk);
        List<LosCreditCard> creditCards = ccService.getByLeadPk(leadPk);

        //financialInformation.setBankAccountInfo(bankAccount != null ? bankAccount.getBankAccountInfo() : null);
        financialInformation.setBankAccounts(bankAccounts);
        financialInformation.setCreditCards(creditCards);
        //financialInformation.setCcInfo(losCreditCard != null ? losCreditCard.getCreditCardInfo() : null);
        return financialInformation;
    }

    public ScheduledPaymentsInformation getScheduledPayments(long leadPk){
        ScheduledPaymentsInformation scheduledPaymentsInformation = new ScheduledPaymentsInformation();
        scheduledPaymentsInformation.setLeadReceivables(receivableService.getActiveReceivablesOrderByDueDate(leadPk));
        return scheduledPaymentsInformation;
    }

    public InvoiceInformation getInvoiceInformation(long leadPk){
        InvoiceInformation invoiceInformation = new InvoiceInformation();
        invoiceInformation.setMerchantInfo(merchantService.getMerchantByLeadPk(leadPk).getMerchantInfo());
        LosInvoice invoiceForLead = invoiceService.getInvoiceForLead(leadPk);
        invoiceInformation.setInvoiceInfo(invoiceForLead != null ? invoiceForLead.getInvoiceInfo() : null);
        invoiceInformation.setItems(itemService.getAllItemsForLead(leadPk));
        return invoiceInformation;
    }

    public LosLead getByLeadPk(long leadPk) {
        LosLead losLead = losLeadService.getByLeadPk(leadPk);
        LosUWData uwData = uwService.getUWDataForLead(leadPk);
        if(uwData != null){
            losLead.getLeadInfo().setApprovalAmount(uwData.getUwInfo().getApprovalAmount());
        }
        return losLead;
    }

    public LosLead createOrUpdateLead(LeadInfo leadInfo) {
        if(StringUtils.isBlank(leadInfo.getId())){
            Snowflake snowflake = new Snowflake(SystemConfigurationManagement.getDatacenterId(), SystemConfigurationManagement.getWorkerId());
            leadInfo.setId(String.valueOf(snowflake.nextId()));
        }
        return losLeadService.createOrUpdateLead(leadInfo);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LosLead createOrUpdateLeadWithNewTransaction(LeadInfo leadInfo) {
        return createOrUpdateLead(leadInfo);
    }

    public LosLead getByLeadUuid(String uuid) {
        return losLeadService.getByLeadUuid(uuid);
    }

    public LosLead getByLeadUuidAndId(String uuid, String id) {
        log.info("Lead Uuid {}, lead id {}", uuid, id);
        return losLeadService.getByLeadUuidAndId(uuid, id);
    }

    public LosLead getByLeadUuidAndId(String uuidWithId) {
        log.info("[LeadService][getByLeadUuidAndId] Lead UuidWithId {}", uuidWithId);
        LosLead lead = null;
        if (StringUtils.isNotBlank(uuidWithId)) {
            int separatorIndex = uuidWithId.lastIndexOf("_");
            if (separatorIndex > 0 && separatorIndex < uuidWithId.length() - 1) {
                String leadUuid = uuidWithId.substring(0, separatorIndex);
                String leadId = uuidWithId.substring(separatorIndex + 1);
                log.info("[LeadService][getByLeadUuidAndId] Parsed leadUuid: {}, leadId: {}", leadUuid, leadId);
                lead = losLeadService.getByLeadUuidAndId(leadUuid, leadId);
            }
        }
        return lead;
    }

    public LosLead updateLead(LeadInfo leadInfo) {
        return losLeadService.updateLead(leadInfo);
    }

    public LeadInfo updateBankruptcyInfo(LeadInfo leadInfo) {
        LeadInfo info = losLeadService.getByLeadPk(leadInfo.getLeadPk()).getLeadInfo();
        if (info == null) {
            throw new SvcException("Please provide a valid leadPk");
        }
        info.setPastBankruptcy(leadInfo.getPastBankruptcy());
        info.setCurrentOrFutureBankruptcy(leadInfo.getCurrentOrFutureBankruptcy());
        losLeadService.updateLead(info);
        return info;
    }
//    public FinancialUpdate createOrUpdateFinancialInfo(FinanceInfo financeInfo) {
//        FinancialUpdate updatedInfo=new FinancialUpdate();
//
//        if (financeInfo.getCcInfo() != null) {
//            LosCreditCard losCreditCard= (LosCreditCard) ccTransactionService.createOrUpdate(financeInfo.getCcInfo());
//            updatedInfo.setLosCreditCard(losCreditCard);
//        }
//        if (financeInfo.getBankAccountInfo() !=null){
//            LosBankAccount losBankAccount= bankAccountService.createOrUpdateBankAccount(financeInfo.getBankAccountInfo());
//            updatedInfo.setLosBankAccount(losBankAccount);
//        }
//        return updatedInfo;
//    }

    public LeadInfo toggleAlertsForLead(long leadPk, boolean toggleAlert) {
        LeadInfo leadInfo = losLeadService.getByLeadPk(leadPk).getLeadInfo();
        leadInfo.setShowAlerts(toggleAlert);
        return losLeadService.updateLead(leadInfo).getLeadInfo();
    }

    public List<LeadStatus> getAllLeadStatuses() {
        return List.of(LeadStatus.values());
    }

    public List<LeadStatus> getAllInternalStatuses() {
        List<String> allInternalStatus =
            List.of(configurationManagement.getString(
                    configurationPath + "internal.status", "ACCOUNT_STATUS_INELIGIBLE, ACCOUNT_UNDERPAID, ACH_NOT_CLEARED, ACH_NOT_CLEARED_DUP_EMAIL, ACH_NOT_CLEARED_DUP_PHONE, ADDRESS_MISMATCH, BANK_VERIFICATION_ERROR, BLACKLIST_APPROVED, BLACKLIST_DENIED, BLACKLISTED, CANCELLED_DUP_DENIAL, CANCELLED_DUP_SSN, CC_AUTH_FAILED, CC_VALIDATION_FAILED, CONTRACT_CREATED, DELINQUENCY_DENIED, DELINQUENT_ACCOUNT, DELINQUENT_ACCOUNT_DUP_EMAIL, DELINQUENT_ACCOUNT_DUP_PHONE, DUP_EMAIL_DATA_MISMATCH, DUP_FRAUD_DENIED, DUP_LEXISNEXIS_DENIED, DUP_NEUSTAR_DENIED, DUP_PHONE_DATA_MISMATCH, DUP_SENTILINK_DENIED, EMAIL_COUNT_FAILED, EXPIRED, FPD_IN_FUTURE, FPD_IN_FUTURE_DUP_EMAIL, FPD_IN_FUTURE_DUP_PHONE, FRAUD_DENIED, FRAUD_ERROR, FUNDED, FUNDING, INTELLICHECK_FAILED, INVOICE_CANCELLED, INVOICE_CREATED, LEXISNEXIS_DENIED, LEXISNEXIS_ERROR, NEUSTAR_DENIED, NO_BUSINESS_IN_STATE, NO_PROGRAM_IN_STATE, PENDING_UW, PHONE_COUNT_FAILED, PRE_AUTH_FAILED, SENTILINK_DENIED, SENTILINK_DENIED_SSN_TYPO, SIGNED, SIGNING_FEE_DENIED, SOURCE_INELIGIBLE, UW_APPROVED, UW_DENIED, UW_ERROR, UWENGINE_ERROR, UWENGINE_FAILED, INCOMPLETE, INTELLICHECK_UPLOADED, INTELLICHECK_UPLOAD_ERROR, INTELLICHECK_RESULTS_ERROR, INTELLICHECK_ERRORED,NEURO_ID_DENIED,NEURO_ID_APPROVED,NEURO_ID_ERROR,SEON_ID_FAILED,SEON_ID_UPLOADED,SEON_ID_APPROVED,PLAID_PENDING,PLAID_SUBMITTED,PLAID_ABANDONED,PLAID_ERROR,PLAID_IN_PROCESS,PLAID_FAILED,PLAID_SUCCESS")
                .split(","));

        List<LeadStatus> allDistinctInternalStatus = new ArrayList<>();
        for (String internalStatus : allInternalStatus) {
            allDistinctInternalStatus.add(LeadStatus.valueOf(internalStatus.trim()));
        }

        return allDistinctInternalStatus;
    }

    public void sendBankVerificationDeclinedEmail(long leadPk) {
        LosLead lead = getByLeadPk(leadPk);
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        LosCustomer customer = customerService.getPrimaryCustomer(leadPk);
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
        String redirectUrl = UrlBuilderUtils.buildCompleteUrl(merchant.getMerchantInfo().getClientType(), env, lead.getLeadInfo().getShortCode());
        CorrespondenceRequest request = new CorrespondenceRequest();
        request.setLeadPk(leadPk);
        request.setLocation(Location.SVC);
        request.setCustomerPk(customer.getPk());
        request.setTemplateName("BankVerificationDeclinedEmail");
        request.setCorrespondenceType(CorrespondenceType.EMAIL);

        CommonDataPojo cdp = new CommonDataPojo();
        cdp.setPaymentOptionUrl(redirectUrl);
        request.setCommonDataPojo(cdp);

        correspondenceService.createCorrespondence(request);
    }


    public void sendFundingReport(List<Long> merchantPks, String frequency, AtomicReference<String> error) {
        sendFundingReport(merchantPks, false, frequency, error);
    }

    public void sendFundingReport(List<Long> merchantPks, boolean consolidated, String frequency, AtomicReference<String> error) {
        String csv;
        String reportName = "Funding Report_%s";
        String fundingReportDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        if (consolidated) {
            try {
                Merchant m = merchantService.getMerchantByPk(merchantPks.get(0));
                reportName += " [%s]";
                reportName = String.format(reportName, frequency.toUpperCase(), fundingReportDate);
                csv = createFundingReport(merchantPks, frequency);
                createAndSendFundingReportToEmails(csv, reportName, m.getMerchantInfo().getMergedFundingReportEmails());
            } catch (Exception e) {
                log.error("Error sending merged funding report", e);
                error.set(error.get() + "\n" + e.getMessage());
            }
        } else {
            for (Long pk : merchantPks) {
                try {
                    Merchant m = merchantService.getMerchantByPk(pk);
                    reportName += "_%s [%s]";
                    reportName = String.format(reportName, m.getMerchantInfo().getLocationName(), frequency.toUpperCase(), fundingReportDate);
                    csv = createFundingReport(List.of(pk), frequency);
                    createAndSendFundingReportToEmails(csv, reportName, m.getMerchantInfo().getFundingReportEmails());
                } catch (Exception e) {
                    log.error("Error sending funding report to merchant pk {}", pk, e);
                    error.set(String.format("%s merchantPk %d -> %s%n", error.get(), pk, e.getMessage()));
                }
            }
        }
    }

    private String createFundingReport(List<Long> merchantPks, String frequency) {
        if (CollectionUtils.isNotEmpty(merchantPks)) {
            SvSqlConfig config = sqlConfigService.getSqlConfigBySqlName("getFundingReport");
            String sql = config.getSqlConfigInfo().getSqlQuery();
            sql = sql.replaceAll("(?i):merchantPks", StringUtils.join(merchantPks, ','))
                .replaceAll("(?i):frequency", "'" + frequency.toUpperCase() + "'");

            List<String> keys = new ArrayList<>();
            Matcher matcher = Pattern.compile("(?i)(as) (\"[A-Z]+[^\"]*\")").matcher(sql);
            matcher.results().forEach(r -> keys.add(r.group().replaceAll("(?i)as ", "").replace("\"", "")));

            Query query = entityManager.createNativeQuery(sql);
            NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
            nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
            List<Map<String, Object>> fundingList = nativeQuery.getResultList();

            NumberFormat formatter = NumberFormat.getCurrencyInstance();
            StringBuilder csv = new StringBuilder(StringUtils.join(keys, ",")).append("\n");
            for (Map<String, Object> map : fundingList) {
                for (String key : keys) {
                    if (map.get(key) instanceof Double || map.get(key) instanceof BigDecimal) {
                        csv.append("\"").append(formatter.format(map.get(key))).append("\"");
                    } else if (String.valueOf(map.get(key)).contains(",")) {
                        csv.append("\"").append(map.get(key)).append("\"");
                    } else {
                        csv.append(map.get(key));
                    }

                    if (keys.indexOf(key) != keys.size() - 1) {
                        csv.append(",");
                    }
                }
                csv.append("\n");
            }
            return csv.toString();
        }
        return null;
    }

    private void createAndSendFundingReportToEmails(String reportCsv, String reportName, String toEmails) {
        if (StringUtils.isNotBlank(reportCsv) && StringUtils.isNotBlank(toEmails)) {
            EmailQueue email = new EmailQueue();
            email.setSubject(reportName);
            email.setEmailBodyType(EmailBodyType.TEXT);
            email.setEmailBody("Attached is the Funding Report");
            email.setToEmailAddresses(toEmails);
            email.setLocation(Location.LOS);

            if (SystemConfigurationManagement.isProduction()) {
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.funding.email.uown", "funding@uownleasing.com"));
            } else {
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.funding.email.uown", "uown.dev@uownleasing.com"));
            }

            AttachmentInfo attachmentInfo = new AttachmentInfo();
            attachmentInfo.setAttachmentType(AttachmentType.CSV);

            attachmentInfo.setContent(reportCsv.getBytes(StandardCharsets.UTF_8));
            attachmentInfo.setName(reportName + ".csv");
            emailQService.createOrUpdateEmailQueue(email, List.of(attachmentInfo));
        }
    }

    public void sendFinalizeEmailAfterVerification(long leadPk) {
        LosLead lead = losLeadService.getByLeadPk(leadPk);
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
        String redirectUrl = (env != null
            ? "https://origination-" + env + ".uownleasing.com/completeEsign?uuid="
            : configurationManagement.getString(configurationPath + "bank.verified.redirect.base.url", "https://origination-dev1.uownleasing.com/completeEsign?uuid="))
            + lead.getLeadInfo().getUuid() + "_" + lead.getLeadInfo().getId();

        CorrespondenceRequest request = new CorrespondenceRequest();
        request.setLeadPk(lead.getPk());
        request.setTemplateName("FinalizeVerifiedPurchaseEmail");
        request.setCorrespondenceType(CorrespondenceType.EMAIL);
        request.setCreatedBy(ThreadAttributes.getUsername());
        CommonDataPojo cdp = new CommonDataPojo();
        cdp.setPaymentOptionUrl(redirectUrl);
        request.setCommonDataPojo(cdp);

        if (configurationManagement.getBoolean(configurationPath + "send.finalize.email.in.async", true)) {
            correspondenceService.createCorrespondenceAsync(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail after bank verification in async.");
        } else {
            correspondenceService.createCorrespondence(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail after bank verification in sync.");
        }

        if (configurationManagement.getBoolean(configurationPath + "send.verified.finalize.text", true)) {
            Set<LosPhone> phones = lead.getLosPhones();
            Set<LosCustomer> customers = lead.getLosCustomers();
            LosInvoice invoice = lead.getLosInvoice();
            if (CollectionUtils.isNotEmpty(phones) && CollectionUtils.isNotEmpty(customers) && invoice != null) {
                LosPhone phone = phones.stream().findFirst().orElse(null);
                LosCustomer customer = customers.stream().findFirst().orElse(null);

                if (phone != null && customer != null) {
                    SmsQueue sms = new SmsQueue();
                    sms.setLeadPk(lead.getPk());
                    String template = configurationManagement.getString(
                        configurationPath + "verified.finalize.text.body",
                        "Hi, %s %s!%n Finalize your purchase of $%s, with Uown. Please follow the link below to finalize your purchase.%n%s%n Reply STOP to Unsubscribe. Uownleasing"
                    );
                    sms.setSmsBody(
                        SmsMessageBuilder.buildVerifiedFinalizeMessage(
                            merchant.getMerchantInfo().getClientType(),
                            customer.getCustomerInfo().getFirstName(),
                            customer.getCustomerInfo().getLastName(),
                            invoice.getInvoiceInfo().getTotalInvoiceAmount(),
                            redirectUrl,
                            template
                        )
                    );
                    sms.setToPhoneNumber(phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber().toString());
                    sms.setTemplateName("FinalizeAfterVerification");
                    smsService.sendText(sms);
                    losLoggingService.createActivityLog(lead.getPk(),  LogType.CORRESPONDENCE, false, null, "Finalize after Verification text message sent to " + phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber().toString(), "");
                }
            }
        }
    }

    public MerchantRebateResults getRebateAmount(MerchantRebateRequest request) {
        SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("getRebateAmount");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery();
        sql = sql.replace(":merchantPks", CollectionUtils.isNotEmpty(request.getMerchantPks()) ? StringUtils.join(request.getMerchantPks(), ",") : "null");
        sql = sql.replace(":from", "'" + (request.getFrom() == null ? LocalDate.now() : request.getFrom()) + "'" );
        sql = sql.replace(":to", "'" + (request.getTo() == null ? LocalDate.now() : request.getTo()) + "'");
        sql = sql.replace(":max", request.getMaxResults() != null && request.getPageNumber() != null ? request.getMaxResults().toString() : "null");
        sql = sql.replace(":pageOffset", request.getMaxResults() != null && request.getPageNumber() != null ? ((Integer)(request.getPageNumber() * request.getMaxResults())).toString() : "null");
        sql = sql.replace(":merchantRefCodes", CollectionUtils.isEmpty(ThreadAttributes.getMerchantReferenceCodes()) ? "'*'" : "'" + String.join("','", ThreadAttributes.getMerchantReferenceCodes()) + "'");

        Query query = entityManager.createNativeQuery(sql);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        List<Map<String, Object>> result = nativeQuery.getResultList();
        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModule(new Jdk8Module());
        return new MerchantRebateResults(result.stream()
            .map(o -> {
                try {
                    return
                        mapper.readValue(mapper.writeValueAsString(o), MerchantRebateInfo.class);
                } catch (Exception e) {
                    log.info("Error message ", e);
                }
                return null;
            }).collect(Collectors.toList()), request);
    }

    public Map<String, String> leadStatusToMap() {
        Map<String, String> leadStatuses = new HashMap<>();
        for (LeadStatus status : LeadStatus.values()) {
            leadStatuses.put(status.name(), status.getUserFriendlyText());
        }
        return leadStatuses;
    }

    public void blackListAllItemsForLead(Long leadPk) {
        LosLead lead = getByLeadPk(leadPk);

        Optional<CustomerInfo> customerInfoOptional = Optional.ofNullable(customerService.getPrimaryCustomer(lead.getPk()))
            .map(LosCustomer::getCustomerInfo);

        Optional<PhoneInfo> phoneInfoOptional = lead.getLosPhones().stream().findFirst().map(LosPhone::getPhoneInfo);

        Optional<EmailInfo> emailInfoOptional = lead.getLosEmails().stream().findFirst().map(LosEmail::getEmailInfo);

        Optional<BankAccountInfo> bankAccountInfoOptional = Optional.ofNullable(bankAccountService.getAutoPayBankAccountForLead(leadPk))
            .map(LosBankAccount::getBankAccountInfo);

        Optional<AddressInfo> addressInfoOptional = lead.getLosAddresses().stream()
            .findFirst()
            .map(LosAddress::getAddressInfo);

        customerInfoOptional.ifPresent(customerInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setFirstName(customerInfo.getFirstName());
            blackListInfo.setLastName(customerInfo.getLastName());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);

            blackListInfo = new BlackListInfo();
            blackListInfo.setSsn(customerInfo.getSsn());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        phoneInfoOptional.ifPresent(phoneInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setPhoneNumber(phoneInfo.getAreaCode() +
                phoneInfo.getPhoneNumber().toString());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        emailInfoOptional.ifPresent(emailInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setEmailAddress(emailInfo.getEmailAddress());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        bankAccountInfoOptional.ifPresent(bankAccountInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setBankAccountNumber(bankAccountInfo.getAccountNumber());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        addressInfoOptional.ifPresent(addressInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setStreetAddress1(addressInfo.getStreetAddress1());
            blackListInfo.setZipCode(addressInfo.getZipCode());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });
        String notes = "[LeadService][BlackListLead] BlackListed First Name Last Name, Email, Phone Number, ssn, Bank Account Num, Street Address Zip Code for the Lead: " + leadPk;
        updateLeadStatusService.updateLeadStatus(lead,LeadStatus.BLACKLISTED, LeadStatus.BLACKLISTED, notes, "BlackListed All Items for the Lead ", LogType.INTERNAL);
    }

}


src/main/resources/sqls/getFundingQueueDetailsForLead.sql
SELECT new com.uownleasing.svc.pojo.rest.FundingQueueDetails(lead.pk ,
       lead.leadInfo.leadStatus,
       lead.leadInfo.fundDateTime,
       lead.leadInfo.fundRequestDateTime ,
       CONCAT(INITCAP(losCustomer.customerInfo.firstName), ' ', INITCAP(losCustomer.customerInfo.lastName)),
       CONCAT(COALESCE(CAST(losPhone.phoneInfo.areaCode AS string),''),COALESCE(CAST(losPhone.phoneInfo.phoneNumber AS string),'')),
       COALESCE(losEmail.emailInfo.emailAddress,''),
       merchant.merchantInfo.merchantName,
       merchant.merchantInfo.locationName,
       merchant.merchantInfo.legalName,
       merchant.merchantInfo.refMerchantCode,
       merchant.merchantInfo.salesRepCode,
       merchant.pk,
       lead.leadInfo.fundingStatus,
       COALESCE(losSchedSummary.schedSummaryInfo.merchantRebateAmount,0),
       COALESCE(losSchedSummary.schedSummaryInfo.merchantDiscountAmount, 0),
       COALESCE(losSchedSummary.schedSummaryInfo.platFormFeeAmount, 0) ,
          (losSchedSummary.schedSummaryInfo.costWithoutTaxAndFees
            +  COALESCE(losSchedSummary.schedSummaryInfo.platFormFeeAmount, 0)
            - COALESCE(losSchedSummary.schedSummaryInfo.merchantDiscountAmount, 0)
           +  (CASE
                   WHEN COALESCE(merchant.merchantInfo.chargeProcessingFeeBeforeEsign, false) = false
                       THEN losSchedSummary.schedSummaryInfo.processingFee
                   ELSE 0
               END)
           +  losSchedSummary.schedSummaryInfo.protectionPlanFee)  ,
       losSchedSummary.schedSummaryInfo.totalContractAmountWithTaxAndFees,
       losSchedSummary.schedSummaryInfo.costWithoutTaxAndFees*losSchedSummary.schedSummaryInfo.taxRate,
       losSchedSummary.schedSummaryInfo.processingFee+losSchedSummary.schedSummaryInfo.protectionPlanFee+losSchedSummary.schedSummaryInfo.securityDeposit,
       invoice.invoiceInfo.totalInvoiceAmount,
       (COALESCE(invoice.invoiceInfo.totalInvoiceAmount,0) -  COALESCE(invoice.invoiceInfo.depositAmount,0) -  COALESCE(losSchedSummary.schedSummaryInfo.merchantDiscountAmount, 0) + COALESCE(losSchedSummary.schedSummaryInfo.merchantRebateAmount, 0) - invoice.invoiceInfo.taxAmount) - (CASE WHEN merchant.merchantInfo.refMerchantCode IN ('KS15528','KS15694','KS17405','KS17898','KS17899') THEN 49 ELSE 0 END) ,
       (SELECT COALESCE(SUM(item.itemInfo.numberOfItems), 0) FROM LosItem item WHERE item.losInvoice.pk = invoice.pk)  ,
       (SELECT COALESCE(SUM(item.itemInfo.numberOfItemsDelivered), 0) FROM LosItem  item WHERE item.losInvoice.pk = invoice.pk)   ,
       ((SELECT CASE WHEN COALESCE(SUM(item.itemInfo.numberOfItemsDelivered), 0) = 0 THEN COALESCE(SUM(item.itemInfo.numberOfItems), 0) ELSE COALESCE(SUM(item.itemInfo.numberOfItemsDelivered), 0) END FROM LosItem  item WHERE item.losInvoice.pk = invoice.pk) < (SELECT COALESCE(SUM(item.itemInfo.numberOfItems), 0) FROM LosItem  item WHERE item.losInvoice.pk = invoice.pk)),
       invoice.invoiceInfo.merchantInvoiceNumber,
       invoice.invoiceInfo.orderId,
       invoice.invoiceInfo.salesPerson,
       COALESCE(COALESCE(fb.fundingBankData.bankRoutingNumber,ba.merchantBankAccountInfo.routingNumber), ''),
       COALESCE(COALESCE(fb.fundingBankData.bankAccountNumber,ba.merchantBankAccountInfo.accountNumber), ''),
       invoice.invoiceInfo.merchandiseAmount)
       FROM LosLead lead
        JOIN LosCustomer as losCustomer
             ON losCustomer.losLead.pk = lead.pk
        LEFT JOIN LosPhone losPhone
                  ON losCustomer.pk = losPhone.losCustomer.pk
                      AND losPhone.losLead.pk = lead.pk
        LEFT JOIN LosEmail losEmail
                  ON losCustomer.pk = losEmail.losCustomer.pk
                      AND losEmail.losLead.pk = lead.pk
        JOIN LosSchedSummary as losSchedSummary
             ON losSchedSummary.losLead.pk = lead.pk
        JOIN LosInvoice as invoice
             ON invoice.losLead.pk = lead.pk
        JOIN Merchant as merchant
             ON lead.leadInfo.merchantPk = merchant.pk
        LEFT JOIN MerchantBankAccount ba
                  ON merchant.pk = ba.merchant.pk
        LEFT JOIN FundingBankAccount fb
                  ON fb.leadPk = lead.pk
WHERE
        lead.pk = :leadPk


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



**UOWN | Origination | Aplicar Taxa de Locação Específica do BDS e Recalcular o Valor a Ser Financiado**

**Sinopse**
Implementar uma regra financeira específica do BDS, onde uma taxa fixa é exibida na locação como um item de linha, não cobrada ao consumidor, e deduzida do Valor a Ser Financiado.

**Objetivo Comercial**
Para a integração do BDS, a taxa de processamento deve se comportar como um MDR fixo:

* Visível na locação para transparência
* Não cobrada ao consumidor
* Absorvida pelo comerciante através de um valor financiado reduzido
  O sistema atual não suporta esse comportamento, impedindo o avanço da integração.

**Solicitação de Funcionalidade | Requisitos de Negócio**

**Escopo**
Aplica-se apenas aos seguintes códigos de comerciantes BDS:

* KS15528
* KS15694
* KS17405
* KS17898
* KS17899
  Não deve impactar comerciantes não BDS.

**Resultado Esperado**

* Comerciantes BDS utilizam a autorização de $1,00 para validação de cartão.
* Outros comerciantes continuam utilizando o valor padrão de autorização.
* Sem impacto nos fluxos de aplicação existentes.

**Item de Linha da Locação**

* Adicionar um item de linha na locação denominado “Pagamento Inicial”.
* Valor: $49
* Este item de linha:

  * Deve aparecer na locação
  * Não deve ser cobrado ao consumidor em nenhum momento

**Recalcular Valor a Ser Financiado**

* Recalcular automaticamente:
  Valor a Ser Financiado = Preço à Vista - $49
  Aplicado a cada locação associada aos comerciantes BDS.

---

**Sowjanya Kaligineedi**
@skaligineedi
1 semana atrás
**Proprietário**
@fernandogmartins Aqui estão as alterações que você precisa fazer.

Alterações a serem feitas:

* A autorização de $1 será tratada criando programas com a sobrecarga da taxa de processamento de $1; Justin atribuirá esses programas aos comerciantes no PROD. No sandbox, atualize os programas para esses comerciantes com a sobrecarga da taxa de processamento de $1 para testar.

* No EsignService (linha 174), adicione $49 como um item de pagamento inicial nos documentos de locação para os comerciantes configurados (como é apenas uma exibição e não é cobrado ao cliente). Torne os códigos de referência dos comerciantes configuráveis.

* Atualize `getFundingQueueDetails.sql` para subtrair $49 do valor a ser financiado se o código de referência do comerciante estiver na lista configurada. Aplique essa subtração em:
  COALESCE(invoice.invoiceInfo.totalInvoiceAmount,0)
  COALESCE(invoice.invoiceInfo.depositAmount,0)
  COALESCE(losSchedSummary.schedSummaryInfo.merchantDiscountAmount,0)
  COALESCE(losSchedSummary.schedSummaryInfo.merchantRebateAmount,0)
  invoice.invoiceInfo.taxAmount

---

**Fernando Martins**
@fernandogmartins
4 dias atrás
**Manutenção**

**# Passos de Teste**

**1. Visão Geral da Implementação**

| Área                                 | Localização                                                | Comportamento                                                                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Configuração**                     | `InitialPaymentConfig`                                     | Lê os códigos de referência de comerciantes e valores da configuração.                                                                                                   |
| **Documento de Locação**             | `EsignService`                                             | Adiciona uma linha sintética "Pagamento Inicial" ao `losItems` ao gerar o documento de locação para comerciantes elegíveis (somente exibição).                           |
| **Valor a Ser Financiado (LOCACÃO)** | `getFundingQueueDetailsForLead.sql` / `LeadFundingService` | A consulta de financiamento LEASE subtrai o valor configurado (ex: 49) do valor a ser financiado quando o código de referência do comerciante está na lista configurada. |

**Chaves de Configuração (ConfigurationManagement):**

* `com.uownleasing.svc.initialPayment.merchantRefCodes` – Códigos de referência de comerciantes separados por vírgula (padrão: `KS15528,KS15694,KS17405,KS17898,KS17899`).
* `com.uownleasing.svc.initialPayment.amount` – Valor do Pagamento Inicial (padrão: `49`).

---

**2. Documento de Locação (EsignService)**

**O que validar:** Para um comerciante elegível, o documento de locação gerado inclui uma linha "Pagamento Inicial" visível apenas com o valor configurado.

![imagem](/uploads/df35294587e5409a373869504c29c4f0/image.png){width=506 height=93}

**Passos**

1. Crie ou use um lead cujo comerciante tenha um código de referência na configuração `merchantRefCodes` (ex: KS15528).
2. Insira as informações financeiras em `completeApplication` e prossiga para a assinatura.
3. **Esperado:** Uma linha com a descrição "Pagamento Inicial" e o valor configurado (ex: $49). Deve ser apenas para exibição (sem lógica de cobrança separada).
4. Repita com um lead cujo código de referência do comerciante **não** esteja na lista.
5. **Esperado:** Nenhuma linha "Pagamento Inicial" no documento de locação.

---

**3. Valor a Ser Financiado (LOCACÃO)**

**O que validar:** Para o tipo de fatura LEASE, o valor a ser financiado é reduzido pelo valor do Pagamento Inicial configurado quando o comerciante é elegível.

**3.1 Como funciona**

* `LeadFundingService.getFundingQueueDetailsForLead` usa o SQL chamado `getFundingQueueDetailsForLead` para LEASE.
* O SQL (em `getFundingQueueDetailsForLead.sql`) calcula `amountToBeFunded` e subtrai o valor do Pagamento Inicial (ex: 49) quando `merchant.merchantInfo.refMerchantCode` está na lista de elegíveis.

**3.2 getFundingQueueDetails**

**Endpoint:** `{{url}}/uown/getFundingQueueDetails/{{leadPk}}`

**Campos relevantes a verificar:**

| Cenário                                               | `merchantRefCode`                          | `amountToBeFunded`                       |
| ----------------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Sem código de referência correspondente               | ex: `OL90205-0079_clone_clone_clone_clone` | ex: `700.00`                             |
| Com código de referência correspondente (ex: KS17405) | ex: `KS17405`                              | ex: `651.00` (49 a menos que o anterior) |

---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/devops/configuration/-/blob/uown-sandbox/config/svc/application.yaml?ref_type=heads

spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1
    validate-on-migrate: false
    clean-disabled: true
    schemas: public
    table: flyway_schema_history
    sql-migration-prefix: V
    sql-migration-separator: __
    sql-migration-suffixes: .sql


system:
  config:
    com:
      uownleasing:
        svc:
          service:
            PlaidService:
              clientId: "6846ea5a7a4f700021ffba01"
              secret: "45844f28e148f618885e6f0dd8f566"
              webhook-host: "https://svc-sandbox.uownleasing.com"
              requirePhoneVerification: "true"
            ApprovalEmailService:
              check:
                approval:
                  email:
                    for:
                      duplicates: "false"
            PaymentReceiptService:
              send:
                ach:
                  payment:
                    receipt: "true"
                cc:
                  payment:
                    receipt: "true"
                payment:
                  decline:
                    sms: "false"
                first:
                  payment:
                    default:
                      sms: "false"
            TaxService:
              tax:
                rate:
                  for:
                    MY_EYE_MED:
                      GA: "0.0"
            UnderwritingService:
              skip:
                uw:
                  merchant:
                    clientType:
                      _360_FINANCE: "true"
              lambda:
                segment:
                  max: "8"
                  min: "1"
              set:
                uw:
                  sentilink:
                    data: "true"
                  neustar:
                    data: "true"
                  seon:
                    data: "true"
              use:
                taktile:
                  for:
                    decision: "false"
                gds:
                  for:
                    decision: "true"
              send:
                request:
                  to:
                    taktile: "false"
            SvAccountService:
              restrict:
                frequencies:
                  for:
                    sub:
                      prime: "false"
            LeadService:
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          SK00001-0001: "true"
                          5348120500488887: "true"
            LeadItemService:
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
            ScheduledTaskService:
              send:
                first:
                  payment:
                    reminder:
                      sms: "false"
                recurring:
                  payment:
                    reminder:
                      sms: "false"
                delinquency:
                  offer:
                    sms: "false"
                late:
                  payment:
                    notice:
                      sms: "false"
              delinquent:
                payments:
                  report:
                    to:
                      email: "fintechgroup777@gmail.com"
              generate:
                delinquent:
                  payments:
                    report: "true"
              reverse:
                ach:
                  payments:
                    sweep:
                      thread:
                        size: "1"
            EsignService:
              send:
                redirect:
                  url:
                    to:
                      esign:
                        client: "false"
              uown:
                esign:
                  mock:
                    response:
                      on:
                        test: "false"
              uown.esign.mock.response.on.test: "false"
            CCTransactionService:
              use:
                channel:
                  payments: "true"
              default:
                amount:
                  to:
                    authenticate: "1.01"
            BootstrapService:
              load:
                only:
                  new:
                    templates: "true"
                    sql: "true"
            CorrespondenceService:
              track:
                customer:
                  correspondence:
                    EMAIL: "false"
                    SMS: "false"
            IntellicheckService:
              sdk:
                uri: http://idn-server.intellicheck-dev.svc.cluster.local:80
            RunUWService:
              neustar:
                verified:
                  component:
                    for:
                      service:
                        tenure: "3,4,5,8"
                phone:
                  service:
                    tenure:
                      for:
                        verified:
                          component3: "1,-1,-2,-3,-4,-5,-6,-7"
                          component4: "1,-1,-2,-3,-4,-5,-6,-7"
                          component5: "1,-1,-2,-3,-4,-5,-6,-7"
                          component8: "1,2,3,4,5,6,7,-1,-2,-3,-4,-5,-6,-7"
              fraud:
                engine:
                  email:
                    check:
                      version: v2
                  phone:
                    check:
                      version: v1
                  ip:
                    check:
                      version: v1
            NeuroIdVerificationService:
              neuro:
                id:
                  siteid:
                    SEND_APP: "items340"
                    SUBMIT_APP: "depth355"
            SendApplicationService:
              check:
                duplicate:
                  info: "false"
                for:
                  previous:
                    signed: "true"
                previous:
                  leads:
                    for:
                      delinquency: "false"
              "deny.rate.for.blank.category": "-0.1"
              plaidMaxLambdaSegment: 650
              plaidMinLambdaSegment: -1
            IdVerificationService:
              verify:
                intellicheck:
                  id:
                    expired: "true"
                  first:
                    name: "false"
                  last:
                    name: "true"
                  date:
                    of:
                      birth: "true"
                seon:
                  document:
                    expired: "true"
                  full:
                    name: "true"
                  date:
                    of:
                      birth: "true"
            cc:
              CCSaleService:
                ccPeekOn : "true"
                ccPeekOnSameDayRequest : "true"
              CCPostRunUpdateService:
                  card:
                    error:
                      invalid: "restricted card,card is expired,card number error,closed account,hold card (lost),hold card (pick up card),hold card (stolen)"
            SmService:
              text:
                grid:
                  auth:
                    token:
                      test: "5C08EE4D5D7A4DA18D9BA627732C0263"
                  phone:
                    numbers: "+16465829473,+16263856892,+14695051760,+12153157135"
          uownclient:
            UownClient:
              do:
                not:
                  allow:
                    invoice:
                      increase:
                        for:
                          client:
                            SWEET_PAY: "true"
                  check:
                    cost:
                      and:
                        credit:
                          limit:
                            for:
                              client:
                                type:
                                  in:
                                    submitApplication: "WE_GET_FINANCING"
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          _360_FINANCE: "true"
                          SK00001-0001: "true"
              set:
                program:
                  for:
                    sweetPay: "true"
              CC:
                lastname:
                  contain:
                    check: "true"
              sentilink:
                theft:
                  score:
                    threshold: "700"
                abuse:
                  score:
                    threshold: "650"
              bypass:
                uwengine: "true"
              check:
                duplicate:
                  cc: "false"
                  info: "false"
                old:
                  lead:
                    info:
                      for:
                        data:
                          match:
                            by:
                              merchants:
                                code: ""
                authorization:
                  request:
                    map: "false"

              offer:
                insurance:
                  in:
                    states: "AR, AZ, AK, AL, CO, CT, DE, DC, FL, GA, HI, IN, IL, IA, ID, KY, KS, LA, LA, MO, MI, MT, MN, MD, ME, MA, MS, NE, NY, NM, NH, ND, NC, NJ, NV, OR, OH, PA, RI, SD, SC, TX, TN, VT, VA, WA, WV, WY, WI, PR"
              max:
                hours:
                  link:
                    is:
                      valid: 360

          validator:
            LosRequestMessageConstraintValidator:
              check:
                programName:
                  by:
                    ClientType:
                      _360_FINANCE: "true"
              verify:
                address: "true"
              required:
                fields:
                  for:
                    _360_FINANCE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,programName,maxApprovalAmount,requestedLoanAmount"
                    PAY_POSSIBLE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SKEPS:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SYNCHRONY:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    TIRE_BROS:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    LEND_PRO:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    KORNERSTONE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,mainNextPayDate"
              validate:
                invoice:
                  numbers:
                    for:
                      merchant:
                        MO1234-0001: "false"
                        SK00001-0001: "false"
              enable:
                address:
                  format:
                    regex:
                      street1: "^(?i)[0-9]{1,7}\\s+[A-Za-z0-9#]+(?:\\s[A-Za-z0-9#]+)*(?:\\s(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor)\\s*#?\\s*[A-Za-z0-9]+)?$"
                      street2: "(?i)^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s*#?\\s*[A-Za-z0-9]+$"

          migration:
            kornerstone:
              service:
                MigrationService:
                  single-thread-threshold: 50
                  min-batch-size: 20

          test: "config is working"
          config:
            svOutboundCall:
              connect:
                timeout: "120000"
            losOutboundCall:
              connect:
                timeout: "120000"
            CreditCardConfig:
              convenienceFee: "4"
    statuses:
      eligible:
        for:
          pending:
            uw:
              "DENIED,FRAUD_DENIED,DELINQUENCY_DENIED,BLACKLIST_DENIED,ACH_NOT_CLEARED,FPD_IN_FUTURE,DELINQUENT_ACCOUNT,ACCOUNT_UNDERPAID,ACCOUNT_STATUS_INELIGIBLE,SENTILINK_DENIED,NEUSTAR_DENIED"
    uw:
      airblackbox:
        url:
          "https://leadrouter.f3easervicing.com/service/application-finalize"
        new:
          url: "https://decision-engine-qa.uownfintech.com/service/application-finalize"
        use:
          old:
            url: "false"
        old:
          url:
            routing:
              threshold: "-1"

    percent:
      texts:
        sent:
          via:
            textgrid: "100"
    split:
      texts:
        between:
          twilio:
            and:
              textgrid: "true"
-----
Segue o `application.yaml` completo com a inclusão da configuração `initialPayment` (merchants e valor):

```yaml
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1
    validate-on-migrate: false
    clean-disabled: true
    schemas: public
    table: flyway_schema_history
    sql-migration-prefix: V
    sql-migration-separator: __
    sql-migration-suffixes: .sql

system:
  config:
    com:
      uownleasing:
        svc:
          initialPayment:
            merchantRefCodes: "KS15528,KS15694,KS17405,KS17898,KS17899"
            amount: "49"
          service:
            PlaidService:
              clientId: "6846ea5a7a4f700021ffba01"
              secret: "45844f28e148f618885e6f0dd8f566"
              webhook-host: "https://svc-sandbox.uownleasing.com"
              requirePhoneVerification: "true"
            ApprovalEmailService:
              check:
                approval:
                  email:
                    for:
                      duplicates: "false"
            PaymentReceiptService:
              send:
                ach:
                  payment:
                    receipt: "true"
                cc:
                  payment:
                    receipt: "true"
                payment:
                  decline:
                    sms: "false"
                first:
                  payment:
                    default:
                      sms: "false"
            TaxService:
              tax:
                rate:
                  for:
                    MY_EYE_MED:
                      GA: "0.0"
            UnderwritingService:
              skip:
                uw:
                  merchant:
                    clientType:
                      _360_FINANCE: "true"
              lambda:
                segment:
                  max: "8"
                  min: "1"
              set:
                uw:
                  sentilink:
                    data: "true"
                  neustar:
                    data: "true"
                  seon:
                    data: "true"
              use:
                taktile:
                  for:
                    decision: "false"
                gds:
                  for:
                    decision: "true"
              send:
                request:
                  to:
                    taktile: "false"
            SvAccountService:
              restrict:
                frequencies:
                  for:
                    sub:
                      prime: "false"
            LeadService:
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          SK00001-0001: "true"
                          5348120500488887: "true"
            LeadItemService:
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
            ScheduledTaskService:
              send:
                first:
                  payment:
                    reminder:
                      sms: "false"
                recurring:
                  payment:
                    reminder:
                      sms: "false"
                delinquency:
                  offer:
                    sms: "false"
                late:
                  payment:
                    notice:
                      sms: "false"
              delinquent:
                payments:
                  report:
                    to:
                      email: "fintechgroup777@gmail.com"
              generate:
                delinquent:
                  payments:
                    report: "true"
              reverse:
                ach:
                  payments:
                    sweep:
                      thread:
                        size: "1"
            EsignService:
              send:
                redirect:
                  url:
                    to:
                      esign:
                        client: "false"
              uown:
                esign:
                  mock:
                    response:
                      on:
                        test: "false"
              uown.esign.mock.response.on.test: "false"
            CCTransactionService:
              use:
                channel:
                  payments: "true"
              default:
                amount:
                  to:
                    authenticate: "1.01"
            BootstrapService:
              load:
                only:
                  new:
                    templates: "true"
                    sql: "true"
            CorrespondenceService:
              track:
                customer:
                  correspondence:
                    EMAIL: "false"
                    SMS: "false"
            IntellicheckService:
              sdk:
                uri: http://idn-server.intellicheck-dev.svc.cluster.local:80
            RunUWService:
              neustar:
                verified:
                  component:
                    for:
                      service:
                        tenure: "3,4,5,8"
                phone:
                  service:
                    tenure:
                      for:
                        verified:
                          component3: "1,-1,-2,-3,-4,-5,-6,-7"
                          component4: "1,-1,-2,-3,-4,-5,-6,-7"
                          component5: "1,-1,-2,-3,-4,-5,-6,-7"
                          component8: "1,2,3,4,5,6,7,-1,-2,-3,-4,-5,-6,-7"
              fraud:
                engine:
                  email:
                    check:
                      version: v2
                  phone:
                    check:
                      version: v1
                  ip:
                    check:
                      version: v1
            NeuroIdVerificationService:
              neuro:
                id:
                  siteid:
                    SEND_APP: "items340"
                    SUBMIT_APP: "depth355"
            SendApplicationService:
              check:
                duplicate:
                  info: "false"
                for:
                  previous:
                    signed: "true"
                previous:
                  leads:
                    for:
                      delinquency: "false"
              "deny.rate.for.blank.category": "-0.1"
              plaidMaxLambdaSegment: 650
              plaidMinLambdaSegment: -1
            IdVerificationService:
              verify:
                intellicheck:
                  id:
                    expired: "true"
                  first:
                    name: "false"
                  last:
                    name: "true"
                  date:
                    of:
                      birth: "true"
                seon:
                  document:
                    expired: "true"
                  full:
                    name: "true"
                  date:
                    of:
                      birth: "true"
            cc:
              CCSaleService:
                ccPeekOn : "true"
                ccPeekOnSameDayRequest : "true"
              CCPostRunUpdateService:
                  card:
                    error:
                      invalid: "restricted card,card is expired,card number error,closed account,hold card (lost),hold card (pick up card),hold card (stolen)"
            SmService:
              text:
                grid:
                  auth:
                    token:
                      test: "5C08EE4D5D7A4DA18D9BA627732C0263"
                  phone:
                    numbers: "+16465829473,+16263856892,+14695051760,+12153157135"
          uownclient:
            UownClient:
              do:
                not:
                  allow:
                    invoice:
                      increase:
                        for:
                          client:
                            SWEET_PAY: "true"
                  check:
                    cost:
                      and:
                        credit:
                          limit:
                            for:
                              client:
                                type:
                                  in:
                                    submitApplication: "WE_GET_FINANCING"
              items:
                can:
                  be:
                    empty:
                      for:
                        merchant:
                          MO1234-0001: "true"
                          _360_FINANCE: "true"
                          SK00001-0001: "true"
              set:
                program:
                  for:
                    sweetPay: "true"
              CC:
                lastname:
                  contain:
                    check: "true"
              sentilink:
                theft:
                  score:
                    threshold: "700"
                abuse:
                  score:
                    threshold: "650"
              bypass:
                uwengine: "true"
              check:
                duplicate:
                  cc: "false"
                  info: "false"
                old:
                  lead:
                    info:
                      for:
                        data:
                          match:
                            by:
                              merchants:
                                code: ""
                authorization:
                  request:
                    map: "false"

              offer:
                insurance:
                  in:
                    states: "AR, AZ, AK, AL, CO, CT, DE, DC, FL, GA, HI, IN, IL, IA, ID, KY, KS, LA, LA, MO, MI, MT, MN, MD, ME, MA, MS, NE, NY, NM, NH, ND, NC, NJ, NV, OR, OH, PA, RI, SD, SC, TX, TN, VT, VA, WA, WV, WY, WI, PR"
              max:
                hours:
                  link:
                    is:
                      valid: 360

          validator:
            LosRequestMessageConstraintValidator:
              check:
                programName:
                  by:
                    ClientType:
                      _360_FINANCE: "true"
              verify:
                address: "true"
              required:
                fields:
                  for:
                    _360_FINANCE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,programName,maxApprovalAmount,requestedLoanAmount"
                    PAY_POSSIBLE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SKEPS:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    SYNCHRONY:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    TIRE_BROS:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    LEND_PRO:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode"
                    KORNERSTONE:
                      "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,mainNextPayDate"
              validate:
                invoice:
                  numbers:
                    for:
                      merchant:
                        MO1234-0001: "false"
                        SK00001-0001: "false"
              enable:
                address:
                  format:
                    regex:
                      street1: "^(?i)[0-9]{1,7}\\s+[A-Za-z0-9#]+(?:\\s[A-Za-z0-9#]+)*(?:\\s(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor)\\s*#?\\s*[A-Za-z0-9]+)?$"
                      street2: "(?i)^(?:Apt|Apartment|Suite|Ste|Unit|Bldg|Building|Fl|Floor|#)\\s*#?\\s*[A-Za-z0-9]+$"

          migration:
            kornerstone:
              service:
                MigrationService:
                  single-thread-threshold: 50
                  min-batch-size: 20

          test: "config is working"
          config:
            svOutboundCall:
              connect:
                timeout: "120000"
            losOutboundCall:
              connect:
                timeout: "120000"
            CreditCardConfig:
              convenienceFee: "4"
    statuses:
      eligible:
        for:
          pending:
            uw:
              "DENIED,FRAUD_DENIED,DELINQUENCY_DENIED,BLACKLIST_DENIED,ACH_NOT_CLEARED,FPD_IN_FUTURE,DELINQUENT_ACCOUNT,ACCOUNT_UNDERPAID,ACCOUNT_STATUS_INELIGIBLE,SENTILINK_DENIED,NEUSTAR_DENIED"
    uw:
      airblackbox:
        url:
          "https://leadrouter.f3easervicing.com/service/application-finalize"
        new:
          url: "https://decision-engine-qa.uownfintech.com/service/application-finalize"
        use:
          old:
            url: "false"
        old:
          url:
            routing:
              threshold: "-1"

    percent:
      texts:
        sent:
          via:
            textgrid: "100"
    split:
      texts:
        between:
          twilio:
            and:
              textgrid: "true"
```
inserido
initialPayment:
            merchantRefCodes: "KS15528,KS15694,KS17405,KS17898,KS17899"
            amount: "49"
-----
criado aplicação para KS17405
-----
após o term of agreement, na assinatura do contrato, é exibido o 
initial payment e o valor de 49
![alt text](<Screenshot at Feb 12 03-28-13.png>)
-----
tornado o lease funding
consultado manualmente endpoint 
get https://svc-{{env}}.uownleasing.com/uown/getFundingQueueDetails/94370
resp:
{
    "fundingTransactionPk": 0,
    "leadPk": 94370,
    "leadStatus": "FUNDING",
    "fundDateTime": "2026-02-12T06:43:36.554151",
    "refundRequestDateTime": null,
    "refundedDateTime": null,
    "fundingRequestDateTime": "2026-02-12T06:48:28.00733",
    "fundDate": null,
    "refundRequestDate": null,
    "refundedDate": null,
    "fundingRequestDate": null,
    "customerName": "Michael Allen",
    "customerPhone": "(813) 304-0373",
    "customerEmail": "ramimiv101@desiys.com",
    "merchantName": "BDS Group Inc",
    "merchantLocationName": "BDS Group Inc",
    "merchantRefCode": "KS17405",
    "salesRepCode": "Barton Tanner",
    "merchantLegalName": "BDS Group Inc",
    "invoiceNumber": "R91931",
    "orderId": null,
    "salesPerson": "Paul",
    "routingNumber": "",
    "accountNumber": "",
    "twoDayFundingException": null,
    "fiveDayFundingException": null,
    "fundingQueueStatus": null,
    "status": "ACTIVE",
    "dealerRebate": 0.00,
    "dealerDiscount": 0.00,
    "platFormFee": 20.48,
    "totalCost": 1044.71,
    "totalContractAmount": 0.00,
    "taxAmount": 76.8172500,
    "fees": 40.00,
    "invoiceAmount": 1024.23,
    "amountToBeFunded": 975.23,
    "partialSettlement": false,
    "totalNumberOfItems": 2,
    "totalNumberofItemsDelivered": 0,
    "totalCount": 0,
    "ccProcessingFee": 0,
    "invoiceType": "LEASE",
    "fundingReportFrequency": null,
    "items": null,
    "userName": "SYSTEM",
    "userNotes": "",
    "merchandiseAmount": 812.93,
    "createdFrom": null
}
1. Valor financiado com desconto
invoiceAmount: 1024.23
Esperado: amountToBeFunded = invoiceAmount – 49 = 975.23 → o payload mostra 975.23, OK.
2. Tipo de fatura correto
invoiceType: LEASE → é onde a regra se aplica.
-----
Configurei o programa KW-16-2 com processing fee override em 1
programa é usado no merchant KS17405 que estou usando
-----
criei nova aplicacao
{
  "userName": "kornerstone",
  "setupPassword": "U0wn_Kornerstone_012c",
  "merchantNumber": "KS17405",

  "mainFirstName": "alice",
  "mainLastName": "hales",
  "mainSSN": "623278888",
  "mainCellPhone": "8133040373",
  "emailAddress": "ramimiv101@desiys.com",
  "mainAddress1": "208 n 22nd st",
  "mainCity": "Tampa",
  "mainStateOrProvince": "FL",
  "mainPostalCode": "33605",

  "mainNextPayDate": "02182026",
  "mainLastPayDate": "02112026",
  "mainDOB": "09011984",

  "mainEmployerName": "Best Buy",
  "mainPastBankruptcy": false,
  "mainCurrentOrFutureBankruptcy": false,
  "languagePreference": "E",
  "iovationFingerprintText": "fingerPrintText",
  "ipaddress": "192.168.0.2",
  "desiredPaymentFrequency": "WEEKLY",
  "mainAnnualIncome": 510000,
  "mainPayFrequency": "WEEKLY",
  "mainEmploymentDuration": "_1_TO_2_YEARS",
  "shipToSameAsConsumer": true,

  "merchandiseSubtotal": "808.7",
  "discountAmount": "0.00",
  "deliveryCharge": "57.00",
  "installationCharge": "107.00",
  "salesTax": "0",
  "miscellaneousFees": "47.30",
  "depositAmount": "0.00",
  "orderTotal": "1020.00",

  "invoiceNumber": "R91931",

  "lineItem": [
    {
      "lineItemLineNumber": "317",
      "lineItemSerialNumber": "S94712065",
      "lineItemProductNumber": "A561SKU283",
      "lineItemProductDescription": "Ottoman",
      "lineItemProductCategory": "Seating",
      "lineItemType": "D",
      "lineItemQuantityOrdered": "1",
      "lineItemUnitPrice": "531.44",
      "lineItemBasePrice": "499",
      "lineItemTaxAmount": "32.44",
      "lineItemExtendedPrice": "531.44"
    },
    {
      "lineItemLineNumber": "318",
      "lineItemSerialNumber": "M68484397",
      "lineItemProductNumber": "A333SKU4444",
      "lineItemProductDescription": "Recliner",
      "lineItemProductCategory": "Seating",
      "lineItemType": "D",
      "lineItemQuantityOrdered": "1",
      "lineItemUnitPrice": "332.93",
      "lineItemBasePrice": "309.70",
      "lineItemTaxAmount": "23.23",
      "lineItemExtendedPrice": "332.93"
    }
  ]
}

<ApplicationResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage>UW_APPROVED</transactionMessage>
    <accountNumber>5e7c13c9-99aa-4283-905b-2a863840c71b</accountNumber>
    <authorizationNumber>94373</authorizationNumber>
    <providerURL/>
    <merchantName>BDS Group Inc</merchantName>
    <customerFirstName>alice</customerFirstName>
    <customerLastName>hales</customerLastName>
    <orderTotal>1020.00</orderTotal>
    <purchaseNowTotal>0</purchaseNowTotal>
    <purchaseNowTotalWithTax>0.00</purchaseNowTotalWithTax>
    <externalReferenceId/>
    <invoiceItems>
        <invoiceItems>
            <lineItemId>118192</lineItemId>
            <lineItemLineNumber>317</lineItemLineNumber>
            <lineItemProductNumber>A561SKU283</lineItemProductNumber>
            <lineItemSerialNumber>S94712065</lineItemSerialNumber>
            <lineItemProductCategory>Seating</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>531.44</lineItemUnitPrice>
            <lineItemBasePrice>499</lineItemBasePrice>
            <lineItemTaxAmount>32.44</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>531.44</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus>ADDED_TO_CART</lineItemStatus>
            <lineitemProductDescription>Ottoman</lineitemProductDescription>
        </invoiceItems>
        <invoiceItems>
            <lineItemId>118193</lineItemId>
            <lineItemLineNumber>318</lineItemLineNumber>
            <lineItemProductNumber>A333SKU4444</lineItemProductNumber>
            <lineItemSerialNumber>M68484397</lineItemSerialNumber>
            <lineItemProductCategory>Seating</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>332.93</lineItemUnitPrice>
            <lineItemBasePrice>309.70</lineItemBasePrice>
            <lineItemTaxAmount>23.23</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>332.93</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus>ADDED_TO_CART</lineItemStatus>
            <lineitemProductDescription>Recliner</lineitemProductDescription>
        </invoiceItems>
    </invoiceItems>
    <transactionStatus>E0</transactionStatus>
    <appApprovalStatus>APPROVED</appApprovalStatus>
    <creditLimit>4180</creditLimit>
    <programType>LTO</programType>
    <locationName>BDS Group Inc</locationName>
    <lambdaScore/>
    <isPlaidRequired>false</isPlaidRequired>
    <paymentDetailsList>
        <paymentDetailsList>
            <redirectUrl>https://secure-sandbox.kornerstoneliving.com/Pbh1RsNe/complete?selectedPaymentFrequency=WEEKLY</redirectUrl>
            <totalContractAmountWithTax>0</totalContractAmountWithTax>
            <totalContractAmountNoTax>-153.03</totalContractAmountNoTax>
            <regularPaymentWithTax>31.79</regularPaymentWithTax>
            <numberOfPayments>69</numberOfPayments>
            <termInMonths>16</termInMonths>
            <frequency>WEEKLY</frequency>
            <firstPaymentWithFeesAndTax>32.79</firstPaymentWithFeesAndTax>
            <firstPaymentWithFeesNoTax>30.57</firstPaymentWithFeesNoTax>
            <firstPaymentDate>2026-02-18</firstPaymentDate>
            <paymentDueToday>1.00</paymentDueToday>
        </paymentDetailsList>
        <paymentDetailsList>
            <redirectUrl>https://secure-sandbox.kornerstoneliving.com/Pbh1RsNe/complete?selectedPaymentFrequency=BI_WEEKLY</redirectUrl>
            <totalContractAmountWithTax>0</totalContractAmountWithTax>
            <totalContractAmountNoTax>-153.01</totalContractAmountNoTax>
            <regularPaymentWithTax>62.66</regularPaymentWithTax>
            <numberOfPayments>35</numberOfPayments>
            <termInMonths>16</termInMonths>
            <frequency>BI_WEEKLY</frequency>
            <firstPaymentWithFeesAndTax>63.66</firstPaymentWithFeesAndTax>
            <firstPaymentWithFeesNoTax>59.29</firstPaymentWithFeesNoTax>
            <firstPaymentDate>2026-02-18</firstPaymentDate>
            <paymentDueToday>1.00</paymentDueToday>
        </paymentDetailsList>
        <paymentDetailsList>
            <redirectUrl>https://secure-sandbox.kornerstoneliving.com/Pbh1RsNe/complete?selectedPaymentFrequency=MONTHLY</redirectUrl>
            <totalContractAmountWithTax>0</totalContractAmountWithTax>
            <totalContractAmountNoTax>-153.00</totalContractAmountNoTax>
            <regularPaymentWithTax>137.06</regularPaymentWithTax>
            <numberOfPayments>16</numberOfPayments>
            <termInMonths>16</termInMonths>
            <frequency>MONTHLY</frequency>
            <firstPaymentWithFeesAndTax>138.06</firstPaymentWithFeesAndTax>
            <firstPaymentWithFeesNoTax>128.50</firstPaymentWithFeesNoTax>
            <firstPaymentDate>2026-02-18</firstPaymentDate>
            <paymentDueToday>1.00</paymentDueToday>
        </paymentDetailsList>
    </paymentDetailsList>
</ApplicationResponse>
-----
Informei dados pessoais e de cc, em :
authorizeCreditCard o valor de ccAuthReply é 1 como definido no processing fee override
{
    "leadPk": 94373,
    "ccNumber": "6011000993026909",
    "ccExp": "12/2028",
    "cvc": "996",
    "ccFirstName": "alice",
    "ccLastName": "hales",
    "kountSessionId": "5c06325a256e43c489af527fa5290e6e"
}
{
    "accountPk": null,
    "leadPk": 94373,
    "creditCardTransactionPk": 27810,
    "paymentPk": null,
    "originalCCPk": null,
    "postingDate": "2026-02-12",
    "numberOfTries": 0,
    "rerunStatus": "SKIPPED",
    "rerunNsfStatus": "SKIPPED",
    "amount": 1,
    "originalAmount": 1,
    "remainingRefundableAmount": null,
    "chargedFeeAmount": null,
    "authCode": "54f68947-22d0-4c4f-ae72-92ce33b2b333",
    "ipAddress": null,
    "vendor": "CHANNEL_PAYMENTS_CC",
    "ccAction": "AUTHENTICATION",
    "ccTransactionType": "OTHER",
    "gatewayRequest": "{\n   \"merchantID\":\"uown\",\n    \"merchantPassword\":\"uownv2#\",\n    \"source\" : \"UOWN\",\n    \"gatewayName\": \"CHANNEL_PAYMENTS_CC\",\n\"purchaseTotals\" : {\"grandTotalAmount\":\"1.00\",\"currency\":\"USD\"},\n\t\"card\" : {\n         \"cardHolderName\":\"alice hales\", \n         \"accountNumber\":\"6011000993026909\", \n         \"expirationMonth\":\"12\",\n         \"expirationYear\":\"2028\", \n         \"cvNumber\":\"996\", \n         \"creditCardToken\":\"null\"\n         },\n    \"accountPK\": null,\n\"leadPK\": 94372,\n\"ccAuthService\":{\"run\":\"true\", \"store\":\"true\"},\n    \"authToken\":null\n}\n",
    "gatewayResponse": "{\"requestID\":\"2083ffd2-0c23-49be-a510-8a8353c42c1d_-6523944122253467648\",\"decision\":\"ACCEPT\",\"idempotencyKey\":\"6710be02-2028-46b2-ac78-dbff5a0bad17\",\"purchaseTotals\":{},\"ccAuthReply\":{\"amount\":\"1.00\",\"authorizationCode\":\"A: Approved\",\"avsCode\":\"match\",\"cvCode\":\"unavailable\",\"authorizedDateTime\":\"2026-02-12T12:43:21.416\",\"transactionToken\":\"d002c8e9-09e4-417c-9476-4a1762e61b53\"},\"ccTokenResponse\":{\"token\":\"54f68947-22d0-4c4f-ae72-92ce33b2b333\",\"cardTypeEnum\":\"DISCOVER\"}}",
    "gatewayTransactionId": "2083ffd2-0c23-49be-a510-8a8353c42c1d_-6523944122253467648",
    "gatewayAuthToken": null,
    "completedTime": "2026-02-12T07:43:22.064696",
    "saveOnSuccessOnly": true,
    "errorCode": null,
    "error": null,
    "errorStacktrace": null,
    "useCardOnFile": false,
    "status": "APPROVED",
    "isNsf": false,
    "ccInfo": {
        "leadPk": 94373,
        "accountPk": null,
        "kountPk": null,
        "creditCardPk": 13936,
        "ccFirstName": "alice",
        "ccLastName": "hales",
        "ccNumber": "************6909",
        "ccExp": "12/2028",
        "ccType": null,
        "cvc": null,
        "ccToken": "54f68947-22d0-4c4f-ae72-92ce33b2b333",
        "autoPay": true,
        "isDeleted": false,
        "errorMsg": null,
        "kountSessionId": "216ebff187ab4fb694602f0a442d9c00",
        "ccVendor": "CHANNEL_PAYMENTS_CC",
        "preAuthStatus": "SUCCESS",
        "ccHash": 443047858,
        "ccConnectorToken": null,
        "isValidCard": true,
        "invalidCardReason": null,
        "ccAddress": null,
        "expired": false
    },
    "comment": null,
    "allocationStrategy": "DEFAULT",
    "isCustomRefund": false,
    "accountPkk": null,
    "amountt": null,
    "postingDatee": null,
    "agentUsername": "MerchantPortal",
    "id": null,
    "chargeType": null,
    "idempotencyKey": "6710be02-2028-46b2-ac78-dbff5a0bad17",
    "chargeFee": false,
    "sameDayTransaction": true,
    "ccPeek": false,
    "isSettlementPayment": false
}
----

---------------------------------------------------------------------------------------------------------------------------------------------------------
Cenários de teste (Gherkin) em português:

1. ```
   Cenario: Pagamento Inicial exibido para merchant BDS elegível
     Dado um lead com código de merchant em ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     E a aplicação está completa até a etapa de assinatura
     Quando o documento de locação é gerado
     Então o contrato exibe um item de linha "Pagamento Inicial" com valor $49
     E nenhuma cobrança adicional é aplicada ao consumidor para esse item
   ```

2. ```
   Cenario: Pagamento Inicial não exibido para merchant não BDS
     Dado um lead com código de merchant fora da lista ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     E a aplicação está completa até a etapa de assinatura
     Quando o documento de locação é gerado
     Então o contrato não exibe o item de linha "Pagamento Inicial"
   ```

3. ```
   Cenario: Valor a ser financiado reduzido em $49 para merchant BDS
     Dado um lead com código de merchant em ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     E o invoiceAmount está registrado para a locação
     Quando getFundingQueueDetails é consultado para esse lead
     Então amountToBeFunded é igual a invoiceAmount menos $49
   ```

4. ```
   Cenario: Valor a ser financiado inalterado para merchant não BDS
     Dado um lead com código de merchant fora da lista ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     E o invoiceAmount está registrado para a locação
     Quando getFundingQueueDetails é consultado para esse lead
     Então amountToBeFunded é igual a invoiceAmount (sem redução de $49)
   ```

5. ```
   Cenario: Autenticação de cartão em $1 para merchant BDS
     Dado um lead com código de merchant em ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     E um programa atribuído com processing fee override configurado para $1
     Quando o cartão é enviado para validação (authorizeCreditCard)
     Então o valor de autenticação enviado ao gateway é $1.00
     E a transação é aprovada
   ```

6. ```
   Cenario: Autenticação de cartão com valor padrão para merchant não BDS
     Dado um lead com código de merchant fora da lista ["KS15528","KS15694","KS17405","KS17898","KS17899"]
     Quando o cartão é enviado para validação (authorizeCreditCard)
     Então o valor de autenticação enviado ao gateway usa o valor padrão configurado (por exemplo, $1.01)
   ```

7. ```
   Cenario: Lista de merchants elegíveis vem da configuração
     Dado que as chaves com.uownleasing.svc.initialPayment.merchantRefCodes e com.uownleasing.svc.initialPayment.amount estão definidas
     Quando o serviço avalia a elegibilidade do merchant
     Então apenas os códigos presentes na lista configurada são tratados como elegíveis
     E o valor do Pagamento Inicial utilizado corresponde ao valor configurado
   ```

9. ```
   Cenario: Merchant não BDS não sofre override de $1 se configurado incorretamente
     Dado um lead com código de merchant fora da lista BDS
     E um programa sem override de $1 está aplicado
     Quando o cartão é enviado para validação
     Então o valor de autenticação segue o valor padrão configurado (não força $1)
   ```

10. ```
    Cenario: Pagamento Inicial não altera o primeiro pagamento cobrado do consumidor
      Dado um lead elegível BDS com "Pagamento Inicial" exibido no contrato
      Quando o cronograma do primeiro pagamento é calculado
      Então o firstPaymentAmount / paymentDueToday cobrado do consumidor não inclui o valor de $49 (apenas exibição)
    AccountPk 16676 and 16677
    ```

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in sandbox

---

### Scenario 1: Initial Payment displayed for eligible BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the application is completed up to the signing step
- When the lease document is generated
- Then the contract shows a line item "Initial Payment" with amount $49
- And no additional charge is applied to the consumer for this item

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94370  |
```

Screeshot

**PASS**

---

### Scenario 2: Initial Payment not displayed for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the application is completed up to the signing step
- When the lease document is generated
- Then the contract does not show the "Initial Payment" line item

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94376  |
```

Screeshot

**PASS**

---

### Scenario 3: Amount to be funded reduced by $49 for BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the invoiceAmount is recorded for the lease
- When getFundingQueueDetails is retrieved for that lead
- Then amountToBeFunded equals invoiceAmount minus $49

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94370  |
```

Screeshot

**PASS**

---

### Scenario 4: Amount to be funded unchanged for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the invoiceAmount is recorded for the lease
- When getFundingQueueDetails is retrieved for that lead
- Then amountToBeFunded equals invoiceAmount (no $49 reduction)

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94376  |
```

Screeshot

**PASS**

---

### Scenario 5: Card authentication at $1 for BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And a program assigned with processing fee override set to $1
- When the credit card is submitted for validation (authorizeCreditCard)
- Then the authentication amount sent to the gateway is $1.00
- And the transaction is approved



```

Screeshot

**PASS**

---

### Scenario 6: Card authentication uses default amount for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- When the credit card is submitted for validation (authorizeCreditCard)
- Then the authentication amount sent to the gateway uses the configured default (e.g., $1.01)



```

Screeshot

**PASS**

---

### Scenario 7: Eligible merchant list comes from configuration
```markdown
- Given the config keys com.uownleasing.svc.initialPayment.merchantRefCodes and com.uownleasing.svc.initialPayment.amount are set
- When the service evaluates merchant eligibility
- Then only codes in the configured list are treated as eligible
- And the Initial Payment amount used matches the configured value
```


Screeshot

**PASS**

---

### Scenario 8: Non-BDS merchant does not get forced $1 override
```markdown
- Given a lead with merchant ref code outside the BDS list
- And a program without $1 override is applied
- When the credit card is submitted for validation
- Then the authentication amount follows the configured default (not forced to $1)



```

Screeshot

**PASS**

---

### Scenario 9: Initial Payment does not change the first payment charged to the consumer
```markdown
- Given an eligible BDS lead with "Initial Payment" displayed on the contract
- When the first payment schedule is calculated
- Then the firstPaymentAmount / paymentDueToday charged to the consumer does not include the $49 (display-only)

Examples:
| MerchantRefCode | AccountPk |
|-----------------|-----------|
| KS17405         | 16676 and 16677 |
```

Screeshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------




## Tests in stg

---
### Scenario 1: Initial Payment displayed for eligible BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the application is completed up to the signing step
- When the lease document is generated
- Then the contract shows a line item "Initial Payment" with amount $49
- And no additional charge is applied to the consumer for this item

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 6558738  |
```



**PASS**

---
### Scenario 2: Initial Payment not displayed for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the application is completed up to the signing step
- When the lease document is generated
- Then the contract does not show the "Initial Payment" line item

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 6558752  |
```



**PASS**

---
### Scenario 3: Amount to be funded reduced by $49 for BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the invoiceAmount is recorded for the lease
- When getFundingQueueDetails is retrieved for that lead
- Then amountToBeFunded equals invoiceAmount minus $49

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94370  |
```



**PASS**

---
### Scenario 4: Amount to be funded unchanged for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And the invoiceAmount is recorded for the lease
- When getFundingQueueDetails is retrieved for that lead
- Then amountToBeFunded equals invoiceAmount (no $49 reduction)

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94376  |
```



**PASS**

---
### Scenario 5: Card authentication at $1 for BDS merchant
```markdown
- Given a lead with merchant ref code in ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- And a program assigned with processing fee override set to $1
- When the credit card is submitted for validation (authorizeCreditCard)
- Then the authentication amount sent to the gateway is $1.00
- And the transaction is approved
```



**PASS**


---

### Scenario 6: Card authentication uses default amount for non-BDS merchant
```markdown
- Given a lead with merchant ref code outside ["KS15528","KS15694","KS17405","KS17898","KS17899"]
- When the credit card is submitted for validation (authorizeCreditCard)
- Then the authentication amount sent to the gateway uses the configured default (e.g., $1.01)
```



**PASS**

---

### Scenario 7: Eligible merchant list comes from configuration
```markdown
- Given the config keys com.uownleasing.svc.initialPayment.merchantRefCodes and com.uownleasing.svc.initialPayment.amount are set
- When the service evaluates merchant eligibility
- Then only codes in the configured list are treated as eligible
- And the Initial Payment amount used matches the configured value

Examples:
| MerchantRefCode | LeadPk |
|-----------------|--------|
| KS17405         | 94408  |
```



**PASS**

---
### Scenario 9: Initial Payment does not change the first payment charged to the consumer
```markdown
- Given an eligible BDS lead with "Initial Payment" displayed on the contract
- When the first payment schedule is calculated
- Then the firstPaymentAmount / paymentDueToday charged to the consumer does not include the $49 (display-only)

Examples:
| MerchantRefCode | AccountPk |
|-----------------|-----------|
| KS17405         | 16676 and 16677 |
```

**PASS**

---