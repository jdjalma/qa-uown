------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/369

UOWN | SVC | Custom field-based logging for ActivityLogs on entity creation and update
Aberto
  Tíquete criado 4 semanas atrás por Yuri Araujo
Synopsis
Currently, ActivityLogs always record the same fields regardless of whether the entity is being created or updated. This limits the accuracy and usefulness of the logs for auditing and debugging purposes.

Business Objective
Improve observability and traceability of system changes by customizing which fields are logged depending on whether an entity is newly created or updated. This allows stakeholders and developers to better understand what data was introduced versus what data was modified.

Feature Request | Business Requirements
Introduce two new Java annotations, such as @LoggableCreated and @LoggableUpdated, to distinguish between creation and update operations.
When an entity is created, log only the fields marked with @LoggableCreated.
When an entity is updated, log only the fields marked with @LoggableUpdated.
Ensure compatibility with the existing ActivityLogs infrastructure and avoid breaking current logging behavior.
Include unit and integration tests to validate that:
On creation, only @LoggableCreated fields are logged.
On update, only @LoggableUpdated fields are logged.
Validate annotation behavior in both embedded and non-embedded entities.

-----

✅ Requisitos Extraídos
Requisitos Funcionais
RF01: Ao criar uma entidade, apenas os campos anotados com @LoggableCreated devem ser registrados nos logs.
RF02: Ao atualizar uma entidade, apenas os campos anotados com @LoggableUpdated devem ser registrados.
RF03: O sistema deve continuar compatível com a infraestrutura atual de ActivityLogs.
RF04: Entidades aninhadas (embedded) também devem ter seus campos anotados corretamente tratados.
RF05: As anotações devem ser testadas com cobertura unitária e de integração.
RF06: Se um campo não está anotado com @LoggableCreated nem @LoggableUpdated, ele não deve aparecer no log, mesmo que modificado.

Requisitos Não Funcionais
RNF01: O comportamento atual do sistema de log não pode ser quebrado.
RNF02: O sistema deve permitir fácil manutenção e extensibilidade de novos campos logáveis.
RNF03: O desempenho da serialização de logs deve ser preservado ou melhorado.
RNF04: Os logs devem ser legíveis e conter apenas os campos relevantes para a operação em questão.

✅ Cenarios de Teste em Gherkin (.feature)
Funcionalidade: Log personalizado baseado na operação da entidade (criação ou atualização)

  Contexto:
    Dado que o sistema possui a infraestrutura de ActivityLogs habilitada

  Cenário: Registrar apenas os campos com @LoggableCreated na criação da entidade
    Dado uma nova entidade com campos anotados com @LoggableCreated e @LoggableUpdated
    Quando a entidade é criada no sistema
    Então o log deve incluir apenas os campos anotados com @LoggableCreated
    E o log não deve incluir os campos anotados apenas com @LoggableUpdated

  Cenário: Registrar apenas os campos com @LoggableUpdated na atualização da entidade
    Dado uma entidade existente com campos anotados com @LoggableCreated e @LoggableUpdated
    Quando a entidade é atualizada no sistema
    Então o log deve incluir apenas os campos anotados com @LoggableUpdated
    E o log não deve incluir os campos anotados apenas com @LoggableCreated

  Cenário: Registrar campos de entidades incorporadas corretamente com base nas anotações
    Dado uma entidade com um objeto incorporado contendo campos anotados com @LoggableCreated e @LoggableUpdated
    Quando a entidade é criada
    Então o log deve incluir apenas os campos do objeto incorporado anotados com @LoggableCreated

  Cenário: Log de atualização exclui campos não anotados
    Dado uma entidade com campos não anotados
    Quando a entidade é atualizada
    Então nenhum dos campos não anotados deve aparecer no log

  Esquema do Cenário: Diferentes tipos de alteração disparam o comportamento correto das anotações
    Dado uma entidade com a propriedade <campo> anotada como <anotacao>
    Quando a entidade é <operacao>
    Então o campo <campo> deve <comportamento_log> no log

    Exemplos:
      | campo         | anotacao           | operacao | comportamento_log |
      | name          | @LoggableCreated   | created  | aparecer           |
      | name          | @LoggableCreated   | updated  | não aparecer       |
      | address       | @LoggableUpdated   | updated  | aparecer           |
      | address       | @LoggableUpdated   | created  | não aparecer       |
      | phone         | -                  | created  | não aparecer       |
      | phone         | -                  | updated  | não aparecer       |

  Cenário: Compatibilidade com logs legados
    Dado uma entidade previamente logada com @Loggable
    Quando nenhuma nova anotação é adicionada
    Então o log deve se comportar como antes, sem falhas

  Cenário: O desempenho do log não é degradado
    Dado um conjunto de entidades com múltiplos campos
    Quando uma operação em massa de inserção ou atualização é realizada
    Então o log deve ser concluído dentro de limites aceitáveis de tempo



