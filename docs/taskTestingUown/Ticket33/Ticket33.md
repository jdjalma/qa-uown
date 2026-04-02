------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/qa/fintech-playwright/-/issues/33

UOWN | Automation | Validate Fixed Top Banner for Protection Offer on Customer Portal

Ticket related to 126
1. Banner Presence:
Verify that the banner is displayed at the top of the client portal interface after the page loads.
2. Banner Text:
Verify that the banner text exactly matches: "Protect yourself. Protect your lease for only $12.99/month"
3. Redirect Link:
Verify that the banner contains a functional link. Confirm that clicking on the link correctly redirects to the Protection Plan Enrollment page.
4. Responsiveness:
Test that the banner displays correctly on different screen resolutions (desktop, tablet, and mobile). Validate that the banner layout does not break or overlap other interface elements.
5. Performance and Loading:
Verify that the banner loads correctly and without visible delays.
Test the flow with and without the subscription
Test the flow when the client already has the Protection Plan

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Automação | Validar Banner Fixo no Topo para Oferta de Proteção no Portal do Cliente

Ticket relacionado ao 126
Presença do Banner:
Verifique se o banner é exibido no topo da interface do portal do cliente após o carregamento da página.
Texto do Banner:
Verifique se o texto do banner corresponde exatamente a: "Protect yourself. Protect your lease for only $12.99/month"
Link de Redirecionamento:
Verifique se o banner contém um link funcional. Confirme se, ao clicar no link, o redirecionamento ocorre corretamente para a página de Adesão ao Plano de Proteção.
Responsividade:
Teste se o banner é exibido corretamente em diferentes resoluções de tela (desktop, tablet e mobile). Valide se o layout do banner não quebra ou sobrepõe outros elementos da interface.
Performance e Carregamento:
Verifique se o banner carrega corretamente e sem atrasos visíveis
Teste o fluxo com e sem a assinatura
Teste o fluxo quando o cliente já possui o Plano de Proteção

------------------------------------------------------------------------------------------------------------------------------------------------------------------

AdesaoPlanoProtecaoAssinaturaContrato.feature
Verificar Status pending após preencher dados pessoais e financeiros para geração do contrato
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Origination
Painel Plano de Proteção portal Origination:OptedIn:ativado,Already Covered:desativado,Enrollment Date:data da assinatura do contrato,Status:completed,Error Description:vazio.
Verificar se a adesão ao plano de proteção é exibida nos logs do portal Origination
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Servicing
Painel Plano de Proteção portal Servicing:OptedIn:ativado,Already Covered:desativado,Enrollment Date:data da assinatura do contrato,Status:completed,Error Description:vazio.
Verifique se o banner não é exibido no topo da interface do portal do cliente após o carregamento da página.


AdesaoPlanoProtecaoPortalCliente.feature
Verificar Status pending após preencher dados pessoais e financeiros para geração do contrato
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Origination
Painel Plano de Proteção portal Origination ao assinar contrato:OptedIn:desativado,Already Covered:desativado,Enrollment Date:vazio,Status:completed,Error Description:vazio.
Verificar se a não adesão ao plano de proteção é exibida nos logs do portal Origination
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Servicing
Painel Plano de Proteção portal Servicing ao assinar contrato:OptedIn:desativado,Already Covered:desativado,Enrollment Date:vazio,Status:completed,Error Description:vazio.
Verifique se o banner é exibido no topo da interface do portal do cliente após o carregamento da página quando não aderido e Verifique se o banner não é exibido no topo da interface do portal do cliente após o carregamento da página quando feito a adesão.
Verifique se o texto do banner corresponde exatamente a: "Protect yourself. Protect your lease for only $12.99/month"
Verifique se o banner carrega corretamente e sem atrasos visíveis
Verifique se o banner contém um link funcional. Confirme se, ao clicar no link, o redirecionamento ocorre corretamente para a página de Adesão ao Plano de Proteção.
Painel Plano de Proteção portal Origination após assinar contrato:OptedIn:desativado,Already Covered:desativado,Enrollment Date:vazio,Status:completed,Error Description:vazio.
Painel Plano de Proteção portal Servicing após assinar contrato:OptedIn:ativado,Already Covered:desativado,Enrollment Date:data da adesão pelo portal do cliente,Status:Completed,Error Description:vazio.
Verificar se a adesão ao plano de proteção é exibida nos logs do portal Servicing


