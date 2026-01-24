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
  quantity_lbs: number;
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

export interface Commodity {
  wbscm_id: string;
  description: string;
  pack_size: string;
  caf_recommended: boolean;
  processing_level: string;
  est_cost_per_lb: number;
  yield_factor: number;
}

export interface StreamEvent {
  type: 'text' | 'code' | 'result' | 'done';
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
