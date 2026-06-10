-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1155


UOWN | Origination | Display Processing Fee on Program Page


Synopsis
Display the processing fee value from the corresponding State Configuration on the Program Page for visibility and better decision-making.


Business Objective
Business users need to see the processing fee applied to a program without navigating through backend configurations.
Showing this value directly on the Program Page provides transparency and supports quick decisions on overrides or promotions.


Feature Request | Business Requirements
On the Program Page, display the Processing Fee retrieved from the program’s associated state(s).
The field should be read-only — editing continues to happen in the State Configurations page.
The displayed fee should appear near the “Processing Fee Override” field (tooltip).
These are the endpoints already on the BE they could use to display for the tooltip:
    @PostMapping(value="/createOrUpdateStateConfigurations")\ public StateConfigurations createOrUpdateStateConfigurations(@RequestBody StateConfigurationsInfo configurationsInfo){\ return stateConfigurationsService.createOrupdate(configurationsInfo);\ }\ \ @PostMapping(value="/getStateConfigurationsByState/{state}")\ public StateConfigurations getStateConfigurationsByState(@PathVariable String state){\ return stateConfigurationsService.getByState(state);\ }\ \ @PostMapping(value="/getStateConfigurationsByPk/{pk}")\ public StateConfigurations getStateConfigurationsByPk(@PathVariable long pk){\ return stateConfigurationsService.getByPk(pk);\ }

Need to add just one new endpoint to get all state configurations for the new page.

Expected Result
Users viewing a program can immediately understand the applicable processing fee for that state, reducing confusion and helping decide whether a program-specific override is necessary.



Testing Steps

Feature Description
A read-only tooltip has been added to display Processing Fee values from State Configurations next to the "Processing Fee Override" field on the Program Page. The tooltip shows processing fees for all selected states in a multi-column layout.

Location
Page: Origination → Programs
Field: "Processing Fee Override" (in the Program Form)
Trigger: Hover over the info icon next to the "Processing Fee Override" label

Testing Steps

1. Navigate to Programs Page
Go to Origination → Programs
Click "ADD NEW PROGRAM" or edit an existing program

2. Test with No States Selected
Action: Ensure no states are selected in the "States" multi-select field
Expected: Tooltip should display: "Select states to view processing fees"
![alt text](image.png)

Test with Few States (1-6 states)
Action: Select 1-6 states in the "States" field
Expected:
    Tooltip displays processing fees in 2 columns
    Format: "Processing Fee by State:" header, followed by state abbreviations and fees (e.g., "CA: $49.00")
    All selected states are visible

Test with Moderate States (7-20 states)
Action: Select 7-20 states
Expected:
    Tooltip displays processing fees in 3 columns
    All selected states are visible in the tooltip    

Test with Many States (21-40 states)
Action: Select 21-40 states
Expected:
    Tooltip displays processing fees in 4 columns
    All selected states are visible

Test with All States (50 states)
Action: Select all available states (should be 50)
Expected:
    Tooltip displays processing fees in 5 columns
    Approximately 10 states per column
    All 50 states are visible
    Tooltip background expands to fit all content
    If tooltip exceeds viewport height, scrolling is available
![alt text](image-1.png)

Verify Tooltip Behavior
Action: Hover over the info icon
Expected:
    Tooltip appears immediately on hover
    Tooltip disappears when mouse leaves the icon
    Tooltip background (dark box) properly contains all text
    No text overflow or "breaking the box space"
    Columns are evenly distributed

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# **UOWN | Origination | Exibir Processing Fee na Página de Programas**

## **Sinopse**

Exibir o valor da *processing fee* configurada no **State Configuration** diretamente na página de Programas, para maior visibilidade e melhor tomada de decisão.

---

## **Objetivo de Negócio**

Os usuários de negócio precisam visualizar rapidamente qual *processing fee* é aplicada a um programa **sem ter que navegar pelas configurações internas**.

Mostrar esse valor diretamente na página de Programas fornece:

* Transparência
* Agilidade na análise de overrides
* Suporte para decisões sobre promoções ou ajustes de taxa

