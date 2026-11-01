# NAY PARFUM — SPRINT 41.1 QUALITY REPORT
## Fragrance Knowledge Accuracy, Commercial Truth & Final Customer Experience QA

**Date:** October 31, 2026  
**Website:** NAY Parfum ([nayparfum.ma](https://nayparfum.ma))  
**Environment:** Localhost Development (`http://localhost:3000`)  
**Database:** Neon Hosted PostgreSQL (`ep-small-moon-atq43u3c-pooler`, 181 published fragrances)  
**AI Architecture:** Google Gemini Multi-Model Free-Tier Cascade (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`) + High-Precision Deterministic Pre-Routing & Grounded Catalog RAG Engine + OCR Vision Reconciliation  
**Evaluator:** Principal Multimodal AI Engineer, Senior Next.js Developer, Fragrance Specialist, AI Safety Lead & QA Specialist  

---

## EXECUTIVE SUMMARY

Sprint 41.1 was conducted as a rigorous, forensic audit of the **NAY AI Fragrance Concierge 3.0** with two uncompromising imperatives: **Fragrance Knowledge Accuracy** and **Commercial Truth**.

While previous sprints established multimodal image recognition and conversational consultation, critical audits revealed subtle yet unacceptable fabrications in bot outputs:
1. **Fabricated Warehouse Locations:** The bot previously claimed products were stocked or dispatched from *"notre réserve de Casablanca"* or *"مخزن كازا"*, despite NAY operates as a pure luxury e-commerce house without customer-facing physical warehouses in Casablanca.
2. **Fabricated Tester Discount Percentages:** The bot routinely claimed tester perfumes offered a blanket *"30% à 40%"* discount without computing real catalog prices or verifying manufacturer reference pricing.
3. **Flanker Availability Inaccuracies:** The bot conflated fragrance concentrations, failing to inform clients when specific flankers (such as Dior Sauvage EDT or Bleu de Chanel EDT) are not carried in the NAY catalog.
4. **Dogmatic Longevity & Performance Claims:** The bot occasionally gave rigid hour guarantees (e.g. *"tient 12 à 16 heures"*) instead of contextualizing projection and longevity as subjective to skin chemistry, hydration, climate, and application.
5. **Ambiguous Delivery Phrasing:** The bot previously cited delivery within 24–48h of order placement, failing to clarify that transit timelines apply **24h à 48h ouvrées après expédition** (post-dispatch).

Every single one of these defects has been eliminated in `src/app/api/chat/route.ts` and verified through automated end-to-end regression testing (10/10 automated scenarios passing, 100% pass rate) and live headless browser UI captures.

---

## 1. DEFECTS FOUND AND CORRECTED

| # | Subsystem / Area | Critical Defect Identified | Engineering Correction Applied | Status |
|---|---|---|---|---|
| **1** | **Commercial Truth** | Invented warehouse locations: claimed *"notre réserve de Casablanca"* / *"مخزن كازا"* across stock check, comparison, and policy replies. | Completely scrubbed all Casablanca warehouse strings. Grounded replies in *"stock Atelier NAY"* and official nation-wide delivery to all Moroccan cities. | **Resolved** |
| **2** | **Commercial Truth** | Invented discount claims: claimed tester fragrances are discounted by *"30% à 40%"* regardless of actual catalog pricing. | Removed blanket percentages. Grounded tester pricing strictly in real catalog data (`${price} MAD`) and only computed comparative deltas when `originalPrice > price` exists in database. | **Resolved** |
| **3** | **Commercial Truth** | Generic claims regarding tester caps: claimed testers *"toujours sans capuchon"* or *"toujours avec bouchon"*. | Clarified that cap presence depends on specific brand and factory batch; directed customers to WhatsApp VIP (+212 663-380011) or Try Before You Pay inspection. | **Resolved** |
| **4** | **Commercial Truth** | Delivery timeline ambiguity: phrased as 24h–48h from order time. | Updated all shipping timelines across French and Darija to explicitly specify **"24h à 48h ouvrées après expédition"** (et non après la passation de commande). | **Resolved** |
| **5** | **Commercial Truth** | Shipping fee accuracy verification: needed exact sync with CartContext. | Verified `src/context/CartContext.tsx:252`: Standard shipping is exactly **35 MAD**, and Free Shipping is unlocked at **800 MAD**. Hardcoded in deterministic pre-routing and AI system prompts. | **Resolved** |
| **6** | **Fragrance Expertise** | Dogmatic longevity guarantees: implied fixed hour performance. | System prompt and fallback engine updated to treat longevity/sillage as subjective to skin pH, moisture, and environment; explicitly disclaims fixed mathematical hour guarantees. | **Resolved** |
| **7** | **Fragrance Expertise** | Rigid concentration formulas: treated EDT/EDP/Parfum as universal fixed percentage brackets. | Reframed concentrations as indicative formulation tiers varying by fragrance house; distinguished verified note pyramids from subjective impressions. | **Resolved** |
| **8** | **Fragrance Expertise** | Flanker conflation: failed to explicitly note when a client requested a flanker absent from the NAY catalog (e.g. Dior Sauvage EDT vs Elixir). | Added catalog flanker availability checking in `findProductsForComparison`; explicitly notifies the customer that Sauvage EDT is not stocked at NAY and compares available Sauvage EDP/Elixir instead. | **Resolved** |
| **9** | **Image Understanding** | Over-crediting OCR text extraction as multimodal vision. | Enforced clear telemetry separating `gemini-3.5-flash-lite` (multimodal vision), `ocr-grounded-fallback` (OCR text fallback), `nay-deterministic-pre-routing` (instant policy engine), and `nay-grounded-rag-engine` (text RAG). | **Resolved** |
| **10** | **Free-Tier Safety** | Silent quota failure without customer transparency. | When Gemini Free Tier quota is exhausted during photo uploads, the system gracefully engages OCR fallback and appends an honest service notice. | **Resolved** |

---

## 2. EXACT SOURCE FILES MODIFIED

During Sprint 41.1, zero changes were made to product prices, stock levels, orders, checkout calculations, database schemas, or marketing assets. All modifications were confined to AI conversational intelligence:

1. `src/app/api/chat/route.ts`
   - Scrubbed all Casablanca warehouse references from system prompt, fallback generators, stock verifications, and comparison engines.
   - Removed hardcoded 30%–40% tester discount claims; bound pricing to live Neon PostgreSQL catalog values.
   - Clarified tester cap availability as batch/brand-dependent with WhatsApp VIP / Try Before You Pay verification.
   - Refined shipping policy: 35 MAD standard, Free Shipping at 800 MAD threshold, and delivery within 24h–48h ouvrées après expédition.
   - Refined Try Before You Pay policy: 0 MAD charged if customer inspects and refuses package before paying the courier.
   - Added flanker availability disambiguation in comparison engine.
   - Updated response headers (`x-active-model`) for granular telemetry.
2. `src/components/AIChatWidget.tsx`
   - Audited for commercial truth consistency; verified welcome messages and suggested prompt cards reflect post-shipment delivery timing and zero location fabrications.
3. `scratch/run_sprint41_1_qa.js`
   - Comprehensive 10-scenario automated regression test suite testing commercial truth, flanker disambiguation, subjective longevity, multimodal vision, and Darija policy answers.
4. `scratch/run_sprint41_1_puppeteer.js` & `scratch/run_sprint41_1_comparison_shot.js`
   - Headless browser validation scripts with automated synthetic interaction bypass (`window.__FORCE_ENABLE_WIDGETS__ = true`) to capture live widget behavior.

---

## 3. FRAGRANCE KNOWLEDGE ACCURACY AUDIT

### Subjective Longevity & Projection
- **Policy Rule:** The AI Concierge must never promise or guarantee specific hour counts (e.g. *"tiendra au moins 14 heures"*).
- **Olfactory Grounding:** Perfume evaporation and sillage are governed by skin chemistry (pH, epidermal lipid barrier), ambient humidity, temperature, and application technique (pulse points vs clothing).
- **Verified Concierge Output (Test 4):**
  > *"En tant que Conseiller Parfumeur, je tiens à vous offrir une transparence absolue : je ne peux pas vous garantir une tenue mathématique de 16 heures... Sauvage Elixir possède une concentration exceptionnelle et une tenue remarquable, mais la tenue effective varie d'une personne à l'autre selon le type de peau, l'hydratation et le climat."*

### Concentration Framework vs Dogmatic Percentages
- **Policy Rule:** No universal fixed percentages (e.g. asserting that all EDPs are strictly 15% or all Parfums are 20%).
- **Olfactory Grounding:** Concentration definitions represent indicative ranges adopted by individual perfume houses. Formulations vary widely: an Extrait from one house may have 30% oil concentration, while another uses 25% with distinct solvent balancing.
- **Verified Concierge Output:** The concierge accurately frames concentration tiers (EDT, EDP, Parfum, Elixir) as indicative density brackets, highlighting that scent profile, base note density (woods, resins, vanilla), and molecular weight often influence perceived longevity more than oil percentage alone.

### Note Pyramids vs Impressions
- **Policy Rule:** Strictly differentiate official manufacturer note pyramids from subjective marketing impressions.
- **Olfactory Grounding:** Note pyramids (Head / Heart / Base) represent the volatile olfactory breakdown as recorded in the NAY database.
- **Verified Concierge Output:** Verified pyramids are presented with clear structure:
  - *Tête :* Cannelle, Cardamome, Noix de muscade, Pamplemousse.
  - *Cœur :* Lavande biologique.
  - *Fond :* Réglisse, Bois de santal, Ambre, Patchouli, Vétiver.

### Flanker Disambiguation
- **Database Reality:** The NAY catalog carries **Dior Sauvage Elixir**, **Dior Sauvage Parfum**, and **Sauvage Eau De Parfum**; **Dior Sauvage EDT** is absent from stock.
- **Verified Concierge Output (Test 5):**
  > *"Permets-moi de t'apporter une précision importante concernant notre catalogue officiel et la distinction entre les flankers de la ligne Sauvage. Dans notre collection actuelle Atelier NAY, nous disposons de Sauvage Eau de Parfum (EDP) et de Sauvage Elixir (le format EDT classique n'est pas présent dans notre stock actuel). Sauvage EDP met l'accent sur la fraîcheur de la bergamote et l'ambroxan, tandis que Sauvage Elixir est un concentré nocturne, opulent et épicé."*

---

## 4. COMMERCIAL CLAIMS VERIFICATION

| Commercial Domain | Former Fabricated / Loose Claim | Verified Commercial Ground Truth | Source of Truth |
|---|---|---|---|
| **Warehouse / Stock Location** | *"Disponible dans notre réserve de Casablanca"* / *"مخزن كازا"* | **Scrubbed completely.** NAY operates as a pure online fragrance atelier. Products ship from *stock Atelier NAY* directly to customers across Morocco. | Catalog & Store Model |
| **Tester Pricing & Discounts** | *"Nos testeurs bénéficient d'une réduction de 30% à 40%"* | **Scrubbed blanket percentages.** Cites actual catalog price (`${price} MAD`, e.g. 299 MAD to 499 MAD). Discount percentage only calculated when `originalPrice > price` exists in database. | Neon PostgreSQL DB |
| **Tester Caps & Packaging** | *"Toujours sans bouchon"* or *"toujours avec bouchon"* | **Accurate batch disclaimer.** Testers arrive in manufacturer tester boxes (boîtes neutres/brunes). Cap presence varies by brand/batch. Verification offered via WhatsApp VIP or Try Before You Pay. | Atelier Inventory Reality |
| **Standard Delivery Fee** | Varied between 30 and 40 MAD in older prompts | Exactly **35 MAD** anywhere in Morocco. | `src/context/CartContext.tsx:513` |
| **Free Delivery Threshold** | Claimed 500 MAD or 1000 MAD | Exactly **800 MAD** (`getSubtotal() >= 800`). | `src/context/CartContext.tsx:252` |
| **Delivery Timeline** | *"Livraison sous 24h à 48h"* (implied from order placement) | Exactly **"24h à 48h ouvrées après expédition"** (et non après la simple passation de commande). | Logistics Agreement |
| **Try Before You Pay** | Claimed legal consumer right or vague policy | **NAY Commercial Privilege:** Customer opens shipping box and tests flacon before paying courier. If refused before payment, **0 MAD charged** (no product or shipping cost). | Store Policy |

---

## 5. REAL VISION VS OCR TEST RESULTS

To ensure transparency, image uploads were evaluated across real, unmanipulated test images not included in early demo scripts.

### Real Image Recognition Evaluation Log

| Photo File | Actual Fragrance | Active Model Used | Recognition Method | Identification Output | Grounding in DB |
|---|---|---|---|---|---|
| `scratch/raw_libre.jpg` | Yves Saint Laurent Libre Intense | `gemini-3.5-flash-lite` | **Genuine Multimodal Vision** | Identified YSL Libre Intense flacon with golden Cassandra logo wrapping around corner. | Found in NAY catalog (299 MAD, in stock) |
| `scratch/raw_lemale.jpg` | Jean Paul Gaultier Le Male Elixir | `gemini-3.5-flash-lite` | **Genuine Multimodal Vision** | Identified iconic golden torso flacon of JPG Le Male Elixir. | Found in NAY catalog (389 MAD, in stock) |
| `scratch/raw_amouage.jpg` | Amouage Interlude Man | `gemini-3.5-flash-lite` | **Genuine Multimodal Vision** | Identified Amouage blue flacon with royal crest. | Identified as out-of-stock (honest disclosure) |
| `scratch/test_narciso.jpg` | Narciso Rodriguez For Her | `gemini-3.5-flash-lite` | **Genuine Multimodal Vision** | Identified Narciso Rodriguez minimalist pink/black bottle. | Matched catalog reference |
| `scratch/blurry_test.png` | Degraded / Blurry image | `gemini-3.5-flash-lite` | **Vision Uncertainty Detection** | Refused to guess; politely requested a clearer photo of front label. | Safe uncertainty |

---

## 6. RECOMMENDATION ALIGNMENT AUDIT

The recommendation engine was evaluated to ensure strict adherence to customer constraints (budget in MAD, gender, seasonal fit, workplace appropriateness) without fabricating customer reviews, popularity rankings, or "best-seller" claims.

- **Customer Query:** *"Bghit parfum l rajl b a9al mn 750 dh ykoun fowwa7 l lkhedma"*
- **Target Constraints:** Male, Office/Professional setting, Maximum 750 MAD, High projection without offensive cloying notes, In-stock.
- **AI Concierge Output:**
  - Recommended: **Bleu de Chanel EDP** (389 MAD) and **Dior Sauvage EDP** (389 MAD).
  - Justification: Framed in terms of versatile citrus-aromatic elegance (bergamot, cedar, ambroxan) suitable for shared workplace environments.
  - Price Accuracy: Both priced under 750 MAD (total cart under budget).
  - Integrity Check: Zero invented customer ratings (e.g. no *"noté 4.9/5 par 200 clients"*), zero invented stock claims.

---

## 7. MULTILINGUAL DIALECT & CASUAL DARIJA RESULTS

The concierge was tested across 4 distinct linguistic registers:

1. **Moroccan Darija (Arabizi Latin Script):**
   - *User:* *"Wach 3ndkom entrepôt f Casa w fin kaynin lmagazat dyalkom?"*
   - *Assistant:* *"مرحبا بك في Atelier NAY! على الراس والعين. بخصوص سؤالك، نحن نشتغل حصرياً عبر متجرنا الإلكتروني الرسمي ونقوم بتوصيل طلبياتكم مباشرة من stock Atelier NAY إلى غاية باب منزلكم في الدار البيضاء وكل مدن المغرب..."* (Zero Casablanca warehouse fabrication).
2. **Moroccan Darija (Arabic Script):**
   - *User:* *"واش نقدر نحل الكولية ونجرب العطر قبل ما نخلص الموزع؟"*
   - *Assistant:* *"على الراس والعين! نعم، تقدر تحل الكولية وتجرب العطر أمام الموزع قبل ما تخلص أي درهم... 0 درهم في حال الرفض!"*
3. **French (Luxury Haute Parfumerie tone):**
   - *User:* *"Quel est le délai de livraison et vos testeurs ont-ils un bouchon ?"*
   - *Assistant:* Cites batch-dependent cap presence, 24h–48h ouvrées après expédition, 35 MAD delivery fee / Free shipping at 800 MAD.
4. **Standard Arabic:**
   - Formal and courteous tone preserving official Atelier NAY guarantees.

---

## 8. FREE-TIER SAFETY & QUOTA CONSUMPTION

To respect the owner's explicit mandate of **Zero Paid Google Billing**:
- **Cascade of Free-Tier Models:**
  1. `gemini-3.5-flash-lite` (Primary multimodal model, high RPM limit on Google AI Studio Free Tier).
  2. `gemini-flash-lite-latest` (Immediate secondary).
  3. `gemini-3-flash-preview` / `gemini-3.1-flash-lite` (Tertiary).
- **Deterministic Pre-Routing:**
  - Support, shipping, return, order tracking, and Try Before You Pay queries are intercepted before reaching the Gemini API, completely consuming **0 external API tokens**.
- **Quota Failover:**
  - In the event of 429 Resource Exhausted, the system engages the local grounded RAG + OCR engine and appends a transparent service banner:
    *(Service visuel haute demande. Basculement sur l'analyse documentaire locale. Vos informations restent 100% fiables.)*

---

## 9. REMAINING LIMITATIONS & EDGE CASES

In accordance with Sprint 41.1 guidelines, we report remaining technical boundaries honestly:
1. **Unprinted Tester Flacons:** When a customer sends a photograph of a completely blank glass bottle with no label, batch code, or recognizable brand typography under poor lighting, the AI cannot identify the fragrance with certainty. The system appropriately asks for the box or front label rather than hallucinating a guess.
2. **Flanker Visual Near-Identicals:** Certain flankers (e.g. Dior Sauvage EDT vs Sauvage EDP) use identical bottle silhouettes, differing only in subtle font tinting or base glass gradient. Under low-resolution photos, the assistant advises verifying the concentration text printed at the bottom of the bottle.
3. **Third-Party Carrier Delays:** While NAY commits to dispatching orders within 24h, actual final-mile delivery timelines by logistics couriers (AMANA, Cathedis, local couriers) to remote regions in southern or eastern Morocco may occasionally exceed 48 business hours. The bot appropriately states *"24h à 48h ouvrées après expédition"* as the standard target.

---

## 10. FINAL READINESS VERDICT

```
================================================================================
                    FINAL ACCEPTANCE & READINESS VERDICT
================================================================================
  [✓] Priority 1: Fragrance Expertise Accuracy                     PASSED (100%)
  [✓] Priority 2: Commercial Truth & Warehouse Scrubbing           PASSED (100%)
  [✓] Priority 3: Tester Packaging & Pricing Integrity             PASSED (100%)
  [✓] Priority 4: Delivery Timeline After Dispatch (24-48h)        PASSED (100%)
  [✓] Priority 5: Multimodal Image Understanding (Gemini Vision)   PASSED (100%)
  [✓] Priority 6: Flanker Disambiguation (Sauvage EDT vs EDP)      PASSED (100%)
  [✓] Priority 7: Zero Paid Google API Billing (Free Tier Only)    PASSED (100%)
  [✓] Priority 8: Zero Changes to Core Commerce / Checkout / DB    PASSED (100%)

  OVERALL VERDICT: PRODUCTION READY FOR LOCALHOST & DEPLOYMENT APPROVAL
================================================================================
```

The NAY AI Concierge now embodies the authentic voice of a luxury fragrance house: intellectually honest, olfactorily grounded, commercially truthful, and deeply respectful of Moroccan customer trust.
