> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Process credit card payment

Executes a single credit card payment transaction

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
    "/uown/tms/v1/accounts/{accountId}/payments/credit-card": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Process credit card payment",
        "description": "Executes a single credit card payment transaction",
        "operationId": "processCreditCardPayment",
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
                "$ref": "#/components/schemas/CreditCardPaymentRequest"
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
                  "$ref": "#/components/schemas/CCTransactionResult"
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
      "BillingAddress": {
        "type": "object",
        "properties": {
          "streetAddress1": {
            "type": "string",
            "description": "Street address line 1"
          },
          "streetAddress2": {
            "type": "string",
            "description": "Street address line 2"
          },
          "city": {
            "type": "string",
            "description": "City"
          },
          "state": {
            "type": "string",
            "description": "Two-letter state code"
          },
          "zipCode": {
            "type": "string",
            "description": "ZIP code"
          }
        },
        "description": "Optional billing address associated with the card"
      },
      "CardDetails": {
        "type": "object",
        "properties": {
          "creditCardId": {
            "type": "integer",
            "description": "Id of a tokenized card on file for the account",
            "format": "int64"
          },
          "ccFirstName": {
            "maxLength": 255,
            "minLength": 0,
            "type": "string",
            "description": "Optional cardholder given name (keyed card)"
          },
          "ccLastName": {
            "maxLength": 255,
            "minLength": 0,
            "type": "string",
            "description": "Optional cardholder family name (keyed card)"
          },
          "ccNumber": {
            "type": "string",
            "description": "Primary account number (PAN); required for keyed card payments"
          },
          "ccExp": {
            "maxLength": 5,
            "minLength": 0,
            "type": "string",
            "description": "Expiration date in MM/YY format (keyed card)"
          },
          "cvc": {
            "maxLength": 4,
            "minLength": 0,
            "type": "string",
            "description": "Card security code"
          },
          "autoPay": {
            "type": "boolean",
            "description": "When true, designates this card for autopay (keyed or on-file)"
          },
          "billingAddress": {
            "$ref": "#/components/schemas/BillingAddress"
          },
          "exclusiveCardMode": {
            "type": "boolean"
          }
        },
        "description": "Card on file or keyed card details"
      },
      "CreditCardPaymentRequest": {
        "required": [
          "amount",
          "postingDate"
        ],
        "type": "object",
        "properties": {
          "amount": {
            "type": "number",
            "description": "Payment amount"
          },
          "postingDate": {
            "type": "string",
            "description": "Effective posting date for the payment",
            "format": "date"
          },
          "allocationStrategy": {
            "type": "string",
            "description": "How the payment allocates across receivables",
            "enum": [
              "DEFAULT",
              "REGULAR_RECEIVABLES",
              "EPO_ONLY"
            ]
          },
          "chargeFee": {
            "type": "boolean",
            "description": "Charge an additional processing fee when applicable",
            "default": true
          },
          "comment": {
            "type": "string",
            "description": "Optional note stored on the transaction"
          },
          "card": {
            "$ref": "#/components/schemas/CardDetails"
          }
        }
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