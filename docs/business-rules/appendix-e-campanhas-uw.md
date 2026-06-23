---
title: "Apendice E: Referencia de Campanhas de Underwriting"
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
| 171 | Tire Agent (adicional) -- nao consta no bloco de comentario de `ClientType.java`, mas e tratado como TireAgent por `LeadRiskService` |

**Regra de selecao:** Em producao, entre `peakStartHour` e `peakEndHour` usa `peakCampaignId`, caso contrario usa `offPeakCampaignId`. Em ambientes de teste, sempre usa peak.

### Mapeamento Campanha -> riskType (R1.53.0)

`LeadRiskService.determineRiskType` classifica o lead em `riskType` a partir do `peakCampaignId` do ClientType. Esse `riskType` (junto com `lambdaSegment`) seleciona a linha de `approved_amount_by_segment` (ver [02-originacao-pipeline.md](02-originacao-pipeline.md) secao 40):

| riskType | Campanhas (peakCampaignId) |
|----------|----------------------------|
| `TIRE_AGENT` | `137`, `150`, `171` |
| `HIGH_RISK` | `153`, `154`, `157`, `159`, `160`, `162`, `163`, `172` |
| `DEFAULT` | qualquer outra (inclui `142` Core Furniture) |

> **Brands genericos (campanha 142):** a maioria dos brands `PayTomorrowClient` (EPC_VIP, FORM_PIPER, FLEXX_BUY, ..., e o novo **MAGWITCH** em R1.53.0) usa campanha `142/142` e cai em `riskType = DEFAULT`.
>
> **`tam_score`** e o score de contexto TireAgent retornado pelo GDS (snapshot, R1.53.0); **`npm_segment`** e um segmento de pricing/risco do GDS (snapshot). Ambos sao gravados mas NAO consumidos pela logica de aprovacao da svc -- ver secao 12/40 de [02-originacao-pipeline.md](02-originacao-pipeline.md).

