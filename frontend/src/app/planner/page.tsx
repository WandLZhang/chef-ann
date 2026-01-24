/**
 * @file planner/page.tsx
 * @brief Main commodity allocation planner - Matching theme
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { gsap } from 'gsap';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlannerStepper from '@/components/PlannerStepper';

interface DistrictProfile {
  districtName: string;
  gradeLevels: string[];
  adpByGrade: Record<string, number>;
}

interface CategoryAllocation {
  category: string;
  totalCost: number;
  totalServings: number;
  items: { wbscmId: string; cost: number; servings: number }[];
}

export default function PlannerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DistrictProfile | null>(null);
  const [totalADP, setTotalADP] = useState(0);
  const [allocations, setAllocations] = useState<Record<string, CategoryAllocation>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load district profile
    const savedProfile = localStorage.getItem('districtProfile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      const total = Object.values(parsed.adpByGrade || {}).reduce(
        (sum: number, val) => sum + (val as number),
        0
      );
      setTotalADP(total);
    }

    // Load allocations from localStorage
    const savedAllocations = localStorage.getItem('commodityAllocations');
    if (savedAllocations) {
      const parsed = JSON.parse(savedAllocations);
      setAllocations(parsed);
      const spent = Object.values(parsed).reduce(
        (sum: number, cat: any) => sum + (cat.totalCost || 0),
        0
      );
      setTotalSpent(spent);
    }

    // Fade in animation
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  // Entitlement calculation
  const entitlement = 485000;
  const dodFresh = entitlement * 0.2;
  const brownBox = entitlement * 0.8;
  const remaining = entitlement - totalSpent;
  const progressPct = (totalSpent / entitlement) * 100;

  const categories = [
    { name: 'Beef', emoji: '🥩', slug: 'beef' },
    { name: 'Poultry', emoji: '🍗', slug: 'poultry' },
    { name: 'Pork', emoji: '🥓', slug: 'pork' },
    { name: 'Fish', emoji: '🐟', slug: 'fish' },
    { name: 'Vegetables', emoji: '🥬', slug: 'vegetables' },
    { name: 'Fruits', emoji: '🍎', slug: 'fruits' },
    { name: 'Grains', emoji: '🌾', slug: 'grains' },
    { name: 'Dairy', emoji: '🧀', slug: 'dairy' },
    { name: 'Legumes', emoji: '🫘', slug: 'legumes' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
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
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(165,214,167,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" ref={containerRef}>
        {/* Stepper Navigation */}
        <PlannerStepper currentStep={1} />

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton
            onClick={() => router.push('/onboarding')}
            sx={{ color: 'rgba(76, 175, 80, 0.7)' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          {/* Fill Example Data Button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHighIcon />}
            onClick={() => {
              // Pre-populate with realistic allocations for demo
              const exampleAllocations = {
                beef: { category: 'beef', totalCost: 13150, totalServings: 24800, items: [] },
                poultry: { category: 'poultry', totalCost: 18500, totalServings: 42000, items: [] },
                pork: { category: 'pork', totalCost: 8200, totalServings: 18000, items: [] },
                fish: { category: 'fish', totalCost: 5600, totalServings: 8000, items: [] },
                vegetables: { category: 'vegetables', totalCost: 45000, totalServings: 180000, items: [] },
                fruits: { category: 'fruits', totalCost: 35000, totalServings: 120000, items: [] },
                grains: { category: 'grains', totalCost: 12000, totalServings: 90000, items: [] },
                dairy: { category: 'dairy', totalCost: 22000, totalServings: 55000, items: [] },
                legumes: { category: 'legumes', totalCost: 4000, totalServings: 35000, items: [] },
              };
              localStorage.setItem('commodityAllocations', JSON.stringify(exampleAllocations));
              // Refresh state
              setAllocations(exampleAllocations);
              const spent = Object.values(exampleAllocations).reduce(
                (sum, cat) => sum + cat.totalCost, 0
              );
              setTotalSpent(spent);
            }}
            sx={{
              mr: 2,
              borderColor: 'rgba(76, 175, 80, 0.4)',
              color: 'rgba(76, 175, 80, 0.8)',
              '&:hover': {
                borderColor: 'rgba(76, 175, 80, 0.7)',
                bgcolor: 'rgba(76, 175, 80, 0.05)',
              },
            }}
          >
            Fill Demo Data
          </Button>
          <SpaOutlinedIcon sx={{ color: 'rgba(76, 175, 80, 0.5)', fontSize: 28 }} />
        </Box>

        {/* Welcome Card */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              color: 'rgba(33, 33, 33, 0.85)',
              mb: 1,
              fontFamily: '"Google Sans", sans-serif',
            }}
          >
            Welcome, {profile?.districtName || 'District'}
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: 'rgba(97, 97, 97, 0.8)', mb: 3, fontFamily: '"Google Sans", sans-serif' }}
          >
            Let&apos;s plan your SY 2026-27 USDA Foods allocations.
          </Typography>

          {/* Entitlement Summary */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(76, 175, 80, 0.7)' }}>
                Total Entitlement
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 500, color: 'rgba(76, 175, 80, 0.9)', fontFamily: '"Google Sans", sans-serif' }}
              >
                ${entitlement.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(255, 183, 77, 0.1)', borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 152, 0, 0.7)' }}>
                DoD Fresh (20%)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}>
                ${dodFresh.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ p: 3, bgcolor: 'rgba(100, 181, 246, 0.1)', borderRadius: 3 }}>
              <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.7)' }}>
                Brown Box (80%)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}>
                ${brownBox.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Progress Tracker - Entitlement Fluid Bar */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
            >
              Entitlement Tracker
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: progressPct > 95 ? 'rgba(76, 175, 80, 0.9)' : 'rgba(33, 33, 33, 0.8)',
                  fontFamily: '"Google Sans", sans-serif',
                }}
              >
                {progressPct.toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(97, 97, 97, 0.6)' }}>
                utilized
              </Typography>
            </Box>
          </Box>
          
          {/* Fluid progress bar */}
          <Box
            sx={{
              height: 24,
              borderRadius: 12,
              bgcolor: 'rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${Math.min(progressPct, 100)}%`,
                background: progressPct > 98
                  ? 'linear-gradient(90deg, rgba(76,175,80,0.9) 0%, rgba(129,199,132,0.95) 100%)'
                  : progressPct > 80
                  ? 'linear-gradient(90deg, rgba(102,187,106,0.9) 0%, rgba(129,199,132,0.85) 100%)'
                  : 'linear-gradient(90deg, rgba(255,183,77,0.9) 0%, rgba(255,193,7,0.8) 100%)',
                borderRadius: 12,
                transition: 'width 0.5s ease-out',
                // Fluid wave animation
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'wave 2s ease-in-out infinite',
                },
                '@keyframes wave': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' },
                },
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(76, 175, 80, 0.9)' }}>
                ${totalSpent.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(97, 97, 97, 0.6)' }}>
                allocated
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(33, 33, 33, 0.7)' }}>
                ${remaining.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(97, 97, 97, 0.6)' }}>
                remaining
              </Typography>
            </Box>
          </Box>

          {/* Warning if under-utilized */}
          {progressPct < 50 && totalSpent > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.3)',
              }}
            >
              <Typography variant="body2" sx={{ color: 'rgba(255, 152, 0, 0.9)' }}>
                ⚠️ Remember: Unused entitlement doesn't roll over!
              </Typography>
            </Box>
          )}
        </Card>

        {/* Category Cards */}
        <Typography
          variant="h6"
          sx={{ mb: 2, fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
        >
          Commodity Categories
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: 'repeat(5, 1fr)' },
            gap: 2,
          }}
        >
          {categories.map((cat) => {
            const catAllocation = allocations[cat.slug];
            const hasAllocation = catAllocation && catAllocation.totalCost > 0;
            
            return (
              <Card
                key={cat.name}
                onClick={() => router.push(`/planner/${cat.slug}`)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(20px)',
                  backgroundColor: hasAllocation
                    ? 'rgba(232, 245, 233, 0.85)'
                    : 'rgba(255, 255, 255, 0.7)',
                  border: hasAllocation
                    ? '2px solid rgba(76, 175, 80, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 3,
                  textAlign: 'center',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    backgroundColor: hasAllocation
                      ? 'rgba(232, 245, 233, 0.95)'
                      : 'rgba(255, 255, 255, 0.85)',
                  },
                }}
              >
                <Typography variant="h3" sx={{ mb: 1 }}>{cat.emoji}</Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: 'rgba(33, 33, 33, 0.8)' }}
                >
                  {cat.name}
                </Typography>
                {hasAllocation ? (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        fontWeight: 600,
                        color: 'rgba(76, 175, 80, 0.9)',
                        fontFamily: '"Google Sans", sans-serif',
                      }}
                    >
                      ${catAllocation.totalCost.toLocaleString()}
                    </Typography>
                    <Chip
                      size="small"
                      label="✓ Allocated"
                      sx={{
                        mt: 0.5,
                        fontSize: '0.65rem',
                        height: 20,
                        bgcolor: 'rgba(76, 175, 80, 0.15)',
                        color: 'rgba(76, 175, 80, 0.9)',
                        fontWeight: 600,
                      }}
                    />
                  </>
                ) : (
                  <Chip
                    size="small"
                    label="Start"
                    sx={{
                      mt: 1,
                      fontSize: '0.7rem',
                      height: 22,
                      bgcolor: 'rgba(76, 175, 80, 0.1)',
                      color: 'rgba(76, 175, 80, 0.8)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                    }}
                  />
                )}
              </Card>
            );
          })}
        </Box>

        {/* ADP Info */}
        {totalADP > 0 && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 4,
              color: 'rgba(76, 175, 80, 0.5)',
            }}
          >
            Based on your ADP of {totalADP.toLocaleString()} students
          </Typography>
        )}
      </Container>

      {/* Footer tagline */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(76, 175, 80, 0.4)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            fontFamily: '"Google Sans", sans-serif',
            textTransform: 'uppercase',
          }}
        >
          Fresh • Whole • Local • Scratch Cooked
        </Typography>
      </Box>
    </Box>
  );
}
