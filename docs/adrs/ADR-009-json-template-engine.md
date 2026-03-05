<!-- PT-BR: Decisão de usar template engine JSON com interpolação ${varName} para request bodies complexos. -->

# ADR-009: Template Engine for JSON Request Bodies

## Status
Accepted

## Date
2025-02-10

## Context
Request bodies for UOWN APIs are complex (dozens of fields: personal data, address, merchant config, etc.). Hardcoding bodies in tests generates massive duplication. TypeScript interfaces solve typing, but not the dynamic value generation.

Options considered:
- **TypeScript builders**: typed, but verbose for large bodies
- **Factories (Faker/Bogus)**: random generation, but no structure control
- **JSON templates with interpolation**: declarative templates, dynamic values via `${varName}`

## Decision
Combine both approaches:
1. **JSON templates** in `src/fixtures/api-templates/` for complex bodies with `${varName}` syntax
2. **Body builders** in `src/api/bodies/` for simpler bodies or those requiring logic

Template engine in `src/helpers/template-engine.ts`:
```typescript
const body = buildRequestBody('submitApplication', {
  merchant: 'TireAgent',
  firstName: 'John',
  ssn: generateTestSSN(true),
});
```

## Consequences

**Positive:**
- JSON templates are readable and versionable
- `${varName}` interpolation is simple and predictable
- TypeScript body builders maintain typing for simple bodies
- 6 templates cover the main flows

**Negative:**
- JSON templates without compile-time type validation
- Two patterns (templates + builders) may cause confusion

**Mitigations:**
- `subagent-data-template` agent standardizes creation
- CLAUDE.md documents when to use each approach
- Template engine validates unsubstituted variables at runtime

## References
- `src/fixtures/api-templates/` (6 templates)
- `src/helpers/template-engine.ts`
- `src/api/bodies/`
