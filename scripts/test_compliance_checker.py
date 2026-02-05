"""
@file test_compliance_checker.py
@brief Test script for menu compliance checking

@details This script provides Gemini with a sample weekly menu and USDA
meal pattern requirements (loaded from JSON). Gemini must execute code
to check for deficits in any component (M/MA, Grains, Veg subgroups, etc.).
"""

import json
import os
import sys

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.gemini_client import run_commodity_query

def load_patterns():
    """Load meal pattern data"""
    data_path = os.path.join(os.path.dirname(__file__), '../data/usda_meal_patterns.json')
    with open(data_path, 'r') as f:
        return json.load(f)

def test_menu_compliance():
    print("\n" + "="*80)
    print("TEST: Menu Compliance Check (Agent-Driven Validation)")
    print("="*80)

    # Load elementary patterns
    patterns = load_patterns()['elementary']
    
    # Sample deficient menu (intentionally missing red/orange veg and grains)
    sample_menu = {
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "components": {
            "meat_ma_oz": [2, 2.5, 2, 3, 3],        # Total: 12.5 (Req: 10) -> PASS
            "grain_oz_eq": [1, 1, 1, 2, 1],         # Total: 6    (Req: 8)  -> FAIL
            "veg_cups_total": [0.75, 1, 0.75, 0.75, 0.5], # Total: 3.75 (Req: 3.75) -> PASS
            "veg_subgroups": {
                "dark_green": 0.5,    # Req: 0.5 -> PASS
                "red_orange": 0.25,   # Req: 0.75 -> FAIL
                "beans_peas": 0.5,    # Req: 0.5 -> PASS
                "starchy": 0.5,       # Req: 0.5 -> PASS
                "other": 2.0          # Req: 0.5 -> PASS
            },
            "fruit_cups": [0.5, 0.5, 0.5, 0.5, 0.5] # Total: 2.5 (Req: 2.5) -> PASS
        }
    }
    
    # Construct prompt
    prompt = f"""
    I have a 5-day elementary lunch menu cycle and I need you to check it against USDA requirements.
    
    USDA Elementary Weekly Requirements:
    {json.dumps(patterns, indent=2)}
    
    My Planned Menu:
    {json.dumps(sample_menu, indent=2)}
    
    Please write and execute Python code to:
    1. Compare my planned totals against the USDA requirements
    2. Identify EXACTLY which components pass (✓) and which fail (❌)
    3. Calculate the deficit amount for any failures
    
    Provide a clear compliance report table.
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
        
    print("\n✅ SUCCESS: Gemini validated the menu compliance.")

if __name__ == "__main__":
    test_menu_compliance()
