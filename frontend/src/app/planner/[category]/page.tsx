/**
 * @file planner/[category]/page.tsx
 * @brief Category detail page for commodity selection
 * 
 * @details Displays available commodities in two columns:
 * - Values-Aligned (recommended, whole/raw)
 * - Processed (with soy, pre-cooked)
 * 
 * Uses streaming Gemini API for real-time calculations
 * and shows "See Calculation" with source citations.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  IconButton,
  TextField,
  Chip,
  Drawer,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { gsap } from 'gsap';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { streamAllocate, getCommodities, type StreamCallbacks } from '@/lib/api';

// Types
interface Commodity {
  wbscm_id: string;
  description: string;
  pack_size: string;
  caf_recommended: boolean;
  processing_level: string;
  est_cost_per_lb: number;
  yield_factor: number;
}

// AllocationItem interface kept for future use
// interface AllocationItem { commodity: Commodity; quantity_lbs: number; }

interface CalculationResult {
  wbscm_id: string;
  description: string;
  cost: number;
  cases: number;
  servings: number;
}

// Category metadata
const categoryMeta: Record<string, { name: string; emoji: string }> = {
  beef: { name: 'Beef', emoji: '🥩' },
  poultry: { name: 'Poultry', emoji: '🍗' },
  pork: { name: 'Pork', emoji: '🥓' },
  fish: { name: 'Fish', emoji: '🐟' },
  vegetables: { name: 'Vegetables', emoji: '🥬' },
  fruits: { name: 'Fruits', emoji: '🍎' },
  grains: { name: 'Grains', emoji: '🌾' },
  dairy: { name: 'Dairy', emoji: '🧀' },
  legumes: { name: 'Legumes', emoji: '🫘' },
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const category = params.category as string;
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [allocations, setAllocations] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calcStatus, setCalcStatus] = useState('');
  const [isRealStatus, setIsRealStatus] = useState(false);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalServings, setTotalServings] = useState(0);
  
  // Calculation drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState<string[]>([]);
  const [codeResults, setCodeResults] = useState<string[]>([]);
  const [_geminiText, setGeminiText] = useState('');

  // Fetch commodities for this category
  useEffect(() => {
    async function fetchCommodities() {
      try {
        const data = await getCommodities(category);
        if (Array.isArray(data)) {
          setCommodities(data);
        } else if (data && typeof data === 'object') {
          // Handle nested structure
          const items = Object.values(data).flat() as Commodity[];
          setCommodities(items);
        }
      } catch (error) {
        console.error('Failed to fetch commodities:', error);
        console.log('Using mock data for category:', category);
        // Use category-specific mock data for demo
        const mockData: Record<string, Commodity[]> = {
          beef: [
            { wbscm_id: '100158', description: 'Beef, Fine Ground, 100%, 85/15, Raw, Frozen', pack_size: '40 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 3.25, yield_factor: 0.75 },
            { wbscm_id: '110349', description: 'Beef, Patties, 100%, 85/15, Raw, 2.0 M/MA', pack_size: '40 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 3.40, yield_factor: 0.85 },
            { wbscm_id: '100134', description: 'Beef, Crumbles w/Soy Protein, Cooked, Frozen', pack_size: '4/10 lb bag', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.85, yield_factor: 1.0 },
            { wbscm_id: '110322', description: 'Beef, Patties w/Soy Protein, Cooked, 2.0 M/MA', pack_size: '40 lb case', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.90, yield_factor: 0.95 },
          ],
          poultry: [
            { wbscm_id: '111361', description: 'Chicken, Cut-up, Raw, Frozen', pack_size: '4/10 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 1.85, yield_factor: 0.65 },
            { wbscm_id: '100125', description: 'Turkey, Roast, Raw, Frozen', pack_size: '4/8-12 lb roasts', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 2.10, yield_factor: 0.75 },
            { wbscm_id: '100101', description: 'Chicken, Diced, Cooked, Frozen', pack_size: '8/5 lb bag', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.45, yield_factor: 1.0 },
            { wbscm_id: '111881', description: 'Chicken, Pulled, Cooked, Frozen', pack_size: '6/5 lb bag', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.55, yield_factor: 1.0 },
          ],
          pork: [
            { wbscm_id: '100200', description: 'Pork, Ham, Boneless, Raw, Frozen', pack_size: '4/10 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 2.15, yield_factor: 0.80 },
            { wbscm_id: '100201', description: 'Pork, Ground, Raw, Frozen', pack_size: '40 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 1.95, yield_factor: 0.75 },
            { wbscm_id: '100202', description: 'Pork, Sausage Patties, Cooked, Frozen', pack_size: '10 lb box', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.35, yield_factor: 0.95 },
          ],
          fish: [
            { wbscm_id: '110500', description: 'Fish, Pollock, Fillets, Raw, Frozen', pack_size: '10 lb box', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 2.80, yield_factor: 0.85 },
            { wbscm_id: '110501', description: 'Fish, Salmon, Portions, Raw, Frozen', pack_size: '10 lb box', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 4.50, yield_factor: 0.90 },
            { wbscm_id: '110502', description: 'Fish, Sticks, Breaded, Cooked, Frozen', pack_size: '30 lb case', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.20, yield_factor: 0.95 },
          ],
          vegetables: [
            { wbscm_id: '110473', description: 'Broccoli Florets, No Salt, Frozen', pack_size: '30 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 1.45, yield_factor: 0.90 },
            { wbscm_id: '110480', description: 'Carrots, Diced, No Salt, Frozen', pack_size: '30 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.95, yield_factor: 0.95 },
            { wbscm_id: '110562', description: 'Sweet Potatoes, Cubes, Frozen', pack_size: '30 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 1.25, yield_factor: 0.90 },
            { wbscm_id: '110600', description: 'Mixed Vegetables, Canned', pack_size: '6/#10 can', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 0.75, yield_factor: 1.0 },
          ],
          fruits: [
            { wbscm_id: '100517', description: 'Apples, Empire, Fresh', pack_size: '40 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.85, yield_factor: 0.95 },
            { wbscm_id: '100243', description: 'Blueberries, Wild, Frozen', pack_size: '30 lb case', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 3.50, yield_factor: 1.0 },
            { wbscm_id: '100520', description: 'Peaches, Sliced, Canned, Light Syrup', pack_size: '6/#10 can', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 1.10, yield_factor: 1.0 },
          ],
          grains: [
            { wbscm_id: '105012', description: 'Pasta, Macaroni, WG-Rich Blend', pack_size: '20 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.65, yield_factor: 2.5 },
            { wbscm_id: '100465', description: 'Oats, Rolled, Quick Cooking', pack_size: '25 lb tube', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.55, yield_factor: 3.0 },
            { wbscm_id: '105020', description: 'Rice, Brown, Long Grain', pack_size: '25 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.75, yield_factor: 2.8 },
          ],
          dairy: [
            { wbscm_id: '100300', description: 'Cheese, Cheddar, Shredded', pack_size: '4/5 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 3.85, yield_factor: 1.0 },
            { wbscm_id: '100301', description: 'Cheese, Mozzarella, Shredded', pack_size: '4/5 lb bag', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 3.75, yield_factor: 1.0 },
            { wbscm_id: '100302', description: 'Cheese, American, Processed, Sliced', pack_size: '6/5 lb loaf', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 2.95, yield_factor: 1.0 },
          ],
          legumes: [
            { wbscm_id: '110860', description: 'Black Beans, Canned, Low Sodium', pack_size: '6/#10 can', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.55, yield_factor: 1.0 },
            { wbscm_id: '110861', description: 'Kidney Beans, Canned', pack_size: '6/#10 can', caf_recommended: true, processing_level: 'raw', est_cost_per_lb: 0.50, yield_factor: 1.0 },
            { wbscm_id: '110862', description: 'Refried Beans, Canned, Vegetarian', pack_size: '6/#10 can', caf_recommended: false, processing_level: 'processed', est_cost_per_lb: 0.65, yield_factor: 1.0 },
          ],
        };
        setCommodities(mockData[category] || mockData.beef);
      }
      setLoading(false);
    }
    fetchCommodities();
  }, [category]);

  // Fade in animation
  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [loading]);

  // Cycle through placeholder messages while waiting for response
  useEffect(() => {
    if (!calculating || isRealStatus) return;

    const placeholders = [
      '🔌 Connecting to Gemini...',
      '📊 Preparing calculation...',
      '🧮 Loading yield factors...',
      '⚡ Initializing code execution...',
      '🔢 Analyzing commodity data...',
      '📈 Computing allocations...',
    ];
    
    let index = 0;
    setCalcStatus(placeholders[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setCalcStatus(placeholders[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, [calculating, isRealStatus]);

  // Update allocation quantity
  const updateQuantity = (wbscmId: string, delta: number) => {
    setAllocations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(wbscmId) || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        newMap.delete(wbscmId);
      } else {
        newMap.set(wbscmId, newValue);
      }
      return newMap;
    });
  };

  // Set exact quantity
  const setQuantity = (wbscmId: string, value: number) => {
    setAllocations((prev) => {
      const newMap = new Map(prev);
      if (value <= 0) {
        newMap.delete(wbscmId);
      } else {
        newMap.set(wbscmId, value);
      }
      return newMap;
    });
  };

  // Calculate allocation using Gemini streaming
  const calculateAllocation = async () => {
    if (allocations.size === 0) return;

    setCalculating(true);
    setIsRealStatus(false);
    setCalcStatus('🔌 Connecting to Gemini...');
    setCodeBlocks([]);
    setCodeResults([]);
    setGeminiText('');
    setResults([]);

    const items = Array.from(allocations.entries()).map(([wbscmId, qty]) => ({
      wbscm_id: wbscmId,
      quantity_lbs: qty,
    }));

    // Local variables to capture parsed values for saving
    let parsedCost = 0;
    let parsedServings = 0;
    let parsedItems: CalculationResult[] = [];

    const callbacks: StreamCallbacks = {
      onText: (text) => {
        setIsRealStatus(true);
        setGeminiText((prev) => prev + text);
        setCalcStatus('✨ Formatting response...');
      },
      onCode: (code) => {
        setIsRealStatus(true);
        setCodeBlocks((prev) => [...prev, code]);
        setCalcStatus('⚡ Executing Python code...');
      },
      onResult: (result) => {
        setIsRealStatus(true);
        setCodeResults((prev) => [...prev, result.output]);
        setCalcStatus('📊 Parsing calculation results...');
        // Try to parse JSON from result
        try {
          const jsonMatch = result.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.items) {
              parsedItems = data.items;
              setResults(data.items);
            }
            if (data.total_cost) {
              parsedCost = data.total_cost;
              setTotalCost(data.total_cost);
            }
            if (data.total_servings) {
              parsedServings = data.total_servings;
              setTotalServings(data.total_servings);
            }
          }
        } catch {
          // Not JSON, that's fine
        }
      },
      onDone: () => {
        setCalcStatus('✅ Complete!');
        // Save allocation to localStorage for the entitlement tracker
        setTimeout(() => {
          const savedAllocations = JSON.parse(localStorage.getItem('commodityAllocations') || '{}');
          savedAllocations[category] = {
            category,
            totalCost: parsedCost,
            totalServings: parsedServings,
            items: parsedItems.map(r => ({ wbscmId: r.wbscm_id, cost: r.cost, servings: r.servings })),
          };
          localStorage.setItem('commodityAllocations', JSON.stringify(savedAllocations));
          console.log('💾 Saved allocation:', savedAllocations[category]);
          
          setCalculating(false);
          setCalcStatus('');
        }, 500);
      },
      onError: (error) => {
        console.error('Calculation error:', error);
        setCalcStatus('Error occurred');
        setTimeout(() => {
          setCalculating(false);
          setCalcStatus('');
        }, 1000);
      },
    };

    try {
      await streamAllocate(
        {
          commodity_type: category,
          items,
          oz_per_serving: 2.0,
          annual_meals: 3600000,
        },
        callbacks
      );
    } catch (error) {
      console.error('Stream error:', error);
      setCalculating(false);
    }
  };

  // Separate commodities into recommended and processed
  const recommended = commodities.filter((c) => c.caf_recommended);
  const processed = commodities.filter((c) => !c.caf_recommended);

  const meta = categoryMeta[category] || { name: category, emoji: '📦' };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'rgba(76, 175, 80, 0.6)' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        position: 'relative',
        overflow: 'hidden',
        pb: 12,
      }}
    >
      {/* Background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,199,132,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" ref={containerRef} sx={{ pt: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <IconButton
            onClick={() => router.push('/planner')}
            sx={{ color: 'rgba(76, 175, 80, 0.7)' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3">{meta.emoji}</Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif', flex: 1 }}
          >
            {meta.name} Selection
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={() => {
              // Set example allocations based on category (IDs match mock data)
              const exampleData: Record<string, Map<string, number>> = {
                beef: new Map([['100158', 3000], ['110349', 1000]]),
                poultry: new Map([['111361', 5000], ['100101', 2000]]),
                pork: new Map([['100200', 1500], ['100201', 1000]]),
                fish: new Map([['110500', 800], ['110501', 400]]),
                vegetables: new Map([['110473', 1000], ['110480', 800], ['110562', 600]]),
                fruits: new Map([['100517', 1200], ['100243', 500]]),
                grains: new Map([['105012', 500], ['100465', 300]]),
                dairy: new Map([['100300', 600], ['100301', 400]]),
                legumes: new Map([['110860', 400], ['110861', 300]]),
              };
              const example = exampleData[category] || new Map([['100158', 3000]]);
              setAllocations(example);
            }}
            sx={{
              borderColor: 'rgba(76, 175, 80, 0.4)',
              color: 'rgba(76, 175, 80, 0.8)',
              '&:hover': {
                borderColor: 'rgba(76, 175, 80, 0.7)',
                bgcolor: 'rgba(76, 175, 80, 0.05)',
              },
            }}
          >
            Use Example
          </Button>
        </Box>

        {/* Two Column Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* VALUES-ALIGNED Column */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleOutlineIcon sx={{ color: 'rgba(76, 175, 80, 0.8)' }} />
              <Typography variant="h6" sx={{ color: 'rgba(76, 175, 80, 0.9)', fontWeight: 500 }}>
                Values-Aligned (Recommended)
              </Typography>
            </Box>
            {recommended.map((commodity) => (
              <CommodityCard
                key={commodity.wbscm_id}
                commodity={commodity}
                quantity={allocations.get(commodity.wbscm_id) || 0}
                onQuantityChange={(delta) => updateQuantity(commodity.wbscm_id, delta)}
                onSetQuantity={(val) => setQuantity(commodity.wbscm_id, val)}
                isRecommended
              />
            ))}
            {recommended.length === 0 && (
              <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No values-aligned options in this category
              </Typography>
            )}
          </Box>

          {/* PROCESSED Column */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningAmberIcon sx={{ color: 'rgba(158, 158, 158, 0.8)' }} />
              <Typography variant="h6" sx={{ color: 'rgba(97, 97, 97, 0.8)', fontWeight: 500 }}>
                Processed (Consider Reducing)
              </Typography>
            </Box>
            {processed.map((commodity) => (
              <CommodityCard
                key={commodity.wbscm_id}
                commodity={commodity}
                quantity={allocations.get(commodity.wbscm_id) || 0}
                onQuantityChange={(delta) => updateQuantity(commodity.wbscm_id, delta)}
                onSetQuantity={(val) => setQuantity(commodity.wbscm_id, val)}
                isRecommended={false}
              />
            ))}
            {processed.length === 0 && (
              <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                No processed options in this category
              </Typography>
            )}
          </Box>
        </Box>

        {/* Results Section */}
        {(results.length > 0 || totalCost > 0) && (
          <Card
            sx={{
              mt: 4,
              p: 3,
              backdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 3,
              border: '2px solid rgba(76, 175, 80, 0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Allocation Summary
              </Typography>
              <Button
                size="small"
                startIcon={<CodeIcon />}
                onClick={() => setDrawerOpen(true)}
                sx={{ color: 'rgba(76, 175, 80, 0.8)' }}
              >
                See Calculation
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {results.map((item) => (
              <Box key={item.wbscm_id} sx={{ mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={`${item.cases} cases`}
                    sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}
                  />
                  <Chip
                    size="small"
                    label={`$${item.cost.toLocaleString()}`}
                    sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}
                  />
                  <Chip
                    size="small"
                    label={`${item.servings.toLocaleString()} servings`}
                    sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)' }}
                  />
                </Box>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: 'rgba(76, 175, 80, 0.9)' }}>
                Total: ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body1">
                {totalServings.toLocaleString()} servings
              </Typography>
            </Box>
          </Card>
        )}
      </Container>

      {/* Calculate Button - Fixed at bottom */}
      {allocations.size > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {calculating && calcStatus && (
            <Box
              key={calcStatus}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 3,
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                animation: 'statusFade 0.4s ease-out',
                '@keyframes statusFade': {
                  '0%': { opacity: 0, transform: 'translateY(8px) scale(0.95)' },
                  '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(46, 125, 50, 0.95)',
                  fontFamily: '"Google Sans", sans-serif',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontSize: '0.95rem',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'rgba(76, 175, 80, 0.9)',
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
                    animation: 'pulseGlow 1.2s ease-in-out infinite',
                    '@keyframes pulseGlow': {
                      '0%, 100%': { opacity: 0.5, transform: 'scale(0.9)' },
                      '50%': { opacity: 1, transform: 'scale(1.1)' },
                    },
                  }}
                />
                {calcStatus}
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={calculateAllocation}
            disabled={calculating}
            sx={{
              px: 4,
              py: 1.5,
              minWidth: 200,
              fontFamily: '"Google Sans", sans-serif',
              background: calculating
                ? 'linear-gradient(135deg, rgba(102,187,106,0.7) 0%, rgba(129,199,132,0.7) 100%)'
                : 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.35)',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(76, 175, 80, 0.45)',
              },
            }}
          >
            {calculating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Working...
              </>
            ) : (
              `Calculate ${allocations.size} Item${allocations.size > 1 ? 's' : ''}`
            )}
          </Button>
        </Box>
      )}

      {/* Calculation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            p: 3,
            bgcolor: 'rgba(250, 250, 250, 0.98)',
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
          📊 Calculation Details
        </Typography>
        
        {codeBlocks.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Python Code Executed:
            </Typography>
            {codeBlocks.map((code, idx) => (
              <Box
                key={idx}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  p: 2,
                  borderRadius: 2,
                  mb: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  minHeight: 200,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
                {code}
              </Box>
            ))}
          </>
        )}

        {codeResults.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Output:
            </Typography>
            {codeResults.map((result, idx) => (
              <Box
                key={idx}
                sx={{
                  bgcolor: 'rgba(76, 175, 80, 0.08)',
                  p: 2,
                  borderRadius: 2,
                  mb: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {result}
              </Box>
            ))}
          </>
        )}

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          📚 Sources:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Chip
            size="small"
            label="Yield Factors: Food Buying Guide (USDA FNS, 2026)"
            sx={{ justifyContent: 'flex-start' }}
          />
          <Chip
            size="small"
            label="Costs: USDA Foods Available List SY26-27"
            sx={{ justifyContent: 'flex-start' }}
          />
          <Chip
            size="small"
            label="Serving Size: 2 oz M/MA per USDA Meal Patterns"
            sx={{ justifyContent: 'flex-start' }}
          />
        </Box>
      </Drawer>
    </Box>
  );
}

// Commodity Card Component
function CommodityCard({
  commodity,
  quantity,
  onQuantityChange,
  onSetQuantity,
  isRecommended,
}: {
  commodity: Commodity;
  quantity: number;
  onQuantityChange: (delta: number) => void;
  onSetQuantity: (val: number) => void;
  isRecommended: boolean;
}) {
  return (
    <Card
      sx={{
        p: 2,
        mb: 2,
        backdropFilter: 'blur(20px)',
        backgroundColor: isRecommended
          ? 'rgba(232, 245, 233, 0.8)'
          : 'rgba(250, 250, 250, 0.75)',
        border: isRecommended
          ? '1px solid rgba(76, 175, 80, 0.3)'
          : '1px solid rgba(200, 200, 200, 0.4)',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {commodity.description}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            WBSCM: {commodity.wbscm_id} | {commodity.pack_size}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              size="small"
              label={`$${commodity.est_cost_per_lb}/lb`}
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
            <Tooltip title={`Yield: ${(commodity.yield_factor * 100).toFixed(0)}% - from Food Buying Guide`}>
              <Chip
                size="small"
                label={`Yield: ${(commodity.yield_factor * 100).toFixed(0)}%`}
                icon={<InfoOutlinedIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            </Tooltip>
          </Box>
        </Box>

        {/* Quantity Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => onQuantityChange(-500)}
            disabled={quantity === 0}
            sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <TextField
            size="small"
            value={quantity}
            onChange={(e) => onSetQuantity(parseInt(e.target.value) || 0)}
            sx={{
              width: 80,
              '& input': { textAlign: 'center', fontWeight: 500 },
            }}
            inputProps={{ min: 0, step: 500 }}
          />
          <IconButton
            size="small"
            onClick={() => onQuantityChange(500)}
            sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
            lbs
          </Typography>
        </Box>
      </Box>

      {quantity > 0 && (
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Estimated Cost:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(76, 175, 80, 0.9)' }}>
            ${(quantity * commodity.est_cost_per_lb).toLocaleString()}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
