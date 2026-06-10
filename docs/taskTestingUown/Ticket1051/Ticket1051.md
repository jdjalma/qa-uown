-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1051

UOWN | Origination | Improve Button Visibility and Behavior in the New Application Flow (Origination)

Synopsis
In the New Application flow of the Origination portal, after the link is sent to the customer, 
the buttons displayed on the interface have the same color as the page background, being distinguishable only by a white border. 
This current design can hinder button visibility on certain devices, negatively affecting the user experience.

Business Objective
Enhance the user experience by making buttons more visible and intuitive, 
while also reinforcing the requirement to complete the necessary fields before allowing the user to proceed in the flow.

Feature Request | Business Requirements      
Update the button design in the New Application flow to improve visibility. The new color and styling must follow the visual standard shown in the mockup video (see link below). Qual a cor? e possivel ver pelas alteracoes do dev?
Implement a visual "disabled" state for buttons while required page fields are not yet properly filled.
Once all required fields are correctly filled, the button should automatically switch to an "active" state, indicating that the user can proceed.
Ensure that the enabling and disabling behavior is functional both visually and logically, preventing incomplete submissions.
The new UI design is documented in a mockup video that MUST be strictly followed by the frontend team.

-----

ALterações dev:
Visão geral 
0
Commits 
3
Pipelines 
2
Alterações 2
Comparar
e
 2 arquivos
+
58
−
3
Arquivos
2
Search (e.g. *.vue) (F)

components/send-
‎application-form‎

index.mo
‎dule.scss‎
+11 -0

inde
‎x.tsx‎
+47 -3

 components/send-application-form/index.module.scss 
+
11
−
0

Visualizado
@@ -20,12 +20,23 @@
  max-width: 100%;

  &__button {
    background-color: var(--white) !important;
    border-radius: 30px !important;
    border-color: var(--white) !important;
    height: 40px !important;
    color: var(--primary-font);

    &:hover {
      color: var(--primary-font) !important;
    }

    &:focus {
      box-shadow: 0 0 0;
      color: var(--primary-font) !important;
    }

    &:disabled {
      color: var(--primary-font) !important;
    }
  }
}
 components/send-application-form/index.tsx 
+
47
−
3