-----

✅ Mapeamento de Cenários com Requisitos
| Cenário                                                              | Requisitos Cobertos |
| -------------------------------------------------------------------- | ------------------- |
| Log only @LoggableCreated fields on entity creation                  | RF01, RF03, RNF01   |
| Log only @LoggableUpdated fields on entity update                    | RF02, RF03, RNF01   |
| Log embedded entity fields correctly based on annotations            | RF04, RF01          |
| Update log excludes non-annotated fields                             | RF06                |
| Different change types trigger correct annotation behavior (outline) | RF01, RF02, RF06    |
| Compatibility with legacy logging                                    | RF03, RNF01         |
| Logging performance is not degraded                                  | RNF03               |

-----


🔍 Lacunas Identificadas e Recomendações
| Lacuna                                                      | Recomendação                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Ausência de cenário de log com campo `null` ou valor padrão | Adicionar cenário para testar se campos `null` são ignorados                 |
| Teste de múltiplas anotações no mesmo campo                 | Adicionar teste para campo com ambas `@LoggableCreated` e `@LoggableUpdated` |
| Cenários de rollback em caso de falha de persistência       | Criar cenários que testem o log não sendo salvo após erro                    |
| Cenários com listas ou coleções de objetos embutidos        | Criar cobertura para collections com anotações                               |

-----

✅ Resumo das Alterações nos Logs
1. Criação das novas anotações
Loggable.java foi renomeada para LoggableCreated.java
Nova anotação @LoggableUpdated foi criada do zero

2. Infraestrutura dos Logs Atualizada
As classes LosEntityListener e SvcEntityListener foram modificadas para:
Tratar diferentemente logs de criação (EntityChangeType.ADDED) e atualização (EntityChangeType.UPDATED)
Usar hasLoggableAttribute(field, changeType) para diferenciar o comportamento com base nas novas anotações

✅ Entidades do pacote los alteradas
As seguintes entidades foram alteradas (cada uma teve campos marcados com @LoggableCreated e/ou @LoggableUpdated):
| Classe Java                     | Tipo de mudança no log                   |
| ------------------------------- | ---------------------------------------- |
| `LosAddress.java`               | + `@LoggableCreated`, `@LoggableUpdated` |
| `LosAlert.java`                 | + idem                                   |
| `LosBankAccount.java`           | + idem                                   |
| `LosContract.java`              | + idem                                   |
| `LosCreditCard.java`            | + idem                                   |
| `LosCreditCardTransaction.java` | + idem                                   |
| `LosCustomer.java`              | + idem                                   |
| `LosEmail.java`                 | + idem                                   |
| `LosEmployment.java`            | + idem                                   |
| `LosInvoice.java`               | + idem                                   |
| `LosItem.java`                  | + idem                                   |
| `LosLead.java`                  | + idem                                   |
| `LosPayment.java`               | + idem                                   |
| `LosPhone.java`                 | + idem                                   |
| `LosUWData.java`                | + idem (em campo `uwInfo`)               |

-----

✅ Entidades do pacote svc alteradas
As mesmas mudanças ocorreram nas classes equivalentes no módulo SVC:
| Classe Java          | Tipo de mudança no log                   |
| -------------------- | ---------------------------------------- |
| `SvACHPayment.java`  | + `@LoggableCreated`, `@LoggableUpdated` |
| `SvAccount.java`     | + idem                                   |
| `SvAddress.java`     | + idem                                   |
| `SvBankAccount.java` | + idem                                   |
| `SvContract.java`    | + idem                                   |
| `SvCreditCard.java`  | + idem                                   |
| `SvCustomer.java`    | + idem                                   |
| `SvEmail.java`       | + idem                                   |
| `SvEmployment.java`  | + idem                                   |
| `SvInvoice.java`     | + idem                                   |
| `SvItem.java`        | + idem                                   |
| `SvPayment.java`     | + idem                                   |
| `SvPhone.java`       | + idem                                   |
| `SvUWData.java`      | + idem (campo `uwInfo`)                  |

-----

