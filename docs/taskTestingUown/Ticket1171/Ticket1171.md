----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

```markdown

## 🇺🇸 English

### Status
**Open**  
Ticket created 2 weeks ago by **Yuri Araujo**

---

## Synopsis
When a program is created, modified, or individually cloned, the system automatically records a log entry in the **Notes** table at the bottom of the program page.  
However, when a **program group** is cloned, the resulting programs **do not receive log entries**. Additionally, **edits made to these cloned programs** are not generating logs as expected.

This ticket ensures that logs are properly recorded **both during group cloning and in subsequent edits**.

---

## Business Objective
Ensure **full traceability** across the program lifecycle by providing transparent logging for cloning and editing operations. This supports **auditing, compliance, and internal monitoring**.

---

## Business Requirements (Feature Request)

### 1. Create logs when cloning a program group
- When a program group is cloned, **each resulting program** must automatically receive a log entry in the **Notes** table.
- The entry must indicate that the program was created via **group cloning**, following the **existing individual cloning log pattern**.

### 2. Log edits made to cloned programs
- Any modification applied to programs created through group cloning must generate a **new log entry** in the **Notes** table, consistent with individually created programs.

### 3. Consistency with existing behavior
- Use the **same formatting, wording, and style** currently used in the **Notes** table.
- **Do not change** existing log rules or structures; only **extend** logging to group cloning scenarios.

---

## Attachment
- **Zendesk Ticket:** 6344

---

## Steps to Reproduce
1. Clone a **program group**.
2. Verify that each cloned program has a log entry in the following format:

```

Program {cloned_program_name} cloned based on program:
[name: {base_program_name}, pk: {base_program_pk}]

```

3. Edit one of the cloned programs.
4. Confirm that a new log entry is created in the **Notes** table.

---

## Attributes
- **Status:** To do  
- **Owner:** Davi Artur  
- **Labels:** dev, frontend, priority: medium, type: business request  
- **Workflow:** qa-in-process  
- **Main:** Uown | RU11.25.1.47.0  
- **Milestone:** Uown | RU12.25.1.47.0  

---

## Development
- **Merge Request:** `/uown/frontend/origination#1171`
- **Backend MR:** `uown/backend/svc!1185` (merged)
- **Files changed:** 6  
- Added cloning metadata (`clonedProgramPk`, `clonedProgramName`)
- Async log generation for group cloning
- Updated unit tests

---

## Participants
- Davi Artur  
- Priyanka Namburu  
- Yuri Araujo  
- José Mendes  


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# UOWN | Origination | Geração de logs para programas clonados a partir de um grupo de programas

## 🇧🇷 Português

### Status
**Aberto**  
Tíquete criado há 2 semanas por **Yuri Araujo**

---

## Sinopse
Quando um programa é criado, modificado ou clonado individualmente, o sistema registra automaticamente uma entrada de log na tabela **Notes**, localizada na parte inferior da página do programa.  
Entretanto, quando um **grupo de programas** é clonado, os programas resultantes **não recebem registros** nessa tabela. Além disso, **edições realizadas nesses programas clonados** também não estão gerando logs conforme o esperado.

Este tíquete garante que o sistema registre corretamente os logs **tanto no momento da clonagem em grupo quanto em edições subsequentes**.

---

## Objetivo de Negócio
Garantir **rastreabilidade completa** no ciclo de vida dos programas, fornecendo logs transparentes para operações de clonagem e edição. Isso dá suporte a **auditoria, compliance e monitoramento interno**.

---

## Requisitos de Negócio (Feature Request)

### 1. Criar logs ao clonar um grupo de programas
- Ao clonar um grupo de programas, **cada programa resultante** deve receber automaticamente uma entrada na tabela **Notes**.
- A entrada deve indicar que o programa foi criado por **clonagem em grupo**, seguindo o **mesmo padrão já utilizado na clonagem individual**.

