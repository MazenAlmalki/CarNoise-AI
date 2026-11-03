# Warshatak — business model

**Planning draft • Saudi Arabia first • 3 November 2026**

Warshatak is an Arabic-first vehicle-problem intake assistant. Its commercial opportunity is to help drivers describe a problem and help workshops receive a clearer case before inspection. The product should sell a better intake workflow and understandable next steps; it cannot yet sell validated automatic fault diagnosis.

This document proposes a business model, prices and validation plan. It does not establish market demand, customers, revenue, partnerships, recognition accuracy or regulatory approval. All financial amounts are illustrative SAR assumptions, exclude VAT and are not current supplier quotes.

## 1. What exists and what can be sold

| Current repository capability | Commercial implication |
| --- | --- |
| Arabic/English conversations, Saudi terminology, vehicle history and compact result cards | Useful prototype for explaining and documenting a complaint; customer benefit still needs measurement |
| Microphone dictation into an editable draft; attachments sent after explicit Send | Drivers can correct their words and control which media they submit |
| Four registered recordings identified locally by exact file/PCM identity | Demonstration/reference lookup only; this is not recognition accuracy on new vehicles |
| Fifteen reference excerpts from two source compilations; component titles remain unverified | Insufficient independent evidence to train or advertise a reliable fault classifier; commercial media rights need confirmation |
| Optional hosted chat, vision, ASR and audio comparison | External quotas, pricing and availability create real operating costs; free-tier limits are not a scalable supply strategy |
| Browser-local garage/history, with no implemented paid account/workshop workspace | Accounts, consent, access control, billing and workshop intake features are launch prerequisites, not existing paid features |
| A user-requested 30-second attachment presentation minimum | Presentation timing is not inference time or proof of deeper analysis; test its effect on abandonment before commercial launch |

The proposed first paid product is **structured intake and a shareable symptom summary for workshops**, with a technician making the diagnosis. New-sound comparison can be an optional, clearly qualified feature once live reliability and cost are measured. No “trained on thousands of faults,” “70% confident,” “mechanic verified” or cost-saving claim is supported today.

## 2. Business Model Canvas

| Canvas block | Proposed model |
| --- | --- |
| Customer segments | Primary: independent Saudi workshops that receive Arabic voice notes and poorly structured complaints. Secondary: drivers seeking an understandable next step before visiting a workshop. Later: small fleets, after a separate workflow/security pilot. |
| Value proposition | Turn a driver's description and permitted media into a concise, editable intake: reported symptoms, vehicle context, tentative possibilities, safe next step and sources. Reduce repeated intake questions if pilot evidence supports that benefit. |
| Channels | Workshop-owned QR/link at intake, founder-led workshop demonstrations, Arabic educational content and opt-in referrals. Test where drivers already seek repairs; do not assume search/social acquisition is economical. |
| Customer relationships | Self-service driver flow; short workshop onboarding; human support for failed cases; technician feedback recorded separately from model suggestions. No implied emergency service. |
| Revenue streams | Workshop subscription with bounded usage as the main recurring stream. Optional pay-per-case driver access for episodic needs. Consent-based referral revenue only later, disclosed and separated from diagnostic ranking. |
| Key activities | Intake UX, Arabic quality, provider reliability/cost controls, source licensing, technician review, outcome evaluation and partner support. |
| Key resources | Application, structured guidance/provenance, permission-cleared media, independent evaluation cases, workshop relationships and Arabic product knowledge. The four file fingerprints are not a defensible trained-model asset. |
| Key partners | Pilot workshops/qualified reviewers, permitted media owners, hosting and payment providers, optional inference/ASR providers. No partnership is claimed to exist. |
| Cost structure | Provider calls and media input, processing/storage, payments, support, acquisition, engineering, licensing/review and applicable legal/security work. Failed requests and refunds also consume margin. |

## 3. Proposed offers and pricing experiments

These are hypotheses to test, not implemented checkout plans or public commitments.

