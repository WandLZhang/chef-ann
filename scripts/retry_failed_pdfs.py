#!/usr/bin/env python3
"""
@file retry_failed_pdfs.py
@brief Re-extracts the 2 PDFs that failed due to 503 errors

@details Processes only 100369.pdf and 100370.pdf, then merges
results into the existing usda_foods_comprehensive.json

@date 2026-02-05
"""

import os
import json
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

# Failed PDFs to retry
FAILED_PDFS = ["100369.pdf", "100370.pdf"]

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


def extract_data_from_pdf(client, pdf_path: Path) -> dict:
    """Send PDF to Gemini and extract structured data."""
    try:
        # Upload file to Gemini
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
        
        # Clean up response
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        data = json.loads(response_text)
        return data
        
    except Exception as e:
        logger.error(f"Error processing {pdf_path.name}: {e}")
        return {"error": str(e), "wbscm_id": pdf_path.stem.split("-")[0][:6]}


def categorize_product(data: dict) -> str:
    """Determine category based on description."""
    desc = (data.get("description") or "").lower()
    
    if "beef" in desc:
        return "beef"
    elif "chicken" in desc or "turkey" in desc:
        return "poultry"
    elif "pork" in desc or "ham" in desc:
        return "pork"
    elif "fish" in desc or "pollock" in desc or "salmon" in desc:
        return "fish"
    elif "cheese" in desc:
        return "cheese"
    elif "bean" in desc or "pinto" in desc or "kidney" in desc:
        return "beans"
    elif "egg" in desc:
        return "eggs"
    elif "yogurt" in desc:
        return "dairy"
    elif any(v in desc for v in ["broccoli", "carrot", "corn", "pea", "spinach", "potato", "tomato"]):
        return "vegetables"
    elif any(f in desc for f in ["apple", "orange", "peach", "pear", "berry", "fruit"]):
        return "fruits"
    elif any(g in desc for g in ["pasta", "rice", "oat", "flour", "tortilla"]):
        return "grains"
    else:
        return data.get("category", "other")


def main():
    """Re-run extraction for failed PDFs."""
    logger.info(f"Retrying {len(FAILED_PDFS)} failed PDFs...")
    
    # Load existing data
    with open(OUTPUT_FILE, 'r') as f:
        existing_data = json.load(f)
    
    logger.info(f"Loaded existing data: {existing_data['metadata']['total_products']} products")
    
    # Initialize client
    client = get_client()
    
    # Process each failed PDF
    new_products = []
    still_failed = []
    
    for pdf_name in FAILED_PDFS:
        pdf_path = PDF_DIR / pdf_name
        if not pdf_path.exists():
            logger.error(f"PDF not found: {pdf_path}")
            continue
        
        logger.info(f"Processing: {pdf_name}")
        
        # Wait before retrying
        time.sleep(2)
        
        data = extract_data_from_pdf(client, pdf_path)
        
        if data.get("error"):
            logger.error(f"Still failed: {pdf_name} - {data.get('error')}")
            still_failed.append({"file": pdf_name, "error": data.get("error")})
        else:
            # Normalize category
            data["category"] = categorize_product(data)
            data["source_url"] = None  # These generic numbered PDFs don't have URL mappings
            new_products.append(data)
            logger.info(f"SUCCESS: {pdf_name} -> {data.get('description', 'Unknown')}")
    
    # Merge results
    if new_products:
        # Add to all_products list
        existing_data["all_products"].extend(new_products)
        
        # Add to products_by_category
        for product in new_products:
            cat = product.get("category", "other")
            if cat not in existing_data["products_by_category"]:
                existing_data["products_by_category"][cat] = []
            existing_data["products_by_category"][cat].append(product)
        
        # Update metadata
        existing_data["metadata"]["total_products"] += len(new_products)
        existing_data["metadata"]["total_errors"] = len(still_failed)
        existing_data["extraction_errors"] = still_failed
        
        # Write back
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        logger.info(f"✅ Added {len(new_products)} products. New total: {existing_data['metadata']['total_products']}")
    
    if still_failed:
        logger.warning(f"❌ Still {len(still_failed)} failures: {[f['file'] for f in still_failed]}")


if __name__ == "__main__":
    main()
