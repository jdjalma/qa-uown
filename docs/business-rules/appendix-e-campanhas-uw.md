---
title: "Apendice E: Referencia de Campanhas de Underwriting"
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-18
sources:
  - code: src/api/bodies/program-info.body.ts#peakCampaignId
  - env: qa2
covers: [campanhas, underwriting, client-type, peak, off-peak, campaign-id]
---

# Apendice E: Referencia de Campanhas de Underwriting
## UOwn Leasing - SVC Platform

IDs de campanhas de underwriting por ClientType.

---

## Apendice E: Referencia de Campanhas de Underwriting

Cada ClientType possui IDs de campanha para horarios de pico (peak) e fora de pico (off-peak):

| ID | Campanha |
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

**Regra de selecao:** Em producao, entre `peakStartHour` e `peakEndHour` usa `peakCampaignId`, caso contrario usa `offPeakCampaignId`. Em ambientes de teste, sempre usa peak.