### 2. Registrar edições em programas clonados
- Qualquer modificação aplicada a programas criados por clonagem em grupo deve gerar uma **nova entrada de log** na tabela **Notes**, mantendo o comportamento existente para programas criados individualmente.

### 3. Consistência com o comportamento atual
- Utilizar o **mesmo formato, texto e estilo** já existentes na tabela **Notes**.
- **Não alterar** regras ou estruturas de log existentes; apenas **estender** o comportamento para cenários de clonagem em grupo.

---

## Anexo
- **Zendesk Ticket:** 6344

---

## Passos para Teste (Steps to Reproduce)
1. Clonar um **grupo de programas**.
2. Verificar se cada programa clonado possui um log no formato:

```

Program {cloned_program_name} cloned based on program:
[name: {base_program_name}, pk: {base_program_pk}]

```

3. Editar um dos programas clonados.
4. Confirmar que uma nova entrada de log foi criada na tabela **Notes**.

---

## Atributos
- **Status:** To do  
- **Responsável:** Davi Artur  
- **Etiquetas:** dev, frontend, priority: medium, type: business request  
- **Workflow:** qa-in-process  
- **Principal:** Uown | RU11.25.1.47.0  
- **Marco:** Uown | RU12.25.1.47.0  

---

## Desenvolvimento
- **Merge Request:** `/uown/frontend/origination#1171`
- **Backend MR:** `uown/backend/svc!1185` (mesclado)
- **Arquivos alterados:** 6  
- Inclusão de atributos de clonagem (`clonedProgramPk`, `clonedProgramName`)
- Geração assíncrona de logs para clonagem em grupo
- Ajustes em testes unitários

---

## Participantes
- Davi Artur  
- Priyanka Namburu  
- Yuri Araujo  
- José Mendes  

---

---

