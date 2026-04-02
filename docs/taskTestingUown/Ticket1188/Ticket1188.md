---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1188

UOWN | Origination | Remove Unused Fields from UOWN Application

Synopsis

The current UOWN application form includes fields that are not used in any operational processes. These fields increase application friction without providing business value.
These unused fields must be removed to simplify the application flow while preserving only information that is effectively used in the process.


Feature Request | Business Requirements

Fields to be removed

The following fields must be removed from the UOWN application form:


        
      Employer Name

        
      Length of Employment

![alt text](image.png)

Gherkin

Scenario: Remove unused employer-related fields from application 
Given a user is filling out the UOWN application 
When ("Employer Name" and "Length of Employment") fields are no longer required 
Then these fields are not displayed in the application form 
And the application can be submitted successfully without them 
And no underwriting or decision flow is impacted

Test Steps: Remove Unused Employer-Related Fields
Steps
Open the UOWN application form.
Navigate to the section where employer-related information is collected.
Verify that the fields "Employer Name" and "Length of Employment" are no longer displayed.
Fill out all other required fields in the application form.
Submit the application form.
Confirm that the application is submitted successfully.
Verify that the submission triggers the standard underwriting, risk, and decision-making processes without errors.
Optionally, check that no new errors or warnings appear in the logs related to the removed fields.

Expected Results
"Employer Name" and "Length of Employment" fields are not visible.
Application form can be completed and submitted successfully without them.
Underwriting and decision flows are unaffected.
No data collection errors occur due to the removed fields.

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

# UOWN | Origination | Remoção de Campos Não Utilizados da Aplicação

## Sinopse

O formulário atual de aplicação do **UOWN** contém campos que não são utilizados em nenhum fluxo operacional. Esses campos aumentam a fricção do usuário sem gerar valor para o negócio.

Os campos não utilizados devem ser removidos para simplificar o fluxo de aplicação, mantendo apenas as informações que são efetivamente usadas no processo.

---

## Requisito de Negócio / Feature Request

### Campos a serem removidos

Os seguintes campos devem ser removidos do formulário de aplicação do UOWN:

* **Employer Name** (Nome do Empregador)
* **Length of Employment** (Tempo de Emprego)

---

## Cenário (Gherkin)

**Cenário:** Remover campos de empregador não utilizados da aplicação

**Dado** que um usuário está preenchendo a aplicação do UOWN
**Quando** os campos “Employer Name” e “Length of Employment” não são mais obrigatórios
**Então** esses campos não são exibidos no formulário de aplicação
**E** a aplicação pode ser submetida com sucesso sem eles
**E** nenhum fluxo de underwriting ou decisão é impactado

---

## Passos de Teste – Remoção de Campos Relacionados ao Empregador

1. Acessar o formulário de aplicação do UOWN.
2. Navegar até a seção onde anteriormente eram coletadas informações de empregador.
3. Verificar que os campos **“Employer Name”** e **“Length of Employment”** não estão mais visíveis.
4. Preencher todos os demais campos obrigatórios do formulário.
5. Submeter a aplicação.
6. Confirmar que a aplicação foi enviada com sucesso.
7. Verificar que a submissão dispara normalmente os fluxos padrão de underwriting, risco e decisão, sem erros.
8. (Opcional) Validar que não surgem novos erros ou warnings nos logs relacionados à remoção desses campos.

---

## Resultados Esperados

* Os campos **“Employer Name”** e **“Length of Employment”** não são exibidos no formulário.
* O formulário pode ser preenchido e submetido com sucesso sem esses campos.
* Os fluxos de underwriting e decisão permanecem inalterados.
* Não ocorrem erros de coleta ou processamento de dados devido à remoção dos campos.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 3 arquivos
+
43
−
49
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/send-
‎application-form‎

pan
‎els‎

employment-and-finan
‎cial-information.tsx‎
+18 -40

index.mo
‎dule.scss‎
+18 -0

inde
‎x.tsx‎
+7 -9

 components/send-application-form/panels/employment-and-financial-information.tsx 
+
18
−
40

Visualizado
@@ -13,14 +13,13 @@ import moment from 'moment';
import styles from './index.module.scss';
import {SendApplicationRequest} from '@models';
import {FormikProps} from 'formik';
import classNames from 'classnames';

