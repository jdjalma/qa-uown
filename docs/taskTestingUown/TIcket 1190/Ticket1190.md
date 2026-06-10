---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1190

UOWN | Origination | Credit Card BIN Validation & Revalidation


Synopsis
Support BIN validation and revalidation during the payment step to ensure card eligibility while preserving the customer’s approval state and application flow.

Business Objective
This change prevents unnecessary approval loss and customer drop-off when a credit card fails during payment.
It enforces BIN eligibility consistently while allowing customers to recover from card errors without restarting the application or triggering hard declines.

Feature Request | Business Requirements


Initial BIN Validation
      The system must validate the credit card BIN used during payment against eligibility rules.
      If a BIN was captured earlier in the application, the BIN entered during payment must be consistent.


BIN Revalidation During Payment



        
      If the initial card fails due to:


        
      NSF

        
      Validation error

        
      Authorization failure



        
      The customer must be allowed to:


        
      Enter a new credit card.

        
      Trigger BIN revalidation for the new card



Revalidation Constraints

BIN revalidation must:


        
      Validate the new card’s BIN eligibility.

        
      
Not:


        
      Revoke an existing approval.

        
      Restart the application flow.

        
      Trigger a hard decline.

        
      Reset underwriting decisions.



Error Handling


If the new card BIN is not eligible:


        
      Display a clear, user-friendly message explaining the issue.

        
      Sample: “We couldn’t process this card. Please try another card to continue. Your approval is not affected.”


        
      Allow the customer to correct the card details when applicable.





Expected Result



        
      Customers can replace a failed card without losing approval.

        
      BIN eligibility rules remain enforced.

        
      Application state and underwriting decisions are preserved.

        
      Conversion and customer experience are protected.

Steps to Reproduce – Credit Card BIN Validation & Revalidation


Scenario 1 – BIN mismatch: different card at payment shows error

Preconditions: Application flow available (e.g. dev/sandbox). User can complete Send Application and reach the payment step.
Steps:


        
      
Start a new application and go through the steps until the Employment and Financial Information (or equivalent) step where the optional Credit Card BIN (6 digits) field is shown.


        
      
Enter exactly 6 digits in the Credit Card BIN field (e.g. 123456). Complete and submit the application (Send Application / Submit).


        
      
Wait for approval (or use data/flow that leads to the payment step).


        
      
On the Complete Application / Payment step, enter full credit card details for a card whose first 6 digits are different from the BIN entered in step 2 (e.g. use a card starting with 654321).


        
      
Click Submit (or the button that triggers card authorization and submit).


Expected result:

A toast/error message is shown with wording similar to:

"Please use the same card you used when you submitted your application."
(or the backend message returned for BIN mismatch, e.g. from error in CCTransactionInfo.)


        
      
The user remains on the payment form (no redirect to declined/error page, no reload that loses approval).


        
      
The user can change the card and submit again.




Scenario 2 – BIN match: same BIN at payment allows flow to continue

Preconditions: Same as Scenario 1.
Steps:


        
      
Start a new application and go to the step that has the optional Credit Card BIN (6 digits) field.


        
      
Enter exactly 6 digits in the Credit Card BIN field (e.g. 123456) and complete Send Application (Submit).


        
      
Reach the Complete Application / Payment step.


        
      
Enter full credit card details for a card whose first 6 digits are the same as the BIN from step 2 (e.g. card number starting with 123456).


        
      
Click Submit.


Expected result:


        
      
No BIN mismatch error is shown.


        
      
The flow continues as normal (e.g. success toast, redirect to signing/next step, or expected behavior for a successful authorization and submit).




Scenario 3 – No BIN in application: payment accepts any card (no BIN validation)

Preconditions: Same as Scenario 1.
Steps:


        
      
Start a new application and go to the step that has the optional Credit Card BIN (6 digits) field.


        
      
Leave the Credit Card BIN field empty (do not enter any digits). Complete and submit the application (Send Application / Submit).


        
      
Reach the Complete Application / Payment step.


        
      
Enter full credit card details for any valid test card (any first 6 digits).


        
      
Click Submit.


Expected result:


        
      
