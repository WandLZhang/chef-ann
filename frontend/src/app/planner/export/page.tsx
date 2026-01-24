/**
 * @file planner/export/page.tsx
 * @brief Export & Order Summary page with WBSCM IDs
 * 
 * @details Shows final order table with CSV export for WBSCM upload.
 * Includes detailed item breakdown with WBSCM IDs.
 */

'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Typography, Card, Button, Divider, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useRouter } from 'next/navigation';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import PlannerStepper from '@/components/PlannerStepper';

interface ItemDetail {
  wbscmId: string;
  description?: string;
  cost: number;
  servings: number;
  cases?: number;
}

interface CategoryAllocation {
  category: string;
  totalCost: number;
  totalServings: number;
  items: ItemDetail[];
}

// Mock WBSCM catalog for descriptions
const wbscmCatalog: Record<string, { description: string; packSize: string }> = {
  '100158': { description: 'Beef, Fine Ground, 100%, 85/15, Raw, Frozen', packSize: '40 lb case' },
  '110349': { description: 'Beef, Patties, 100%, 85/15, Raw, 2.0 M/MA', packSize: '40 lb case' },
  '100134': { description: 'Beef, Crumbles w/Soy Protein, Cooked, Frozen', packSize: '4/10 lb bag' },
  '111361': { description: 'Chicken, Cut-up, Raw, Frozen', packSize: '4/10 lb bag' },
  '100125': { description: 'Turkey, Roast, Raw, Frozen', packSize: '4/8-12 lb roasts' },
  '100101': { description: 'Chicken, Diced, Cooked, Frozen', packSize: '8/5 lb bag' },
  '111881': { description: 'Chicken, Pulled, Cooked, Frozen', packSize: '6/5 lb bag' },
  '100200': { description: 'Pork, Ham, Boneless, Raw, Frozen', packSize: '4/10 lb case' },
  '100201': { description: 'Pork, Ground, Raw, Frozen', packSize: '40 lb case' },
  '110500': { description: 'Fish, Pollock, Fillets, Raw, Frozen', packSize: '10 lb box' },
  '110501': { description: 'Fish, Salmon, Portions, Raw, Frozen', packSize: '10 lb box' },
  '110473': { description: 'Broccoli Florets, No Salt, Frozen', packSize: '30 lb case' },
  '110480': { description: 'Carrots, Diced, No Salt, Frozen', packSize: '30 lb case' },
  '110562': { description: 'Sweet Potatoes, Cubes, Frozen', packSize: '30 lb bag' },
  '100517': { description: 'Apples, Empire, Fresh', packSize: '40 lb case' },
  '100243': { description: 'Blueberries, Wild, Frozen', packSize: '30 lb case' },
  '105012': { description: 'Pasta, Macaroni, WG-Rich Blend', packSize: '20 lb bag' },
  '100465': { description: 'Oats, Rolled, Quick Cooking', packSize: '25 lb tube' },
  '100300': { description: 'Cheese, Cheddar, Shredded', packSize: '4/5 lb bag' },
  '100301': { description: 'Cheese, Mozzarella, Shredded', packSize: '4/5 lb bag' },
  '110860': { description: 'Black Beans, Canned, Low Sodium', packSize: '6/#10 can' },
  '110861': { description: 'Kidney Beans, Canned', packSize: '6/#10 can' },
};

// Category emojis
const categoryEmojis: Record<string, string> = {
  beef: '🥩',
  poultry: '🍗',
  pork: '🥓',
  fish: '🐟',
  vegetables: '🥬',
  fruits: '🍎',
  grains: '🌾',
  dairy: '🧀',
  legumes: '🫘',
};

