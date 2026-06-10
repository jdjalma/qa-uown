----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/480


UOWN | Servicing | Add Color Indicators to Credit Card Transaction Statuses in Servicing Portal


Synopsis
As a system user, I want to visually identify the status of credit card transactions by color, so that I can quickly distinguish approved, denied, and error transactions within the CC Transactions page.
In the Servicing Portal, when accessing an account and navigating to CC Transactions through the History menu, users can view the full list of credit card transaction records.
Currently, all transaction statuses are displayed in the same color, which makes it difficult to quickly interpret results.
The system should apply color indicators to improve readability:
Transactions with status = APPROVED should appear in green.
Transactions with status = DENIED or ERROR should appear in red.
All other statuses should remain displayed as they currently are.


Business Objective
Adding visual distinction to transaction statuses will improve usability and efficiency for support and operations teams by allowing them to instantly identify successful or failed transactions without manually reading each status text.


Feature Request | Business Requirements
      Implement color-based visual cues for transaction statuses on the CC Transactions table in the Servicing Portal.
      Apply the following color logic:
            APPROV ED → Display text in green.
            DENIED / ERROR → Display text in red.
            All other statuses → No change (retain current color scheme).


Test instructions
In adition to the requirements in the issue this was also requested

Use red for DENIED, ERROR. Orange for CANCELLED
REFUNDED / PARTIALLY_REFUNDED should be either yellow / blue, whatever looks good aesthetically

Cancelled transactions are the only ones with the strikethought            

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**UOWN | Servicing | Adicionar Indicadores de Cor para Status de Transações de Cartão de Crédito no Portal Servicing**

**Sinopse**
Como usuário do sistema, quero identificar visualmente o status das transações de cartão de crédito por cor, para que eu possa distinguir rapidamente as transações aprovadas, negadas e com erro na página de Transações de Cartão de Crédito.
No Portal Servicing, ao acessar uma conta e navegar até as Transações de Cartão de Crédito no menu de Histórico, os usuários podem visualizar a lista completa de registros de transações de cartão de crédito.
Atualmente, todos os status das transações são exibidos na mesma cor, o que dificulta a interpretação rápida dos resultados.
O sistema deve aplicar indicadores de cor para melhorar a legibilidade:

* Transações com status = APROVADO devem aparecer em verde.
* Transações com status = NEGADO ou ERRO devem aparecer em vermelho.
* Todos os outros status devem permanecer exibidos como estão atualmente.

**Objetivo de Negócio**
Adicionar distinção visual aos status das transações melhorará a usabilidade e a eficiência das equipes de suporte e operações, permitindo que identifiquem rapidamente as transações bem-sucedidas ou falhas, sem a necessidade de ler manualmente o texto de cada status.

**Requisitos da Solicitação de Funcionalidade | Requisitos de Negócio**

* Implementar indicadores visuais baseados em cores para os status das transações na tabela de Transações de Cartão de Crédito no Portal Servicing.
* Aplicar a seguinte lógica de cores:

  * APROVADO → Exibir texto em verde.
  * NEGADO / ERRO → Exibir texto em vermelho.
  * Todos os outros status → Sem alterações (manter o esquema de cores atual).

**Instruções de Teste**
Além dos requisitos descritos no problema, também foi solicitado o seguinte:

* Usar vermelho para NEGADO, ERRO.
* Laranja para CANCELADO.
* REFUNDADO / PARCIALMENTE_REFUNDADO deve ser amarelo ou azul, conforme o que parecer mais esteticamente agradável.
* Transações Canceladas são as únicas que devem ter o texto com o riscado.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 📊 Resumo das Cores:

| Status | Cor | Código Hex | Tipo |
|--------|-----|-----------|------|
| **APPROVED** | 🟢 Verde | `#3a8846` | ✅ Requisitado |
| **DENIED** | 🔴 Vermelho | `#e50000` | ✅ Requisitado |
| **ERROR** | 🔴 Vermelho | `#e50000` | ✅ Requisitado |
| **CANCELLED** | 🟠 Laranja | `#ef8a00` | ➕ Adicionado |
| **REFUNDED** | 🟤 Marrom | `#8a6e03` | ➕ Adicionado |
| **PARTIALLY_REFUNDED** | 🟤 Marrom | `#8a6e03` | ➕ Adicionado |

---

## 🎯 O que o Desenvolvedor Fez ALÉM do Requisitado:

### **1. Requisitos Atendidos:**
- ✅ APPROVED em verde (`#3a8846`)
- ✅ DENIED em vermelho (`#e50000`)
- ✅ ERROR em vermelho (`#e50000`)

### **2. Extras Implementados:**
- ✅ CANCELLED em laranja (`#ef8a00`) com `text-decoration: line-through`
- ✅ REFUNDED em marrom (`#8a6e03`)
- ✅ PARTIALLY_REFUNDED em marrom (`#8a6e03`)

### **3. Melhorias UX:**
- ✅ Adicionada **Legenda** explicando cada cor
- ✅ Hover states (manutenção da cor ao passar mouse)
- ✅ `conditionalRowStyles` aplicado na tabela

---

## 📍 Onde as Cores Aparecem:

### **Frontend (CC Transactions Page):**
```
┌─────────────────────────────────────────┐
│ Credit Card Transactions History        │
├─────────────────────────────────────────┤
│ Transaction | Amount | Status | Date    │
│ TXN001      | $100   | 🟢 APPROVED      │
│ TXN002      | $50    | 🔴 DENIED        │
│ TXN003      | $75    | 🔴 ERROR         │
│ TXN004      | $25    | 🟠 CANCELLED     │
│ TXN005      | $30    | 🟤 REFUNDED      │
└─────────────────────────────────────────┘

Legend:
🔴 Error or Denied
🟢 Approved
🟠 Cancelled
🟤 Refunded/Partially Refunded

---

Here is the translated version in English:

---

## 📊 Color Summary:

| Status                 | Color     | Hex Code  | Type        |
| ---------------------- | --------- | --------- | ----------- |
| **APPROVED**           | 🟢 Green  | `#3a8846` | ✅ Requested |
| **DENIED**             | 🔴 Red    | `#e50000` | ✅ Requested |
| **ERROR**              | 🔴 Red    | `#e50000` | ✅ Requested |
| **CANCELLED**          | 🟠 Orange | `#ef8a00` | ➕ Added     |
| **REFUNDED**           | 🟤 Brown  | `#8a6e03` | ➕ Added     |
| **PARTIALLY_REFUNDED** | 🟤 Brown  | `#8a6e03` | ➕ Added     |

---

## 🎯 What the Developer Did BEYOND the Requested:

### **1. Requirements Met:**

* APPROVED in green (`#3a8846`)
* DENIED in red (`#e50000`)
* ERROR in red (`#e50000`)
* CANCELLED in orange (`#ef8a00`) with `text-decoration: line-through`
* REFUNDED in brown (`#8a6e03`)
* PARTIALLY_REFUNDED in brown (`#8a6e03`)


* Added **Legend** explaining each color
* Hover states (color maintained on mouse hover)
* `conditionalRowStyles` applied in the table

---

## 📍 Where the Colors Appear:

### **Frontend (CC Transactions Page):**

```
┌─────────────────────────────────────────┐
│ Credit Card Transactions History        │
├─────────────────────────────────────────┤
│ Transaction | Amount | Status | Date    │
│ TXN001      | $100   | 🟢 APPROVED      │
│ TXN002      | $50    | 🔴 DENIED        │
│ TXN003      | $75    | 🔴 ERROR         │
│ TXN004      | $25    | 🟠 CANCELLED     │
│ TXN005      | $30    | 🟤 REFUNDED      │
└─────────────────────────────────────────┘

Legend:
🔴 Error or Denied
🟢 Approved
🟠 Cancelled
🟤 Refunded/Partially Refunded
```

-----





> ## Tests in qa1


* APPROVED in green (`#3a8846`)
* DENIED in red (`#e50000`)
* ERROR in red (`#e50000`)
* CANCELLED in orange (`#ef8a00`) with `text-decoration: line-through`
* REFUNDED in brown (`#8a6e03`)
* PARTIALLY_REFUNDED in brown (`#8a6e03`)


* Added **Legend** explaining each color
* Hover states (color maintained on mouse hover)
* `conditionalRowStyles` applied in the table

---

```
┌─────────────────────────────────────────┐
│ Credit Card Transactions History        │
├─────────────────────────────────────────┤
│ Transaction | Amount | Status | Date    │
│ TXN001      | $100   | 🟢 APPROVED      │
│ TXN002      | $50    | 🔴 DENIED        │
│ TXN003      | $75    | 🔴 ERROR         │
│ TXN004      | $25    | 🟠 CANCELLED     │
│ TXN005      | $30    | 🟤 REFUNDED      │
└─────────────────────────────────────────┘

Legend:
🔴 Error or Denied
🟢 Approved
🟠 Cancelled
🟤 Refunded/Partially Refunded

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG


> ## Tests in stg


* APPROVED in green (`#3a8846`)


> ![Screenshot_at_Nov_17_14-00-34](/uploads/179718f42928d8b7b7db63d0d1f51d0e/Screenshot_at_Nov_17_14-00-34.png){width=900 height=416}

---

* DENIED in red (`#e50000`)


> ![Screenshot_at_Nov_17_14-03-25](/uploads/9fa9d0e8b9208b49af57190c5c01819c/Screenshot_at_Nov_17_14-03-25.png){width=900 height=417}

---

* ERROR in red (`#e50000`)


> ![image](/uploads/9704a24f7efd2c0d8f836c458d0930c4/image.png){width=805 height=600}

---

* CANCELLED in orange (`#ef8a00`) with `text-decoration: line-through`


> ![Screenshot_at_Nov_17_14-05-00](/uploads/4798f857479493ef92e3b355611ec0b6/Screenshot_at_Nov_17_14-05-00.png){width=900 height=26}

---

* REFUNDED in brown (`#8a6e03`)

> ![Screenshot_at_Nov_17_14-05-07](/uploads/487519fa31933615624bd1f6ad581bc0/Screenshot_at_Nov_17_14-05-07.png){width=900 height=27}

---

* PARTIALLY_REFUNDED in brown (`#8a6e03`)

> ![Screenshot_at_Nov_17_14-07-01](/uploads/f87e42ceedb52bb781927b27fa8ea827/Screenshot_at_Nov_17_14-07-01.png){width=900 height=25}

---

* Added **Legend** explaining each color
* Hover states (color maintained on mouse hover)
---

```
Legend:
🔴 Error or Denied
🟢 Approved
🟠 Cancelled
🟤 Refunded/Partially Refunded

---


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------