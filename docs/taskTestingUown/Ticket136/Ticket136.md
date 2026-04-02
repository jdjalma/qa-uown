----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

http://website-qa2.kornerstonecredit.com/
https://website-qa2.uownleasing.com/


Aqui estão os textos em **Markdown**, separados em **Português** e **Inglês**:

### **Português:**

```markdown
## Página inicial

### Navegação primária
- Projeto
- W
- website

### Fixada
- Issues
- 8
- Solicitações de mesclagem
- 0

### Gerenciar
- Plano
- Issues
- 8
- Quadros de issues
- Marcos
- Iterações
- Wiki

### Código
- Compilação
- Segurança
- Implantação
- Operação
- Monitorar
- Analisar
- Configurações
- uown
- frontend
- website

### Issues
- **#136**
- **Uown | RU11.25.1.47.0**
- UOWN | Customer Portal | Restyle Customer Portal to Match Kornerstone Branding for Kornerstone Leases
- Aberto
- **Tíquete criado 3 semanas atrás por Yuri Araujo**

#### Tíquete
- **UOWN | Customer Portal | Restyle Customer Portal to Match Kornerstone Branding for Kornerstone Leases**

#### Resumo
- O Portal do Cliente deve adaptar sua aparência e alguns detalhes de redirecionamento/contato quando o cliente logado pertencer à Kornerstone (ou seja, empresa = Kornerstone).
- Essas mudanças são apenas visuais e não devem impactar o comportamento funcional.

- O objetivo é aplicar um tema com as cores, acentos de design, links alternativos, números de telefone e referências de contato da Kornerstone, para que os usuários da Kornerstone vejam uma versão do portal que reflita a identidade da marca deles.

#### Objetivo de Negócio
- Clientes da Kornerstone devem ter uma experiência no portal adaptada ao estilo e à estrutura de suporte da sua empresa.
- Atualizar o tema visual e as informações de redirecionamento/contato melhora o reconhecimento, a confiança e a clareza para os clientes da Kornerstone, além de reduzir a confusão ao garantir que o portal reflita a identidade e os canais de suporte apropriados.

#### Recursos e Requisitos
- Detectar quando a empresa do cliente for Kornerstone durante o acesso ao portal.
- Aplicar um estilo visual com tema da Kornerstone, incluindo cores atualizadas consistentes com a marca Kornerstone.
- Atualizar links, URLs de redirecionamento, números de telefone de suporte e detalhes de contato para as versões da Kornerstone.
- Garantir que todas as mudanças sejam apenas visuais e não modifiquem a funcionalidade subjacente do Portal do Cliente.
- Aplicar o tema de forma consistente em todas as páginas do portal acessadas por clientes da Kornerstone.
- Clientes não-Kornerstone devem continuar vendo a versão padrão do Portal sem mudanças visuais ou de redirecionamento.
- Validar que o tema carregue corretamente em todos os pontos de entrada do portal (login, resumo de conta, histórico, fluxos de pagamento, etc.).

#### Designs
- ![BannerV1.png](BannerV1.png)
- ![Bannerv2.png](Bannerv2.png)

### Atributos
- Status: To do
- Responsáveis:
  - Davi Artur
- Etiquetas:
  - dev, full-stack, priority, high, type, business request, workflow, qa-pass

### Data
- Iniciar: Nenhum
- Vencimento: Nenhum

### Atividade
- Yuri Araujo definiu o status para "To do" 3 semanas atrás
- Davi Artur mencionou no merge request !246 (mesclado) 5 dias atrás
- Priyanka Namburu mencionou no commit uown/backend/svc@a5460e6d 2 dias atrás

#### Desenvolvimento
- [uown/frontend/website#136] R1.47.0 filter account pks for companies
- [uown/frontend/website#136] R1.47.0 integração com a Kornerstone

### Testes
- Cliente com ambas as contas Uown e Kornerstone acessa os portais do cliente usando o código de verificação.
- Cliente com uma conta da Kornerstone faz um pagamento pelo portal, e o agente pode visualizar o pagamento nas transações de cartão de crédito em Servicing.
- Cliente registra uma conta bancária e CC pelo portal do cliente.
- Visualizar e baixar documentos.
- Cliente envia solicitações pelos canais de comunicação.
- Em "Atualizar Informações de Contato", o cliente altera seus dados de contato.
- No portal do cliente, contas canceladas não são acessíveis, e contas com status de quitadas são somente leitura, conforme esperado.
- Cliente elegível para o plano de proteção para uma conta Kornerstone.
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### **English:**

```markdown
## Home Page

### Primary Navigation
- Project
- W
- website

### Pinned
- Issues
- 8
- Merge Requests
- 0

### Manage
- Plan
- Issues
- 8
- Issue Boards
- Milestones
- Iterations
- Wiki

### Code
- Build
- Security
- Deployment
- Operation
- Monitoring
- Analyze
- Settings
- uown
- frontend
- website

### Issues
- **#136**
- **Uown | RU11.25.1.47.0**
- UOWN | Customer Portal | Restyle Customer Portal to Match Kornerstone Branding for Kornerstone Leases
- Open
- **Ticket created 3 weeks ago by Yuri Araujo**

