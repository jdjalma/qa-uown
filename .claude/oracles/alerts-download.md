---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/AlertsPage.ts
---

# BDD Oracle — Download CSV de Alerts

> Portal: Origination (`/alerts`)
> Operação: baixar a tabela de alerts como um arquivo CSV via o botão "Download CSV".

---

## Feature: Download CSV de Alerts

### Background

```gherkin
Given o usuário está autenticado no portal Origination como manager
And o usuário navega para "/alerts"
```

---

### Scenario CT-AD-01: Botão Download CSV está visível na página Alerts

```gherkin
When o usuário chega em "/alerts"
Then um botão "Download CSV" está visível na área superior direita da seção Alerts
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Botão de download visível | button "Download CSV" | Visível e habilitado | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AD-02: Clicar em Download CSV dispara o download do arquivo

```gherkin
When o usuário clica no botão "Download CSV"
Then um arquivo CSV é baixado para o dispositivo do usuário
And o arquivo é nomeado "alerts-results.csv" ou similar
And o arquivo contém as colunas: Lead Pk, Date, Message
And as linhas refletem o estado atual do filtro (intervalo de datas / texto de busca)
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Download iniciado | evento de download do browser ou blob URL | Download do arquivo inicia | |
| 2 | Colunas do arquivo | linha de cabeçalho do CSV | Contém Lead Pk, Date, Message (ou equivalente) | |
| 3 | Contagem de linhas | linhas de dados do CSV | Corresponde à contagem de resultados filtrados exibida na paginação | |
| 4 | Valores de data dentro do intervalo | valores da coluna Date | Todos dentro do intervalo From/To ativo | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AD-03: Download CSV reflete o estado ativo do filtro

```gherkin
Given o usuário aplicou um filtro de intervalo de datas (From / To) na página Alerts
When o usuário clica em "Download CSV"
Then o CSV baixado contém apenas os alerts que correspondem ao filtro ativo
And o número total de linhas no CSV é igual à contagem exibida no contador de paginação
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Contagem de linhas do CSV corresponde à UI | paginação "X-Y of Z" vs linhas do CSV | Iguais | |
| 2 | Datas no CSV dentro do filtro | coluna Date no CSV | Todas dentro do intervalo From/To | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```
