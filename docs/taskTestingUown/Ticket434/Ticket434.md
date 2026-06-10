---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/434

UOWN | SERVICING | Adjust Summary Bar height to avoid vertical scrolling on smaller screens

Synopsis

In the Servicing, when accessing an Account, the Summary Bar (the colored bar displaying key account information) presents usability issues on smaller screen resolutions.
In these cases, the Summary Bar shows both vertical and horizontal scrolling, causing partial vertical content cutoff and resulting in a very small and visually unpleasant vertical scrollbar.


        
      Increase Summary Bar vertical size to accommodate its content

        
      Remove internal vertical scrolling

        
      Preserve horizontal scrolling only when content exceeds screen width

        
      Do not change displayed data, only its visual presentation



![alt text](image.png)

Behavior and Expectations

Current Behavior
User accesses an Account in Servicing
On smaller screens:
Summary Bar displays both vertical and horizontal scrolling
Some information is vertically cut off
Vertical scrollbar is very small and difficult to use
This negatively impacts readability and usability

Expected Behavior
The Summary Bar should have sufficient height to:
Display all information vertically without cutoffs
On smaller screens:
Only horizontal scrolling should be present if needed
No vertical scrolling should occur within the Summary Bar
All data should remain fully visible

Testing Steps
Confirm that the roll bar no longer appears on servicing summary bar vertically
before:
![alt text](image-1.png)

after:
![alt text](image-2.png)

---------------------------------------------------------------------------------------------------------------------------------------------------------

**UOWN | SERVICING | Ajustar a altura da Summary Bar para evitar rolagem vertical em telas menores**

**Sinopse**

No módulo Servicing, ao acessar uma Conta, a Summary Bar (a barra colorida que exibe as principais informações da conta) apresenta problemas de usabilidade em resoluções de tela menores.
Nesses casos, a Summary Bar exibe rolagem vertical e horizontal, causando corte parcial do conteúdo na vertical e resultando em uma barra de rolagem vertical muito pequena e visualmente desagradável.

**Objetivos**

* Aumentar a altura vertical da Summary Bar para acomodar todo o conteúdo
* Remover a rolagem vertical interna
* Manter apenas a rolagem horizontal quando o conteúdo exceder a largura da tela
* Não alterar os dados exibidos, apenas a apresentação visual

**Comportamento e Expectativas**

**Comportamento Atual**

* O usuário acessa uma Conta no Servicing
* Em telas menores:

  * A Summary Bar exibe rolagem vertical e horizontal
  * Algumas informações ficam cortadas verticalmente
  * A barra de rolagem vertical é muito pequena e difícil de usar
  * Isso impacta negativamente a legibilidade e a usabilidade

**Comportamento Esperado**

* A Summary Bar deve ter altura suficiente para:

  * Exibir todas as informações verticalmente, sem cortes
* Em telas menores:

  * Apenas a rolagem horizontal deve existir, se necessário
  * Não deve ocorrer rolagem vertical dentro da Summary Bar
  * Todos os dados devem permanecer totalmente visíveis

**Passos de Teste**

* Confirmar que a barra de rolagem vertical não aparece mais na Summary Bar do Servicing

**Antes:**
![alt text](image-1.png)

**Depois:**
![alt text](image-2.png)


---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev

Comparar
e
 1 arquivo
+
2
−
0
 components/account-summary/index.module.scss 
+
2
−
0

Visualizado
@@ -7,9 +7,11 @@
  height: 65px;
  width: 100%;
  z-index: 1048;
  overflow: hidden;

  &__container {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
  }

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Esquema do Cenário: Exibição correta da Summary Bar em diferentes resoluções

**Dado** que o usuário acessa a página **Customer Information** no Servicing
**E** que a aplicação está na resolução `<largura>x<altura>`
**Quando** a Summary Bar é exibida
**Então** todo o conteúdo fica visível sem rolagem vertical
**E** a rolagem horizontal ocorre apenas quando necessária
**E** os dados e as interações permanecem inalterados

---

### Exemplos:
| largura | altura |
| ------: | -----: |
|    1920 |   1080 |
|    1600 |    900 |
|    1440 |    900 |
|    1366 |    768 |
|    1280 |    720 |
|    1024 |    768 |
|     320 |    568 |(IPhone 5)
|     375 |    812 |(IPhone X)
|     800 |   1280 |(Nexus 10)
|    1024 |   1366 |(IPad Pro)
|     768 |   1024 |(IPad)
|     390 |    844 |(IPhone 12)

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa2

---
### Scenario Outline: Correct display of the Summary Bar across different screen resolutions
```markdown
- **Given** the user accesses the **Customer Information** page in Servicing  
- **And** the application is displayed at the `<width>x<height>` resolution  
- **When** the Summary Bar is rendered  
- **Then** all content is visible without vertical scrolling  
- **And** horizontal scrolling occurs only when necessary  
- **And** displayed data and interactions remain unchanged  

### Examples:
| width | height |
|------:|-------:|
| 1920  | 1080   |
| 1600  | 900    |
| 1440  | 900    |
| 1366  | 768    |
| 1280  | 720    |
| 1024  | 768    |
| 320   | 568    | (iPhone 5)
| 375   | 812    | (iPhone X)
| 800   | 1280   | (Nexus 10)
| 1024  | 1366   | (iPad Pro)
| 768   | 1024   | (iPad)
| 390   | 844    | (iPhone 12)

---
```

---------------------------------------------------------------------------------------------------------------------------------------------------------