No BIN validation is applied (backend does not enforce BIN when lead credit card bin is null/blank).


        
      
The flow continues normally (e.g. success and next step) as long as the card is otherwise valid; no “use the same card” error.



Notes for QA


        
      
BIN = first 6 digits of the card number. Use test cards that allow you to control the first 6 digits (e.g. test card numbers per environment).


        
      
Scenario 1 and 2 use the same BIN in Send Application; only the card at payment changes (different vs same first 6 digits).


        
      
Scenario 3 confirms that when BIN was not provided, the payment step does not block or message based on BIN.





---------------------------------------------------------------------------------------------------------------------------------------------------------



Segue o texto em português conforme solicitado:

---

**UOWN | Origination | Validação e Revalidação de BIN do Cartão de Crédito**

**Sinopse**  
Suporte à validação e revalidação do BIN durante a etapa de pagamento para garantir a elegibilidade do cartão, preservando o estado de aprovação e o fluxo da aplicação.

**Objetivo de Negócio**  
Essa mudança evita perda desnecessária de aprovações e abandono do cliente quando um cartão falha no pagamento. Ela impõe a elegibilidade do BIN de forma consistente, permitindo que clientes se recuperem de erros de cartão sem reiniciar a aplicação nem gerar recusas definitivas.

**Requisito de Funcionalidade / Regras de Negócio**

**Validação inicial de BIN**
- O sistema deve validar o BIN do cartão de crédito usado no pagamento conforme regras de elegibilidade.
- Se um BIN foi capturado anteriormente na aplicação, o BIN informado no pagamento deve ser consistente.

**Revalidação de BIN durante o pagamento**
- Se o cartão inicial falhar por:  
  - NSF (fundos insuficientes)  
  - Erro de validação  
  - Falha de autorização  
- O cliente deve poder:  
  - Informar um novo cartão de crédito  
  - Disparar a revalidação de BIN para o novo cartão  

**Restrições de Revalidação**
- A revalidação de BIN deve:  
  - Validar a elegibilidade do BIN do novo cartão.  
- Não deve:  
  - Revogar uma aprovação existente.  
  - Reiniciar o fluxo da aplicação.  
  - Disparar uma recusa definitiva (“hard decline”).  
  - Resetar decisões de underwriting.

**Tratamento de Erros**
- Se o BIN do novo cartão não for elegível:  
  - Exibir mensagem clara e amigável explicando o problema.  
    - Exemplo: “Não conseguimos processar este cartão. Tente outro para continuar. Sua aprovação não foi afetada.”  
  - Permitir que o cliente corrija os dados do cartão quando aplicável.

**Resultado Esperado**
- Clientes podem trocar um cartão que falhou sem perder a aprovação.
- As regras de elegibilidade de BIN permanecem aplicadas.
- Estado da aplicação e decisões de underwriting são preservados.
- Conversão e experiência do cliente são protegidas.

**Passos para Reproduzir – Validação & Revalidação de BIN do Cartão de Crédito**

**Cenário 1 – BIN diferente no pagamento exibe erro**  
Precondições: fluxo de aplicação disponível (ex.: dev/sandbox). Usuário consegue completar “Enviar Aplicação” e chegar ao passo de pagamento.  
Passos:
1) Iniciar nova aplicação e avançar até o passo de Informações de Emprego e Financeiras (ou equivalente) onde o campo opcional “BIN do Cartão de Crédito” (6 dígitos) é exibido.  
2) Digitar exatamente 6 dígitos no campo de BIN (ex.: 123456). Concluir e enviar a aplicação.  
3) Aguardar aprovação (ou usar dados/fluxo que levem ao passo de pagamento).  
4) No passo “Concluir Aplicação / Pagamento”, inserir dados completos de um cartão cujo BIN (primeiros 6 dígitos) seja diferente do informado no passo 2 (ex.: cartão iniciando em 654321).  
5) Clicar em “Enviar” (ou botão que dispara autorização/submissão).  