export default function ExportPage() {
  const router = useRouter();
  const [allocations, setAllocations] = useState<Record<string, CategoryAllocation>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalServings, setTotalServings] = useState(0);
  const [districtName, setDistrictName] = useState('');
  const entitlement = 485000;

  useEffect(() => {
    const saved = localStorage.getItem('commodityAllocations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAllocations(parsed);
      const spent = Object.values(parsed as Record<string, CategoryAllocation>).reduce(
        (sum, cat) => sum + (cat.totalCost || 0),
        0
      );
      setTotalSpent(spent);
      const servings = Object.values(parsed as Record<string, CategoryAllocation>).reduce(
        (sum, cat) => sum + (cat.totalServings || 0),
        0
      );
      setTotalServings(servings);
    }

    const profile = localStorage.getItem('districtProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setDistrictName(parsed.districtName || 'District');
    }
  }, []);

  const progressPct = (totalSpent / entitlement) * 100;

  // Collect all items with WBSCM IDs
  const allItems: { category: string; item: ItemDetail }[] = [];
  Object.entries(allocations).forEach(([category, data]) => {
    if (data.items && data.items.length > 0) {
      data.items.forEach((item) => {
        if (item.wbscmId) {
          allItems.push({ category, item });
        }
      });
    }
  });

  const downloadCSV = () => {
    // Generate detailed CSV with WBSCM IDs
    let csv = 'WBSCM_ID,Product_Description,Pack_Size,Category,Quantity_Cases,Cost,Servings\n';
    
    // Add individual items if we have them
    if (allItems.length > 0) {
      allItems.forEach(({ category, item }) => {
        const catalog = wbscmCatalog[item.wbscmId];
        csv += `${item.wbscmId},"${catalog?.description || item.description || 'Unknown'}","${catalog?.packSize || 'N/A'}",${category},${item.cases || 'N/A'},${item.cost.toFixed(2)},${item.servings}\n`;
      });
    } else {
      // Fall back to category-level data
      Object.values(allocations).forEach((cat) => {
        csv += `N/A,"${cat.category} (Category Total)","N/A",${cat.category},N/A,${cat.totalCost.toFixed(2)},${cat.totalServings}\n`;
      });
    }
    
    csv += `\n\nSUMMARY\n`;
    csv += `Total Entitlement,$${entitlement}\n`;
    csv += `Total Allocated,$${totalSpent}\n`;
    csv += `Utilization,${progressPct.toFixed(1)}%\n`;
    csv += `Total Servings,${totalServings}\n`;
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wbscm_order_sy26-27_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        py: 4,
        '@media print': {
          background: 'white',
        },
      }}
    >
      <Container maxWidth="lg">
        {/* Stepper Navigation */}
        <Box sx={{ '@media print': { display: 'none' } }}>
          <PlannerStepper currentStep={4} />
        </Box>

        {/* Header Card */}
        <Card
          sx={{
            p: 4,
            mb: 3,
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.6)',
            '@media print': {
              boxShadow: 'none',
              border: 'none',
            },
          }}
        >
          {/* Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FileDownloadOutlinedIcon
              sx={{ fontSize: 40, color: 'rgba(76, 175, 80, 0.7)', mr: 2 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
              >
                Commodity Order Summary
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                SY 2026-2027 USDA Foods Allocation
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${progressPct.toFixed(1)}% Utilized`}
              color={progressPct > 95 ? 'success' : progressPct > 50 ? 'warning' : 'default'}
              sx={{ fontWeight: 600, '@media print': { display: 'none' } }}
            />
          </Box>

          {/* District Info */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
              mb: 3,
              p: 2,
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>District</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{districtName || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Date</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>{new Date().toLocaleDateString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Entitlement</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>${entitlement.toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Remaining</Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: (entitlement - totalSpent) < 10000 ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 152, 0, 0.9)' }}>
                ${(entitlement - totalSpent).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Category Summary Table */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Allocation by Category
          </Typography>
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Servings</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>% of Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(allocations).map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{categoryEmojis[category] || '📦'}</Typography>
                        <Typography sx={{ textTransform: 'capitalize' }}>{category}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(76, 175, 80, 0.9)', fontWeight: 500 }}>
                      ${data.totalCost.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {data.totalServings.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {((data.totalCost / totalSpent) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.08)' }}>
                  <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'rgba(76, 175, 80, 0.9)' }}>
                    ${totalSpent.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {totalServings.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Detailed Items with WBSCM IDs */}
          {allItems.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Detailed Items (WBSCM Upload Format)
              </Typography>
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                      <TableCell sx={{ fontWeight: 600 }}>WBSCM ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product Description</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Pack Size</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Cases</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allItems.map(({ category, item }, idx) => {
                      const catalog = wbscmCatalog[item.wbscmId];
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={item.wbscmId}
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                              }}
                            />
                          </TableCell>
                          <TableCell>{catalog?.description || item.description || 'Unknown'}</TableCell>
                          <TableCell>{catalog?.packSize || 'N/A'}</TableCell>
                          <TableCell align="right">{item.cases || '-'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${item.cost.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Export Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, '@media print': { display: 'none' } }}>
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
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                borderColor: 'rgba(33, 150, 243, 0.4)',
                color: 'rgba(33, 150, 243, 0.8)',
              }}
            >
              Print Summary
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={downloadCSV}
              sx={{
                background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
              }}
            >
              Download CSV for WBSCM
            </Button>
          </Box>
        </Card>

        {/* Footer Info */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            color: 'rgba(76, 175, 80, 0.5)',
            '@media print': { display: 'none' },
          }}
        >
          CSV format compatible with USDA WBSCM web-based commodity ordering system
        </Typography>
      </Container>
    </Box>
  );
}
