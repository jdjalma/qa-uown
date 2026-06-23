> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Search accounts by customer identifiers

Finds active primary accounts matching phone, SSN, or date of birth. Returns up to 5 results.

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
    "/uown/tms/v1/accounts/search": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Search accounts by customer identifiers",
        "description": "Finds active primary accounts matching phone, SSN, or date of birth. Returns up to 5 results.",
        "operationId": "searchAccount",
        "requestBody": {
          "description": "Search criteria with at least one identifier (phone, SSN, or DOB)",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/FindAccountRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Accounts found successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/FindAccountResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid search criteria",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "409": {
            "description": "Too many accounts found (>5)",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        },
        "deprecated": true
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
      "FindAccountRequest": {
        "type": "object",
        "properties": {
          "phone": {
            "type": "string",
            "description": "Customer phone number",
            "example": "5551234567"
          },
          "last4SSN": {
            "type": "string",
            "description": "Last 4 digits of the customer's Social Security Number",
            "example": "1234"
          },
          "dob": {
            "type": "string",
            "description": "Customer date of birth",
            "format": "date",
            "example": "1985-06-15"
          }
        },
        "description": "Search criteria. At least one of phone, last4SSN, or dob must be provided."
      },
      "AccountProfile": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
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
          "firstName": {
            "type": "string"
          },
          "lastName": {
            "type": "string"
          },
          "last4Ssn": {
            "type": "string"
          },
          "dob": {
            "type": "string",
            "format": "date"
          },
          "zip": {
            "type": "string"
          },
          "phone": {
            "type": "string"
          },
          "email": {
            "type": "string"
          }
        }
      },
      "FindAccountResponse": {
        "type": "object",
        "properties": {
          "content": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/AccountProfile"
            }
          },
          "size": {
            "type": "integer",
            "format": "int64"
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