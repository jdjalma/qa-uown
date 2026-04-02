--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1184

```markdown
# 🇺🇸 English

## UOWN | Origination | Fix Activity Log Parsing for Comma-Separated Notes

**Status:** Open  
**Ticket created:** 2 weeks ago  
**Created by:** Fernando Martins  

### Synopsis
Fix an activity log parsing issue where **comma-separated values** in **General Notes** are incorrectly split.  
This behavior results in **malformed log entries**, including records showing values as `undefined`.

### Current Issue
When a user inserts text containing commas in the *General Notes* field, the system:
- Splits the content by commas
- Attempts to parse each fragment as a separate change
- Generates incorrect logs such as:
  - `"changed from X to undefined"`

This leads to misleading and noisy activity logs.

### Expected Behavior
- Commas inside General Notes should be treated as **plain text**
- The activity log should register **one coherent update**
- No `undefined` values should appear

### Testing Steps
1. Access **Origination**.
2. Edit a record and add **General Notes** containing commas.
3. Save the changes.
4. Verify the activity log:
   - ✅ A single, clear log entry is created
   - ❌ No `"changed from X to undefined"` messages appear
   - ✅ The full note text is properly displayed

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 Português

## UOWN | Origination | Correção do Parsing do Log de Atividades para Notas com Vírgula

**Status:** Aberto  
**Tíquete criado:** há 2 semanas  
**Criado por:** Fernando Martins  

### Sinopse
Corrigir um problema no log de atividades em que **valores separados por vírgula** nas **Notas Gerais** são divididos incorretamente.  
Esse comportamento gera **logs malformados**, incluindo registros com valores `undefined`.

### Problema Atual
Quando o usuário insere texto com vírgulas no campo *General Notes*, o sistema:
- Divide o texto pelas vírgulas
- Tenta interpretar cada parte como uma alteração distinta
- Gera logs incorretos como:
  - `"changed from X to undefined"`

Isso polui o log e dificulta auditoria e rastreabilidade.

### Comportamento Esperado
- Vírgulas dentro das Notas Gerais devem ser tratadas como **texto normal**
- O log deve registrar **uma única atualização coerente**
- Nenhum valor `undefined` deve aparecer

### Passos de Teste
1. Acesse o **Origination**.
2. Edite um registro e inclua **Notas Gerais** contendo vírgulas.
3. Salve as alterações.
4. Valide o log de atividades:
   - ✅ Apenas um log claro é gerado
   - ❌ Não aparecem mensagens `"changed from X to undefined"`
   - ✅ O texto completo da nota é exibido corretamente
```

--------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 2 arquivos
+
176
−
15
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src/lib/
‎logNotes‎

inde
‎x.tsx‎
+175 -14

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/logNotes/index.tsx 
+
175
−
14

Visualizado
@@ -10,6 +10,155 @@ const isExpandable = (log: string, minLines = 1, maxLength = 36) => {
  return realLineCount > minLines || log.length > maxLength;
};

