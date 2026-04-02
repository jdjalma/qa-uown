--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1109


UOWN | Origination | Update Log Type Dropdown in Add New Log Modal


Synopsis
As a business user, I want an updated list of log types in the Add New Log modal so that I can classify notes more accurately and improve operational performance.
In the Origination Portal, on the Merchants page, the Notes table includes an option to add a new note through the Add New Log modal.
Inside this modal, the dropdown field Log Type must be updated to use a new predefined list provided by the business team.


Business Objective
The current Log Type list does not reflect the categories needed by the business team, which impacts efficiency and accuracy when classifying logs. Updating the list will:
    Standardize log categorization.
    Improve usability and operational performance.
    Ensure consistency across teams working with merchant notes



Feature Request | Business Requirements


        
      
Update the Log Type dropdown in the Add New Log modal (Origination Portal → Merchants page → Notes table).


        
      
Replace the current list with the new ordered list:

      INTERNAL

      EMAIL

        BOUND CALL

      PEO SUPPORT

      MERCHANT REVIEW

      POP SHIPMENT
  
      OUTREACH – MERCHANT

      OUTREACH – PLATFORM

      OUTREACH – ISR

      ESCALATION

      INTERNAL

      SOCIAL MEDIA

      CUSTOMER ASSISTANCE

      OTHER

Ensure the list is displayed in the exact order provided above.
Maintain all existing behaviors of the Add New Log modal (validation, saving, etc.).
Test and confirm that all new log types are stored and retrievable correctly in the system.
Update any related documentation to reflect the new options.


Read Me first:

      If feasible without significant effort, apply the same update in the Servicing Portal wherever this Log Type list is used.
      If not feasible, create a follow-up ticket specifically for the Servicing Portal



--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


UOWN | Originação | Atualizar Dropdown "Log Type" no modal "Add New Log"
Sinopse

Como usuário de negócios, quero uma lista atualizada de tipos de log no modal Add New Log para que eu possa classificar notas de forma mais precisa e melhorar a performance operacional.

No Portal de Originação, na página de Lojistas (Merchants), a tabela de Notas (Notes) inclui a opção de adicionar uma nova nota através do modal Add New Log.

Dentro deste modal, o campo dropdown Log Type deve ser atualizado para utilizar uma nova lista predefinida fornecida pela equipe de negócios.

Objetivo de Negócio

A lista atual de Log Type não reflete as categorias necessárias pela equipe de negócios, o que impacta a eficiência e a precisão na classificação dos logs.

Atualizar a lista irá:

Padronizar a categorização dos logs.

Melhorar a usabilidade e a performance operacional.

Garantir consistência entre as equipes que trabalham com notas de lojistas.

Requisito da Funcionalidade | Requisitos de Negócio

Atualizar o dropdown de Log Type no modal Add New Log
(Localização: Origination Portal → Página Merchants → Tabela Notes).

Substituir a lista atual pela nova lista ordenada:

INTERNAL

EMAIL

BOUND CALL

PEO SUPPORT

MERCHANT REVIEW

POP SHIPMENT

OUTREACH – MERCHANT

OUTREACH – PLATFORM

OUTREACH – ISR

ESCALATION

INTERNAL

SOCIAL MEDIA

CUSTOMER ASSISTANCE

OTHER

Regras adicionais:

A lista deve ser exibida na ordem exata fornecida acima.

Manter todos os comportamentos existentes do modal Add New Log (validação, salvamento etc.).

Testar e confirmar que todos os novos tipos de log são armazenados e recuperados corretamente no sistema.

Atualizar qualquer documentação relacionada para refletir as novas opções.

Leia Primeiro:

Se viável sem esforço significativo, aplicar a mesma atualização também no Servicing Portal em todos os lugares onde esta lista de Log Type é usada.

Caso não seja viável, criar um ticket de acompanhamento especificamente para o Servicing Portal.

👉 Quer que eu já monte cenários de teste (UI e API) para validar essa atualização do dropdown, como fizemos nos casos do lease?


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1
> ```gherkin
> All new log type options for notes are now available when creating a note. The selected log type also acts as a filter, allowing you to easily filter notes by their log type.
> 
> ![Screenshot_53](/uploads/ce4f04f01bc3ad29f9410213033ff476/Screenshot_53.png){width=570 height=354}
> 
> ![Screenshot_54](/uploads/54aaf1ad5452c0821d0967b9b09f4ff8/Screenshot_54.png){width=570 height=354}
> 
> ![Screenshot_46](/uploads/3328c678b1e55979cdc77ac4776cdb9d/Screenshot_46.png){width=979 height=237}
> 
> ![Screenshot_47](/uploads/d5001bf3707d48c874b1caac12cfa315/Screenshot_47.png){width=158 height=56}
> 
> ![Screenshot_48](/uploads/2f55cdff6496c987bf320d3856985ac8/Screenshot_48.png){width=902 height=417}
> 
> ![Screenshot_49](/uploads/5634092031cdf69a754aef1f778b9ed9/Screenshot_49.png){width=784 height=280}
> 
> ![Screenshot_50](/uploads/1b9411d7ebb167ae0bc6b99680a1f88b/Screenshot_50.png){width=1006 height=453}
> 
> ![Screenshot_51](/uploads/35a424fdf71599660e72df5bd90cde6f/Screenshot_51.png){width=999 height=354}
> 
> ![Screenshot_52](/uploads/72def58650207c189cdce3cbeb10fe47/Screenshot_52.png){width=1433 height=684}
> | PASS |
> ```
>


