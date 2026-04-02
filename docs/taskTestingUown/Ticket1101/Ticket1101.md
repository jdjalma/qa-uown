--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1101

UOWN | Origination | Enable PROGRAM Cloning

Synopsis
Implement a feature that allows users to quickly clone existing programs in the Origination Portal, similar to the existing merchant cloning functionality.


Business Objective
As new merchants join the platform, program variations (e.g., different fees or special conditions) must be created. Currently, this process requires significant manual effort, as each variation needs to be configured from scratch.
By enabling program cloning, we will:
    Reduce repetitive manual work for the operations team.
    Ensure consistency in program configurations.
    Speed up the onboarding of new merchants with customized conditions.
    Improve overall efficiency and user experience in program management.


Feature Request | Business Requirements 
    Provide an option to clone an existing program from the Origination Portal.
    The cloned program must inherit all key configurations and data from the original program (e.g., fees, eligibility rules, conditions, etc.).
    After cloning, the user must be able to modify any field to customize the new program.
    Ensure proper identification of the cloned program.
    The functionality should mirror the existing merchant cloning flow for familiarity and consistency.


Test steps
Navigate to the Programs page.
Click on ADD NEW PROGRAM.
Verify that the Clone button is visible and clickable.
Click on Clone and select a program to clone.

Confirm that:
All fields are automatically populated.
The program name has the word "cloned" appended at the end.
You can save program

-----

UOWN | Origination | Habilitar clonagem de Programas

Resumo Implementar um recurso que permita aos usuários clonar rapidamente programas existentes no Origination Portal, de forma semelhante à funcionalidade de clonagem de merchants já existente.

Objetivo de Negócio À medida que novos merchants ingressam na plataforma, variações de programas (por exemplo, taxas diferentes ou condições especiais) precisam ser criadas. Atualmente, esse processo exige esforço manual significativo, pois cada variação precisa ser configurada do zero. Ao habilitar a clonagem de programas, iremos:

Reduzir o trabalho manual repetitivo da equipe de operações.
Garantir consistência nas configurações dos programas.
Acelerar o onboarding de novos merchants com condições personalizadas.
Melhorar a eficiência geral e a experiência do usuário na gestão de programas.
Solicitação de Funcionalidade | Requisitos de Negócio

Fornecer uma opção para clonar um programa existente no Origination Portal.
O programa clonado deve herdar todas as configurações e dados principais do programa original (por exemplo, taxas, regras de elegibilidade, condições etc.).
Após a clonagem, o usuário deve poder modificar qualquer campo para personalizar o novo programa.
Garantir a identificação adequada do programa clonado.
A funcionalidade deve espelhar o fluxo de clonagem de merchants já existente, para manter familiaridade e consistência.
Passos de Teste

Navegar até a página de Programs.
Clicar em ADD NEW PROGRAM.
Verificar que o botão Clone está visível e clicável.
Clicar em Clone e selecionar um programa para clonar.
Confirmar que:

Todos os campos são preenchidos automaticamente.
O nome do programa possui a palavra “cloned” adicionada ao final.
É possível salvar o programa.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
components/clone-program/index.module.scss  0 → 100644
+
37
−
0

Visualizado
.dropdownContainer {
  &__item {
    min-width: 20rem;
    z-index: 99999;
    position: sticky;
    position: -webkit-sticky;
    top: 0;
    background-color: #fff;
    padding-top: 1rem;
  }

  &__noResults {
    font-size: 16px;
    font-family: var(--bold-font);
  }

  &__input {
    > div > input {
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      font-family: var(--regular-font);

      &:hover {
        box-shadow: 0 0 0 2px var(--primary) !important;
      }

      &:active {
        box-shadow: 0 0 0 2px var(--primary) !important;
      }

      &:focus {
        box-shadow: 0 0 0 2px var(--primary) !important;
      }
    }
  }
}
\ No newline at end of file
 components/clone-program/index.tsx  0 → 100644
+
175
−
0

Visualizado
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import classNames from 'classnames';
import {DropdownItem} from 'reactstrap';
import styles from './index.module.scss';
import {
  DropdownButton,
  InputField,
  Options,
  ResponseType,
} from '@uownleasing/common-ui';
import {FormikProps} from 'formik';
import {convertStringToOptionType} from '@utils/helper';

export interface ProgramInfo {
  programPk: number;
  programId: string;
  programName: string;
  peakCampaignId: string | null;
  offPeakCampaignId: string | null;
  moneyFactor: number;
  quickPayPct: number;
  payoffDiscount: number;
  chargeAppFeeIfDeliveryIsZero: boolean;
  dealerDiscount: number;
  maxDollarAmount: number;
  dealerRebate: number;
  epoDays: number;
  epoFeePercent: number | null;
  minCartAmount: number;
  maxCartAmount: number;
  termMonths: number;
  programType: string;
  lendingCategoryType: string;
  allowedFrequencyOverride: string | null;
  states: string;
  processingFeeOverride: number | null;
  amountChargedAtSigning: number;
}

interface FormValues {
  programName: string;
  moneyFactor: number;
  payoffDiscount: number;
  epoDays: number;
  epoFeePercent: number | null;
  termMonths: number;
  states: string;
  programPk: number | null;
  lendingCategoryType: string;
  allowedFrequencyOverride: Options[];
  dealerDiscount: number;
  minCartAmount: number;
  maxCartAmount: number;
  processingFeeOverride: number | null;
  amountChargedAtSigning: number;
}

export interface ResponseData {
  pk: number;
  rowCreatedTimestamp: string;
  rowUpdatedTimestamp: string;
  tenantId: string | null;
  programInfo: ProgramInfo;
}

interface CloneProgramProps {
  getAllMerchantPrograms: (
    search?: string,
    pageNumber?: number,
    maxResults?: number,
    isGetAll?: boolean,
  ) => Promise<ResponseType>;
  formik: FormikProps<FormValues>;
}

