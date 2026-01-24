"""
@file gemini_client.py
@brief Gemini 3 API client wrapper with code execution and search grounding

@details This module provides a wrapper for the Gemini 3 API that enables:
- Code execution for calculations (yields, costs, servings)
- Google Search grounding for real-time data (prices, regulations)
- URL context for document-based queries
- Full verbose output for debugging

@author Chef Ann Foundation
@date 2026-01-23
"""

import os
from typing import Generator, Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types


# Load environment variables from .env file
load_dotenv()

# API Configuration - NEVER hardcode API keys!
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError(
        "GEMINI_API_KEY not found in environment variables. "
        "Please set it in .env file or export it."
    )
MODEL = "gemini-3-pro-preview"


def create_client() -> genai.Client:
    """
    @brief Create and return a Gemini API client.
    
    @return genai.Client configured with API key
    """
    return genai.Client(api_key=GEMINI_API_KEY)


def get_tools_config(
    enable_code_execution: bool = True,
    enable_search: bool = True,
    enable_url_context: bool = False
) -> list:
    """
    @brief Configure the tools available for Gemini to use.
    
    @param enable_code_execution Whether to allow Python code execution
    @param enable_search Whether to allow Google Search grounding
    @param enable_url_context Whether to allow URL context fetching
    
    @return List of configured tools
    """
    tools = []
    
    if enable_code_execution:
        tools.append(types.Tool(code_execution=types.ToolCodeExecution))
    
    if enable_search:
        tools.append(types.Tool(google_search=types.GoogleSearch()))
    
    if enable_url_context:
        tools.append(types.Tool(url_context=types.UrlContext()))
    
    return tools


def get_generation_config(thinking_level: str = "HIGH") -> types.GenerateContentConfig:
    """
    @brief Get the generation configuration for Gemini.
    
    @param thinking_level Level of thinking: "NONE", "LOW", "MEDIUM", "HIGH"
    
    @return GenerateContentConfig with thinking settings
    """
    return types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_level=thinking_level,
        ),
    )


def run_commodity_query(
    prompt: str,
    system_context: Optional[str] = None,
    enable_search: bool = True,
    enable_code_execution: bool = True,
    verbose: bool = True
) -> dict:
    """
    @brief Run a commodity planning query with Gemini 3.
    
    @details Executes a query related to commodity allocation, cost calculations,
    or compliance checking. Uses code execution for math and search grounding
    for real-time data lookup.
    
    @param prompt The user's query or calculation request
    @param system_context Optional system context for grounding the response
    @param enable_search Whether to enable Google Search for real-time data
    @param enable_code_execution Whether to enable Python code execution
    @param verbose Whether to print all intermediate outputs
    
    @return Dictionary containing:
        - 'text': Final text response
        - 'code_blocks': List of executed code snippets
        - 'code_results': List of code execution results
        - 'thinking': Model's thinking process (if available)
        - 'search_results': Any grounding search results used
    """
    client = create_client()
    
    # Build the content
    contents = []
    
    # Add system context if provided
    if system_context:
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=system_context)],
            )
        )
        contents.append(
            types.Content(
                role="model",
                parts=[types.Part.from_text(text="I understand. I'll use this context for my responses.")],
            )
        )
    
    # Add the main prompt
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    )
    
    # Configure tools
    tools = get_tools_config(
        enable_code_execution=enable_code_execution,
        enable_search=enable_search,
        enable_url_context=False
    )
    
    # Configure generation
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level="HIGH"),
        tools=tools,
    )
    
    # Collect results
    result = {
        'text': '',
        'code_blocks': [],
        'code_results': [],
        'thinking': '',
        'search_results': [],
        'raw_parts': []
    }
    
    if verbose:
        print("=" * 70)
        print("GEMINI 3 QUERY EXECUTION")
        print("=" * 70)
        print(f"Prompt: {prompt[:100]}..." if len(prompt) > 100 else f"Prompt: {prompt}")
        print("-" * 70)
    
    # Stream the response
    for chunk in client.models.generate_content_stream(
        model=MODEL,
        contents=contents,
        config=config,
    ):
        if (
            chunk.candidates is None
            or chunk.candidates[0].content is None
            or chunk.candidates[0].content.parts is None
        ):
            continue
        
        for part in chunk.candidates[0].content.parts:
            result['raw_parts'].append(part)
            
            # Handle text output
            if part.text:
                result['text'] += part.text
                if verbose:
                    print(part.text, end="")
            
            # Handle executable code
            if part.executable_code:
                code = part.executable_code.code
                result['code_blocks'].append(code)
                if verbose:
                    print("\n" + "=" * 40)
                    print("EXECUTING CODE:")
                    print("=" * 40)
                    print(code)
                    print("=" * 40)
            
            # Handle code execution results
            if part.code_execution_result:
                output = part.code_execution_result.output
                outcome = part.code_execution_result.outcome
                result['code_results'].append({
                    'output': output,
                    'outcome': str(outcome)
                })
                if verbose:
                    print("\n" + "-" * 40)
                    print(f"CODE RESULT ({outcome}):")
                    print("-" * 40)
                    print(output)
                    print("-" * 40)
            
            # Handle thinking (if exposed)
            if hasattr(part, 'thought') and part.thought:
                result['thinking'] += part.thought
                if verbose:
                    print(f"\n[THINKING]: {part.thought}")
    
    if verbose:
        print("\n" + "=" * 70)
        print("QUERY COMPLETE")
        print("=" * 70)
    
    return result


