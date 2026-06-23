> ## Documentation Index
> Fetch the complete documentation index at: https://uown-tms.readme.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication

All API requests require authentication using an API key. This guide explains how to obtain your API key and use it to authenticate your requests.

<br />

## Overview

The Uown Leasing Service API uses API key authentication. To access the API, you must:

1. Obtain credentials (username and password) from our development team
2. Use these credentials to retrieve an API key via the authentication endpoint
3. Include the API key in all subsequent API requests

## Obtaining Credentials

Before you can authenticate, you need to obtain your API credentials. Please contact our development team or sales team to request:

* **Username**: Your API username
* **Password**: Your API password

These credentials will be created specifically for your integration and will be used solely to retrieve your API key.

## Getting Your API Key

Once you have your credentials, you can retrieve your API key by calling the `POST /uown/auth/authorize` endpoint.

<br />

### Request

```http
POST /uown/auth/authorize HTTP/1.1
Host: svc-sandbox.uownleasing.com
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

### Response

```json
{
  "key": "your-api-key-here",
  "expires": "2026-02-11T12:00:00"
}
```

### Response Fields

| Field     | Type     | Description                                                                                                   |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `key`     | string   | Your API key. Use this in all subsequent API requests.                                                        |
| `expires` | datetime | The expiration date and time of the API key (in UTC). After this time, you'll need to generate a new API key. |
| `error`   | string   | Error message (only present if authentication fails)                                                          |

### Error Responses

If authentication fails, you'll receive a 400 Bad Request response:

```json
{
  "error": "Authentication Failed. Incorrect username and/or password"
}
```

***

## Using Your API Key

Once you have obtained your API key, you must include it in all API requests. Currently, the API key should be sent in the `Authorization` header.

### Current Method (Authorization Header)

Include your API key directly in the `Authorization` header:

```http
GET /uown/tms/getAccountSummary/12345 HTTP/1.1
Host: svc-sandbox.uownleasing.com
Authorization: your-api-key-here
Content-Type: application/json
```

<br />

### Future Method (Bearer Token)

> **Note**: In an upcoming release, we will also support Bearer token authentication. The API key can be sent as a Bearer token in the `Authorization` header:

```http
GET /uown/tms/getAccountSummary/12345 HTTP/1.1
Host: svc-sandbox.uownleasing.com
Authorization: Bearer your-api-key-here
Content-Type: application/json
```

For now, both methods will be supported to ensure backward compatibility. We recommend migrating to Bearer token format when available.

***

## Code Examples

### cURL

```bash
# Get API Key
curl -X POST https://svc-sandbox.uownleasing.com/uown/auth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-username",
    "password": "your-password"
  }'

# Use API Key in subsequent requests
curl -X GET https://svc-sandbox.uownleasing.com/uown/tms/getAccountSummary/12345 \
  -H "Authorization: your-api-key-here" \
  -H "Content-Type: application/json"
```

### Python

```python
import requests

# Step 1: Get API Key
auth_url = "https://svc-sandbox.uownleasing.com/uown/auth/authorize"
auth_response = requests.post(
    auth_url,
    json={
        "username": "your-username",
        "password": "your-password"
    }
)
auth_data = auth_response.json()
api_key = auth_data["key"]

# Step 2: Use API Key in API requests
headers = {
    "Authorization": api_key,
    "Content-Type": "application/json"
}

account_url = "https://svc-sandbox.uownleasing.com/uown/tms/getAccountSummary/12345"
response = requests.get(account_url, headers=headers)
account_data = response.json()
```

### Node.js

```javascript
const axios = require('axios');

// Step 1: Get API Key
async function authorize(username, password) {
  const response = await axios.post(
    'https://svc-sandbox.uownleasing.com/uown/auth/authorize',
    {
      username: username,
      password: password
    }
  );
  return response.data.key;
}

