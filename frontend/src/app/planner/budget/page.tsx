/**
 * @file planner/budget/page.tsx
 * @brief Cost Analysis & Budget Headroom page
 * 
 * @details Connects to /api/stream/budget for real-time Gemini calculations.
 * Dynamically renders any JSON metrics returned by Gemini.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Divider,
  CircularProgress,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CodeIcon from '@mui/icons-material/Code';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalculateIcon from '@mui/icons-material/Calculate';
import PlannerStepper from '@/components/PlannerStepper';
import CalculationTooltip, { type CalculationProvenance } from '@/components/CalculationTooltip';
import { streamBudget, type StreamCallbacks } from '@/lib/api';

interface CategoryAllocation {
  category: string;
  totalCost: number;
  totalServings: number;
}

export default function BudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [annualMeals, setAnnualMeals] = useState(3600000);
  const [milkCostPerMeal, setMilkCostPerMeal] = useState(0.25); // $/carton, procured separately from commodities
  
  // Dynamic result storage - stores any JSON keys
  const [metrics, setMetrics] = useState<Record<string, string | number>>({});
  const [streamingText, setStreamingText] = useState('');
  const [codeBlocks, setCodeBlocks] = useState<string[]>([]);
  const [codeResults, setCodeResults] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isRealStatus, setIsRealStatus] = useState(false);

  // Cycle through placeholder messages while waiting for response
  useEffect(() => {
    if (!loading || isRealStatus) return;

    const placeholders = [
      '🔌 Connecting to Gemini...',
      '📊 Preparing calculation...',
      '🧮 Loading reimbursement rates...',
      '⚡ Initializing code execution...',
      '💰 Analyzing food costs...',
      '📈 Computing headroom...',
    ];
    
    let index = 0;
    setStatusText(placeholders[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setStatusText(placeholders[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, [loading, isRealStatus]);

  useEffect(() => {
    // Load allocations from localStorage
    const saved = localStorage.getItem('commodityAllocations');
    if (saved) {
      const allocations = JSON.parse(saved);
      const spent = Object.values(allocations as Record<string, CategoryAllocation>).reduce(
        (sum, cat) => sum + (cat.totalCost || 0),
        0
      );
      setTotalSpent(spent);
    }

    // Load district profile for annual meals
    const profile = localStorage.getItem('districtProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      const adp = Object.values(parsed.adpByGrade || {}).reduce(
        (sum: number, val) => sum + (val as number),
        0
      );
      if (adp > 0) {
        setAnnualMeals(adp * 180); // 180 school days
      }
    }
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setIsRealStatus(false);
    setMetrics({});
    setStreamingText('');
    setCodeBlocks([]);
    setCodeResults([]);
    setStatusText('🔌 Connecting to Gemini...');

    const callbacks: StreamCallbacks = {
      onText: (text) => {
        setIsRealStatus(true);
        setStreamingText((prev) => prev + text);
        setStatusText('✨ Formatting response...');
      },
      onCode: (code) => {
        setIsRealStatus(true);
        setCodeBlocks((prev) => [...prev, code]);
        setStatusText('⚡ Executing Python code...');
      },
      onResult: (res) => {
        setIsRealStatus(true);
        setCodeResults((prev) => [...prev, res.output]);
        setStatusText('📊 Parsing calculation results...');
        
        // Parse the JSON output dynamically
        try {
          const jsonMatch = res.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            setMetrics(data);
          }
        } catch {
          // If not JSON, still show the raw output
          console.log('Raw output (not JSON):', res.output);
        }
      },
      onDone: () => {
        setStatusText('');
        setLoading(false);
      },
      onError: (error) => {
        console.error('Budget analysis error:', error);
        setStatusText('Error occurred');
        setLoading(false);
      },
    };

    try {
      await streamBudget(totalSpent, annualMeals, callbacks);
    } catch (error) {
      console.error('Stream error:', error);
      setLoading(false);
    }
  };

  // Smart formatting for metric values
  const formatValue = (key: string, value: string | number): string => {
    if (typeof value === 'string') return value;
    
    const lowerKey = key.toLowerCase();
    
    // Currency formatting
    if (lowerKey.includes('cost') || lowerKey.includes('budget') || 
        lowerKey.includes('rate') || lowerKey.includes('headroom') ||
        lowerKey.includes('revenue') || lowerKey.includes('plate')) {
      if (value > 1000) {
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${value.toFixed(4)}`;
    }
    
    // Percentage
    if (lowerKey.includes('%') || lowerKey.includes('percent')) {
      return typeof value === 'number' ? `${value.toFixed(2)}%` : value;
    }
    
    // Default number formatting
    return typeof value === 'number' ? value.toLocaleString() : String(value);
  };

  // Determine if this is a "hero" metric (headroom, upgrade budget)
  const isHeroMetric = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('headroom') || lowerKey.includes('upgrade');
  };

  // Get color for metric based on name
  const getMetricColor = (key: string): string => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('headroom') || lowerKey.includes('upgrade')) {
      return 'rgba(76, 175, 80, 0.9)';
    }
    if (lowerKey.includes('%')) {
      return 'rgba(33, 150, 243, 0.9)';
    }
    return 'rgba(33, 33, 33, 0.85)';
  };

  // Format key label: remove underscores, title case
  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * @brief Build deterministic provenance for Gemini-computed budget metrics.
   *
   * @details Since we define the formulas in the backend prompt, we know exactly
   * what calculations Gemini is performing. Map known metric keys to their
   * formulas, inputs, and sources — no reliance on Gemini's output format.
   * Falls back to a generic provenance if the key is unrecognized.
   */
  const getMetricProvenance = (key: string, value: string | number): CalculationProvenance => {
    const lowerKey = key.toLowerCase();
    const commodityCostPerMeal = annualMeals > 0 ? totalSpent / annualMeals : 0;
    const otherFoodCost = 0.65; // Default from backend prompt
    const laborOverhead = 1.50; // Default from backend prompt

    // Weighted Average Reimbursement Rate
    if (lowerKey.includes('reimbursement') && lowerKey.includes('rate')) {
      return {
        formula: '(Free% × FreeRate) + (Reduced% × ReducedRate) + (Paid% × PaidRate) + PBR + SevereNeed + CommodityValue',
        inputs: [
          { label: 'Free Rate (85%)', value: '$4.60', source: 'USDA FNS Federal Register, eff. July 2025' },
          { label: 'Reduced Rate (5%)', value: '$4.20', source: 'USDA FNS Federal Register, eff. July 2025' },
          { label: 'Paid Rate (10%)', value: '$0.44', source: 'USDA FNS Federal Register, eff. July 2025' },
          { label: 'PBR Addon', value: '$0.09', source: 'Performance-Based Reimbursement certification' },
          { label: 'Severe Need Addon', value: '$0.02', source: 'District severe need eligibility' },
          { label: 'Commodity Value', value: '$0.45', source: 'USDA per-meal commodity entitlement value' },
        ],
        steps: `Weighted: (0.85×$4.60) + (0.05×$4.20) + (0.10×$0.44) + $0.09 + $0.02 + $0.45 = ${formatValue(key, value)}`,
        source: 'USDA FNS Federal Register, July 2025 — reimbursement rates for SY26-27',
      };
    }

    // Commodity Cost per Meal
    if (lowerKey.includes('commodity') && lowerKey.includes('cost') && lowerKey.includes('meal')) {
      return {
        formula: 'Total Commodity Spend ÷ Annual Meals',
        inputs: [
          { label: 'Total Commodity Spend', value: `$${totalSpent.toLocaleString()}`, source: 'Sum of all category allocations (Planner page)' },
          { label: 'Annual Meals', value: annualMeals.toLocaleString(), source: 'ADP × serving days (Onboarding page)' },
        ],
        steps: `$${totalSpent.toLocaleString()} ÷ ${annualMeals.toLocaleString()} = $${commodityCostPerMeal.toFixed(4)}/meal`,
      };
    }

    // Total Food Cost per Meal
    if (lowerKey.includes('food') && lowerKey.includes('cost') && lowerKey.includes('meal') && !lowerKey.includes('commodity')) {
      return {
        formula: 'Commodity Cost per Meal + Non-Commodity Food Cost per Meal',
        inputs: [
          { label: 'Commodity Cost/Meal', value: `$${commodityCostPerMeal.toFixed(4)}`, source: 'Commodity spend ÷ annual meals' },
          { label: 'Non-Commodity Food Cost', value: `$${otherFoodCost.toFixed(2)}`, source: 'District profile (default $0.65/meal)' },
        ],
        steps: `$${commodityCostPerMeal.toFixed(4)} + $${otherFoodCost.toFixed(2)} = ${formatValue(key, value)}`,
      };
    }

    // Food Cost as % of Reimbursement
    if (lowerKey.includes('%') || (lowerKey.includes('food') && lowerKey.includes('percent'))) {
      return {
        formula: '(Total Food Cost per Meal ÷ Weighted Avg Reimbursement) × 100',
        inputs: [
          { label: 'Total Food Cost/Meal', value: formatValue('food_cost', commodityCostPerMeal + otherFoodCost), source: 'Commodity + non-commodity food costs' },
          { label: 'Reimbursement Rate', value: '~$5.17', source: 'Weighted average from demographics' },
        ],
        steps: `Food cost ÷ reimbursement × 100 = ${formatValue(key, value)}`,
        source: 'Target range: 40-50% of reimbursement for healthy food cost ratio',
      };
    }

    // Total Plate Cost
    if (lowerKey.includes('plate') && lowerKey.includes('cost')) {
      return {
        formula: 'Total Food Cost per Meal + Labor & Overhead per Meal',
        inputs: [
          { label: 'Food Cost/Meal', value: `$${(commodityCostPerMeal + otherFoodCost).toFixed(4)}`, source: 'Commodity + non-commodity food' },
          { label: 'Labor & Overhead/Meal', value: `$${laborOverhead.toFixed(2)}`, source: 'District profile (default $1.50/meal)' },
        ],
        steps: `$${(commodityCostPerMeal + otherFoodCost).toFixed(4)} + $${laborOverhead.toFixed(2)} = ${formatValue(key, value)}`,
      };
    }

    // Budget Headroom per Meal
    if (lowerKey.includes('headroom') && !lowerKey.includes('annual') && !lowerKey.includes('upgrade')) {
      return {
        formula: 'Weighted Avg Reimbursement Rate − Total Plate Cost',
        inputs: [
          { label: 'Reimbursement Rate', value: '~$5.17', source: 'Weighted average from USDA FNS rates + demographics' },
          { label: 'Total Plate Cost', value: formatValue(key, value), source: 'Food cost + labor & overhead' },
        ],
        steps: `Reimbursement − Plate Cost = ${formatValue(key, value)}/meal available for upgrades`,
        source: 'Positive headroom = room for values-aligned ingredient upgrades',
      };
    }

    // Annual Upgrade Budget
    if (lowerKey.includes('upgrade') || (lowerKey.includes('annual') && lowerKey.includes('budget'))) {
      return {
        formula: 'Budget Headroom per Meal × Annual Meals',
        inputs: [
          { label: 'Headroom per Meal', value: 'See headroom metric', source: 'Reimbursement − plate cost' },
          { label: 'Annual Meals', value: annualMeals.toLocaleString(), source: 'ADP × serving days (Onboarding page)' },
        ],
        steps: `Headroom/meal × ${annualMeals.toLocaleString()} meals = ${formatValue(key, value)}`,
        source: 'Available budget for scratch cooking upgrades, local sourcing, and whole-muscle proteins',
      };
    }

    // Fallback for any unrecognized metric
    return {
      formula: formatLabel(key),
      inputs: [
        { label: 'Commodity Spend', value: `$${totalSpent.toLocaleString()}`, source: 'Category allocations' },
        { label: 'Annual Meals', value: annualMeals.toLocaleString(), source: 'District profile' },
      ],
      steps: `Computed by Gemini: ${formatValue(key, value)}`,
      source: 'Calculated via Gemini Code Execution — click "See Calculation" for Python code',
    };
  };

  const hasResults = Object.keys(metrics).length > 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Stepper Navigation */}
        <PlannerStepper currentStep={3} />

        {/* Header Card */}
        <Card
          sx={{
            p: 4,
            mb: 3,
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AccountBalanceWalletOutlinedIcon
              sx={{ fontSize: 40, color: 'rgba(76, 175, 80, 0.7)', mr: 2 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
              >
                Cost Analysis & Budget Headroom
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Analyze plate costs and identify opportunities for values-aligned upgrades
              </Typography>
            </Box>
          </Box>

          {/* Input Summary */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(76, 175, 80, 0.7)' }}>
                  Total Commodity Spend
                </Typography>
                <CalculationTooltip
                  iconSize={13}
                  iconColor="rgba(76, 175, 80, 0.5)"
                  provenance={{
                    formula: 'Σ Category Allocation Costs',
                    inputs: [
                      { label: 'Source', value: 'All categories', source: 'Planner page commodity allocations (localStorage)' },
                    ],
                    steps: `Sum of all category totalCost values = $${totalSpent.toLocaleString()}`,
                    source: 'Aggregated from individual commodity category allocations',
                  }}
                />
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 500, color: 'rgba(76, 175, 80, 0.9)' }}
              >
                ${totalSpent.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.7)' }}>
                  Annual Meals
                </Typography>
                <CalculationTooltip
                  iconSize={13}
                  iconColor="rgba(33, 150, 243, 0.5)"
                  provenance={{
                    formula: 'Average Daily Participation × Serving Days',
                    inputs: [
                      { label: 'ADP', value: (annualMeals / 180).toLocaleString(), source: 'From onboarding: enrollment × participation rate' },
                      { label: 'Serving Days', value: '180', source: 'From onboarding (standard NSLP school year)' },
                    ],
                    steps: `${(annualMeals / 180).toLocaleString()} ADP × 180 days = ${annualMeals.toLocaleString()} meals`,
                    source: 'Calculated during district onboarding (Step 2)',
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 500 }}>
                {annualMeals.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(156, 39, 176, 0.06)', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.7)' }}>
                  🥛 Milk Cost per Carton
                </Typography>
                <CalculationTooltip
                  iconSize={13}
                  iconColor="rgba(156, 39, 176, 0.5)"
                  provenance={{
                    formula: 'District dairy contract price per 8oz carton',
                    inputs: [
                      { label: 'Default', value: '$0.25', source: 'Typical 8oz carton price range: $0.20-$0.35' },
                    ],
                    steps: 'Milk is procured separately from USDA commodities via local dairy contracts. 1 carton = 1 cup = USDA daily milk requirement.',
                    source: 'Not a USDA commodity — purchased separately. Required component of every NSLP meal.',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 500, color: 'rgba(156, 39, 176, 0.8)' }}>$</Typography>
                <input
                  type="number"
                  value={milkCostPerMeal}
                  onChange={(e) => setMilkCostPerMeal(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '2.125rem',
                    fontWeight: 500,
                    color: 'rgba(156, 39, 176, 0.8)',
                    width: '100px',
                    outline: 'none',
                    fontFamily: '"Google Sans", "Roboto", sans-serif',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(156, 39, 176, 0.5)' }}>
                per 8oz carton (editable)
              </Typography>
            </Box>
          </Box>

          {/* Client-Side Plate Cost Estimate */}
          {totalSpent > 0 && (() => {
            const commodityCostPerMeal = annualMeals > 0 ? totalSpent / annualMeals : 0;
            const otherFoodCost = 0.65;
            const laborOverhead = 1.50;
            const totalPlateCost = commodityCostPerMeal + milkCostPerMeal + otherFoodCost + laborOverhead;

            return (
              <Box sx={{ p: 3, mb: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'rgba(33,33,33,0.8)' }}>
                  📋 Plate Cost Breakdown (per meal)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🥩 Commodity food cost:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
                    ${commodityCostPerMeal.toFixed(4)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(156, 39, 176, 0.8)' }}>🥛 Milk (per carton):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right', color: 'rgba(156, 39, 176, 0.8)' }}>
                    ${milkCostPerMeal.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>🥗 Non-commodity food:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
                    ${otherFoodCost.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>👷 Labor & overhead:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>
                    ${laborOverhead.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'rgba(76, 175, 80, 0.9)' }}>
                      Total Plate Cost:
                    </Typography>
                    <CalculationTooltip
                      iconSize={14}
                      iconColor="rgba(76, 175, 80, 0.5)"
                      provenance={{
                        formula: 'Commodity Food + Milk + Non-Commodity Food + Labor & Overhead',
                        inputs: [
                          { label: 'Commodity Cost/Meal', value: `$${commodityCostPerMeal.toFixed(4)}`, source: `$${totalSpent.toLocaleString()} ÷ ${annualMeals.toLocaleString()} meals` },
                          { label: 'Milk Cost/Meal', value: `$${milkCostPerMeal.toFixed(2)}`, source: 'District dairy contract (user input, editable above)' },
                          { label: 'Non-Commodity Food', value: `$${otherFoodCost.toFixed(2)}`, source: 'Condiments, bread, etc. (default $0.65)' },
                          { label: 'Labor & Overhead', value: `$${laborOverhead.toFixed(2)}`, source: 'District labor costs (default $1.50)' },
                        ],
                        steps: `$${commodityCostPerMeal.toFixed(4)} + $${milkCostPerMeal.toFixed(2)} + $${otherFoodCost.toFixed(2)} + $${laborOverhead.toFixed(2)} = $${totalPlateCost.toFixed(4)}`,
                        source: 'Includes milk cost — procured separately from USDA commodities via local dairy contracts',
                      }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'rgba(76, 175, 80, 0.9)', fontFamily: '"Google Sans", sans-serif' }}>
                    ${totalPlateCost.toFixed(4)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(97,97,97,0.5)', display: 'block', mt: 0.5 }}>
                  Annual plate cost: ${Math.round(totalPlateCost * annualMeals).toLocaleString()} ({annualMeals.toLocaleString()} meals)
                </Typography>
              </Box>
            );
          })()}

          {/* Analyze Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={runAnalysis}
            disabled={loading || totalSpent === 0}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CalculateIcon />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
              '&:disabled': { opacity: 0.7 },
            }}
          >
            {loading ? statusText || 'Analyzing...' : 'Run Budget Analysis with Gemini'}
          </Button>

          {totalSpent === 0 && (
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'warning.main' }}
            >
              ⚠️ No allocations found. Go back and allocate commodities first.
            </Typography>
          )}
        </Card>

        {/* Loading Skeleton Placeholders */}
        {loading && !hasResults && (
          <Card
            sx={{
              p: 4,
              mb: 3,
              backdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CircularProgress size={24} sx={{ color: 'rgba(76, 175, 80, 0.6)', mr: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {statusText || 'Analyzing...'}
              </Typography>
            </Box>
            
            {/* Animated skeleton grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Box key={i} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                  <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={36} />
                </Box>
              ))}
            </Box>

            {/* Streaming text preview */}
            {streamingText && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                  {streamingText.slice(-500)}...
                </Typography>
              </Box>
            )}
          </Card>
        )}

        {/* Results Card */}
        {hasResults && (
          <Card
            sx={{
              p: 4,
              mb: 3,
              backdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 4,
              border: '2px solid rgba(76, 175, 80, 0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{ color: 'rgba(76, 175, 80, 0.8)', mr: 1 }} />
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 500 }}>
                Analysis Results
              </Typography>
              <Button
                size="small"
                startIcon={<CodeIcon />}
                onClick={() => setShowCode(!showCode)}
                sx={{ color: 'rgba(76, 175, 80, 0.8)' }}
              >
                {showCode ? 'Hide Code' : 'See Calculation'}
              </Button>
            </Box>

            {/* Dynamic Metrics Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              {Object.entries(metrics).map(([key, value]) => (
                <Box
                  key={key}
                  sx={{
                    p: 2,
                    bgcolor: isHeroMetric(key) ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 2,
                    textAlign: 'center',
                    border: isHeroMetric(key) ? '2px solid rgba(76, 175, 80, 0.3)' : 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isHeroMetric(key) ? 'rgba(76, 175, 80, 0.8)' : 'text.secondary',
                      }}
                    >
                      {isHeroMetric(key) ? '💰 ' : ''}{formatLabel(key)}
                    </Typography>
                    <CalculationTooltip
                      iconSize={13}
                      iconColor={isHeroMetric(key) ? 'rgba(76, 175, 80, 0.5)' : 'rgba(33, 150, 243, 0.5)'}
                      provenance={getMetricProvenance(key, value)}
                    />
                  </Box>
                  <Typography
                    variant={isHeroMetric(key) ? 'h5' : 'h6'}
                    sx={{
                      fontWeight: isHeroMetric(key) ? 700 : 600,
                      color: getMetricColor(key),
                      fontFamily: '"Google Sans", sans-serif',
                    }}
                  >
                    {formatValue(key, value)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Food Cost Benchmark Bar (if we have percentage) */}
            {Object.entries(metrics).some(([k]) => k.toLowerCase().includes('%')) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Industry Benchmark (40-50% Target)
                </Typography>
                <Box sx={{ position: 'relative', height: 24 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      parseFloat(
                        Object.entries(metrics)
                          .find(([k]) => k.toLowerCase().includes('%'))?.[1]
                          ?.toString()
                          .replace('%', '') || '0'
                      ),
                      100
                    )}
                    sx={{
                      height: 24,
                      borderRadius: 12,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'rgba(76, 175, 80, 0.8)',
                        borderRadius: 12,
                      },
                    }}
                  />
                  <Box sx={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 2, bgcolor: 'rgba(0,0,0,0.3)' }} />
                  <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, bgcolor: 'rgba(0,0,0,0.3)' }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption">0%</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(76, 175, 80, 0.8)' }}>Target Zone</Typography>
                  <Typography variant="caption">100%</Typography>
                </Box>
              </Box>
            )}

            {/* Code Execution Details */}
            {showCode && codeBlocks.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Python Code Executed:
                </Typography>
                {codeBlocks.map((code, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.04)',
                      p: 2,
                      borderRadius: 2,
                      mb: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 300,
                      overflow: 'auto',
                    }}
                  >
                    {code}
                  </Box>
                ))}
                
                {codeResults.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, color: 'text.secondary' }}>
                      Output:
                    </Typography>
                    {codeResults.map((output, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          bgcolor: 'rgba(76, 175, 80, 0.08)',
                          p: 2,
                          borderRadius: 2,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {output}
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Card>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/planner/menu')}
            sx={{
              borderColor: 'rgba(76, 175, 80, 0.4)',
              color: 'rgba(76, 175, 80, 0.8)',
            }}
          >
            Back to Menu
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push('/planner/export')}
            sx={{
              background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
            }}
          >
            Continue to Export
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