export const CloneProgram = ({
  getAllMerchantPrograms,
  formik,
}: CloneProgramProps) => {
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [programs, setAllPrograms] = useState<ResponseData[]>([]);
  const [programToclone, setProgramToClone] = useState<ProgramInfo | null>(
    null,
  );

  const [searchValue, setSearchValue] = useState('');

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) =>
      program.programInfo.programName
        ?.toLowerCase()
        .includes(searchValue.toLowerCase()),
    );
  }, [programs, searchValue]);

  const getAllMerchPrograms = useCallback(
    async (
      search: string = '',
      page: number = 0,
      maxResults: number | null = null,
    ) => {
      const response = await getAllMerchantPrograms(search, page, maxResults);
      const merchantPrograms = response?.data?.merchantPrograms ?? [];
      setAllPrograms(merchantPrograms);
    },
    [getAllMerchantPrograms],
  );

  useEffect(() => {
    if (programToclone) {
      formik.setValues({
        programName: `${programToclone.programName} cloned`,
        moneyFactor: programToclone.moneyFactor,
        payoffDiscount: programToclone.payoffDiscount,
        epoDays: programToclone.epoDays,
        epoFeePercent: programToclone.epoFeePercent,
        termMonths: programToclone.termMonths,
        states: programToclone.states,
        programPk: null,
        lendingCategoryType: programToclone.lendingCategoryType,
        allowedFrequencyOverride: convertStringToOptionType(
          programToclone.allowedFrequencyOverride,
        ),
        dealerDiscount: programToclone.dealerDiscount,
        minCartAmount: programToclone.minCartAmount,
        maxCartAmount: programToclone.maxCartAmount,
        processingFeeOverride: programToclone.processingFeeOverride,
        amountChargedAtSigning: programToclone.amountChargedAtSigning,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programToclone]);

  useEffect(() => {
    getAllMerchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="d-flex">
      <DropdownButton
        isOpen={isCloneModalOpen}
        toggle={() => setIsCloneModalOpen((previous) => !previous)}
        persist
        isNav
        className={classNames(
          'd-flex align-items-center',
          styles?.dropdownContainer,
        )}
        title="Clone"
        buttonColor="primary"
        positionFixed={true}>
        <DropdownItem
          header={true}
          className={styles?.dropdownContainer__item}
          toggle={false}
          onClick={(e) => e?.preventDefault()}>
          <InputField
            name="search"
            placeholder="Search..."
            className={styles?.dropdownContainer__input}
            onChange={(e) => setSearchValue(e?.target?.value || '')}
          />
        </DropdownItem>
        {filteredPrograms?.map((program) => (
          <DropdownItem
            key={program.pk}
            onClick={() => setProgramToClone(program.programInfo)}>
            {`${program.programInfo.programName}`}
          </DropdownItem>
        ))}
      </DropdownButton>
    </div>
  );
};

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Requisitos Funcionais (RF)

RF-01: Exibir ação “Clone” na tela de criação de Program
Critério: Ao navegar para Programs > ADD NEW PROGRAM, o botão “Clone” deve estar visível, habilitado e clicável.
RF-02: Abrir dropdown de clonagem com busca
Critério: Ao clicar em “Clone”, deve abrir um dropdown com campo de busca “Search…” e uma lista de programas retornados por getAllMerchantPrograms().
RF-03: Filtragem por nome (case-insensitive)
Critério: Ao digitar no campo “Search…”, a lista deve ser filtrada por substring do programName de forma case-insensitive.
RF-04: Seleção de programa para clonar
Critério: Ao clicar em um item da lista, o programa é selecionado para clonagem (estado interno programToclone definido).
RF-05: Pré-preenchimento automático do formulário
Critério: Após a seleção, os seguintes campos do formulário devem ser automaticamente preenchidos com os valores do programa original:
moneyFactor
payoffDiscount
epoDays
epoFeePercent
termMonths
states
lendingCategoryType
allowedFrequencyOverride (convertido de string para Options[] via convertStringToOptionType)
dealerDiscount
minCartAmount
maxCartAmount
processingFeeOverride
amountChargedAtSigning
RF-06: Nome do programa com sufixo “cloned”
Critério: O campo programName deve receber exatamente “{nome original} cloned” (com um espaço antes de “cloned”).
RF-07: Geração de novo registro (programPk nulo)
Critério: O campo programPk deve ser definido como null no formulário, garantindo criação de novo registro ao salvar (sem sobrescrever o original).
RF-08: Campos editáveis após clonagem
Critério: Após o pré-preenchimento, todos os campos do formulário devem permanecer editáveis para personalização.
RF-09: Salvar com sucesso o programa clonado
Critério: É possível salvar o novo programa sem erros de validação obrigatória, gerando um novo PK/ID no backend.
RF-10: Identificação adequada do clone
Critério: O programa salvo deve manter o nome com sufixo “cloned” e não deve reutilizar o programId do original. Ao consultar a lista de Programs, o novo registro deve aparecer com as configurações clonadas.
RF-11: Paridade com fluxo de clonagem de merchant
Critério: O comportamento visual e de interação do dropdown (busca, lista, seleção) deve ser equivalente ao fluxo de clonagem já existente para merchants.
RF-12: Carregamento inicial da lista de programas
Critério: Ao abrir a tela de criação, a chamada getAllMerchantPrograms() é executada e popula a lista para a experiência de clonagem.
Requisitos de UI/UX (RUX)

RUX-01: Campo de busca “grudado” e visível ao rolar
Critério: No dropdown de clonagem, o campo de busca permanece visível ao rolar a lista (position: sticky), sem sobreposição incorreta (z-index alto).
RUX-02: Largura mínima do dropdown
Critério: O dropdown respeita min-width de 20rem, garantindo legibilidade dos nomes.
RUX-03: Estados de foco visual no input
Critério: Hover/active/focus do campo de busca aplicam os estilos de box-shadow definidos (conforme index.module.scss).
RUX-04: Estado sem resultados
Critério: Ao digitar um termo que não retorna nenhum programa, a lista deve exibir estado “no results”/vazio claramente perceptível (há estilo .dropdownContainer__noResults; validar presença visual).
Requisitos de Dados (RD)

RD-01: Mapeamento fiel dos campos
Critério: Todos os campos listados em RF-05 devem espelhar o valor da origem; diferenças só são aceitas para programName (com “cloned”) e programPk (null).
RD-02: allowedFrequencyOverride convertido corretamente
Critério: O valor de allowedFrequencyOverride do original é convertido para Options[] e refletido visualmente no componente (multi-select) após a clonagem.
RD-03: Campos não clonados não devem vazar
Critério: Campos não contemplados em FormValues (ex.: programId) não devem ser preenchidos/reaproveitados; a criação deve gerar novos identificadores no backend.
RD-04: Persistência consistente
Critério: Após salvar, os valores persistidos devem corresponder aos exibidos no formulário (exceto identificadores gerados pelo servidor).
Requisitos de Validação/Erros (RV)

RV-01: Falha ao carregar lista
Critério: Se getAllMerchantPrograms() retornar erro, a UI não deve quebrar; deve exibir estado seguro (e.g., lista vazia) permitindo tentar novamente.
RV-02: Validações obrigatórias ao salvar
Critério: Caso algum campo obrigatório fique inválido após edição manual, a UI deve bloquear o save e exibir mensagens de validação adequadas.
RV-03: Nomes duplicados (quando aplicável)
Critério: Se houver restrição de unicidade para programName, a UI deve sinalizar o erro ao salvar nomes já existentes.
Requisitos de Segurança/Permissões (RS)

RS-01: Controle de acesso
Critério: Apenas perfis com permissão de criar/clonar Programs visualizam e conseguem usar a ação “Clone”.
Requisitos Não Funcionais (RNF)

RNF-01: Desempenho de carregamento
Critério: Abrir o dropdown e exibir a primeira página de programas deve ocorrer em até 2 segundos em condições normais de rede.
RNF-02: Estabilidade visual
Critério: O dropdown não deve deslocar/ocultar elementos essenciais da página; o campo de busca deve manter-se interativo durante rolagem.
RNF-03: Acessibilidade básica
Critério: Campo de busca e itens da lista devem ser navegáveis por teclado; foco visível; seleção acionável via Enter/Espaço.
Requisitos de Observabilidade/Auditoria (RO)

RO-01: Auditoria de criação
Critério: O ato de salvar o programa clonado deve gerar registro de criação no sistema de logs/auditoria padrão (quando disponível), idealmente com referência ao programa de origem.
Requisitos de Pós-Condição (RPC)

RPC-01: Listagem atualizada
Critério: Após salvar, o novo programa aparece na listagem de Programs (com paginação/filtro padrão) e pode ser aberto para verificação dos campos clonados.
RPC-02: Consistência transversal
Critério: O programa clonado funciona como qualquer outro programa em fluxos subsequentes (e.g., elegibilidade, taxas aplicadas), respeitando seus valores configurados.
Sugestões de Testes (como serão validados)

UI (Selenium + POM):
Verificar presença e clique no botão “Clone”.
Testar filtragem case-insensitive no dropdown.
Selecionar programa e verificar preenchimento de cada campo listado em RF-05 (use verifyPanel + ValidationType para campos visíveis).
Multi-select (react-select):
Validar allowedFrequencyOverride via ElementUtility.reactDropDown(...).
Back-end/DB:
Confirmar que o novo registro é criado com novo PK e que programId não é reutilizado (via DatabaseUtil, quando aplicável).
Logs/Auditoria:
Validar existência do evento de criação (se houver endpoint/tela de logs já suportados por LogHelper).
Paridade com clonagem de merchant:
Comparar experiência de dropdown/busca/seleção com a já existente de merchants.
Observações importantes para cobertura

O sufixo deve ser exatamente “ cloned” (um espaço + “cloned”).
programPk deve ser null no formulário antes do save.
Caso “no results” não esteja implementado visualmente, registrar como oportunidade de melhoria (o estilo existe no SCSS).
Campos não presentes em FormValues (ex.: programId) não devem ser preenchidos via UI; IDs devem ser gerados ao salvar.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

@UOWN @Origination @Programs @Cloning
Feature: Program cloning in Origination
  Enables users to quickly clone existing Programs with pre-filled data, safe editing and proper identification.

  Background:
    Given Environment is set to "qa1"
    And Browser is "chrome"
    And Log in to origination
    And Navigate to programs page
    And Click on "ADD NEW PROGRAM" button

  @RF-01
  Scenario: Clone action is visible and clickable on Program creation page
    Then Button "Clone" should be visible
    And Button "Clone" should be enabled
    When Click on "Clone" button
    Then Clone dropdown should be open

  @RF-02 @RF-12
  Scenario: Clone dropdown opens with search field and initial list loaded
    When Click on "Clone" button
    Then Field "Search" in clone dropdown should be visible
    And Program list in clone dropdown should display at least 1 item

  @RF-03
  Scenario Outline: Search filtering is case-insensitive by programName
    When Click on "Clone" button
    And Type "<term>" in clone search field
    Then Clone results should contain items with name including "<expectedSubstring>" (case-insensitive)
    And Clone results should exclude items not matching "<expectedSubstring>" (case-insensitive)

    Examples:
      | term   | expectedSubstring |
      | PROG   | prog             |
      | prog   | prog             |
      | PrOg   | prog             |

  @RF-04 @RF-05 @RD-01 @RD-02
  Scenario Outline: Selecting a program triggers automatic prefill of form fields
    Given Source program details are loaded via API for "<sourceProgramName>"
    When Click on "Clone" button
    And Select program "<sourceProgramName>" in clone dropdown
    Then Program form should be prefilled with values:
      | field                   | ValidationType | expectedFromSource     |
      | moneyFactor             | EQUALS_NUMBER  | api:moneyFactor        |
      | payoffDiscount          | EQUALS_NUMBER  | api:payoffDiscount     |
      | epoDays                 | EQUALS_NUMBER  | api:epoDays            |
      | epoFeePercent           | EQUALS_NUMBER  | api:epoFeePercent      |
      | termMonths              | EQUALS_NUMBER  | api:termMonths         |
      | states                  | EQUALS_TEXT    | api:states             |
      | lendingCategoryType     | EQUALS_TEXT    | api:lendingCategoryType|
      | dealerDiscount          | EQUALS_NUMBER  | api:dealerDiscount     |
      | minCartAmount           | EQUALS_NUMBER  | api:minCartAmount      |
      | maxCartAmount           | EQUALS_NUMBER  | api:maxCartAmount      |
      | processingFeeOverride   | EQUALS_NUMBER  | api:processingFeeOverride |
      | amountChargedAtSigning  | EQUALS_NUMBER  | api:amountChargedAtSigning |
    And Multi-select "allowedFrequencyOverride" should contain options from API conversion:
      | expectedOptions | api:allowedFrequencyOverride -> convertStringToOptionType |

    Examples:
      | sourceProgramName        |
      | Standard Program A       |

  @RF-06
  Scenario Outline: Program name receives the suffix " cloned"
    When Click on "Clone" button
    And Select program "<sourceProgramName>" in clone dropdown
    Then Field "programName" should equal "<sourceProgramName> cloned"

    Examples:
      | sourceProgramName  |
      | Standard Program A |

  @RF-07
  Scenario Outline: New record generation ensures programPk is null before saving
    When Click on "Clone" button
    And Select program "<sourceProgramName>" in clone dropdown
    Then Hidden field "programPk" should be empty or null

    Examples:
      | sourceProgramName  |
      | Standard Program A |

  @RF-08
  Scenario: All fields remain editable after prefill
    When Select program "Standard Program A" in clone dropdown
    And Edit field "payoffDiscount" to "7.5"
    Then Field "payoffDiscount" should equal "7.5"

  @RF-09 @RF-10 @RD-03 @RD-04 @RPC-01
  Scenario Outline: Saving cloned program creates new record with proper identification
    Given Source program details are loaded via API for "<sourceProgramName>"
    When Select program "<sourceProgramName>" in clone dropdown
    And Click on "Save" button
    Then Success notification should be visible
    And New program should appear in programs list with name "<sourceProgramName> cloned"
    And Saved program details via API should match form values (excluding generated identifiers)
    And Saved programId should differ from source programId
    And Saved programPk should differ from source programPk

    Examples:
      | sourceProgramName  |
      | Standard Program A |

  @RF-11
  Scenario Outline: Clone dropdown UX parity with merchant cloning flow
    Given Merchant cloning dropdown is opened on merchant creation page
    When Type "<term>" in merchant clone search field
    Then Merchant clone results filtering should behave identical to Program clone results for term "<term>"
    And Sticky search field behavior should match between merchant and program clone dropdowns

    Examples:
      | term |
      | prog |

  @RUX-01
  Scenario: Clone search field is sticky and visible while scrolling
    When Click on "Clone" button
    And Scroll clone results to the bottom
    Then Clone search field should remain visible and interactable

  @RUX-02
  Scenario: Clone dropdown respects minimum width
    When Click on "Clone" button
    Then Clone dropdown width should be at least "320" pixels

  @RUX-03
  Scenario: Search input visual states on hover/active/focus
    When Click on "Clone" button
    And Hover on clone search field
    Then Clone search field should have focus/hover visual highlight
    When Focus clone search field
    Then Clone search field should have active/focus visual highlight

  @RUX-04
  Scenario: No results state is visible when search yields nothing
    When Click on "Clone" button
    And Type "THIS-DOES-NOT-EXIST-123" in clone search field
    Then Clone dropdown should display "no results" state

  @RV-01 @mock
  Scenario: Graceful handling when getAllMerchantPrograms fails
    Given Service "getAllMerchantPrograms" is mocked to return error "500"
    When Click on "Clone" button
    Then Clone dropdown should show safe empty state without breaking the page

  @RV-02
  Scenario: Required validations prevent saving invalid form
    When Select program "Standard Program A" in clone dropdown
    And Clear required field "programName"
    And Click on "Save" button
    Then Validation message for "programName" should be visible
    And Save action should be blocked

  @RV-03
  Scenario Outline: Duplicate program name is rejected when uniqueness applies
    When Select program "<sourceProgramName>" in clone dropdown
    And Replace field "programName" value with "<sourceProgramName>"
    And Click on "Save" button
    Then Duplicate name error message should be visible
    And Save action should be blocked

    Examples:
      | sourceProgramName  |
      | Standard Program A |

  @RS-01 @permission
  Scenario: Users without permission cannot see or use Clone action
    Given Logged in as user role "viewer" without program-clone permission
    When Navigate to programs page
    And Click on "ADD NEW PROGRAM" button
    Then Button "Clone" should not be visible

  @RNF-01
  Scenario: Performance - dropdown and first page load within 2 seconds
    When Click on "Clone" button
    Then Clone dropdown initial list should be visible within "2000" milliseconds

  @RNF-02
  Scenario: Visual stability during interaction
    When Click on "Clone" button
    And Scroll clone results
    Then Clone search field remains clickable and no essential UI elements are occluded

  @RNF-03
  Scenario: Accessibility - keyboard navigation for search and selection
    When Open clone dropdown using keyboard
    And Type "prog" using keyboard in clone search field
    And Navigate results with arrow keys
    And Select highlighted item with "Enter"
    Then Program form should be prefilled

  @RO-01
  Scenario Outline: Audit log is created referencing the source program
    When Select program "<sourceProgramName>" in clone dropdown
    And Click on "Save" button
    Then In program logs UI "CREATED: Program cloned from '<sourceProgramName>'" should be present

    Examples:
      | sourceProgramName  |
      | Standard Program A |

  @RPC-02
  Scenario Outline: Cloned program is usable across flows
    Given Program "<sourceProgramName> cloned" exists
    When Start a new application flow
    And Select program "<sourceProgramName> cloned"
    Then Application should accept the program and reflect its configured values

    Examples:
      | sourceProgramName  |
      | Standard Program A |
Observações rápidas

Os cenários marcam explicitamente todos os requisitos (RF, RUX, RD, RV, RS, RNF, RO, RPC).
Para validações de formulário, recomenda-se implementar/ver reutilizar steps com verifyPanel + ValidationType para os campos de RF-05/RD-01 e a leitura do multi-select com ElementUtility.reactDropDown(...) (ou verificação de chips/labels selecionados).
Para RD/RPC/RO, os steps “via API” e “logs UI” podem reaproveitar ApiSteps e LogHelper (memória do projeto).
Os cenários com @mock/@permission podem exigir configuração de ambiente/role ou mocking de serviço; quando não disponível no pipeline, classificar como manual/contrato.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

public static final String PROGRAMS_URL = "https://origination-qa1.uownleasing.com/programs";

// Menu
public static final By PROGRAMS_MENU = By.id("programs");

// Botões principais
public static final By PROGRAMS_ADD_NEW_BUTTON = By.xpath("//button[normalize-space()='ADD NEW PROGRAM']");
public static final By PROGRAMS_CLONE_BUTTON = By.xpath("//button[normalize-space()='Clone']");

// Clone dropdown (container, busca e itens)
public static final By PROGRAMS_CLONE_DROPDOWN_OPEN = By.xpath(
  "//*[contains(@class,'dropdown-menu') and contains(@class,'show')] | " +
  "//*[contains(@class,'dropdownContainer') and (contains(@class,'show') or contains(@style,'display'))]"
);
public static final By PROGRAMS_CLONE_SEARCH_INPUT = By.xpath(
  "//*[contains(@class,'dropdownContainer')]//input[@name='search' or @placeholder='Search...']"
);
public static final By PROGRAMS_CLONE_RESULT_ITEMS = By.xpath(
  "//*[contains(@class,'dropdownContainer')]//*[self::button or self::a or self::div]" +
  "[contains(@class,'dropdown-item') or @role='menuitem' or @role='option']"
);
// Item por nome (use com String.format)
public static final String X_PROGRAMS_CLONE_RESULT_ITEM_BY_NAME =
  "//*[contains(@class,'dropdownContainer')]//*[self::button or self::a or self::div]" +
  "[contains(@class,'dropdown-item') or @role='menuitem' or @role='option']" +
  "[normalize-space()='%s']";
public static final By PROGRAMS_CLONE_NO_RESULTS = By.xpath(
  "//*[contains(@class,'dropdownContainer')]//*[contains(@class,'noResults') or " +
  "contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'no results')]"
);

// Campos do formulário (Formik - por name)
public static final By PROGRAM_NAME_INPUT              = By.name("programName");
public static final By MONEY_FACTOR_INPUT             = By.name("moneyFactor");
public static final By PAYOFF_DISCOUNT_INPUT          = By.name("payoffDiscount");
public static final By EPO_DAYS_INPUT                 = By.name("epoDays");
public static final By EPO_FEE_PERCENT_INPUT          = By.name("epoFeePercent");
public static final By TERM_MONTHS_INPUT              = By.name("termMonths");
public static final By STATES_INPUT                   = By.name("states");
public static final By LENDING_CATEGORY_TYPE_INPUT    = By.name("lendingCategoryType");
public static final By ALLOWED_FREQUENCY_MULTI        = By.xpath(
  "//*[contains(@class,'react-select') and contains(@class,'control')][.//*[contains(@class,'value-container')]]"
);
public static final By ALLOWED_FREQUENCY_SELECTED_CHIPS = By.xpath(
  "//*[contains(@class,'react-select__multi-value__label')]"
);
public static final By DEALER_DISCOUNT_INPUT          = By.name("dealerDiscount");
public static final By MIN_CART_AMOUNT_INPUT          = By.name("minCartAmount");
public static final By MAX_CART_AMOUNT_INPUT          = By.name("maxCartAmount");
public static final By PROCESSING_FEE_OVERRIDE_INPUT  = By.name("processingFeeOverride");
public static final By AMOUNT_CHARGED_AT_SIGNING_INPUT= By.name("amountChargedAtSigning");

// Campo oculto (se existir visível no DOM). Alternativa: validar via rede.
public static final By PROGRAM_PK_HIDDEN              = By.name("programPk");

// Salvar e feedback
public static final By SAVE_BUTTON = By.xpath("//button[normalize-space()='Save' or @type='submit']");
public static final By SUCCESS_TOAST = By.xpath(
  "//*[contains(@class,'Toastify__toast--success') or contains(@class,'alert-success') or " +
  "contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'success')]"
);

// Lista e filtros da página (pós-save)
public static final By PROGRAMS_FILTER_TOGGLE = By.xpath("//button[contains(@class,'filterButton')]");
public static final By PROGRAMS_FILTER_SEARCH = By.id("search");
public static final By PROGRAMS_FILTER_SEARCH_BUTTON = By.name("searchButton");

// Tabela de Programs (DataTable)
public static final By PROGRAMS_TABLE = By.xpath("//div[contains(@class,'rdt_Table')]");
public static final By PROGRAMS_TABLE_HEADER = By.xpath("//div[contains(@class,'rdt_TableHead')]");
public static final By PROGRAMS_ROWS = By.xpath("//div[@role='rowgroup']//div[@role='row']");
public static final By PROGRAMS_FIRST_ROW_NAME_LINK = By.xpath(
  "//div[@role='rowgroup']//div[@role='row'][1]//div[@data-column-id='1']" +
  "//*[contains(@class,'utils_dataTableColumn__cursorPointer')]"
);
// Coluna "Program Name" por data-column-id no header
public static final By PROGRAMS_HEADER_PROGRAM_NAME = By.xpath(
  "//div[@role='columnheader' and @data-column-id='1']"
);
Como cada Step do schema BDD se liga aos elementos/ações

Background

Log in to origination → Reutilizar accessPortal(Portal.ORIGINATION) e UownLoginPage.login() (já no framework).
Navigate to programs page → ElementUtility.click(PROGRAMS_MENU) e wait.until(urlToBe(PROGRAMS_URL)).
Click on "ADD NEW PROGRAM" button → ElementUtility.click(PROGRAMS_ADD_NEW_BUTTON).
RF-01: Clone action visível/clicável

Button "Clone" should be visible/enabled → verifyPanel(getByType("xpath", PROGRAMS_CLONE_BUTTON), ValidationType.VISIBLE|ENABLED).
Click on "Clone" → ElementUtility.click(PROGRAMS_CLONE_BUTTON).
Clone dropdown should be open → verifyPanel(getByType("xpath", PROGRAMS_CLONE_DROPDOWN_OPEN), ValidationType.VISIBLE).
RF-02/12: Dropdown abre com busca e lista inicial

Field "Search" in clone dropdown should be visible → verifyPanel(PROGRAMS_CLONE_SEARCH_INPUT, VISIBLE).
Program list in clone dropdown should display at least 1 item → localizar PROGRAMS_CLONE_RESULT_ITEMS e validar size >= 1.
RF-03: Filtragem case-insensitive

Type "" in clone search field → ElementUtility.sendKeys(PROGRAMS_CLONE_SEARCH_INPUT, term, true, true).
Contain/exclude → coletar textos de PROGRAMS_CLONE_RESULT_ITEMS, normalizar toLowerCase(), aplicar asserts de inclusão/ausência.
RF-04/05 + RD-01/RD-02: Seleção e pré-preenchimento

Select program "" → By.xpath(String.format(X_PROGRAMS_CLONE_RESULT_ITEM_BY_NAME, sourceProgramName)) + ElementUtility.click.
Prefill de campos → usar verifyPanel com ValidationType apropriado apontando para os locators por name:
moneyFactor → MONEY_FACTOR_INPUT (EQUALS_NUMBER)
payoffDiscount → PAYOFF_DISCOUNT_INPUT (EQUALS_NUMBER)
epoDays → EPO_DAYS_INPUT (EQUALS_NUMBER)
epoFeePercent → EPO_FEE_PERCENT_INPUT (EQUALS_NUMBER)
termMonths → TERM_MONTHS_INPUT (EQUALS_NUMBER)
states → STATES_INPUT (EQUALS_TEXT)
lendingCategoryType → LENDING_CATEGORY_TYPE_INPUT (EQUALS_TEXT)
dealerDiscount → DEALER_DISCOUNT_INPUT (EQUALS_NUMBER)
minCartAmount → MIN_CART_AMOUNT_INPUT (EQUALS_NUMBER)
maxCartAmount → MAX_CART_AMOUNT_INPUT (EQUALS_NUMBER)
processingFeeOverride → PROCESSING_FEE_OVERRIDE_INPUT (EQUALS_NUMBER)
amountChargedAtSigning → AMOUNT_CHARGED_AT_SIGNING_INPUT (EQUALS_NUMBER)
Multi-select allowedFrequencyOverride:
Seleção/validação: ElementUtility.reactDropDown(...) para abrir/validar; para conferência ler labels: ALLOWED_FREQUENCY_SELECTED_CHIPS e comparar com a conversão esperada.
RF-06: Sufixo " cloned" em programName

verifyPanel(PROGRAM_NAME_INPUT, ValidationType.EQUALS_TEXT, expected = sourceProgramName + " cloned").
RF-07: programPk nulo antes do save

Se input hidden existir: PROGRAM_PK_HIDDEN com ValidationType.EMPTY_OR_NULL.
Alternativa recomendada (mais robusta): validação de rede:
Network last request to path "createOrUpdateProgram" JSON body should contain empty values for keys "programPk" (padrão já usado para merchants; replicar para programs).
RF-08: Editabilidade após prefill

Tentar editar, ex.: ElementUtility.sendKeys(PAYOFF_DISCOUNT_INPUT, "7.5", true, true) e validar verifyPanel(PAYOFF_DISCOUNT_INPUT, EQUALS_NUMBER, 7.5).
RF-09/10 + RD-03/RD-04 + RPC-01: Salvar e identificar clone

Click on "Save" → ElementUtility.click(SAVE_BUTTON).
Success notification → verifyPanel(SUCCESS_TOAST, VISIBLE).
Retornar à lista/garantir lista → wait.until(PROGRAMS_TABLE).
Buscar pelo nome clonado:
Expand filtros se necessário: ElementUtility.click(PROGRAMS_FILTER_TOGGLE) (reaproveitar steps existentes “Expand filters”).
ElementUtility.sendKeys(PROGRAMS_FILTER_SEARCH, "<source> cloned", true, true), ElementUtility.click(PROGRAMS_FILTER_SEARCH_BUTTON).
Verificar primeira linha/linhas contêm o nome clonado (coluna data-column-id='1').
Persistência (API/DB):
API: obter o registro salvo e comparar campos do formulário vs payload retornado (exceto IDs gerados).
Garantir programId/programPk diferentes do original.
RF-11: Paridade com clonagem de merchant

Abrir dropdown de clone de merchant (steps já existentes) e repetir buscas com o mesmo <term>.
Validar comportamento idêntico de filtragem e campo sticky (ver RUX-01).
RUX-01: Campo de busca sticky visível ao rolar

Com dropdown aberto: executar JavaScript para scrollTop do container identificado por PROGRAMS_CLONE_DROPDOWN_OPEN.
Validar PROGRAMS_CLONE_SEARCH_INPUT isDisplayed() e isEnabled() após rolagem.
RUX-02: Largura mínima do dropdown

Medir getBoundingClientRect().width do PROGRAMS_CLONE_DROPDOWN_OPEN via JS e validar >= 320.
RUX-03: Estados visuais hover/active/focus do input

Simular hover/focus no PROGRAMS_CLONE_SEARCH_INPUT com Actions/JS.
Validar presença de estilo de box-shadow/foco (JS computado). Se o CSS module aplicar sombra, validar que o valor não é “none”.
RUX-04: Estado “no results”

Digitar token inexistente.
Validar presença de PROGRAMS_CLONE_NO_RESULTS ou fallback por texto “no results”.
RV-01: Falha no serviço getAllMerchantPrograms

Caso o framework suporte mock/intercept: configurar o endpoint para 500 e validar dropdown em estado seguro (lista vazia, sem quebra de layout).
Caso não haja mocking automático no pipeline, marcar cenário como contrato/manual.
RV-02: Validações obrigatórias

Limpar PROGRAM_NAME_INPUT, clicar SAVE_BUTTON, validar mensagem de validação (padrão do projeto para mensagens; se necessário, criar locator para contêiner de validação do campo).
RV-03: Nome duplicado

Tentar salvar com nome igual ao existente (sem “cloned”, por exemplo).
Validar mensagem de duplicidade (criar locator para toast/erro inline).
RS-01: Permissão

Login com papel sem permissão (role “viewer”).
Validar ausência de PROGRAMS_CLONE_BUTTON.
RNF-01: Desempenho (<= 2s)

Medir t0 = now antes do clique em PROGRAMS_CLONE_BUTTON.
Esperar PROGRAMS_CLONE_RESULT_ITEMS visível e t1 = now.
Assert (t1 - t0) <= 2000.
RNF-02: Estabilidade visual

Rolar dropdown e garantir PROGRAMS_CLONE_SEARCH_INPUT continua clicável e nenhum elemento essencial é ocultado (ou detecção de overlay inesperado).
RNF-03: Acessibilidade por teclado

Abrir dropdown por teclado (enviar Space/Enter focado no botão).
Digitar no campo com teclado, navegar com setas e Enter para selecionar.
Validar prefill.
RO-01: Auditoria de criação

Após salvar, abrir logs de Program (se houver UI de logs).
Reutilizar LogHelper para expandir/filtrar e validar mensagem:
“CREATED: Program cloned from ''”
RPC-02: Uso em fluxos

Iniciar fluxo de aplicação e selecionar o programa clonado (pela busca/filtro).
Validar que regras/valores são respeitados (pelo menos por campo-chave, ex.: termMonths, moneyFactor).
Recomendações de implementação dos Steps (reuso do framework)

Verificações de campo: use verifyPanel(locator, ValidationType.XXX, expected).
Busca no dropdown:
ElementUtility.click(PROGRAMS_CLONE_BUTTON)
ElementUtility.sendKeys(PROGRAMS_CLONE_SEARCH_INPUT, term, true, true)
Encontrar item: By item = By.xpath(String.format(X_PROGRAMS_CLONE_RESULT_ITEM_BY_NAME, name)); ElementUtility.click(item);
Multi-select React: ElementUtility.reactDropDown(ALLOWED_FREQUENCY_MULTI, expectedOptionsArray) e validação das chips por ALLOWED_FREQUENCY_SELECTED_CHIPS.
Rede: steps existentes de “Network last request … JSON body should contain …” (replicar para createOrUpdateProgram).
Tabela/lista: reusar validateColumnValues quando aplicável (coluna “Program Name” = data-column-id='1'), ou simple assert por PROGRAMS_ROWS + célula com data-column-id='1'.
Observações de robustez

CSS Modules: classes geradas incluem o trecho dropdownContainer; por isso usamos contains(@class,'dropdownContainer') para estabilidade.
Reactstrap Dropdown: detectar aberto pela presença de .dropdown-menu.show OU container com classe/estilo ativo (fallback já contemplado).
Esperas: sempre wait.until em elementos dinâmicos (dropdown, lista, toasts, tabela).
IDs/Names do formulário: o React define name via Formik; este é o seletor preferencial (estável e sem dependência de CSS).
Caso não exista programPk no DOM, prefira validação via rede (mais fiel ao requisito).

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Abaixo está a relação consolidada do que já existe no projeto e do que precisa ser criado para cobrir 100% dos requisitos do Feature “Program cloning in Origination”. Segui as suas diretrizes: reutilização máxima (CommonHelpers, verifyPanel + ValidationType, ApiSteps), centralização de seletores em Elements.java e Cucumber Expressions puras.

Resumo rápido

Já temos: login, configuração de ambiente/navegador (via steps existentes), validações genéricas com verifyPanel + ValidationType, validações de rede (HAR) em ApiSteps, reload da página, utilitários para interação (ElementUtility).
Precisamos criar: navegação/ações específicas da tela de Programs, steps para dropdown de Clone (abrir, buscar, selecionar, validar lista/estados/UX), steps genéricos de clique por texto, steps de “Field … should equal …” e “Edit field … to …”, steps de performance/teclado/acessibilidade, mocking do serviço getAllMerchantPrograms, verificação de logs específicos de Program, e comparações via API para o objeto Program.
Cobertura por cenário

Background

Given Environment is set to "qa1"
Já temos equivalente: CommonSteps → @Given "I set the environment to (.), project to (.), subdomain to (.), navigate to (.)". Podemos mapear um alias simples (“Environment is set to {string}”) ou usar o existente com PageConfig apropriado. Precisa criar alias se quisermos manter a frase curta.
And Browser is "chrome"
Já temos equivalente: CommonSteps → @And "I set the browser to "{string}", stealth mode if …". Precisa alias simples “Browser is {string}”.
And Log in to origination
Já temos: AccountCreationSteps → @And "Log in to origination".
And Navigate to programs page
Não temos. Precisa criar (navegar por menu id=programs e validar URL contém “/programs”).
And Click on "ADD NEW PROGRAM" button
Não temos genérico de “Click on {string} button”. Precisa criar step genérico de clique por texto.
@RF-01 (Clone button + abrir dropdown)

“Button "Clone" should be visible/enabled”
Não temos steps genéricos textuais. Podemos reutilizar verifyPanel + ValidationType se mapearmos os locators no Elements.java e uma pequena camada de PageConfig/painel. Precisa criar step(s) de verificação por texto ou usar verifyPanel com DataTable.
“Click on "Clone" button”
Precisa criar “Click on {string} button”.
“Clone dropdown should be open”
Precisa criar (validar container aberto, ex.: .dropdown-menu.show ou container da lista).
@RF-02 @RF-12 (campo Search e lista inicial)

“Field "Search" in clone dropdown should be visible”
Precisa criar (ou usar verifyPanel se mapeado o campo no painel/classe de página).
“Program list in clone dropdown should display at least 1 item”
Precisa criar (contagem de itens no container do dropdown).
@RF-03 (filtro case-insensitive)

“Type "" in clone search field”
Não temos “Type … in …”. Precisa criar.
“Clone results should contain … / exclude … (case-insensitive)”
Precisa criar (coletar textos, normalizar lower-case, assert includes/excludes).
@RF-04 @RF-05 @RD-01 @RD-02 (seleção e prefill)

“Given Source program details are loaded via API for ""”
Não temos específico para Program. Precisa criar (ApiSteps possui base para HAR e requests; criar um step que chama o endpoint de programa e cacheia os valores esperados).
“And Select program "" in clone dropdown”
Precisa criar (seleção por nome no dropdown).
“Then Program form should be prefilled with values: (DataTable com ValidationType)”
Já temos mecanismo genérico: CommonSteps → “Verify the {string} panel on {string} portal page {string} …”. Para usar, precisamos:
Mapear os campos de Program no Elements.java por name/id (moneyFactor, payoffDiscount, …).
Definir o “panel/pageKey” correspondente (ex.: “programs” ou “program-detail”) para o verifyPanel.
Conclusão: Reuso com verifyPanel + ValidationType (Precisa apenas dos locators e um step wrapper “Program form should be prefilled …” que repassa ao verifyPanel).
“Multi-select "allowedFrequencyOverride" … ElementUtility.reactDropDown(...)”
Precisa criar step de verificação (ler chips/labels selecionados e comparar com a conversão esperada).
@RF-06 (sufixo “ cloned”)

“Then Field "programName" should equal " cloned"”
Precisa criar step “Field {string} should equal {string}” (ou usar verifyPanel EQUALS_TEXT para o campo programName).
@RF-07 (programPk nulo)

“Then Hidden field "programPk" should be empty or null”
Opção A (DOM): Precisa criar step que lê input hidden por name/id.
Opção B (HAR): Já temos ApiSteps → “Network last request to path {string} JSON body should contain empty values for keys {string}”. Podemos criar um alias de semântica UI que chama este step com path “createOrUpdateProgram” e key “programPk”. Recomendado criar alias para consistência.
@RF-08 (editabilidade)

“Edit field "payoffDiscount" to "7.5"”
Precisa criar step genérico “Edit field {string} to {string}” usando ElementUtility.sendKeys().
“Then Field "payoffDiscount" should equal "7.5"”
Cobrir com step “Field {string} should equal {string}” (mesmo do RF-06).
@RF-09 @RF-10 @RD-03 @RD-04 @RPC-01 (salvar e validar persistência)

“Click on "Save" button”
Precisa criar step genérico (ou um alias que clique em Elements.SAVE_BUTTON).
“Success notification should be visible”
Precisa criar step de toast (Elements.TOAST / Toastify).
“New program should appear in programs list with name " cloned"”
Podemos reutilizar validateColumnValues (CommonHelpers) se mapeado “Program Name”/tabela. Se preferir, criar step que abre filtros (Elements.FILTERS), digita no Search e valida linha na 1ª página (há utilitários para tabela).
Conclusão: Reuso parcial + 1 step wrapper.
“Saved program details via API should match form values (excluding generated identifiers)”
Precisa criar step: capturar valores da UI; chamar API; comparar campos excluindo ids.
“Saved programId/programPk should differ from source”
Precisa criar step(s) de comparação (usar os dados do “Given Source program details …” + API do salvo).
@RF-11 (paridade UX com merchant)

Para merchants já existem steps de clonagem:
UownMerchantSteps → “Clone the merchant {string}”, “Clone the merchant” (abre dropdown e interage).
Não há step específico “Merchant cloning dropdown is opened …” nem “Type … in merchant clone search field”. Precisam ser criados (podem reaproveitar o código existente em UownMerchantSteps para abrir/filtrar).
“... should behave identical …”
Precisa criar step comparativo que execute a mesma busca nos dois dropdowns e compare conjuntos/ordem/estados.
@RUX-01 (sticky search ao rolar)

“Scroll clone results to the bottom … remain visible and interactable”
Precisa criar steps de scroll no container e verificação de visibilidade/habilitado (esperas explícitas).
@RUX-02 (largura mínima)

“Clone dropdown width should be at least "320" pixels”
Precisa criar (JS getBoundingClientRect().width e assert >= valor).
@RUX-03 (estados visuais hover/focus/active)

“Hover on clone search field” / “Focus clone search field” e validações visuais
Precisa criar (usar Actions/JS + computed style; evitar magic numbers; comparar shadow/border/pseudo-class).
@RUX-04 (no results)

“Clone dropdown should display "no results" state”
Precisa criar (localizador robusto “no results”).
@RV-01 @mock (erro no serviço)

“Service "getAllMerchantPrograms" is mocked to return error "500"”
Não temos pronto. Há utilitários de mock no projeto (MockServer etc.). Precisa criar step para subir mock e interceptar rota, ou classificar como contrato/manual no pipeline quando mocking não disponível.
“Then Clone dropdown should show safe empty state …”
Precisa criar step de validação de estado seguro (sem quebrar a página).
@RV-02 (validações obrigatórias)

“Clear required field "programName"”
Precisa criar step genérico “Clear field {string}”.
“Validation message for "programName" should be visible” e “Save action should be blocked”
Precisa criar step(s) para mensagens inline/toast e bloqueio (ex.: verificar que API não foi chamada ou botão Save permanece desabilitado).
@RV-03 (nome duplicado)

“Replace field "programName" value with "" … Duplicate name error … Save blocked”
Precisa criar (mesma família do RV-02; mensagens específicas de duplicidade).
@RS-01 @permission (sem permissão)

“Logged in as user role "viewer" without program-clone permission”
Não temos step para roles específicos. Precisa criar (usar UownLoginPage.completeLoginWithCredentialsWrapper com role “viewer”).
“Then Button "Clone" should not be visible”
Criar step de negação de visibilidade (ou verifyPanel com ValidationType.NOT_VISIBLE).
@RNF-01 (desempenho até 2s)

“Clone dropdown initial list should be visible within "2000" milliseconds”
Precisa criar step que mede t0 antes do clique e valida t1-t0 <= limite.
@RNF-02 (estabilidade visual)

“Scroll clone results … search field remains clickable … no occlusion”
Precisa criar (checar clickable e ausência de overlays).
@RNF-03 (acessibilidade/teclado)

“Open clone dropdown using keyboard … Type "prog" using keyboard … Navigate with arrow keys … Enter”
Precisa criar steps de teclado no dropdown e assert de prefill.
@RO-01 (audit log)

“In program logs UI "CREATED: Program cloned from ''" should be present”
Temos UownLogSteps para logs (servicing/merchant). Para Program, precisamos criar step (pode reaproveitar LogHelper, validar tabela/notas/coluna). Precisa criar.
@RPC-02 (uso do programa clonado no fluxo)

“Given Program " cloned" exists”
Precisa criar (via API ou busca na lista de Programs).
“Start a new application flow … Select program " cloned" … Then Application should accept …”
Provável reuso parcial de steps de fluxo base (UownBasicFlowSteps/UownOverviewSteps), mas selecionar Program dentro do fluxo exige step novo (selecionar Program no ponto do fluxo).
Steps existentes relevantes (para reuso)

Login: 
AccountCreationSteps.logInToOrigination
Ambiente/navegador: CommonSteps.setEnvironment(...), CommonSteps.setBrowser(...)
Verificações genéricas: CommonSteps.verifyPanelReturn e CommonSteps.verifyPanelStay (driver para verifyPanel + ValidationType)
Rede/HAR: em ApiSteps:
"Network contains {method} to path {string} with status {int}"
"Network last request to path {string} JSON body should contain keys {string}"
"Network last request to path {string} JSON body should contain empty values for keys {string}"
Headers presentes/ausentes
“Enable HAR content capture”, “Reset network capture”
Reload da página: 
UownCustomerSteps.iReloadThePage
Elementos genéricos/tabela/filtros: Elements.FILTERS, Elements.SEARCH_BUTTON, Elements.SEARCH_INPUT, Elements.TABLE, Elements.TABLE_ROW etc. (já há base para listas com DataTable)
Novos steps a serem criados (proposta de expressões)

Contexto/Navegação
Given Environment is set to "{env}"
And Browser is "{browser}"
And Navigate to programs page
And Click on "{buttonText}" button
Dropdown de Clone (Programs)
Then Button "{buttonText}" should be visible
And Button "{buttonText}" should be enabled
Then Clone dropdown should be open
Then Field "Search" in clone dropdown should be visible
And Program list in clone dropdown should display at least {int} item(s)
When Type "{term}" in clone search field
Then Clone results should contain items with name including "{expected}" (case-insensitive)
And Clone results should exclude items not matching "{unexpected}" (case-insensitive)
And Select program "{sourceProgramName}" in clone dropdown
Prefill/Formulário
Given Source program details are loaded via API for "{sourceProgramName}"
Then Program form should be prefilled with values:
DataTable: field | ValidationType | expectedFromSource
And Multi-select "{fieldName}" should contain options from API conversion
Then Field "{fieldName}" should equal "{expected}"
And Hidden field "{fieldName}" should be empty or null (ou alias para HAR JSON vazio)
And Edit field "{fieldName}" to "{value}"
Salvar/Lista/Comparações
Then Success notification should be visible
And New program should appear in programs list with name "{name}"
And Saved program details via API should match form values (excluding generated identifiers)
And Saved programId should differ from source programId
And Saved programPk should differ from source programPk
Paridade com merchant
Given Merchant cloning dropdown is opened on merchant creation page
When Type "{term}" in merchant clone search field
Then Merchant clone results filtering should behave identical to Program clone results for term "{term}"
And Sticky search field behavior should match between merchant and program clone dropdowns
UX/Visual
And Scroll clone results to the bottom
Then Clone search field should remain visible and interactable
Then Clone dropdown width should be at least "{int}" pixels
And Hover on clone search field
Then Clone search field should have focus/hover visual highlight
When Focus clone search field
Then Clone search field should have active/focus visual highlight
Then Clone dropdown should display "no results" state
Robustez/Validações
Given Service "{serviceName}" is mocked to return error "{httpCode}"
Then Clone dropdown should show safe empty state without breaking the page
And Clear required field "{fieldName}"
Then Validation message for "{fieldName}" should be visible
And Save action should be blocked
And Replace field "{fieldName}" value with "{newValue}"
Then Duplicate name error message should be visible
Permissão
Given Logged in as user role "{role}" without program-clone permission
Then Button "Clone" should not be visible
Não-funcionais/Teclado
Then Clone dropdown initial list should be visible within "{int}" milliseconds
And Scroll clone results
Then Clone search field remains clickable and no essential UI elements are occluded
When Open clone dropdown using keyboard
And Type "{term}" using keyboard in clone search field
And Navigate results with arrow keys
And Select highlighted item with "Enter"
Then Program form should be prefilled
Auditoria/Integração cruzada
Then In program logs UI "CREATED: Program cloned from '{sourceProgramName}'" should be present
Given Program "{programName}" exists
When Start a new application flow
And Select program "{programName}"
Then Application should accept the program and reflect its configured values
Ajustes de suporte (sem criar steps ainda, mas necessários para reuso)

Elements.java (centralizar seletores de Programs/Clone dropdown/form): programName, moneyFactor, payoffDiscount, epoDays, epoFeePercent, termMonths, states, lendingCategoryType, dealerDiscount, minCartAmount, maxCartAmount, processingFeeOverride, amountChargedAtSigning, allowedFrequencyOverride (chips), SAVE, TOAST, PROGRAMS menu, “ADD NEW PROGRAM”, clone button, dropdown container, search input e itens.
PageConfig.java: acrescentar chave de página para “programs”/“program-detail” se for usar verifyPanel nessa tela.
ApiSteps: endpoint utilitário para buscar Program por nome/ID e armazenar para comparação (similar ao que já se faz com outras entidades).
Prioridade de implementação (sugestão)

Infra de navegação/ações base de Programs: Navigate → ADD NEW PROGRAM → Clone → dropdown (abrir/busca/selecionar).
Prefill + verifyPanel + ValidationType (campos numéricos/texto) e multi-select.
Salvar + toast + presença na lista + HAR/REST comparação e verificação de IDs diferentes.
RV (validações obrigatórias/duplicidade), RS (permissão), RNF (tempo, teclado), RUX (sticky/width/estados visuais).
RO (logs) e RPC (uso no fluxo), podendo classificar como integração/contrato se faltar endpoint ou pipeline.
Se concordar, preparo a classe UownProgramSteps.java com os steps

-----

Segue a relação objetiva “Já temos” vs “Precisamos criar” para cobrir 100% do Feature de Clonagem de Programas.

Background

Já temos:
Log in to origination (AccountCreationSteps.logInToOrigination)
Set de ambiente/navegador (CommonSteps: setEnvironment/setBrowser – com sintaxe diferente)
Criar:
Navigate to programs page
Click on "ADD NEW PROGRAM" button
Alias simples para “Environment is set to {string}” e “Browser is {string}” (opcional)
RF-01 (Clone visível/clicável e abrir dropdown)

Já temos:
Infra de validação genérica via verifyPanel + ValidationType (CommonSteps)
Criar:
Button "{text}" should be visible/enabled (por texto)
Click on "{text}" button (por texto)
Clone dropdown should be open
RF-02 (Search visível e lista inicial)

Criar:
Field "Search" in clone dropdown should be visible
Program list in clone dropdown should display at least {int} item(s)
RF-03 (Filtro case-insensitive)

Criar:
Type "{term}" in clone search field
Contain/exclude (case-insensitive) nos resultados
RF-04/05 + RD-01/RD-02 (Seleção e Prefill)

Já temos:
verifyPanel + ValidationType (usar para todos os campos)
Criar:
Source program details are loaded via API for "{name}" (ApiSteps p/ Program)
Select program "{name}" in clone dropdown
Multi-select "allowedFrequencyOverride" should contain options from API conversion
RF-06 (Sufixo “ cloned”)

Criar:
Field "{field}" should equal "{value}" (ou alias para verifyPanel EQUALS_TEXT)
RF-07 (programPk nulo antes de salvar)

Já temos:
ApiSteps genérico via HAR: Network last request … JSON body should contain empty values for keys …
Criar:
Alias apontando para path de Program (ex.: "createOrUpdateProgram") ou verificação via input hidden se existir
RF-08 (Editabilidade)

Criar:
Edit field "{field}" to "{value}"
Field "{field}" should equal "{value}"
RF-09/10 + RD-03/RD-04 + RPC-01 (Salvar e persistência)

Já temos:
Elementos de toast (Elements.TOAST)
Criar:
Click on "Save" button
Success notification should be visible
New program should appear in programs list with name "{name}" (pode reutilizar validateColumnValues após filtrar)
Saved program details via API should match form values (excluir IDs)
Saved programId/programPk should differ from source
RF-11 (Paridade com clonagem de merchant)

Já temos:
Steps de clonagem de merchant (UownMerchantSteps) para reuso
Criar:
Steps de paridade (comparar filtragem e sticky entre merchant/program)
RUX-01/02/03/04 (UX/Visual)

Criar:
Scroll clone results to the bottom + sticky search visível/interagível
Largura mínima do dropdown (>= pixels)
Hover/Focus/Active no search (verificação visual)
“No results” state
RV-01 @mock (falha no serviço)

Criar:
Mock de "getAllMerchantPrograms" retornando 500 (usar utilitário de MockServer)
Safe empty state no dropdown
RV-02 (Requeridos bloqueiam salvar)

Criar:
Clear required field "{field}"
Validation message for "{field}" should be visible
Save action should be blocked
RV-03 (Duplicidade)

Criar:
Replace field "{field}" value with "{value}"
Duplicate name error message should be visible
Save action should be blocked
RS-01 @permission (sem permissão)

Criar:
Logged in as user role "{role}" without program-clone permission (login como viewer)
Button "Clone" should not be visible
RNF-01/02/03 (Desempenho/Estabilidade/Acessibilidade)

Criar:
Tempo para lista inicial <= "{ms}" ms
Estabilidade visual (campo clicável, sem occlusion)
Acesso por teclado (abrir, digitar, navegar, Enter → prefill)
RO-01 (Log de auditoria)

Criar:
In program logs UI "CREATED: Program cloned from '{name}'" should be present
RPC-02 (Uso em fluxos)

Criar:
Program "{name} cloned" exists (API/Lista)
Start a new application flow + Select program "{name} cloned"
Application should accept and refletir valores
Suportes necessários em Elements.java

Adicionar: menu 
programs
, botão “ADD NEW PROGRAM”, botão “Clone”, container do dropdown, campo Search, itens, indicador “no results”.
Campos do formulário por name/id (moneyFactor, payoffDiscount, …) e multi-select allowedFrequencyOverride (chips).
Botão Save e toast.
Observação final

Para asserções de formulário, priorizar verifyPanel + ValidationType conforme a convenção de projeto.
Para programPk nulo e validações de request/response, reaproveitar ApiSteps (HAR).

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


> ## Tests in qa1

> ```gherkin
> When Log in to origination
> And Navigate to programs page
> And Click on "ADD NEW PROGRAM" button
> Then Button "Clone" should be visible
> And Button "Clone" should be enabled
> When Click on "Clone" button
> Then Clone dropdown should be open
> Then Field "Search" in clone dropdown should be visible
> When Type "<searchTerm>" in clone search field
> Then Field "programName" should equal "<sourceProgramName> cloned"
> When Edit field "payoffDiscount" to "7.5"
> Then Field "payoffDiscount" should equal "7.5"
> When Click on Save button
> Then Success notification should be visible
> And New program should appear in programs list with name "<sourceProgramName> cloned"
> And Test is successful
> | PASS | LeadPk: | AccountPk: | Merchant: | 
> ```
>
>


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
R7.25.1.44.0_EnableProgramCloning_Ticket1101
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
