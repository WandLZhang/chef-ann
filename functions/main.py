"""
@file main.py
@brief Cloud Function for Chef Ann Commodity Summer Planning

@details Flask-style Cloud Function with SSE streaming for Gemini responses.
Uses functions_framework with manual CORS handling.

@date 2026-01-23
"""

import os
import json
import logging
import time
from pathlib import Path
import functions_framework
from flask import jsonify, request, Response
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Gemini client using Vertex AI
# Project from environment variable (GCP_PROJECT, GOOGLE_CLOUD_PROJECT, or fallback)
GCP_PROJECT = os.environ.get("GCP_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT") or "wz-chef-ann"
GCP_LOCATION = os.environ.get("GCP_LOCATION", "global")  # gemini-3-pro-preview is in 'global' region
MODEL = "gemini-3-pro-preview"

def get_client():
    """Create Gemini client using Vertex AI with application-default credentials."""
    return genai.Client(
        vertexai=True,
        project=GCP_PROJECT,
        location=GCP_LOCATION
    )

# Load data files from local directory
DATA_DIR = Path(__file__).parent / "data"

def load_json(filename: str) -> dict:
    """Load JSON data file."""
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, 'r') as f:
            return json.load(f)
    logger.warning(f"Data file not found: {filepath}")
    return {}

# Pre-load data at cold start
# Comprehensive data is SOURCE OF TRUTH (extracted from USDA Product Info Sheet PDFs)
COMMODITIES_COMPREHENSIVE = load_json("usda_foods_comprehensive.json")
COMMODITIES_LEGACY = load_json("usda_foods_sy26_27.json")  # Legacy - only used for est_cost_per_lb
MEAL_PATTERNS = load_json("usda_meal_patterns.json")
DISTRICT_PROFILE = load_json("district_profile.json")
FBG_YIELDS = load_json("food_buying_guide_yields.json")

# Build cost lookup from legacy data (only thing legacy has that comprehensive doesn't)
def _build_cost_lookup(legacy_data: dict) -> dict:
    """Build WBSCM ID → est_cost_per_lb lookup from legacy data."""
    lookup = {}
    def _extract(obj):
        if isinstance(obj, list):
            for item in obj:
                _extract(item)
        elif isinstance(obj, dict):
            if 'wbscm_id' in obj and 'est_cost_per_lb' in obj:
                lookup[str(obj['wbscm_id'])] = obj['est_cost_per_lb']
            else:
                for v in obj.values():
                    _extract(v)
    _extract(legacy_data)
    return lookup

COST_LOOKUP = _build_cost_lookup(COMMODITIES_LEGACY)
logger.info(f"Built cost lookup with {len(COST_LOOKUP)} entries")

# Category mapping: frontend route slug → comprehensive JSON category key(s)
# Verified from comprehensive JSON: beans(16), beef(10), cheese(14), dairy(4),
# eggs(3), fish(2), fruits(34), grains(17), other(2), pork(6), poultry(16), vegetables(37)
CATEGORY_MAP = {
    'beef': ['beef'],
    'poultry': ['poultry'],
    'pork': ['pork'],
    'fish': ['fish'],
    'vegetables': ['vegetables'],
    'fruits': ['fruits'],
    'grains': ['grains'],
    'dairy': ['dairy', 'cheese', 'eggs'],  # Merge yogurts + cheeses + eggs
    'legumes': ['beans'],
}

# Default cost estimates by category ($/lb, used when no legacy match exists)
DEFAULT_COST_PER_LB = {
    'beef': 3.25, 'poultry': 2.10, 'pork': 2.15, 'fish': 2.80,
    'cheese': 3.80, 'dairy': 3.50, 'eggs': 2.00,
    'vegetables': 1.20, 'fruits': 1.50, 'grains': 0.65,
    'beans': 0.55, 'other': 2.00,
}

def cors_headers():
    """Return CORS headers for all responses."""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '3600'
    }


