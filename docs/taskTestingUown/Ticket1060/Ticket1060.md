---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1060#screenshot-1

UOWN | Origination | Investigate and Fix Possible Inconsistencies in Metrics on the Origination Portal Overview Page

Open  
  Ticket created 3 weeks ago by Yuri Araujo

#### Synopsis
It has been observed that some calculations displayed in the panels on the Overview page of the Origination Portal may be incorrect. The metrics presented do not seem to reflect the expected values, raising concerns about the accuracy of the displayed data.

#### Business Objective
Ensure the reliability of the metrics shown on the Origination Portal Overview page by verifying that all calculations are correct and accurately represent the processed data. This is crucial for data-driven decision-making.

#### Feature Request | Business Requirements

- Conduct a detailed investigation into the metrics displayed on the Overview page.
- Validate the calculations performed for each panel and identify any inconsistencies or logical errors.
- Check whether the metrics are being calculated correctly in the backend or directly in the frontend.
- Evaluate the data sources used and identify any discrepancies in filters, aggregations, or applied transformations.
- Provide a clear conclusion based on the investigation: whether the metrics are correct or require adjustments.
- If any issue is found, implement the necessary corrections in the calculations or data sources.
- Perform testing to ensure the metrics are accurate and information integrity is maintained after fixes.

Marcos Silvano  
@marcos.pacheco.silva  
3 weeks ago  
Maintainer  

**Test Case:**  
The application was displaying the wrong information for avg. approval amt and conversion rate

- Avg. Approval Amt was displaying the same value as Applications, it should display a different value.
- Conversion Rate wasn't applying the calculations in order to display the percentages.


-----


UOWN | Origination | Investigar e Corrigir Possíveis Inconsistências nas Métricas da Página de Visão Geral do Portal de Originação

Aberto  
  Tíquete criado há 3 semanas por Yuri Araujo

#### Sinopse
Foi observado que alguns cálculos exibidos nos painéis da página de Visão Geral do Portal de Originação podem estar incorretos. 
As métricas apresentadas não parecem refletir os valores esperados, levantando preocupações quanto à precisão dos dados exibidos.

#### Objetivo de Negócio
Garantir a confiabilidade das métricas apresentadas na página de Visão Geral do Portal de Originação, 
verificando se todos os cálculos estão corretos e representam fielmente os dados processados. Isso é crucial para a tomada de decisão baseada em dados.

#### Requisitos da Funcionalidade | Requisitos de Negócio

- Conduzir uma investigação detalhada nas métricas exibidas na página de Visão Geral.
- Validar os cálculos realizados para cada painel e identificar quaisquer inconsistências ou erros lógicos.
- Verificar se as métricas estão sendo calculadas corretamente no backend ou diretamente no frontend.
- Avaliar as fontes de dados utilizadas e identificar possíveis discrepâncias em filtros, agregações ou transformações aplicadas.
- Fornecer uma conclusão clara com base na investigação: se as métricas estão corretas ou se precisam de ajustes.
- Caso algum problema seja encontrado, implementar as correções necessárias nos cálculos ou nas fontes de dados.
- Realizar testes para garantir que as métricas estejam corretas e que a integridade das informações seja mantida após as correções.

Marcos Silvano  
@marcos.pacheco.silva  
3 semanas atrás  
Maintainer  

**Caso de Teste:**  
A aplicação estava exibindo informações incorretas para o valor médio de aprovação e para a taxa de conversão

- O valor médio de aprovação estava exibindo o mesmo valor das Aplicações, quando deveria ser um valor diferente.
- A taxa de conversão não estava aplicando os cálculos necessários para exibir os percentuais.


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


1. Cálculo da Conversion Rate
Antes: Estava apenas retornando o número bruto de “settledAndAboveLeadCount” (nem sempre fazia sentido como taxa).
Depois: Agora faz a divisão correta:
conversionRate = settledAndAboveLeadCount / approvedApps, com 2 casas decimais, só se approvedApps > 0.

