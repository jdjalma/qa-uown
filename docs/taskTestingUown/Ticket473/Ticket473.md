-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/473


UOWN | Servicing | Enable PDF Download for Payment History in Customer Portal

Synopsis
As a customer, I want to download my Payment History as a PDF from the Customer Portal so that I can save or share my payment records. In the Customer Portal → Account Summary section, users can view Payment History. Add a Download PDF button to allow users to export only the Payment History (no other page information) as a PDF file.

Business Objective
Provide customers with a simple way to obtain a portable, shareable record of their payments directly from the portal, improving usability and reducing support requests for statements.

Feature Request | Business Requirements
    Add a Download PDF button in Account Summary → Payment History.
    The generated PDF must include only the Payment History data (exclude other Customer Portal sections).


Test instructions
The customer portal page have a print button, using that button  should display a optimized version of Account Activity
that can be used to print.

Optimizations:
hidden navigation bars, search field and table footer
if paginated all elements will be displayed at once

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Habilitar download de PDF do Histórico de Pagamentos no Portal do Cliente

Synopsis
Como cliente, quero baixar meu Histórico de Pagamentos em PDF a partir do Portal do Cliente para que eu possa salvar ou compartilhar meus registros de pagamento.
No Portal do Cliente → seção Resumo da Conta, os usuários podem visualizar o Histórico de Pagamentos.
Adicionar um botão Baixar PDF para permitir que os usuários exportem apenas o Histórico de Pagamentos (nenhuma outra informação da página) como um arquivo PDF.
   
    
Business Objective
Fornecer aos clientes uma maneira simples de obter um registro portátil e compartilhável de seus pagamentos diretamente do portal, melhorando a usabilidade e reduzindo solicitações de suporte por extratos.


Feature Request | Business Requirements
Adicionar um botão Baixar PDF em Resumo da Conta → Histórico de Pagamentos.
O PDF gerado deve incluir apenas os dados do Histórico de Pagamentos (excluir outras seções do Portal do Cliente).


Test instructions
A página do portal do cliente tem um botão de impressão; usar esse botão deve exibir uma versão otimizada da Atividade da Conta
que pode ser usada para impressão.

Optimizations:
ocultar barras de navegação, campo de busca e rodapé da tabela
se paginado, todos os elementos serão exibidos de uma vez

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

When Usuário acessa Histórico de pagamento no portal Customer
And cliente clica para baixar seus pagamentos
Then os usuários exportem apenas o Histórico de Pagamentos 
And como um arquivo PDF.
And nenhuma outra informação da página deve ser exportada
And barras de navegação devem ser ocultadas
And campo de busca deve ser ocultado
And rodapé da tabela deve ser ocultado

-----

Português (revisado)
Marcos, ao imprimir o relatório, estão sendo exibidos o banner superior do Plano de Proteção e a coluna Account/Card (que permite editar pagamentos futuros). Por favor, remova esses dois blocos de informação, pois não são relevantes para o cliente.

English (revised)
Marcos, when printing the report, the top banner related to the Protection Plan and the Account/Card column (which allows editing future payments) are displayed. Please remove these two information blocks, as they are not relevant to the customer.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.45.0_EnablePdfDownloadForPaymentHistoryInCustomerPortal_Ticket473

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

When Usuário acessa Histórico de pagamento no portal Customer
And cliente clica para baixar seus pagamentos
Then os usuários exportem apenas o Histórico de Pagamentos 
And como um arquivo PDF.
And nenhuma outra informação da página deve ser exportada
And barras de navegação devem ser ocultadas
And campo de busca deve ser ocultado
And rodapé da tabela deve ser ocultado

> ## Tests in qa2

> ```gherkin
> When User accesses Payment History on Customer portal
> And customer clicks to download their payments
> Then users export only the Payment History
> And as a PDF file
> And no other information from the page should be exported
> And navigation bars should be hidden
> And search field should be hidden
> And table footer should be hidden
>
> | PASS | AccountPk:11065, 11066, 11067, 11068, 11069 |
> ```
>
>

# PORTUGUÊS
Sugiro incluir o número da conta no PDF do histórico de pagamentos para que o cliente possa identificar claramente a qual conta os pagamentos se referem.
Em casos onde não existem pagamentos registrados na conta, sugiro ocultar o botão de impressão para evitar confusão.

# ENGLISH
I suggest including the account number in the payment history PDF so that the customer can clearly identify which account the payments refer to.
In cases where there are no payments recorded in the account, I suggest hiding the print button to avoid confusion.


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------