//Splits a string by delimiter while respecting quoted strings
const splitRespectingQuotes = (str: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < str.length) {
    const char = str[i];
    const nextChar = i + 1 < str.length ? str[i + 1] : '';
    
    if (char === '"') {
      // Handle escaped quotes ("")
      if (nextChar === '"' && inQuotes) {
        current += '""';
        i += 2;
        continue;
      }
      // Toggle quote state
      inQuotes = !inQuotes;
      current += char;
    } else if (char === delimiter && !inQuotes) {
      // Split only if not inside quotes
      if (current.trim()) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  // Add remaining part
  if (current.trim()) {
    result.push(current.trim());
  }
  
  return result;
};

//Unescapes a quoted value by removing surrounding quotes and unescaping internal quotes.
const unescapeQuotedValue = (value: string | undefined): string => {
  if (!value) return '';
  // Remove surrounding quotes if present
  if (value.startsWith('"') && value.endsWith('"')) {
    const unquoted = value.slice(1, -1);
    // Unescape doubled quotes
    return unquoted.replace(/""/g, '"');
  }
  return value;
};

//Extracts a quoted or unquoted value from a string, starting at the given position.
const extractValue = (str: string, startPos: number, stopAtTo: boolean = false): { value: string; endPos: number } => {
  let pos = startPos;
  // Skip whitespace
  while (pos < str.length && /\s/.test(str[pos])) {
    pos++;
  }
  
  if (pos >= str.length) {
    return { value: '', endPos: pos };
  }
  
  // Check if value starts with a quote
  if (str[pos] === '"') {
    // Extract quoted value, handling escaped quotes
    let value = '"';
    pos++;
    while (pos < str.length) {
      if (str[pos] === '"') {
        // Check if it's an escaped quote
        if (pos + 1 < str.length && str[pos + 1] === '"') {
          value += '""';
          pos += 2;
        } else {
          value += '"';
          pos++;
          break;
        }
      } else {
        value += str[pos];
        pos++;
      }
    }
    return { value, endPos: pos };
  } else {
    let value = '';
    if (stopAtTo) {
      while (pos < str.length) {
        if (pos + 4 <= str.length && str.substring(pos, pos + 4) === ' to ') {
          break;
        }
        value += str[pos];
        pos++;
      }
    } else {
      while (pos < str.length && !/\s/.test(str[pos])) {
        value += str[pos];
        pos++;
      }
    }
    return { value, endPos: pos };
  }
};

//Parses a single log entry to extract field name, "from" value, and "to" value.
const parseLogEntry = (entry: string): { fieldName: string; from: string; to: string | null } | null => {
  const trimmed = entry.trim();
  
  const fieldNameMatch = trimmed.match(/^(\w+)\s+changed\s+(from|to)\s+/);
  if (!fieldNameMatch) {
    return null;
  }
  
  const fieldName = fieldNameMatch[1];
  const changeType = fieldNameMatch[2];
  let pos = fieldNameMatch[0].length;
  
  if (changeType === 'to') {
    const { value: toValue } = extractValue(trimmed, pos);
    return {
      fieldName,
      from: '',
      to: unescapeQuotedValue(toValue.trim())
    };
  }
  
  const { value: fromValue, endPos: fromEndPos } = extractValue(trimmed, pos, true);
  
  let toStartPos = fromEndPos;
  while (toStartPos < trimmed.length && /\s/.test(trimmed[toStartPos])) {
    toStartPos++;
  }
  
  if (toStartPos + 3 <= trimmed.length && trimmed.substring(toStartPos, toStartPos + 3) === 'to ') {
    toStartPos += 3;
    const { value: toValue } = extractValue(trimmed, toStartPos, false);
    return {
      fieldName,
      from: unescapeQuotedValue(fromValue.trim()),
      to: unescapeQuotedValue(toValue.trim())
    };
  }
  
  return null;
};

export const formatDataChangeLogs = (notes: string, logType: string) => {
  const hasPrefix = /(UPDATED|ADDED)/.test(notes);
  const match = notes.match(/\[([^\]]+)\]/);
@@ -31,24 +180,36 @@ export const formatDataChangeLogs = (notes: string, logType: string) => {
  }

  if (hasPrefix && isChangedFormat) {
    result = content
      .split(
        logType === 'MERCHANT_DATA_CHANGE' || logType === 'PROGRAM_DATA_CHANGE'
          ? ','
          : ';'
      )
    // Split by comma or semicolon, but respect quoted strings
    // Backend uses ",\n" as delimiter, so normalize it first
    const delimiter = logType === 'MERCHANT_DATA_CHANGE' || logType === 'PROGRAM_DATA_CHANGE'
      ? ','
      : ';';
    // Normalize: replace ",\n" or ",\r\n" with just "," for consistent parsing
    // This ensures we split correctly while respecting quotes
    const normalizedContent = content.replace(/,\s*\r?\n/g, ',');
    const entries = splitRespectingQuotes(normalizedContent, delimiter);
    
    result = entries
      .filter(Boolean)
      .map((entry) => {
        let changeType = 'changed from';
        if (entry.includes('changed to')) changeType = 'changed to';
        const [keyPart, ...rest] = entry.trim().split(` ${changeType} `);
        const [from, to] = rest.join(` ${changeType} `).split(' to ');
        if (changeType === 'changed to') {
          return `${keyPart.trim()} ${changeType} ${from?.trim()}`;
        const parsed = parseLogEntry(entry);
        if (!parsed) {
          // Fallback to original entry if parsing fails
          return entry;
        }
        
        // Format with better structure: put each part on its own line with indentation
        // This makes it clear that commas in values are part of the value, not separators
        if (parsed.to === null) {
          // "changed to" format
          return `${parsed.fieldName} changed to:\n  ${parsed.from}`;
        } else {
          // "changed from ... to ..." format
          return `${parsed.fieldName}:\n  from: ${parsed.from}\n  to: ${parsed.to}`;
        }
        return `${keyPart.trim()} ${changeType} ${from?.trim()} to ${to?.trim()}`;
      });
    return notes.replace(match[0], '[\n' + result.join('\n') + ']');
    return notes.replace(match[0], '[\n' + result.join('\n\n') + ']');
  }

  if (isChangedFormat) {
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.399",
  "version": "0.0.400",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",


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
    "@uownleasing/common-ui": "0.0.398",
    "@uownleasing/common-ui": "0.0.400",
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

"@uownleasing/common-ui@0.0.398":
  version "0.0.398"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.398.tgz#3c71ca4a470cc45bc280742e977238b803c8a70f"
  integrity sha512-u2xk9t9+l+45upaKc+aoWQkGSr+vtDFYunoUlfvltu8CK68Lni7NZ584GuCZZFz7DFUXPXEuxilJfFznw+mqMQ==
"@uownleasing/common-ui@0.0.400":
  version "0.0.400"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.400.tgz#1bdb9dab35a44fb52ff78b0de61da99c7a60c84e"
  integrity sha512-5+Loqz/eudP1GK9nb31pebV1oHA03OBG9pE9zvLAs5SowdoBLOFXB2BncUoF5Bf7svGE23ImLSVMosRyqtmCIw==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"


 1 arquivo
+
27
−
2
 src/main/java/com/uownleasing/svc/utility/DataChangeUtils.java 
+
27
−
2

Visualizado
@@ -45,8 +45,8 @@ public class DataChangeUtils {
                boolean isEmptyToNull = "".equals(left) && right == null;
                boolean isSameValue = StringUtils.trimToEmpty(left).equals(StringUtils.trimToEmpty(right));
                if (!(isNullToEmpty || isEmptyToNull) && !isSameValue) {
                    String fromLog = "from " + ("".equals(left) ? "\"\"": left) + " ";
                    String toLog = "to " + ("".equals(right) ? "\"\"": right) +" ";
                    String fromLog = "from " + ("".equals(left) ? "\"\"": quoteIfNeeded(left)) + " ";
                    String toLog = "to " + ("".equals(right) ? "\"\"": quoteIfNeeded(right)) +" ";
                    content = content.concat(delim).concat(valChange.getPropertyName() + " changed " + fromLog + toLog);
                }

@@ -68,4 +68,29 @@ public class DataChangeUtils {
        }
        return true;
    }

    //Quotes a value if it contains special characters that could confuse parsing
    private static String quoteIfNeeded(String value) {
        if (value == null) {
            return null;
        }

        if ("".equals(value)) {
            return "\"\"";
        }

        // Check if value contains characters that require quoting
        boolean needsQuoting = value.contains(",") ||
                               value.contains("\"") ||
                               value.contains("changed") ||
                               value.contains("from") ||
                               value.contains("to");

        if (needsQuoting) {
            String escaped = value.replace("\"", "\"\"");
            return "\"" + escaped + "\"";
        }

        return value;
    }
}


--------------------------------------------------------------------------------------------------------------------------------------------------------

Sunday: 9:00 AM - 9:00 AM, Monday: 9:00 AM - 9:00 AM, Tuesday: 9:00 AM - 9:00 AM, Wednesday: 9:00 AM - 9:00 AM, Thursday: 9:00 AM - 9:00 AM, Friday: 9:00 AM - 9:00 AM, Saturday: 9:00 AM - 9:00 AM,


--------------------------------------------------------------------------------------------------------------------------------------------------------

---

```markdown
## 🇧🇷 Logs Gerados ao Inserir ou Editar Informações em Notas Gerais

- Ao inserir ou editar as Notas Gerais com texto contendo vírgulas, todo o conteúdo é salvo como um único valor.
- Ao inserir ou editar as Notas Gerais com vírgulas, elas são tratadas como parte do texto e não como delimitadores do log de atividades.
- Ao inserir ou editar as Notas Gerais, apenas um registro coerente é exibido no log de atividades.
- Ao visualizar o log de atividades após inserir ou editar as Notas Gerais, não são exibidas entradas contendo valores `undefined`.
- Ao inserir ou editar as Notas Gerais com vírgulas, o texto completo é exibido no log de atividades, sem truncamento.
- Ao inserir ou editar as Notas Gerais com valores entre aspas, o conteúdo é exibido sem divisão interna.
- Ao inserir ou editar as Notas Gerais com aspas escapadas (`""`), o texto é exibido com aspas simples (`"`).
- Quando os registros de log utilizam variações de delimitador como `,`, `,\n` ou `,\r\n`, o log de atividades é exibido corretamente.
- Ao inserir ou editar as Notas Gerais com valores vazios ou nulos, não são exibidos registros incorretos ou enganosos no log.
- Ao inserir ou editar as Notas Gerais, os demais tipos de log de atividade permanecem inalterados.
```

---

```markdown
- When General Notes are inserted or edited with text containing commas, the entire content is saved as a single value.
- When commas are included while inserting or editing General Notes, they are treated as part of the text and not as activity log delimiters.
- When General Notes are inserted or edited, only one coherent activity log entry is displayed.
- When viewing the activity log after inserting or editing General Notes, no entries containing `undefined` values are shown.
- When General Notes containing commas are inserted or edited, the full text is displayed in the activity log without truncation.
- When quoted values are included while inserting or editing General Notes, the content is displayed without internal splitting.
- When escaped quotes (`""`) are included while inserting or editing General Notes, the text is displayed using a single quote character (`"`).
- When log entries use delimiter variations such as `,`, `,\n`, or `,\r\n`, the activity log is displayed correctly.
- When General Notes are inserted or edited with empty or null values, no incorrect or misleading activity log entries are displayed.
- When General Notes are inserted or edited, other activity log types remain unaffected.
```


--------------------------------------------------------------------------------------------------------------------------------------------------------