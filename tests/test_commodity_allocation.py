"""
@file test_commodity_allocation.py
@brief Test script for commodity allocation using Gemini 3 Code Execution

@details This script simulates a user allocating beef commodities.
It loads commodity data from JSON, constructs a prompt for Gemini,
and lets Gemini generate and execute the Python code to perform the calculation.
This tests the agent's ability to "figure out" the math on its own.
"""

import json
import os
import sys

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.gemini_client import run_commodity_query

def load_data():
    """Load commodity data from JSON"""
    data_path = os.path.join(os.path.dirname(__file__), '../data/usda_foods_sy26_27.json')
    with open(data_path, 'r') as f:
        commodities = json.load(f)
    return commodities

def load_fbg_yields():
    """Load official USDA Food Buying Guide yield factors"""
    data_path = os.path.join(os.path.dirname(__file__), '../data/food_buying_guide_yields.json')
    with open(data_path, 'r') as f:
        return json.load(f)

def test_beef_allocation():
    print("\n" + "="*80)
    print("TEST: Commodity Allocation (Agent-Driven Calculation with FBG Yields)")
    print("="*80)

    # Load data
    data = load_data()
    fbg = load_fbg_yields()
    beef_products = data['proteins']['beef']
    
    # Select specific products for the scenario
    # 100158: Beef, Fine Ground (Raw)
    # 110349: Beef, Patties (Raw)
    raw_ground = next(p for p in beef_products if p['wbscm_id'] == '100158')
    raw_patties = next(p for p in beef_products if p['wbscm_id'] == '110349')
    
    # Get official FBG yield factors
    fbg_ground = fbg['beef']['ground_raw_85_15']
    fbg_patties = fbg['beef']['patties_raw']
    
    # Scenario inputs
    allocation_request = {
        "raw_ground_lbs": 3000,
        "raw_patties_lbs": 1000,
        "oz_per_serving": 2.0,
        "cycle_days": 25,
        "annual_meals": 3600000
    }
    
    # Construct prompt with data context (RAG-style) + FBG yields
    prompt = f"""
    I need to calculate the cost and servings for my beef commodity order.
    
    **USDA Commodity Catalog Data:**
    1. {raw_ground['description']} (WBSCM ID: {raw_ground['wbscm_id']})
       - Cost: ${raw_ground['est_cost_per_lb']}/lb
       - Pack: {raw_ground['pack_size']}
       
    2. {raw_patties['description']} (WBSCM ID: {raw_patties['wbscm_id']})
       - Cost: ${raw_patties['est_cost_per_lb']}/lb
       - Pack: {raw_patties['pack_size']}
    
    **USDA Food Buying Guide Yield Factors (OFFICIAL):**
    - Ground Beef 85/15: Yield = {fbg_ground['yield_factor']} ({fbg_ground['notes']})
    - Raw Patties: Yield = {fbg_patties['yield_factor']} ({fbg_patties['notes']})
    
    **My Order:**
    - {allocation_request['raw_ground_lbs']} lbs of Raw Ground Beef
    - {allocation_request['raw_patties_lbs']} lbs of Raw Patties
    
    Please write and execute Python code to calculate:
    1. Total Cost for each item and the grand total
    2. Total Servings for each item using the OFFICIAL FBG yield factors (based on {allocation_request['oz_per_serving']} oz cooked meat per serving)
    3. Number of cases to order for each (round up to nearest whole case)
    4. What % of our {allocation_request['annual_meals']:,} annual meals this covers
    
    Display the results in a clean summary format.
    """
    
    # Execute query
    result = run_commodity_query(
        prompt=prompt,
        enable_code_execution=True,
        enable_search=False, # Pure math, no search needed
        verbose=True
    )
    
    # Basic assertions to ensure code ran
    if not result['code_blocks']:
        print("\n❌ FAILURE: No code was executed by Gemini.")
        sys.exit(1)
        
    print("\n✅ SUCCESS: Gemini generated and executed calculation code.")

if __name__ == "__main__":
    test_beef_allocation()
