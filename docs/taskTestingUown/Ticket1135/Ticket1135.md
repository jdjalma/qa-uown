---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1135



UOWN | Origination | Notes Table Displays Email Instead of Username in User ID Column



BUG
In the Origination Portal, within the Notes table, it was observed that in some cases, 
the User ID column displays the user’s full email address instead of the username, as is correctly shown in the AMS.
This inconsistency occurs when performing certain actions or when adding internal notes.



FIX
* Investigate the source of the inconsistency causing the full email to appear in the User ID column.
* Compare data mappings between Origination and AMS to ensure both reference the correct username field.
* Review database records to confirm whether affected entries store the username or email.

![alt text](image.png)



Test instructions
Any operation that used to generated a activity log using the email should display the username instead. Like sending portal link to customers.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Tabela de Anotações Exibe o E-mail em Vez do Nome de Usuário na Coluna User ID
BUG

No Portal Origination, dentro da tabela Notes (Anotações), foi observado que, em alguns casos, a coluna User ID exibe o endereço de e-mail completo do usuário em vez do nome de usuário, como é exibido corretamente no AMS.

Essa inconsistência ocorre ao realizar determinadas ações ou ao adicionar notas internas, fazendo com que o campo apresente valores diferentes do esperado.

CORREÇÃO (FIX)
Investigar a origem da inconsistência que faz com que o e-mail completo apareça na coluna User ID.
Comparar os mapeamentos de dados entre o Origination e o AMS para garantir que ambos estejam referenciando corretamente o campo de username.
Revisar os registros do banco de dados para confirmar se as entradas afetadas armazenam o nome de usuário ou o e-mail.

Instruções de Teste
Qualquer operação que anteriormente gerava um registro de atividade (activity log) exibindo o e-mail deve agora exibir o nome de usuário no lugar.

Exemplo:
Ao enviar o link do portal para clientes, o sistema deve registrar o username do usuário responsável pela ação, e não o e-mail.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 2 arquivos
+
4
−
0
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/ams‎

po
‎jo‎

LoginSuccess
‎Response.java‎
+2 -0

web/se
‎curity‎

LoginHan
‎dler.java‎
+2 -0

 src/main/java/com/uownleasing/ams/pojo/LoginSuccessResponse.java 
+
2
−
0

