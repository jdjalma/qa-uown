---
name: US + Lease Risks in Test Spec Process
description: Test specs must always consult user stories (jornada-completa-lease.md) and map lease business risks to CTs
type: feedback
---

Test spec creation process must ALWAYS include consulting `docs/user-stories/jornada-completa-lease.md` alongside business rules.

**Why:** The user wants test scenarios to be grounded in real user flows (not just technical endpoints) and to cover lease product risks (fraud, credit, compliance, financial, operational, revenue) — not just software bugs. This makes tests more realistic and assertive.

**How to apply:**
1. When creating any test SPEC (via `subagent-spec-test` or manually), read `jornada-completa-lease.md` FIRST
2. Identify which US(s) the task maps to (e.g., US-SVC-02 for payment, US-PAY-04 for EPO)
3. Extract the lease risks from that US and map at least one risk to a CT (edge case or negative scenario)
4. Fill the "User Story Mapping" section in the SPEC output template
5. The process order is: business-rules → user-stories → appendix-g (risk scenarios) → spec creation
