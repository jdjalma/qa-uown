---
title: "Appendix E: Underwriting Campaigns Reference"
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-23
sources:
  - code: src/api/bodies/program-info.body.ts#peakCampaignId
  - svc-source: service/LeadRiskService.java
  - env: qa2
covers: [campanhas, underwriting, client-type, peak, off-peak, campaign-id, segment-limits]
---

# Appendix E: Underwriting Campaigns Reference
## UOwn Leasing - SVC Platform

Underwriting campaign IDs by ClientType.

---

## Appendix E: Underwriting Campaigns Reference

Each ClientType has campaign IDs for peak and off-peak hours:

| ID | Campaign |
|----|----------|
| 137 | Tires Peak |
| 141-146 | Core Furniture |
| 149 | Shed |
| 150 | Tires Off Peak |
| 151 | Pay Tomorrow Peak |
| 152 | Pay Tomorrow Off Peak |
| 153 | Electro Peak |
| 154 | Electro Off Peak |
| 155 | Pricebusters |
| 156 | Frasier Auto |
| 157 | Saslow Jewelers |
| 159 | Daniels Jewelers |
| 160 | UOwn Jewellers |
| 164 | Eye/Optical |
| 170 | Conecta / Kornerstone (Senior Living) |
| 171 | Tire Agent (additional) -- not present in the comment block of `ClientType.java`, but is treated as TireAgent by `LeadRiskService` |

**Selection rule:** In production, between `peakStartHour` and `peakEndHour` it uses `peakCampaignId`, otherwise it uses `offPeakCampaignId`. In test environments, it always uses peak.

### Campaign -> riskType mapping (R1.53.0)

`LeadRiskService.determineRiskType` classifies the lead into a `riskType` from the ClientType's `peakCampaignId`. This `riskType` (together with `lambdaSegment`) selects the `approved_amount_by_segment` row (see [02-originacao-pipeline.md](02-originacao-pipeline.md) section 40):

| riskType | Campaigns (peakCampaignId) |
|----------|----------------------------|
| `TIRE_AGENT` | `137`, `150`, `171` |
| `HIGH_RISK` | `153`, `154`, `157`, `159`, `160`, `162`, `163`, `172` |
| `DEFAULT` | any other (includes `142` Core Furniture) |

> **Generic brands (campaign 142):** most `PayTomorrowClient` brands (EPC_VIP, FORM_PIPER, FLEXX_BUY, ..., and the new **MAGWITCH** in R1.53.0) use campaign `142/142` and fall into `riskType = DEFAULT`.
>
> **`tam_score`** is the TireAgent context score returned by GDS (snapshot, R1.53.0); **`npm_segment`** is a GDS pricing/risk segment (snapshot). Both are stored but NOT consumed by the svc approval logic -- see section 12/40 of [02-originacao-pipeline.md](02-originacao-pipeline.md).

