"""
@file test_search_grounding.py
@brief Test script for Google Search grounding capabilities

@details This script tests Gemini's ability to use Google Search to look up
real-time data like current federal reimbursement rates, which change annually.
This demonstrates how to use search grounding when data is NOT in our local JSON files.
"""

import json
import os
import sys

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.gemini_client import run_commodity_query

def test_reimbursement_rate_lookup():
    print("\n" + "="*80)
    print("TEST: Search Grounding - Federal Reimbursement Rate Lookup")
    print("="*80)

    # Construct prompt that requires search grounding
    prompt = """
    I need to verify the current USDA federal reimbursement rates for the 
    National School Lunch Program (NSLP) for School Year 2025-2026.
    
    Please use Google Search to find the OFFICIAL current rates for:
    1. Free Lunch reimbursement rate (per meal)
    2. Reduced-Price Lunch reimbursement rate (per meal)
    3. Paid Lunch reimbursement rate (per meal)
    
    Also find:
    4. The current "severe need" add-on rate (if applicable)
    5. The source/citation for this information (should be from USDA FNS)
    
    After finding the rates, write Python code to compare them against 
    our stored rates from last year:
    - Stored Free: $4.29
    - Stored Reduced: $3.89
    - Stored Paid: $0.45
    
    Calculate the % change from stored to current for each rate.
    """
    
    # Execute with search grounding enabled
    result = run_commodity_query(
        prompt=prompt,
        enable_code_execution=True,
        enable_search=True,  # Enable Google Search grounding
        verbose=True
    )
    
    # Check for search usage or code execution
    if not result['text']:
        print("\n❌ FAILURE: No response from Gemini.")
        sys.exit(1)
    
    print("\n✅ SUCCESS: Gemini used search grounding for rate lookup.")

def test_yield_factor_lookup():
    print("\n" + "="*80)
    print("TEST: Search Grounding - USDA Food Buying Guide Yield Lookup")
    print("="*80)

    # Construct prompt for yield factor lookup
    prompt = """
    I need to verify the official USDA Food Buying Guide yield factor for 
    raw ground beef (85% lean / 15% fat).
    
    Please use Google Search to find:
    1. The official yield factor from the USDA Food Buying Guide
    2. How many 2-oz cooked servings you get per pound of raw ground beef
    3. The source URL for this information
    
    Then write Python code to calculate how many servings we would get from:
    - 3,000 lbs of raw ground beef 85/15
    
    using the OFFICIAL yield factor you found from the search.
    """
    
    # Execute with search grounding
    result = run_commodity_query(
        prompt=prompt,
        enable_code_execution=True,
        enable_search=True,
        verbose=True
    )
    
    if not result['text']:
        print("\n❌ FAILURE: No response from Gemini.")
        sys.exit(1)
    
    print("\n✅ SUCCESS: Gemini used search grounding for yield lookup.")

if __name__ == "__main__":
    test_reimbursement_rate_lookup()
    print("\n" + "-"*80 + "\n")
    test_yield_factor_lookup()