Testes Recomendados:
Validar se a conversão está correta:
Cenário em que approvedApps > 0 e settledAndAboveLeadCount > 0 → Deve retornar a divisão correta (e.g. 2/10 = 0.20).
Cenário em que approvedApps == 0 → Deve retornar 0, sem exception.
Cenário em que settledAndAboveLeadCount == null ou zero → Deve retornar 0.
Testar arredondamento: Verifique se o resultado tem 2 casas decimais.
Testar resposta da API (se possível): Verifique se o valor é refletido no endpoint/serviço consumido pelo frontend.

2. Cálculo de Avg. Approval Amount
Antes: Buscava um “BigInteger” (aparentemente não era o valor correto).
Depois: Agora busca um “BigDecimal” diretamente do método/consulta certa, sem criar um BigDecimal de um BigInteger.

Testes Recomendados:
Verificar se o valor está correto para diferentes períodos e filtros:
Cenário com aprovações, valores diferentes, datas variadas, etc.
Cenário sem aprovações (deve retornar null ou zero, conforme regra).
Testar integração com frontend: Se a alteração reflete certinho na tela.

---

A aplicação estava exibindo informações incorretas para o valor médio de aprovação e para a taxa de conversão

- O valor médio de aprovação estava exibindo o mesmo valor das Aplicações, quando deveria ser um valor diferente.
- A taxa de conversão não estava aplicando os cálculos necessários para exibir os percentuais.

---

1. Testar a Correção e Confiabilidade das Métricas
Todas as métricas exibidas nos painéis da Overview devem ser testadas, não só as citadas (Avg. Approval Amt e Conversion Rate), mas também Applications, Approved, Denied, etc.
Verificar se os valores estão de acordo com o esperado para diferentes cenários e filtros (datas, merchant, status etc).
Testar diferentes períodos: Filtrar por datas recentes, antigas e períodos sem movimentação.

2. Conferir a Lógica de Cálculo
Validar os cálculos de cada painel:
Por exemplo, Conversion Rate deve mostrar porcentagem correta, e Avg. Approval Amount não deve ser igual ao número de Applications.
Verificar se a lógica do cálculo está no backend ou frontend e se está consistente (os dois lados devem exibir o mesmo valor, não pode haver divergência).
Comparar resultado na UI vs. resposta da API, se possível.

3. Avaliar Fontes de Dados e Filtros
Verificar se as métricas mudam corretamente conforme a seleção de filtros (merchant, data, status, etc).
Checar se não há discrepâncias devido a filtros, agrupamentos ou transformações (ex: aprovações agrupadas erradas, soma em vez de média, etc).

4. Cobertura de Cenários Limite (Casos de Borda)
Testar cenário sem dados: O painel deve exibir “0” ou “-”, sem erro ou crash.
Testar grande volume de dados: Verificar performance e se o cálculo permanece correto.
Testar dados inconsistentes ou incompletos: O sistema deve se comportar de forma previsível.

7. Especificamente Corrigir e Garantir:
Avg. Approval Amount: Não pode ser igual ao valor de Applications.
Conversion Rate: Tem que mostrar percentual calculado corretamente, não um valor bruto.


---

1. Número de Aplicações
O que é:
Total de solicitações (applications) recebidas dentro do período/filtro selecionado.
Como validar:
Deve bater com o número real de registros criados no sistema para o filtro/datas selecionados.
Exemplo:
Se 10 pessoas aplicaram para leasing em julho, deve mostrar “10”.

2. Approval Rate (Taxa de Aprovação)
O que é:
Percentual de aplicações que foram aprovadas em relação ao total de aplicações recebidas.
Fórmula típica:
(número de aplicações aprovadas / número total de aplicações) x 100
Como validar:
Ver se o percentual faz sentido. Exemplo: 10 aplicações, 4 aprovadas → 40%.
Atenção: Não confundir com “conversion rate”.

3. Avg. Approval Amt. (Valor Médio Aprovado)
O que é:
A média dos valores aprovados nas aplicações aprovadas no período.
Fórmula:
(soma de todos os valores aprovados) / (quantidade de aplicações aprovadas)
Como validar:
Verifique se é diferente do número de aplicações e se está no formato de moeda.
Exemplo:
5 aprovações de R$ 10.000 cada → média = R$ 10.000.