| Offer | Proposed price | Scope and limits |
| --- | --- | --- |
| Free introduction | SAR 0 | Explain the workflow, simple symptom guidance and registered-reference demonstrations. Hosted usage must have an explicit small cost cap; no unlimited free AI promise. |
| Driver case pass | SAR 12 per case | One bounded intake, one attached excerpt up to 30 processed seconds and two text follow-ups. Display coverage/limitations before purchase. No promise of identifying a component. |
| Workshop Starter | SAR 399/month | Proposed two staff seats and 60 bounded cases/month, intake links and exportable summaries. These workspace features must be built and tested first. |
| Additional workshop usage | Opt-in bundles, price after cost measurement | No silent overage or unlimited plan. A new attachment/re-analysis consumes another clearly defined case allowance. |

Do not charge a premium for matching an exact registered file, a deliberately padded waiting period or an API failure. Proposed paid cases purchase the intake service, not a guaranteed diagnosis. Restore a credit for a provider failure; publish a fair refund policy before checkout. Human review must be explicitly offered, staffed and separately priced before it is promised.

Start with workshop trials because drivers may only need help occasionally. If interview evidence shows that workshops do not value the workflow, stop building the paid dashboard and reconsider the offer rather than manufacturing recurring demand.

## 4. Unit economics and cost discipline

Reproducible inputs and outputs:

- [Assumptions](docs/business/assumptions.csv)
- [Unit economics and provider-cost sensitivity](docs/business/unit_economics.csv)
- [Monthly what-if scenarios](docs/business/financial_scenarios.csv)

Baseline assumptions: model/API cost **SAR 1.00/case**, marginal processing/storage **SAR 0.20/case**, driver support **SAR 1.00/case**, workshop support **SAR 50/account/month**, payment processing **2.5% + SAR 1 per transaction**. These are placeholders, not measured costs or payment-processor terms. Actual audio input may include all reference clips, and ASR, retries and requested TTS must be counted. No free-tier subsidy is assumed in paid economics.

A workshop uses **all 60 included cases** in this calculation; low initial usage must not hide the cost of fulfilling the plan. A driver case and a workshop month each use one payment transaction. Payment fees are rounded to halalas per transaction.

| Unit | Revenue | Variable cost | Contribution | Contribution margin |
| --- | ---: | ---: | ---: | ---: |
| One paid driver case | 12.00 | 3.50 | 8.50 | 70.83% |
| One workshop month, 60 cases | 399.00 | 132.98 | 266.02 | 66.67% |

Formulas:

```text
payment fee = round(price × 0.025 + 1.00, 2)
driver variable cost = model + 0.20 + 1.00 support + payment fee
workshop variable cost = 60 × (model + 0.20) + 50.00 support + payment fee
contribution = revenue − variable cost
contribution margin = contribution ÷ revenue
```

If model cost rises to SAR 3/case, workshop contribution falls to **SAR 146.02/month (36.60%)**. At SAR 6/case, the fully used workshop plan loses **SAR 33.98/month before fixed costs**. The flat plan therefore cannot launch without measured case costs, per-account budgets, duration/call limits and provider-failure handling. Keep paid TTS optional; never silently send extra media/calls or cut analytical safeguards merely to preserve margin.

Use an illustrative fixed monthly budget of **SAR 5,000**: SAR 500 base hosting, SAR 300 software, SAR 200 administration and SAR 4,000 founder allowance. This is not a full hiring/legal budget. Variable costs already include marginal infrastructure/support, so do not count them twice. Acquisition spending, taxes, unusual refunds, one-off setup, rights acquisition and any extra engineering/reviewer salaries are **additional**.

| Monthly scenario — not a forecast | Paying workshops | Paid driver cases | Revenue | Contribution | Contribution less SAR 5,000 fixed budget |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pilot | 10 | 50 | 4,590.00 | 3,085.20 | −1,914.80 |
| Working case | 25 | 200 | 12,375.00 | 8,350.50 | 3,350.50 |
| Larger case | 50 | 500 | 25,950.00 | 17,551.00 | 12,551.00 |

These are scenario calculations, **not net-profit projections**. Baseline break-even against that fixed budget alone is 19 workshops or 589 driver cases/month; acquisition/tax/other excluded costs increase it. No subscriber count is validated. Market size should be estimated bottom-up from verified reachable workshops, conversion and retention; no TAM/SAM/SOM statistic has been invented.

For a one-off driver purchase, do not justify paid acquisition using hypothetical lifetime value: baseline first-case contribution is only SAR 8.50. Measure repeat purchases before assuming more. For workshops, calculate allowable CAC/payback from observed monthly contribution and retention, not subscription revenue alone.

