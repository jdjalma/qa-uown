------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1166


UOWN | Origination and Servicing | Fix the Unlock User Toast Notification


Testing Steps
Confirm that now the locked message is correctly appearing on origination and servicing after the user fails their password more than three times
![alt text](image.png)

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 server.js 
+
13
−
0

Visualizado
@@ -578,6 +578,19 @@ const proxy = {
      proxyRes.on('end', () => {
        body = body.toString();
        try {
          const errorStatus = proxyRes?.statusCode;
          const isErrorResponse = errorStatus && errorStatus >= 400;

          if (isErrorResponse) {
            if (!res.headersSent) {
              res.setHeader('content-type', 'application/json');
              res.status(errorStatus).send(body || '');
            } else {
              res.end();
            }
            return;
          }

          const responseBody = JSON.parse(body);
          if (
            responseBody?.permissions &&

---


 1 arquivo
+
13
−
0
 server.js 
+
13
−
0

Visualizado
@@ -424,6 +424,19 @@ const proxy = {
      proxyRes.on('end', () => {
        body = body.toString();
        try {
          const errorStatus = proxyRes?.statusCode;
          const isErrorResponse = errorStatus && errorStatus >= 400;

          if (isErrorResponse) {
            if (!res.headersSent) {
              res.setHeader('content-type', 'application/json');
              res.status(errorStatus).send(body || '');
            } else {
              res.end();
            }
            return;
          }

          const responseBody = JSON.parse(body);
          if (
            responseBody &&


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2


> ```gherkin

> **Origination**

> !

> **| PASS |**
> ```

---

> ```gherkin

> **Servicing**

> !

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg


> ```gherkin

> **Origination**

![image](/uploads/d258ccfe4760062fec82e9006dc64cc8/image.png){width=900 height=458}
![image](/uploads/9543e2235f9439b1bfb9f4a4379c3904/image.png){width=900 height=434}

> **| PASS |**
> ```

---

> ```gherkin

> **Servicing**

![image](/uploads/c4ace085d2abe2c819aa6f75a7f9728e/image.png){width=900 height=433}

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