✅ Campos específicos melhorados (exemplos)
Dos arquivos de POJOs (*Info.java), diversos campos passaram a ter granularidade nos logs. Exemplo:
PhoneInfo.java
@LoggableCreated
@LoggableUpdated
private Boolean doNotCall;

@LoggableCreated
@LoggableUpdated
private Boolean doNotText;


UWInfo.java
@LoggableCreated
@LoggableUpdated
private BigDecimal uwApprovalAmount;

@LoggableCreated
@LoggableUpdated
private LocalDate approvalExpirationDate;

-----

📌 Conclusão
A partir da análise dos commits e alterações, os logs alterados ou melhorados estão nos listeners (EntityListener) e em todos os campos das entidades que agora 
usam @LoggableCreated e @LoggableUpdated, principalmente nos domínios los e svc.
✅ Todos os campos que antes eram simplesmente @Loggable agora estão segmentados entre criação e atualização — o que melhora significativamente a rastreabilidade no sistema.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in qa1

| LeadPk/AccountPk | Caso de Teste | Dados de Teste | Status | Observação |
|------------------|---------------|----------------|--------|-------------|
| 9404/3992 | [Servicing] Selecionar "Do Not Email", preencher o motivo e salvar, validando que o motivo é armazenado corretamente no banco de dados e no log. | - | PASS | - |
| 9404/3992 | [Servicing] Cancelar a edição após selecionar "Do Not Email" e preencher um motivo, garantindo que nenhuma informação seja salva e a checkbox volte ao estado original. | - | PASS | - |
| 9404/3992 | [Servicing] Tentar salvar "Do Not Email" sem motivo e verificar se o sistema exibe a mensagem "Reason is required" e não salva os dados. | - | PASS | - |
| 9404/3992 | [Servicing] Verificar que, quando a seção não está em modo de edição, a checkbox "Do Not Email" permanece desabilitada. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar e desmarcar "Do Not Email" antes de salvar e confirmar que nenhuma alteração é persistida. | - | PASS | - |
| 9404/3992 | [Servicing] Cancelar a edição de "Do Not Email" e confirmar visualmente que a checkbox aparece desmarcada. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Email" e "Do Not Call" com motivos diferentes e confirmar que ambos são salvos corretamente. | - | PASS | - |
| 9404/3992 | [Servicing] Validar que, se o campo "Do Not Email" vier marcado do backend, ele aparece marcado e permite edição. | - | PASS | - |
| 9404/3992 | [Servicing] Desmarcar "Do Not Email" com um motivo previamente salvo, clicar em "Salvar" e verificar que o motivo é removido do banco e do log. | - | PASS | - |
| 9404/3992 | [Origination] Verificar que o campo "Do Not Contact" não é exibido no portal Origination. | - | PASS | - |
| 9404/3992 | [Origination] Editar e selecionar "Do Not Call", preencher um motivo e salvar, validando que o motivo é salvo corretamente. | - | PASS | - |
| 9404/3992 | [Origination] Selecionar "Do Not Call" e cancelar a edição, validando que nenhuma alteração é salva e o campo volta ao estado original. | - | PASS | - |
| 9404/3992 | [Origination] Tentar salvar "Do Not Call" sem fornecer um motivo e confirmar que o sistema bloqueia a ação e exibe "Reason is required". | - | PASS | - |
| 9404/3992 | [Origination] Verificar que, quando a seção não está em modo de edição, o campo "Do Not Call" permanece desabilitado. | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e validar que "Do Not Text" é marcado automaticamente e o campo Reason se torna obrigatório | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call", preencher o motivo e depois cancelar. Garantir que nenhum dado seja salvo e as checkboxes sejam resetadas | - | PASS | - |
| 9404/3992 | [Servicing] Desmarcar "Do Not Text" após selecionar "Do Not Call" e salvar com motivo. Validar persistência correta | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e "Do Not Email" com motivos diferentes e salvar. Confirmar que ambos são salvos corretamente | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar "Do Not Call" e "Do Not Email" e salvar sem desmarcar nenhuma. Validar que ambas permanecem marcadas | - | PASS | - |
| 9404/3992 | [Servicing] Selecionar apenas "Do Not Text", preencher o motivo e salvar. Validar persistência com sucesso | - | PASS | - |


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🇧🇷 Português
Foram realizadas ações manuais no sistema para gerar logs relacionados aos seguintes campos:
doNotCall
doNotText
doNotEmail
uwApprovalAmount
approvalAmount
approvalExpirationDate
paymentDate
paymentAmount
paymentType
Essas ações foram definidas com base nas alterações realizadas durante o desenvolvimento, que introduziram ou ajustaram os logs desses campos. Os logs gerados a partir dessas interações foram comparados diretamente com os registros atualmente presentes em produção.

