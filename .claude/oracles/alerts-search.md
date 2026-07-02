---
last-reviewed: 2026-06-28
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
covers:
  - src/pages/origination/AlertsPage.ts
---

# BDD Oracle — Busca de Alerts

> Portal: Origination (`/alerts`)
> Operação: buscar e filtrar a tabela de alerts por intervalo de datas e/ou texto de mensagem.

---

## Feature: Busca de Alerts

### Background

```gherkin
Given o usuário está autenticado no portal Origination como manager
And o usuário navega para "/alerts"
```

---

### Scenario CT-AS-01: Página Alerts carrega com resultados padrão

```gherkin
When o usuário chega em "/alerts"
Then o título da página "Alerts" está visível
And um botão "Filters" está visível
And uma tabela é exibida com as colunas: "Lead Pk", "Date", "Message"
And os botões "Email CSV" e "Download CSV" estão visíveis
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Título da página visível | h1 / page heading "Alerts" | Visível | |
| 2 | Botão Filters visível | button "Filters" | Visível | |
| 3 | Headers da tabela | colunas do thead | Lead Pk, Date, Message | |
| 4 | Botões de export | button "Email CSV", button "Download CSV" | Ambos visíveis | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AS-02: Painel de filtros expande ao clicar no botão Filters

```gherkin
When o usuário clica no botão "Filters"
Then um painel de filtros aparece abaixo do botão Filters
And um campo de data "From" é exibido, pré-preenchido com a data de hoje
And um campo de data "To" é exibido, pré-preenchido com a data de hoje
And um campo de texto "Search" é exibido com placeholder "Search table"
And um botão de ação "Search" é exibido
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Painel de filtros visível | generic contendo From/To/Search | Visível após o clique | |
| 2 | Campo From | searchbox "From" | Visível, pré-preenchido com a data de hoje (MM/DD/YYYY) | |
| 3 | Campo To | searchbox "To" | Visível, pré-preenchido com a data de hoje (MM/DD/YYYY) | |
| 4 | Texto de busca | textbox "Search" | Visível, placeholder "Search table" | |
| 5 | Botão Search | button "Search" | Visível e habilitado | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AS-03: Busca por intervalo de datas retorna resultados filtrados

```gherkin
When o usuário abre o painel Filters
And o usuário define a data "From" para uma data passada
And o usuário define a data "To" para hoje
And o usuário clica no botão "Search"
Then a tabela de alerts é atualizada
And apenas alerts com Date dentro do intervalo selecionado são exibidos
And o contador de paginação reflete o total de resultados filtrados
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Tabela atualizada | linhas do rowgroup | Linhas filtradas pelo intervalo de datas | |
| 2 | Datas dentro do intervalo | cada célula "Date" | Todas as datas entre From e To | |
| 3 | Contador de paginação | navigation "X-Y of Z" | Reflete a contagem filtrada | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AS-04: Busca por texto filtra a coluna Message

```gherkin
When o usuário abre o painel Filters
And o usuário digita uma palavra-chave no campo de texto "Search"
And o usuário clica no botão "Search"
Then a tabela de alerts é atualizada
And apenas as linhas cuja coluna Message contém a palavra-chave são exibidas
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Tabela atualizada com match da palavra-chave | cell "Message" | Contém a palavra-chave digitada | |
| 2 | Linhas sem match excluídas | linhas do rowgroup | Nenhuma linha sem a palavra-chave em Message | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```

---

### Scenario CT-AS-05: Lead Pk na tabela é um link clicável para o detalhe do lead

```gherkin
When a tabela de alerts exibe resultados
Then cada valor na coluna "Lead Pk" é um link clicável
And clicar em um link Lead Pk navega para "/customers/{leadPk}"
```

### Oracle

```
| # | Checkpoint | Elemento | Esperado | Resultado |
|---|-----------|---------|---------|--------|
| 1 | Lead Pk é link | link dentro da célula "Lead Pk" | href = /customers/{pk} | |
| 2 | Navegação | URL da página após o clique | https://origination-*.uownleasing.com/customers/{pk} | |
```

```bash
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- src/pages/origination/AlertsPage.ts
```
