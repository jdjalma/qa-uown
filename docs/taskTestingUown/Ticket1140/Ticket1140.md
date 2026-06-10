---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.46.0

https://gitlab.com/uown/frontend/origination/-/issues/1140

UOWN | Origination | Add Visual Color Distinction Between System and User-Created Internal Notes


Synopsis
Across the system, several tables display Notes and Logs, both in Origination and Servicing.
Currently, Internal Notes are visually identified by the color red, regardless of whether they were created by the System or a human user.
This makes it difficult for users to distinguish between automated and manually added notes.
To improve clarity and usability, a color distinction must be introduced for Internal Notes created by users.


Business Objective
By differentiating the colors of Internal Notes based on their origin, users will be able to:
    Instantly identify whether an Internal Note was generated automatically or manually;
    Reduce confusion during support, monitoring, and review processes;
    Improve efficiency when scanning through long lists of logs and notes.


Feature Request | Business Requirements
Implement this update in both Origination and Servicing modules.
Maintain the existing red color for System-generated Internal Notes.
Apply the new color blue (#2253A4) for user-created Internal Notes.
Ensure the color distinction is visible in all tables or sections where Notes and Logs are displayed.
No color or behavior changes should be applied to regular (non-internal) notes or logs.


![alt text](image.png)


Testing Steps
Confirm that now:
the user's internal notes have a distinct blue color
system internal notes remain red
normal user notes are still black

![alt text](image-1.png)

-----

## R7.1.25.46.0

**Tarefa:** [UOWN | Origination | Add Visual Color Distinction Between System and User-Created Internal Notes](https://gitlab.com/uown/frontend/origination/-/issues/1140)

---

### Sinopse

Em todo o sistema, várias tabelas exibem **Notas** e **Logs**, tanto no **Origination** quanto no **Servicing**.
Atualmente, as **Notas Internas** são identificadas visualmente pela cor **vermelha**, independentemente de terem sido criadas pelo **Sistema** ou por um **usuário humano**.
Isso dificulta que os usuários distingam entre notas automáticas e notas adicionadas manualmente.

Para melhorar a **clareza** e a **usabilidade**, deve ser introduzida uma distinção visual de cores para as **Notas Internas criadas por usuários**.

---

### Objetivo de Negócio

Ao diferenciar as cores das Notas Internas com base em sua origem, os usuários poderão:

* Identificar instantaneamente se uma nota interna foi gerada automaticamente ou manualmente;
* Reduzir a confusão durante os processos de suporte, monitoramento e revisão;
* Melhorar a eficiência ao percorrer longas listas de logs e notas.

---

### Requisitos de Negócio | Feature Request

* Implementar essa atualização nos módulos **Origination** e **Servicing**.
* **Manter a cor vermelha** para Notas Internas geradas pelo sistema.
* **Aplicar a nova cor azul** (`#2253A4`) para Notas Internas criadas por usuários.
* Garantir que a distinção de cores esteja visível em todas as tabelas ou seções onde **Notas e Logs** são exibidos.
* Nenhuma alteração de cor ou comportamento deve ser aplicada a notas ou logs regulares (não internos).

![alt text](image-2.png)

---

### Passos de Teste

Verifique que agora:

* As notas internas criadas por **usuários** têm uma cor **azul distinta**;
* As notas internas geradas pelo **sistema** permanecem **vermelhas**;
* As notas **usuário normais** continuam sendo exibidas em **preto**.

---



---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


Comparar
e
 2 arquivos
+
5
−
5
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 package.json 
+
1
−
1

Visualizado
@@ -30,7 +30,7 @@
    "@seontechnologies/seon-id-verification": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.380",
    "@uownleasing/common-ui": "0.0.382",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1660,10 +1660,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.380":
  version "0.0.380"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.380.tgz#51f3b8bca94e3468c6d2672a15addb8bcf396892"
  integrity sha512-MP5ecc/GrmCxRKVsQeqHbSjebMKu4Bvxn3yjKdfs5A0JMeYaSXMMt+xrJHtGeI75z3ZzGCGCNbUnaVo1NtLLpw==
"@uownleasing/common-ui@0.0.382":
  version "0.0.382"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.382.tgz#f9657b729395642541c71989ab7be3fd76eac00c"
  integrity sha512-cENzKNaxnFrsKFHgHepjcFlGgSehTNzftMWEfOtq92kz3zmw3luvhpWno+UjxIlnwzWtt2vG1Hk8mOJIykCMCA==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---


 2 arquivos
+
11
−
2
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src/lib/layouts/collap
‎sable-edit/activity-log‎

inde
‎x.tsx‎
+10 -1

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/layouts/collapsable-edit/activity-log/index.tsx 
+
10
−
1

Visualizado
@@ -33,11 +33,20 @@ import { faBookmark } from '@fortawesome/free-solid-svg-icons';
const conditionalActivityLogTableStyles = [
  {
    when: (row: ActivityLog) =>
      (row?.activityLogInfo?.logType || '') === 'INTERNAL',
      (row?.activityLogInfo?.logType || '') === 'INTERNAL' &&
      (row?.activityLogInfo?.createdBy || '').toUpperCase() === 'SYSTEM',
    style: {
      color: '#e50000',
    },
  },
  {
    when: (row: ActivityLog) =>
      (row?.activityLogInfo?.logType || '') === 'INTERNAL' &&
      (row?.activityLogInfo?.createdBy || '').toUpperCase() !== 'SYSTEM',
    style: {
      color: '#2253A4',
    },
  },
];

const activityLogTableColumns: (
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.381",
  "version": "0.0.382",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




Ao visualizar notas internas criadas por usuários (createdBy diferente de "SYSTEM") na tabela de atividades do Origination e Servicing, o usuário deve ver a cor azul (#2253A4) para distingui-las das notas do sistema
When viewing user-created internal notes (createdBy different from "SYSTEM") in the activity table of Origination and Servicing, the user should see the color blue (#2253A4) to distinguish them from system notes

Ao visualizar notas internas geradas pelo sistema (createdBy igual a "SYSTEM") na tabela de atividades do Origination e Servicing, o usuário deve ver a cor vermelha (#e50000) mantendo a identificação original
When viewing system-generated internal notes (createdBy equal to "SYSTEM") in the activity table of Origination and Servicing, the user should see the color red (#e50000), maintaining the original identification

Ao visualizar notas regulares (não internas) criadas por usuários na tabela de atividades, o usuário deve ver a cor preta sem aplicação de cor de destaque, e a distinção de cores deve estar consistentemente aplicada em todas as tabelas ou seções onde notas e logs são exibidos no Origination e Servicing
When viewing regular (non-internal) notes created by users in the activity table, the user should see the color black without any highlighting, and the color distinction should be consistently applied across all tables or sections where notes and logs are displayed in Origination and Servicing

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in qa1

> ```gherkin

> **When viewing user-created internal notes (createdBy different from "SYSTEM") in the activity table of Origination and Servicing, the user should see the color blue (rgb(34, 83, 164)) to distinguish them from system notes**

> ![Screenshot_at_Nov_03_09-30-35](/uploads/8d5be362b00af250fcdb340ef835d2ba/Screenshot_at_Nov_03_09-30-35.png){width=1882 height=962}
> ![Screenshot_at_Nov_03_09-34-56](/uploads/878b4e8f694fff28e63fc4482b5ba897/Screenshot_at_Nov_03_09-34-56.png){width=1717 height=248}
> ![Screenshot_at_Nov_03_10-00-33](/uploads/4b0c3237884b97e250e8909a7d2e6360/Screenshot_at_Nov_03_10-00-33.png){width=1912 height=950}
> ![Screenshot_at_Nov_03_10-20-37](/uploads/e3f151da3acd37e9bc88f21901454450/Screenshot_at_Nov_03_10-20-37.png){width=1908 height=407}
> ![Screenshot_at_Nov_03_16-47-37](/uploads/d79581e7e39b19be834f77d5be2a5072/Screenshot_at_Nov_03_16-47-37.png){width=1916 height=670}
> ![Screenshot_at_Nov_03_16-49-56](/uploads/29e2cadca1e887cbff34801320e98bc7/Screenshot_at_Nov_03_16-49-56.png){width=1323 height=946}
> ![Screenshot_at_Nov_03_16-56-55](/uploads/dede93d482953d40a6033c52339915ee/Screenshot_at_Nov_03_16-56-55.png){width=1908 height=941}
> ![Screenshot_at_Nov_03_16-59-22](/uploads/84c6a35b158f3498179ae85313d80fcc/Screenshot_at_Nov_03_16-59-22.png){width=1739 height=245}

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing system-generated internal notes (createdBy equal to "SYSTEM") in the activity table of Origination and Servicing, the user should see the color red (rgb(229, 0, 0)), maintaining the original identification**

> ![image](/uploads/2cb7c2ca8bb13a8af8a9c6f76f118cf6/image.png){width=1715 height=436}
> ![image](/uploads/26f7abda5dfb119524a921cfa95f1157/image.png){width=1426 height=97}
> ![image](/uploads/d74ce54f05738afa7b5b782981aef3fb/image.png){width=1479 height=150}

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing regular (non-internal) notes created by users in the activity table, the user should see the color black without any highlighting, and the color distinction should be consistently applied across all tables or sections where notes and logs are displayed in Origination and Servicing**

> ![image](/uploads/2ab5c9f00b234405237f3848fe129479/image.png){width=1885 height=937}
> ![Screenshot_at_Nov_03_09-39-06](/uploads/14076ddb2378bac4617f8db912898d7f/Screenshot_at_Nov_03_09-39-06.png){width=1882 height=965}
> ![Screenshot_at_Nov_03_10-23-57](/uploads/77cf471573ed168a2f2f7398822fa3e7/Screenshot_at_Nov_03_10-23-57.png){width=1456 height=667}
> ![Screenshot_at_Nov_03_10-26-36](/uploads/b65316e59d0605cff6b6178432b9fe38/Screenshot_at_Nov_03_10-26-36.png){width=1458 height=436}
> ![Screenshot_at_Nov_03_17-00-50](/uploads/5b154d3c5a1a1021a7bee1b8330ca2a5/Screenshot_at_Nov_03_17-00-50.png){width=1042 height=636}
> ![Screenshot_at_Nov_03_17-01-21](/uploads/beabc08c018fdf246e170e721002dab5/Screenshot_at_Nov_03_17-01-21.png){width=1390 height=322}

> **| PASS |**
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in stg

> ```gherkin

> **When viewing user-created internal notes (createdBy different from "SYSTEM") in the activity table of Origination and Servicing, the user should see the color blue (rgb(34, 83, 164)) to distinguish them from system notes**

> ![Screenshot_at_Nov_16_16-08-19](/uploads/e31006d7883f8b3fc681fae2dc67059d/Screenshot_at_Nov_16_16-08-19.png){width=900 height=437}
![Screenshot_at_Nov_16_16-14-19](/uploads/65ce943286689b2a9192931daf3694a7/Screenshot_at_Nov_16_16-14-19.png){width=900 height=101}
![Screenshot_at_Nov_16_16-14-58](/uploads/9d371c450f3a96639aba2de5ac74b1f5/Screenshot_at_Nov_16_16-14-58.png){width=900 height=122}
![Screenshot_at_Nov_16_16-16-49](/uploads/d7cb5ed024daae971d3bfc28b7353b5f/Screenshot_at_Nov_16_16-16-49.png){width=900 height=38}
![Screenshot_at_Nov_16_16-17-12](/uploads/1b11b6f0fd31ee78e519437da9b244c1/Screenshot_at_Nov_16_16-17-12.png){width=900 height=76}
![Screenshot_at_Nov_16_16-19-12](/uploads/d6115574c0dca9fc99faea0626f64614/Screenshot_at_Nov_16_16-19-12.png){width=900 height=90}
![Screenshot_at_Nov_16_16-20-02](/uploads/8dfa4e5726c30ca77579c1f1ab8ebae7/Screenshot_at_Nov_16_16-20-02.png){width=900 height=90}

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing system-generated internal notes (createdBy equal to "SYSTEM") in the activity table of Origination and Servicing, the user should see the color red (rgb(229, 0, 0)), maintaining the original identification**

> ![Screenshot_at_Nov_16_16-10-28](/uploads/e157f071cea6912428f84de373329c61/Screenshot_at_Nov_16_16-10-28.png){width=900 height=125}
> ![Screenshot_at_Nov_16_16-11-35](/uploads/a68ddfbc7a3a1cac115c441e094c7f1e/Screenshot_at_Nov_16_16-11-35.png){width=900 height=155}
> ![Screenshot_at_Nov_16_16-11-35](/uploads/e496aaa7755f8f14605e7b349abfb3ad/Screenshot_at_Nov_16_16-11-35.png){width=900 height=155}
> ![Screenshot_at_Nov_16_16-22-02](/uploads/f6d5ce136e3f134165c33f2807a175d2/Screenshot_at_Nov_16_16-22-02.png){width=900 height=38}
> ![Screenshot_at_Nov_16_16-22-57](/uploads/5a4320159a69767bb8a60914b6d16672/Screenshot_at_Nov_16_16-22-57.png){width=900 height=96}
> ![Screenshot_at_Nov_16_16-23-29](/uploads/20993780edf92f5245313d0ad678d87e/Screenshot_at_Nov_16_16-23-29.png){width=900 height=32}
> ![Screenshot_at_Nov_16_16-24-29](/uploads/7dec85edd4e0d892446aa3da57ad267c/Screenshot_at_Nov_16_16-24-29.png){width=900 height=92}
> ![Screenshot_at_Nov_16_16-24-55](/uploads/8e51cc7e693e54d170e40e588235b1c1/Screenshot_at_Nov_16_16-24-55.png){width=900 height=37}

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing regular (non-internal) notes created by users in the activity table, the user should see the color black without any highlighting, and the color distinction should be consistently applied across all tables or sections where notes and logs are displayed in Origination and Servicing**

> ![image](/uploads/ea6a1587cbe108c8c4188ecfe477ab3f/image.png){width=900 height=448}
> ![image](/uploads/64aab8508c0b3579745ecb92361a4b63/image.png){width=900 height=517}
> ![image](/uploads/8d4c5798c4807f654c31a43a48c16f67/image.png){width=900 height=45}

> **| PASS |**
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------