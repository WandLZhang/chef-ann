/**
 * @file page.tsx
 * @brief Splash screen with open sign-in / sign-up form.
 *
 * Anyone can self-register an account. On success routes to /planner
 * (existing data) or /onboarding (new users).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  TextField,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { gsap } from 'gsap';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup';

export default function SplashPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { user, loading, isAuthenticated, hasExistingData, signIn, signUp, authError } = useAuth();

  // Simple fade-in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Card fade-in animation
  useEffect(() => {
    if (isReady && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
  }, [isReady]);

  // If already authenticated, show the "Enter" button instead of login
  // (user may have refreshed the page while still logged in)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password);
        console.log('[splash] Sign-up successful');
      } else {
        await signIn(email.trim(), password);
        console.log('[splash] Sign-in successful, hasExistingData:', hasExistingData);
      }
      // The auth state listener will set isAuthenticated
    } catch {
      // Error is already set via authError in the context
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setLocalError(null);
  };

  const handleEnter = () => {
    gsap.to(cardRef.current, {
      scale: 0.98,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        if (hasExistingData) {
          router.push('/planner');
        } else {
          router.push('/onboarding');
        }
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isAuthenticated) {
        handleEnter();
      } else {
        handleSubmit();
      }
    }
  };

  const displayError = localError || authError;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(232,245,233,0.9) 0%, rgba(200,230,201,0.6) 50%, rgba(165,214,167,0.4) 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif',
      }}
    >
      {/* Subtle background shapes */}
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

      {/* Main Card */}
      <Container maxWidth="sm">
        <Card
          ref={cardRef}
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
            borderRadius: 4,
            opacity: 0,
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          {/* Leaf icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <SpaOutlinedIcon
              sx={{
                fontSize: 48,
                color: 'rgba(76, 175, 80, 0.8)',
              }}
            />
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 500,
              color: 'rgba(33, 33, 33, 0.85)',
              mb: 1.5,
              fontFamily: '"Google Sans", "Product Sans", sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            Commodity Foods Planning
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'rgba(97, 97, 97, 0.9)',
              mb: 1,
              fontFamily: '"Google Sans", "Product Sans", sans-serif',
            }}
          >
            Plan your SY 2026-27 entitlement with values, precision, and speed.
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(76, 175, 80, 0.85)',
              mb: 4,
              fontWeight: 500,
              fontFamily: '"Google Sans", "Product Sans", sans-serif',
            }}
          >
            Partnering with Chef Ann Foundation
          </Typography>

          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} sx={{ color: 'rgba(76, 175, 80, 0.6)' }} />
            </Box>
          )}

          {/* If authenticated, show welcome + enter button */}
          {!loading && isAuthenticated && (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(76, 175, 80, 0.9)',
                  mb: 2,
                  fontWeight: 500,
                }}
              >
                Welcome, {user?.email}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleEnter}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  fontFamily: '"Google Sans", "Product Sans", sans-serif',
                  background: 'linear-gradient(135deg, rgba(102,187,106,0.9) 0%, rgba(129,199,132,0.85) 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.25)',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 28px rgba(76, 175, 80, 0.35)',
                    background: 'linear-gradient(135deg, rgba(102,187,106,1) 0%, rgba(129,199,132,0.95) 100%)',
                  },
                }}
              >
                {hasExistingData ? 'Continue to Planner' : 'Enter District Portal'}
              </Button>
            </Box>
          )}

          {/* If not authenticated, show sign-in / sign-up form */}
          {!loading && !isAuthenticated && (
            <Box onKeyDown={handleKeyPress}>
              {displayError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    '& .MuiAlert-message': { fontSize: '0.85rem' },
                  }}
                >
                  {displayError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: mode === 'signup' ? 1 : 3 }}
                InputLabelProps={{ shrink: true }}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                disabled={isSubmitting}
                helperText={mode === 'signup' ? 'At least 6 characters' : undefined}
              />
              {mode === 'signup' && <Box sx={{ mb: 2 }} />}

              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
                startIcon={
                  isSubmitting
                    ? <CircularProgress size={20} color="inherit" />
                    : (mode === 'signup' ? <PersonAddOutlinedIcon /> : <LoginIcon />)
                }
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  fontFamily: '"Google Sans", "Product Sans", sans-serif',
                  background: 'linear-gradient(135deg, rgba(102,187,106,0.9) 0%, rgba(129,199,132,0.85) 100%)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.25)',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 28px rgba(76, 175, 80, 0.35)',
                    background: 'linear-gradient(135deg, rgba(102,187,106,1) 0%, rgba(129,199,132,0.95) 100%)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(200, 200, 200, 0.5)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                {isSubmitting
                  ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...')
                  : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              </Button>

              <Box sx={{ mt: 2.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(97, 97, 97, 0.85)',
                    fontFamily: '"Google Sans", "Product Sans", sans-serif',
                    fontSize: '0.85rem',
                  }}
                >
                  {mode === 'signup' ? 'Already have an account?' : 'First time here?'}{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={toggleMode}
                    disabled={isSubmitting}
                    sx={{
                      color: 'rgba(76, 175, 80, 0.95)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {mode === 'signup' ? 'Sign in' : 'Create an account'}
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}
        </Card>
      </Container>

      {/* Static light tagline at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(76, 175, 80, 0.5)',
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            fontWeight: 400,
            fontFamily: '"Google Sans", "Product Sans", sans-serif',
            textTransform: 'uppercase',
          }}
        >
          Fresh • Whole • Local • Scratch Cooked
        </Typography>
      </Box>
    </Box>
  );
}
