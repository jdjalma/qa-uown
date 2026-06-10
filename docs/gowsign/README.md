---
source: https://gitlab.com/groups/uown/-/wikis/gow-sign
title: GowSign — Wiki Mirror
fetched_at: 2026-05-06
---

# GowSign — Wiki Mirror

Mirror of the [UOWN GowSign wiki](https://gitlab.com/groups/uown/-/wikis/gow-sign) snapshot taken on **2026-05-06**.

> **Authoritative source:** the GitLab wiki. This mirror exists so Claude/agents can read it offline. Re-fetch when the upstream changes.

## Pages

| Page | Topic |
|------|-------|
| [Overview and Architecture](Overview-and-Architecture.md) | Scope, modules (`svc`, `dms-common`, `origination`), runtime summary |
| [Provider Routing and Template Selection](provider-routing-and-template-selection.md) | How requests route to GowSign vs SignWell; template lookup |
| [Template Registry and Strapi Authoring](template-registry-and-strapi-authoring.md) | `uown_gow_sign_template` registry; Strapi authoring rules |
| [SVC Orchestration](svc-orchestration.md) | `DocumentOrchestrator` / `DocumentDispatchService` flow |
| [DMS-COMMON GowSign Client](DMS-COMMON-GowSign-Client.md) | `GowSignClient`, `EsignRouter`, persistence lifecycle |
| [Origination Embedded Signing](origination-embedded-signing.md) | Iframe modal, postMessage handling, redirect flow |
| [End-to-end Lifecycle and Status Mapping](end-to-end-lifecycle-and-status-mapping.md) | `EsignStatus` mapping across providers |
| [Testing and Regression Checklist](testing-and-regression-checklist.md) | Required regression scenarios |

## Refresh

To re-pull from upstream (uses `GITLAB_TOKEN` from `.env`):

```bash
source .env
for slug in gow-sign gow-sign/Overview-and-Architecture \
            gow-sign/provider-routing-and-template-selection \
            gow-sign/template-registry-and-strapi-authoring \
            gow-sign/svc-orchestration \
            gow-sign/DMS-COMMON-GowSign-Client \
            gow-sign/origination-embedded-signing \
            gow-sign/end-to-end-lifecycle-and-status-mapping \
            gow-sign/testing-and-regression-checklist; do
  encoded=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=''))" "$slug")
  curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://gitlab.com/api/v4/groups/uown/wikis/${encoded}"
done
```
