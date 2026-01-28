import { Tooltip, Typography, Box, Chip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScaleIcon from '@mui/icons-material/Scale';
import { Recipe } from '../data/recipes';
import { ReactNode } from 'react';

interface RecipeTooltipProps {
  recipe: Recipe | null;
  children: ReactNode;
}

export default function RecipeTooltip({ recipe, children }: RecipeTooltipProps) {
  if (!recipe) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 280 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'rgba(255,255,255,0.95)' }}>
        {recipe.name}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Chip 
          label={recipe.servingSize} 
          size="small" 
          icon={<ScaleIcon sx={{ fontSize: '12px !important', color: 'inherit !important' }} />}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'white', 
            height: 20,
            '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' }
          }} 
        />
        {recipe.proteinType && (
          <Chip 
            label={recipe.proteinType} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              color: 'white', 
              height: 20,
              '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem' }
            }} 
          />
        )}
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'rgba(255,255,255,0.85)' }}>
        <strong>Serving:</strong> {recipe.servingDescription}
      </Typography>

      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'rgba(255,255,255,0.7)' }}>
        <strong>Key Ingredients:</strong>
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, mb: 1 }}>
        {recipe.ingredients.slice(0, 4).map((ing, idx) => (
          <Typography key={idx} component="li" variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            {ing.name}
          </Typography>
        ))}
        {recipe.ingredients.length > 4 && (
          <Typography component="li" variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
            +{recipe.ingredients.length - 4} more...
          </Typography>
        )}
      </Box>

      {recipe.pairingSuggestions && recipe.pairingSuggestions.length > 0 && (
        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
          🍽️ Pairs with: {recipe.pairingSuggestions.slice(0, 2).join(', ')}
        </Typography>
      )}

      <Typography 
        variant="caption" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          mt: 1.5, 
          pt: 1, 
          borderTop: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.6)'
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 12 }} />
        Click for full recipe details
      </Typography>
    </Box>
  );

  return (
    <Tooltip 
      title={tooltipContent} 
      arrow 
      placement="right"
      enterDelay={300}
      leaveDelay={100}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'rgba(45, 55, 72, 0.97)',
            backdropFilter: 'blur(8px)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            maxWidth: 300,
          }
        },
        arrow: {
          sx: {
            color: 'rgba(45, 55, 72, 0.97)',
          }
        }
      }}
    >
      <Box sx={{ cursor: 'pointer' }}>
        {children}
      </Box>
    </Tooltip>
  );
}