def stream_gemini(prompt: str, enable_code_execution: bool = True):
    """
    Stream Gemini response as SSE events.
    Yields: data: {"type": "text|code|result|done", "data": ...}
    """
    client = get_client()
    
    tools = []
    if enable_code_execution:
        tools.append(types.Tool(code_execution=types.ToolCodeExecution))
    
    config = types.GenerateContentConfig(
        tools=tools if tools else None,
    )
    
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]
    
    result = {'text': '', 'code_blocks': [], 'code_results': []}
    
    try:
        for chunk in client.models.generate_content_stream(
            model=MODEL,
            contents=contents,
            config=config,
        ):
            if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
                continue
            
            for part in chunk.candidates[0].content.parts:
                if part.text:
                    result['text'] += part.text
                    yield f'data: {json.dumps({"type": "text", "data": part.text})}\n\n'
                
                if part.executable_code:
                    code = part.executable_code.code
                    result['code_blocks'].append(code)
                    yield f'data: {json.dumps({"type": "code", "data": code})}\n\n'
                
                if part.code_execution_result:
                    output = part.code_execution_result.output
                    outcome = str(part.code_execution_result.outcome)
                    result['code_results'].append({'output': output, 'outcome': outcome})
                    yield f'data: {json.dumps({"type": "result", "data": {"output": output, "outcome": outcome}})}\n\n'
        
        yield f'data: {json.dumps({"type": "done", "data": result})}\n\n'
        
    except Exception as e:
        logger.error(f"Gemini error: {str(e)}")
        yield f'data: {json.dumps({"type": "error", "data": str(e)})}\n\n'


def enrich_commodity(commodity: dict) -> dict:
    """Enrich a commodity from usda_foods_sy26_27 with comprehensive data.
    
    Merges in servings_per_case, case_weight_lbs, serving_size_oz, cn_credit_oz,
    cn_credit_category, pack_size_description, and source_url from 
    usda_foods_comprehensive.json so the frontend has accurate USDA Product 
    Info Sheet data for display (instead of falling back to estimates).
    """
    comprehensive_products = COMMODITIES_COMPREHENSIVE.get('all_products', [])
    wbscm_id = str(commodity.get('wbscm_id', ''))
    match = next((c for c in comprehensive_products if str(c.get('wbscm_id', '')) == wbscm_id), None)
    if match:
        enriched = dict(commodity)
        # Add fields from comprehensive data that the frontend needs
        for field in ['case_weight_lbs', 'servings_per_case', 'serving_size_oz',
                      'cn_credit_oz', 'cn_credit_category', 'pack_size_description', 'source_url']:
            if field in match and match[field] is not None:
                enriched[field] = match[field]
        return enriched
    return commodity


def enrich_commodity_list(commodities: list) -> list:
    """Enrich a list of commodities with comprehensive data."""
    return [enrich_commodity(c) for c in commodities]


def _add_cost_to_product(product: dict) -> dict:
    """Add est_cost_per_lb to a comprehensive product from legacy cost lookup."""
    enriched = dict(product)
    wbscm_id = str(product.get('wbscm_id', ''))
    if wbscm_id in COST_LOOKUP:
        enriched['est_cost_per_lb'] = COST_LOOKUP[wbscm_id]
    else:
        cat = product.get('category', 'other')
        enriched['est_cost_per_lb'] = DEFAULT_COST_PER_LB.get(cat, 2.00)
    # Derive caf_recommended from processing_level
    enriched['caf_recommended'] = product.get('processing_level', 'processed') == 'raw'
    return enriched


def handle_commodities(category=None):
    """Handle /api/commodities endpoints.
    
    Serves directly from usda_foods_comprehensive.json (source of truth).
    Maps frontend route slugs to comprehensive JSON categories via CATEGORY_MAP.
    Adds est_cost_per_lb from legacy data and derives caf_recommended from processing_level.
    """
    comprehensive_cats = COMMODITIES_COMPREHENSIVE.get('products_by_category', {})
    
    if category:
        if category in CATEGORY_MAP:
            # Merge products from all mapped comprehensive categories
            items = []
            for comp_cat in CATEGORY_MAP[category]:
                items.extend(comprehensive_cats.get(comp_cat, []))
            # Add cost data and caf_recommended
            items = [_add_cost_to_product(p) for p in items]
            logger.info(f"Serving {len(items)} products for category '{category}'")
            return jsonify(items), 200, cors_headers()
        else:
            return jsonify({"error": f"Category '{category}' not found. Valid: {list(CATEGORY_MAP.keys())}"}), 404, cors_headers()
    
    # Return all categories summary
    summary = {slug: len(sum([comprehensive_cats.get(c, []) for c in comp_cats], []))
                for slug, comp_cats in CATEGORY_MAP.items()}
    return jsonify(summary), 200, cors_headers()