```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



````markdown
# Lista de Requisitos de Teste – Testes Manuais  
UOWN | Origination | Logs para Programas Clonados via Grupo

---

## 🇧🇷 Português

Abaixo está a **lista completa e consolidada de requisitos de teste**, extraída **tanto da descrição da tarefa quanto das alterações de desenvolvimento (backend e testes)**.  
Esta lista foi estruturada para **execução manual**, com foco em rastreabilidade, consistência de logs e cobertura funcional.

---

## 1. Clonagem de Grupo de Programas

### RT-01 — Criação de programas ao clonar um grupo
- **Pré-condição:** Existe um grupo de programas válido.
- **Ação:** Clonar o grupo de programas.
- **Resultado esperado:**
  - Todos os programas do grupo são clonados com sucesso.
  - Cada programa clonado recebe um novo `programPk`.
  - O nome do programa clonado segue o padrão:
    ```
    {programNameOriginal}_{groupName}
    ```

KW-16-2

---

### RT-02 — Persistência de metadados de clonagem
- **Ação:** Clonar um grupo de programas.
- **Resultado esperado para cada programa clonado:**
  - `clonedProgramPk` contém o `programPk` do programa original.
  - `clonedProgramName` contém o nome do programa original.
  - Esses campos **não são exibidos na UI**, mas são usados para geração de logs.

---

## 2. Logs de Clonagem (Tabela Notes)

### RT-03 — Log individual por programa clonado
- **Ação:** Clonar um grupo de programas.
- **Resultado esperado:**
  - Cada programa clonado possui **uma entrada própria** na tabela **Notes**.
  - Não é permitido apenas um log genérico sem associação ao programa.

---

### RT-04 — Formato correto do log de clonagem
- **Ação:** Acessar a tabela **Notes** de um programa clonado.
- **Resultado esperado:**
  - O log segue **exatamente** o padrão abaixo (texto e estrutura):
    ```
    Program '{cloned_program_name}' cloned from original program: 
    [name: '{base_program_name}', pk: {base_program_pk}]
    ```

---

### RT-05 — Associação correta do log ao programa
- **Ação:** Verificar o log na tabela **Notes**.
- **Resultado esperado:**
  - O log está vinculado ao **PK do programa clonado**, não ao grupo.
  - O usuário exibido no log é o usuário autenticado que realizou a ação.

---

## 3. Logs de Criação em Massa (Grupo)

### RT-06 — Log de criação em massa do grupo
- **Ação:** Clonar um grupo de programas.
- **Resultado esperado:**
  - Um log adicional é criado indicando a criação e associação dos programas ao grupo.
  - O log contém a lista de PKs dos programas criados:
    ```
    Programs [pk1, pk2, pk3] created and assigned to group {groupName}
    ```

---

## 4. Edição de Programas Clonados

### RT-07 — Log ao editar um programa clonado
- **Pré-condição:** Programa criado via clonagem de grupo.
- **Ação:** Editar qualquer campo do programa (ex.: nome, configuração, status).
- **Resultado esperado:**
  - Uma **nova entrada de log** é criada na tabela **Notes**.
  - O comportamento é **idêntico** ao de programas criados individualmente.

---

### RT-08 — Nenhuma regressão em logs de edição
- **Ação:** Editar programas:
  - Criados individualmente
  - Clonados individualmente
  - Clonados via grupo
- **Resultado esperado:**
  - Todos continuam gerando logs corretamente.
  - Nenhum cenário deixa de gerar logs após a mudança.

---

## 5. Consistência e Regressão

### RT-09 — Consistência de formatação dos logs
- **Ação:** Comparar logs de:
  - Clonagem individual
  - Clonagem em grupo
- **Resultado esperado:**
  - Mesmo padrão de texto, capitalização e estrutura.
  - Nenhuma diferença visual ou semântica.

---

### RT-10 — Não alteração de regras existentes
- **Ação:** Executar fluxos antigos (criação, edição, clonagem individual).
- **Resultado esperado:**
  - Nenhuma mudança no comportamento de logs já existentes.
  - Apenas o novo cenário (clonagem em grupo) foi estendido.

---

## 6. Concorrência e Execução Assíncrona

### RT-11 — Geração assíncrona de logs
- **Ação:** Clonar um grupo grande de programas.
- **Resultado esperado:**
  - Os logs aparecem corretamente mesmo sendo gerados de forma assíncrona.
  - Nenhum log ausente ou duplicado.

---

## 7. Validação Negativa

### RT-12 — Clonagem sem falhas de log
- **Ação:** Clonar grupo e navegar imediatamente para os programas criados.
- **Resultado esperado:**
  - Nenhum programa clonado fica sem log na tabela **Notes**.

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇺🇸 English

Below is the **complete and consolidated list of manual test requirements**, extracted from **both the task description and development changes**.

---

## 1. Program Group Cloning

### TR-01 — Program creation during group cloning
- **Precondition:** A valid program group exists.
- **Action:** Clone the program group.
- **Expected result:**
  - All programs are cloned successfully.
  - Each cloned program has a new `programPk`.
  - Program name follows the pattern:
    ```
    {originalProgramName}_{groupName}
    ```

---

### TR-02 — Cloning metadata persistence
- **Action:** Clone a program group.
- **Expected result for each cloned program:**
  - `clonedProgramPk` contains the original program PK.
  - `clonedProgramName` contains the original program name.
  - These fields are not exposed in the UI, only used for logging.

---

## 2. Cloning Logs (Notes Table)

### TR-03 — Individual log per cloned program
- **Action:** Clone a program group.
- **Expected result:**
  - Each cloned program has its **own log entry** in the **Notes** table.

---

### TR-04 — Correct cloning log format
- **Action:** Open the **Notes** table of a cloned program.
- **Expected result:**
````

Program '{cloned_program_name}' cloned from original program:
[name: '{base_program_name}', pk: {base_program_pk}]

```

---

