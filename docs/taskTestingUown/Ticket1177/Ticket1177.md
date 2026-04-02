-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1177


# Ticket #1176: Add New Fields to the Merchant Setting Page for Bulk Editing

## 📋 Executive Summary

Replicate the fields added to the Merchant page (ticket #1174) to the Merchant Setting page, enabling bulk editing of merchant information with visual and functional consistency.

---

## 🎯 Business Objective

Ensure that the new fields added to the Merchant page are also available for bulk updates in Merchant Setting, maintaining consistency across both interfaces and allowing business teams to update this information centrally and efficiently.

---

## 📝 Functional Requirements

### 1. Replicate Fields from Ticket #1174
- ✅ All fields listed in ticket #1174 must be added to the Merchant Setting page
- ✅ Fields must follow the same format, appearance, and input behavior used on the Merchant page
- ✅ These fields do not introduce any business logic, they are purely stored in the database

### 2. Support Bulk Editing
- ✅ Fields must be editable using the bulk update functionality already present on Merchant Setting
- ✅ They should appear in the same sections/categories used in Merchant (when applicable)

### 3. Maintain Visual and Functional Consistency
- ✅ Do not alter the existing layout or logic of Merchant Setting
- ✅ Only append the new fields already created in Merchant

---

## 🔧 Fields to Be Added

| Field | Type | Description | Section |
|-------|------|-------------|---------|
| **Referral Partner** | Text | Referral Partner | First row (50/50 with UOwn Sales Rep Code) |
| **Referral Fee** | Percentage | Referral Fee (%) | After EPO section, before Fraud |
| **Epo 10%** | Checkbox | EPO 10% Flag | EPO section (collapsible) |
| **Epo 5%** | Checkbox | EPO 5% Flag | EPO section (collapsible) |
| **General Notes** | Long Text | General Notes (storeTimings) | End of panel (after Funding Reports) |

---

## 📐 Expected Layout

### Field Order (Bulk Settings Panel)

```
1. Sales Rep Code + Referral Partner (first row, 50/50 split)
2. Num Days fields
3. Campaign IDs
4. Merchant Support
5. Status section
6. Requirements section
7. Fee section
8. Status Change section
9. Others section
10. EPO section (collapsible) ← NEW
    - Epo 10% (checkbox)
    - Epo 5% (checkbox)
11. Referral Fee ← NEW
12. Fraud section
13. Funding Reports
14. General Notes ← NEW
```

---

## 🧪 Test Scenarios

### Test 1: Referral Partner Field
**Objective:** Validate addition and update of Referral Partner field

**Steps:**
1. Locate the Settings panel on the right side
2. Verify that "Referral Partner" field appears in the first row, next to "UOwn Sales Rep Code" (50/50 split)
3. Enter a referral partner value (e.g., "PartnerABC")
4. Click Update button
5. Verify that success message appears
6. Validate in database that the selected merchant(s) have the referral partner value updated

**Expected Result:** ✅ Field visible, editable, and persisted in database

---

### Test 2: Referral Fee Field
**Objective:** Validate addition and percentage-to-decimal conversion

**Steps:**
1. Locate "Referral Fee" field (appears after EPO section, before Fraud)
2. Verify that field displays with percentage icon (%) on the right
3. Enter a referral fee value (e.g., "5" for 5%)
4. Click Update button
5. Verify that success message appears
6. Validate in database that the fee was stored as decimal (0.05 for 5% input)

**Expected Result:** ✅ Field visible, correct percentage-to-decimal conversion

---

### Test 3: EPO Section (Collapsible)
**Objective:** Validate addition and functionality of EPO checkboxes

**Steps:**
1. Locate the EPO collapsible section (between "Others" and "Fraud")
2. Verify that the section is collapsible with chevron icon
3. Click to expand EPO section
4. Verify that two checkboxes appear:
   - "Epo 10%"
   - "Epo 5%"
5. Select "Epo 10%" checkbox
6. Click Update button
7. Verify that success message appears
8. Validate in database that epo10 was set to true
9. Repeat steps 5-8 for "Epo 5%"
10. Validate that epo5 was set to true independently

**Expected Result:** ✅ Collapsible section functional, independent checkboxes, values persisted

---

### Test 4: General Notes Field
**Objective:** Validate addition and storage of general notes

**Steps:**
1. Scroll to the bottom of the Settings panel
2. Verify that "General Notes" field appears after Funding Reports section
3. Enter general notes text (e.g., "Test notes for bulk update")
4. Click Update button
5. Verify that success message appears
6. Validate in database that the merchant(s) have the storeTimings value updated

**Expected Result:** ✅ Field visible, editable, and persisted in database

---

### Test 5: Layout Verification
**Objective:** Validate visual consistency between pages

**Steps:**
1. Compare the bulk settings panel layout with individual merchant settings page
2. Verify that field order matches individual page:
   - Sales Rep Code + Referral Partner (first row)
   - Num Days fields
   - Campaign IDs
   - Merchant Support
   - Status section
   - Requirements section
   - Fee section
   - Status Change section
   - Others section
   - EPO section (new)
   - Referral Fee (new)
   - Fraud section
   - Funding Reports
   - General Notes (new, at end)
3. Verify that all collapsible sections use same styling and behavior

**Expected Result:** ✅ Consistent layout between both pages

---

### Test 6: Bulk Update with Multiple Fields
**Objective:** Validate bulk editing of all new fields

**Steps:**
1. Select multiple merchants (3-5 merchants)
2. Fill in all new fields:
   - Referral Partner: "TestPartner"
   - Referral Fee: "10"
   - Epo 10%: checked
   - General Notes: "Bulk update test"
3. Click Update button
4. Verify that success message appears
5. Validate that all selected merchants have all fields updated correctly
6. Verify that each merchant's individual record reflects the bulk update values

**Expected Result:** ✅ All fields updated correctly across all selected merchants

---

### Test 7: Field Validation
**Objective:** Validate field validation behavior and optional fields

**Steps:**
1. Test Referral Fee with invalid values:
   - Enter negative number
   - Enter non-numeric text
2. Verify that appropriate validation/error handling occurs
3. Test General Notes with long text (1000+ characters)
4. Verify that field accepts and saves long text
5. Leave all new fields empty and update
6. Verify that update succeeds (fields are optional)

**Expected Result:** ✅ Appropriate validation, optional fields work correctly

---

### Test 8: Comparison with Individual Merchant Page
**Objective:** Validate consistency with individual merchant page

**Steps:**
1. Navigate to an individual merchant page (Origination → Merchant → [Merchant Code])
2. Compare the Settings panel layout
3. Verify that all fields present in bulk page are also present in individual page
4. Verify that field labels, types, and positions match between both pages

**Expected Result:** ✅ All fields present with matching labels, types, and positions

---

## 📊 Test Coverage Matrix

| Test | Referral Partner | Referral Fee | EPO Flags | General Notes | Layout | Validation |
|------|------------------|--------------|-----------|---------------|--------|-----------|
| 1 | ✅ | - | - | - | - | - |
| 2 | - | ✅ | - | - | - | - |
| 3 | - | - | ✅ | - | - | - |
| 4 | - | - | - | ✅ | - | - |
| 5 | - | - | - | - | ✅ | - |
| 6 | ✅ | ✅ | ✅ | ✅ | - | - |
| 7 | - | ✅ | - | ✅ | - | ✅ |
| 8 | ✅ | ✅ | ✅ | ✅ | ✅ | - |

---

## 🔍 Acceptance Criteria

- ✅ All 5 new fields appear on the Merchant Setting page
- ✅ Fields follow the same format and appearance as Merchant page
- ✅ Bulk editing works for all fields
- ✅ Values are correctly persisted in database
- ✅ Percentage-to-decimal conversion works for Referral Fee
- ✅ EPO section is collapsible and checkboxes are independent
- ✅ Fields are optional (can be left empty)
- ✅ Layout is consistent between individual and bulk pages
- ✅ Appropriate validation for numeric fields
- ✅ All 8 tests pass successfully

---

## 📌 Important Notes

1. **Optional Fields:** All new fields are optional and can be left empty
2. **No Business Logic:** These fields serve only for database storage
3. **Percentage Conversion:** Referral Fee should convert percentage input (5) to decimal (0.05)
4. **Collapsible Section:** EPO must be a collapsible section with chevron icon
5. **Visual Consistency:** All fields must follow the same styling as Merchant page

---

## 🚀 Implementation Status

- **Status:** To Do
- **Assignee:** Fernando Martins
- **Priority:** Low
- **Type:** Business Request
- **Workflow:** Ready for QA

---

## 📎 References

- **Related Ticket:** #1174 (Merchant page fields)
- **Merge Request:** !1344 (Merged)
- **Parent Epic:** uown#14
- **Milestone:** Uown | RU01.26.1.48.0

---

**Last Updated:** December 22, 2025
**Version:** 1.0 EN


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# Ticket #1176: Adicionar Novos Campos à Página de Configurações de Comerciante para Edição em Massa

## 📋 Resumo Executivo

Replicar os campos adicionados ao Merchant page (ticket #1174) para a página de Configurações de Comerciante (Merchant Setting), permitindo edição em massa de informações de comerciantes com consistência visual e funcional.

---

## 🎯 Objetivo de Negócio

Garantir que os novos campos adicionados à página de Comerciante estejam também disponíveis para atualizações em massa na página de Configurações de Comerciante, mantendo consistência entre ambas as interfaces e permitindo que equipes de negócio atualizem essas informações de forma centralizada e eficiente.

---

## 📝 Requisitos Funcionais

### 1. Replicar Campos do Ticket #1174
- ✅ Todos os campos listados no ticket #1174 devem ser adicionados à página de Configurações de Comerciante
- ✅ Os campos devem seguir o mesmo formato, aparência e comportamento de entrada usados na página de Comerciante
- ✅ Esses campos não introduzem lógica de negócio, apenas armazenamento em banco de dados

### 2. Suportar Edição em Massa
- ✅ Os campos devem ser editáveis usando a funcionalidade de atualização em massa já presente em Configurações de Comerciante
- ✅ Devem aparecer nas mesmas seções/categorias usadas em Merchant (quando aplicável)

### 3. Manter Consistência Visual e Funcional
- ✅ Não alterar o layout ou lógica existente de Configurações de Comerciante
- ✅ Apenas adicionar os novos campos já criados em Merchant

---

## 🔧 Campos a Serem Adicionados

| Campo | Tipo | Descrição | Seção |
|-------|------|-----------|-------|
| **Referral Partner** | Texto | Parceiro de Referência | Primeira linha (50/50 com UOwn Sales Rep Code) |
| **Referral Fee** | Percentual | Taxa de Referência (%) | Após seção EPO, antes de Fraude |
| **Epo 10%** | Checkbox | Flag EPO 10% | Seção EPO (colapsível) |
| **Epo 5%** | Checkbox | Flag EPO 5% | Seção EPO (colapsível) |
| **General Notes** | Texto Longo | Notas Gerais (storeTimings) | Final do painel (após Funding Reports) |

---

## 📐 Layout Esperado

### Ordem dos Campos (Bulk Settings Panel)

```
1. Sales Rep Code + Referral Partner (primeira linha, 50/50)
2. Num Days fields
3. Campaign IDs
4. Merchant Support
5. Status section
6. Requirements section
7. Fee section
8. Status Change section
9. Others section
10. EPO section (colapsível) ← NOVO
    - Epo 10% (checkbox)
    - Epo 5% (checkbox)
11. Referral Fee ← NOVO
12. Fraud section
13. Funding Reports
14. General Notes ← NOVO
```

---

## 🧪 Cenários de Teste

### Teste 1: Campo Referral Partner
**Objetivo:** Validar adição e atualização do campo Referral Partner

**Passos:**
1. Localizar o painel Settings no lado direito
2. Verificar se o campo "Referral Partner" aparece na primeira linha, ao lado de "UOwn Sales Rep Code" (divisão 50/50)
3. Inserir um valor de parceiro de referência (ex: "PartnerABC")
4. Clicar no botão Update
5. Verificar se mensagem de sucesso aparece
6. Validar no banco de dados que o(s) comerciante(s) selecionado(s) teve(ram) o valor atualizado

**Resultado Esperado:** ✅ Campo visível, editável e persistido no banco de dados

---

### Teste 2: Campo Referral Fee
**Objetivo:** Validar adição e conversão de percentual para decimal

**Passos:**
1. Localizar o campo "Referral Fee" (aparece após seção EPO, antes de Fraude)
2. Verificar se o campo exibe com ícone de percentual (%) à direita
3. Inserir um valor de taxa de referência (ex: "5" para 5%)
4. Clicar no botão Update
5. Verificar se mensagem de sucesso aparece
6. Validar no banco de dados que a taxa foi armazenada como decimal (0.05 para entrada 5%)

**Resultado Esperado:** ✅ Campo visível, conversão correta de percentual para decimal

---

### Teste 3: Seção EPO (Colapsível)
**Objetivo:** Validar adição e funcionamento dos checkboxes EPO

**Passos:**
1. Localizar a seção EPO colapsível (entre "Others" e "Fraud")
2. Verificar se a seção é colapsível com ícone de chevron
3. Clicar para expandir a seção EPO
4. Verificar se dois checkboxes aparecem:
   - "Epo 10%"
   - "Epo 5%"
5. Selecionar checkbox "Epo 10%"
6. Clicar no botão Update
7. Verificar se mensagem de sucesso aparece
8. Validar no banco de dados que epo10 foi definido como true
9. Repetir passos 5-8 para "Epo 5%"
10. Validar que epo5 foi definido como true independentemente

**Resultado Esperado:** ✅ Seção colapsível funcional, checkboxes independentes, valores persistidos

---

### Teste 4: Campo General Notes
**Objetivo:** Validar adição e armazenamento de notas gerais

**Passos:**
1. Rolar até o final do painel Settings
2. Verificar se o campo "General Notes" aparece após a seção Funding Reports
3. Inserir texto de notas gerais (ex: "Notas de teste para atualização em massa")
4. Clicar no botão Update
5. Verificar se mensagem de sucesso aparece
6. Validar no banco de dados que o(s) comerciante(s) teve(ram) o valor de storeTimings atualizado

**Resultado Esperado:** ✅ Campo visível, editável e persistido no banco de dados

---

### Teste 5: Verificação de Layout
**Objetivo:** Validar consistência visual entre páginas

**Passos:**
1. Comparar o layout do painel de configurações em massa com a página de configurações de comerciante individual
2. Verificar se a ordem dos campos corresponde à página individual:
   - Sales Rep Code + Referral Partner (primeira linha)
   - Num Days fields
   - Campaign IDs
   - Merchant Support
   - Status section
   - Requirements section
   - Fee section
   - Status Change section
   - Others section
   - EPO section (novo)
   - Referral Fee (novo)
   - Fraud section
   - Funding Reports
   - General Notes (novo, no final)
3. Verificar se todas as seções colapsíveis usam o mesmo estilo e comportamento

**Resultado Esperado:** ✅ Layout consistente entre ambas as páginas

---

### Teste 6: Atualização em Massa com Múltiplos Campos
**Objetivo:** Validar edição em massa de todos os novos campos

**Passos:**
1. Selecionar múltiplos comerciantes (3-5 comerciantes)
2. Preencher todos os novos campos:
   - Referral Partner: "TestPartner"
   - Referral Fee: "10"
   - Epo 10%: marcado
   - General Notes: "Teste de atualização em massa"
3. Clicar no botão Update
4. Verificar se mensagem de sucesso aparece
5. Validar que todos os comerciantes selecionados tiveram todos os campos atualizados corretamente
6. Verificar que cada registro individual do comerciante reflete os valores da atualização em massa

**Resultado Esperado:** ✅ Todos os campos atualizados corretamente em todos os comerciantes selecionados

---

### Teste 7: Validação de Campos
**Objetivo:** Validar comportamento de validação e campos opcionais

**Passos:**
1. Testar Referral Fee com valores inválidos:
   - Inserir número negativo
   - Inserir texto não-numérico
2. Verificar se tratamento de erro/validação apropriado ocorre
3. Testar General Notes com texto longo (1000+ caracteres)
4. Verificar se o campo aceita e salva texto longo
5. Deixar todos os novos campos vazios e atualizar
6. Verificar se a atualização é bem-sucedida (campos são opcionais)

**Resultado Esperado:** ✅ Validação apropriada, campos opcionais funcionam corretamente

---

### Teste 8: Comparação com Página Individual
**Objetivo:** Validar consistência com página de comerciante individual

**Passos:**
1. Navegar para uma página de comerciante individual (Origination → Merchant → [Merchant Code])
2. Comparar o layout do painel Settings
3. Verificar se todos os campos presentes na página em massa também estão presentes na página individual
4. Verificar se os rótulos dos campos, tipos e posições correspondem entre ambas as páginas

**Resultado Esperado:** ✅ Todos os campos presentes, com labels, tipos e posições correspondentes

---

## 📊 Matriz de Cobertura de Testes

| Teste | Referral Partner | Referral Fee | EPO Flags | General Notes | Layout | Validação |
|-------|------------------|--------------|-----------|---------------|--------|-----------|
| 1 | ✅ | - | - | - | - | - |
| 2 | - | ✅ | - | - | - | - |
| 3 | - | - | ✅ | - | - | - |
| 4 | - | - | - | ✅ | - | - |
| 5 | - | - | - | - | ✅ | - |
| 6 | ✅ | ✅ | ✅ | ✅ | - | - |
| 7 | - | ✅ | - | ✅ | - | ✅ |
| 8 | ✅ | ✅ | ✅ | ✅ | ✅ | - |

---

## 🔍 Critérios de Aceitação

- ✅ Todos os 5 campos adicionados aparecem na página de Configurações de Comerciante
- ✅ Os campos seguem o mesmo formato e aparência da página de Merchant
- ✅ Edição em massa funciona para todos os campos
- ✅ Valores são persistidos corretamente no banco de dados
- ✅ Conversão de percentual para decimal funciona para Referral Fee
- ✅ Seção EPO é colapsível e checkboxes são independentes
- ✅ Campos são opcionais (podem ser deixados vazios)
- ✅ Layout é consistente entre páginas individual e em massa
- ✅ Validação apropriada para campos numéricos
- ✅ Todos os 8 testes passam com sucesso

---

## 📌 Notas Importantes

1. **Campos Opcionais:** Todos os novos campos são opcionais e podem ser deixados vazios
2. **Sem Lógica de Negócio:** Esses campos servem apenas para armazenamento em banco de dados
3. **Conversão de Percentual:** Referral Fee deve converter entrada percentual (5) para decimal (0.05)
4. **Seção Colapsível:** EPO deve ser uma seção colapsível com chevron icon
5. **Consistência Visual:** Todos os campos devem seguir o mesmo estilo da página de Merchant

---

## 🚀 Status de Implementação

- **Status:** To Do
- **Responsável:** Fernando Martins
- **Prioridade:** Low
- **Tipo:** Business Request
- **Workflow:** Ready for QA

---

## 📎 Referências

- **Ticket Relacionado:** #1174 (Merchant page fields)
- **Merge Request:** !1344 (Merged)
- **Epic Pai:** uown#14
- **Milestone:** Uown | RU01.26.1.48.0

---

**Última Atualização:** 22 de Dezembro de 2025
**Versão:** 1.0 PT

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

Comparar
e
 3 arquivos
+
91
−
1
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/mercha
‎nt-setting-panels‎

merchant-s
‎ettings.tsx‎
+65 -1

ho
‎oks‎

userMerchantSe
‎ttingFormik.ts‎
+17 -0

mod
‎els‎

merchant-s
‎ettings.ts‎
+9 -0

 components/merchant-setting-panels/merchant-settings.tsx 
+
65
−
1

Visualizado
@@ -28,6 +28,7 @@ const MerchantSettingsPanel = (props: MerchantSettingsPanelProps) => {
  const [showFee, setShowFee] = useState(true);
  const [showStatusChange, setShowStatusChange] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const [showEPO, setShowEPO] = useState(true);
  const [showFraud, setShowFraud] = useState(true);
  const [emailInputValue, setEmailInputValue] = useState('');
  const [mergedEmailInputValue, setMergedEmailInputValue] = useState('');
@@ -40,7 +41,7 @@ const MerchantSettingsPanel = (props: MerchantSettingsPanelProps) => {
    <CollapsableEditLayout title="Settings" isEditable={false}>
      <div>
        <Row className="mb-3">
          <Col xs={12}>
          <Col xs={6}>
            <InputField
              formik={formik}
              label="UOwn Sales Rep Code"
@@ -48,6 +49,14 @@ const MerchantSettingsPanel = (props: MerchantSettingsPanelProps) => {
              placeholder="Sales Rep Code"
            />
          </Col>
          <Col xs={6}>
            <InputField
              formik={formik}
              label="Referral Partner"
              name="referralPartner"
              placeholder="Referral Partner"
            />
          </Col>
        </Row>
        <Row className="mb-3">
          <Col xs={6}>
@@ -361,6 +370,49 @@ const MerchantSettingsPanel = (props: MerchantSettingsPanelProps) => {
          </div>
        </Collapse>

        <div
          onClick={() => setShowEPO(!showEPO)}
          className={classNames(
            'py-2 px-3 mb-2 mt-3 d-flex justify-content-between cursor-pointer',
            styles?.panel__title,
          )}>
          EPO
          <div>
            <FontAwesomeIcon icon={handleShowIcon(showEPO)} />
          </div>
        </div>

        <Collapse isOpen={showEPO}>
          <div className="d-flex flex-column pl-2 pr-4">
            <CheckboxDropdown
              formik={formik}
              label="Epo 10%"
              name="epo10"
            />
            <CheckboxDropdown
              formik={formik}
              label="Epo 5%"
              name="epo5"
            />
          </div>
        </Collapse>

        <div className="mt-3 mb-3">
          <Row>
            <Col xs={6}>
              <InputField
                formik={formik}
                label="Referral Fee"
                name="referralFee"
                placeholder="Referral Fee"
                type="decimal"
                rightIcon={faPercentage}
                rightIconClassName="cursor-none"
              />
            </Col>
          </Row>
        </div>

        <div
          onClick={() => setShowFraud(!showFraud)}
          className={classNames(
@@ -532,6 +584,18 @@ const MerchantSettingsPanel = (props: MerchantSettingsPanelProps) => {
          </Row>
        </Collapse>
      </div>

      <hr />
      <Row className="mt-3">
        <Col>
          <InputField
            formik={formik}
            label="General Notes"
            name="storeTimings"
            placeholder="General Notes"
          />
        </Col>
      </Row>
    </CollapsableEditLayout>
  );
};
 hooks/userMerchantSettingFormik.ts 
+
17
−
0

Visualizado
@@ -117,6 +117,9 @@ export const useMerchantSettingFormik = (
        filteredObj.ccProcessingFeePercent =
          Number(filteredObj.ccProcessingFeePercent) / 100 || 0;
      }
      if (filteredObj?.referralFee) {
        filteredObj.referralFee = Number(filteredObj.referralFee) / 100 || 0;
      }
      if (filteredObj?.fundingReportEmails) {
        filteredObj.fundingReportEmails = convertArrayToString(
          filteredObj?.fundingReportEmails as Options[],
@@ -209,6 +212,7 @@ export const useMerchantSettingFormik = (
  const settingsFormik = useFormik<MerchantSettings>({
    initialValues: {
      salesRepCode: '',
      referralPartner: '',
      numDaysApprovalExp: null,
      numDaysLeaseDocExp: null,
      // ** STATUS ** //
@@ -227,6 +231,7 @@ export const useMerchantSettingFormik = (
      holdDeposit: null,
      chargeProcessingFee: null,
      chargeProcessingFeeBeforeEsign: null,
      referralFee: null,
      // ** STATUS CHANGE ** //
      allowChangeToExpired: null,
      isSignedToFunding: null,
@@ -249,6 +254,9 @@ export const useMerchantSettingFormik = (
      offerInsurance: null,
      autoDenyApplication: null,
      isPlaidVerificationRequired: null,
      // ** EPO ** //
      epo10: null,
      epo5: null,
      // ** FRAUD ** //
      isFraudCheckRequired: null,
      useNeustar: null,
@@ -262,9 +270,12 @@ export const useMerchantSettingFormik = (
      mergedFundingReportFrequency: null,
      mergedFundingReportEmails: [],
      sendMergedFundingReport: null,
      // ** GENERAL NOTES ** //
      storeTimings: '',
    },
    validationSchema: Yup.object({
      salesRepCode: Yup.string(),
      referralPartner: Yup.string().nullable(),
      merchantSupport: Yup.string(),
      peakCampaignId: Yup.number().nullable(),
      offPeakCampaignId: Yup.number().nullable(),
@@ -286,6 +297,7 @@ export const useMerchantSettingFormik = (
      holdDeposit: Yup.boolean().nullable(),
      chargeProcessingFee: Yup.boolean().nullable(),
      chargeProcessingFeeBeforeEsign: Yup.boolean().nullable(),
      referralFee: Yup.number().nullable(),
      // ** STATUS CHANGE ** //
      allowChangeToExpired: Yup.boolean().nullable(),
      isSignedToFunding: Yup.boolean().nullable(),
@@ -308,6 +320,9 @@ export const useMerchantSettingFormik = (
      offerInsurance: Yup.boolean().nullable(),
      autoDenyApplication: Yup.boolean().nullable(),
      isPlaidVerificationRequired: Yup.boolean().nullable(),
      // ** EPO ** //
      epo10: Yup.boolean().nullable(),
      epo5: Yup.boolean().nullable(),
      webhookUrl: Yup.string().when(['useWebhook'], {
        is: (useWebhook) => useWebhook,
        then: Yup.string().required('Webhook URL is required.'),
@@ -326,6 +341,8 @@ export const useMerchantSettingFormik = (
      mergedFundingReportFrequency: Yup.array().nullable(),
      mergedFundingReportEmails: Yup.array().nullable(),
      sendMergedFundingReport: Yup.boolean().nullable(),
      // ** GENERAL NOTES ** //
      storeTimings: Yup.string().nullable(),
    }),
    onSubmit: async () => {},
  });
 models/merchant-settings.ts 
+
9
−
0

Visualizado
export type MerchantSettings = {
  salesRepCode: string;
  referralPartner: string;
  numDaysApprovalExp: number;
  numDaysLeaseDocExp: number;

@@ -21,6 +22,7 @@ export type MerchantSettings = {
  holdDeposit: boolean;
  chargeProcessingFee: boolean;
  chargeProcessingFeeBeforeEsign: boolean;
  referralFee: number;

  // ** STATUS CHANGE ** //
  allowChangeToExpired: boolean;
@@ -46,6 +48,10 @@ export type MerchantSettings = {
  autoDenyApplication: boolean;
  isPlaidVerificationRequired: boolean;

  // ** EPO ** //
  epo10: boolean;
  epo5: boolean;

  // ** FRAUD ** //
  isFraudCheckRequired: boolean;
  useNeustar: boolean;
@@ -60,4 +66,7 @@ export type MerchantSettings = {
  mergedFundingReportFrequency: unknown;
  mergedFundingReportEmails: string[];
  sendMergedFundingReport: boolean;

  // ** GENERAL NOTES ** //
  storeTimings: string;
};

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


### 1. **Validar Presença do Campo Referral Partner**
- Verificar se o campo "Referral Partner" aparece na primeira linha do painel Settings
- Confirmar que está posicionado ao lado de "UOwn Sales Rep Code" com divisão 50/50
- Validar que o campo aceita valores de texto
OK

### 2. **Validar Edição e Persistência do Referral Partner**
- Inserir valor "PartnerABC" no campo Referral Partner
- Clicar no botão Salvar
- Verificar se mensagem de sucesso aparece
- Validar no banco de dados que o(s) comerciante(s) selecionado(s) teve(ram) o valor atualizado corretamente
OK

### 3. **Validar Presença do Campo Referral Fee**
- Verificar se o campo "Referral Fee" aparece após a seção EPO e antes de Fraude
- Confirmar que o campo exibe com ícone de percentual (%) à direita
- Validar que o campo aceita valores numéricos
OK

### 4. **Validar Conversão de Percentual para Decimal em Referral Fee**
- Inserir valor "5" (representando 5%) no campo Referral Fee
- Clicar no botão Salvar
- Verificar se mensagem de sucesso aparece
- Validar no banco de dados que a taxa foi armazenada como decimal (0.05)
- Testar com outros valores percentuais (10, 15, 20)
--> ERROR - Preenche valor mas não salva no banco de dados

### 5. **Validar Comportamento da Seção EPO (Colapsível)**
- Localizar a seção EPO entre "Others" e "Fraud"
- Verificar se a seção é colapsível com ícone de chevron
- Clicar para expandir e confirmar que dois checkboxes aparecem: "Epo 10%" e "Epo 5%"
- Clicar para recolher e confirmar que os checkboxes desaparecem da visualização
OK

### 6. **Validar Funcionalidade Independente dos Checkboxes EPO**
- Selecionar apenas o checkbox "Epo 10%"
- Clicar no botão Salvar
- Validar no banco de dados que epo10 foi definido como true e epo5 como false/null
- Selecionar apenas o checkbox "Epo 5%"
- Clicar no botão Salvar
- Validar no banco de dados que epo5 foi definido como true e epo10 como false/null
- Selecionar ambos os checkboxes e validar que ambos são persistidos como true
OK
### 7. **Validar Presença do Campo General Notes**
- Rolar até o final do painel Settings
- Verificar se o campo "General Notes" aparece após a seção Funding Reports
- Validar que é um campo de texto longo (textarea)
OK

### 8. **Validar Edição e Persistência do General Notes**
- Inserir texto "Notas de teste para atualização em massa" no campo General Notes
- Clicar no botão Salvar
- Verificar se mensagem de sucesso aparece
- Validar no banco de dados que o valor de storeTimings foi atualizado corretamente
- Testar com texto longo (1000+ caracteres) e confirmar que é aceito e salvo
--> ERROR - Log insere "changed from  to undefined" quando há uma vírgula no texto
  Após salvar o conteudo no campo:
  Sunday: 9:00 AM - 9:00 AM,
  Monday: 9:00 AM - 9:00 AM,
  Tuesday: 9:00 AM - 9:00 AM,
  Wednesday: 9:00 AM - 9:00 AM,
  Thursday: 9:00 AM - 9:00 AM,
  Friday: 9:00 AM - 9:00 AM,
  Saturday: 9:00 AM - 9:00 AM,
  Log exibe "changed from  to undefined" logo após as virgulas.
--> ERROR

### 9. **Validar Ordem e Layout dos Campos**
- Comparar o layout do painel de configurações em massa com a página de configurações de comerciante individual
- Verificar se a ordem dos campos corresponde:
  1. Sales Rep Code + Referral Partner (primeira linha)
  2. Num Days fields
  3. Campaign IDs
  4. Merchant Support
  5. Status section
  6. Requirements section
  7. Fee section
  8. Status Change section
  9. Others section
  10. EPO section (novo)
  11. Referral Fee (novo)
  12. Fraud section
  13. Funding Reports
  14. General Notes (novo, no final)
- Confirmar que todos os campos novos estão nas posições corretas
OK

### 10. **Validar Consistência Visual dos Campos Novos**
- Verificar se o campo Referral Partner segue o mesmo estilo do campo UOwn Sales Rep Code
- Confirmar que o campo Referral Fee segue o mesmo estilo de campos percentuais existentes
- Validar que os checkboxes EPO seguem o mesmo padrão de outros checkboxes no painel
- Confirmar que o campo General Notes segue o mesmo estilo de campos de texto longo existentes
- Verificar se a seção EPO usa o mesmo estilo de colapsível das outras seções
OK

### 11. **Validar Atualização em Massa com Múltiplos Campos Novos**
- Selecionar múltiplos comerciantes (3-5 comerciantes)
- Preencher todos os novos campos:
  - Referral Partner: "TestPartner"
  - Referral Fee: "10"
  - Epo 10%: marcado
  - General Notes: "Teste de atualização em massa"
- Clicar no botão Salvar
- Verificar se mensagem de sucesso aparece
- Validar que todos os comerciantes selecionados tiveram todos os campos atualizados corretamente
- Verificar que cada registro individual do comerciante reflete os valores da atualização em massa
OK

### 13. **Validar Campos Opcionais (Deixar Vazios)**
- Deixar todos os novos campos vazios
- Clicar no botão Salvar
- Verificar se a atualização é bem-sucedida (campos são opcionais)
- Validar que nenhum erro de validação é exibido
OK

### 14. **Validar Validação de Referral Fee com Valores Inválidos**
- Tentar inserir número negativo no campo Referral Fee
- Verificar se validação/erro apropriado ocorre
- Tentar inserir texto não-numérico no campo Referral Fee
- Verificar se validação/erro apropriado ocorre
- Tentar inserir valores muito grandes (ex: 999999)
- Validar comportamento esperado
--> WIP

### 15. **Validar Campos Novos em Atualização Individual de Comerciante**
- Navegar para a página de comerciante individual (Origination → Merchant → [Merchant Code])
- Verificar se todos os campos novos aparecem no painel Settings individual
- Validar que os campos têm os mesmos labels, tipos e posições que na página em massa
- Editar os campos individualmente e confirmar que são persistidos corretamente
OK

### 17. **Validar Comportamento de Campos Novos com Valores Nulos/Vazios**
- Comerciante com Referral Partner vazio → atualizar para "Partner1" → validar
- Comerciante com Referral Partner preenchido → limpar campo → atualizar → validar se fica vazio/nulo
- Repetir para Referral Fee, EPO flags e General Notes
OK

### 24. **Validar Precisão Decimal em Referral Fee**
- Inserir "5.5" (5.5%) e validar se é armazenado como 0.055
- Inserir "0.1" (0.1%) e validar se é armazenado como 0.001
- Inserir "100" (100%) e validar se é armazenado como 1.0
- Testar com valores com múltiplas casas decimais
--> WIP

### 26. **Validar Campos Novos em Diferentes Resoluções de Tela**
- Testar layout em desktop (1920x1080)
- Testar layout em tablet (768x1024)
- Testar layout em mobile (375x667)
- Confirmar que campos novos são acessíveis e editáveis em todas as resoluções
- Validar que a divisão 50/50 do Referral Partner é mantida
OK

### 28. **Validar Comportamento de Campos Novos com Caracteres Especiais**
- Inserir caracteres especiais no Referral Partner (ex: "Partner@#$%")
- Inserir caracteres especiais no General Notes
- Validar que são aceitos e persistidos corretamente
- Testar com acentuação e caracteres Unicode
OK

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------QA1

> ## Tests in qa1

```gherkin 
 

**Validar Edição e Persistência do Referral Partner**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Presença do Campo Referral Fee**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Conversão de Percentual para Decimal em Referral Fee**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Comportamento da Seção EPO (Colapsível)**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Funcionalidade Independente dos Checkboxes EPO**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Presença do Campo General Notes**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Edição e Persistência do General Notes**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Ordem e Layout dos Campos**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Consistência Visual dos Campos Novos**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Atualização em Massa com Múltiplos Campos Novos**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Campos Opcionais (Deixar Vazios)**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Validação de Referral Fee com Valores Inválidos**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Campos Novos em Atualização Individual de Comerciante**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Comportamento de Campos Novos com Valores Nulos/Vazios**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Precisão Decimal em Referral Fee**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Campos Novos em Diferentes Resoluções de Tela**

!

**| PASS |**
``` 

--- 

```gherkin 

**Validar Comportamento de Campos Novos com Caracteres Especiais**

!

**| PASS |**
```

---

--------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

> ```gherkin 


> **Validate Presence of Referral Partner Field**

> **| PASS |**
> ``` 

> --- 


> **Validate Editing and Persistence of Referral Partner**

![Screenshot_at_Dec_23_03-59-58](/uploads/bba0061d3150a7d92582f24ef848d510/Screenshot_at_Dec_23_03-59-58.png){width=900 height=355}
![Screenshot_at_Dec_23_04-00-15](/uploads/d3bd3a36fcd7755066b55103117c3dc6/Screenshot_at_Dec_23_04-00-15.png){width=569 height=222}
![Screenshot_at_Dec_23_04-00-48](/uploads/e4e0da2082bd9357963809422045adf5/Screenshot_at_Dec_23_04-00-48.png){width=900 height=44}
![Screenshot_at_Dec_23_04-02-07](/uploads/05b009c106ddb45ec0ebe6096f94511d/Screenshot_at_Dec_23_04-02-07.png){width=900 height=316}
![Screenshot_at_Dec_23_04-02-51](/uploads/3010a88c8dcfa3bba3a150b35dcb0390/Screenshot_at_Dec_23_04-02-51.png){width=900 height=58}
![Screenshot_at_Dec_23_04-03-21](/uploads/9506a923a4483205dfb6ebafe9cbc068/Screenshot_at_Dec_23_04-03-21.png){width=900 height=322}
![Screenshot_at_Dec_23_04-03-29](/uploads/1c2167839733333b618216e279d2a844/Screenshot_at_Dec_23_04-03-29.png){width=900 height=67}

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Presence of Referral Fee Field**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Percentage to Decimal Conversion in Referral Fee**

![Screenshot_at_Jan_08_04-08-56](/uploads/9fff308830def736ea838fcc57c4f376/Screenshot_at_Jan_08_04-08-56.png){width=613 height=181}

![Screenshot_at_Jan_08_04-10-06](/uploads/03156a0cd3cf543f841013c95813194c/Screenshot_at_Jan_08_04-10-06.png){width=625 height=348}

![Screenshot_at_Jan_08_04-10-17](/uploads/7fd328fe2066010f14b30da8ec634b7d/Screenshot_at_Jan_08_04-10-17.png){width=263 height=72}

![Screenshot_at_Jan_08_04-10-34](/uploads/f18da59aeddd50b752997cfff9606c14/Screenshot_at_Jan_08_04-10-34.png){width=615 height=355}

![Screenshot_at_Jan_08_04-10-42](/uploads/50ef447cde52364a3aa4b3d278841e01/Screenshot_at_Jan_08_04-10-42.png){width=263 height=71}

![Screenshot_at_Jan_08_04-11-45](/uploads/8c86ef00d4847bf15a243c013873eded/Screenshot_at_Jan_08_04-11-45.png){width=785 height=75}

![Screenshot_at_Jan_08_04-12-41](/uploads/c4bf7783340619caedd3cba85608f678/Screenshot_at_Jan_08_04-12-41.png){width=824 height=600}

![Screenshot_at_Jan_08_04-12-59](/uploads/6350fc5fd07cc69304e6e38449714e00/Screenshot_at_Jan_08_04-12-59.png){width=254 height=69}

![Screenshot_at_Jan_08_04-13-07](/uploads/73bdaa64505dc607ca2abcc43ba231f8/Screenshot_at_Jan_08_04-13-07.png){width=786 height=71}

![image](/uploads/2bfebb82dc03621a17728dbac9745600/image.png){width=614 height=311}

![image](/uploads/920eedf66ca8f5beea16aaecec909416/image.png){width=273 height=76}

![image](/uploads/2583a8175441d2d1ce76f3602742ac28/image.png){width=900 height=44}

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate EPO Section Behavior (Collapsible)**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Independent Functionality of EPO Checkboxes**

![Screenshot_at_Dec_23_04-04-44](/uploads/4d17e935d132fe1964ad62244b8b0db0/Screenshot_at_Dec_23_04-04-44.png){width=573 height=460}
![Screenshot_at_Dec_23_04-04-58](/uploads/a048e569ad2bea73bc489e16f1d38634/Screenshot_at_Dec_23_04-04-58.png){width=900 height=226}
![Screenshot_at_Dec_23_04-12-42](/uploads/49090c20ec6a3e4ed29c78d3fb7d1ff9/Screenshot_at_Dec_23_04-12-42.png){width=900 height=69}
![Screenshot_at_Dec_23_04-13-03](/uploads/3e4f3fe334eac2beba9a8d9350298f98/Screenshot_at_Dec_23_04-13-03.png){width=900 height=53}

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Presence of General Notes Field**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Editing and Persistence of General Notes**

![image](/uploads/29e75f04d3e0aac97adae2bb2211eb2f/image.png){width=900 height=100}

> **| PASS |**

> ``` 

> --- 

> ```gherkin 

> **Validate Field Order and Layout**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Visual Consistency of New Fields**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Bulk Update with Multiple New Fields**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Optional Fields (Leave Blank)**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields in Individual Merchant Update**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields Behavior with Null/Empty Values**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Decimal Precision in Referral Fee**


> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields in Different Screen Resolutions**

> !

> **| PASS |**
> ``` 

> --- 


--------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in stg

> ```gherkin 


> **Validate Presence of Referral Partner Field**

> **| PASS |**
> ``` 

> --- 


> **Validate Editing and Persistence of Referral Partner**



> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Presence of Referral Fee Field**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Percentage to Decimal Conversion in Referral Fee**



> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate EPO Section Behavior (Collapsible)**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Independent Functionality of EPO Checkboxes**



> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Presence of General Notes Field**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Editing and Persistence of General Notes**



> **| PASS |**

> ``` 

> --- 

> ```gherkin 

> **Validate Field Order and Layout**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Visual Consistency of New Fields**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Bulk Update with Multiple New Fields**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Optional Fields (Leave Blank)**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields in Individual Merchant Update**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields Behavior with Null/Empty Values**

> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate Decimal Precision in Referral Fee**


> **| PASS |**
> ``` 

> --- 

> ```gherkin 

> **Validate New Fields in Different Screen Resolutions**

> !

> **| PASS |**
> ``` 

> ---