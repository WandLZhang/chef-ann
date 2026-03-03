/**
 * @file CalculationTooltip.tsx
 * @brief Reusable "Show Calculation" popover component for transparent calculations.
 *
 * @details Displays an info icon (ℹ️) next to any calculated value. On click,
 * opens a popover showing the formula, input values with sources, and step-by-step
 * arithmetic so users can verify and trust the numbers.
 *
 * Supports two modes:
 * 1. Static (frontend-computed): Formula, inputs, and steps are passed as props.
 * 2. Dynamic (Gemini-computed): Provenance metadata parsed from backend response.
 *
 * @date 2026-03-03
 */

'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FunctionsIcon from '@mui/icons-material/Functions';

/**
 * @brief A single input value used in a calculation.
 */
export interface CalculationInput {
  /** Human-readable label, e.g. "Total ADP" */
  label: string;
  /** The value used, e.g. 18750 or "$0.45" */
  value: string | number;
  /** Where this value came from, e.g. "From district profile" or "USDA FNS, July 2025" */
  source: string;
}

/**
 * @brief Full provenance metadata for a calculation.
 */
export interface CalculationProvenance {
  /** Human-readable formula, e.g. "Total ADP × Serving Days" */
  formula: string;
  /** Array of inputs that feed into the formula */
  inputs: CalculationInput[];
  /** Step-by-step arithmetic showing the work, e.g. "18,750 × 180 = 3,375,000" */
  steps: string;
  /** Optional source citation for the overall calculation methodology */
  source?: string;
}

interface CalculationTooltipProps {
  /** The provenance data to display */
  provenance: CalculationProvenance;
  /** Optional: override the icon size (default: 16) */
  iconSize?: number;
  /** Optional: override icon color */
  iconColor?: string;
  /** Optional: children to wrap (renders icon inline after children) */
  children?: ReactNode;
  /** Optional: render inline with flex instead of as standalone icon */
  inline?: boolean;
}

/**
 * @brief Renders an info icon that opens a popover showing calculation transparency.
 *
 * @details Click the ℹ️ icon to see:
 * - The formula used
 * - Each input value and its source (RAG-style citation)
 * - Step-by-step arithmetic
 *
 * @param provenance The calculation metadata (formula, inputs, steps)
 * @param iconSize Size of the info icon (default 16)
 * @param iconColor Color of the info icon
 * @param children Optional children to render before the icon
 * @param inline Whether to display inline with flex layout
 *
 * @return JSX element with info icon and popover
 */
export default function CalculationTooltip({
  provenance,
  iconSize = 16,
  iconColor = 'rgba(33, 150, 243, 0.6)',
  children,
  inline = false,
}: CalculationTooltipProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const Wrapper = inline ? Box : Box;

  return (
    <Wrapper
      sx={
        inline
          ? { display: 'inline-flex', alignItems: 'center', gap: 0.5 }
          : { display: 'inline-flex', alignItems: 'center' }
      }
    >
      {children}
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          p: 0.25,
          ml: 0.5,
          color: iconColor,
          opacity: 0.7,
          transition: 'all 0.2s',
          '&:hover': {
            opacity: 1,
            bgcolor: 'rgba(33, 150, 243, 0.08)',
            transform: 'scale(1.1)',
          },
        }}
        aria-label="Show calculation details"
      >
        <InfoOutlinedIcon sx={{ fontSize: iconSize }} />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              p: 0,
              maxWidth: 380,
              minWidth: 280,
              borderRadius: 3,
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              border: '1px solid rgba(33, 150, 243, 0.15)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: 'rgba(33, 150, 243, 0.06)',
            borderBottom: '1px solid rgba(33, 150, 243, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FunctionsIcon sx={{ fontSize: 18, color: 'rgba(33, 150, 243, 0.7)' }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: 'rgba(33, 150, 243, 0.9)',
              fontFamily: '"Google Sans", sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            Show Calculation
          </Typography>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          {/* Formula */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(97, 97, 97, 0.7)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.65rem',
              }}
            >
              Formula
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                px: 1.5,
                py: 1,
                bgcolor: 'rgba(0,0,0,0.03)',
                borderRadius: 1.5,
                border: '1px solid rgba(0,0,0,0.06)',
                fontFamily: '"Google Sans", monospace',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: 'rgba(33, 33, 33, 0.85)',
                  fontFamily: '"Google Sans", sans-serif',
                }}
              >
                {provenance.formula}
              </Typography>
            </Box>
          </Box>

          {/* Inputs */}
          {provenance.inputs.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(97, 97, 97, 0.7)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontSize: '0.65rem',
                }}
              >
                Inputs
              </Typography>
              <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {provenance.inputs.map((input, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(33, 33, 33, 0.8)', fontSize: '0.8rem' }}
                      >
                        {input.label}
                      </Typography>
                      <Chip
                        size="small"
                        label={input.source}
                        sx={{
                          mt: 0.25,
                          height: 18,
                          fontSize: '0.6rem',
                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                          color: 'rgba(33, 150, 243, 0.8)',
                          fontWeight: 500,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'rgba(33, 33, 33, 0.9)',
                        fontFamily: '"Google Sans", sans-serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {typeof input.value === 'number'
                        ? input.value.toLocaleString()
                        : input.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: 'rgba(33, 150, 243, 0.2)' }} />

          {/* Steps / Result */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              bgcolor: 'rgba(76, 175, 80, 0.06)',
              borderRadius: 1.5,
              border: '1px solid rgba(76, 175, 80, 0.15)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'rgba(46, 125, 50, 0.9)',
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '0.85rem',
                whiteSpace: 'pre-line',
              }}
            >
              {provenance.steps}
            </Typography>
          </Box>

          {/* Source Citation */}
          {provenance.source && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1.5,
                color: 'rgba(97, 97, 97, 0.6)',
                fontStyle: 'italic',
                fontSize: '0.65rem',
              }}
            >
              📎 Source: {provenance.source}
            </Typography>
          )}
        </Box>
      </Popover>
    </Wrapper>
  );
}