### TR-05 — Correct log association
- **Action:** Inspect the Notes table.
- **Expected result:**
- Log is linked to the cloned program PK.
- Logged user matches the authenticated user.

---

## 3. Bulk Creation Log

### TR-06 — Group creation log
- **Action:** Clone a program group.
- **Expected result:**
```

Programs [pk1, pk2, pk3] created and assigned to group {groupName}

```

---

## 4. Editing Cloned Programs

### TR-07 — Log on edit
- **Precondition:** Program cloned via group.
- **Action:** Edit any program field.
- **Expected result:**
- A new Notes log is created.
- Behavior matches individually created programs.

---

### TR-08 — No regression in edit logging
- **Action:** Edit programs created by different methods.
- **Expected result:**
- Logs are consistently generated in all cases.

---

## 5. Consistency & Regression

### TR-09 — Log formatting consistency
- **Expected result:**
- Same wording, format, and structure as existing logs.

---

### TR-10 — No behavior change to existing rules
- **Expected result:**
- Existing creation and edit logs remain unchanged.

---

## 6. Asynchronous Execution

### TR-11 — Async log generation
- **Action:** Clone a large program group.
- **Expected result:**
- All logs are generated correctly.
- No missing or duplicated entries.

---

## 7. Negative Validation

### TR-12 — No missing logs
- **Action:** Clone a group and immediately review cloned programs.
- **Expected result:**
- Every cloned program contains a Notes log.

---
```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
QA2

> ## Tests in qa2

***Logs are generated when programs are cloned in the expected format***

![Screenshot_at_Dec_15_13-39-35](/uploads/24499f20433d70a4d2559be50b52bfcd/Screenshot_at_Dec_15_13-39-35.png){width=900 height=430}
![Screenshot_at_Dec_15_13-43-46](/uploads/18988090c14e4294828514f6210b1acb/Screenshot_at_Dec_15_13-43-46.png){width=900 height=73}
![Screenshot_at_Dec_15_13-53-36](/uploads/9b77cacfba685e39a36c1d05c270d478/Screenshot_at_Dec_15_13-53-36.png){width=899 height=86}

**| PASS |**

---

***Bulk program updates generate logs as expected; however, when updating program values and information, the logs highlight the applied value together with the next modified parameter***

![Screenshot_at_Dec_15_13-53-42](/uploads/f383b015a1b6ac1a154c5732c51e4eaf/Screenshot_at_Dec_15_13-53-42.png){width=900 height=90}
![Screenshot_at_Dec_15_13-56-38](/uploads/0aca892103035d85c7a018e223e58be9/Screenshot_at_Dec_15_13-56-38.png){width=819 height=600}
![Screenshot_at_Dec_15_13-57-04](/uploads/824a692aabc3188ad20cd76d126635c2/Screenshot_at_Dec_15_13-57-04.png){width=744 height=95}

**| PASS |**

---

***When all allowed frequency overrides are removed, a log is generated recording the change to an empty value. Is the expected behavior to log this as null instead?***

![image](/uploads/4d4b680b3ce3ce04ed8822e00623fee6/image.png){width=900 height=313}

**| PASS |**

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg

***Logs are generated when programs are cloned in the expected format***

![image](/uploads/e82ab269b9b32384631805b16ee728ae/image.png){width=900 height=51}

**| PASS |**

---

***Bulk program updates generate logs as expected; however, when updating program values and information, the logs highlight the applied value together with the next modified parameter***

![image](/uploads/af853c3beb97b8118cf7c4c3a0d5877e/image.png){width=900 height=70}

**| PASS |**

---

***When all allowed frequency overrides are removed, a log is generated recording the change to an empty value. Is the expected behavior to log this as null instead?***

![image](/uploads/0075085bd107c2ff87717cdd8df682c3/image.png){width=900 height=44}
![image](/uploads/e87387a8d5202f6747af5110647eab19/image.png){width=900 height=43}

**| PASS |**

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------