#### Ticket
- **UOWN | Customer Portal | Restyle Customer Portal to Match Kornerstone Branding for Kornerstone Leases**

#### Synopsis
- The Customer Portal must adapt its appearance and certain redirect/contact details when the logged-in customer belongs to Kornerstone (i.e., company = Kornerstone).
- These changes are visual only and must not impact functional behavior.

- The goal is to apply a Kornerstone-styled theme colors, design accents, alternative links, phone numbers, and contact references, so that users from Kornerstone see a version of the portal that reflects their brand identity.

#### Business Objective
- Kornerstone customers should have a portal experience tailored to the branding and support structure of their company.
- Updating the visual theme and redirect/contact information enhances recognition, trust, and clarity for Kornerstone customers, while also reducing confusion by ensuring the portal reflects the appropriate identity and support channels.

#### Features and Requirements
- Detect when the customer’s company = Kornerstone during portal access.
- Apply a Kornerstone-themed visual style, including updated colors consistent with Kornerstone branding.
- Update links, redirect URLs, support phone numbers, and contact details to the Kornerstone versions.
- Ensure that all changes are visual-only and do not modify the underlying functionality of the Customer Portal.
- Apply the theme consistently across all portal pages accessed by Kornerstone customers.
- Non-Kornerstone customers should continue seeing the default version of the Portal without any visual or redirect changes.
- Validate that the theme loads correctly on every portal entry point (login, account summary, history, payment flows, etc.).

#### Designs
- ![BannerV1.png](BannerV1.png)
- ![Bannerv2.png](Bannerv2.png)

### Attributes
- Status: To do
- Assignees:
  - Davi Artur
- Labels:
  - dev, full-stack, priority, high, type, business request, workflow, qa-pass

### Dates
- Start: None
- Due: None

### Activity
- Yuri Araujo set status to To do 3 weeks ago
- Davi Artur mentioned in merge request !246 (merged) 5 days ago
- Priyanka Namburu mentioned in commit uown/backend/svc@a5460e6d 2 days ago

