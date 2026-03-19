#!/usr/bin/env bash
# .claude/scripts/auto-review.sh
# PostToolUse hook — roda após Write|Edit em arquivos TypeScript
# Stdin: JSON com tool_name + tool_input (Claude Code hook protocol)
# Saída: warnings/errors mostrados ao Claude como system-reminder

set -uo pipefail

# ── Parse file path do stdin ────────────────────────────────────────
TMPFILE=$(mktemp)
cat > "$TMPFILE"
trap "rm -f '$TMPFILE'" EXIT

FILE_PATH=$(python3 -c "
import sys, json
try:
    with open('$TMPFILE') as f:
        d = json.load(f)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")

# ── Guards ──────────────────────────────────────────────────────────
[[ -z "$FILE_PATH" ]] && exit 0
[[ "$FILE_PATH" != *.ts ]] && exit 0
[[ "$FILE_PATH" == *node_modules* ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# Barrel exports — apenas re-exportam, sem checks específicos
BASENAME=$(basename "$FILE_PATH")
[[ "$BASENAME" == "index.ts" ]] && exit 0

# ── Classificação do arquivo ────────────────────────────────────────
IS_SPEC=false
IS_PAGE_OBJECT=false
IS_API_CLIENT=false
IS_TASK_TEST=false
IS_HELPER=false

[[ "$FILE_PATH" == *".spec.ts" ]]            && IS_SPEC=true
[[ "$FILE_PATH" == */src/pages/* ]]          && IS_PAGE_OBJECT=true
[[ "$FILE_PATH" == */src/api/clients/* ]]    && IS_API_CLIENT=true
[[ "$FILE_PATH" == */tests/taskTestingUown/* ]] && IS_TASK_TEST=true
[[ "$FILE_PATH" == */src/helpers/* ]]        && IS_HELPER=true

ERRORS=()
WARNINGS=()

# ════════════════════════════════════════════════════════════════════
# CHECKS UNIVERSAIS
# ════════════════════════════════════════════════════════════════════

# Anti-pattern: page.waitForTimeout
if grep -qE "page\.waitForTimeout|\.waitForTimeout\s*\(" "$FILE_PATH" 2>/dev/null; then
  ERRORS+=("🔴 ANTI-PATTERN [$(basename "$FILE_PATH")]: page.waitForTimeout() — use polling/sleep() from helpers")
fi

# Anti-pattern: setTimeout genérico
if grep -qE "\bsetTimeout\s*\(" "$FILE_PATH" 2>/dev/null; then
  WARNINGS+=("🟡 ANTI-PATTERN [$(basename "$FILE_PATH")]: setTimeout() — use sleep() ou pollUntil() com backoff")
fi

# Segurança: credencial hardcoded
if grep -qPi "(password|api_?key|secret|bearer)\s*[=:]\s*['\"][A-Za-z0-9+/]{10,}['\"]" "$FILE_PATH" 2>/dev/null; then
  ERRORS+=("🔴 SECURITY [$(basename "$FILE_PATH")]: possível credencial hardcoded detectada")
fi

# INSERT/UPDATE/DELETE direto no DB (fora de db helpers)
if ! $IS_HELPER; then
  if grep -qE "\b(INSERT|UPDATE|DELETE)\s+INTO\b" "$FILE_PATH" 2>/dev/null; then
    ERRORS+=("🔴 DB [$(basename "$FILE_PATH")]: INSERT/UPDATE/DELETE sem autorização explícita — apenas SELECT é permitido")
  fi
fi

# ════════════════════════════════════════════════════════════════════
# SPEC FILES (.spec.ts)
# ════════════════════════════════════════════════════════════════════
if $IS_SPEC; then

  # Import errado: deve ser @support/base-test
  if grep -qE "from\s+['\"]@playwright/test['\"]" "$FILE_PATH" 2>/dev/null; then
    ERRORS+=("🔴 IMPORT [$(basename "$FILE_PATH")]: '@playwright/test' → use '@support/base-test'")
  fi

  # test.step() ausente
  if ! grep -qE "test\.step\s*\(" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 MISSING [$(basename "$FILE_PATH")]: nenhum test.step() — cada fase lógica deve ter label")
  fi

  # Selector hardcoded no test (fora do SELECTORS)
  if grep -qE "page\.locator\s*\(\s*['\"]" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 SELECTOR [$(basename "$FILE_PATH")]: string literal em page.locator() — use SELECTORS.xxx ou método do page object")
  fi

  # calculateDate() em corpo de API — causa 400 Bad Request
  if grep -qE "\bcalculateDate\s*\(" "$FILE_PATH" 2>/dev/null && \
     ! grep -qE "\bcalculateDateISO\s*\(" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 DATE [$(basename "$FILE_PATH")]: calculateDate() retorna MM/DD/YYYY — para API bodies use calculateDateISO() (evita 400)")
  fi

  # testData sem env ou tag
  if grep -qE "const testData" "$FILE_PATH" 2>/dev/null; then
    if ! grep -qE "env\s*:" "$FILE_PATH" 2>/dev/null; then
      WARNINGS+=("🟡 TEST-DATA [$(basename "$FILE_PATH")]: testData sem campo 'env'")
    fi
    if ! grep -qE "tag\s*:" "$FILE_PATH" 2>/dev/null; then
      WARNINGS+=("🟡 TEST-DATA [$(basename "$FILE_PATH")]: testData sem campo 'tag' (@smoke/@sanity/@regression)")
    fi
  fi

  # Teste que cria aplicação mas não tem riskTier
  if grep -qE "sendApplication" "$FILE_PATH" 2>/dev/null && \
     ! grep -qE "riskTier" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 RISK-TIER [$(basename "$FILE_PATH")]: sendApplication detectado sem riskTier em testData — consultar Appendix G")
  fi

fi

# ════════════════════════════════════════════════════════════════════
# TASK TESTS (tests/taskTestingUown/)
# ════════════════════════════════════════════════════════════════════
if $IS_TASK_TEST && $IS_SPEC; then

  FNAME=$(basename "$FILE_PATH" .spec.ts)
  PARENT_DIR=$(basename "$(dirname "$FILE_PATH")")

  # Naming convention: {Milestone}_{camelCaseTitle}_{number}
  if ! echo "$FNAME" | grep -qE "^[A-Za-z][A-Za-z0-9.]+_[a-z][A-Za-z0-9]+_[0-9]+$"; then
    WARNINGS+=("🟡 NAMING [$(basename "$FILE_PATH")]: '$FNAME' deve seguir {Milestone}_{camelCaseTitle}_{number} (ex: R1.49.1_featureName_469)")
  fi

  # Deve estar em subdiretório com mesmo nome: taskTestingUown/{name}/{name}.spec.ts
  if [[ "$PARENT_DIR" != "$FNAME" ]]; then
    ERRORS+=("🔴 STRUCTURE [$(basename "$FILE_PATH")]: task test deve estar em tests/taskTestingUown/{name}/{name}.spec.ts (subdiretório)")
  fi

fi

# ════════════════════════════════════════════════════════════════════
# PAGE OBJECTS (src/pages/)
# ════════════════════════════════════════════════════════════════════
if $IS_PAGE_OBJECT; then

  # Deve estender BasePage ou base de portal
  if ! grep -qE "extends\s+(Base|Origination|Servicing|Website|Ams)[A-Za-z]*Page\b" "$FILE_PATH" 2>/dev/null; then
    # Pode ser a própria base (ex: BasePage, OriginationBasePage)
    if ! grep -qE "class\s+\w*(Base|Login|Search|Merchant|Contract)[A-Za-z]*Page\b" "$FILE_PATH" 2>/dev/null; then
      ERRORS+=("🔴 HIERARCHY [$(basename "$FILE_PATH")]: page object deve estender BasePage ou base de portal")
    fi
  fi

  # Sem referência a SELECTORS
  if ! grep -qE "SELECTORS" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 SELECTORS [$(basename "$FILE_PATH")]: nenhum uso de SELECTORS — centralizar locators em common.selectors.ts")
  fi

  # Selector hardcoded em propriedade readonly
  if grep -qE "readonly\s+\w+\s*=\s*this\.page\.locator\s*\(\s*['\"]" "$FILE_PATH" 2>/dev/null; then
    ERRORS+=("🔴 SELECTOR [$(basename "$FILE_PATH")]: locator hardcoded em propriedade readonly — mover para SELECTORS const")
  fi

fi

# ════════════════════════════════════════════════════════════════════
# API CLIENTS (src/api/clients/)
# ════════════════════════════════════════════════════════════════════
if $IS_API_CLIENT; then

  # Deve estender BaseClient
  if ! grep -qE "extends\s+BaseClient\b" "$FILE_PATH" 2>/dev/null; then
    ERRORS+=("🔴 HIERARCHY [$(basename "$FILE_PATH")]: API client deve estender BaseClient")
  fi

  # Retorno tipado com ApiResponse<T>
  if ! grep -qE "ApiResponse<" "$FILE_PATH" 2>/dev/null; then
    WARNINGS+=("🟡 TYPING [$(basename "$FILE_PATH")]: sem ApiResponse<T> — todos os métodos devem retornar Promise<ApiResponse<T>>")
  fi

fi

# ════════════════════════════════════════════════════════════════════
# OUTPUT
# ════════════════════════════════════════════════════════════════════
TOTAL=$((${#ERRORS[@]} + ${#WARNINGS[@]}))
[[ $TOTAL -eq 0 ]] && exit 0

echo ""
echo "┌─ AUTO-REVIEW ──────────────────────────────────────────────────┐"
printf "│  %-62s│\n" "$(basename "$FILE_PATH")"
printf "│  %-62s│\n" "${#ERRORS[@]} error(s) · ${#WARNINGS[@]} warning(s)"
echo "└────────────────────────────────────────────────────────────────┘"
echo ""

for msg in "${ERRORS[@]}";   do echo "  $msg"; done
for msg in "${WARNINGS[@]}"; do echo "  $msg"; done

echo ""
echo "  → Corrija antes de prosseguir para o próximo passo."
echo ""

exit 0
