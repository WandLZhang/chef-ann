/**
 * @file PlannerStepper.tsx
 * @brief Stepper navigation for the planner flow
 * 
 * @details Shows progress through:
 * 1. Allocate - Select commodities
 * 2. Menu - Distribute across cycle
 * 3. Budget - Analyze costs & headroom
 * 4. Export - Generate final order
 */

'use client';

import { Box, Typography, Chip } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

interface Step {
  id: number;
  label: string;
  path: string;
  icon: React.ReactElement;
}

const steps: Step[] = [
  { id: 1, label: 'Allocate', path: '/planner', icon: <ShoppingCartOutlinedIcon /> },
  { id: 2, label: 'Menu', path: '/planner/menu', icon: <CalendarMonthOutlinedIcon /> },
  { id: 3, label: 'Budget', path: '/planner/budget', icon: <AccountBalanceWalletOutlinedIcon /> },
  { id: 4, label: 'Export', path: '/planner/export', icon: <FileDownloadOutlinedIcon /> },
];

interface PlannerStepperProps {
  currentStep?: number;
}

export default function PlannerStepper({ currentStep }: PlannerStepperProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current step from pathname if not provided
  const activeStep = currentStep || (() => {
    if (pathname === '/planner' || pathname.startsWith('/planner/beef') || pathname.startsWith('/planner/poultry') || 
        pathname.startsWith('/planner/pork') || pathname.startsWith('/planner/fish') || 
        pathname.startsWith('/planner/vegetables') || pathname.startsWith('/planner/fruits') ||
        pathname.startsWith('/planner/grains') || pathname.startsWith('/planner/dairy') || 
        pathname.startsWith('/planner/legumes')) {
      return 1;
    }
    if (pathname === '/planner/menu') return 2;
    if (pathname === '/planner/budget') return 3;
    if (pathname === '/planner/export') return 4;
    return 1;
  })();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        py: 2,
        px: 2,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        mb: 3,
      }}
    >
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isCompleted = step.id < activeStep;
        const isClickable = step.id <= activeStep || step.id === activeStep + 1;

        return (
          <Box key={step.id} sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              icon={step.icon}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    {step.label}
                  </Typography>
                </Box>
              }
              onClick={() => isClickable && router.push(step.path)}
              sx={{
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isClickable ? 1 : 0.5,
                bgcolor: isActive
                  ? 'rgba(76, 175, 80, 0.2)'
                  : isCompleted
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)',
                border: isActive
                  ? '2px solid rgba(76, 175, 80, 0.6)'
                  : '1px solid transparent',
                color: isActive || isCompleted
                  ? 'rgba(76, 175, 80, 0.9)'
                  : 'rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease',
                '&:hover': isClickable
                  ? {
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      transform: 'scale(1.02)',
                    }
                  : {},
                '& .MuiChip-icon': {
                  color: isActive || isCompleted
                    ? 'rgba(76, 175, 80, 0.9)'
                    : 'rgba(0, 0, 0, 0.4)',
                },
              }}
            />
            {index < steps.length - 1 && (
              <Box
                sx={{
                  width: { xs: 20, sm: 40 },
                  height: 2,
                  mx: 1,
                  bgcolor: isCompleted
                    ? 'rgba(76, 175, 80, 0.4)'
                    : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
