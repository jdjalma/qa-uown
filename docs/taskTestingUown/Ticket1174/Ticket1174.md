-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1174

```markdown
# UOWN | Origination | Add New Informational Fields to the Merchant Page  
**Status:** Open  
**Ticket created:** 2 weeks ago  
**Author:** Yuri Araujo  

---

## 🇺🇸 English Version

### Overview
The Merchant page must be enhanced with new **informational fields**. These fields are intended **exclusively for database storage** and to improve the **quality and structure of data consumed by Power BI reports**.

**Important:**  
- The new fields **must not** affect business logic, workflows, validations, or system behavior.  
- They are strictly **non-functional, informational inputs**.

---

### Business Objective
Improve the depth, accuracy, and organization of merchant data used in Power BI dashboards and reports, enabling richer analytics and better reporting capabilities.

---

### Business Requirements / Feature Request

#### 1. New Informational Fields

##### A. Referral Partner
- Display position: **To the right of “UOwn Sales Rep Code.”**
- Purpose: **Data storage only**
- Functional impact: **None**

##### B. Referral Fee
- Display position: **To the right of “Platform Fee.”**
- Purpose: **Informational only**
- Functional impact: **None**
- Note: Confirmed during discussion that this is a **Referral Fee (not a percentage)**.

---

#### 2. Layout Adjustments
- Some existing fields will shift downward to accommodate the new fields.
- The implementation **must strictly follow the provided mockups**.
- No assumptions or alternative placements are allowed.

---

#### 3. EPO Flags
Add two new boolean (true/false) fields:

- **EPO 5%**
- **EPO 10%**

**Rules:**
- Purpose: **Database storage only**
- No impact on underwriting, pricing, workflows, or logic
- Position: **Below the category “XXX”**, exactly as defined in the mockup

---

#### 4. Replace “Business Hours” with “General Notes”
- Location: **Right side of the Merchant page**
- Current field: *Business Hours* (unused)
- New label: **GENERAL NOTES**
- Behavior:
  - Simple free-text storage
  - No functional or logical impact
  - Same behavior as the existing field

---

### Discussion Notes
- There was a clarification regarding whether **Referral Fee** was a fixed value or a percentage.
- This was confirmed during a meeting as a **Referral Fee (no %)**.
- Mockups were previously shared and approved to confirm field placement and definition.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


## 🇧🇷 Versão em Português

### Visão Geral
A página de **Merchant** deve receber novos **campos informativos**, destinados **exclusivamente ao armazenamento em banco de dados** e à melhoria da **qualidade dos dados consumidos pelo Power BI**.

**Importante:**  
- Os novos campos **não devem impactar** regras de negócio, fluxos, validações ou comportamento do sistema.  
- São campos **puramente informativos**, sem efeito funcional.

---

### Objetivo de Negócio
Aumentar a profundidade, precisão e organização dos dados de merchants utilizados em dashboards e relatórios do Power BI, permitindo análises mais ricas e detalhadas.

---

### Requisitos de Negócio / Solicitação de Funcionalidade

#### 1. Novos Campos Informativos

##### A. Referral Partner
- Posição: **À direita do campo “UOwn Sales Rep Code”**
- Finalidade: **Apenas armazenamento**
- Impacto funcional: **Nenhum**

##### B. Referral Fee
- Posição: **À direita do campo “Platform Fee”**
- Finalidade: **Apenas informativo**
- Impacto funcional: **Nenhum**
- Observação: Confirmado que se trata de uma **taxa fixa**, e não percentual.

---

#### 2. Ajustes de Layout
- Alguns campos existentes serão deslocados para baixo.
- A implementação deve **seguir exatamente os mockups fornecidos**.
- Não são permitidas suposições ou ajustes não previstos no design.

---

#### 3. Flags de EPO
Adicionar dois campos booleanos (true/false):

- **EPO 5%**
- **EPO 10%**

**Regras:**
- Finalidade: **Somente armazenamento em banco**
- Nenhum impacto em lógica, underwriting ou fluxos
- Posição: **Abaixo da categoria “XXX”**, conforme mockup

---

#### 4. Substituição de “Business Hours” por “General Notes”
- Localização: **Lado direito da página de Merchant**
- Campo atual: *Business Hours* (não utilizado)
- Novo rótulo: **GENERAL NOTES**
- Comportamento:
  - Campo de texto livre
  - Sem impacto em regras de negócio
  - Mesmo comportamento técnico do campo atual

---

### Observações da Discussão
- Houve uma dúvida se o **Referral Fee** seria percentual ou valor fixo.
- A confirmação ocorreu em reunião: **Referral Fee é um valor fixo (sem %)**.
- Os mockups já haviam sido enviados e aprovados para validar posicionamento e definição dos campos.

---
```



-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




> ## Tests in qa2


***Referral Partner***

![image](/uploads/d79138f91bd51b80a489a67420f65ef0/image.png){width=900 height=320}
![Screenshot_at_Dec_15_09-36-19](/uploads/f222faa8f024a92a4d565e14e81c3589/Screenshot_at_Dec_15_09-36-19.png){width=900 height=458}
![Screenshot_at_Dec_15_09-36-53](/uploads/9fdc567e2b4e8beaca76e3b6f3eeb062/Screenshot_at_Dec_15_09-36-53.png){width=900 height=451}
![image](/uploads/f10c729c58efbdf2d9efa8575d133500/image.png){width=900 height=479}
![image](/uploads/fcd3c9f1778cf18e4fb28413e62bb73b/image.png){width=900 height=330}
![image](/uploads/0317617542a643303556c6ad62568bbc/image.png){width=642 height=53}