Resultado esperado:  
- Exibir um toast/erro com texto similar a: “Use o mesmo cartão que você informou ao enviar sua aplicação.” (ou mensagem de backend para BIN divergente, p.ex. erro em CCTransactionInfo).  
- O usuário permanece no formulário de pagamento (sem redirecionar para página de recusa/erro, sem reload que perca a aprovação).  
- O usuário pode trocar o cartão e enviar novamente.

**Cenário 2 – BIN igual no pagamento permite continuar**  
Precondições: mesmas do Cenário 1.  
Passos:
1) Iniciar nova aplicação e ir até o passo com o campo opcional de BIN (6 dígitos).  
2) Digitar exatamente 6 dígitos no campo de BIN (ex.: 123456) e concluir o envio da aplicação.  
3) Chegar ao passo “Concluir Aplicação / Pagamento”.  
4) Inserir dados completos de cartão cujo BIN (primeiros 6 dígitos) seja igual ao do passo 2 (ex.: começando com 123456).  
5) Clicar em “Enviar”.  

Resultado esperado:  
- Nenhum erro de divergência de BIN é exibido.  
- O fluxo continua normalmente (toast de sucesso, redirecionamento para assinatura/próximo passo, ou comportamento esperado para autorização bem-sucedida).

**Cenário 3 – Sem BIN na aplicação: pagamento aceita qualquer cartão (sem validação de BIN)**  
Precondições: mesmas do Cenário 1.  
Passos:
1) Iniciar nova aplicação e ir ao passo com o campo opcional de BIN (6 dígitos).  
2) Deixar o campo de BIN vazio (não digitar nada). Concluir e enviar a aplicação.  
3) Chegar ao passo “Concluir Aplicação / Pagamento”.  
4) Inserir dados completos de qualquer cartão de teste válido (quaisquer primeiros 6 dígitos).  
5) Clicar em “Enviar”.  

Resultado esperado:  
- Nenhuma validação de BIN é aplicada (backend não aplica BIN quando o BIN do lead está nulo/vazio).  
- O fluxo continua normalmente (sucesso e próximo passo), desde que o cartão seja válido; não há erro “use o mesmo cartão”.

**Notas para QA**
- BIN = primeiros 6 dígitos do número do cartão. Use cartões de teste que permitam controlar esses 6 dígitos.  
- Cenários 1 e 2 usam o mesmo BIN no envio da aplicação; apenas o cartão no pagamento muda (diferente vs. igual).  
- Cenário 3 confirma que, quando o BIN não foi informado, o passo de pagamento não bloqueia nem exibe mensagem baseada em BIN.



---------------------------------------------------------------------------------------------------------------------------------------------------------


---

### Scenario 1: BIN Divergente no Pagamento Exibe Erro e Mantém Aprovação

```markdown
- Given que uma aplicação foi submetida com BIN do cartão "123456"
- And que a aplicação foi aprovada e chegou à etapa de pagamento
- When o formulário de pagamento é submetido com cartão iniciando com BIN "654321"
- Then uma mensagem de erro de divergência de BIN é exibida
- And a mensagem de erro indica para usar o mesmo cartão da aplicação
- And o cliente permanece no formulário de pagamento
- And o estado de aprovação é preservado
- And o cliente pode inserir outro cartão e tentar novamente
- And a mensagem de erro esperada é "Por favor, use o mesmo cartão que você usou ao submeter sua aplicação."
```

Examples:
| ApplicationBIN | PaymentBIN | Resultado |
| -------------- | ---------- | --------- |
| 123456         | 654321     | deve      |


Screenshot

**PASS**

---

### Scenario 2: BIN Correspondente no Pagamento Permite Continuação do Fluxo

```markdown
- Given que uma aplicação foi submetida com BIN do cartão "123456"
- And que a aplicação foi aprovada e chegou à etapa de pagamento
- When o formulário de pagamento é submetido com cartão iniciando com BIN "123456"
- Then nenhum erro de validação de BIN é exibido
- And a autorização do pagamento prossegue normalmente
- And o fluxo da aplicação continua para a próxima etapa
- And o cliente é redirecionado para a etapa de assinatura ou conclusão
```


Screenshot

**PASS**

---

### Scenario 3: BIN Não Capturado na Aplicação Não Aplica Validação no Pagamento

