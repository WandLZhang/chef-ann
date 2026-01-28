# Commodity Summer Planning: UX Storyboard & Tech Specs

**Project Goal:**  
To transform the "summer spreadsheet slog" into avalues-driven, visual, and highly efficient planning experience. This interface leverages Gemini 3 Code Execution for backend logic and Iron Hill-inspired animations for a premium frontend feel.

## 🎨 Design Philosophy: "Values in Motion"

Inspired by **Iron Hill (ironhill.au)**, the UI will feature:
*   **Cinematic Loading:** "Slot machine" style counters for data loading.
*   **Glassmorphism:** Soft, blurred backgrounds (Material 3/Apple Vision Pro aesthetic).
*   **Physics-Based Motion:** Elements sway and skew slightly based on scroll velocity (GSAP).
*   **Seamless Transitions:** No hard page reloads; "curtain" wipes or cross-fades.
*   **Typography:** Clean, editorial sans-serif (e.g., PP Woodland or GT America equivalent).

---

## 🛠 Tech Stack Recommendations

### Frontend (The "Iron Hill" Feel)
*   **Framework:** **Next.js 14** (React) or **Nuxt 3** (Vue) - for SSR and fast transitions.
*   **Animation Engine:** **GSAP (GreenSock)** - The industry standard for complex timelines.
    *   `ScrollTrigger`: For scroll-linked effects.
    *   `SplitText`: For staggered text reveals.
*   **Smooth Scroll:** **Lenis** (lighter than Locomotive Scroll, modern standard).
*   **3D Effects:** **Three.js** / **React Three Fiber** (for the displacement/distortion effects on images).
*   **Styling:** **Tailwind CSS** (for layout) + **SASS** (for complex transforms).

### Backend (The "Gemini" Brain)
*   **Logic:** **Gemini 3** (via Vertex AI / Google AI Studio).
    *   *Capability:* Code Execution (Python) for all math.
    *   *Capability:* Search Grounding for real-time prices/yields.
*   **Data:** JSON/SQL database for Commodities, Meal Patterns, and District Profiles.

---

## 📱 Screen 1: The "Cinematic" Splash

*A visual introduction that sets the tone. Not just a login screen.*

**Visuals:**
*   **Background:** High-quality video loop of fresh produce (slow motion water droplets on kale).
*   **Overlay:** Glass-effect card centered.
*   **Motion:** Background skews slightly as mouse moves (parallax).

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  [Logo: Chef Ann Foundation]                             [About] [?]  |
|                                                                       |
|            .---------------------------------------------.            |
|            |                                             |            |
|            |   COMMODITY SUMMER PLANNING                 |            |
|            |                                             |            |
|            |   Plan your SY 2026-27 entitlement with     |            |
|            |   values, precision, and speed.             |            |
|            |                                             |            |
|            |   [  Enter District Portal  ] ->            |            |
|            |   (Hover: Button fills with liquid anim)    |            |
|            |                                             |            |
|            '---------------------------------------------'            |
|                                                                       |
|   < Scrolled Text: "Fresh • Whole • Local • Scratch Cooked" >         |
'-----------------------------------------------------------------------'
```

**Animations:**
1.  **Load:** Counter counts up `0% -> 100%` (slot machine style).
2.  **Reveal:** "Curtain" lifts to reveal the glass card.
3.  **Interaction:** Magnetic button effect (button moves towards cursor).

---

## 📱 Screen 2: District Onboarding (Smart Form)

*One-time setup. Feels like a conversation, not a tax return.*

**Visuals:**
*   **Layout:** Split screen. Left: Questions. Right: Dynamic visualization of the district.
*   **Motion:** As user answers, the "District House" on the right builds itself (add kitchen equipment -> icons appear).

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  < Back                                          Step 3 of 4: Kitchen |
|-----------------------------------------------------------------------|
|  QUESTION:                                |  YOUR VIRTUAL KITCHEN     |
|                                           |                           |
|  What equipment do you have?              |      .---.                |
|  (We'll filter foods based on this)       |     /     \               |
|                                           |    |  O O  |              |
|  [x] Combi Ovens  (Selected: Glows)       |    | [===] | Combi        |
|  [ ] Tilt Skillets                        |    '-------'              |
|  [x] Steam Kettles                        |                           |
|  [ ] Robot Coupe                          |      \___/                |
|                                           |      |___|   Kettle       |
|                                           |                           |
|  SCRATCH POTENTIAL SCORE:                 |                           |
|  [==========o---------] 65%               |                           |
|  "You're ready for raw proteins!"         |                           |
|                                           |                           |
|                  [  Next Step  ] ->       |                           |
'-----------------------------------------------------------------------'
```

