--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/431


---

## 🇺🇸 **English Version**

### **UOWN | SVC | Decouple Account from Merchant Program**

**Objective**
Remove the dependency between the **account** and the **merchant program** after the account has been created.

Once the account exists, changes made to the merchant program — such as **processing fee**, **money factor**, or other financial parameters — must **not** impact the account, even when the **payment frequency** is modified.

**Business Rule**
The account must preserve its original financial values independently of any subsequent merchant program updates.

### **Testing Instructions**

1. Create a new account.
2. In the Origination portal, update the associated merchant program:

   * Change the **processing fee**.
   * Change the **money factor** or other financial parameters.
3. On the existing account, change the **payment frequency** to a different value.
4. Verify the following:

   * The **processing fee** on the account remains unchanged.
   * The **total contract amount** remains unchanged.
   * The account does **not** inherit the updated values from the merchant program.

**Expected Result**
Changing the payment frequency must not trigger any recalculation or update based on the current merchant program configuration.

--------------------------------------------------------------------------------------------------------------------------------------------------------

---

Scenario: Conta permanece financeiramente inalterada após alterações no Merchant Program e na frequência de pagamento
  Given existe uma conta criada com valores financeiros definidos
  When o Merchant Program associado é alterado com novos valores de
       | money factor |
       | pay off discount |
       | epo fee percent |
       | minimum cart amount |
       | max cart amount |
       | dealer discount override |
       | processing fee override |
   And a frequência de pagamento da conta é alterada para
       | Weekly |
       | Bi-weekly |
       | Monthly |
       | Semi-monthly |
  Then a taxa de processamento da conta permanece inalterada
   And o valor total do contrato permanece inalterado
   And a conta não herda valores atualizados do Merchant Program

---

```gherkin
Scenario: Account remains financially unchanged after Merchant Program updates and payment frequency change
  Given an account exists with financial values defined at creation
  When the associated Merchant Program is updated with new values for
       | money factor |
       | pay off discount |
       | epo fee percent |
       | minimum cart amount |
       | max cart amount |
       | dealer discount override |
       | processing fee override |
   And the account payment frequency is changed to
       | Weekly |
       | Bi-weekly |
       | Monthly |
       | Semi-monthly |
  Then the account processing fee remains unchanged
   And the total contract amount remains unchanged
   And the account does not inherit updated values from the Merchant Program
```


--------------------------------------------------------------------------------------------------------------------------------------------------------
## Tests in stg

```gherkin
Scenario: Account remains financially unchanged after Merchant Program updates and payment frequency change
  Given an account exists with financial values defined at creation
  When the associated Merchant Program is updated with new values for
       | money factor |
       | pay off discount |
       | epo fee percent |
       | minimum cart amount |
       | max cart amount |
       | dealer discount override |
       | processing fee override |
   And the account payment frequency is changed to
       | Weekly |
       | Bi-weekly |
       | Monthly |
       | Semi-monthly |
  Then the account processing fee remains unchanged
   And the total contract amount remains unchanged
   And the account does not inherit updated values from the Merchant Program
```

**| PASS |**

**| LeadPk: 25529 |**

**| AccountPk: 206884 |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

OL90260-0001