Todos os logs desses campos estão corretos e seguem o comportamento esperado, de acordo com os novos padrões definidos:
Uma linha por propriedade no log
Suporte a rolagem para logs longos na interface
Aplicação correta do padrão CamelCase nos valores

Durante a validação, também foi identificado que alguns tipos específicos de log — como internal, correspondence e credit card — ainda não seguem o novo padrão implementado. Essa situação já foi registrada na Tarefa 470 e será tratada formalmente por meio da criação de um item de backlog para padronização futura.


-----

### Log Validation Summary

Manual actions were performed in the system to generate logs related to the following fields:

- `doNotCall`  
- `doNotText`  
- `doNotEmail`  
- `uwApprovalAmount`  
- `approvalAmount`  
- `approvalExpirationDate`  
- `paymentDate`  
- `paymentAmount`  
- `paymentType`

These actions were defined based on the changes implemented during development, which introduced or modified logging behavior for these fields. The logs generated by these interactions were directly compared with the records currently present in production.

All logs for these fields are correct and follow the expected behavior, in accordance with the newly defined standards:

- One line per property in the log  
- Scroll support for long logs in the UI  
- Proper application of CamelCase formatting for values

During this validation, it was also identified that some specific log types — such as `internal`, `correspondence`, and `credit card` — are still not aligned with the new logging standard. This issue was previously noted in **Task 470** and will be formally addressed through the creation of a **backlog item** for future standardization.


ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

24027
24035

206396
206325
206326


> ## Tests in stg
> ```gherkin
>
> Manual actions were performed in the system to generate logs related to the following fields:
> - `doNotCall`  
> - `doNotText`  
> - `doNotEmail`  
> - `uwApprovalAmount`  
> - `approvalAmount`  
> - `approvalExpirationDate`  
> - `paymentDate`  
> - `paymentAmount`  
> - `paymentType`
>
> These actions were defined based on the changes implemented during development, which introduced or modified logging behavior for these fields. The logs generated by these interactions were directly compared with the records currently present in production.
> All logs for these fields are correct and follow the expected behavior, in accordance with the newly defined standards:
>
> - One line per property in the log  
> - Scroll support for long logs in the UI  
> - Proper application of CamelCase formatting for values
>
> During this validation, it was also identified that some specific log types — such as `internal`, `correspondence`, and `credit card` — are still not aligned with the new logging standard. This issue was previously noted in **Task 470** and will be formally addressed through the creation of a **backlog item** for future standardization.
> | PASS | LeadPk 24027 and 24035/AccountPk 206396, 206325 and 206326 |
> ```
>

> ## Tests in stg
> ```gherkin
>
>Manual actions were performed in the system to generate logs related to the following fields:
>doNotCall
>doNotText
>doNotEmail
>uwApprovalAmount
>approvalAmount
>approvalExpirationDate
>paymentDate
>paymentAmount
>paymentType
>
>These actions were defined based on the changes implemented during development, which introduced or modified logging behavior for these fields. The logs generated by these interactions were directly compared with the records currently present in production.
>All logs for these fields are correct and follow the expected behavior, in accordance with the newly defined standards:
>
>One line per property in the log  
>Scroll support for long logs in the UI  
>Proper application of CamelCase formatting for values
>| PASS | LeadPk 24027 and 24035 / AccountPk 206396 and 206326 |
>During this validation, it was also identified that some specific log types — such as `internal`, `correspondence`, and `credit card` — are still not aligned with the new logging standard. This issue was previously noted in **Task 470** and will be formally addressed through the creation of a **backlog item** for future standardization.
> ```
>


![369-stg-24027-_1_](/uploads/147d67b22d552f1e3eb4a281668c81db/369-stg-24027-_1_.png){width=1428 height=661}![369-stg-24035-_1_](/uploads/d72332efd9b897db4e8e8f45cb38d643/369-stg-24035-_1_.png){width=1428 height=747}![369-stg-206326-_1_](/uploads/91aa5bdb873199b1e005aae5bd3a4775/369-stg-206326-_1_.png){width=1428 height=747}![369-stg-206326-_2_](/uploads/c4326874a22fe9a04404d7128485435b/369-stg-206326-_2_.png){width=1428 height=747}![369-stg-206396-_1_](/uploads/f24375e820b1fa3ca88aec7f59e449f1/369-stg-206396-_1_.png){width=1428 height=747}
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------