4. $ Amt. of Open Apvl. (Valor em Aprovações em Aberto)
O que é:
Soma dos valores das aplicações que foram aprovadas, mas ainda não foram finalizadas/concluídas (ainda em aberto).
Como validar:
Checar se bate com o status das aplicações (aprovadas, mas não fundeadas/não assinadas).
Exemplo:
3 aprovações de R$ 8.000 ainda abertas → total = R$ 24.000.

5. $ Amt. of Funded TXN (Valor de Transações Fundiadas)
O que é:
Soma dos valores das aplicações que já foram efetivamente fundeadas/pagamento realizado.
Como validar:
Verificar se só soma aplicações que atingiram status de “funded”.
Exemplo:
2 contratos pagos, um de R$ 15.000 e outro de R$ 12.000 → total = R$ 27.000.

6. $ Amt. of Approvals With Signed Leases (Valor de Aprovações com Contratos Assinados)
O que é:
Soma dos valores das aplicações aprovadas que já tiveram o contrato assinado (mas podem ainda não estar fundeadas).
Como validar:
Checar se só conta aprovações com contrato assinado no status.
Exemplo:
1 contrato assinado, R$ 10.000 → total = R$ 10.000.

7. $'s Approaching Expiry (Valores Próximos de Expirar)'
O que é:
Soma dos valores de aprovações que vão expirar em breve (ex: propostas que vão vencer se não forem assinadas/fundiadas até X dias).
Como validar:
Checar se os valores exibidos estão realmente dentro da “janela” de expiração configurada no sistema.
Exemplo:
2 aprovações próximas de expirar, R$ 5.000 e R$ 7.000 → total = R$ 12.000.

8. Conversion Rate (Taxa de Conversão)
O que é:
Percentual de aplicações que efetivamente viraram contratos assinados ou fundeados (ações “finalizadas” de fato), em relação ao total de aplicações aprovadas ou recebidas (depende da regra de negócio exata).
Fórmula comum:
(número de contratos assinados/fundiados / número de aplicações aprovadas) x 100
Como validar:
Conferir se faz sentido: exemplo, 10 aprovações, 3 contratos assinados → 30%.

---

Períodos Disponíveis no Filtro
O usuário pode escolher entre os seguintes períodos para visualizar as métricas (exceto “applications”):
Today (Hoje)
Yesterday (Ontem)
This Week (Esta Semana)
This Month (Este Mês)
This Year / Year to Date (Ano até agora)

Regra:
Todos os painéis, exceto “Número de Aplicações”, devem respeitar o filtro de período selecionado.
O painel “Número de Aplicações” sempre mostra o total geral (não filtra por período).
Todos os outros painéis (Approval Rate, Avg. Approval Amt., Funded TXN, Signed Leases, etc) devem exibir valores apenas para o período selecionado.

O que precisa ser testado com base nisso:
Alterar cada opção do filtro de período e verificar que:
As métricas (menos “Número de Aplicações”) mudam corretamente de acordo com o período.
O valor de “Número de Aplicações” permanece o mesmo, independente do filtro.
Os resultados batem com o que é esperado para aquele recorte de tempo.

Validação visual e via API:
Conferir se os dados exibidos refletem o esperado conforme filtro aplicado.
Se possível, validar o request enviado para o backend se está levando o período correto.

Cenários de Borda Adicionais para Filtros de Período
1. Período “Hoje” com múltiplos status
Existem aplicações criadas hoje, mas nenhuma foi aprovada/fundiada/assinada.
Esperado: Apenas “Número de Aplicações” mostra valor > 0, outros painéis mostram 0.

2. Período “Yesterday” com todas as etapas completas
Todas as aplicações de ontem foram aprovadas, assinadas e fundiadas.
Esperado: Todos os painéis mostram valores positivos (sem inconsistência de cálculo).

3. Período “This Week” com mistura de dados
Algumas aplicações aprovadas, outras negadas, algumas assinadas mas não fundiadas, outras fundiadas mas não assinadas, etc.
Esperado: Cada painel reflete apenas as aplicações correspondentes ao seu status dentro do período.

4. Período “This Month” com picos de movimentação
Volume muito alto de aplicações (stress test de performance).
Esperado: Sistema responde rápido, sem travar; cálculos corretos mesmo com dados grandes.

