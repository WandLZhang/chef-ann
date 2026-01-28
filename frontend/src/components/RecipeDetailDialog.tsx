import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SoupKitchenIcon from '@mui/icons-material/SoupKitchen';
import ScaleIcon from '@mui/icons-material/Scale';
import SetMealIcon from '@mui/icons-material/SetMeal';
import { Recipe } from '../data/recipes';

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
}

export default function RecipeDetailDialog({ recipe, open, onClose }: RecipeDetailDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f8fcf8)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RestaurantMenuIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
            {recipe.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          <Chip 
            label={recipe.category} 
            size="small" 
            sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.dark' }} 
          />
          {recipe.proteinType && (
            <Chip 
              label={recipe.proteinType} 
              size="small" 
              icon={<SetMealIcon sx={{ fontSize: '16px !important' }} />}
              sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'primary.dark' }} 
            />
          )}
          <Chip 
            label={recipe.servingSize} 
            size="small" 
            icon={<ScaleIcon sx={{ fontSize: '16px !important' }} />}
            sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', color: 'warning.dark' }} 
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {/* Left Column: Description & Ingredients */}
          <Box>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScaleIcon fontSize="small" /> SERVING DESCRIPTION
              </Typography>
              <Typography variant="body1">
                {recipe.servingDescription}
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid rgba(76,175,80,0.2)', pb: 0.5, display: 'inline-block' }}>
              Ingredients
            </Typography>
            <List dense>
              {recipe.ingredients.map((ing, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.light' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={ing.name} 
                    secondary={ing.amount}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Right Column: Instructions */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', borderBottom: '2px solid rgba(76,175,80,0.2)', pb: 0.5, display: 'inline-block' }}>
              Preparation
            </Typography>
            <List>
              {recipe.instructions.map((step, idx) => (
                <ListItem key={idx} alignItems="flex-start" disableGutters sx={{ mb: 1 }}>
                  <Box 
                    sx={{ 
                      mr: 2, 
                      mt: 0.5,
                      minWidth: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: 'success.main', 
                      color: 'white',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <ListItemText 
                    primary={step} 
                    primaryTypographyProps={{ variant: 'body2', sx: { lineHeight: 1.6 } }}
                  />
                </ListItem>
              ))}
            </List>

            {recipe.pairingSuggestions && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)', borderRadius: 2, border: '1px dashed rgba(33, 150, 243, 0.3)' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SoupKitchenIcon fontSize="small" /> PAIRING SUGGESTIONS
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {recipe.pairingSuggestions.map((suggestion, idx) => (
                    <Chip key={idx} label={suggestion} size="small" variant="outlined" color="primary" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
