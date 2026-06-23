> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get account summary

Retrieves comprehensive account details including balance and status

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
    "/uown/tms/v1/accounts/{accountId}/summary": {
      "get": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Get account summary",
        "description": "Retrieves comprehensive account details including balance and status",
        "operationId": "getAccountSummary",
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
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/TmsAccountSummary"
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
      "TmsAccountSummary": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "refAccountId": {
            "type": "integer",
            "format": "int64"
          },
          "customerFullName": {
            "type": "string"
          },
          "customerDob": {
            "type": "string",
            "format": "date"
          },
          "customerAddressLine1": {
            "type": "string"
          },
          "customerAddressLine2": {
            "type": "string"
          },
          "customerCity": {
            "type": "string"
          },
          "customerState": {
            "type": "string"
          },
          "customerZip": {
            "type": "string"
          },
          "accountStatus": {
            "type": "string",
            "enum": [
              "FUNDED",
              "ACTIVE",
              "PAID_OUT",
              "PAID_OUT_EARLY",
              "PAID_OUT_EARLY_EPO",
              "CHARGED_OFF",
              "CANCELLED",
              "CLOSED",
              "SOLD",
              "SETTLED_IN_FULL"
            ]
          },
          "nextPaymentDueAmount": {
            "type": "number"
          },
          "nextDueDate": {
            "type": "string",
            "format": "date"
          },
          "debtType": {
            "type": "string"
          },
          "internalAccountScore": {
            "type": "number",
            "format": "double"
          },
          "contractBalance": {
            "type": "number"
          },
          "pastDueAmount": {
            "type": "number"
          },
          "activationDate": {
            "type": "string",
            "format": "date"
          },
          "daysPastDue": {
            "type": "integer",
            "format": "int32"
          },
          "numberOfPaymentsMade": {
            "type": "integer",
            "format": "int32"
          },
          "ratingLetter": {
            "type": "string",
            "enum": [
              "P",
              "F",
              "C",
              "D",
              "R",
              "E",
              "U",
              "G",
              "J",
              "S",
              "B",
              "L",
              "M"
            ]
          },
          "dateOfNextCall": {
            "type": "string",
            "format": "date"
          },
          "epoBalance": {
            "type": "number"
          },
          "merchantName": {
            "type": "string"
          },
          "locationName": {
            "type": "string"
          },
          "earlyPayOffDate": {
            "type": "string",
            "format": "date"
          },
          "numberOfPaymentsLeft": {
            "type": "integer",
            "format": "int32"
          },
          "lastScheduledPaymentDate": {
            "type": "string",
            "format": "date"
          },
          "eligibleForPromotionalPayOff": {
            "type": "boolean"
          },
          "customerPaymentFrequency": {
            "type": "string",
            "enum": [
              "DAILY",
              "WEEKLY",
              "BI_WEEKLY",
              "SEMI_MONTHLY",
              "MONTHLY",
              "UNKNOWN"
            ]
          },
          "numberOfDueDateMoves": {
            "type": "integer",
            "format": "int32"
          },
          "lastScheduleMovedDate": {
            "type": "string",
            "format": "date-time"
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