---

***Referral Fee***

![Screenshot_at_Dec_15_09-50-45](/uploads/98761e07bc9f6b4dcaaf74b07bde52cd/Screenshot_at_Dec_15_09-50-45.png){width=776 height=474}
![Screenshot_at_Dec_15_09-52-11](/uploads/7a52a631b1372a297b2d4cb2aa795c8c/Screenshot_at_Dec_15_09-52-11.png){width=900 height=483}
![Screenshot_at_Dec_15_09-52-57](/uploads/c7db7cdd6b32428467f12aa5dcef2200/Screenshot_at_Dec_15_09-52-57.png){width=900 height=466}
![Screenshot_at_Dec_15_09-53-11](/uploads/4ae5cd633dfe2c4156af13750ffe3784/Screenshot_at_Dec_15_09-53-11.png){width=900 height=30}

---

***Epo 10% and Epo 5%***

![Screenshot_at_Dec_15_09-56-29](/uploads/96aa95d9687bfdeb8df79e2384239ce7/Screenshot_at_Dec_15_09-56-29.png){width=534 height=600}
![Screenshot_at_Dec_15_09-56-39](/uploads/6875f0fcc8abca220668653b989faa55/Screenshot_at_Dec_15_09-56-39.png){width=382 height=128}
![Screenshot_at_Dec_15_10-00-23](/uploads/707beab172e948c7b01f234a8cbfc077/Screenshot_at_Dec_15_10-00-23.png){width=900 height=49}
![Screenshot_at_Dec_15_10-24-58](/uploads/f04d641c954b61e8a3571ac536171a51/Screenshot_at_Dec_15_10-24-58.png){width=900 height=114}
![Screenshot_at_Dec_15_10-25-45](/uploads/5c8940c6ac6c6ca4045f9400466109ef/Screenshot_at_Dec_15_10-25-45.png){width=900 height=336}
![image](/uploads/d2f4cfbcfab5913a8e2f75faf7a4dc6d/image.png){width=900 height=46}

---

***General Notes***

![image](/uploads/73b22a70eca62212b63a63866cc7dec7/image.png){width=378 height=144}
![image](/uploads/c0dc124d05fe8758507ec9088bd2533a/image.png){width=900 height=39}
![Screenshot_at_Dec_15_10-27-17](/uploads/fffdb93364c27cde758d8a4a8472b109/Screenshot_at_Dec_15_10-27-17.png){width=900 height=212}
![Screenshot_at_Dec_15_10-27-51](/uploads/e65e0b02047dc2c9a2cd003759233139/Screenshot_at_Dec_15_10-27-51.png){width=900 height=63}
![image](/uploads/31c6cd0302d1ce5ca6eb74c5c0c91c91/image.png){width=900 height=55}

---



-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg


***Referral Partner***

![image](/uploads/37b35f78350b9d6f015a9446e9c113ff/image.png){width=900 height=456}
![image](/uploads/b5318e3b43aa04647327085bf1db7b89/image.png){width=900 height=308}
![image](/uploads/0a6523d9403089f0072eefceb0053b3a/image.png){width=645 height=56}
![image](/uploads/b1a22facb0da8e1e44ca342fd8299f12/image.png){width=900 height=458}
![image](/uploads/95d4770b3a3cc8df00551839a0209f0f/image.png){width=900 height=443}
![image](/uploads/5134dd46353243955514a11333dc821f/image.png){width=634 height=56}

---

***Referral Fee***

![image](/uploads/377aaeaf54a1bee6e8891f066c401bc8/image.png){width=900 height=65}
![image](/uploads/9c48803cfb7817a575352b320b70446b/image.png){width=900 height=57}
![image](/uploads/5c04c52e7d5d4d285da66de86e8bc3cc/image.png){width=783 height=54}
![image](/uploads/61841d83e7f740454c471fe83a2a4d52/image.png){width=900 height=72}
![image](/uploads/88f564d611c9edd478de21f7afdf8406/image.png){width=900 height=78}

---

***Epo 10% and Epo 5%***

![image](/uploads/00a983bf20261ee46db07ceab4fa42ed/image.png){width=900 height=83}
![image](/uploads/e057ed0d79ea945f7f6d39a841299d8f/image.png){width=900 height=57}
![image](/uploads/5aa442405dffe498380095ce1b07cba1/image.png){width=900 height=58}
![image](/uploads/a825a8e8f105c122ea8c62fc04b94e55/image.png){width=900 height=107}
![image](/uploads/52cc243bb608a07de25ab6e76caa455c/image.png){width=218 height=58}


---

***General Notes***

![image](/uploads/cb6cf7c37fa1a0fc7252fa0201ef10b8/image.png){width=351 height=121}
![image](/uploads/1f69707cbc119d5502b6287f55310558/image.png){width=894 height=107}
![image](/uploads/b2db7213ada769d0bf82473a1db43bbb/image.png){width=900 height=135}
![image](/uploads/cf43306ca7aeb31ef765be6fd3423129/image.png){width=900 height=40}

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------