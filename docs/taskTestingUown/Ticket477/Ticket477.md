[Ticket477](https://gitlab.com/uown/frontend/servicing/-/issues/477)


UOWN | Servicing | Data-Change Logs Incorrectly Set as Priority = True
Aberto
  Tíquete criado 2 horas atrás por Yuri Araujo
Aberto
UOWN | Servicing | Data-Change Logs Incorrectly Set as Priority = True
BUG
It was identified that all logs of type DATA_CHANGE are being automatically created with the field priority = true by default.

FIX
Investigate where the priority flag is being assigned during DATA_CHANGE log creation.
Remove the default behavior that sets priority = true for all DATA_CHANGE logs.
Screenshot(s)
![alt text](image.png)

Steps-to-Reproduce
List the steps required to verify the implemented feature

Attachment(s)
{+Attach any document that will help to identify the BUG}

Editado 2 horas atrás por Yuri Araujo
Atributos
Status
To do
Responsáveis
avatar
Davi Artur
Etiquetas
BUG
lowers
dev
full-stack
priority
high
workflow
qa-in-process
Principal
Uown | RU09.25.1.45.0
Peso
Nenhum
Marco
Uown | RU10.25.1.45.0
Iteração
Nenhum
Datas
Iniciar: Nenhum

Verde-azulado: Nenhum

Rastreamento de tempo
Adicione uma  ou o .
2 participantes
Davi Artur
Yuri Araujo
Itens secundários
0

Nenhum item filho está atribuído no momento. Use itens filhos para dividir o trabalho em partes menores.
Itens vinculados
0
Vincule itens para mostrar que eles estão relacionados ou que um está bloqueando outros.
Desenvolvimento
1
[/uown/frontend/servicing#477] fix: set default priority value to false
common
!124
Mesclado
Davi Artur
Atividade
Yuri Araujo set status to To do 2 horas atrás
Yuri Araujo added uown#10 as parent epic 2 horas atrás
Yuri Araujo changed milestone to %Uown | RU10.25.1.45.0 2 horas atrás
Yuri Araujo added 
BUG
lowers
 
dev
full-stack
 
priority
high
 labels 2 horas atrás
Yuri Araujo assigned to @davi.artur.gow 2 horas atrás
Yuri Araujo changed the description 2 horas atrás · 
Davi Artur mentioned in merge request uown/backend/common!124 (merged) 2 horas atrás
Davi Artur added 
workflow
ready-for-qa
 label 57 minutos atrás
jose mendes added 
workflow
qa-in-process
 label and removed 
workflow
ready-for-qa
 label 1 minuto atrás



The priority flag is not activated in the log generated when users make payments



> ## Tests in qa2

> ```gherkin

> **The priority flag is not activated in the log generated when users make payments**

> !

> **| PASS |**
> ```

---
