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

# Initialize Gemini client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL = "gemini-3-pro-preview"

def get_client():
    """Create Gemini client."""
    return genai.Client(api_key=GEMINI_API_KEY)

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
COMMODITIES = load_json("usda_foods_sy26_27.json")
MEAL_PATTERNS = load_json("usda_meal_patterns.json")
DISTRICT_PROFILE = load_json("district_profile.json")
FBG_YIELDS = load_json("food_buying_guide_yields.json")


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


def handle_commodities(category=None):
    """Handle /api/commodities endpoints.
    
    Data structure:
    - proteins: {beef: [...], poultry: [...], pork: [...], fish: [...]}
    - vegetables: [...]
    - fruits: [...]
    - grains: [...]
    - dairy: [...]
    - legumes: [...]
    """
    if category:
        # Check if it's a protein subcategory (beef, poultry, pork, fish)
        if category in COMMODITIES.get("proteins", {}):
            return jsonify(COMMODITIES["proteins"].get(category, [])), 200, cors_headers()
        # Check if it's a top-level category (vegetables, fruits, grains, dairy, legumes)
        elif category in COMMODITIES:
            data = COMMODITIES.get(category, [])
            # If it's proteins, return the whole nested structure
            if isinstance(data, dict):
                return jsonify(data), 200, cors_headers()
            # Otherwise return the array
            return jsonify(data), 200, cors_headers()
        else:
            return jsonify({"error": f"Category '{category}' not found"}), 404, cors_headers()
    return jsonify(COMMODITIES), 200, cors_headers()


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
    """Handle streaming allocation calculation."""
    commodity_type = data.get('commodity_type', 'beef')
    items = data.get('items', [])
    oz_per_serving = data.get('oz_per_serving', 2.0)
    annual_meals = data.get('annual_meals', 3397500)
    
    # Find commodity data for selected items - search ALL categories
    all_commodities = extract_all_commodities(COMMODITIES)
    logger.info(f"Found {len(all_commodities)} total commodities across all categories")
    
    items_data = []
    for item in items:
        wbscm_id = item.get('wbscm_id')
        commodity = next((c for c in all_commodities if c.get('wbscm_id') == wbscm_id), None)
        if commodity:
            items_data.append({**commodity, "quantity_lbs": item.get("quantity_lbs", 0)})
        else:
            logger.warning(f"Commodity not found in data: {wbscm_id}")
    
    if not items_data:
        def error_gen():
            yield f'data: {json.dumps({"type": "error", "data": "No valid commodities found"})}\n\n'
        return Response(error_gen(), mimetype='text/event-stream', headers=cors_headers())
    
    prompt = f"""
Calculate commodity allocation for this order:

**Items:**
{json.dumps(items_data, indent=2)}

**Yield Factors:**
{json.dumps(FBG_YIELDS, indent=2)}

**Parameters:**
- Serving size: {oz_per_serving} oz cooked meat per serving
- Annual meals: {annual_meals:,}

Using Python code execution, calculate for each item:
1. Total cost (quantity_lbs × est_cost_per_lb)
2. Number of cases (quantity_lbs ÷ case weight, rounded up)
3. Total cooked ounces (quantity_lbs × 16 × yield_factor)
4. Number of servings (cooked_oz ÷ oz_per_serving)

Then calculate:
- Grand total cost
- Grand total servings
- Percentage of annual meals covered

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
