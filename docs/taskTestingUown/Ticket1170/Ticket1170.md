----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1170

```markdown
# 🇺🇸 English Version

## UOWN | Origination | Add “Delivery Date” Column to the Overview Page Table

**Status:** Open  
**Ticket Created:** 2 weeks ago  
**Created by:** Yuri Araujo  

---

## Ticket

**Title:** UOWN | Origination | Add “Delivery Date” column to the Overview Page table

---

## Synopsis

Add the **Delivery Date** column to the results table at the bottom of the Origination Overview Page, making it available through **Config Columns** and ensuring this information is exportable via the existing **Email CSV** and **Download CSV** features.

---

## Business Objective

Enable the business team to visualize the **Delivery Date** directly in the interface and also have it available in data exports, improving traceability, auditing, and overall lead analysis both inside and outside the system.

---

## Feature Request | Business Requirements

### 1. Make “Delivery Date” column available
- Add the **Delivery Date** column as a selectable option in the **Config Columns** modal.
- The column must **not appear by default**, but must be **user-enableable**.

### 2. Display within the table
- Once enabled, the column must appear in the table following the same patterns as existing configurable columns.
- It must display the corresponding **Delivery Date** value for each lead.

### 3. Exportability (Email CSV / Download CSV)
- The **Delivery Date** data must be included in exports generated through:
  - **Email CSV**
  - **Download CSV**
- Export behavior must follow the existing logic used for other exportable columns.
- No changes to current export rules are required; **Delivery Date** must be treated the same as other columns.

### 4. Standards and consistency
- Column name must be exactly **“Delivery Date”**.
- Must follow the same functional and visual standards as other configurable columns.

---

---

# 🇧🇷 Versão em Português

## UOWN | Origination | Adicionar coluna “Delivery Date” na tabela da Página de Overview

**Status:** Aberto  
**Tíquete criado:** Há 2 semanas  
**Criado por:** Yuri Araujo  

---

## Tíquete

**Título:** UOWN | Origination | Add “Delivery Date” column to the Overview Page table

---

## Sinopse

Adicionar a coluna **Delivery Date** à tabela de resultados localizada na parte inferior da página de **Origination Overview**, tornando-a disponível no **Config Columns** e garantindo que essa informação possa ser exportada por meio das funcionalidades existentes de **Email CSV** e **Download CSV**.

---

## Objetivo de Negócio

Permitir que o time de negócios visualize a **Delivery Date** diretamente na interface e também tenha acesso a essa informação nos arquivos exportados, melhorando a rastreabilidade, auditoria e a análise geral de leads dentro e fora do sistema.

---

## Solicitação de Funcionalidade | Requisitos de Negócio

### 1. Disponibilizar a coluna “Delivery Date”
- Adicionar a coluna **Delivery Date** como uma opção selecionável no modal **Config Columns**.
- A coluna **não deve aparecer por padrão**, mas deve poder ser **habilitada pelo usuário**.

### 2. Exibição na tabela
- Uma vez habilitada, a coluna deve aparecer na tabela seguindo os mesmos padrões das colunas configuráveis existentes.
- Deve exibir o valor correspondente de **Delivery Date** para cada lead.

### 3. Exportação (Email CSV / Download CSV)
- O dado de **Delivery Date** deve ser incluído nas exportações geradas por:
  - **Email CSV**
  - **Download CSV**
- O comportamento de exportação deve seguir a lógica existente para outras colunas exportáveis.
- Não são necessárias alterações nas regras atuais de exportação; a coluna **Delivery Date** deve ser tratada da mesma forma que as demais.

### 4. Padrões e consistência
- O nome da coluna deve ser exatamente **“Delivery Date”**.
- Deve seguir os mesmos padrões funcionais e visuais das outras colunas configuráveis.
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

***The Delivery Date column is being displayed and is configurable; remove the column from the view. When downloading or opening the leads report sent via email, the column is present***

![Screenshot_at_Dec_15_14-58-52](/uploads/971c96bafc598e6b32138cfc214d1143/Screenshot_at_Dec_15_14-58-52.png){width=872 height=99}
![image](/uploads/073deeb520dd3b416183dd75bf0a5517/image.png){width=900 height=396}
![image](/uploads/57ef90e578287916afc7dadcc860b7bc/image.png){width=900 height=214}
![image](/uploads/421744d772698490ba2076edf6d2ba38/image.png){width=826 height=418}
![image](/uploads/74f383b9cf228b34e6f6df7e5001cb91/image.png){width=900 height=404}
![image](/uploads/e79b35c96a14edaf75e158b79bae0f17/image.png){width=900 height=400}

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg

***The Delivery Date column is being displayed and is configurable; remove the column from the view. When downloading or opening the leads report sent via email, the column is present***

![image](/uploads/a0fe276f3e0f6e506c8bd75d7d87b8a8/image.png){width=900 height=466}
![image](/uploads/88f13bd9cf575e7760527bdb961e0738/image.png){width=900 height=384}
![image](/uploads/af96d289e5e96b8ed417b642230d8c4c/image.png){width=900 height=405}
![image](/uploads/270730c9a4218189173640d244ac8e1a/image.png){width=900 height=224}
![image](/uploads/40d5c96827a247e07d5b22ac88bb6111/image.png){width=808 height=382}


**| PASS |**

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------