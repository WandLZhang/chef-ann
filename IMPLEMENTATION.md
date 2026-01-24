# Chef Ann Foundation - Commodity Summer Planning Implementation

This repository contains the Gemini 3-powered backend for the Commodity Summer Planning prototype.

## Architecture

The system uses a "Modular RAG" approach where:
1. **Data is decoupled from Logic**: All domain data (commodities, regulations, profiles) lives in standalone JSON files.
2. **Logic is Agent-Driven**: We do NOT hardcode formulas. We give Gemini the data + the goal, and it writes its own Python code to solve it.
3. **Search Grounding**: For real-time data (prices, new regs), the agent can use Google Search.

## Project Structure

```
chef-ann/
├── src/
│   ├── gemini_client.py       # Wrapper for Gemini 3 (Code Exec + Search)
│   └── __init__.py
├── data/                      # MODULAR DATA STORE (Replaceable with DBs)
│   ├── usda_foods_sy26_27.json  # Commodity catalog (Prices, Yields, Pack Sizes)
│   ├── usda_meal_patterns.json  # Nutritional requirements by grade
│   └── district_profile.json    # District-specific settings (Entitlement, ADP)
├── tests/
│   ├── test_commodity_allocation.py   # Beef calculation scenario
│   ├── test_compliance_checker.py     # Menu validation scenario
│   ├── test_budget_analysis.py        # Headroom/Finance scenario
│   └── test_entitlement_tracker.py    # Entitlement spending scenario
└── requirements.txt
```

## Future Database Requirements

When moving to production, the JSON files in `/data` should be replaced by the following database systems:

### 1. Commodity Catalog DB
- **Source**: USDA WBSCM System (Annual update in Dec/Jan)
- **Key Fields**:
  - `wbscm_id` (Primary Key)
  - `description`
  - `pack_size`
  - `estimated_cost` (Needs live update capability)
  - `processing_level` (Raw vs Processed - critical for values-aligned filtering)
  - `yield_factor` (From Food Buying Guide)

### 2. Meal Pattern Rules Engine
- **Source**: USDA FNS Regulations
- **Update Frequency**: Low (every 5-10 years), but critical accuracy
- **Structure**: Nested JSON rules by Grade Group -> Component -> Subgroup

### 3. District Profile DB
- **Source**: User Input / State Agency APIs
- **Fields**:
  - Entitlement Total (Annual)
  - DoD Fresh Allocation %
  - Reimbursement Rates (Federal + State specific)
  - ADP (Average Daily Participation) by grade

### 4. Values-Aligned Vendor DB (New)
- **Purpose**: To recommend local/organic alternatives
- **Fields**:
  - Vendor Name
  - Product Categories
  - Certifications (Organic, GAP, etc.)
  - Distribution Region

## Running Tests

To run the agent-driven test suite:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set API Key
export GEMINI_API_KEY="your_key_here"

# 3. Run specific tests
python tests/test_commodity_allocation.py
python tests/test_compliance_checker.py
python tests/test_budget_analysis.py
python tests/test_entitlement_tracker.py
```
