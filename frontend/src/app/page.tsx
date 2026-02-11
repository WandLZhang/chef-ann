/**
 * @file page.tsx
 * @brief Clean, modern splash screen with light transparent design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Container, Card } from '@mui/material';
import { gsap } from 'gsap';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';

export default function SplashPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

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


  const handleEnter = () => {
    gsap.to(cardRef.current, {
      scale: 0.98,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => router.push('/onboarding'),
    });
  };

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
            Enter District Portal
          </Button>
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
