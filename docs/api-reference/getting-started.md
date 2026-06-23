> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting Started

Welcome and thank you for choosing Uown Leasing TMS Service API! We're excited to have you on board and look forward to supporting you on your integration journey. If you have any questions or need assistance, don't hesitate to reach out to our dedicated support team.

# Introduction

Welcome to the **Uown Leasing Service API**. This RESTful API provides comprehensive services for telephony management, authentication, and core business operations.

This API enables you to:

* Manage telephony operations and account summaries
* Handle payment arrangements and transactions
* Authenticate and manage API access

***

# Requesting Access

To access the Uown Leasing Service API production environment, please reach out to our sales team for assistance in creating your account and granting access to our platform. They will guide you through the necessary steps to get you started.

Here is what our sales team will assist you with:

* **Account Creation**: Our sales team will create your Uown Leasing Service API account and instance
* **Granting Admin Access**: You can provide our sales team with the details of users who require admin access to the API platform. Our team will ensure that the necessary access privileges are granted to these specified users
* **API Credentials Setup**: Our team will assist in configuring your API credentials and setting up the appropriate access levels for your integration needs

Once you have been granted admin access and the necessary setup has been completed by our sales team, follow these steps to use your Uown Leasing Service API account:

1. **Access the API Platform**: Log into the API platform using the credentials provided by our sales team
2. **Generate API Credentials**: Follow the Authentication instructions below to generate the necessary credentials to access the API
3. **Start Using the API**: Use the interactive API Explorer or install an SDK and start making requests to the API

<br />

## Requesting Access to Sandbox Environment

Before diving into the production environment, we recommend requesting access to our sandbox environment. The sandbox environment allows you to test and experiment with the Uown Leasing Service API functionality without processing real transactions. This helps you familiarize yourself with the platform and ensures a smooth integration when you're ready for production.

To request access to the sandbox environment, please reach out to our sales team, and they will assist you in setting up a sandbox account and providing the necessary credentials.

## Choosing Your Environment

The Uown Leasing Service API is available in multiple environments. Select the appropriate environment from the server dropdown in the API Explorer:

<br />

### 🧪 Sandbox Server

**URL:** `svc-sandbox.uownleasing.com`

The sandbox environment is **recommended for initial testing and integration**. This environment allows you to:

* Test API functionality without affecting production data
* Experiment with different endpoints and workflows
* Validate your integration before moving to production

> **💡 Tip**: Start with the Sandbox environment to test your integration before moving to production.

***

### 🚀 Production Server

**URL:** `svc-prod.uownleasing.com`

Live production environment. **Use only after thorough testing** in sandbox and development environments.

***

# Connecting to the API

To connect to our API, you'll need to generate your API credentials through the authentication endpoint. Once you have your API credentials, refer to the Authentication section below for instructions on authorization.

## Authentication

All API requests require authentication using an API key. Follow these steps to authenticate:

### Step 1: Obtain an API Key

Call the `POST /uown/auth/authorize` endpoint with your credentials. The endpoint will return your API key along with expiration information.

**Example Request:**

```json
POST /uown/auth/authorize HTTP/1.1
Host: svc-sandbox.uownleasing.com
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

**Example Response:**

```json
{ 
  "apiKey": "your-api-key-here",
  expires": "2026-02-11T12:00:00" 
}
```

***

### Step 2: Include the API Key in Requests

Add the API key to the Authorization header of all subsequent requests.

**Format:** `Authorization: <your-api-key>`

**Example:**

```json
GET /uown/tms/getAccountSummary/{accountPk}   
HTTP/1.1Host: svc-sandbox.uownleasing.com  
Authorization: your-api-key-here`
```

***

### Step 3: Make Your First Request

You're all set! 🎉 Start making requests to the Uown Leasing Service API. Use the interactive API Explorer below to test endpoints directly, or integrate the API into your application using the code samples provided.

***

# Error Handling

### Guide to Error Handling

The TMS Service API returns appropriate HTTP status codes to indicate the success or failure of a request. In case of an error, the response body will contain additional details about the error. The following HTTP status codes are commonly used:

### Error Responses

#### 400 Bad Request

The server could not understand the request due to invalid syntax or missing required parameters. The response body may provide more details about the specific error.

Example response:

```json
{
  "timestamp": "2023-05-11T05:06:36.838Z",
  "statusCode": 400,
  "error": "Bad Request",
  "message": "The provided parameters are invalid.",
  "path": "uown/los/payments"
}

```

#### 401 Unauthorized

The request requires user authentication. The provided credentials are either missing or invalid.

Example response:

```json
{
  "timestamp": "2023-05-11T05:06:36.838Z",
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authentication failed. Please check your credentials.",
  "path": "uown/los/payments"
}

```

#### 403 Forbidden

The server understood the request but refuses to authorize it. The user does not have sufficient permissions to access the requested resource.

Example response:

```json
{
  "timestamp": "2023-05-11T05:06:36.838Z",
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You don't have permission to access this resource.",
  "path": "uown/los/payments"
}

```

#### 404 Not Found

The requested resource could not be found on the server.

Example response:

```json
{
  "timestamp": "2023-05-11T05:06:36.838Z",
  "statusCode": 404,
  "error": "Not Found",
  "message": "The requested resource does not exist.",
  "path": "uown/los/payments"
}

```

#### 500 Internal Server Error

An unexpected error occurred on the server. The error may not be directly caused by the client's request.

Example response:

```json
{
  "timestamp": "2023-05-11T05:06:36.838Z",
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Request processing failed; exception: lorem ipsum...",
  "path": "uown/los/payments"
}

```

***

<br />

# Common TMS Terminology

To help you understand key concepts related to the Telephony Management System (TMS) API, here are common TMS terminologies explained:

## Account

An account represents a customer's financial relationship with a merchant. It contains all relevant information about the customer, payment history, outstanding balances, and account status. Each account is uniquely identified by an account primary key (accountPk).

## Account Summary

An account summary provides a comprehensive overview of an account's current state, including customer information, account status, balances, payment due dates, and other relevant financial details. It serves as a snapshot of the account at a specific point in time.

## Account Status

Account status indicates the current state of an account within the system. Common statuses include active, inactive, closed, or various collection states. The status determines what actions can be performed on the account and how it should be managed.

## Receivable

A receivable represents an individual payment obligation or installment that a customer owes. Each receivable has a due date and an amount. Multiple receivables make up the total contract balance for an account.

## Due Date

The due date is the date by which a payment is expected to be received. It determines when a receivable becomes past due if payment is not received. Due dates can be adjusted forward or backward to accommodate payment arrangements or schedule changes.

## Payment Arrangement

A payment arrangement is a structured plan for processing multiple payments over time. It allows for scheduling multiple transactions, such as credit card payments, to be processed according to a predefined schedule, helping customers manage their payment obligations.

## Contract Balance

The contract balance represents the total outstanding amount owed on an account. It includes all unpaid receivables and reflects the remaining debt that the customer is obligated to pay according to the terms of their contract.

## Past Due Amount

The past due amount is the total sum of payments that are overdue, meaning their due dates have passed without payment being received. This amount helps identify accounts that require immediate attention or collection efforts.

## Days Past Due

Days past due indicates the number of days that have elapsed since the first payment became overdue. It is calculated from the earliest unpaid due date and provides a measure of how delinquent an account has become.

## Payoff Amount

The payoff amount is the total sum required to fully satisfy all outstanding obligations on an account, effectively closing the account. It includes all remaining receivables, fees, and any other charges that must be paid to complete the contract.

## Early Payoff (EPO) Balance

The early payoff balance represents the amount required to pay off an account before its scheduled completion date. This balance may differ from the contract balance if there are early payoff incentives, discounts, or fee adjustments applied.

## Credit Card

A credit card represents a tokenized payment method stored securely in the system. Tokenization replaces sensitive card information with a secure token, allowing payments to be processed without exposing actual card details. Cards can be configured for one-time or recurring payments.

## Bank Account

A bank account represents a customer's checking or savings account information stored securely for processing ACH (Automated Clearing House) payments. Bank accounts are used for direct debit transactions and must be verified before use.

## ACH Payment

An ACH (Automated Clearing House) payment is an electronic bank-to-bank transfer that allows funds to be withdrawn directly from a customer's bank account. ACH payments are typically used for recurring payments and offer lower processing fees compared to credit card transactions.

## Credit Card Payment

A credit card payment is a transaction processed using a tokenized credit card. The payment is authorized and captured through the payment gateway, transferring funds from the customer's credit card to the merchant account.

## Autopay

Autopay refers to an automated payment configuration where a credit card or bank account is set up to automatically process payments on scheduled due dates. This feature helps ensure timely payments and reduces manual payment processing.

## Tokenization

Tokenization is a security process that replaces sensitive payment information, such as credit card numbers or bank account details, with unique identification tokens. These tokens are used for transaction processing and storage, significantly reducing the risk of exposing sensitive financial data while maintaining the ability to process payments.

## Activity Log

An activity log is a record of actions, events, or notes associated with an account. It provides an audit trail of customer interactions, payment attempts, account modifications, and other significant activities that help track the account's history and support customer service efforts.

## Rating Letter

A rating letter is a classification assigned to an account based on its payment behavior and risk assessment. It helps categorize accounts for collection strategies, risk management, and operational decision-making.

## Merchant

A merchant is a business entity that offers products or services to customers and uses the TMS platform to manage customer accounts and process payments. Each account is associated with a specific merchant.

## Merchant Location

A merchant location represents a specific physical or virtual location where a merchant conducts business. An account may be associated with a particular location, allowing for location-specific reporting and management.

## Next Payment Due Amount

The next payment due amount is the amount required for the next scheduled payment on an account. It represents the immediate payment obligation that the customer needs to fulfill to keep the account current.

## Next Due Date

The next due date is the date of the upcoming payment that is due. It indicates when the next payment should be received to maintain the account in good standing.

## Number of Payments Made

The number of payments made represents the count of successful payments that have been processed for an account. This metric helps track payment history and customer engagement.

## Number of Payments Left

The number of payments left indicates how many scheduled payments remain before the account is fully paid off. This helps customers understand their remaining payment obligations.

## Debt Type

Debt type categorizes the nature of the financial obligation, such as lease, loan, or other financing arrangements. It helps classify accounts for reporting, compliance, and operational purposes.

## Internal Account Score

The internal account score is a proprietary risk assessment metric calculated based on various factors such as payment history, account age, and customer behavior. It helps evaluate account health and prioritize collection efforts.

## Schedule Shift

A schedule shift is an adjustment made to receivable due dates, moving them forward or backward by a specified number of days. This allows for accommodating payment arrangements, holidays, or other scheduling needs without changing the total amount owed.