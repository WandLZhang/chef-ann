"""
@file test_entitlement_tracker.py
@brief Test script for entitlement utilization tracking

@details This script asks Gemini to track entitlement spending across categories
(DoD Fresh vs Brown Box) and flag any under-utilization risks based on a
target utilization rate (e.g., 98%).
"""

import json
import os
import sys

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.gemini_client import run_commodity_query

def load_profile():
    """Load district profile data"""
    data_path = os.path.join(os.path.dirname(__file__), '../data/district_profile.json')
    with open(data_path, 'r') as f:
        return json.load(f)

def test_entitlement_tracking():
    print("\n" + "="*80)
    print("TEST: Entitlement Utilization Tracker (Agent-Driven Calculation)")
    print("="*80)

    # Load district profile
    profile = load_profile()
    
    # Scenario: Allocated amounts so far
    allocations = {
        "proteins": 33650,
        "vegetables": 45000,
        "fruits": 52000,
        "grains": 15000,
        "cheese": 35000,
        "dod_fresh": 97000, # 20% of 485k
        "other": 200850
    }
    
    # Additional context for commodity % calculation
    annual_meals = profile['total_annual_meals']
    other_food_cost_per_meal = 0.65  # Non-commodity food cost
    
    # Construct prompt with commodity % of total food
    prompt = f"""
    I need to audit my USDA Entitlement spending to ensure I'm using all my funds.
    
    **IMPORTANT CONTEXT:**
    - USDA Foods (commodities) typically make up 15-20% of products served in school lunch programs
    - If commodities represent less than 15% of total food cost, you may be under-utilizing your entitlement
    
    District Profile:
    - Total Entitlement: ${profile['total_entitlement']:,}
    - DoD Fresh Allocation: {profile['dod_fresh_allocation_pct']:.0%} (${profile['total_entitlement'] * profile['dod_fresh_allocation_pct']:,})
    - Annual Meals Served: {annual_meals:,}
    - Non-Commodity Food Cost: ${other_food_cost_per_meal}/meal
    
    Current Allocations:
    {json.dumps(allocations, indent=2)}
    
    Please write and execute Python code to:
    1. Sum up all allocations
    2. Calculate remaining balance (Total Entitlement - Total Allocated)
    3. Calculate Utilization Percentage
    4. Flag if utilization is below 98% (Warning threshold)
    5. Breakdown the split between DoD Fresh vs "Brown Box" (everything else)
    6. Calculate Commodity Cost per Meal (Total Allocated / Annual Meals)
    7. Calculate Total Food Cost per Meal (Commodity + Non-Commodity)
    8. Calculate what % of Total Food Cost comes from Commodities
    9. Compare this % against the 15-20% industry benchmark
    
    Display the results in a summary block with the commodity % analysis.
    """
    
    # Execute
    result = run_commodity_query(
        prompt=prompt,
        enable_code_execution=True,
        enable_search=False,
        verbose=True
    )
    
    if not result['code_blocks']:
        print("\n❌ FAILURE: No code was executed by Gemini.")
        sys.exit(1)
        
    print("\n✅ SUCCESS: Gemini tracked the entitlement utilization.")

if __name__ == "__main__":
    test_entitlement_tracking()