def extract_all_commodities(data: dict) -> list:
    """
    Recursively extract all commodity items from nested data structure.
    Handles structures like:
    - proteins: {beef: [...], poultry: [...]}
    - vegetables: {dark_green: [...], red_orange: [...]}
    - grains: {single object with wbscm_id}
    """
    commodities = []
    
    if isinstance(data, list):
        # It's already a list of commodities
        commodities.extend(data)
    elif isinstance(data, dict):
        # Check if this dict IS a commodity (has wbscm_id)
        if 'wbscm_id' in data:
            commodities.append(data)
        else:
            # It's a nested structure, recurse into values
            for value in data.values():
                commodities.extend(extract_all_commodities(value))
    
    return commodities


def handle_stream_allocate(data):
    """Handle streaming allocation calculation.
    
    Now accepts quantity_cases (number of cases) instead of quantity_lbs.
    Uses servings_per_case from USDA Product Info Sheets for accurate serving counts.
    """
    commodity_type = data.get('commodity_type', 'beef')
    items = data.get('items', [])
    oz_per_serving = data.get('oz_per_serving', 2.0)
    annual_meals = data.get('annual_meals', 3397500)
    
    # Use comprehensive data if available (has servings_per_case from USDA Product Sheets)
    comprehensive_products = COMMODITIES_COMPREHENSIVE.get('all_products', [])
    legacy_commodities = extract_all_commodities(COMMODITIES_LEGACY)
    
    logger.info(f"Comprehensive data: {len(comprehensive_products)} products")
    logger.info(f"Legacy data: {len(legacy_commodities)} commodities")
    
    items_data = []
    for item in items:
        wbscm_id = str(item.get('wbscm_id', ''))
        # Frontend now sends quantity as cases, but support both for backwards compatibility
        quantity_cases = item.get('quantity_cases', item.get('quantity_lbs', 0))
        
        # First try comprehensive data (has servings_per_case)
        commodity = next((c for c in comprehensive_products if str(c.get('wbscm_id', '')) == wbscm_id), None)
        
        if commodity:
            # Use USDA Product Info Sheet data with servings_per_case
            case_weight = commodity.get('case_weight_lbs', 40)
            servings_per_case = commodity.get('servings_per_case')
            
            items_data.append({
                "wbscm_id": wbscm_id,
                "description": commodity.get('description', 'Unknown'),
                "quantity_cases": quantity_cases,
                "case_weight_lbs": case_weight,
                "quantity_lbs": quantity_cases * case_weight,
                "servings_per_case": servings_per_case,
                "serving_size_oz": commodity.get('serving_size_oz', 2.0),
                "cn_credit_oz": commodity.get('cn_credit_oz', 2.0),
                "est_cost_per_lb": commodity.get('est_cost_per_lb', 3.0),  # Default if not in comprehensive
                "yield_factor": commodity.get('yield_factor', 0.75),
                "source": "usda_product_sheet"
            })
        else:
            # Fallback to legacy data
            legacy = next((c for c in legacy_commodities if str(c.get('wbscm_id', '')) == wbscm_id), None)
            if legacy:
                case_weight = 40  # Default case weight
                items_data.append({
                    "wbscm_id": wbscm_id,
                    "description": legacy.get('description', 'Unknown'),
                    "quantity_cases": quantity_cases,
                    "case_weight_lbs": case_weight,
                    "quantity_lbs": quantity_cases * case_weight,
                    "servings_per_case": None,  # Will calculate from yield
                    "est_cost_per_lb": legacy.get('est_cost_per_lb', 3.0),
                    "yield_factor": legacy.get('yield_factor', 0.75),
                    "source": "legacy_estimate"
                })
            else:
                logger.warning(f"Commodity not found in any data source: {wbscm_id}")
    
    if not items_data:
        def error_gen():
            yield f'data: {json.dumps({"type": "error", "data": "No valid commodities found"})}\n\n'
        return Response(error_gen(), mimetype='text/event-stream', headers=cors_headers())
    
    prompt = f"""
Calculate commodity allocation for this order.

**Items with USDA Product Sheet Data:**
{json.dumps(items_data, indent=2)}

**Parameters:**
- Default serving size: {oz_per_serving} oz cooked meat per serving
- Annual meals: {annual_meals:,}

Using Python code execution, calculate for EACH item:

1. **Total Cost**: quantity_lbs × est_cost_per_lb
2. **Number of Cases**: quantity_cases (already provided)
3. **Number of Servings**:
   - If servings_per_case is available (from USDA Product Sheet): cases × servings_per_case
   - If servings_per_case is null: Calculate as (quantity_lbs × 16 × yield_factor) ÷ serving_size_oz

Then calculate:
- Grand total cost
- Grand total servings
- Percentage of annual meals covered (total_servings / annual_meals × 100)

IMPORTANT: Use servings_per_case when available - it's the accurate count from USDA Product Info Sheets.

Print results as JSON:
{{
    "items": [{{"wbscm_id": "...", "description": "...", "cost": 0.00, "cases": 0, "servings": 0}}],
    "total_cost": 0.00,
    "total_servings": 0,
    "meal_coverage_pct": 0.0
}}
"""
    
    headers = cors_headers()
    headers['Content-Type'] = 'text/event-stream'
    headers['Cache-Control'] = 'no-cache'
    headers['Connection'] = 'keep-alive'
    
    return Response(stream_gemini(prompt, enable_code_execution=True), mimetype='text/event-stream', headers=headers)