export interface EmploymentAndFinancialInfoValue {
  mainEmployerName: string;
  mainPayFrequency: string;
  mainLastPayDate: string;
  mainNextPayDate: string;
  mainMonthlyIncome: any;
  mainEmploymentDuration: string;
}

export const payScheduleMapping = {
@@ -83,26 +82,10 @@ const EmploymentAndFinancialInformationPanel = ({
}: EmploymentAndFinancialInformationPanelProps) => {
  return (
    <form id="new-application-form" onSubmit={formik?.handleSubmit}>
      <Row className="d-flex align-items-center">
        <Col
          xs={12}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
          <InputField
            formik={formik}
            data-nid-target="mainEmployerName"
            name="mainEmployerName"
            type="text"
            label="Employer"
            placeholder="Employer"
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
      </Row>
      <Row className="d-flex align-items-center mt-4 pt-3">
        <Col
          xs={12}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
          className="d-flex flex-row justify-content-between align-items-center">
          <InputField
            formik={formik}
            data-nid-target="mainPayFrequency"
@@ -126,11 +109,15 @@ const EmploymentAndFinancialInformationPanel = ({
          />
        </Col>
      </Row>
      <Row className="d-flex align-items-center mt-4 pt-3">
      <Row
        className={classNames(
          styles.inputContainer,
          'd-flex align-items-center',
        )}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
          className="d-flex flex-row justify-content-between align-items-center">
          <InputField
            formik={formik}
            data-nid-target="mainLastPayDate"
@@ -156,7 +143,10 @@ const EmploymentAndFinancialInformationPanel = ({
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center">
          className={classNames(
            styles.mainNextPayDate,
            'd-flex flex-row justify-content-between align-items-center',
          )}>
          <InputField
            formik={formik}
            data-nid-target="mainNextPayDate"
@@ -171,11 +161,15 @@ const EmploymentAndFinancialInformationPanel = ({
          />
        </Col>
      </Row>
      <Row className="d-flex align-items-center mt-4 pt-3 mb-3">
      <Row
        className={classNames(
          styles.inputContainer,
          'd-flex align-items-center',
        )}>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center mb-3 mb-lg-0">
          className="d-flex flex-row justify-content-between align-items-center">
          <InputField
            formik={formik}
            data-nid-target="mainMonthlyIncome"
@@ -189,22 +183,6 @@ const EmploymentAndFinancialInformationPanel = ({
            maxLength={6}
          />
        </Col>
        <Col
          xs={12}
          lg={6}
          className="d-flex flex-row justify-content-between align-items-center">
          <InputField
            formik={formik}
            data-nid-target="mainEmploymentDuration"
            name="mainEmploymentDuration"
            type="select"
            placeholder="Length of Employment"
            label="Length of Employment"
            options={Object.values(lengthOfEmploymentMapping)}
            className={styles?.panel__input}
            isLabelBold={true}
          />
        </Col>
      </Row>
    </form>
  );


 2 arquivos
+
3
−
3
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

con
‎fig‎

LosRequestMessageConstr
‎aintValidatorConfig.java‎
+1 -1

po
‎jo‎

Reques
‎t.java‎
+2 -2

 src/main/java/com/uownleasing/svc/config/LosRequestMessageConstraintValidatorConfig.java 
+
1
−
1

Visualizado
@@ -20,7 +20,7 @@ public class LosRequestMessageConstraintValidatorConfig {
    public String getRequiredFieldsForClientType(ClientType clientType) {
        return configurationManagement.getString(
            CONFIGURATION_PATH + "required.fields.for." + clientType,
            "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,mainEmployerName,emailAddress,mainPostalCode,mainNextPayDate"
            "mainFirstName,mainLastName,mainDOB,mainSSN,mainCellPhone,emailAddress,mainPostalCode,mainNextPayDate"
        );
    }

 src/main/java/com/uownleasing/svc/pojo/Request.java 
+
2
−
2

Visualizado
@@ -76,7 +76,7 @@ public class Request {
    private LocalDate mainNextPayDate;
    private Frequency mainPayFrequency;
    private EmploymentStatus mainEmplStatus ;
    private String mainEmployerName    ;
    private String mainEmployerName;
    private String mainOccupation ;
    @JsonProperty("mainTimeAtEmployer")
    @JsonAlias("mainAtEmployerFrom")
@@ -222,7 +222,7 @@ public class Request {
        if(employmentInfo != null){
            return employmentInfo;
        }
        if(mainEmplStatus != null || mainEmployerName != null || getMainLastPayDate() != null || mainMonthlyIncome != null || mainAnnualIncome != null) {
        if(mainEmplStatus != null || getMainLastPayDate() != null || mainMonthlyIncome != null || mainAnnualIncome != null) {
            employmentInfo = new EmploymentInfo();
            employmentInfo.setEmployer(mainEmployerName);
            employmentInfo.setEmploymentStatus(mainEmplStatus != null ? mainEmplStatus : EmploymentStatus.EMPLOYED_OR_SELF_EMPLOYED);

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: Preenchimento da etapa Employment sem os campos removidos
```markdown
- Given a etapa Employment está ativa
- When valores válidos são informados para Your Pay Schedule, Last Pay Date, Next Pay Date e Gross Monthly Income
- And a navegação avança para a próxima etapa
- Then o fluxo continua sem erros de validação
- And nenhuma validação é acionada para os campos de empregador removidos

```

Screeshot

**PASS**

---
### Scenario 2: Persistência dos dados ao retornar para a etapa Employment

```markdown
- Given a etapa Employment foi preenchida com dados válidos
- And a navegação avança para a etapa Disclaimer
- When ocorre o retorno para a etapa Employment
- Then todos os campos previamente preenchidos permanecem com seus valores
- And os campos de empregador removidos continuam ocultos
```

Screeshot

**PASS**

---
### Scenario 3: Envio da aplicação sem os campos de empregador

```markdown
- Given todas as etapas da aplicação foram preenchidas com dados válidos
- And os checkboxes obrigatórios da etapa Disclaimer estão marcados
- When a aplicação é enviada via sendApplication
- Then a aplicação é enviada com sucesso
- And nenhum erro ocorre devido à ausência de campos de empregador
```

Screeshot

**PASS**

---
### Scenario 4: Processamento da aplicação sem impacto nos fluxos de decisão

```markdown
- Given uma aplicação é submetida sem campos relacionados ao empregador
- When o backend processa a aplicação
- Then os fluxos de underwriting, risco e decisão são executados com sucesso
- And não são gerados erros ou warnings relacionados aos campos removidos
```

Screeshot

**PASS**

---
### Scenario 5: Recalculo automático das datas ao alterar a frequência de pagamento

```markdown
- Given a etapa Employment está ativa
- And os campos Your Pay Schedule, Last Pay Date e Next Pay Date estão preenchidos
- When a opção de Your Pay Schedule é alterada
- Then os campos Last Pay Date e Next Pay Date são recalculados automaticamente
- And as datas exibidas correspondem à frequência de pagamento selecionada
- And nenhuma ação manual é necessária para atualizar as datas

Examples:
| Pay Schedule |
|--------------|
| weekly |
| biweekly |
| semi_monthly |
| monthly |
```

Screeshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## Tests in qa2

---
### Scenario 1: Completing the Employment step without the removed fields

```markdown
- Given the Employment step is active
- When valid values are provided for Your Pay Schedule, Last Pay Date, Next Pay Date, and Gross Monthly Income
- And navigation advances to the next step
- Then the flow continues without validation errors
- And no validation is triggered for the removed employer fields
```

![Screenshot_at_Jan_22_04-30-41](/uploads/ffd480c9e1192f7ea95bff56503b767e/Screenshot_at_Jan_22_04-30-41.png){width=900 height=459}
![Screenshot_at_Jan_22_04-39-37](/uploads/4e12a3df138298300ecef82c413c3836/Screenshot_at_Jan_22_04-39-37.png){width=900 height=531}

**PASS**

---
### Scenario 2: Data persistence when returning to the Employment step

```markdown
- Given the Employment step was completed with valid data
- And navigation advances to the Disclaimer step
- When navigation returns to the Employment step
- Then all previously filled fields remain populated
- And the removed employer fields remain hidden
```
![Screenshot_at_Jan_22_04-42-22](/uploads/c116647cdf7de3b4552ff1ab185ed1a0/Screenshot_at_Jan_22_04-42-22.png){width=900 height=464}
![Screenshot_at_Jan_22_04-43-33](/uploads/ef842ea9bbef641f11db59a94c8211cc/Screenshot_at_Jan_22_04-43-33.png){width=818 height=600}
![Screenshot_at_Jan_22_04-44-54](/uploads/5d76f2929fbc410f0d8ee11caa8a36c5/Screenshot_at_Jan_22_04-44-54.png){width=900 height=452}
![Screenshot_at_Jan_22_04-45-21](/uploads/ed3a5143453e564183b07b51adbb8693/Screenshot_at_Jan_22_04-45-21.png){width=900 height=451}
![Screenshot_at_Jan_22_04-45-49](/uploads/7aa059044ddf22d7dd20277d7a3616b1/Screenshot_at_Jan_22_04-45-49.png){width=900 height=450}

**PASS**

---
### Scenario 3: Submitting the application without employer fields

```markdown
- Given all application steps were completed with valid data
- And the required Disclaimer checkboxes are selected
- When the application is submitted via sendApplication
- Then the application is submitted successfully
- And no error occurs due to the absence of employer fields
```
![Screenshot_at_Jan_22_04-55-01](/uploads/eecbf00f474e36a3d80adc6dbd407a9d/Screenshot_at_Jan_22_04-55-01.png){width=900 height=434}

**PASS**

---
### Scenario 4: Application processing without impact on decision flows

```markdown
- Given an application is submitted without employer-related fields
- When the backend processes the application
- Then underwriting, risk, and decision flows are executed successfully
- And no errors or warnings are generated related to the removed fields
```
![Screenshot_at_Jan_22_04-57-37](/uploads/39a24a991de39a0bb40efae1b1b356b7/Screenshot_at_Jan_22_04-57-37.png){width=550 height=600}
![Screenshot_at_Jan_22_04-57-52](/uploads/46f1b2c068bf631e7dbbc8157839317d/Screenshot_at_Jan_22_04-57-52.png){width=900 height=142}
![Screenshot_at_Jan_22_05-04-40](/uploads/7e9e3691cd351a9ef5fa123269d0d442/Screenshot_at_Jan_22_05-04-40.png){width=539 height=600}
![Screenshot_at_Jan_22_05-06-28](/uploads/09bc20caf5d843402a4674fe01be37d2/Screenshot_at_Jan_22_05-06-28.png){width=459 height=600}
![Screenshot_at_Jan_22_05-06-48](/uploads/4b5fa335342f54d752384b5d6913210c/Screenshot_at_Jan_22_05-06-48.png){width=900 height=176}

**PASS**

---
### Scenario 5: Automatic recalculation of pay dates when changing pay frequency

```markdown
- Given the Employment step is active
- And the fields Your Pay Schedule, Last Pay Date, and Next Pay Date are filled
- When the Your Pay Schedule option is changed
- Then the Last Pay Date and Next Pay Date fields are recalculated automatically
- And the displayed dates match the selected pay frequency
- And no manual action is required to update the dates

Examples:
| Pay Schedule |
|--------------|
| weekly |
| biweekly |
| semi_monthly |
| monthly |
```

![Screenshot_at_Jan_22_04-40-01](/uploads/7f86b859e5d4dd0f0cca7595c06d7153/Screenshot_at_Jan_22_04-40-01.png){width=900 height=539}
![Screenshot_at_Jan_22_04-40-15](/uploads/f374a4d9c35d01c2217e828fc5734919/Screenshot_at_Jan_22_04-40-15.png){width=900 height=544}
![Screenshot_at_Jan_22_04-40-34](/uploads/4973610311fe7ebf950ab9ec4fb85a9d/Screenshot_at_Jan_22_04-40-34.png){width=900 height=547}
![Screenshot_at_Jan_22_04-40-54](/uploads/758f1f6fa8486c818335ed94dc9f5ff1/Screenshot_at_Jan_22_04-40-54.png){width=900 height=544}
![Screenshot_at_Jan_22_04-41-05](/uploads/8c5ef179411b0b71a7b6b1a937f5b97e/Screenshot_at_Jan_22_04-41-05.png){width=900 height=544}

**PASS**

---