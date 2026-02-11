/**
 * @file ValuesNudgeDialog.tsx
 * @brief Decision tree popup when user selects processed over whole foods
 * 
 * @details Shows comparison between processed and values-aligned options,
 * encouraging users to consider whole/raw alternatives.
 */

'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface Commodity {
  wbscm_id: string;
  description: string;
  est_cost_per_lb: number;
  yield_factor: number;
  caf_recommended: boolean;
}

interface ValuesNudgeDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItem: Commodity | null;
  alternativeItem: Commodity | null;
  onSubstitute: () => void;
  onKeepOriginal: () => void;
}

export default function ValuesNudgeDialog({
  open,
  onClose,
  selectedItem,
  alternativeItem,
  onSubstitute,
  onKeepOriginal,
}: ValuesNudgeDialogProps) {
  if (!selectedItem || !alternativeItem) return null;

  const costDiff = alternativeItem.est_cost_per_lb - selectedItem.est_cost_per_lb;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            💡
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}>
            Chef Ann Recommendation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          You selected a processed item. Consider this values-aligned alternative:
        </Typography>

        {/* Comparison Table */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 2,
            alignItems: 'stretch',
          }}
        >
          {/* Selected (Processed) */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(158, 158, 158, 0.08)',
              border: '1px solid rgba(158, 158, 158, 0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningAmberIcon sx={{ color: 'rgba(158, 158, 158, 0.8)', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(158, 158, 158, 0.9)' }}>
                PROCESSED
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, minHeight: 40 }}>
              {selectedItem.description}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Cost/lb:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>${selectedItem.est_cost_per_lb.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Yield:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{(selectedItem.yield_factor * 100).toFixed(0)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Scratch:</Typography>
                <Chip size="small" label="No" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ingredients:</Typography>
                <Chip size="small" label="Limited Control" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
            </Box>
          </Box>

          {/* VS Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SwapHorizIcon sx={{ color: 'rgba(76, 175, 80, 0.5)', fontSize: 32 }} />
          </Box>

          {/* Alternative (Scratch-Cooking Focused) */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(76, 175, 80, 0.08)',
              border: '2px solid rgba(76, 175, 80, 0.4)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleOutlineIcon sx={{ color: 'rgba(76, 175, 80, 0.8)', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(76, 175, 80, 0.9)' }}>
                SCRATCH-COOKING FOCUSED
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, minHeight: 40 }}>
              {alternativeItem.description}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Cost/lb:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: costDiff > 0 ? 'rgba(255, 152, 0, 0.9)' : 'rgba(76, 175, 80, 0.9)' }}>
                  ${alternativeItem.est_cost_per_lb.toFixed(2)} {costDiff > 0 ? `(+$${costDiff.toFixed(2)})` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Yield:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{(alternativeItem.yield_factor * 100).toFixed(0)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Scratch:</Typography>
                <Chip size="small" label="Yes" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Ingredients:</Typography>
                <Chip size="small" label="Full Control" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Benefits */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)', p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(76, 175, 80, 0.9)' }}>
            Why Choose Scratch-Cooking Focused?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            • Higher protein quality with no fillers or additives<br />
            • Full control over ingredients and seasoning<br />
            • Supports scratch cooking initiatives<br />
            • Better taste and student acceptance
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onKeepOriginal}
          sx={{ color: 'text.secondary' }}
        >
          Keep Original
        </Button>
        <Button
          variant="contained"
          onClick={onSubstitute}
          startIcon={<CheckCircleOutlineIcon />}
          sx={{
            background: 'linear-gradient(135deg, rgba(102,187,106,0.95) 0%, rgba(129,199,132,0.9) 100%)',
          }}
        >
          Switch to Scratch-Cooking Focused
        </Button>
      </DialogActions>
    </Dialog>
  );
}
