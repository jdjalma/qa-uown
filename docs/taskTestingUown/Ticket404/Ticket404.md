--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/404

Check min lease amount when adding new lease


Merchants can call /addNewLease API or use "Add Lease" button on our portal to add a new lease on a lead if the customer has some left over approval amount. 
This service calls /sendApplication internally which creates a new lead for the same customer and creates the given invoice on the new lead.
We need to add the minimum lease amount check  (check against the number in merchant page) in sendApplication.

-----

Verificar valor mínimo de arrendamento ao adicionar novo arrendamento

Os lojistas podem chamar a API /addNewLease ou usar o botão “Add Lease” em nosso portal para adicionar um novo arrendamento a um lead, caso o cliente ainda tenha um valor aprovado disponível.
Esse serviço chama internamente o endpoint /sendApplication, que cria um novo lead para o mesmo cliente e gera a fatura informada nesse novo lead.

Precisamos adicionar a verificação do valor mínimo de arrendamento (comparando com o número configurado na página do lojista) dentro de sendApplication.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Cnfigurar minimun lease amount


Criar aplicação via API
Criar aplicação via interface

tentar criar lease com valor menor
receber rejeicao
alterar valor para menor que do lease
receber sucesso

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🎯 Objetivo
Garantir que:
O sistema bloqueie arrendamentos abaixo do valor mínimo configurado no merchant.
O sistema permita arrendamentos iguais ou acima desse valor.
Tanto via API (/addNewLease → /sendApplication) quanto via portal ("Add Lease" button).


🧪 Testes de API
1. Criar lease abaixo do mínimo
Pré-condição: Merchant configurado com minLeaseAmount = 500.
Request:
POST /addNewLease
{
  "customerId": "12345",
  "invoiceAmount": 400
}

Resultado esperado:
Status: 400 Bad Request ou equivalente.
Body: mensagem de erro clara, ex: "Invoice amount below minimum lease amount (500)".
Nenhum lead/fatura deve ser criado.

---

2. Criar lease igual ao mínimo
Request:
POST /addNewLease
{
  "customerId": "12345",
  "invoiceAmount": 500
}

Resultado esperado:
Status: 200 OK.
Body: contém leadId e invoiceId.
Lead e invoice criados corretamente.

---

Criar lease acima do mínimo
Request:
POST /addNewLease
{
  "customerId": "12345",
  "invoiceAmount": 700
}

Resultado esperado:
Status: 200 OK.
Body: contém leadId e invoiceId.
Lead e invoice criados corretamente.

---

Validar chamada interna /sendApplication
Verificar nos logs/mocks que sendApplication não é chamado quando o valor < mínimo.
Quando ≥ mínimo, confirmar que sendApplication foi chamado com os parâmetros corretos.

---

🧪 Testes de UI
1. Criar lease abaixo do mínimo
Ação:
    Entrar no portal como merchant com minLeaseAmount = 500.
    Clicar em “Add Lease” no lead.
    Informar invoice = 400.
    Salvar.

Resultado esperado:
    Mensagem de erro exibida no portal, ex: "Valor mínimo de arrendamento é 500".
    Nenhum lease criado.

---

2. Criar lease igual ao mínimo
Ação:
    Preencher invoice = 500.
    Salvar.
Resultado esperado:
    Lease criado com sucesso.
    Usuário redirecionado para a tela do novo lead/fatura.
    Mensagem de confirmação exibida.

---

3. Criar lease acima do mínimo

Ação:
    Preencher invoice = 700.
    Salvar.
Resultado esperado:
    Lease criado com sucesso.
    Tela mostra detalhes do novo lease.

---

4. Usabilidade / Validação na tela
Caso possível, validar já no formulário que o valor digitado não seja menor que o mínimo (ex: campo com mensagem inline: “Valor deve ser ≥ 500”).

---

4. Usabilidade / Validação na tela
Caso possível, validar já no formulário que o valor digitado não seja menor que o mínimo (ex: campo com mensagem inline: “Valor deve ser ≥ 500”).

---

Cenário 1: Segundo lease abaixo do mínimo
Dado que o cliente já possui um lease de R$ 1.000
E o merchant tem valor mínimo de lease = R$ 500
Quando eu tento criar um segundo lease no valor de R$ 400
Então o sistema deve:
    Exibir mensagem de erro: “Valor mínimo de arrendamento é 500”
    Não criar novo lead/invoice
    Manter apenas o primeiro lease existente

---

Cenário 2: Segundo lease acima do mínimo
Dado que o cliente já possui um lease de R$ 1.000
E o merchant tem valor mínimo de lease = R$ 500
Quando eu tento criar um segundo lease no valor de R$ 600
Então o sistema deve:
    Criar novo lead vinculado ao mesmo cliente
    Gerar a invoice corretamente
    Confirmar com mensagem de sucesso
    Exibir agora 2 leases ativos no portal (ou no retorno da API)

---

👉 Esses cenários podem ser aplicados em:
API → via chamada /addNewLease (mockando o cliente com primeiro lease já criado).
UI → via botão “Add Lease” no portal.

---