def handle_stream_compliance(data):
    """Handle streaming compliance check."""
    week_menu = data.get('week_menu', {})
    grade_group = data.get('grade_group', 'elementary')
    
    meal_requirements = MEAL_PATTERNS.get(grade_group, MEAL_PATTERNS.get("elementary", {}))
    
    prompt = f"""
Check this weekly menu for USDA meal pattern compliance:

**Menu:**
{json.dumps(week_menu, indent=2)}

**Requirements for {grade_group}:**
{json.dumps(meal_requirements, indent=2)}

Using Python code execution:
1. Sum the nutritional components for the week
2. Compare against minimum/maximum requirements
3. Identify any deficits or excesses

Return JSON:
{{
    "is_compliant": true/false,
    "issues": [{{"component": "...", "required": 0, "actual": 0, "deficit": 0}}],
    "suggestions": ["..."]
}}
"""
    
    headers = cors_headers()
    headers['Content-Type'] = 'text/event-stream'
    headers['Cache-Control'] = 'no-cache'
    
    return Response(stream_gemini(prompt, enable_code_execution=True), mimetype='text/event-stream', headers=headers)


def handle_stream_budget(data):
    """Handle streaming budget analysis."""
    total_spend = data.get('total_commodity_spend', 185000)
    annual_meals = data.get('total_annual_meals', 3397500)
    other_food = data.get('other_food_cost_per_meal', 0.65)
    labor = data.get('labor_overhead_per_meal', 1.50)
    
    rates = DISTRICT_PROFILE.get("reimbursement_rates", {})
    demographics = DISTRICT_PROFILE.get("demographics", {})
    
    prompt = f"""
Calculate budget headroom for values-aligned upgrades.

**District Profile:**
- Reimbursement Rates: {json.dumps(rates)}
- Demographics: {json.dumps(demographics)}

**Costs:**
- Total Commodity Spend: ${total_spend:,.2f}
- Annual Meals: {annual_meals:,}
- Non-Commodity Food: ${other_food}/meal
- Labor & Overhead: ${labor}/meal

Using Python, calculate:
1. Weighted Average Reimbursement Rate
2. Commodity Cost per Meal
3. Total Food Cost per Meal
4. Food Cost as % of Reimbursement (target: 40-50%)
5. Total Plate Cost
6. Budget Headroom (Reimbursement - Plate Cost)
7. Annual Upgrade Budget

Print JSON results.
"""
    
    headers = cors_headers()
    headers['Content-Type'] = 'text/event-stream'
    headers['Cache-Control'] = 'no-cache'
    
    return Response(stream_gemini(prompt, enable_code_execution=True), mimetype='text/event-stream', headers=headers)


