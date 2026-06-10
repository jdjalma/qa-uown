--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/432

UOWN | SVC| Semi monthly frequency custom dates


Testing instructions:


Pick a uown account and change the frequency in servicing section to SEMI MONTHLY and then sekect the first date and second date in the servicing information section to any 2 dates of a month, like 5,20, 1,15 or 15,30. Save. Check that the due amounts reflect this schedule. The first date will be the first payment due date in the due amounts.

Repeat for a kornerstone account

--------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | SVC | Datas personalizadas para frequência Semi-Monthly

### Instruções de Teste

1. Selecione uma conta **UOWN** existente.
2. Acesse a seção **Servicing** da conta.
3. Altere a **frequência de pagamento** para **SEMI-MONTHLY**.
4. Na seção **Servicing Information**, selecione a **primeira** e a **segunda data** de pagamento dentro de um mesmo mês.

   * Exemplos válidos: 5 e 20, 1 e 15, ou 15 e 30.
5. Salve as alterações.
6. Verifique se os **valores devidos (Due Amounts)** refletem corretamente o cronograma configurado.

   * A **primeira data selecionada** deve corresponder à **primeira data de vencimento** exibida em *Due Amounts*.
7. Repita todo o procedimento utilizando uma conta **Kornerstone**.

### Resultado Esperado

* O sistema deve calcular e exibir corretamente os valores devidos com base nas duas datas configuradas para a frequência **Semi-Monthly**.
* A ordem e os vencimentos devem respeitar a primeira e a segunda data selecionadas.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

Perfeito. Abaixo está a **versão enxuta**, **sem cenários duplicados ou redundantes**, mantendo **cobertura completa do comportamento relevante** para a task 432.

Critérios usados para consolidação:

* Unifiquei cenários que validavam o **mesmo efeito de cálculo**
* Mantive **um cenário-base**, **um cenário com data passada** e **um cenário de paridade Kornerstone**
* Preservei apenas validações **distintas em regra/comportamento**

---

## Feature: UOWN | SVC | Datas personalizadas para frequência Semi-Monthly

### Contexto

```gherkin
Given que existe uma conta ativa com contrato válido
And a seção Servicing está disponível
```

---

### Scenario: Recalcular parcelas ao definir Semi-Monthly com datas futuras (UOWN)

```gherkin
Scenario: Recalcular parcelas ao definir Semi-Monthly com datas futuras
  Given uma conta UOWN ativa
  And a data atual é anterior às datas configuradas
  When o usuário altera a frequência de pagamento para SEMI-MONTHLY
   And define a primeira data como 15
   And define a segunda data como 30
   And salva as alterações
  Then os Due Amounts devem ser recalculados conforme o novo cronograma
   And a primeira data configurada deve ser o próximo vencimento
   And o valor total do contrato deve permanecer inalterado
```

---

### Scenario: Abater valores pagos ao definir primeira data anterior à data atual (UOWN)

```gherkin
Scenario: Abater valores pagos quando a primeira data é anterior à data atual
  Given uma conta UOWN com pagamentos já realizados
  And a data atual é posterior à primeira data configurada
  When o usuário altera a frequência de pagamento para SEMI-MONTHLY
   And define a primeira data como 5
   And define a segunda data como 20
   And salva as alterações
  Then os Due Amounts devem ser recalculados
   And a parcela com data anterior deve ser considerada quitada ou parcialmente quitada
   And os valores pagos devem ser corretamente abatidos
   And o valor total do contrato deve permanecer consistente
```

---

### Scenario: Recalcular parcelas Semi-Monthly para conta Kornerstone

```gherkin
Scenario: Recalcular parcelas Semi-Monthly para conta Kornerstone
  Given uma conta Kornerstone ativa
  When o usuário altera a frequência de pagamento para SEMI-MONTHLY
   And define duas datas válidas no mês
   And salva as alterações
  Then os Due Amounts devem ser recalculados corretamente
   And a primeira data configurada deve ser o primeiro vencimento
   And o comportamento deve ser consistente com contas UOWN
```

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---

### Scenario: Recalculate installments when setting Semi-Monthly with future dates (UOWN)

```gherkin

Scenario: Recalculate installments when setting Semi-Monthly with future dates
  Given an active UOWN account
  And the current date is before the configured dates
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets the first date to 15
   And sets the second date to 30
   And saves the changes
  Then the Due Amounts must be recalculated according to the new schedule
   And the first configured date must be the next due date
   And the total contract amount must remain unchanged

```
![Screenshot_at_Jan_12_13-03-25](/uploads/4f0977c67516195d2575f283ccbe968f/Screenshot_at_Jan_12_13-03-25.png){width=613 height=600}

![Screenshot_at_Jan_12_13-03-51](/uploads/8ab617da999cdf3424667d9e3493d31c/Screenshot_at_Jan_12_13-03-51.png){width=900 height=469}

![Screenshot_at_Jan_12_13-04-27](/uploads/6294ec421dbb52d9d674a48bd2c20cb2/Screenshot_at_Jan_12_13-04-27.png){width=611 height=600}

