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
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(76, 175, 80, 0.7)' }}>
                Total Commodity Spend
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 500, color: 'rgba(76, 175, 80, 0.9)' }}
              >
                ${totalSpent.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.7)' }}>
                Annual Meals
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 500 }}>
                {annualMeals.toLocaleString()}
              </Typography>
            </Box>
          </Box>

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
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isHeroMetric(key) ? 'rgba(76, 175, 80, 0.8)' : 'text.secondary',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {isHeroMetric(key) ? '💰 ' : ''}{formatLabel(key)}
                  </Typography>
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
