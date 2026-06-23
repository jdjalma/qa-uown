> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update contact preferences

Updates TCPA and AI opt-out preferences for a phone number on the account

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
    "/uown/tms/v1/accounts/{accountId}/contactPreferences": {
      "post": {
        "tags": [
          "UOWN TMS SERVICE API"
        ],
        "summary": "Update contact preferences",
        "description": "Updates TCPA and AI opt-out preferences for a phone number on the account",
        "operationId": "updateContactPreferences",
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
                "$ref": "#/components/schemas/ContactPreferencesRequest"
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
                  "$ref": "#/components/schemas/ContactPreferencesResponse"
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
      "ContactPreferencesRequest": {
        "required": [
          "phoneNumber"
        ],
        "type": "object",
        "properties": {
          "phoneNumber": {
            "type": "integer",
            "format": "int64"
          },
          "doNotCall": {
            "type": "boolean"
          },
          "doNotText": {
            "type": "boolean"
          },
          "optOutAi": {
            "type": "boolean"
          },
          "optOutReason": {
            "maxLength": 500,
            "minLength": 0,
            "type": "string"
          },
          "atLeastOnePreference": {
            "type": "boolean"
          }
        }
      },
      "ContactPreferencesResponse": {
        "type": "object",
        "properties": {
          "accountPk": {
            "type": "integer",
            "format": "int64"
          },
          "phoneNumber": {
            "type": "integer",
            "format": "int64"
          },
          "doNotCall": {
            "type": "boolean"
          },
          "doNotText": {
            "type": "boolean"
          },
          "optOutAi": {
            "type": "boolean"
          },
          "optOutAiReason": {
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