def handle_stream_entitlement(data):
    """Handle streaming entitlement tracking."""
    allocations = data.get('allocations', {})
    total_entitlement = DISTRICT_PROFILE.get('total_entitlement', 485000)
    annual_meals = DISTRICT_PROFILE.get('total_annual_meals', 3397500)
    
    prompt = f"""
Audit USDA Entitlement spending.

**District:**
- Total Entitlement: ${total_entitlement:,}
- Annual Meals: {annual_meals:,}
- DoD Fresh: 20%

**Allocations:**
{json.dumps(allocations, indent=2)}

Using Python, calculate:
1. Total Allocated
2. Remaining Balance
3. Utilization % (warn if <98%)
4. DoD Fresh vs Brown Box split
5. Commodity Cost per Meal
6. Commodity % of Total Food (target: 15-20%)

Print JSON results.
"""
    
    headers = cors_headers()
    headers['Content-Type'] = 'text/event-stream'
    headers['Cache-Control'] = 'no-cache'
    
    return Response(stream_gemini(prompt, enable_code_execution=True), mimetype='text/event-stream', headers=headers)


def handle_stream_chat(data):
    """Handle streaming chat."""
    message = data.get('message', '')
    context = data.get('context', '')
    enable_code = data.get('enable_code_execution', True)
    
    system = f"""
You are a helpful assistant for school food directors using Chef Ann Foundation's
Commodity Summer Planning tool. Help with:
- Values-aligned food choices (whole muscle proteins, scratch cooking)
- USDA commodity allocation
- Menu planning and compliance
- Budget optimization

{context}
"""
    
    prompt = f"{system}\n\nUser: {message}"
    
    headers = cors_headers()
    headers['Content-Type'] = 'text/event-stream'
    headers['Cache-Control'] = 'no-cache'
    
    return Response(stream_gemini(prompt, enable_code_execution=enable_code), mimetype='text/event-stream', headers=headers)


@functions_framework.http
def main(request):
    """Main Cloud Function entry point."""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return ('', 204, cors_headers())
    
    path = request.path
    method = request.method
    
    logger.info(f"Request: {method} {path}")
    
    try:
        # Health check
        if path == '/' or path == '':
            return jsonify({
                "status": "healthy",
                "service": "Chef Ann Commodity Planning API",
                "version": "1.0.0"
            }), 200, cors_headers()
        
        # Static data endpoints
        if path == '/api/commodities':
            return handle_commodities()
        
        if path.startswith('/api/commodities/'):
            category = path.split('/api/commodities/')[-1].strip('/')
            return handle_commodities(category)
        
        if path == '/api/district-profile':
            return jsonify(DISTRICT_PROFILE), 200, cors_headers()
        
        if path == '/api/meal-patterns':
            return jsonify(MEAL_PATTERNS), 200, cors_headers()
        
        # Streaming endpoints (POST)
        if method == 'POST':
            data = request.get_json() or {}
            
            if path == '/api/stream/allocate':
                return handle_stream_allocate(data)
            
            if path == '/api/stream/compliance':
                return handle_stream_compliance(data)
            
            if path == '/api/stream/budget':
                return handle_stream_budget(data)
            
            if path == '/api/stream/entitlement':
                return handle_stream_entitlement(data)
            
            if path == '/api/stream/chat':
                return handle_stream_chat(data)
        
        # 404
        return jsonify({"error": f"Not found: {path}"}), 404, cors_headers()
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500, cors_headers()
