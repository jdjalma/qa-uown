---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/ams-website/-/issues/72

UOWN | AMS | Log ordering still incorrect in AMS


BUG
It was identified that log ordering in AMS has not yet been resolved.
Although the ordering fix was successfully applied to other portals, the same correction was not reflected in AMS, and logs continue to be displayed incorrectly.
This creates inconsistency across portals and compromises the reliability of log visualization in AMS.

FIX
Review and fix log ordering in AMS, ensuring the same correct behavior already applied to other portals is also implemented in this module.
Current Behavior
    * Logs in AMS are still displayed out of correct chronological order        
    * Behavior differs from other portals where the issue was fixed
    * Ordering is not reliable for reading and auditing

Expected Behavior
    * AMS should follow the same log ordering standard already applied in other portals        
    * Logs must be displayed in the correct chronological order
    * Behavior should be consistent and predictable

Tests Steps:
test the logs display order.
![alt text](image.png)
Also, validate:
    * You're still able to create/unlock users
    * Assing/Remomo permissions
    * Update password

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

### UOWN | AMS | Ordenação de logs ainda incorreta no AMS

**BUG**
Foi identificado que a ordenação dos logs no AMS ainda não foi resolvida.
Embora a correção de ordenação tenha sido aplicada com sucesso em outros portais, a mesma correção não foi refletida no AMS, e os logs continuam sendo exibidos de forma incorreta.
Isso gera inconsistência entre os portais e compromete a confiabilidade da visualização de logs no AMS.

**FIX**
Revisar e corrigir a ordenação dos logs no AMS, garantindo que o mesmo comportamento correto já aplicado em outros portais também seja implementado neste módulo.

**Comportamento Atual**

- Os logs no AMS ainda são exibidos fora da ordem cronológica correta
- O comportamento difere de outros portais onde o problema já foi corrigido
- A ordenação não é confiável para leitura e auditoria

**Comportamento Esperado**

- O AMS deve seguir o mesmo padrão de ordenação de logs já aplicado nos outros portais
- Os logs devem ser exibidos na ordem cronológica correta
- O comportamento deve ser consistente e previsível

**Passos de Teste**

- Testar a ordem de exibição dos logs
  ![alt text](image.png)

Além disso, validar:

- Ainda é possível criar e desbloquear usuários
- Atribuir e remover permissões
- Atualizar senha

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

---
### Scenário Outline 1: de Ordenação

Scenario Outline: Ordenar logs por coluna disponível
When o usuário ordena os logs pela coluna "<coluna>"
Then os logs devem ser exibidos em ordem cronológica correta
And a ordenação deve ser consistente com o padrão aplicado nos outros portais

Examples:
| coluna |
| Data |
| Tipo |
| UserID |
| Notes |

---
### Scenário Outline 2: de Filtro com Validação de Ordenação

Scenario Outline: Filtrar logs e validar ordenação dos resultados
When o usuário aplica o filtro por "<filtro>" com o valor "<valor>"
Then apenas logs correspondentes ao filtro aplicado devem ser exibidos
And os logs filtrados devem estar em ordem cronológica correta

Examples:
| filtro | valor |
| UserID | manager |
| Log Activity | permission, role, info |
| Notes | permissions |

Scenario: Aplicar múltiplos filtros e validar ordenação
When o usuário filtra logs por UserID, Tipo e Notes simultaneamente
Then apenas logs que atendem a todos os filtros devem ser exibidos
And os logs filtrados devem estar em ordem cronológica correta

---
### Scenário Outline 3: de Paginação com Ordenação

Scenario Outline: Alterar quantidade de registros exibidos e validar ordenação
When o usuário seleciona a opção de exibir "<quantidade>" registros por página
Then a quantidade correta de logs deve ser exibida
And os logs devem estar em ordem cronológica correta

Examples:
| quantidade |
| 20 |
| 30 |

---
### Scenário Outline 4: de Ações no Módulo Users com Validação de Logs

Scenario Outline: Executar ação no módulo Users e validar log gerado
Given que o usuário acessa a página Users
When o usuário executa a ação "<acao>"
Then a ação deve ser concluída com sucesso
And um log correspondente à ação deve ser registrado
And os logs devem ser exibidos em ordem cronológica correta

Examples:
| acao | user |
| criar usuário | log.validator |
| desbloquear usuário | log.validator |
| atribuir permissão | log.validator |
| remover permissão | log.validator |
| atualizar senha | log.validator |

---
### Scenário Outline 5: de Consistência com Outros Portais

Scenario: Validar consistência da ordenação de logs entre AMS e outros portais
When os logs do AMS são comparados com logs de outros portais
Then o padrão de ordenação deve ser o mesmo
And os logs no AMS devem estar em ordem cronológica correta

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario 1: Sort logs by available column
```markdown
- When the user sorts the logs by the "<column>" column
- Then the logs should be displayed in the correct chronological order
- And the sorting must be consistent with the standard applied in other portals
```

Screenshot

**PASS**

---
### Scenario 2: Filter logs and validate result ordering
```markdown
- When the user applies the filter "<filter>" with the value "<value>"
- Then only logs matching the applied filter should be displayed
- And the filtered logs must be in the correct chronological order
```

Screenshot

**PASS**

---
### Scenario 3: Apply multiple filters and validate ordering
```markdown
- When the user filters logs by UserID, Type, and Notes simultaneously
- Then only logs that match all applied filters should be displayed
- And the filtered logs must be in the correct chronological order
```

Screenshot

**PASS**

---
### Scenario 4: Change number of displayed records and validate ordering
```markdown
- When the user selects the option to display "<quantity>" records per page
- Then the correct number of logs should be displayed
- And the logs must be in the correct chronological order
```

Screenshot

**PASS**

---
### Scenario 5: Execute action in Users module and validate generated log
```markdown
- Given the user accesses the Users page
- When the user performs the "<action>" action
- Then the action should be completed successfully
- And a log corresponding to the action should be recorded
- And the logs must be displayed in the correct chronological order
```

Screenshot

**PASS**

---
### Scenario 6: Validate log sorting consistency between AMS and other portals
```markdown
- When AMS logs are compared with logs from other portals
- Then the sorting standard must be the same
- And the logs in AMS must be in the correct chronological order
```

Screenshot

**PASS**

---
