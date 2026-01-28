/**
 * @file planner/menu/page.tsx
 * @brief Menu Cycle & Compliance page
 * 
 * @details Shows a 5-week menu calendar with integrated recipe details.
 * Connects to /api/stream/compliance for USDA meal pattern validation.
 * Features tooltips for quick recipe preview and dialog for full details.
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
  IconButton,
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlannerStepper from '@/components/PlannerStepper';
import RecipeTooltip from '@/components/RecipeTooltip';
import RecipeDetailDialog from '@/components/RecipeDetailDialog';
import { recipes, Recipe, getRecipesByProtein } from '@/data/recipes';
import { streamCompliance, type StreamCallbacks } from '@/lib/api';

interface CategoryAllocation {
  category: string;
  totalCost: number;
  totalServings: number;
}

interface MenuDay {
  entree: string;
  recipeId?: string;
  servingSize?: string;
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

// Recipe mappings by protein type - using IDs that match recipes.ts exactly
const recipesByProtein: Record<string, { id: string; name: string; serving: string; grain: string }[]> = {
  Beef: [
    { id: 'OU516', name: 'Beef Birria Tacos', serving: '3 Tacos', grain: 'Corn Tortilla' },
    { id: 'FS004', name: 'Beef and Broccoli K-8', serving: '1 Bowl (8oz)', grain: 'Brown Rice' },
    { id: 'OU004', name: 'Beef Bulgogi', serving: '4oz + veggies', grain: 'Brown Rice' },
    { id: 'MB200', name: 'Beef Chili', serving: '1 Cup (8oz)', grain: 'WG Roll' },
    { id: 'MV065', name: 'Baked Potato with Taco Meat', serving: '1 Each', grain: 'Baked Potato' },
    { id: 'FS003', name: 'Baked Beef and Sausage Penne', serving: '3/4 Cup (8oz)', grain: 'WG Pasta' },
  ],
  Chicken: [
    { id: 'FS045', name: 'Crispy Chicken Sandwich', serving: '1 Sandwich', grain: 'WG Bun' },
    { id: 'MP003', name: 'Chicken Enchiladas', serving: '2 Enchiladas', grain: 'WG Tortilla' },
    { id: 'FS010', name: 'Butternut Squash and Chicken Curry', serving: '1 Cup (8oz)', grain: 'Brown Rice' },
    { id: 'MP070', name: 'Chicken Burrito', serving: '1 Burrito', grain: 'WG Tortilla' },
    { id: 'R8998', name: 'Chicken Pozole', serving: '1 Cup (8oz)', grain: 'Tortilla Chips' },
    { id: 'OU002', name: 'Banh Mi Sandwich', serving: '1 Sandwich', grain: 'WG Baguette' },
    { id: 'MP320', name: 'Oven Fried Chicken Drumstick', serving: '1 Drumstick', grain: 'WG Roll' },
  ],
  Pork: [
    { id: 'MB450', name: 'Cuban Sandwich', serving: '1 Sandwich', grain: 'WG Roll' },
    { id: 'FS041', name: 'Pork Green Chili Burrito', serving: '1 Burrito', grain: 'WG Tortilla' },
  ],
  Fish: [
    { id: 'OU521', name: 'Salmon Rice Bowl', serving: '1 Bowl (6oz)', grain: 'Brown Rice' },
  ],
  Beans: [
    { id: 'MV401', name: 'Black Bean Veggie Burger', serving: '1 Sandwich', grain: 'WG Bun' },
    { id: 'PF009', name: 'Chickpea Masala', serving: '3/4 Cup (7.5oz)', grain: 'Brown Rice' },
    { id: 'R018', name: 'Hummus Avocado Wrap', serving: '1 Wrap', grain: 'WG Tortilla' },
    { id: 'MV017', name: 'Bean & Cheese Nachos', serving: '1 Serving', grain: 'Tortilla Chips' },
    { id: 'Ing002', name: '3 Sisters Stew', serving: '1 Cup (8.75oz)', grain: 'WG Roll' },
    { id: 'FS034', name: 'Macaroni and Cheese K-8', serving: '3/4 Cup (5.7oz)', grain: 'WG Pasta' },
  ],
};

// Sample menu templates based on allocated proteins
const generateSampleMenu = (allocations: Record<string, CategoryAllocation>): MenuDay[][] => {
  const hasBeef = allocations.beef?.totalCost > 0;
  const hasPoultry = allocations.poultry?.totalCost > 0;
  const hasPork = allocations.pork?.totalCost > 0;
  const hasFish = allocations.fish?.totalCost > 0;
  const hasLegumes = allocations.legumes?.totalCost > 0;

  // 5 weeks × 5 days
  const weeks: MenuDay[][] = [];
  
  const proteins: { name: string; recipes: typeof recipesByProtein.Beef }[] = [];
  if (hasBeef) proteins.push({ name: 'Beef', recipes: recipesByProtein.Beef });
  if (hasPoultry) proteins.push({ name: 'Chicken', recipes: recipesByProtein.Chicken });
  if (hasPork) proteins.push({ name: 'Pork', recipes: recipesByProtein.Pork });
  if (hasFish) proteins.push({ name: 'Fish', recipes: recipesByProtein.Fish });
  if (hasLegumes) proteins.push({ name: 'Beans', recipes: recipesByProtein.Beans });
  
  // Default if nothing allocated
  if (proteins.length === 0) {
    proteins.push({ name: 'Chicken', recipes: recipesByProtein.Chicken });
    proteins.push({ name: 'Beef', recipes: recipesByProtein.Beef });
  }

  const vegetables = ['Broccoli', 'Carrots', 'Green Beans', 'Corn Salad', 'Roasted Sweet Potato', 'Mixed Salad', 'Peas', 'Brussel Sprout Slaw'];
  const fruits = ['Apple Slices', 'Orange Wedges', 'Grapes', 'Banana', 'Melon', 'Fresh Berries', 'Pear', 'Peaches'];

  for (let w = 0; w < 5; w++) {
    const week: MenuDay[] = [];
    for (let d = 0; d < 5; d++) {
      const proteinIdx = (w * 5 + d) % proteins.length;
      const protein = proteins[proteinIdx];
      const recipeIdx = (w + d) % protein.recipes.length;
      const recipe = protein.recipes[recipeIdx];
      
      week.push({
        entree: recipe.name,
        recipeId: recipe.id,
        servingSize: recipe.serving,
        protein: protein.name,
        vegetable: vegetables[(w * 5 + d) % vegetables.length],
        fruit: fruits[(w * 5 + d) % fruits.length],
        grain: recipe.grain, // Grain is now determined by the recipe
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
  const [_allocations, setAllocations] = useState<Record<string, CategoryAllocation>>({});
  const [menu, setMenu] = useState<MenuDay[][]>([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [gradeGroup, setGradeGroup] = useState('elementary');
  const [loading, setLoading] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [codeBlocks, setCodeBlocks] = useState<string[]>([]);
  const [codeResults, setCodeResults] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  // Recipe detail dialog state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);

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

  // Find recipe by ID or name
  const findRecipe = (menuDay: MenuDay): Recipe | null => {
    if (menuDay.recipeId) {
      const found = recipes.find(r => r.id === menuDay.recipeId);
      if (found) return found;
    }
    // Fallback to name matching
    return recipes.find(r => 
      r.name.toLowerCase().includes(menuDay.entree.toLowerCase()) ||
      menuDay.entree.toLowerCase().includes(r.name.toLowerCase())
    ) || null;
  };

  const handleRecipeClick = (menuDay: MenuDay) => {
    const recipe = findRecipe(menuDay);
    if (recipe) {
      setSelectedRecipe(recipe);
      setRecipeDialogOpen(true);
    }
  };

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
                Menu Cycle & Recipes
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                View your 5-week menu with recipe details. Hover or click items for serving sizes and ingredients.
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
              {dayNames.map((day, idx) => {
                const menuDay = menu[selectedWeek]?.[idx];
                const recipe = menuDay ? findRecipe(menuDay) : null;
                
                return (
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
                    <RecipeTooltip recipe={recipe}>
                      <Box
                        onClick={() => menuDay && handleRecipeClick(menuDay)}
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.08)',
                          minHeight: 140,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                            borderColor: 'rgba(76, 175, 80, 0.3)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        {/* Entree Name */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.85rem',
                              flex: 1,
                              color: 'rgba(45, 55, 72, 0.95)',
                            }}
                          >
                            {menuDay?.entree}
                          </Typography>
                          <InfoOutlinedIcon 
                            sx={{ 
                              fontSize: 14, 
                              color: 'rgba(76, 175, 80, 0.5)',
                              mt: 0.3,
                            }} 
                          />
                        </Box>
                        
                        {/* Serving Size Badge */}
                        {menuDay?.servingSize && (
                          <Chip
                            label={menuDay.servingSize}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: 'rgba(255, 152, 0, 0.1)',
                              color: 'rgba(230, 126, 34, 0.9)',
                              mb: 0.5,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        )}
                        
                        {/* Components */}
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: 'rgba(76, 175, 80, 0.8)', fontWeight: 500 }}
                        >
                          🥩 {menuDay?.protein}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          🥬 {menuDay?.vegetable}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          🍎 {menuDay?.fruit}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          🌾 {menuDay?.grain}
                        </Typography>
                      </Box>
                    </RecipeTooltip>
                  </Box>
                );
              })}
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

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={recipeDialogOpen}
        onClose={() => setRecipeDialogOpen(false)}
      />
    </Box>
  );
}