## 5. Initial go-to-market and 90-day validation

The schedule below is proposed work; it does not authorize outreach, data collection, publication of customer media or training automatically.

| Period | Proposed actions | Evidence needed to continue |
| --- | --- | --- |
| Days 1–15: problem discovery | Interview 10 workshop owners/intake staff and 15 drivers with consent. Observe their existing voice-note/phone intake and ask what they would pay to improve. | Recurring intake problem, current alternative, buyer and usable workflow documented. Distinguish compliments from willingness to pay. |
| Days 16–30: assisted pilot | Seek three workshop pilots. Test intake summaries with a technician checking the result. Establish media permission, failure/refund rules and a measured cost ceiling. | Staff can use summaries, drivers understand uncertainty and actual intake time/questions can be compared with a baseline. No automatic-diagnosis sales pitch. |
| Days 31–60: paid-workflow test | Only after launch prerequisites, offer a real paid pilot at a stated price/allowance. Measure activation, usage, failures and support effort. | At least three independently paying pilot accounts is a proposed gate, not current traction. Record why others declined. |
| Days 61–90: retention and decision | Track renewals, support burden and full-quota margin; refine the offer. Collect independently reviewed recordings only under a separately approved consent/evaluation process. | Continue, revise or stop based on observed renewal and contribution. Model training is not a required milestone. |

The launch prerequisites include a secure workshop workspace, authentication/authorization, appropriate consent and deletion/export, metering, payment integration, abuse protection and operational monitoring. Browser-local history is not a multi-user account system. Do not collect payment for functionality that is only listed in this plan.

## 6. Metrics and decision gates

Track each number with its denominator and observation period. The following are proposed targets, not results:

- **Activation:** pilot staff submit at least three usable intakes in the first seven days.
- **Workflow value:** measure before/after intake time and repeat questions; only advertise an improvement after a credible observed comparison.
- **Comprehension:** drivers can distinguish tentative guidance from a confirmed inspection. Unsafe misunderstanding is a stop-and-fix event, not a marketing conversion.
- **Cost:** log bounded API/ASR/media/retry costs per case and p95; target at least 60% workshop contribution margin at full included usage before scaling the baseline plan.
- **Reliability:** separately report provider failures, decoding failures, no-match results and successful workflow completion. An unknown sound is not a system outage; an outage is not an unknown fault.
- **Retention/revenue:** actual paid conversion, renewals, churn, refunds and gross contribution. Tiny pilot samples cannot establish a stable retention rate.
- **Acoustic quality:** evaluate only on permission-cleared independent source groups with blinded acoustic review and confirmed repair outcomes where fault accuracy is claimed. Same-clip identity and mocked tests are not accuracy evidence. Keep the unvalidated 70% threshold disabled.

If the workshop workflow adds little value, fully used accounts lose money, media rights cannot be secured or users over-trust tentative answers, pause paid rollout and fix that constraint. A larger marketing budget does not resolve those failures.

## 7. Trust, rights and commercial boundaries

Make sponsored placement/referral fees visible and separate them from problem ranking. Do not sell a driver’s recordings or reuse them for training without a separate, meaningful opt-in. A file submitted for analysis is not a general redistribution license. Confirm rights before publicly distributing the bundled source excerpts or omit playback until permission is established.

Before commercial launch, obtain appropriate Saudi privacy/consumer-law advice, including PDPL applicability, retention, deletion and any cross-border provider processing. This plan is not legal approval. Source citations and a disclaimer do not convert uncertain audio into a verified diagnosis. Emergency symptoms should lead to safe professional assistance, not a conversion funnel.

## 8. Recommended next decision

Validate the **workshop intake workflow** first, using an honest demonstration of the current product. Measure live provider cost and reliability before finalizing prices. Build billing/workspaces only if the buyer and willingness to pay are evidenced. Improve general audio recognition through independent review/evaluation; do not call the current exact-file feature a trained diagnostic model.

Technical evidence: [current stack](PROJECT_STACK_AR.md), [known-recording scope](KNOWN_RECORDINGS.md), [source/reference review](SOUND_REFERENCE_RESULTS.md), [evaluation constraints](data/car-audio/README.md) and [data/training stop boundary](data/car-audio/integration-plan.json). These describe the prototype, not commercial validation.