```markdown
- Given que uma aplicação foi submetida com o campo BIN do cartão deixado vazio
- And que a aplicação foi aprovada e chegou à etapa de pagamento
- When o formulário de pagamento é submetido com qualquer BIN de cartão válido
- Then nenhuma validação de BIN é aplicada
- And a autorização do pagamento prossegue sem restrições de BIN
- And o fluxo da aplicação continua normalmente
```


Screenshot

**PASS**

---

### Scenario 4: Falha na Autorização Permite Trocar Cartão e Revalidar BIN sem Revogar Aprovação

```markdown
- Given que uma aplicação foi submetida e aprovada
- And que a aplicação chegou à etapa de pagamento
- And que a autorização inicial do cartão falhou 
- When o cliente insere um novo cartão 
- Then o cliente tem permissão para inserir um novo cartão de crédito
- And a revalidação de BIN é acionada para o novo cartão
- And o estado de aprovação é preservado
- And o fluxo da aplicação não é reiniciado
- And as decisões de underwriting são preservadas
```


Screenshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in sandbox

---
### Scenario 1: BIN Mismatch During Payment Shows Error and Preserves Approval
```markdown
- Given an application was submitted with card BIN "123456"
- And the application was approved and reached the payment step
- When the payment form is submitted with a card starting with BIN "654321"
- Then a BIN mismatch error message is displayed
- And the error message instructs the customer to use the same card as the application
- And the customer remains on the payment form
- And the approval state is preserved
- And the customer can enter another card and try again
- And the expected error message is "Please use the same card you used when submitting your application."
```

![Screenshot_at_Feb_16_05-22-18](/uploads/10d1609245c7251e624bc7b81ecfa085/Screenshot_at_Feb_16_05-22-18.png){width=900 height=446}
![Screenshot_at_Feb_16_05-23-22](/uploads/2be33ae59a629b11ec8683e01cd9ee6d/Screenshot_at_Feb_16_05-23-22.png){width=900 height=235}

**PASS**

---
### Scenario 2: Matching BIN During Payment Allows the Flow to Continue
```markdown
- Given an application was submitted with card BIN "123456"
- And the application was approved and reached the payment step
- When the payment form is submitted with a card starting with BIN "123456"
- Then no BIN validation error is displayed
- And the payment authorization proceeds normally
- And the application flow continues to the next step
- And the customer is redirected to the signature or completion step
```

![Screenshot_at_Feb_16_05-40-06](/uploads/0e218864c5a658282ef705060126d513/Screenshot_at_Feb_16_05-40-06.png){width=704 height=206}
![Screenshot_at_Feb_16_05-44-30](/uploads/31d4ee928341c0576c3548b29bec5e23/Screenshot_at_Feb_16_05-44-30.png){width=898 height=600}
![Screenshot_at_Feb_16_05-47-56](/uploads/cde5ca7dcdda95d4e6902e0e606fefa2/Screenshot_at_Feb_16_05-47-56.png){width=900 height=57}
![Screenshot_at_Feb_16_05-48-58](/uploads/5a61ecf1d9ea00668fa3b2fea7b1e297/Screenshot_at_Feb_16_05-48-58.png){width=900 height=311}

**PASS**

---
### Scenario 3: No BIN Captured on Application Applies No BIN Validation at Payment
```markdown
- Given an application was submitted with the card BIN field left empty
- And the application was approved and reached the payment step
- When the payment form is submitted with any valid card BIN
- Then no BIN validation is applied
- And the payment authorization proceeds with no BIN restrictions
- And the application flow continues normally
```

**PASS**

---
### Scenario 4: Authorization Failure Allows Card Retry and Revalidates BIN Without Revoking Approval
```markdown
* Given an application was submitted and approved
* And the application reached the payment step
* And the initial card authorization failed
* When the customer enters a new card
* Then the customer is allowed to enter a new credit card
* And BIN revalidation is triggered for the new card
* And the approval state is preserved
* And the application flow is not restarted
* And underwriting decisions are preserved
```

**PASS**

---






---------------------------------------------------------------------------------------------------------------------------------------------------------