---

## **Requisitos da Funcionalidade**

* Exibir na página Program a *Processing Fee* obtida da configuração do(s) estado(s) associado(s) ao programa.
* O campo deve ser **somente leitura** — edições continuam sendo feitas na página de State Configurations.
* O valor deve aparecer próximo ao campo **“Processing Fee Override”**, através de um **tooltip**.
* Os seguintes endpoints já existem no backend e podem ser usados pelo tooltip:

```
@PostMapping(value="/createOrUpdateStateConfigurations")
public StateConfigurations createOrUpdateStateConfigurations(@RequestBody StateConfigurationsInfo configurationsInfo){
    return stateConfigurationsService.createOrupdate(configurationsInfo);
}

@PostMapping(value="/getStateConfigurationsByState/{state}")
public StateConfigurations getStateConfigurationsByState(@PathVariable String state){
    return stateConfigurationsService.getByState(state);
}

@PostMapping(value="/getStateConfigurationsByPk/{pk}")
public StateConfigurations getStateConfigurationsByPk(@PathVariable long pk){
    return stateConfigurationsService.getByPk(pk);
}
```

* Um **novo endpoint** deve ser criado para retornar **todas as configurações de estado** para a nova página.

---

## **Resultado Esperado**

Usuários visualizando um programa devem compreender imediatamente qual *processing fee* é aplicada ao estado selecionado, reduzindo confusão e auxiliando na decisão de aplicar ou não um override específico.

---

# **Passos de Teste**

## **Descrição da Feature**

Um **tooltip somente leitura** foi adicionado ao lado do campo **"Processing Fee Override"** na página de Programas.
Esse tooltip exibe as *processing fees* de todos os estados selecionados, organizados em múltiplas colunas.

### **Localização**

* Página: **Origination → Programs**
* Campo: **Processing Fee Override** (no formulário de Program)
* Gatilho: **Hover** sobre o ícone de informação

---

# **Passos de Teste Detalhados**

### **1. Navegar até a Página de Programas**

* Acessar **Origination → Programs**
* Clicar em **ADD NEW PROGRAM** ou editar um programa existente

---

## **2. Testar Sem Estados Selecionados**

**Ação:** Não selecionar nenhum estado no campo *States*
**Esperado:** Tooltip deve mostrar:
👉 **"Select states to view processing fees"**

*(imagem do ticket)*

---

## **3. Teste com Poucos Estados Selecionados (1–6)**

**Ação:** Selecionar 1 a 6 estados
**Esperado:**
* Tooltip exibe taxas em **2 colunas**
* Cabeçalho: **"Processing Fee by State:"**
* Ex.: `CA: $49.00`
* Todos os estados selecionados visíveis

---

## **4. Teste com Número Moderado de Estados (7–20)**

**Ação:** Selecionar de 7 a 20 estados
**Esperado:**
* Tooltip com **3 colunas**
* Todos os estados visíveis

---

## **5. Teste com Muitos Estados (21–40)**

**Ação:** Selecionar de 21 a 40 estados
**Esperado:**
* Tooltip com **4 colunas**
* Todos os estados listados corretamente

---

## **6. Teste com Todos os Estados (50)**

**Ação:** Selecionar todos os 50 estados
**Esperado:**
* Tooltip com **5 colunas**
* ~10 estados por coluna
* Todo o conteúdo visível
* Tooltip expande adequadamente
* Se ultrapassar a altura da tela, deve mostrar **scroll interno**

*(imagem do ticket)*

---

## **7. Verificar o Comportamento do Tooltip**

**Ação:** Passar o mouse no ícone
**Esperado:**
* Tooltip aparece imediatamente
* Some ao retirar o mouse
* Fundo do tooltip contém todo o texto
* Nenhum texto “estoura” o layout
* Colunas distribuídas igualmente

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:

 6 arquivos
+
164
−
5
Arquivos
6
Pesquisar (por exemplo, *.vue) (F)

components/
‎program-form‎

index.mo
‎dule.scss‎
+3 -0

