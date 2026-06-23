> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Adjust the next payment due date for an account

Moves a payment due date forward by a specified number of days. Maximum offset is 3 days for weekly frequency accounts and 7 days for all other frequencies. Only the specified payment for the specified due date is moved.

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
    "/uown/tms/v1/accounts/{accountPk}/next-due-date/adjustments": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Adjust the next payment due date for an account",
        "description": "Moves a payment due date forward by a specified number of days. Maximum offset is 3 days for weekly frequency accounts and 7 days for all other frequencies. Only the specified payment for the specified due date is moved.",
        "operationId": "adjustNextDueDate",
        "parameters": [
          {
            "name": "accountPk",
            "in": "path",
            "description": "Account primary key",
            "required": true,
            "schema": {
              "type": "integer",
              "format": "int64"
            }
          }
        ],
        "requestBody": {
          "description": "Adjustment parameters: dueDate, offset (number of days to move forward, range: 0-7; max 3 days for weekly frequency accounts)",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/NextDueDateAdjustmentRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Payment due date adjusted successfully. Returns updated due date information.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/DueDateAdjustmentResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request — possible causes: offset exceeds the allowed maximum (3 days for WEEKLY frequency, 7 days for all other frequencies), provided due date does not match the account's next due date",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Account not found",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "422": {
            "description": "Account has no pending due date available to be moved",
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
      "NextDueDateAdjustmentRequest": {
        "type": "object",
        "properties": {
          "dueDate": {
            "type": "string",
            "description": "The due date to adjust.",
            "format": "date",
            "nullable": true,
            "example": "2026-03-15"
          },
          "offset": {
            "maximum": 7,
            "minimum": 0,
            "type": "integer",
            "description": "Number of days to move the due date forward (0–7). For WEEKLY frequency accounts the maximum is 3 days.",
            "format": "int32",
            "example": 3
          }
        }
      },
      "DueDateAdjustmentResponse": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "originalDueDate": {
            "type": "string",
            "format": "date"
          },
          "newDueDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
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