// Step 2: Use API Key in API requests
async function getAccountSummary(accountPk, apiKey) {
  const response = await axios.get(
    `https://svc-sandbox.uownleasing.com/uown/tms/getAccountSummary/${accountPk}`,
    {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// Usage
(async () => {
  const apiKey = await authorize('your-username', 'your-password');
  const account = await getAccountSummary(12345, apiKey);
  console.log(account);
})();
```

### Java

```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

// Step 1: Get API Key
public String authorize(String username, String password) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    ObjectMapper mapper = new ObjectMapper();
    
    String requestBody = mapper.writeValueAsString(Map.of(
        "username", username,
        "password", password
    ));
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://svc-sandbox.uownleasing.com/uown/auth/authorize"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build();
    
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    Map<String, Object> responseData = mapper.readValue(response.body(), Map.class);
    
    return (String) responseData.get("key");
}

// Step 2: Use API Key in API requests
public Map<String, Object> getAccountSummary(long accountPk, String apiKey) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    ObjectMapper mapper = new ObjectMapper();
    
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://svc-sandbox.uownleasing.com/uown/tms/getAccountSummary/" + accountPk))
        .header("Authorization", apiKey)
        .header("Content-Type", "application/json")
        .GET()
        .build();
    
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    return mapper.readValue(response.body(), Map.class);
}
```

***

## API Key Expiration

API keys have an expiration date and time (provided in UTC). The expiration time is returned in the `expires` field when you retrieve your API key.

**Important**:

* API keys expire after a set period (typically 24 hours)
* You must generate a new API key before the current one expires
* Expired API keys will result in authentication errors
* Store the expiration time and implement logic to refresh your API key automatically

<br />

### Handling Expiration

We recommend implementing automatic API key refresh in your application:

```python
import requests
from datetime import datetime

class ApiKeyManager:
    def __init__(self, username, password, base_url):
        self.username = username
        self.password = password
        self.base_url = base_url
        self.api_key = None
        self.expires_at = None
    
    def get_api_key(self):
        # Check if current key is still valid
        if self.api_key and self.expires_at:
            if datetime.now() < self.expires_at:
                return self.api_key
        
        # Generate new API key
        response = requests.post(
            f"{self.base_url}/uown/auth/authorize",
            json={
                "username": self.username,
                "password": self.password
            }
        )
        data = response.json()
        self.api_key = data["key"]
        self.expires_at = datetime.fromisoformat(data["expires"].replace("Z", "+00:00"))
        return self.api_key
```

***

## Security Best Practices

1. **Never expose your API key**: Keep your API key secure and never commit it to version control systems
2. **Use environment variables**: Store API keys in environment variables or secure configuration files
3. **Rotate keys regularly**: Generate new API keys periodically for enhanced security
4. **Use HTTPS only**: Always make API requests over HTTPS to protect your credentials
5. **Monitor usage**: Keep track of API key usage and watch for any suspicious activity
6. **Revoke compromised keys**: If you suspect your API key has been compromised, contact our support team immediately

***

Troubleshooting

### Authentication Failed

If you receive an "Authentication Failed" error:

1. **Verify credentials**: Ensure your username and password are correct
2. **Check API key expiration**: Your API key may have expired. Generate a new one
3. **Verify header format**: Ensure you're sending the API key in the `Authorization` header correctly
4. **Check environment**: Make sure you're using the correct base URL for your environment

### Invalid API Key

If you receive an "Invalid API Key" error:

1. **Regenerate API key**: Generate a new API key using the authentication endpoint
2. **Check expiration**: Verify that your API key hasn't expired
3. **Verify header**: Ensure the `Authorization` header is included in your request
4. **Check for typos**: Verify there are no extra spaces or characters in your API key

### 401 Unauthorized

If you receive a 401 Unauthorized response:

1. **Missing header**: Ensure the `Authorization` header is present in your request
2. **Invalid format**: Verify the API key is formatted correctly in the header
3. **Expired key**: Your API key may have expired. Generate a new one

***

## Support

If you continue to experience authentication issues, please contact our support team with:

* Your username (not your password)
* The error message you're receiving
* The endpoint you're trying to access
* The timestamp of the request

We're here to help ensure a smooth integration experience