NaoAdesaoPlanoProtecaoAssinaturaContrato.feature
Verificar Status pending após preencher dados pessoais e financeiros para geração do contrato
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Origination
Painel Plano de Proteção portal Origination ao assinar contrato:OptedIn:desativado,Already Covered:desativado,Enrollment Date:vazio,Status:completed,Error Description:vazio.
Verificar se a não adesão ao plano de proteção é exibida nos logs do portal Origination
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Servicing
Painel Plano de Proteção portal Servicing ao assinar contrato:OptedIn:desativado,Already Covered:desativado,Enrollment Date:vazio,Status:completed,Error Description:vazio.
Verifique se o banner é exibido no topo da interface do portal do cliente após o carregamento da página.
Verifique se o texto do banner corresponde exatamente a: "Protect yourself. Protect your lease for only $12.99/month"
Verifique se o banner carrega corretamente e sem atrasos visíveis


ClienteJaPossuiPlanoProtecao.feature
Verificar Status pending após preencher dados pessoais e financeiros para geração do contrato
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Origination
Painel Plano de Proteção portal Origination primeiro Lease:OptedIn:ativado,Already Covered:desativado,Enrollment Date:data da assinatura do contrato,Status:completed,Error Description:vazio.
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Servicing
Verificar se a adesão ao plano de proteção é exibida nos logs do portal Origination
Painel Plano de Proteção portal Servicing primeiro Lease:OptedIn:ativado,Already Covered:desativado,Enrollment Date:data da assinatura do contrato,Status:completed,Error Description:vazio.
Painel Plano de Proteção portal Origination segunda Lease:OptedIn:desativado,Already Covered:ativado,Enrollment Date:?,Status:completed,Error Description:vazio.
Verificar se a ação ao plano de proteção é exibida nos logs do portal Origination
Painel Plano de Proteção portal Servicing segunda Lease:OptedIn:desativado,Already Covered:ativado,Enrollment Date:?,Status:completed,Error Description:vazio.


ClienteErroAderirPlanoProtecao.feature
Verificar Status pending após preencher dados pessoais e financeiros para geração do contrato
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Origination
Painel Plano de Proteção portal Origination:OptedIn:ativado,Already Covered:desativado,Enrollment Date:vazio,Status:error,Error Description:erro referente a rejeição recebida.
Verificar se painel de plano de proteção é somente visivel e não editavel no portal Servicing
Verificar se a tentativa de adesão ao plano de proteção é exibida nos logs do portal Origination
Painel Plano de Proteção portal Servicing:OptedIn:ativado,Already Covered:desativado,Enrollment Date:vazio,Status:error,Error Description:erro referente a rejeição recebida
Verifique se o banner não é exibido no topo da interface do portal do cliente após o carregamento da página.


BannerPlanoProtecaoResponsividade.feature
Verifique se o banner é exibido no topo da interface do portal do cliente após o carregamento da página.
Verifique se o texto do banner corresponde exatamente a: "Protect yourself. Protect your lease for only $12.99/month"
Verifique se o banner contém um link funcional. Confirme se, ao clicar no link, o redirecionamento ocorre corretamente para a página de Adesão ao Plano de Proteção.
Teste se o banner é exibido corretamente em diferentes resoluções de tela (desktop, tablet e mobile). Valide se o layout do banner não quebra ou sobrepõe outros elementos da interface.
Verifique se o banner carrega corretamente e sem atrasos visíveis


------------------------------------------------------------------------------------------------------------------------------------------------------------------


@protectionPlan
  Scenario: Verificar banner de proteção no portal Cliente
    Then on the "Customer" portal, page "overview", the "bannerText" equals "Protect yourself. Protect your lease for only $12.99/month" within 5 seconds
    And   on the "Customer" portal, page "overview", the "urlContains" contains "/protection" within 5 seconds
Aqui você escolhe um assertionType (pode ser bannerText, panelVisible, urlContains, loadTimeLessThan, …) e um expectedValue + timeout.

