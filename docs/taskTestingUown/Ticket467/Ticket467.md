------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/467

UOWN | Servicing | Add “Out of Business” and “Compliance Close” to Merchant Termination Reason Dropdown

Synopsis
it was identified that the current dropdown list for merchant termination reasons is lacking specific and useful categorizations. 
Two new reasons— “Out of Business” and “Compliance close”—were proposed to be added to improve clarity and consistency in reporting and internal tracking.

Business Objective
To provide more precise and actionable termination reasons that improve data integrity, auditability, and reporting. These new options will allow internal 
teams to better track why merchant relationships were ended and support downstream processes such as compliance reviews and performance analysis.

Feature Request | Business Requirements
Extend the termination reason dropdown on the Merchant page to include:
    Out of Business
    Compliance Close
Validate that the new values are compatible with any existing backend logic or filters using termination reason codes.

Marcos Silvano
test instructions:
Terminated merchants must include two termination reasons, those options must be persisted successfully.

-----
UOWN | Servicing | Adicionar “Fora de Atividade” e “Encerramento por Conformidade” ao menu suspenso de Motivos de Término de Comerciante

Sinopse
Identificou-se que a lista atual de motivos de término de relacionamento com o comerciante não inclui certas categorias específicas e úteis. Foram propostas duas novas opções — “Fora de Atividade” e “Encerramento por Conformidade” — para melhorar a clareza e a consistência nos relatórios e no acompanhamento interno.

Objetivo de Negócio
Fornecer motivos de término mais precisos e acionáveis, capazes de aprimorar a integridade dos dados, a auditabilidade e a qualidade dos relatórios. Essas novas opções permitirão às equipes internas acompanhar melhor por que o relacionamento com cada comerciante foi encerrado e darão suporte a processos subsequentes, como revisões de conformidade e análises de desempenho.

Requisição de Funcionalidade | Requisitos de Negócio
Estender o menu suspenso de motivos de término na página do comerciante para incluir:

Fora de Atividade

Encerramento por Conformidade

Validar que os novos valores sejam compatíveis com qualquer lógica de backend ou filtros existentes que usem códigos de motivo de término.

Marcos Silvano

Instruções de teste:
Os comerciantes encerrados devem apresentar dois motivos de término; essas opções devem ser gravadas com sucesso.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se ao selecionar motivo de encerramento “Out of Business”, a ação é registrada nos logs e armazenada no banco de dados.
Verify that when selecting the termination reason “Out of Business,” the action is logged and stored in the database.

Verificar se ao selecionar motivo de encerramento “Compliance close”, a ação é registrada nos logs e armazenada no banco de dados.
Verify that when selecting the termination reason “Compliance close,” the action is logged and stored in the database.

Verificar se ao cadastrar novo comerciante clonando, os dois motivos de encerramento são exibidos.
Verify that when creating a new merchant by cloning, both termination reasons are displayed.

-----

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when selecting the termination reason “Out of Business,” the action is logged and stored in the database. |  | PASS |
| Verify that when selecting the termination reason “Compliance close,” the action is logged and stored in the database. |  | PASS |
| Verify that when creating a new merchant by cloning, both termination reasons are displayed. |  | PASS |

-----

Tests in qa2

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when selecting the termination reason “Out of Business,” the action is logged and stored in the database. | ![qa2-467-c1_1_](/uploads/04d95a5921a265bf7ce957b0d6c033b6/qa2-467-c1_1_.png){width=1017 height=746}![qa2-467-c1_2_](/uploads/e90e095aefc7fd99ddd5eb70b01089a4/qa2-467-c1_2_.png){width=1439 height=746}![qa2-467-c1_3_](/uploads/78ef37fdf039613c165a6ee0b086073d/qa2-467-c1_3_.png){width=1439 height=746}![qa2-467-c1_4_](/uploads/0e5889c1dc32049139df7317339c25fd/qa2-467-c1_4_.png){width=1170 height=38}![qa2-467-c1_5_](/uploads/ea503df9b27e73360603ba72e07dd408/qa2-467-c1_5_.png){width=1118 height=727}![qa2-467-c1_6_](/uploads/b44602f408c350d7450791fd90409394/qa2-467-c1_6_.png){width=980 height=747}![qa2-467-c1_7_](/uploads/60c9a48b296753f8921fed76e718b1c6/qa2-467-c1_7_.png){width=1434 height=747}![qa2-467-c1_8_](/uploads/dad7addb31e41fba875cab2c25c2a96a/qa2-467-c1_8_.png){width=1170 height=57}![qa2-467-c1_9_](/uploads/d229e048b89659358fba5a9ad584a57d/qa2-467-c1_9_.png){width=982 height=744}![qa2-467-c1_10_](/uploads/53d10d13379096fca6e17ae9bb1689bb/qa2-467-c1_10_.png){width=1117 height=715} | PASS |
| Verify that when selecting the termination reason “Compliance close,” the action is logged and stored in the database. | ![qa2-467-c2_1_](/uploads/87e638c67f33ffe3b23974edcbeaad96/qa2-467-c2_1_.png){width=981 height=744}![qa2-467-c2_2_](/uploads/3fec31b5563157bc1a6ee8d77bca91fd/qa2-467-c2_2_.png){width=1439 height=744}![qa2-467-c2_3_](/uploads/87b773cf03ceef93516dec5ddfd6a136/qa2-467-c2_3_.png){width=1439 height=744}![qa2-467-c2_4_](/uploads/377979ef62697e20d05477f2009e7fa3/qa2-467-c2_4_.png){width=1170 height=63}![qa2-467-c2_5_](/uploads/1844309cc66b0b3955a41ab3b4442252/qa2-467-c2_5_.png){width=1118 height=722}![qa2-467-c2_6_](/uploads/e86edb80cfda4efbaa28ddac66666662/qa2-467-c2_6_.png){width=982 height=743}![qa2-467-c2_7_](/uploads/d026fe43fb61b820dfe20f3338a1499b/qa2-467-c2_7_.png){width=1440 height=743}![qa2-467-c2_8_](/uploads/65723f84ac8594465a7e33d947a8d870/qa2-467-c2_8_.png){width=1440 height=743}![qa2-467-c2_9_](/uploads/6edccbc7ac70555bf10def01246cc38c/qa2-467-c2_9_.png){width=1170 height=57}![qa2-467-c2_10_](/uploads/a205ca59d263f52044310cfbf8ba4ff0/qa2-467-c2_10_.png){width=1128 height=717} | PASS |
| Verify that when creating a new merchant by cloning, both termination reasons are displayed. | ![qa2-467-c3_1_](/uploads/8010597d177e70b821e204b2d2985f7e/qa2-467-c3_1_.png){width=981 height=743}![qa2-467-c3_2_](/uploads/d29eb79fb60ea8e408a5ae4aa201226f/qa2-467-c3_2_.png){width=981 height=743}![qa2-467-c3_3_](/uploads/f7ff680d0306c9728c348ead5475af50/qa2-467-c3_3_.png){width=1167 height=60} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| Verify that when selecting the termination reason “Out of Business,” the action is logged and stored in the database. |  | PASS |
| Verify that when selecting the termination reason “Compliance close,” the action is logged and stored in the database. |  | PASS |
| Verify that when creating a new merchant by cloning, both termination reasons are displayed. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------