Visualizado
@@ -149,7 +149,7 @@ const SendApplicationForm = ({

  const [applicationResponseCode, setApplicationResponseCode] = useState(-1);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [isDisabled, setIsDisabled] = useState(true);
  const setUuidAndLoadAppStatus = useCallback(async () => {
    utilityStore.reset();
    const uuid = router.query?.uuid || '';
@@ -470,6 +470,50 @@ const SendApplicationForm = ({
    employmentAndFinancialInfoFormik.isSubmitting,
  ]);

  useEffect(() => {
    const checkIsDisabled = async () => {
      if (isFormSubmitting) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 0 && !customerInfoFormik.isValid) {
        setIsDisabled(true);
        return;
      }

      if (activeApplicationStep === 1) {
        await employmentAndFinancialInfoFormik.validateForm();
        if (!employmentAndFinancialInfoFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      if (activeApplicationStep === 2) {
        await disclaimerFormik.validateForm();
        if (!disclaimerFormik.isValid) {
          setIsDisabled(true);
          return;
        }
      }

      setIsDisabled(false);
      return false;
    };
    checkIsDisabled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFormSubmitting,
    activeApplicationStep,
    disclaimerFormik.values,
    disclaimerFormik.isValid,
    customerInfoFormik.values,
    customerInfoFormik.isValid,
    employmentAndFinancialInfoFormik.values,
    employmentAndFinancialInfoFormik.isValid,
  ]);

  return (
    <div ref={ref} id={'applicationForm'}>
      <Container
@@ -558,9 +602,9 @@ const SendApplicationForm = ({
                ? 'sendApplication-submitBtn'
                : 'sendApplication-nextBtn'
            }
            disabled={isFormSubmitting}
            disabled={isDisabled}
            className={classNames(
              'bg-transparent text-uppercase px-5',
              'text-uppercase px-5',
              styles?.sendApplicationFooter__button,
            )}>
            {activeApplicationStep && activeApplicationStep === 2

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------            

Requisitos de Teste (a partir da tarefa)
[Visibilidade de botões] Os botões no fluxo “New Application” devem ter alta visibilidade (cor e estilo conforme mockup), não “se confundindo” com o fundo.
[Estado desabilitado visual] Deve existir estado visual “disabled” quando campos obrigatórios não estiverem preenchidos corretamente.
[Habilitar automaticamente] Quando todos os campos obrigatórios estiverem válidos, o botão deve mudar automaticamente para estado “ativo”.
[Bloqueio lógico] Não deve ser possível prosseguir/enviar com campos obrigatórios inválidos/incompletos, além do visual refletir isso.
[Aderência ao mockup] O design final deve seguir estritamente o vídeo de mockup fornecido (cores/estilos/comportamento).
Informações extraídas das alterações do dev (o que não está explícito na tarefa)
[Cor e estilo do botão]
background-color: var(--white) (botão fica branco)
border-color: var(--white)
border-radius: 30px
height: 40px
color: var(--primary-font) (texto na cor “primária”)
:hover mantém color: var(--primary-font)
:focus remove sombra (box-shadow: 0 0 0) e mantém color: var(--primary-font)
:disabled mantém color: var(--primary-font) (texto continua na cor primária mesmo desabilitado)
[Classes e composição]
Removido bg-transparent do botão.
Mantido text-uppercase px-5.
Aplica classe do CSS Module sendApplicationFooter__button (classe gerada dinamicamente).
[IDs úteis]
Botão “Next”: id="sendApplication-nextBtn"
Botão “Submit” (no último passo): id="sendApplication-submitBtn"
Contêiner do formulário: id="applicationForm"
[Controle de desabilitação]
Novo estado isDisabled controlado por useEffect.
isDisabled = true quando:
isFormSubmitting === true
Passo 0 e customerInfoFormik.isValid === false
Passo 1 e employmentAndFinancialInfoFormik.isValid === false (com validateForm() antes)
Passo 2 e disclaimerFormik.isValid === false (com validateForm() antes)
isDisabled = false somente quando todas as condições do passo atual são atendidas e não está submetendo.
O atributo disabled do botão agora usa disabled={isDisabled} (antes atrelado só a isFormSubmitting).
[Passos do fluxo]
Passo 0: Customer Info
Passo 1: Employment and Financial Info
Passo 2: Disclaimer
No passo 2 o botão é “Submit”; nos demais é “Next”.
Seletores/Locators recomendados para automação
[Botão Next] #sendApplication-nextBtn
[Botão Submit] #sendApplication-submitBtn
[Form] #applicationForm
Evitar depender do nome da classe do CSS Module (pode ser ofuscada/gerada). Use IDs e papel/rotulo visível.
Cenários de Teste Propostos
[Visual: cor e estilo do botão]
Dado o formulário aberto no passo 0
Então o botão deve ter background-color branco, border-color branco, border-radius 30px, height 40px, color = var(--primary-font)
E não deve ter box-shadow no :focus
E em :hover a cor do texto permanece var(--primary-font)
Observação: validar via getCssValue e simular hover/focus (Actions/mouseOver/tab + JS).
[Visual/Funcional: estado disabled por passo]
Passo 0: com campos obrigatórios inválidos → botão “Next” desabilitado (disabled=true) e visual de disabled coerente.
Passo 0: ao preencher corretamente → botão habilita automaticamente (disabled=false) sem reload.
Passo 1: repetir lógica (incluir waits para validateForm()).
Passo 2: repetir lógica com “Submit”.
[Bloqueio durante submissão]
Disparar submissão (no passo 2) → isFormSubmitting=true → botão “Submit” desabilita.
Após finalizar (mockar/esperar resposta) → botão reabilita conforme validade atual.
[Transição de passos]
No passo 1 com formulário inválido → botão permanece desabilitado.
Ao torná-lo válido → habilita; clicar “Next” avança para passo 2 (verificar mudança de ID do botão para sendApplication-submitBtn).
[Sem bg transparente]
Garantir que a classe bg-transparent não está aplicada ao botão (regressão).
[Acessibilidade/contraste básico]
Validar que o botão não “desaparece” sobre fundo claro (ex.: screenshot comparison ou checar computed styles).
Opcional: verificação de contraste mínimo se disponível.
[Resiliência de validação]
Intencionalmente tornar o form inválido em cada passo e confirmar que o botão não habilita.
Tornar válido e confirmar habilitação automática (sem interação adicional).
Dados e Preparação para Teste
[Navegação] Acessar o fluxo “New Application” após envio de link ao cliente (pode ser via URL direta com uuid no query param).
[Preenchimento] Campos obrigatórios por passo devem ser conhecidos/mapeados para preencher e invalidar rapidamente.
[Sincronização] Usar waits até que #applicationForm esteja presente e, por passo, aguardar estabilização de Formik (validateForm() é chamado internamente no passo 1 e 2).
Observações Técnicas (para automação no nosso framework)
[Locators estáveis] Priorize #sendApplication-nextBtn e #sendApplication-submitBtn.
[Validações de UI]
Estado enabled/disabled: ValidationType.BOOLEAN_EQUALS sobre WebElement::isEnabled (ou atributo disabled).
Estilo visual: capturar getCssValue para background-color, border-color, border-radius, height, color, box-shadow.
[Hover/Focus] Em Selenium, usar Actions.moveToElement() e element.sendKeys(Keys.TAB) ou JS para :focus.
[E2E] Simular o preenchimento correto/incompleto por passo e validar alternância do disabled.
Respostas diretas às suas perguntas
Qual a cor? O botão agora tem fundo branco (background-color: var(--white)) e texto na cor primária (color: var(--primary-font)), com borda branca e bordas arredondadas (30px).
É possível ver pelas alterações do dev? Sim. Está explícito em components/send-application-form/index.module.scss e o controle de disabled/habilitação automática está em components/send-application-form/index.tsx via isDisabled e useEffect com validações do Formik por passo.
Próximos Passos (sugestão)
[Mapear campos obrigatórios por passo] para conseguirmos preencher/invalidar rapidamente.
[Criar feature file] “New Application – Button visibility and behavior” com os cenários acima.
[Implementar steps] Usando IDs de botão e validações de CSS/estado.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_ImproveButtonVisibilityAndBehaviorinTheNewApplicationFlow_Ticket1051

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Dado que é criada uma nova aplicação com o merchant "<merchant>"
Quando o link "Open New Application" da resposta da API é aberto

# Seção 1: Suas Informações
Então o botão Next deve estar desabilitado
E o botão Next deve ter o estilo visual padrão
E o botão Next não deve ter a classe de fundo transparente
E o botão Next deve estar desabilitado com visual adequado
E não deve ser possível prosseguir do passo 0 quando inválido
E o stepper deve mostrar "Your Info" como ativo
Quando "Your Information" é completado e avançar é acionado
Então o stepper deve mostrar "Your Info" como concluído
E o stepper deve mostrar "Employment" como ativo

# Seção 2: Emprego & Financeiro
Então o botão Next deve estar desabilitado com visual adequado
E não deve ser possível prosseguir do passo 1 quando inválido
Quando "Employment & Financial" é completado e avançar é acionado
Então o stepper deve mostrar "Employment" como concluído
E o stepper deve mostrar "Disclaimer" como ativo

# Seção 3: Legal & Declaração
Então o botão Submit deve ter o estilo visual padrão
E o botão Submit não deve ter a classe de fundo transparente
E o botão Submit deve estar desabilitado com visual adequado
E não deve ser possível prosseguir do passo 2 quando inválido
Quando "Legal & Disclaimer" é completado e o envio validado
Então o botão Submit deve estar habilitado com visual adequado

# Navegar de volta de Disclaimer para Employment
E o botão Prev deve estar visível
E o botão Prev deve ter o estilo visual padrão
Quando clicar em Prev
Então o stepper deve mostrar "Employment" como ativo
E o stepper deve mostrar "Disclaimer" como não concluído

# Os dados devem ser preservados e os botões devem funcionar corretamente
E o botão Next deve ter o estilo visual padrão
E o botão Next não deve ter a classe de fundo transparente
Quando invalidar temporariamente Employment e verificar se o Next alterna
Então o botão Next deve estar habilitado com visual adequado
E os dados de Employment devem ser preservados

# Navegar de volta de Employment para Your Information
Quando clicar em Prev
Então o stepper deve mostrar "Your Info" como ativo
E o stepper deve mostrar "Employment" como não concluído

# Após o retorno: os dados devem ser preservados e os botões devem funcionar corretamente
E o botão Next deve ter o estilo visual padrão
E o botão Next não deve ter a classe de fundo transparente
Quando invalidar temporariamente Your Info e verificar se o Next alterna
Então o botão Next deve estar habilitado com visual adequado
E os dados de Your Info devem ser preservados

# Navegar para frente de Your Information para Employment
Quando clicar em Next
Então o stepper deve mostrar "Your Info" como concluído
E o stepper deve mostrar "Employment" como ativo

# Após a navegação para frente: os dados ainda devem ser preservados
E o botão Next deve ter o estilo visual padrão
E o botão Next não deve ter a classe de fundo transparente
Quando invalidar temporariamente Employment e verificar se o Next alterna
Então o botão Next deve estar habilitado com visual adequado
E os dados de Employment devem ser preservados

# Navegar para frente de Employment para Disclaimer
Quando clicar em Next
Então o stepper deve mostrar "Employment" como concluído
E o stepper deve mostrar "Disclaimer" como ativo

# Após a navegação para frente: os dados ainda devem ser preservados e o Submit deve estar habilitado
E o botão Submit deve ter o estilo visual padrão
E o botão Submit não deve ter a classe de fundo transparente
E o botão Submit deve estar habilitado com visual adequado
E os dados de Disclaimer devem ser preservados

# Prosseguir com o envio após a validação completa de navegação para frente e para trás
Quando o botão Submit estiver desabilitado durante o envio
Então a submissão deve ser concluída com sucesso

-----

> ## Tests in qa2
> ```gherkin
>
> ### Scenario Outline: Improve button visibility and behavior in the new application flow in "<env>"
> Given Create a new application with merchant "<merchant>"
> When Open New Application link from API response
> # Section 1: Your Information
> Then Next should be disabled
> And Next button has base visual style
> And Next does not have transparent background class
> And Next is disabled with proper visual
> And cannot proceed from step 0 when invalid
> And stepper shows "Your Info" active
> When complete "Your Information" and go next
> And stepper shows "Your Info" completed
> And stepper shows "Employment" active
> # Section 2: Employment & Financial
> Then Next is disabled with proper visual
> And cannot proceed from step 1 when invalid
> When complete "Employment & Financial" and go next
> And stepper shows "Employment" completed
> And stepper shows "Disclaimer" active
> # Section 3: Legal & Disclaimer
> Then Submit button has base visual style
> And Submit does not have transparent background class
> And Submit is disabled with proper visual
> And cannot proceed from step 2 when invalid
> When complete "Legal & Disclaimer" and validate submit
> Then Submit is enabled with proper visual
> # Navigate back from Disclaimer to Employment
> And Prev should be visible
> And Prev button has base visual style
> When click Prev
> Then stepper shows "Employment" active
> And stepper shows "Disclaimer" not completed
> # Data should be preserved and buttons should work correctly
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Employment and verify Next toggles
> Then Next is enabled with proper visual
> And validate employment data is preserved
> When click Prev
> Then stepper shows "Your Info" active
> And stepper shows "Employment" not completed
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Your Info and verify Next toggles
> Then Next is enabled with proper visual
> And validate your info data is preserved
> When click Next
> Then stepper shows "Your Info" completed
> And stepper shows "Employment" active
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Employment and verify Next toggles
> Then Next is enabled with proper visual
> And validate employment data is preserve
> When click Next
> Then stepper shows "Employment" completed
> And stepper shows "Disclaimer" active
> And Submit button has base visual style
> And Submit does not have transparent background class
> And Submit is enabled with proper visual
> And validate disclaimer data is preserved
> When Submit is disabled while submitting
> Then submission should succeed
> | PASS | Merchant: Progress Mobility | 
> ```
>
>
[R7.1.25.43.0_ImproveButtonVisibilityAndBehaviorinTheNewApplicationFlow_Ticket1051_QA2_2025_08_21_1230_07133.html](/uploads/e219be7ed7901cfc61ed32dc556c48d8/R7.1.25.43.0_ImproveButtonVisibilityAndBehaviorinTheNewApplicationFlow_Ticket1051_QA2_2025_08_21_1230_07133.html)
>
>
>
![1051_1_](/uploads/32bd0eb305af4675914e0949b782555b/1051_1_.jpg)
![1051_2_](/uploads/db8cd06e4ac8c04c53dcbfb998e7618e/1051_2_.jpg)
![1051_3_](/uploads/6e3cdb31f8dc024a45379aedea46f591/1051_3_.jpg)
![1051_4_](/uploads/ebe6af1b26aa144f6213a85799e6c912/1051_4_.jpg)
![1051_5_](/uploads/78423e74d2ca0b82c36d28629655f1a7/1051_5_.jpg)
![1051_6_](/uploads/9806b442e278931963ee702bdf8a7b7b/1051_6_.jpg)
![1051_7_](/uploads/e3b8de5f09cdf88e4f1b40ad61952f94/1051_7_.jpg)
![1051_8_](/uploads/6ea33278f33b3b0930344c3e644561fc/1051_8_.jpg)
>
>
>

-----


> ## Tests in stg
> ```gherkin
>
> ### Scenario Outline: Improve button visibility and behavior in the new application flow in "<env>"
> Given Create a new application with merchant "<merchant>"
> When Open New Application link from API response
> # Section 1: Your Information
> Then Next should be disabled
> And Next button has base visual style
> And Next does not have transparent background class
> And Next is disabled with proper visual
> And cannot proceed from step 0 when invalid
> And stepper shows "Your Info" active
> When complete "Your Information" and go next
> And stepper shows "Your Info" completed
> And stepper shows "Employment" active
> # Section 2: Employment & Financial
> Then Next is disabled with proper visual
> And cannot proceed from step 1 when invalid
> When complete "Employment & Financial" and go next
> And stepper shows "Employment" completed
> And stepper shows "Disclaimer" active
> # Section 3: Legal & Disclaimer
> Then Submit button has base visual style
> And Submit does not have transparent background class
> And Submit is disabled with proper visual
> And cannot proceed from step 2 when invalid
> When complete "Legal & Disclaimer" and validate submit
> Then Submit is enabled with proper visual
> # Navigate back from Disclaimer to Employment
> And Prev should be visible
> And Prev button has base visual style
> When click Prev
> Then stepper shows "Employment" active
> And stepper shows "Disclaimer" not completed
> # Data should be preserved and buttons should work correctly
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Employment and verify Next toggles
> Then Next is enabled with proper visual
> And validate employment data is preserved
> When click Prev
> Then stepper shows "Your Info" active
> And stepper shows "Employment" not completed
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Your Info and verify Next toggles
> Then Next is enabled with proper visual
> And validate your info data is preserved
> When click Next
> Then stepper shows "Your Info" completed
> And stepper shows "Employment" active
> And Next button has base visual style
> And Next does not have transparent background class
> When temporarily invalidate Employment and verify Next toggles
> Then Next is enabled with proper visual
> And validate employment data is preserve
> When click Next
> Then stepper shows "Employment" completed
> And stepper shows "Disclaimer" active
> And Submit button has base visual style
> And Submit does not have transparent background class
> And Submit is enabled with proper visual
> And validate disclaimer data is preserved
> When Submit is disabled while submitting
> Then submission should succeed
> | PASS | Merchant: Progress Mobility | 
> ```
>
>

>
>
>

>
>
>