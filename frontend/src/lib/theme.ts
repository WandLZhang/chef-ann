/**
 * @file theme.ts
 * @brief MUI theme configuration for Chef Ann
 * 
 * @details Iron Hill-inspired glassmorphism theme with
 * values-aligned color palette (greens for recommended,
 * grays for processed).
 */

'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Chef Ann Foundation brand colors
const colors = {
  primary: {
    main: '#2E7D32',     // Forest green - values-aligned
    light: '#4CAF50',    // Light green
    dark: '#1B5E20',     // Dark green
    contrastText: '#fff',
  },
  secondary: {
    main: '#FF6F00',     // Warm orange - action/CTA
    light: '#FFA726',
    dark: '#E65100',
    contrastText: '#fff',
  },
  background: {
    default: '#F5F7FA',  // Soft off-white
    paper: 'rgba(255, 255, 255, 0.85)', // Glassmorphism
  },
  processed: {
    main: '#78909C',     // Blue-gray for processed items
    light: '#B0BEC5',
    dark: '#546E7A',
  },
  success: {
    main: '#43A047',     // Compliance pass
    light: '#81C784',
    dark: '#2E7D32',
  },
  warning: {
    main: '#FB8C00',     // Attention needed
    light: '#FFB74D',
    dark: '#EF6C00',
  },
  error: {
    main: '#E53935',     // Compliance fail
    light: '#EF5350',
    dark: '#C62828',
  },
};

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        colorSuccess: {
          backgroundColor: 'rgba(67, 160, 71, 0.12)',
          color: colors.success.dark,
        },
        colorWarning: {
          backgroundColor: 'rgba(251, 140, 0, 0.12)',
          color: colors.warning.dark,
        },
        colorError: {
          backgroundColor: 'rgba(229, 57, 53, 0.12)',
          color: colors.error.dark,
        },
      },
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

export default theme;