inde
‎x.tsx‎
+121 -4

domain
‎/stores‎

progr
‎am.tsx‎
+18 -0

pages/p
‎rograms‎

inde
‎x.tsx‎
+1 -0

sty
‎les‎

global
‎s.scss‎
+20 -0

serv
‎er.js‎
+1 -1

 components/program-form/index.module.scss 
+
3
−
0

Visualizado
@@ -30,3 +30,6 @@
    gap: 0.5rem;
  }
}

// Note: Tooltip styling is handled in globals.scss
// since tooltips are rendered in a portal
\ No newline at end of file
 components/program-form/index.tsx 
+
121
−
4

Visualizado
@@ -9,16 +9,18 @@ import {Frequencies} from '@enums/Frequencies';
import {LendingCategoryType} from '@enums/LendingCategoryType';
import classNames from 'classnames';
import {FormikProps} from 'formik';
import React, {useEffect, useState} from 'react';
import React, {useEffect, useState, useMemo} from 'react';
import {Col, Form, Row, Button} from 'reactstrap';
import styles from './index.module.scss';
import {convertStringToOptionType} from '@utils/helper';
import {faPercentage} from '@fortawesome/free-solid-svg-icons';
import {faPercentage, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {ProgramLog} from '@models';
import {CloneProgram} from '@components/clone-program';
import {showToast} from '@uownleasing/common-utilities';
import {
  showToast,
  convertNumberToCurrency,
} from '@uownleasing/common-utilities';
import {CloneProgramGroup} from '@components/clone-program-group';

interface ProgramFormProps {
  formik: FormikProps<any>;
  allStates: Options[];
@@ -32,6 +34,7 @@ interface ProgramFormProps {
    isGetAll?: boolean,
  ) => Promise<ResponseType>;
  getMerchantProgramsGroupName: () => Promise<ResponseType>;
  getAllStateConfigurations: () => Promise<ResponseType>;
  clonePrograms: (body: {
    groupName: string;
    programPks: string[];
@@ -48,12 +51,14 @@ const ProgramForm = (props: ProgramFormProps) => {
    setProgramLogs,
    getAllMerchantPrograms,
    getMerchantProgramsGroupName,
    getAllStateConfigurations,
    clonePrograms,
    hasManageProgramGroupsPermission,
  } = props;

  const [programGroups, setProgramGroups] = useState([]);
  const [isShowFormEnabled, setIsShowFormEnabled] = useState(true);
  const [stateConfigurations, setStateConfigurations] = useState([]);

  const resetAll = () => {
    formik?.resetForm();
@@ -77,6 +82,18 @@ const ProgramForm = (props: ProgramFormProps) => {
    loadProgramsGroup();
  }, []);

  useEffect(() => {
    const loadStateConfigurations = async () => {
      if (getAllStateConfigurations) {
        const {data, status} = await getAllStateConfigurations();
        if (status === 200 && data) {
          setStateConfigurations(data || []);
        }
      }
    };
    loadStateConfigurations();
  }, [getAllStateConfigurations]);

  const listenProgramGroupInputFieldAndAddAsOption = (
    newGroupNameValue: string,
  ) => {
@@ -87,6 +104,104 @@ const ProgramForm = (props: ProgramFormProps) => {
    }
  };

  const processingFeeTooltip = useMemo((): React.ReactNode => {
    const selectedStates = formik?.values?.states || [];

    if (!selectedStates || selectedStates.length === 0) {
      return 'Select states to view processing fees';
    }

    const feeEntries: Array<{abbreviation: string; fee: string}> = [];

    selectedStates.forEach((stateOption: any) => {
      const stateLabel = stateOption?.label || stateOption?.value || '';
      if (!stateLabel) return;

      const stateConfig = stateConfigurations.find((config: any) => {
        const configInfo = config?.stateConfigurationsInfo || config;
        const configState = configInfo?.state || '';
        const configAbbreviation = configInfo?.stateAbbreviation || '';

        return (
          configState?.toUpperCase() === stateLabel.toUpperCase() ||
          configAbbreviation?.toUpperCase() === stateLabel.toUpperCase()
        );
      });

      if (stateConfig) {
        const configInfo = stateConfig?.stateConfigurationsInfo || stateConfig;
        const processingFee = configInfo?.processingFee;
        const stateAbbreviation = configInfo?.stateAbbreviation || stateLabel;

        if (processingFee != null) {
          const formattedFee = convertNumberToCurrency(processingFee);
          feeEntries.push({abbreviation: stateAbbreviation, fee: formattedFee});
        }
      }
    });

    if (feeEntries.length === 0) {
      return (
        <div>
          <div style={{fontWeight: 'bold', marginBottom: '4px'}}>
            Processing Fee by State:
          </div>
          <div>No processing fees found for selected states</div>
        </div>
      );
    }

    let numColumns: number;
    if (feeEntries.length <= 6) {
      numColumns = 2;
    } else if (feeEntries.length <= 20) {
      numColumns = 3;
    } else if (feeEntries.length <= 40) {
      numColumns = 4;
    } else {
      numColumns = 5;
    }

    const itemsPerColumn = Math.ceil(feeEntries.length / numColumns);
    const columns: Array<Array<{abbreviation: string; fee: string}>> = [];

    for (let i = 0; i < numColumns; i++) {
      columns.push([]);
    }

    feeEntries.forEach((entry, index) => {
      const columnIndex = Math.floor(index / itemsPerColumn);
      if (columnIndex < numColumns) {
        columns[columnIndex].push(entry);
      }
    });

    return (
      <div
        className="processing-fee-tooltip-content"
        style={{textAlign: 'left'}}>
        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>
          Processing Fee by State:
        </div>
        <div style={{display: 'flex', gap: '16px'}}>
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              style={{display: 'flex', flexDirection: 'column'}}>
              {column.map((entry, entryIndex) => (
                <div
                  key={`${colIndex}-${entryIndex}`}
                  style={{whiteSpace: 'nowrap'}}>
                  {entry.abbreviation}: {entry.fee}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }, [formik?.values?.states, stateConfigurations]);

  return (
    <Form id="addOrEditMerchantProgramForm" onSubmit={formik.handleSubmit}>
      <div className={styles.actionButtonsContainer}>
@@ -231,6 +346,8 @@ const ProgramForm = (props: ProgramFormProps) => {
                name="processingFeeOverride"
                label="Processing Fee Override"
                type="currency"
                labelIcon={faInfoCircle}
                labelIconDescription={processingFeeTooltip}
              />
            </Col>
          </Row>

-


 2 arquivos
+
11
−
0
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

re
‎st‎

AdminContr
‎oller.java‎
+5 -0

ser
‎vice‎

StateConfigurat
‎ionsService.java‎
+6 -0

 src/main/java/com/uownleasing/svc/rest/AdminController.java 
+
5
−
0

Visualizado
@@ -185,6 +185,11 @@ public class AdminController {
        return stateConfigurationsService.getByPk(pk);
    }

    @GetMapping(value="/getAllStateConfigurations")
    public List<StateConfigurations> getAllStateConfigurations(){
        return stateConfigurationsService.getAll();
    }

    @PostMapping("/uploadBase64StringToGCS")
    public void uploadFileInBase64StringToGCS(@RequestParam String filePath, @RequestParam String fileContent){
        gcsService.uploadFileToGCS(filePath,fileContent);
 src/main/java/com/uownleasing/svc/service/StateConfigurationsService.java 
+
6
−
0

Visualizado
@@ -8,6 +8,8 @@ import lombok.extern.slf4j.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

import java.util.List;

@Service
@Transactional
@Slf4j
@@ -41,4 +43,8 @@ public class StateConfigurationsService {
    public StateConfigurations getByPk(long pk){
        return stateConfigurationsRepo.findByPk(pk);
    }

    public List<StateConfigurations> getAll(){
        return stateConfigurationsRepo.findAll();
    }
}

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 💰 UOWN | Origination | Processing Fee Tooltip - Program Page
## Cenários de Teste - Exibição de Processing Fee por Estado

---

### Scenario 1: Tooltip Sem Estados Selecionados
- `Quando nenhum estado está selecionado no campo "States", então ao passar o mouse sobre o ícone info ao lado de "Processing Fee Override", tooltip exibe a mensagem "Select states to view processing fees", indicando que nenhuma fee pode ser exibida sem estados selecionados.`

### Scenario 2: Tooltip com Poucos Estados (6)
- `Dado usuário selecionando 6 estados (ex: CA, NY, TX), quando passa o mouse sobre o ícone info, então tooltip exibe cabeçalho "Processing Fee by State:" seguido de lista com abbreviação e fee de cada estado (ex: "CA: $49.00"), organizado em 2 colunas, todos os estados visíveis sem scroll.`

### Scenario 3: Tooltip com Número Moderado de Estados (7)
- `Dado usuário selecionando 7 estados, quando passa o mouse sobre o ícone info, então tooltip exibe estados organizados em 3 colunas, cabeçalho "Processing Fee by State:" presente, todas as fees formatadas em moeda, nenhum texto cortado.`

### Scenario 4: Tooltip com Todos os Estados
- `Dado usuário selecionando todos os estados, quando passa o mouse sobre o ícone info, então tooltip exibe 5 colunas com aproximadamente 10 estados por coluna, todas as 50 fees visíveis, tooltip background se expande adequadamente, se conteúdo ultrapassar altura da viewport, scrolling interno disponível.`

### Scenario 5: Formatação de Moeda no Tooltip
- `Dado tooltip exibindo processing fees, quando estados estão selecionados, então cada fee deve estar formatada como moeda (ex: $49.00, $35.50), sem valores truncados ou quebrados, usando conversão de número para formato de moeda.`

### Scenario 6: Comportamento de Hover - Aparecimento Imediato
- `Dado usuário passando o mouse sobre o ícone info, então tooltip aparece imediatamente sem delay, mostrando processing fees de forma responsiva.`

### Scenario 7: Resposta API - getAllStateConfigurations
- `Dado página de programa carregada, quando componente inicializa, então backend é chamado com GET /getAllStateConfigurations, com lista de StateConfigurationsInfo contendo stateAbbreviation, state, processingFee, dados são armazenados no estado do componente e usados para renderizar tooltip.`

### Scenario 8: Atalizar estados via API e verificar Tooltip
- `Dado que os estados do programa são atualizados via API, ao passar o mouse sobre o ícone info,  então tooltip exibe estados configurados via API.`

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa2

### Scenario 1: Tooltip With No States Selected

> ```gherkin

> **`When no state is selected in the "States" field, then when the user hovers over the info icon next to "Processing Fee Override", the tooltip displays the message "Select states to view processing fees", indicating that no fees can be shown without selected states.`**

> ![image](/uploads/d672d27d39096548bd60f441ccd532ea/image.png){width=900 height=269}

> **| PASS |**
> ```

### Scenario 2: Tooltip With Few States

> ```gherkin

> **`Given I have a program that operates in multiple states. When I want to see the processing fees for my selected states. Then I can view all fees clearly organized without scrolling`**

> ![Screenshot_at_Nov_25_08-48-51](/uploads/44dd41baa236e136c71a52573b3a6984/Screenshot_at_Nov_25_08-48-51.png){width=900 height=352}
> ![Screenshot_at_Nov_25_08-55-39](/uploads/0699a86382c96a47c87773044aadfe04/Screenshot_at_Nov_25_08-55-39.png){width=900 height=31}
> ![Screenshot_at_Nov_25_08-58-23](/uploads/6af0792e11a1aef0b887430a9da0b4f6/Screenshot_at_Nov_25_08-58-23.png){width=900 height=447}

---

> ![1155-MO-Screenshot_at_Nov_25_08-43-20](/uploads/ef85b21053eb16b6965da4ba740e4e66/1155-MO-Screenshot_at_Nov_25_08-43-20.png){width=900 height=184}
> ![1155-MO-Screenshot_at_Nov_25_08-43-50](/uploads/34a06eccf16320372bffa30d0e91bc38/1155-MO-Screenshot_at_Nov_25_08-43-50.png){width=529 height=312}
> ![1155-MO-Screenshot_at_Nov_25_08-46-15](/uploads/f10912c15ea17e41f48455bfa4e43e74/1155-MO-Screenshot_at_Nov_25_08-46-15.png){width=900 height=251}

> **| PASS |**
> ```

### Scenario 3: Tooltip With a Moderate Number of States

> ```gherkin

> **`Given a user selecting 7 states, when hovering over the info icon, then the tooltip displays the states organized into 3 columns, header "Processing Fee by State:" present, all fees formatted as currency, no text cut off.`**

> ![Screenshot_at_Nov_25_08-59-47](/uploads/77349b234dc01d3d2ee927c88bdccb8e/Screenshot_at_Nov_25_08-59-47.png){width=900 height=272}
> ![Screenshot_at_Nov_25_09-01-26](/uploads/148ff1fc3fb79bdd9c172865e9e79e2f/Screenshot_at_Nov_25_09-01-26.png){width=900 height=341}
> ![Screenshot_at_Nov_25_09-02-09](/uploads/ba243baaec8d3bc4065246f392082eb1/Screenshot_at_Nov_25_09-02-09.png){width=900 height=28}
> ![Screenshot_at_Nov_25_09-09-39](/uploads/561704237f62861bbf12e121be593f7f/Screenshot_at_Nov_25_09-09-39.png){width=900 height=413}

> **| PASS |**
> ```

### Scenario 4: Tooltip With All States

> ```gherkin

> **`Given a user selecting all states, when hovering over the info icon, then the tooltip displays 5 columns with approximately 10 states per column, all 50 fees visible, tooltip background expands appropriately, and if the content exceeds the viewport height, internal scrolling is available.`**

> ![Screenshot_at_Nov_25_09-35-24](/uploads/016df267f4a99a456567599b3fc5e485/Screenshot_at_Nov_25_09-35-24.png){width=900 height=157}
> ![Screenshot_at_Nov_25_09-35-35](/uploads/475682aac359dfb431e2eafb11d07a3e/Screenshot_at_Nov_25_09-35-35.png){width=510 height=304}

> **| PASS |**
> ```

### Scenario 5: Currency Formatting in Tooltip

> ```gherkin

> **`Given the tooltip displaying processing fees, when states are selected, then each fee must be formatted as currency (e.g., $49.00, $35.50), with no truncated or broken values, using number-to-currency formatting.`**

> ![Screenshot_at_Nov_25_09-35-35](/uploads/0c71e2d8dc5ee26f4d8f1444180acb6d/Screenshot_at_Nov_25_09-35-35.png){width=510 height=304}

> **| PASS |**
> ```

### Scenario 6: Hover Behavior – Immediate Appearance

> ```gherkin

> **`Given the user hovers over the info icon, then the tooltip appears immediately without delay, showing the processing fees responsively.`**

> **| PASS |**
> ```

### Scenario 7: API Response – getAllStateConfigurations

> ```gherkin

> **`Given the program page is loaded, when the component initializes, then the backend is called with GET /getAllStateConfigurations, with a list of StateConfigurationsInfo containing stateAbbreviation, state, processingFee, and the data is stored in the component state and used to render the tooltip.`**

> ![image](/uploads/e8e8b6cb89b60fd848607575bf0a3044/image.png){width=900 height=445}
> ![image](/uploads/fd4faff10d3af3c9ce67177f6ab34980/image.png){width=616 height=600}
> ![image](/uploads/ae98959cdb341430218a67eed4cc0b6d/image.png){width=383 height=340}

> **| PASS |**
> ```

### Scenario 8: Update States via API and Verify Tooltip

> ```gherkin

> **`Given that the program's states are updated via API, when hovering over the info icon, then the tooltip displays the states configured via API.`**

> ![image](/uploads/ca9f99ae3d1fea7abbfe34d04a63a70b/image.png){width=900 height=542}
> ![image](/uploads/7414d2fa22d25010fdee5ce3191c91e9/image.png){width=564 height=349}

> **| PASS |**
> ```

---

### Scenario 9: Tooltip With Many States (21-40)

> ```gherkin

> **`Given a user selecting 30 states. When hovering over the info icon. Then the tooltip displays processing fees in 4 columns. And all selected states are visible.`**

> **| PASS |**
> ```

---

### Scenario 10: Tooltip Disappears on Mouse Leave

> ```gherkin

> **`Given the tooltip is displayed. When the user moves the mouse away from the info icon. Then the tooltip disappears immediately.`**

> **| PASS |**
> ```

---

### Scenario 11: Tooltip Layout Integrity

> ```gherkin

> **`Given states are selected and tooltip is displayed. Then the dark background properly contains all text. And no text overflows outside the tooltip boundaries. And columns are evenly distributed.`**

> **| PASS |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG



> ## Tests in stg

### Scenario 1: Tooltip With No States Selected

> ```gherkin

> **`When no state is selected in the "States" field, then when the user hovers over the info icon next to "Processing Fee Override", the tooltip displays the message "Select states to view processing fees", indicating that no fees can be shown without selected states.`**



> **| PASS |**
> ```

### Scenario 2: Tooltip With Few States

> ```gherkin

> **`Given I have a program that operates in multiple states. When I want to see the processing fees for my selected states. Then I can view all fees clearly organized without scrolling`**



---



> **| PASS |**
> ```

### Scenario 3: Tooltip With a Moderate Number of States

> ```gherkin

> **`Given a user selecting 7 states, when hovering over the info icon, then the tooltip displays the states organized into 3 columns, header "Processing Fee by State:" present, all fees formatted as currency, no text cut off.`**



> **| PASS |**
> ```

### Scenario 4: Tooltip With All States

> ```gherkin

> **`Given a user selecting all states, when hovering over the info icon, then the tooltip displays 5 columns with approximately 10 states per column, all 50 fees visible, tooltip background expands appropriately, and if the content exceeds the viewport height, internal scrolling is available.`**



> **| PASS |**
> ```

### Scenario 5: Currency Formatting in Tooltip

> ```gherkin

> **`Given the tooltip displaying processing fees, when states are selected, then each fee must be formatted as currency (e.g., $49.00, $35.50), with no truncated or broken values, using number-to-currency formatting.`**



> **| PASS |**
> ```

### Scenario 6: Hover Behavior – Immediate Appearance

> ```gherkin

> **`Given the user hovers over the info icon, then the tooltip appears immediately without delay, showing the processing fees responsively.`**

> **| PASS |**
> ```

### Scenario 7: API Response – getAllStateConfigurations

> ```gherkin

> **`Given the program page is loaded, when the component initializes, then the backend is called with GET /getAllStateConfigurations, with a list of StateConfigurationsInfo containing stateAbbreviation, state, processingFee, and the data is stored in the component state and used to render the tooltip.`**



> **| PASS |**
> ```

### Scenario 8: Update States via API and Verify Tooltip

> ```gherkin

> **`Given that the program's states are updated via API, when hovering over the info icon, then the tooltip displays the states configured via API.`**



> **| PASS |**
> ```

---

### Scenario 9: Tooltip With Many States (21-40)

> ```gherkin

> **`Given a user selecting 30 states. When hovering over the info icon. Then the tooltip displays processing fees in 4 columns. And all selected states are visible.`**

> **| PASS |**
> ```

---

### Scenario 10: Tooltip Disappears on Mouse Leave

> ```gherkin

> **`Given the tooltip is displayed. When the user moves the mouse away from the info icon. Then the tooltip disappears immediately.`**

> **| PASS |**
> ```

---

### Scenario 11: Tooltip Layout Integrity

> ```gherkin

> **`Given states are selected and tooltip is displayed. Then the dark background properly contains all text. And no text overflows outside the tooltip boundaries. And columns are evenly distributed.`**

> **| PASS |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------