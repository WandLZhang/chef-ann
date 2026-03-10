/**
 * @file UserHeader.tsx
 * @brief Slim top bar showing the logged-in user's email and a sign-out button.
 *
 * @details Displayed on all authenticated pages (onboarding, planner).
 * Uses the AuthContext to get user info and sign-out function.
 * Redirects to the splash page on sign-out.
 *
 * @author Willis Zhang
 * @date 2026-03-10
 */

'use client';

import { Box, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UserHeader() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  if (!isAuthenticated || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderBottom: '1px solid rgba(76, 175, 80, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SpaOutlinedIcon sx={{ fontSize: 20, color: 'rgba(76, 175, 80, 0.7)' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(33, 33, 33, 0.6)',
            fontFamily: '"Google Sans", sans-serif',
            fontWeight: 500,
            fontSize: '0.8rem',
          }}
        >
          Commodity Planner
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(76, 175, 80, 0.8)',
            fontFamily: '"Google Sans", sans-serif',
            fontWeight: 500,
            fontSize: '0.8rem',
          }}
        >
          {user.email}
        </Typography>
        <Button
          size="small"
          onClick={handleSignOut}
          startIcon={<LogoutIcon sx={{ fontSize: 14 }} />}
          sx={{
            fontSize: '0.75rem',
            color: 'rgba(97, 97, 97, 0.6)',
            textTransform: 'none',
            minWidth: 'auto',
            '&:hover': {
              color: 'rgba(211, 47, 47, 0.8)',
              bgcolor: 'rgba(211, 47, 47, 0.05)',
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