def run_calculation(
    calculation_description: str,
    variables: dict,
    expected_outputs: list[str],
    verbose: bool = True
) -> dict:
    """
    @brief Run a specific calculation using Gemini's code execution.
    
    @details Specialized function for running commodity calculations with
    defined inputs and expected outputs.
    
    @param calculation_description What calculation to perform
    @param variables Dictionary of input variables (name: value)
    @param expected_outputs List of variable names to return
    @param verbose Whether to print debug output
    
    @return Dictionary with calculation results
    
    @example
        result = run_calculation(
            "Calculate beef allocation cost and servings",
            {
                "raw_ground_beef_lbs": 3000,
                "cost_per_lb": 3.25,
                "yield_factor": 0.75,
                "oz_per_serving": 2
            },
            ["total_cost", "total_servings"]
        )
    """
    # Build a structured prompt for calculation
    var_lines = "\n".join([f"- {k}: {v}" for k, v in variables.items()])
    output_lines = ", ".join(expected_outputs)
    
    prompt = f"""
Perform the following calculation using Python code execution.

**Calculation:** {calculation_description}

**Input Variables:**
{var_lines}

**Required Outputs:** {output_lines}

Please:
1. Write Python code to perform this calculation
2. Print each output clearly with its name and value
3. Format numbers with appropriate precision (2 decimal places for currency, 0 for counts)
"""
    
    return run_commodity_query(
        prompt=prompt,
        enable_search=False,  # No search needed for pure calculations
        enable_code_execution=True,
        verbose=verbose
    )


def lookup_with_search(
    query: str,
    context: Optional[str] = None,
    verbose: bool = True
) -> dict:
    """
    @brief Look up information using Google Search grounding.
    
    @details Use this when you need real-time data like:
    - Current USDA Foods prices
    - Federal reimbursement rates
    - Yield factors from Food Buying Guide
    - Current meal pattern requirements
    
    @param query The lookup query
    @param context Optional context to narrow the search
    @param verbose Whether to print debug output
    
    @return Dictionary with search-grounded response
    """
    full_prompt = query
    if context:
        full_prompt = f"Context: {context}\n\nQuery: {query}"
    
    return run_commodity_query(
        prompt=full_prompt,
        enable_search=True,
        enable_code_execution=False,
        verbose=verbose
    )


if __name__ == "__main__":
    # Test the client with a simple calculation
    print("\n" + "=" * 70)
    print("TESTING GEMINI CLIENT")
    print("=" * 70)
    
    result = run_calculation(
        calculation_description="Calculate beef commodity allocation",
        variables={
            "raw_ground_beef_lbs": 3000,
            "raw_patties_lbs": 1000,
            "raw_ground_cost_per_lb": 3.25,
            "raw_patties_cost_per_lb": 3.40,
            "raw_ground_yield": 0.75,
            "raw_patties_yield": 0.85,
            "oz_per_serving": 2
        },
        expected_outputs=[
            "total_beef_cost",
            "raw_ground_servings",
            "raw_patties_servings",
            "total_servings"
        ],
        verbose=True
    )
    
    print("\n\nFINAL RESULT SUMMARY:")
    print("-" * 40)
    print(f"Text length: {len(result['text'])} chars")
    print(f"Code blocks executed: {len(result['code_blocks'])}")
    print(f"Code results: {len(result['code_results'])}")