5. Período “This Year” com datas futuras
Existem aplicações cadastradas com data futura (erro de cadastro/dados corrompidos).
Esperado: Apenas aplicações até o dia corrente são consideradas, ignorando futuros.

6. Dados duplicados
Duas aplicações idênticas criadas no mesmo período.
Esperado: Cada métrica conta apenas o que deveria (evitar somar duplicado sem querer).

7. Cancelamentos e Reprovações
Aplicações criadas e depois canceladas/reprovadas.
Esperado: Não entram em painéis de aprovação/conversão/etc.

8. Reprocessamento/Atualização
Uma aplicação foi aprovada, depois negada ou vice-versa dentro do mesmo período.
Esperado: O status mais recente é considerado, sem duplicidade.

9. Valores nulos ou inválidos
Alguma métrica vem como null, NaN ou valor impossível (ex: negative number).
Esperado: Sistema mostra “-” ou 0, nunca um valor estranho ou erro em tela.

10. Feriado/Fim de semana
Período “Hoje” ou “Yesterday” cai em fim de semana/feriado sem movimentação.
Esperado: Todos os painéis (exceto “Número de Aplicações” histórico) mostram 0 ou “-”.

11. Alteração rápida de períodos
Usuário troca rapidamente entre diferentes períodos várias vezes.
Esperado: Não exibe dados inconsistentes ou mistura de períodos. Sempre mostra valores corretos para o filtro selecionado.

12. Exportação de CSV sem dados
Exportar os dados de um período sem movimentação.
Esperado: CSV gerado, mas vazio ou apenas cabeçalho.

13. Período com apenas aplicações parcialmente concluídas
Apenas aplicações abertas, sem nenhuma aprovada ou concluída.
Esperado: Somente painel de “Open” mostra valor, demais mostram 0.

14. Aplicações criadas em um período, concluídas em outro
Aplicação criada ontem, aprovada/assinada hoje.
Esperado: Cada painel só mostra dados do período escolhido: se filtro é “Hoje”, mostra só o que foi concluído hoje.


---------------------------------------------------------------------------------------------------------------------------

R6.25.1.42.0_metricsOverviewPage_Ticket1060

status approved status interno limpo
58 4280 = 248240
2 1710 = 3420
10 4090 = 40900
2 1920 = 2840
valor total = 295400
total qtd = 72
result = 4102,77

status approved status interno uw_approved
-1920
-1920
valor total = 295400
valor total menos os leases que nao tem aqui 9116 cc_auth_passed e 9112 error = 291560
qtd de leases = 71
result = 4106,47



final Amount
4090 - 10 = 40900
1710 - 2 = 3420
4280 - 25 = 107000
5136 - 3 - 15408

somas = 166728
qtd = 40
result = 4168,2

approval amount
4090 - 10 = 40900
1710 - 2 = 3420
4280 - 28 = 119840

somas = 164160
qtd = 40
result = 4104

4280
32 = 136960
33 = 141240
total = 278200

approval amount
4090 - 10 = 40900
1710 - 2 = 3420
4280 - 66 = 278200
qtd  - 78

322520



4090 - 10 = 40900
1710 - 2 = 3420
4280 - 36 = 4133

4280


-----


feat(metrics): created all 8 dashboard metrics and database connection structure

Implemented the following metrics:
- Applications
- Approval Rate
- Avg. Approval Amt
- $ Amt. of Open Apvl.
- $ Amt. of Funded TXN
- $ Amt. of Approvals With Signed Leases
- $'s Approaching Expiry
- Conversion Rate

Added database connection structure with a generic method for executing parameterized queries.





cenário --> plano de protecao nao disponivel no estado - CA

-----

> 
> ```gherkin
> Then Validates the Applications metric for the period "Today"
> Then Validates the Approval Rate metric for the period "Today"
> Then Validates the Avg. Approval Amt. metric for the period "Today"
> Then Validates the $ Amt. of Open Apvl. metric for the period "Today"
> Then Validates the $ Amt. of Funded TXN metric for the period "Today"
> Then Validates the $ Amt. of Approvals With Signed Leases metric for the period "Today"
> Then Validates the $'s Approaching Expiry metric for the period "Today"
> Then Validates the Conversion Rate metric for the period "Today "
> ```
>