![Screenshot_at_Jan_12_13-05-15](/uploads/59c744b23ecd2cf3d56fbe01eead8577/Screenshot_at_Jan_12_13-05-15.png){width=659 height=600}

![Screenshot_at_Jan_12_13-05-45](/uploads/7d2ddb2870bb364d70df2847a76b4619/Screenshot_at_Jan_12_13-05-45.png){width=900 height=469}

**| PASS |**

**| LeadPk: 10518 |**

**| AccountPk: 4322 |**


---

### Scenario: Apply paid amounts when the first date is prior to the current date (UOWN)

```gherkin
Scenario: Apply paid amounts when the first date is prior to the current date
  Given a UOWN account with existing payments
  And the current date is after the first configured date
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets the first date to 5
   And sets the second date to 20
   And saves the changes
  Then the Due Amounts must be recalculated
   And the installment with a past due date must be considered paid or partially paid
   And paid amounts must be correctly applied
   And the total contract amount must remain consistent

```
![Screenshot_at_Jan_12_13-36-27](/uploads/2675e9ae73e7a24d19ed03f46286580d/Screenshot_at_Jan_12_13-36-27.png){width=900 height=468}

![Screenshot_at_Jan_12_13-38-56](/uploads/25cc872f791e2f1a09e8128af78f6883/Screenshot_at_Jan_12_13-38-56.png){width=709 height=600}

![Screenshot_at_Jan_12_13-39-58](/uploads/eb9d6fb613f74d6e552d86216ec3f000/Screenshot_at_Jan_12_13-39-58.png){width=900 height=475}

**| PASS |**

**| LeadPk: 10520 |**

**| AccountPk: 4324 |**

---

### Scenario: Recalculate Semi-Monthly installments for a Kornerstone account

```gherkin
Scenario: Recalculate Semi-Monthly installments for a Kornerstone account
  Given an active Kornerstone account
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets two valid dates within the month
   And saves the changes
  Then the Due Amounts must be recalculated correctly
   And the first configured date must be the first due date
   And the behavior must be consistent with UOWN accounts

```
![Screenshot_at_Jan_12_13-21-37](/uploads/52d876bbdd3edf58274a3b3ec1988f20/Screenshot_at_Jan_12_13-21-37.png){width=663 height=600}

![Screenshot_at_Jan_12_13-22-32](/uploads/df94b470240efd0e9127d8a5f92da687/Screenshot_at_Jan_12_13-22-32.png){width=900 height=469}

![Screenshot_at_Jan_12_13-22-57](/uploads/05e300c17af3b58a3ecd7c3fc013513d/Screenshot_at_Jan_12_13-22-57.png){width=701 height=600}

![Screenshot_at_Jan_12_13-23-37](/uploads/ac5d9b255920b65a283ffb5158191571/Screenshot_at_Jan_12_13-23-37.png){width=707 height=600}

![Screenshot_at_Jan_12_13-24-57](/uploads/745fc99e9720e8f7eebb5ed42ece8a6d/Screenshot_at_Jan_12_13-24-57.png){width=900 height=467}

**| PASS |**

**| LeadPk: 10520 |**

**| AccountPk: 4324 |**

---



--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in stg

---

### Scenario: Recalculate installments when setting Semi-Monthly with future dates (KORNERSTONE)

```gherkin

Scenario: Recalculate installments when setting Semi-Monthly with future dates
  Given an active UOWN account
  And the current date is before the configured dates
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets the first date to 15
   And sets the second date to 30
   And saves the changes
  Then the Due Amounts must be recalculated according to the new schedule
   And the first configured date must be the next due date
   And the total contract amount must remain unchanged

```


**| PASS |**

**| LeadPk: 25529 |**

**| AccountPk: 206884 |**


---

### Scenario: Apply paid amounts when the first date is prior to the current date (KORNERSTONE)

```gherkin
Scenario: Apply paid amounts when the first date is prior to the current date
  Given a UOWN account with existing payments
  And the current date is after the first configured date
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets the first date to 5
   And sets the second date to 20
   And saves the changes
  Then the Due Amounts must be recalculated
   And the installment with a past due date must be considered paid or partially paid
   And paid amounts must be correctly applied
   And the total contract amount must remain consistent

```


**| PASS |**

**| LeadPk: 25529 |**

**| AccountPk: 206884 |**

---

### Scenario: Recalculate Semi-Monthly installments for a Uown account

```gherkin
Scenario: Recalculate Semi-Monthly installments for a Kornerstone account
  Given an active Kornerstone account
  When the user changes the payment frequency to SEMI-MONTHLY
   And sets two valid dates within the month
   And saves the changes
  Then the Due Amounts must be recalculated correctly
   And the first configured date must be the first due date
   And the behavior must be consistent with UOWN accounts

```


**| PASS |**

**| LeadPk: 25529 |**

**| AccountPk: 206884 |**

---

