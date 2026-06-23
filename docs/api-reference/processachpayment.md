> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Process ACH payment

Initiates an ACH (Automated Clearing House) bank payment

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
    "/uown/tms/v1/accounts/{accountId}/payments/ach": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Process ACH payment",
        "description": "Initiates an ACH (Automated Clearing House) bank payment",
        "operationId": "processAchPayment",
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
                "$ref": "#/components/schemas/AchPaymentRequest"
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
                  "$ref": "#/components/schemas/AchPaymentResponse"
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
      "AchPaymentRequest": {
        "required": [
          "amount",
          "bankAccount",
          "postingDate"
        ],
        "type": "object",
        "properties": {
          "amount": {
            "type": "number",
            "description": "Debit amount"
          },
          "postingDate": {
            "type": "string",
            "description": "Scheduled posting date",
            "format": "date"
          },
          "allocationStrategy": {
            "type": "string",
            "description": "Receivable allocation behavior",
            "enum": [
              "DEFAULT",
              "REGULAR_RECEIVABLES",
              "EPO_ONLY"
            ]
          },
          "comments": {
            "type": "string",
            "description": "Optional free-form operator comment appended to the ACH record"
          },
          "bankAccount": {
            "$ref": "#/components/schemas/BankAccountDetails"
          }
        }
      },
      "BankAccountDetails": {
        "type": "object",
        "properties": {
          "bankAccountId": {
            "type": "integer",
            "description": "Saved bank account id for this account",
            "format": "int64"
          },
          "routingNumber": {
            "type": "string",
            "description": "ABA routing number (required when not using bankAccountId)"
          },
          "accountNumber": {
            "type": "string",
            "description": "Account number (required when not using bankAccountId)"
          },
          "bankName": {
            "type": "string",
            "description": "Bank name (optional when using keyed account details)"
          },
          "accountHolderFirstName": {
            "type": "string",
            "description": "Account holder given name (optional; primary customer used when omitted)"
          },
          "accountHolderLastName": {
            "type": "string",
            "description": "Account holder family name (optional; primary customer used when omitted)"
          },
          "designateAutoPay": {
            "type": "boolean",
            "description": "When true, designates this bank account for autopay",
            "default": false
          },
          "exclusiveBankInstrument": {
            "type": "boolean"
          }
        },
        "description": "Saved bank account or keyed bank details"
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