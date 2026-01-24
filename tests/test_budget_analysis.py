"""
@file test_budget_analysis.py
@brief Test script for budget analysis and headroom calculation

@details This script provides Gemini with district financial data and USDA
reimbursement rates. Gemini must calculate the "budget headroom" available
for values-aligned upgrades (e.g., organic produce, grass-fed beef).
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

def test_budget_headroom():
    print("\n" + "="*80)
    print("TEST: Budget Headroom Analysis (Agent-Driven Calculation)")
    print("="*80)

    # Load district profile
    profile = load_profile()
    
    # Scenario inputs
    scenario = {
        "total_commodity_cost": 185000,
        "other_food_cost_per_meal": 0.65,
        "labor_overhead_per_meal": profile['labor_overhead_per_meal'],
        "annual_meals": profile['total_annual_meals']
    }
    
    # Extract rates and certifications
    rates = profile['reimbursement_rates']
    certs = profile.get('district_certifications', {})
    
    # Calculate effective rates based on certifications
    pbr_addon = rates['performance_based_addon'] if certs.get('performance_based_reimbursement') else 0
    severe_addon = rates['severe_need_addon'] if certs.get('severe_need_eligible') else 0
    
    effective_rates = {
        "free_lunch": rates['free_lunch_base'] + pbr_addon + severe_addon,
        "reduced_lunch": rates['reduced_lunch_base'] + pbr_addon + severe_addon,
        "paid_lunch": rates['paid_lunch_base'] + pbr_addon + severe_addon
    }
    
    # Construct prompt with 40-50% benchmark
    prompt = f"""
    I need to calculate my "Budget Headroom" - the amount of money I have left per meal
    to invest in higher quality, values-aligned ingredients.
    
    **IMPORTANT INDUSTRY BENCHMARK:** 
    - School food programs typically target 40-50% of reimbursement going to food costs
    - Programs below 40% may be over-investing in labor/overhead
    - Programs above 50% may have unsustainable food costs
    
    District Financial Profile:
    - School Year: {profile['school_year']}
    - Base Rates (Source: {rates['_source']}):
      * Free: ${rates['free_lunch_base']}, Reduced: ${rates['reduced_lunch_base']}, Paid: ${rates['paid_lunch_base']}
    - Add-ons Applied:
      * Performance-Based (PBR): ${pbr_addon}/meal (Certified: {certs.get('performance_based_reimbursement', False)})
      * Severe Need: ${severe_addon}/meal (Eligible: {certs.get('severe_need_eligible', False)})
    - **Effective Rates (Base + Add-ons)**: {json.dumps(effective_rates)}
    - Student Demographics: {json.dumps(profile['demographics'])}
    
    Operational Costs:
    - Total Commodity Cost (Annual): ${scenario['total_commodity_cost']:,}
    - Annual Meals Served: {scenario['annual_meals']:,}
    - Non-Commodity Food Cost: ${scenario['other_food_cost_per_meal']}/meal
    - Labor & Overhead: ${scenario['labor_overhead_per_meal']}/meal
    
    Please write and execute Python code to:
    1. Calculate the Weighted Average Reimbursement Rate (based on demographics)
    2. Calculate Commodity Cost per Meal
    3. Calculate Total Food Cost per Meal (Commodity + Non-Commodity, NOT including labor)
    4. Calculate Food Cost as % of Reimbursement
    5. Compare this % against the 40-50% industry benchmark and indicate if it's LOW/OPTIMAL/HIGH
    6. Calculate Total Plate Cost (Food + Labor/Overhead)
    7. Calculate "Headroom" (Avg Reimbursement - Total Plate Cost)
    8. Calculate Total Annual Fund for Upgrades (Headroom * Annual Meals)
    
    Display the results clearly with the benchmark comparison highlighted.
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
        
    print("\n✅ SUCCESS: Gemini calculated the budget headroom.")

if __name__ == "__main__":
    test_budget_headroom()