Visualizado
@@ -33,6 +33,8 @@ public class LoginSuccessResponse {
    private String agentId;
    private ObjectNode permissions;
    private String merchantReferenceCode;
    private String email;
    private String username;

    public LoginSuccessResponse() {
        this.permissions = JsonNodeFactory.instance.objectNode();
 src/main/java/com/uownleasing/ams/web/security/LoginHandler.java 
+
2
−
0

Visualizado
@@ -78,6 +78,8 @@ public class LoginHandler implements AuthenticationSuccessHandler, Authenticatio
        response.setLastName(user.getLastName());
        response.setAgentId(user.getAgentId());
        response.setMerchantReferenceCode(user.getMerchantCodes());
        response.setEmail(user.getEmailAddress());
        response.setUsername(user.getUserName());

        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(response);

---


 2 arquivos
+
14
−
2
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

domain
‎/stores‎

accou
‎nt.tsx‎
+12 -2

serv
‎er.js‎
+2 -0

 domain/stores/account.tsx 
+
12
−
2

Visualizado
@@ -20,6 +20,10 @@ export class AccountStore extends BaseStore {
  @persist
  userEmail: string = undefined;

  @observable
  @persist
  username: string = undefined;

  @observable
  @persist
  rememberMe: string | null = null;
@@ -55,6 +59,11 @@ export class AccountStore extends BaseStore {
    this.userEmail = userEmail || null;
  };

  @action
  setUsername = (username: string) => {
    this.username = username ?? null;
  };

  @action
  setRememberMe = (userEmail: string) => {
    this.rememberMe = userEmail || null;
@@ -121,13 +130,14 @@ export class AccountStore extends BaseStore {
        return 499;
      } else if (response && response.data) {
        const loginResponse: LoginResponse = response?.data;
        this.setUserEmail(email || '');
        this.setUserEmail(response.data?.email);
        this.setUsername(response.data?.username);
        this.setMerchantReferenceCode(merchantReferenceCode);
        this.setPermissions(loginResponse?.permissions);
        codeToReturn = 200;
        Sentry.setUser({
          email,
          username: `${response.data?.firstName} ${response.data?.lastName}`,
          username: response.data?.username,
        });
      } else {
        return 500;
 server.js 
+
2
−
0

Visualizado
@@ -601,6 +601,8 @@ const proxy = {
            req.session.userFirstName = responseBody?.firstName || '';
            req.session.userLastName = responseBody?.lastName || '';
            req.session.agentId = responseBody?.agentId || '';
            req.session.username = responseBody.username;
            req.session.email = responseBody.email;

            logger.debug('7777777 Set req session after login', {
              session: req.session,

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Quando um usuário realiza uma ação que gera um registro de atividade no Portal Origination, a coluna User ID deve exibir o nome de usuário e não o endereço de email completo.
Quando um usuário envia um link do portal para clientes, o registro de atividade deve armazenar e exibir o username do usuário responsável pela ação.
Quando um usuário adiciona notas internas no Portal Origination, a coluna User ID na tabela Notes deve exibir o username e não o email.
Ao realizar login, o sistema deve utilizar o username armazenado para exibição em registros de atividade e logs.
Quando múltiplos usuários realizam ações simultâneas, cada registro de atividade deve exibir corretamente o username específico de cada usuário.



When a user performs an action that generates an activity log in the Origination Portal, the User ID column should display the username, not the full email address.
Quando um usuário realiza uma ação que gera um registro de atividade no Portal Origination, a coluna User ID deve exibir o nome de usuário e não o endereço de email completo.

When a user sends a portal link to customers, the activity log should store and display the username of the user responsible for the action.
Quando um usuário envia um link do portal para clientes, o registro de atividade deve armazenar e exibir o username do usuário responsável pela ação.

When a user adds internal notes in the Origination Portal, the User ID column in the Notes table should display the username, not the email.
Quando um usuário adiciona notas internas no Portal Origination, a coluna User ID na tabela Notes deve exibir o username e não o email.

When logging in, the system should use the stored username for display in activity logs and records.
Ao realizar login, o sistema deve utilizar o username armazenado para exibição em registros de atividade e logs.

When multiple users perform actions simultaneously, each activity log should correctly display the specific username of each user.
Quando múltiplos usuários realizam ações simultâneas, cada registro de atividade deve exibir corretamente o username específico de cada usuário.

-------


> ## Tests in qa2


> ```gherkin

> **When a user performs an action that generates an activity log in the Origination Portal, the User ID column should display the username, not the full email address**

> ![Screenshot_at_Oct_26_11-59-03](/uploads/0a55e84dd6bd748136b0f2923399cad4/Screenshot_at_Oct_26_11-59-03.png)
> ![Screenshot_at_Oct_26_12-00-27](/uploads/81ceb8ba5d994e3799a1af83d105d20b/Screenshot_at_Oct_26_12-00-27.png)
> ![Screenshot_at_Oct_26_12-00-54](/uploads/51c708335d8005c455d7bc02498b8ca4/Screenshot_at_Oct_26_12-00-54.png)
> ![Screenshot_at_Oct_26_12-03-39](/uploads/b3e561fd3ebd312cbc7dfbd5dd74ccb2/Screenshot_at_Oct_26_12-03-39.png)

> ![Screenshot_at_Oct_26_12-06-06](/uploads/8b02878e92c33e6ab509cfe20e5be61e/Screenshot_at_Oct_26_12-06-06.png)
> ![Screenshot_at_Oct_26_12-06-21](/uploads/271df3d653571b2a9b42bd3b563243ca/Screenshot_at_Oct_26_12-06-21.png)
> ![Screenshot_at_Oct_26_12-06-50](/uploads/3f56240a45fe7f944be00da7018749ea/Screenshot_at_Oct_26_12-06-50.png)
> ![Screenshot_at_Oct_26_12-07-05](/uploads/33e77b5953a9fc99e37f39adb51d57f5/Screenshot_at_Oct_26_12-07-05.png)
> ![Screenshot_at_Oct_26_12-07-15](/uploads/05e97f981e15673b5fedb7696eb04ca7/Screenshot_at_Oct_26_12-07-15.png)
> ![Screenshot_at_Oct_26_12-08-11](/uploads/da0a3bc7701ff7a2877e08ebf4bdb6af/Screenshot_at_Oct_26_12-08-11.png)

> ![Screenshot_at_Oct_26_12-18-44](/uploads/a7119a9504252d583d4a1bcfbed342a8/Screenshot_at_Oct_26_12-18-44.png)
> ![Screenshot_at_Oct_26_12-19-44](/uploads/c13374cbaea2dc7e95547f7a1449ace5/Screenshot_at_Oct_26_12-19-44.png)
> ![Screenshot_at_Oct_26_12-23-38](/uploads/8f52a57ddc1d4ebe27fe9f49e92530d8/Screenshot_at_Oct_26_12-23-38.png)
> ![Screenshot_at_Oct_26_12-25-27](/uploads/dd572deb8fc0720292efb252f06dc8f1/Screenshot_at_Oct_26_12-25-27.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a user sends a portal link to customers, the activity log should store and display the username of the user responsible for the action**

> ![Screenshot_at_Oct_26_12-29-09](/uploads/0dfc6bd19c3cf575f47c97d557c7a26d/Screenshot_at_Oct_26_12-29-09.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a user adds internal notes in the Origination Portal, the User ID column in the Notes table should display the username, not the email**

> ![Screenshot_at_Oct_26_12-00-54](/uploads/17afc74ae2f9009fb049262ff232300a/Screenshot_at_Oct_26_12-00-54.png)
> ![Screenshot_at_Oct_26_12-03-39](/uploads/711c535d8142e785830b2f1024c85619/Screenshot_at_Oct_26_12-03-39.png)
> ![Screenshot_at_Oct_26_12-06-50](/uploads/934b15007fc1ba928f582ec9b25a7f5d/Screenshot_at_Oct_26_12-06-50.png)

> **| PASS |**
> ```

> ```gherkin

> **When logging in, the system should use the stored username for display in activity logs and records**

> ![Screenshot_at_Oct_26_12-30-03](/uploads/d3db26ce441a4a9e9f6e6c633bc4e030/Screenshot_at_Oct_26_12-30-03.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When multiple users perform actions simultaneously, each activity log should correctly display the specific username of each user**

> ![Screenshot_at_Oct_26_12-32-41](/uploads/129c3091c546052612e7e8932376af75/Screenshot_at_Oct_26_12-32-41.png)
> ![Screenshot_at_Oct_26_12-33-38](/uploads/ad146187a628a0571eb1dc173b98fe13/Screenshot_at_Oct_26_12-33-38.png)
> ![Screenshot_at_Oct_26_12-34-19](/uploads/b080427365b9805e734e61cf4be33211/Screenshot_at_Oct_26_12-34-19.png)

> **| PASS |**
> ```

---

The task description or the testing steps do not specify the action performed by the user that generated the incorrect UserID. When generating an internal note for one or more merchants, we are correctly displaying and storing the username in the UserID field as expected.


@marcos.pacheco.silva We are displaying the email instead of the username; compared to the previous version, we were displaying the username.

![Screenshot_at_Oct_26_11-55-47](/uploads/1c4bf7e5a46eb3f89079f8d29ea622e2/Screenshot_at_Oct_26_11-55-47.png)
![Screenshot_at_Oct_26_11-56-04](/uploads/4ff50194bc27788917e2073800834c27/Screenshot_at_Oct_26_11-56-04.png)
![Screenshot_at_Oct_26_11-56-19](/uploads/837da5d5da2a6c08f6501d64b493d188/Screenshot_at_Oct_26_11-56-19.png)
![Screenshot_at_Oct_26_11-56-50](/uploads/ade7d70d10791c2615e7cb15700ea16f/Screenshot_at_Oct_26_11-56-50.png)
![Screenshot_at_Oct_26_11-57-10](/uploads/62316f1e0672e3aa3da33692e07ee7f8/Screenshot_at_Oct_26_11-57-10.png)
![Screenshot_at_Oct_26_11-57-29](/uploads/d3d7d5e62834123a0bec4c7d250b2f7d/Screenshot_at_Oct_26_11-57-29.png)
![Screenshot_at_Oct_26_11-59-03](/uploads/47858afda8ecd697789c39390941788c/Screenshot_at_Oct_26_11-59-03.png)
![Screenshot_at_Oct_26_12-00-27](/uploads/df4632dd5f5331fd3be0d7b61d3750bb/Screenshot_at_Oct_26_12-00-27.png)

---

@marcos.pacheco.silva When submitting to the completeApplication process, the email is displayed in the UserId field, whereas the expected value is the username.

![Screenshot_at_Oct_26_12-15-56](/uploads/dd1ab422247ebe5f4cc2be97e199aefc/Screenshot_at_Oct_26_12-15-56.png)
![Screenshot_at_Oct_26_12-18-23](/uploads/ba3b89fe955f027fe0aef64818dd50cf/Screenshot_at_Oct_26_12-18-23.png)

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Na descrição da tarefa ou nos passos de teste, não é especificada a ação realizada pelo usuário que gerou o UserID incorreto. Ao gerar uma nota interna para um ou mais merchants, estamos exibindo e armazenando o username corretamente no campo UserID, conforme esperado.
The task description or the testing steps do not specify the action performed by the user that generated the incorrect UserID. When generating an internal note for one or more merchants, we are correctly displaying and storing the username in the UserID field as expected.


Estamos exibindo o email no lugar do username; em comparação com a versão anterior, exibíamos o nome de usuário.
We are displaying the email instead of the username; compared to the previous version, we were displaying the username.

Ao submeter ao processo em completeApplication, é exibido o email no campo UserId, enquanto o esperado é que seja exibido o username.
When submitting to the completeApplication process, the email is displayed in the UserId field, whereas the expected value is the username.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Passou como esta.