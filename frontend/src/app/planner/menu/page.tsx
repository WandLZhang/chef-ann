/**
 * @file planner/menu/page.tsx
 * @brief Menu Cycle & Compliance page
 * 
 * @details Shows a 5-week menu calendar and connects to /api/stream/compliance
 * for USDA meal pattern validation.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CodeIcon from '@mui/icons-material/Code';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlannerStepper from '@/components/PlannerStepper';
import { streamCompliance, type StreamCallbacks } from '@/lib/api';

interface CategoryAllocation {
  category: string;
  totalCost: number;
  totalServings: number;
}

interface MenuDay {
  entree: string;
  protein: string;
  vegetable: string;
  fruit: string;
  grain: string;
}

interface ComplianceIssue {
  component: string;
  required: number;
  actual: number;
  deficit: number;
}

interface ComplianceResult {
  is_compliant: boolean;
  issues: ComplianceIssue[];
  suggestions: string[];
}

// Sample menu templates based on allocated proteins
const generateSampleMenu = (allocations: Record<string, CategoryAllocation>): MenuDay[][] => {
  const hasBeef = allocations.beef?.totalCost > 0;
  const hasPoultry = allocations.poultry?.totalCost > 0;
  const hasPork = allocations.pork?.totalCost > 0;
  const hasFish = allocations.fish?.totalCost > 0;
  const hasLegumes = allocations.legumes?.totalCost > 0;

  // 5 weeks × 5 days
  const weeks: MenuDay[][] = [];
  
  const proteins = [];
  if (hasBeef) proteins.push({ name: 'Beef', dishes: ['Tacos', 'Burger', 'Meatballs', 'Sloppy Joe', 'Beef Stir-Fry'] });
  if (hasPoultry) proteins.push({ name: 'Chicken', dishes: ['Fajitas', 'Teriyaki', 'Nuggets', 'Caesar Wrap', 'Roasted'] });
  if (hasPork) proteins.push({ name: 'Pork', dishes: ['Carnitas', 'Pulled BBQ', 'Cutlet', 'Lo Mein', 'Ham & Cheese'] });
  if (hasFish) proteins.push({ name: 'Fish', dishes: ['Baked Fillet', 'Fish Tacos', 'Fish Sticks', 'Salmon Bowl', 'Cod Nuggets'] });
  if (hasLegumes) proteins.push({ name: 'Beans', dishes: ['Black Bean Burrito', 'Chili', 'Lentil Soup', 'Bean Tacos', 'Hummus Plate'] });
  
  // Default if nothing allocated
  if (proteins.length === 0) {
    proteins.push({ name: 'Chicken', dishes: ['Fajitas', 'Teriyaki', 'Nuggets', 'Caesar Wrap', 'Roasted'] });
    proteins.push({ name: 'Beef', dishes: ['Tacos', 'Burger', 'Meatballs', 'Sloppy Joe', 'Beef Stir-Fry'] });
  }

  const vegetables = ['Broccoli', 'Carrots', 'Green Beans', 'Corn', 'Sweet Potato', 'Mixed Salad', 'Peas', 'Zucchini'];
  const fruits = ['Apple', 'Orange', 'Grapes', 'Banana', 'Melon', 'Berries', 'Pear', 'Peaches'];
  const grains = ['Brown Rice', 'WG Roll', 'Pasta', 'Tortilla', 'WG Bread', 'Quinoa'];

  for (let w = 0; w < 5; w++) {
    const week: MenuDay[] = [];
    for (let d = 0; d < 5; d++) {
      const proteinIdx = (w * 5 + d) % proteins.length;
      const protein = proteins[proteinIdx];
      const dishIdx = d % protein.dishes.length;
      
      week.push({
        entree: protein.dishes[dishIdx],
        protein: protein.name,
        vegetable: vegetables[(w * 5 + d) % vegetables.length],
        fruit: fruits[(w * 5 + d) % fruits.length],
        grain: grains[(w * 5 + d) % grains.length],
      });
    }
    weeks.push(week);
  }

  return weeks;
};

// Generate menu data structure for compliance API
const generateWeekMenuData = (weekMenu: MenuDay[]) => {
  // Simplified menu data - in production would have actual nutritional values
  return {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    components: {
      meat_ma_oz: weekMenu.map(() => 2.5), // 2.5 oz M/MA per day
      grain_oz_eq: weekMenu.map(() => 1.5), // 1.5 oz eq grains per day
      veg_cups_total: weekMenu.map(() => 0.75), // 0.75 cups veg per day
      veg_subgroups: {
        dark_green: 0.5,
        red_orange: 0.5,
        beans_peas: 0.25,
        starchy: 0.5,
        other: 1.0,
      },
      fruit_cups: weekMenu.map(() => 0.5), // 0.5 cups fruit per day
    },
    menu_items: weekMenu,
  };
};

export default function MenuPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<Record<string, CategoryAllocation>>({});
  const [menu, setMenu] = useState<MenuDay[][]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [gradeGroup, setGradeGroup] = useState('elementary');
  const [loading, setLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [codeBlocks, setCodeBlocks] = useState<string[]>([]);
  const [codeResults, setCodeResults] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    // Load allocations from localStorage
    const saved = localStorage.getItem('commodityAllocations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAllocations(parsed);
      setMenu(generateSampleMenu(parsed));
    } else {
      setMenu(generateSampleMenu({}));
    }
  }, []);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const checkCompliance = async () => {
    if (menu.length === 0) return;

    setLoading(true);
    setComplianceResult(null);
    setCodeBlocks([]);
    setCodeResults([]);
    setStatusText('Connecting to Gemini...');

    const weekData = generateWeekMenuData(menu[selectedWeek]);

    const callbacks: StreamCallbacks = {
      onText: () => {
        setStatusText('Analyzing menu compliance...');
      },
      onCode: (code) => {
        setCodeBlocks((prev) => [...prev, code]);
        setStatusText('Executing compliance checks...');
      },
      onResult: (res) => {
        setCodeResults((prev) => [...prev, res.output]);
        setStatusText('Parsing results...');

        // Try to parse JSON from result
        try {
          const jsonMatch = res.output.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            setComplianceResult(data);
          }
        } catch {
          // Try to extract compliance info from text
          const isCompliant = res.output.toLowerCase().includes('compliant') && 
                             !res.output.toLowerCase().includes('not compliant');
          setComplianceResult({
            is_compliant: isCompliant,
            issues: [],
            suggestions: [],
          });
        }
      },
      onDone: () => {
        setStatusText('');
        setLoading(false);
      },
      onError: (error) => {
        console.error('Compliance check error:', error);
        setStatusText('Error occurred');
        setLoading(false);
      },
    };

    try {
      await streamCompliance(weekData, gradeGroup, callbacks);
    } catch (error) {
      console.error('Stream error:', error);
      setLoading(false);
    }
  };

  const fillExampleMenu = () => {
    // Generate a sample menu based on common allocations
    const exampleAllocations = {
      beef: { category: 'beef', totalCost: 13150, totalServings: 24800 },
      poultry: { category: 'poultry', totalCost: 18500, totalServings: 42000 },
      pork: { category: 'pork', totalCost: 8200, totalServings: 18000 },
      fish: { category: 'fish', totalCost: 5600, totalServings: 8000 },
      legumes: { category: 'legumes', totalCost: 4000, totalServings: 35000 },
    };
    setAllocations(exampleAllocations);
    setMenu(generateSampleMenu(exampleAllocations));
  };

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
        <PlannerStepper currentStep={2} />

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
            <CalendarMonthOutlinedIcon
              sx={{ fontSize: 40, color: 'rgba(76, 175, 80, 0.7)', mr: 2 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
              >
                Menu Cycle & Compliance
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Distribute commodities across your 5-week menu and verify USDA compliance
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={fillExampleMenu}
              sx={{
                borderColor: 'rgba(76, 175, 80, 0.4)',
                color: 'rgba(76, 175, 80, 0.8)',
              }}
            >
              Fill Example Menu
            </Button>
          </Box>

          {/* Week Selector & Grade Group */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[0, 1, 2, 3, 4].map((week) => (
                <Chip
                  key={week}
                  label={`Week ${week + 1}`}
                  onClick={() => setSelectedWeek(week)}
                  sx={{
                    bgcolor: selectedWeek === week
                      ? 'rgba(76, 175, 80, 0.2)'
                      : 'rgba(0, 0, 0, 0.04)',
                    border: selectedWeek === week
                      ? '2px solid rgba(76, 175, 80, 0.6)'
                      : '1px solid transparent',
                    fontWeight: selectedWeek === week ? 600 : 400,
                  }}
                />
              ))}
            </Box>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Grade Group</InputLabel>
              <Select
                value={gradeGroup}
                label="Grade Group"
                onChange={(e) => setGradeGroup(e.target.value)}
              >
                <MenuItem value="prek">Pre-K</MenuItem>
                <MenuItem value="elementary">Elementary (K-5)</MenuItem>
                <MenuItem value="middle">Middle School (6-8)</MenuItem>
                <MenuItem value="high">High School (9-12)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Calendar Grid */}
          {menu.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 1.5,
                mb: 3,
              }}
            >
              {dayNames.map((day, idx) => (
                <Box key={day}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      textAlign: 'center',
                      mb: 1,
                      fontWeight: 600,
                      color: 'rgba(76, 175, 80, 0.8)',
                    }}
                  >
                    {day}
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.08)',
                      minHeight: 120,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}
                    >
                      {menu[selectedWeek]?.[idx]?.entree}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'rgba(76, 175, 80, 0.8)' }}
                    >
                      🥩 {menu[selectedWeek]?.[idx]?.protein}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      🥬 {menu[selectedWeek]?.[idx]?.vegetable}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      🍎 {menu[selectedWeek]?.[idx]?.fruit}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      🌾 {menu[selectedWeek]?.[idx]?.grain}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Check Compliance Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={checkCompliance}
            disabled={loading || menu.length === 0}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircleIcon />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
            }}
          >
            {loading ? statusText || 'Checking...' : 'Check USDA Compliance with Gemini'}
          </Button>
        </Card>

        {/* Compliance Results */}
        {complianceResult && (
          <Card
            sx={{
              p: 4,
              mb: 3,
              backdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 4,
              border: complianceResult.is_compliant
                ? '2px solid rgba(76, 175, 80, 0.4)'
                : '2px solid rgba(255, 152, 0, 0.4)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {complianceResult.is_compliant ? (
                <CheckCircleIcon sx={{ color: 'rgba(76, 175, 80, 0.9)', fontSize: 32, mr: 1 }} />
              ) : (
                <WarningIcon sx={{ color: 'rgba(255, 152, 0, 0.9)', fontSize: 32, mr: 1 }} />
              )}
              <Typography variant="h6" sx={{ flex: 1, fontWeight: 500 }}>
                {complianceResult.is_compliant
                  ? '✓ Week is USDA Compliant'
                  : '⚠️ Compliance Issues Found'}
              </Typography>
              <Button
                size="small"
                startIcon={<CodeIcon />}
                onClick={() => setShowCode(!showCode)}
                sx={{ color: 'rgba(76, 175, 80, 0.8)' }}
              >
                {showCode ? 'Hide Code' : 'See Analysis'}
              </Button>
            </Box>

            {/* Issues */}
            {complianceResult.issues && complianceResult.issues.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Issues to Address:
                </Typography>
                {complianceResult.issues.map((issue, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2,
                      mb: 1,
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon sx={{ color: 'rgba(255, 152, 0, 0.8)', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {issue.component}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Required: {issue.required} | Actual: {issue.actual} | Deficit: {issue.deficit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Suggestions */}
            {complianceResult.suggestions && complianceResult.suggestions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  💡 Suggestions:
                </Typography>
                {complianceResult.suggestions.map((suggestion, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5, pl: 2 }}>
                    • {suggestion}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Code Details */}
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
              </Box>
            )}
          </Card>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/planner')}
            sx={{
              borderColor: 'rgba(76, 175, 80, 0.4)',
              color: 'rgba(76, 175, 80, 0.8)',
            }}
          >
            Back to Allocate
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push('/planner/budget')}
            sx={{
              background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
            }}
          >
            Continue to Budget
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