**Backend Logic:**
*   Saves to `district_profile.json`.
*   Gemini uses this to filter `usda_foods_sy26_27.json` (e.g., if no grinder, don't show raw beef roasts).

---

## 📱 Screen 3: Commodity Allocation (The Core)

*The main workspace. Highly visual, drag-and-drop feel.*

**Visuals:**
*   **Header:** "Entitlement Tracker" bar that fills up like a fluid gauge.
*   **Grid:** "Values-Aligned" vs "Processed" columns.
*   **Micro-interactions:** Hovering over a card shows a "nutrition quick view" popup.

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  ENTITLEMENT: $485,000  |  SPENT: $13,150  |  REMAINING: $471,850     |
|  [||||||............................................................] |
|   (Fluid animation: Liquid waves inside the progress bar)             |
|-----------------------------------------------------------------------|
|  FILTER: [ All ] [ Beef ] [ Poultry ] [ Produce ]                     |
|                                                                       |
|  COLUMN A: ⭐ VALUES-ALIGNED              COLUMN B: ⚠️ PROCESSED      |
|  (Green Tint / Halo)                      (Grey / Muted)              |
|                                                                       |
|  .-----------------------.                .-----------------------.   |
|  | BEEF, GROUND, RAW     |                | BEEF PATTIES (SOY)    |   |
|  | [Img: Fresh Beef]     |                | [Img: Frozen Box]     |   |
|  | ID: 100158            |                | ID: 110322            |   |
|  | $3.25/lb | 40lb Case  |                | $2.90/lb | 40lb Case  |   |
|  |                       |   < VS >       |                       |   |
|  | [ -  75  + ] Cases    |                | [ -  0   + ] Cases    |   |
|  | = $9,750              |                | = $0                  |   |
|  '-----------------------'                '-----------------------'   |
|                                                                       |
|  GEMINI INSIGHT:                                                      |
|  "Choosing Column A gives you 24k clean servings. Cost diff: +$0.04"  |
'-----------------------------------------------------------------------'
```

**Backend Logic (Tested in `test_commodity_allocation.py`):**
*   Gemini Code Exec calculates: `(Cases * Weight * Yield) / ServingSize`.
*   Uses **FBG Yield Factors** dynamically.
*   Updates "Entitlement Tracker" in real-time.

---

## 📱 Screen 4: Menu Cycle & Compliance

*Verifying the plan against USDA rules. The "Calendar" view.*

**Visuals:**
*   **Layout:** Horizontal scrolling 5-week calendar.
*   **Indicators:** "Traffic Lights" for compliance (Red/Yellow/Green dots).
*   **Motion:** Dragging a commodity "pill" onto a day snaps it into place with a spring animation.

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  MENU CYCLE: WEEK 1                      [ < Prev ] [ Week 1 ] [ Next > ] |
|-----------------------------------------------------------------------|
|        | MON          | TUE          | WED          | THU             |
|--------+--------------+--------------+--------------+-----------------|
| ENTREE | Beef Tacos   | Bean Burrito | Chx Fajitas  | Pork Carnitas   |
|        | (Raw Ground) | (Canned Blk) | (Raw Strips) | (Roast)         |
|        |              |              |              |                 |
| VEG    | Corn         | Carrots      | Peppers      | Sweet Potato    |
|        |              |              |              |                 |
|--------+--------------+--------------+--------------+-----------------|
| STATUS | [✓]          | [!] Warn     | [✓]          | [✓]             |
|-----------------------------------------------------------------------|
|                                                                       |
|  ⚠️ COMPLIANCE ALERT (Gemini):                                        |
|  "Week 1 is short on Red/Orange Veg (-0.25 cups).                     |
|   Suggestion: Add baby carrots to Tuesday."                           |
|   [ Auto-Fix ]  [ Ignore ]                                            |
'-----------------------------------------------------------------------'
```

**Backend Logic (Tested in `test_compliance_checker.py`):**
*   Gemini checks weekly totals against `usda_meal_patterns.json`.
*   Identifies specific subgroups (Red/Orange, Dark Green) deficits.

---

## 📱 Screen 5: Cost Analysis & "Headroom"

*The financial dashboard. Showing where money can be moved.*

**Visuals:**
*   **Hero Metric:** "Budget Headroom" displayed as a large, animated number.
*   **Interactive:** "What If" sliders. Sliding "Scratch Cooking" up lowers food cost and raises headroom.

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  FINANCIAL HEALTH CHECK                                               |
|                                                                       |
|  REIMBURSEMENT RATE (Weighted Avg): $4.05                             |
|  -------------------------------------------------------------------  |
|                                                                       |
|  PLATE COST BREAKDOWN:                                                |
|  [======================] $0.70  Food (17%)                           |
|  [===========================] $1.50  Labor (37%)                     |
|  [==============] $0.50  Overhead (12%)                               |
|                                                                       |
|  REMAINING HEADROOM:                                                  |
|  $1.35 / meal                                                         |
|  (Animated ticker: $1.30... $1.34... $1.35!)                          |
|                                                                       |
|  -------------------------------------------------------------------  |
|  💡 INVESTMENT OPPORTUNITIES (Gemini):                                |
|                                                                       |
|  1. [ Organic Apples ]  Cost: $0.02/meal  [ Apply ]                   |
|  2. [ Grass-Fed Beef ]  Cost: $0.04/meal  [ Apply ]                   |
|  3. [ Compostables   ]  Cost: $0.05/meal  [ Apply ]                   |
'-----------------------------------------------------------------------'
```

**Backend Logic (Tested in `test_budget_analysis.py`):**
*   Calculates `Reimbursement - (Food + Labor + Overhead)`.
*   Identifies if Food Cost % is within 40-50% benchmark.

---

## 📱 Screen 6: Export & Search Grounding

*Finalizing the order and double-checking facts.*

**Visuals:**
*   **List View:** Clean, printable summary.
*   **Verification:** Small "Verified by Google Search" badges next to volatile prices/yields.

**ASCII Mockup:**
```text
.-----------------------------------------------------------------------.
|  FINAL ORDER SUMMARY                                [ Download CSV ]  |
|-----------------------------------------------------------------------|
|  ITEM                     | QTY   | COST     | YIELD SOURCE           |
|---------------------------+-------+----------+------------------------|
|  Beef, Ground (100158)    | 75 cs | $9,750   | [G] FBG 2026 Verified  |
|  Chicken, Cut-up (111361) | 125 bg| $9,250   | [G] FBG 2026 Verified  |
|  Apples, Empire (100517)  | 200 cs| $6,000   | [G] DoD Catalog Live   |
|---------------------------+-------+----------+------------------------|
|  TOTAL                    |       | $25,000  |                        |
'-----------------------------------------------------------------------'
```

**Backend Logic (Tested in `test_search_grounding.py`):**
*   Gemini uses Google Search to confirm latest prices or yield factors if local JSON is stale.

---

## 🚀 Implementation Plan

1.  **Phase 1: Project Setup**
    *   Initialize Next.js project.
    *   Configure Tailwind & GSAP.
    *   Set up Python bridge (FastAPI or Next.js API Routes calling Python scripts).

2.  **Phase 2: Core Components**
    *   Build "Glass Card" component.
    *   Build "Fluid Progress Bar" component.
    *   Implement "Slot Machine" counter.

3.  **Phase 3: Integration**
    *   Connect "Allocation" screen to `test_commodity_allocation.py`.
    *   Connect "Compliance" screen to `test_compliance_checker.py`.

4.  **Phase 4: Polish**
    *   Add Iron Hill-style scroll skewing.
    *   Add page transition "curtains".
    *   Finalize mobile responsiveness.
