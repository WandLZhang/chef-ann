/**
 * @file api.ts
 * @brief Streaming API client for Chef Ann backend
 * 
 * @details Provides SSE streaming for all Gemini endpoints
 * and standard REST for static data endpoints.
 */

const API_BASE = 'https://us-central1-wz-chef-ann.cloudfunctions.net/chef-ann-api';

// =============================================================================
// Types
// =============================================================================

export interface AllocationItem {
  wbscm_id: string;
  quantity_cases: number;  // Changed from quantity_lbs - backend now uses cases with servings_per_case
}

export interface AllocationRequest {
  commodity_type: string;
  items: AllocationItem[];
  oz_per_serving?: number;
  annual_meals?: number;
}

export interface AllocationResult {
  wbscm_id: string;
  description: string;
  cost: number;
  cases: number;
  servings: number;
}

/**
 * @brief Commodity data from usda_foods_comprehensive.json v2 (source of truth)
 * 
 * @details All fields extracted from USDA Product Info Sheet PDFs via Gemini.
 * v2 schema includes scratch cooking classification, additive detection,
 * structured CN credits, allergens, vegetable subgroups, and full nutrition.
 */
export interface Commodity {
  wbscm_id: string;
  description: string;
  
  // Classification
  usda_category: string;
  usda_subgroup: string | null;          // Only for vegetables: Dark Green, Red/Orange, etc.
  app_category: string;                  // Frontend route slug: beef, poultry, etc.
  caf_recommended: boolean;              // Derived from is_scratch_cooking by backend
  
  // Pack info
  est_cost_per_lb: number;               // Added by backend from DEFAULT_COST_PER_LB
  case_weight_lbs: number | null;
  pack_size_description: string | null;
  items_per_case: number | null;         // Count for fresh fruit, patties, etc.
  
  // Serving & crediting
  servings_per_case: number | null;
  serving_size: number | null;           // Numeric serving size amount
  serving_size_unit: string | null;      // oz, cup, tbsp, each
  cn_credit_amount: number | null;       // Numeric CN credit per serving
  cn_credit_unit: string | null;         // oz_eq or cup
  cn_credit_component: string | null;    // meat_alternate, grain, fruit, dark_green_veg, etc.
  cn_credit_statement: string | null;    // Full verbatim CN crediting text
  
  // Scratch cooking & additives
  is_scratch_cooking: boolean;
  has_additives: boolean;
  additive_list: string[];
  product_form: string | null;           // raw_ground, whole_frozen, cooked_canned, etc.
  storage_state: string | null;          // frozen, canned, fresh, shelf_stable
  
  // Allergens
  allergens: string[];
  allergen_free: boolean;
  
  // Full nutrition (per serving)
  calories_per_serving: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  cholesterol_mg: number | null;
  sodium_mg: number | null;
  total_carb_g: number | null;
  dietary_fiber_g: number | null;
  sugars_g: number | null;
  added_sugars_g: number | null;
  protein_g: number | null;
  
  // Metadata
  source_url: string | null;
  pdf_date: string | null;
  culinary_tips: string | null;
}

export interface StreamEvent {
  type: 'text' | 'code' | 'result' | 'done' | 'error';
  data: string | { output: string; outcome: string } | Record<string, unknown>;
}

// =============================================================================
// REST Endpoints (Static Data)
// =============================================================================

export async function getCommodities(category?: string): Promise<Commodity[]> {
  const url = category 
    ? `${API_BASE}/api/commodities/${category}`
    : `${API_BASE}/api/commodities`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch commodities: ${res.status}`);
  }
  return res.json();
}

export async function getDistrictProfile(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/district-profile`);
  return res.json();
}

export async function getMealPatterns(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/meal-patterns`);
  return res.json();
}

// =============================================================================
// Streaming Endpoints (SSE)
// =============================================================================

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onCode?: (code: string) => void;
  onResult?: (result: { output: string; outcome: string }) => void;
  onDone?: (summary: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic SSE streaming function for Gemini endpoints
 */
async function streamRequest(
  endpoint: string,
  body: Record<string, unknown>,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            
            switch (event.type) {
              case 'text':
                callbacks.onText?.(event.data as string);
                break;
              case 'code':
                callbacks.onCode?.(event.data as string);
                break;
              case 'result':
                callbacks.onResult?.(event.data as { output: string; outcome: string });
                break;
              case 'done':
                callbacks.onDone?.(event.data as Record<string, unknown>);
                break;
              case 'error':
                callbacks.onError?.(new Error(event.data as string));
                break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError?.(error as Error);
  }
}

/**
 * Stream commodity allocation calculation
 */
export function streamAllocate(
  request: AllocationRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  return streamRequest('/api/stream/allocate', request as unknown as Record<string, unknown>, callbacks);
}

/**
 * Stream compliance check
 */
export function streamCompliance(
  weekMenu: Record<string, unknown>,
  gradeGroup: string,
  callbacks: StreamCallbacks
): Promise<void> {
  return streamRequest('/api/stream/compliance', { week_menu: weekMenu, grade_group: gradeGroup }, callbacks);
}

/**
 * Stream budget analysis
 */
export function streamBudget(
  totalCommoditySpend: number,
  totalAnnualMeals: number,
  callbacks: StreamCallbacks
): Promise<void> {
  return streamRequest('/api/stream/budget', {
    total_commodity_spend: totalCommoditySpend,
    total_annual_meals: totalAnnualMeals,
  }, callbacks);
}

/**
 * Stream entitlement tracking
 */
export function streamEntitlement(
  allocations: Record<string, number>,
  callbacks: StreamCallbacks
): Promise<void> {
  return streamRequest('/api/stream/entitlement', { allocations }, callbacks);
}

/**
 * Stream chat with Gemini
 */
export function streamChat(
  message: string,
  context?: string,
  callbacks?: StreamCallbacks
): Promise<void> {
  return streamRequest('/api/stream/chat', {
    message,
    context,
    enable_code_execution: true,
    enable_search: false,
  }, callbacks || {});
}
