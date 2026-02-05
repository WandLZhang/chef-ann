#!/usr/bin/env python3
"""
@file extract_usda_pdf_data.py
@brief One-time script to extract serving/case data from USDA Product Information Sheet PDFs

@details Reads all PDFs from context/usda_info_sheets/, sends each to Gemini to extract:
- case_weight_lbs
- servings_per_case
- serving_size_oz
- cn_credit_oz
- cn_credit_category
- calories_per_serving
- protein_per_serving

Outputs comprehensive JSON to data/usda_foods_comprehensive.json

@date 2026-02-05
"""

import os
import json
import re
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env file
load_dotenv(Path(__file__).parent.parent / ".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MODEL = "gemini-3-pro-preview"
PDF_DIR = Path(__file__).parent.parent / "context" / "usda_info_sheets"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "usda_foods_comprehensive.json"
URL_MAPPING_FILE = Path(__file__).parent.parent / "context" / "usda_pdf_url_mapping.txt"
USDA_BASE_URL = "https://www.fns.usda.gov"

# Extraction prompt
EXTRACTION_PROMPT = """Analyze this USDA Product Information Sheet PDF and extract the following data.
Return ONLY valid JSON with no markdown formatting, no code blocks, just the raw JSON object.

Extract these fields:
{
  "wbscm_id": "<6-digit ID from title, e.g., 110349>",
  "description": "<full product description from title>",
  "category": "<one of: beef, poultry, pork, fish, cheese, beans, vegetables, fruits, grains, dairy, eggs, other>",
  "case_weight_lbs": <numeric weight in lbs, e.g., 40>,
  "pack_size_description": "<full pack size, e.g., '40 lb case' or '6/#10 can'>",
  "servings_per_case": <numeric count of servings per case, e.g., 229>,
  "serving_size_oz": <numeric oz per serving, e.g., 2.8>,
  "cn_credit_oz": <numeric CN credit oz equivalent per serving, e.g., 2.0>,
  "cn_credit_category": "<credit category, e.g., 'meat_alternate', 'vegetable', 'fruit', 'grain'>",
  "calories_per_serving": <numeric calories, e.g., 172>,
  "protein_per_serving": <numeric protein grams, e.g., 15>,
  "processing_level": "<'raw' or 'processed' based on product description>",
  "notes": "<any important notes about crediting or yield>"
}

If a field cannot be determined from the PDF, use null.
For servings_per_case, look for phrases like "provides approximately X servings" or "X pieces per case".
For cn_credit, look for "credits as X ounce equivalents" or "CN crediting" section.
"""


def get_client():
    """Create Gemini client using API key from environment."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)


def load_url_mapping() -> dict:
    """
    Load URL mapping from file and build WBSCM ID to full URL mapping.
    
    @return: Dict mapping WBSCM ID to full USDA URL
    """
    url_map = {}
    
    if not URL_MAPPING_FILE.exists():
        logger.warning(f"URL mapping file not found: {URL_MAPPING_FILE}")
        return url_map
    
    with open(URL_MAPPING_FILE, 'r') as f:
        for line in f:
            url_path = line.strip()
            if not url_path:
                continue
            
            # Extract WBSCM ID from the URL path (first 5-6 digits of filename)
            filename = url_path.split('/')[-1]  # e.g., "110349-BeefPatties100Percent85-15Raw-Frozen.pdf"
            match = re.match(r'^(\d{5,6})', filename)
            if match:
                wbscm_id = match.group(1)
                full_url = USDA_BASE_URL + url_path
                url_map[wbscm_id] = full_url
    
    logger.info(f"Loaded {len(url_map)} URL mappings")
    return url_map


def extract_wbscm_id_from_filename(filename: str) -> str:
    """Extract WBSCM ID from PDF filename."""
    # Pattern: starts with 6 digits, possibly with some variation
    match = re.match(r'^(\d{5,6})', filename)
    if match:
        return match.group(1)
    return None


def extract_data_from_pdf(client, pdf_path: Path) -> dict:
    """
    Send PDF to Gemini and extract structured data.
    
    @param client: Gemini client
    @param pdf_path: Path to PDF file
    @return: Extracted data dictionary
    """
    try:
        # Upload file to Gemini using file path
        uploaded_file = client.files.upload(file=str(pdf_path))
        
        # Generate content with the PDF
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=uploaded_file.uri,
                            mime_type="application/pdf"
                        ),
                        types.Part.from_text(text=EXTRACTION_PROMPT)
                    ]
                )
            ]
        )
        
        # Parse JSON from response
        response_text = response.text.strip()
        
        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```"):
            # Remove first line with ```json and last line with ```
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        data = json.loads(response_text)
        
        # Ensure wbscm_id is set from filename if not in response
        if not data.get("wbscm_id"):
            data["wbscm_id"] = extract_wbscm_id_from_filename(pdf_path.name)
        
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error for {pdf_path.name}: {e}")
        logger.error(f"Response was: {response_text[:500]}...")
        return {
            "wbscm_id": extract_wbscm_id_from_filename(pdf_path.name),
            "error": f"JSON parse error: {str(e)}",
            "raw_response": response_text[:500]
        }
    except Exception as e:
        logger.error(f"Error processing {pdf_path.name}: {e}")
        return {
            "wbscm_id": extract_wbscm_id_from_filename(pdf_path.name),
            "error": str(e)
        }


def categorize_product(data: dict) -> str:
    """Determine category based on description and extracted category."""
    desc = (data.get("description") or "").lower()
    category = (data.get("category") or "").lower()
    
    # Priority order for categorization
    if "beef" in desc:
        return "beef"
    elif "chicken" in desc or "turkey" in desc:
        return "poultry"
    elif "pork" in desc or "ham" in desc:
        return "pork"
    elif "fish" in desc or "pollock" in desc or "salmon" in desc or "catfish" in desc:
        return "fish"
    elif "cheese" in desc or "mozzarella" in desc or "cheddar" in desc:
        return "cheese"
    elif "bean" in desc or "pinto" in desc or "kidney" in desc or "garbanzo" in desc:
        return "beans"
    elif "egg" in desc:
        return "eggs"
    elif "yogurt" in desc:
        return "dairy"
    elif any(v in desc for v in ["broccoli", "carrot", "corn", "pea", "spinach", "potato", "tomato", "pepper", "onion"]):
        return "vegetables"
    elif any(f in desc for f in ["apple", "orange", "peach", "pear", "berry", "blueberry", "strawberry", "cherry", "raisin", "fruit"]):
        return "fruits"
    elif any(g in desc for g in ["pasta", "macaroni", "spaghetti", "rice", "oat", "flour", "tortilla", "penne", "rotini"]):
        return "grains"
    elif category:
        return category
    else:
        return "other"


def main():
    """Main extraction function."""
    logger.info("Starting USDA PDF data extraction...")
    
    # Load URL mapping for source citations
    url_map = load_url_mapping()
    
    # Get all PDF files
    pdf_files = sorted(PDF_DIR.glob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files")
    
    # Initialize client
    client = get_client()
    
    # Process each PDF
    results = []
    errors = []
    
    for i, pdf_path in enumerate(pdf_files):
        logger.info(f"Processing {i+1}/{len(pdf_files)}: {pdf_path.name}")
        
        data = extract_data_from_pdf(client, pdf_path)
        
        if data.get("error"):
            errors.append({"file": pdf_path.name, "error": data.get("error")})
        else:
            # Normalize category
            data["category"] = categorize_product(data)
            
            # Add source URL for citation
            wbscm_id = data.get("wbscm_id")
            if wbscm_id and wbscm_id in url_map:
                data["source_url"] = url_map[wbscm_id]
            else:
                # Fallback: construct URL from filename
                data["source_url"] = None
                logger.warning(f"No URL mapping found for WBSCM ID: {wbscm_id}")
            
            results.append(data)
        
        # Rate limiting - small delay between requests
        if i < len(pdf_files) - 1:
            time.sleep(1)
    
    # Organize results by category
    organized = {}
    for item in results:
        category = item.get("category", "other")
        if category not in organized:
            organized[category] = []
        organized[category].append(item)
    
    # Output comprehensive JSON
    output = {
        "metadata": {
            "source": "USDA FNS Product Information Sheets",
            "url": "https://www.fns.usda.gov/usda-fis/product-information-sheets",
            "extracted_date": time.strftime("%Y-%m-%d"),
            "total_products": len(results),
            "total_errors": len(errors)
        },
        "products_by_category": organized,
        "all_products": results,
        "extraction_errors": errors
    }
    
    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    logger.info(f"Extraction complete! {len(results)} products extracted, {len(errors)} errors")
    logger.info(f"Output written to {OUTPUT_FILE}")
    
    # Summary by category
    logger.info("Products by category:")
    for cat, items in organized.items():
        logger.info(f"  {cat}: {len(items)}")


if __name__ == "__main__":
    main()