#### Development
- [uown/frontend/website#136] R1.47.0 filter account pks for companies
- [uown/frontend/website#136] R1.47.0 Kornerstone integration

### Tests
- Customer with both Uown and Kornerstone accounts accesses the customer portals using the verification code.
- Customer with a Kornerstone account makes a payment via the portal, and the agent can view the payment under credit card transactions in Servicing.
- Customer registers a bank account and CC through the customer portal.
- View and download documents.
- Customer submits requests through the communication channels.
- In “Update Contact Info,” the customer updates their contact details.
- In the customer portal, canceled accounts are not accessible, and accounts with a paid-off status are view-only, as expected.
- Customer eligible for the protection plan for a Kornerstone account.
```

Agora, cada versão está separada para você, com os conteúdos em **Português** e **Inglês**.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in qa2

***Customer with both Uown and Kornerstone accounts accesses the customer portals using the verification code***

![image](/uploads/edcac4a1e228cb4ba59aa0b5d7b4b4e1/image.png){width=530 height=315}
![image](/uploads/f8a8d395bcb5ee6f3b72945597f9c65f/image.png){width=538 height=310}
![image](/uploads/0050195850661cbea3ebb3a728d3aedd/image.png){width=900 height=190}
![image](/uploads/c7a640b555e985fe95af863d3c7b915b/image.png){width=531 height=327}
![image](/uploads/2f87442f2e43194965ddc6f0a7a80dcb/image.png){width=900 height=381}
![image](/uploads/7eaa0cb51629aba1dd2387c703a63c34/image.png){width=900 height=444}

**| PASS |**

---

***Customer with a Kornerstone account makes a payment via the portal, and the agent can view the payment under credit card transactions in Servicing***

![image](/uploads/de48c6e405ca86ff128d3d6b53a74710/image.png){width=900 height=171}
![image](/uploads/0427b059991d895f391261869d74d11c/image.png){width=900 height=180}

**| PASS |**

---

***Customer registers a bank account and CC through the customer portal***

![image](/uploads/7db9065ddf9ff42b67dc69be6069094f/image.png){width=900 height=544}
![image](/uploads/d08bff5a7e599a1d7269c8c5c34db0ef/image.png){width=407 height=396}

![image](/uploads/af757df1236f6f9c625a3f30b52a67a2/image.png){width=702 height=600}
![image](/uploads/26b6b80de3caa13c08e00e36dc86f881/image.png){width=392 height=497}

**| PASS |**

---

***View and download documents***

![image](/uploads/53a5286514fd3812aac1baa407315852/image.png){width=900 height=443}

**| PASS |**

---

***Customer submits requests through the communication channels***

![image](/uploads/e5349055572536de7a0b3287f439a016/image.png){width=782 height=600}
![image](/uploads/58690403bdc5f5247024c86d7bad712d/image.png){width=900 height=448}
![image](/uploads/4df062402e8cfca71aa0be0fcb90c1c1/image.png){width=900 height=355}

**| PASS |**

---

***In “Update Contact Info,” the customer updates their contact details***

![image](/uploads/b34c7f43299e5306e4d6fe3d3e2441a2/image.png){width=900 height=446}

**| PASS |**

---

***In the customer portal, canceled accounts are not accessible, and accounts with a paid-off status are view-only, as expected***

![image](/uploads/c26e20aa062f4f7054322b4fa351b9a0/image.png){width=900 height=86}
![image](/uploads/eaf3fd6b2d2d008066aaf97288a67dd5/image.png){width=281 height=185}
![image](/uploads/02f4defa5791eaa1c1bcbdba5c5beccb/image.png){width=900 height=113}
![image](/uploads/d3afc753b9a6f23acc34478b9505a8fa/image.png){width=900 height=446}
![image](/uploads/af2289943b910a2d497fd473ff26315d/image.png){width=900 height=495}

---

***Customer eligible for the protection plan for a Kornerstone account.***

![image](/uploads/9fdc23f0989c3ba1ffb590a4aebea7f6/image.png){width=900 height=169}
![image](/uploads/b8f2ecfb2f3220a2117bca5c25d2b32b/image.png){width=900 height=446}
![image](/uploads/ead5b19404e57ef8c7474fc31598ad87/image.png){width=900 height=449}
![image](/uploads/d24eb3da7de339fabaea4c4a8ab0271c/image.png){width=900 height=447}
![image](/uploads/ff6b51a97396a0fc26961ff8182530f3/image.png){width=900 height=433}

**| PASS |**

---


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg

***Customer with both Uown and Kornerstone accounts accesses the customer portals using the verification code***



**| PASS |**

---

***Customer with a Kornerstone account makes a payment via the portal, and the agent can view the payment under credit card transactions in Servicing***



**| PASS |**

---

***Customer registers a bank account and CC through the customer portal***



**| PASS |**

---

***View and download documents***



**| PASS |**

---

***Customer submits requests through the communication channels***



**| PASS |**

---

***In “Update Contact Info,” the customer updates their contact details***



**| PASS |**

---

***In the customer portal, canceled accounts are not accessible, and accounts with a paid-off status are view-only, as expected***



---

***Customer eligible for the protection plan for a Kornerstone account.***



**| PASS |**

---


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG


> ## Tests in stg

***Customer with both Uown and Kornerstone accounts accesses the customer portals using the verification code***

![Screenshot_at_Dec_16_15-52-02](/uploads/ae1c4c3511376a19ba58e573f27d79e9/Screenshot_at_Dec_16_15-52-02.png){width=558 height=322}
![Screenshot_at_Dec_16_15-52-17](/uploads/eee2ed5d98035e52c165d417d4588dbf/Screenshot_at_Dec_16_15-52-17.png){width=538 height=303}
![Screenshot_at_Dec_16_15-56-38](/uploads/1fd312574688bbbef61e2211f1ad74bc/Screenshot_at_Dec_16_15-56-38.png){width=554 height=301}
![Screenshot_at_Dec_16_15-56-55](/uploads/71f00e19ab4efb55be5abd65467fb743/Screenshot_at_Dec_16_15-56-55.png){width=900 height=167}
![Screenshot_at_Dec_16_16-03-33](/uploads/29c25d54321e6ca662084f494ec601b5/Screenshot_at_Dec_16_16-03-33.png){width=900 height=444}

**| PASS |**

---

***Customer with a Kornerstone account makes a payment via the portal, and the agent can view the payment under credit card transactions in Servicing***



**| PASS |**

---

***Customer registers a bank account and CC through the customer portal***



**| PASS |**

---

***View and download documents***



**| PASS |**

---

***Customer submits requests through the communication channels***



**| PASS |**

---

***In “Update Contact Info,” the customer updates their contact details***



**| PASS |**

---

***In the customer portal, canceled accounts are not accessible, and accounts with a paid-off status are view-only, as expected***

![Screenshot_at_Dec_16_16-05-29](/uploads/bbb67a276660ad8bd8666afc0470bbf4/Screenshot_at_Dec_16_16-05-29.png){width=900 height=114}
![Screenshot_at_Dec_16_16-06-10](/uploads/449a94ac2464fb59c8ab48efa4ac4ded/Screenshot_at_Dec_16_16-06-10.png){width=228 height=290}
![Screenshot_at_Dec_16_16-06-42](/uploads/9827ac5d3f06bcd506effb29b6521366/Screenshot_at_Dec_16_16-06-42.png){width=900 height=446}
![Screenshot_at_Dec_16_16-06-54](/uploads/1ec958a57bed3c69aa9f4b4d7265df17/Screenshot_at_Dec_16_16-06-54.png){width=900 height=442}

---

***Customer eligible for the protection plan for a Kornerstone account.***

![image](/uploads/d0633dec2f8eac27576931b41c57999f/image.png){width=900 height=425}
![image](/uploads/7d0d472ead54f028529d7a07fadf84e9/image.png){width=900 height=483}

**| PASS |**

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------