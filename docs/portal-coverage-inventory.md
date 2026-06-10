# Inventário de Páginas e Funcionalidades - 3 Portais

Planilha de cobertura para medir **o quanto já testamos**. Lista todas as páginas e funcionalidades dos portais **Origination**, **Servicing** e **Customer Portal**, no mesmo formato da planilha de tracking de vocês.

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `portal-coverage-inventory.csv` | Importar/colar direto na planilha (Google Sheets / Excel) |
| `portal-coverage-inventory.xlsx` | Versão formatada (cabeçalho fixo, dropdown de Task Status, cores por portal) |

Colunas (iguais às da planilha `New Rows Dev3`): `Enviroment | Portal | Tested Features and Functions Task | Check | Double Check | Task Status | Notes`. As colunas **Check / Double Check / Task Status** vêm em branco para vocês preencherem. O dropdown de Task Status traz: Not Tested, Done, Waiting Double Check, In Progress, BUG, SKIP, N/A.

## Totais

| Portal | Linhas |
|--------|-------:|
| Origination | 95 |
| Servicing | 51 |
| Customer Portal | 31 |
| **Total** | **177** |

## Como foi levantado

- **Navegação ao vivo** nos portais via MCP Playwright, ambiente **dev3**, perfil **manager**, em 2026-06-05. Hierarquia UI -> codigo (regra #18: discovery comeca pelo comportamento real do portal).
- **Origination**: 100% mapeado ao vivo (16+3 itens de menu, filtros de busca campo a campo, telas de detalhe de lead/merchant/programa, wizard de nova aplicacao, configuracao de merchant com ~90 campos).
- **Servicing**: estrutura da conta mapeada ao vivo (busca, pagina de conta com todas as secoes, documentos); as acoes da conta (Make Payment, Settlement, Refund, Move Due Date, Change Frequency, etc.) foram confirmadas pelos page objects ja exercitados por testes, pois sao acionadas por modais/secoes condicionais ao status.
- **Customer Portal**: login + tela de codigo de verificacao (OTP de 6 digitos) verificados ao vivo. As paginas internas autenticadas, o fluxo de aplicacao e o fluxo de assinatura (GowSign/SignWell) foram enumerados a partir dos page objects e regras de negocio (ver observacao abaixo).

## Observacoes

- **OTP em dev3**: apos disparar o codigo de verificacao para dois clientes, nenhum email de codigo chegou ao inbox (~29 min). Pode ser uma lacuna de entrega do email de verificacao em dev3. Nao classificado como bug; vale confirmar. Por isso o login completo no Customer Portal nao foi concluido ao vivo nesta sessao.
- **Acoes condicionais ao status**: varias acoes do lead (E-Sign, Fund, Settle, Cancel) e da conta so aparecem em determinados status. Estao listadas mesmo quando nao visiveis na conta de exemplo.
- **Customer Portal e mobile-heavy** (regra #15: inspecionar em 375 / 768 / 1440). Login verificado em 390x844.
- A granularidade segue o estilo de vocês (uma linha por funcao/feature; filtros de busca listam os campos na coluna). Sintam-se livres para desdobrar uma linha em varias (ex.: um campo de filtro por linha) ou agrupar.
- Pode haver sobreposicao com linhas ja existentes na planilha de vocês. Ao mesclar, reconciliem duplicatas.
