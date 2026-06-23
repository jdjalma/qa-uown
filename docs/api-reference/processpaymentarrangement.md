> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Payment Arrangement

Executes payment transactions (ACH and/or credit card) for a payment arrangement

# OpenAPI definition

```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "Uown TMS Service API",
    "description": "# Uown TMS Service API\n\nREST API for telephony management: account summaries, payments, due dates, and activity logs.\n\n## Authentication\n\nSend your API key in the `Authorization` header on every request. Contact your Uown integration contact for credentials and key provisioning.\n\n## Environments\n\nUse the server dropdown: **Sandbox** for testing, **Production** for live traffic.\n",
    "version": "v1"
  },
  "servers": [
    {
      "url": "https://svc-sandbox.uownleasing.com",
      "description": "Sandbox Server - Testing and integration environment for partners"
    },
    {
      "url": "https://svc-prod.uownleasing.com",
      "description": "Production Server - Live production environment"
    }
  ],
  "security": [
    {
      "apiKeyAuth": []
    }
  ],
  "tags": [
    {
      "name": "UOWN TMS SERVICE API",
      "description": "Telephony Management System API - Account, payment, due date and activity operations"
    }
  ],
  "paths": {
    "/uown/tms/v1/accounts/{accountId}/paymentArrangements": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Payment Arrangement",
        "description": "Executes payment transactions (ACH and/or credit card) for a payment arrangement",
        "operationId": "processPaymentArrangement",
        "parameters": [
          {
            "name": "accountId",
            "in": "path",
            "description": "Account ID",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PaymentArrangementDto"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PaymentArrangementResponse"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "403": {
            "description": "Forbidden",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "429": {
            "description": "Rate limit exceeded",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            "description": "Internal Server Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "timestamp": {
            "type": "string",
            "format": "date-time"
          },
          "status": {
            "type": "integer",
            "format": "int32"
          },
          "error": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "path": {
            "type": "string"
          }
        },
        "description": "Standardized error response following REST best practices"
      },
      "CCTransactionResult": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "FUTURE_PENDING",
              "APPROVED",
              "DENIED",
              "ERROR",
              "REFUNDED",
              "CANCELLED",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "PARTIALLY_REFUNDED",
              "SKIPPED",
              "REUSED"
            ]
          },
          "error": {
            "type": "string"
          },
          "amount": {
            "type": "number"
          },
          "postingDate": {
            "type": "string",
            "format": "date"
          },
          "creditCardTransactionPk": {
            "type": "integer",
            "format": "int64"
          },
          "gatewayTransactionId": {
            "type": "string"
          },
          "ccNumber": {
            "type": "string"
          }
        }
      },
      "AchPaymentResponse": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "SENT",
              "ACK_ERROR",
              "ERROR_SENDING",
              "ERROR",
              "CANCELLED",
              "COMPLETED",
              "ACK_RECEIVED",
              "INACTIVE",
              "RETURNED",
              "REVERSED",
              "SETTLED",
              "CORRECTION",
              "REJECTED",
              "BLOCKED",
              "REFUNDED",
              "PENDING_TO_RERUN",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "STATUS_UPDATE_PENDING",
              "PARTIALLY_REFUNDED",
              "BLOCKED_ACCOUNT",
              "SKIPPED",
              "SETTLED_IN_RERUN",
              "ACCOUNT_VALIDATION_ERROR"
            ]
          },
          "amount": {
            "type": "number"
          },
          "postingDate": {
            "type": "string",
            "format": "date"
          },
          "customerFirstName": {
            "type": "string"
          },
          "customerLastName": {
            "type": "string"
          },
          "bankAccountType": {
            "type": "string",
            "enum": [
              "CHECKING",
              "SAVINGS"
            ]
          },
          "achProcessType": {
            "type": "string",
            "enum": [
              "SCHEDULED",
              "RERUN",
              "RERUN_NSF",
              "REQUEST",
              "REFUND"
            ]
          },
          "returnCode": {
            "type": "string"
          },
          "returnCodeDescription": {
            "type": "string"
          },
          "settlementId": {
            "type": "string"
          },
          "settlementTimestamp": {
            "type": "string",
            "format": "date-time"
          },
          "maskedAccountNumber": {
            "type": "string"
          },
          "maskedRoutingNumber": {
            "type": "string"
          }
        }
      },
      "ACHPayment": {
        "type": "object",
        "properties": {
          "pk": {
            "type": "integer",
            "format": "int64"
          },
          "accountPk": {
            "minimum": 1,
            "type": "integer",
            "format": "int64"
          },
          "uuid": {
            "type": "string"
          },
          "customerFirstName": {
            "type": "string"
          },
          "customerLastName": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "SENT",
              "ACK_ERROR",
              "ERROR_SENDING",
              "ERROR",
              "CANCELLED",
              "COMPLETED",
              "ACK_RECEIVED",
              "INACTIVE",
              "RETURNED",
              "REVERSED",
              "SETTLED",
              "CORRECTION",
              "REJECTED",
              "BLOCKED",
              "REFUNDED",
              "PENDING_TO_RERUN",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "STATUS_UPDATE_PENDING",
              "PARTIALLY_REFUNDED",
              "BLOCKED_ACCOUNT",
              "SKIPPED",
              "SETTLED_IN_RERUN",
              "ACCOUNT_VALIDATION_ERROR"
            ]
          },
          "vendorACHStatus": {
            "type": "string"
          },
          "sentTimestamp": {
            "type": "string",
            "format": "date-time"
          },
          "sentToVendor": {
            "type": "string",
            "enum": [
              "PROFITUITY"
            ]
          },
          "returnOrSettleResponse": {
            "type": "string"
          },
          "returnDateTimestamp": {
            "type": "string",
            "format": "date-time"
          },
          "returnDate": {
            "type": "string",
            "format": "date"
          },
          "returnCode": {
            "type": "string"
          },
          "returnCodeDescription": {
            "type": "string"
          },
          "sendPaymentReminder": {
            "type": "boolean"
          },
          "settlementId": {
            "type": "string"
          },
          "settlementTimestamp": {
            "type": "string",
            "format": "date-time"
          },
          "useBankDataOnFile": {
            "type": "boolean"
          },
          "bankData": {
            "$ref": "#/components/schemas/BankData"
          },
          "bankAccountType": {
            "type": "string",
            "enum": [
              "CHECKING",
              "SAVINGS"
            ]
          },
          "errorDesc": {
            "type": "string"
          },
          "achProcessType": {
            "type": "string",
            "enum": [
              "SCHEDULED",
              "RERUN",
              "RERUN_NSF",
              "REQUEST",
              "REFUND"
            ]
          },
          "paymentPK": {
            "type": "integer",
            "format": "int64"
          },
          "amount": {
            "type": "number"
          },
          "postingDate": {
            "type": "string",
            "format": "date"
          },
          "username": {
            "type": "string"
          },
          "comments": {
            "type": "string"
          },
          "paymentFileName": {
            "type": "string"
          },
          "rowNumber": {
            "type": "integer",
            "format": "int32"
          },
          "entryClass": {
            "type": "string",
            "enum": [
              "PPD",
              "CCD",
              "WEB",
              "TEL"
            ]
          },
          "numberOfTries": {
            "type": "integer",
            "format": "int32"
          },
          "achType": {
            "type": "string",
            "enum": [
              "ACHDebit",
              "ACHCredit"
            ]
          },
          "paymentFileId": {
            "type": "integer",
            "format": "int32"
          },
          "paymentArrangementPk": {
            "type": "integer",
            "format": "int64"
          },
          "accountNum": {
            "type": "string"
          },
          "routingNum": {
            "type": "string"
          },
          "bankNamee": {
            "type": "string"
          },
          "isAutoPay": {
            "type": "boolean"
          },
          "allocationStrategy": {
            "type": "string",
            "enum": [
              "DEFAULT",
              "REGULAR_RECEIVABLES",
              "EPO_ONLY"
            ]
          },
          "vendorSettlementTimestamp": {
            "type": "string"
          },
          "dateOfRepresentment": {
            "type": "string",
            "format": "date"
          },
          "originalACHPk": {
            "type": "integer",
            "format": "int64"
          },
          "originalAchPostingDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "AddressInfo": {
        "required": [
          "city",
          "state",
          "streetAddress1",
          "zipCode",
          "zipCode9"
        ],
        "type": "object",
        "properties": {
          "addressPk": {
            "type": "integer",
            "format": "int64"
          },
          "customerPk": {
            "minimum": 1,
            "type": "integer",
            "format": "int64"
          },
          "addressType": {
            "type": "string",
            "enum": [
              "MAILING",
              "HOME"
            ]
          },
          "streetAddress1": {
            "type": "string"
          },
          "streetAddress2": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "zipCode": {
            "type": "string"
          },
          "zipCode9": {
            "type": "string"
          },
          "country": {
            "type": "string"
          },
          "doNotContact": {
            "type": "boolean"
          },
          "duration": {
            "type": "string",
            "enum": [
              "LESS_THAN_30_DAYS",
              "LESS_THAN_6_MONTHS",
              "_1_TO_3_MONTHS",
              "_3_TO_12_MONTHS",
              "_6_TO_12_MONTHS",
              "_1_TO_2_YEARS",
              "OVER_1_YEAR",
              "_2_YEARS_OR_MORE",
              "UNKNOWN"
            ]
          },
          "atAddressFrom": {
            "type": "string"
          },
          "housingStatus": {
            "type": "string",
            "enum": [
              "OWN_OR_BUY",
              "RENT",
              "PARENTS_OR_RELATIVE",
              "OTHER"
            ]
          },
          "isAutocompleteVerified": {
            "type": "boolean"
          }
        }
      },
      "BankData": {
        "required": [
          "accountNumber",
          "bankName",
          "routingNumber"
        ],
        "type": "object",
        "properties": {
          "accountNumber": {
            "type": "string"
          },
          "routingNumber": {
            "type": "string"
          },
          "bankName": {
            "type": "string"
          },
          "isAutoPay": {
            "type": "boolean"
          },
          "bankAccountPk": {
            "type": "integer",
            "format": "int64"
          },
          "bankAccountType": {
            "type": "string",
            "enum": [
              "CHECKING",
              "SAVINGS"
            ]
          },
          "customerFirstName": {
            "type": "string"
          },
          "customerLastName": {
            "type": "string"
          }
        }
      },
      "CCInfo": {
        "type": "object",
        "properties": {
          "leadPk": {
            "type": "integer",
            "format": "int64"
          },
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "kountPk": {
            "type": "integer",
            "format": "int64"
          },
          "creditCardPk": {
            "type": "integer",
            "format": "int64"
          },
          "ccFirstName": {
            "type": "string"
          },
          "ccLastName": {
            "type": "string"
          },
          "ccNumber": {
            "type": "string"
          },
          "ccExp": {
            "type": "string"
          },
          "ccType": {
            "type": "string",
            "enum": [
              "AMEX",
              "VISA",
              "DISCOVER",
              "MASTERCARD",
              "OTHER"
            ]
          },
          "cvc": {
            "type": "string"
          },
          "ccToken": {
            "type": "string"
          },
          "autoPay": {
            "type": "boolean"
          },
          "isDeleted": {
            "type": "boolean"
          },
          "errorMsg": {
            "type": "string"
          },
          "kountSessionId": {
            "type": "string"
          },
          "ccVendor": {
            "type": "string",
            "enum": [
              "USAEPAY",
              "CHANNEL_PAYMENTS_CC",
              "OMNIFUND",
              "OTHER"
            ]
          },
          "preAuthStatus": {
            "type": "string",
            "enum": [
              "SESSION_UNAVAILABLE",
              "SUCCESS",
              "DENIED",
              "ERROR",
              "NOT_RUN"
            ]
          },
          "ccHash": {
            "type": "integer",
            "format": "int32"
          },
          "ccConnectorToken": {
            "type": "string"
          },
          "isValidCard": {
            "type": "boolean"
          },
          "invalidCardReason": {
            "type": "string"
          },
          "ccAddress": {
            "$ref": "#/components/schemas/AddressInfo"
          },
          "expired": {
            "type": "boolean"
          }
        }
      },
      "CCTransactionInfo": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "leadPk": {
            "type": "integer",
            "format": "int64"
          },
          "creditCardTransactionPk": {
            "type": "integer",
            "format": "int64"
          },
          "paymentPk": {
            "type": "integer",
            "format": "int64"
          },
          "originalCCPk": {
            "type": "integer",
            "format": "int64"
          },
          "postingDate": {
            "type": "string",
            "format": "date"
          },
          "numberOfTries": {
            "type": "integer",
            "format": "int32"
          },
          "rerunStatus": {
            "type": "string",
            "enum": [
              "PENDING",
              "FUTURE_PENDING",
              "APPROVED",
              "DENIED",
              "ERROR",
              "REFUNDED",
              "CANCELLED",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "PARTIALLY_REFUNDED",
              "SKIPPED",
              "REUSED"
            ]
          },
          "rerunNsfStatus": {
            "type": "string",
            "enum": [
              "PENDING",
              "FUTURE_PENDING",
              "APPROVED",
              "DENIED",
              "ERROR",
              "REFUNDED",
              "CANCELLED",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "PARTIALLY_REFUNDED",
              "SKIPPED",
              "REUSED"
            ]
          },
          "amount": {
            "type": "number"
          },
          "originalAmount": {
            "type": "number"
          },
          "remainingRefundableAmount": {
            "type": "number"
          },
          "chargedFeeAmount": {
            "type": "number"
          },
          "authCode": {
            "type": "string"
          },
          "ipAddress": {
            "type": "string"
          },
          "vendor": {
            "type": "string",
            "enum": [
              "USAEPAY",
              "CHANNEL_PAYMENTS_CC",
              "OMNIFUND",
              "OTHER"
            ]
          },
          "ccAction": {
            "type": "string",
            "enum": [
              "TOKENIZATION",
              "AUTHENTICATION",
              "SALE",
              "CREDIT",
              "CAPTURE",
              "CONNECTOR_TOKENIZATION"
            ]
          },
          "ccTransactionType": {
            "type": "string",
            "enum": [
              "SCHEDULED",
              "REQUEST",
              "OTHER",
              "RERUN",
              "RERUN_NSF",
              "DAILY_DELINQUENCY_RUN",
              "_100_DAY_DELINQUENCY_RUN",
              "DAILY_SCHEDULED_DENIED_RERUN",
              "VINTAGE_RUN",
              "VINTAGE_RUN_ON_APPROVED",
              "BLACKLIST_CHECK",
              "BIN_MISMATCH"
            ]
          },
          "gatewayRequest": {
            "type": "string"
          },
          "gatewayResponse": {
            "type": "string"
          },
          "gatewayTransactionId": {
            "type": "string"
          },
          "gatewayAuthToken": {
            "type": "string"
          },
          "completedTime": {
            "type": "string",
            "format": "date-time"
          },
          "saveOnSuccessOnly": {
            "type": "boolean"
          },
          "errorCode": {
            "type": "string"
          },
          "error": {
            "type": "string"
          },
          "errorStacktrace": {
            "type": "string"
          },
          "useCardOnFile": {
            "type": "boolean"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "FUTURE_PENDING",
              "APPROVED",
              "DENIED",
              "ERROR",
              "REFUNDED",
              "CANCELLED",
              "MANUAL_REVERSE",
              "PICKED_TO_SEND",
              "PARTIALLY_REFUNDED",
              "SKIPPED",
              "REUSED"
            ]
          },
          "isNsf": {
            "type": "boolean"
          },
          "ccInfo": {
            "$ref": "#/components/schemas/CCInfo"
          },
          "comment": {
            "type": "string"
          },
          "allocationStrategy": {
            "type": "string",
            "enum": [
              "DEFAULT",
              "REGULAR_RECEIVABLES",
              "EPO_ONLY"
            ]
          },
          "isCustomRefund": {
            "type": "boolean"
          },
          "accountPkk": {
            "type": "integer"
          },
          "amountt": {
            "type": "number"
          },
          "postingDatee": {
            "type": "string",
            "format": "date"
          },
          "agentUsername": {
            "type": "string"
          },
          "id": {
            "type": "integer",
            "format": "int64"
          },
          "chargeType": {
            "type": "string",
            "enum": [
              "FEE",
              "PURCHASE"
            ]
          },
          "idempotencyKey": {
            "type": "string"
          },
          "chargeFee": {
            "type": "boolean"
          },
          "sameDayTransaction": {
            "type": "boolean"
          },
          "ccPeek": {
            "type": "boolean"
          },
          "isSettlementPayment": {
            "type": "boolean"
          },
          "paymentArrangementPk": {
            "type": "integer",
            "format": "int64"
          },
          "ccVendorTransactionId": {
            "type": "string"
          }
        }
      },
      "PaymentArrangementDto": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "paymentArrangement": {
            "type": "boolean"
          },
          "arrangementType": {
            "type": "string",
            "enum": [
              "NORMAL",
              "SETTLEMENT"
            ]
          },
          "achPayments": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ACHPayment"
            }
          },
          "creditCardTransactions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CCTransactionInfo"
            }
          }
        }
      },
      "PaymentArrangementResponse": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "creditCardTransactions": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CCTransactionResult"
            }
          },
          "achPayments": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AchPaymentResponse"
            }
          }
        }
      }
    },
    "securitySchemes": {
      "apiKeyAuth": {
        "type": "apiKey",
        "description": "API Key authentication. Include your API key in the Authorization header.",
        "name": "Authorization",
        "in": "header"
      }
    }
  },
  "x-readme": {
    "proxy-enabled": true,
    "explorer-enabled": true,
    "samples-languages": [
      "shell",
      "node",
      "python",
      "java",
      "curl"
    ]
  }
}
```