/**
 * @file onboarding/page.tsx
 * @brief District Onboarding - Matching splash page theme
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  Typography,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { gsap } from 'gsap';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

const steps = ['District Info', 'Grade Levels', 'Kitchen Equipment', 'Allergens'];

const gradeOptions = [
  { id: 'prek', label: 'Pre-K', icon: '👶' },
  { id: 'elementary', label: 'Elementary (K-5)', icon: '🎒' },
  { id: 'middle', label: 'Middle School (6-8)', icon: '📚' },
  { id: 'high', label: 'High School (9-12)', icon: '🎓' },
];

const equipmentOptions = [
  { id: 'combi', label: 'Combi Ovens' },
  { id: 'tilt', label: 'Tilt Skillets' },
  { id: 'kettle', label: 'Steam Kettles' },
  { id: 'convection', label: 'Convection Ovens' },
  { id: 'flattop', label: 'Flat Tops' },
  { id: 'cooktop', label: 'Gas Cooktop' },
  { id: 'robotcoupe', label: 'Robot Coupe' },
  { id: 'immersion', label: 'Immersion Blenders' },
];

const allergenOptions = [
  { id: 'milk', label: 'Milk' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'fish', label: 'Fish' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'treenuts', label: 'Tree Nuts' },
  { id: 'wheat', label: 'Wheat' },
  { id: 'peanuts', label: 'Peanuts' },
  { id: 'soybeans', label: 'Soybeans' },
  { id: 'sesame', label: 'Sesame' },
];

interface DistrictProfile {
  districtName: string;
  gradeLevels: string[];
  adpByGrade: Record<string, number>;
  sites: string;
  foodCostPercentage: string;
  equipment: string[];
  allergens: string[];
}

// Example data for auto-fill
const exampleData: DistrictProfile = {
  districtName: 'Austin ISD',
  gradeLevels: ['prek', 'elementary', 'middle', 'high'],
  adpByGrade: { prek: 500, elementary: 12000, middle: 4500, high: 3000 },
  sites: '45 sites (5 production, 40 satellite)',
  foodCostPercentage: '48',
  equipment: ['combi', 'kettle', 'convection'],
  allergens: ['peanuts', 'treenuts'],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scratchScore, setScratchScore] = useState(0);
  
  const [profile, setProfile] = useState<DistrictProfile>({
    districtName: '',
    gradeLevels: [],
    adpByGrade: {},
    sites: '',
    foodCostPercentage: '',
    equipment: [],
    allergens: [],
  });

  // Calculate scratch cooking score based on equipment
  useEffect(() => {
    const score = Math.min(100, profile.equipment.length * 15);
    setScratchScore(score);
  }, [profile.equipment]);

  // Animate card on step change
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [activeStep]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      localStorage.setItem('districtProfile', JSON.stringify(profile));
      gsap.to(cardRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        onComplete: () => router.push('/planner'),
      });
    } else {
      gsap.to(cardRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => setActiveStep((prev) => prev + 1),
      });
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      router.push('/');
    } else {
      gsap.to(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => setActiveStep((prev) => prev - 1),
      });
    }
  };

  const fillExampleData = () => {
    setProfile(exampleData);
  };

  const toggleGrade = (gradeId: string) => {
    setProfile((prev) => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(gradeId)
        ? prev.gradeLevels.filter((g) => g !== gradeId)
        : [...prev.gradeLevels, gradeId],
    }));
  };

  const toggleEquipment = (equipId: string) => {
    setProfile((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipId)
        ? prev.equipment.filter((e) => e !== equipId)
        : [...prev.equipment, equipId],
    }));
  };

  const toggleAllergen = (allergenId: string) => {
    setProfile((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter((a) => a !== allergenId)
        : [...prev.allergens, allergenId],
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 500,
                color: 'rgba(33, 33, 33, 0.85)',
                fontFamily: '"Google Sans", sans-serif',
              }}
            >
              Tell us about your district
            </Typography>
            <TextField
              fullWidth
              label="District Name"
              value={profile.districtName}
              onChange={(e) => setProfile({ ...profile, districtName: e.target.value })}
              sx={{ mb: 3 }}
              placeholder="e.g., Austin ISD"
            />
            <TextField
              fullWidth
              label="Number of Serving Sites"
              value={profile.sites}
              onChange={(e) => setProfile({ ...profile, sites: e.target.value })}
              sx={{ mb: 3 }}
              placeholder="e.g., 45 sites (5 production, 40 satellite)"
            />
            <TextField
              fullWidth
              label="Current Food Cost Percentage"
              value={profile.foodCostPercentage}
              onChange={(e) => setProfile({ ...profile, foodCostPercentage: e.target.value })}
              placeholder="e.g., 48"
              helperText="Industry range: 40-55% of reimbursement"
              InputProps={{
                endAdornment: <Typography sx={{ color: 'text.secondary' }}>%</Typography>,
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{ mb: 3, fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
            >
              What grade levels do you serve?
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {gradeOptions.map((grade) => (
                <Box
                  key={grade.id}
                  onClick={() => toggleGrade(grade.id)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: profile.gradeLevels.includes(grade.id)
                      ? '2px solid rgba(76, 175, 80, 0.6)'
                      : '2px solid rgba(200, 200, 200, 0.3)',
                    bgcolor: profile.gradeLevels.includes(grade.id)
                      ? 'rgba(76, 175, 80, 0.08)'
                      : 'rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5">{grade.icon}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {grade.label}
                    </Typography>
                    {profile.gradeLevels.includes(grade.id) && (
                      <CheckCircleIcon sx={{ ml: 'auto', color: 'rgba(76, 175, 80, 0.8)', fontSize: 20 }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            {profile.gradeLevels.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                  Enter Average Daily Participation (ADP):
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {profile.gradeLevels.map((gradeId) => {
                    const grade = gradeOptions.find((g) => g.id === gradeId);
                    return (
                      <TextField
                        key={gradeId}
                        size="small"
                        label={grade?.label}
                        type="number"
                        value={profile.adpByGrade[gradeId] || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            adpByGrade: {
                              ...profile.adpByGrade,
                              [gradeId]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{ mb: 1, fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
            >
              Kitchen Equipment
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(97, 97, 97, 0.8)' }}>
              We&apos;ll filter food options based on your capabilities.
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {equipmentOptions.map((equip) => (
                <Chip
                  key={equip.id}
                  label={equip.label}
                  onClick={() => toggleEquipment(equip.id)}
                  sx={{
                    py: 2,
                    px: 1,
                    bgcolor: profile.equipment.includes(equip.id)
                      ? 'rgba(76, 175, 80, 0.15)'
                      : 'rgba(255, 255, 255, 0.6)',
                    color: profile.equipment.includes(equip.id)
                      ? 'rgba(46, 125, 50, 0.9)'
                      : 'rgba(33, 33, 33, 0.7)',
                    border: profile.equipment.includes(equip.id)
                      ? '1px solid rgba(76, 175, 80, 0.4)'
                      : '1px solid rgba(200, 200, 200, 0.3)',
                    '&:hover': {
                      bgcolor: profile.equipment.includes(equip.id)
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              ))}
            </Box>

            <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(76, 175, 80, 0.06)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(76, 175, 80, 0.8)' }}>
                Scratch Cooking Potential
              </Typography>
              <LinearProgress
                variant="determinate"
                value={scratchScore}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mt: 1,
                  bgcolor: 'rgba(0,0,0,0.05)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, rgba(102,187,106,0.9) 0%, rgba(129,199,132,0.85) 100%)',
                  },
                }}
              />
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(97, 97, 97, 0.7)' }}>
                {scratchScore}% — {scratchScore >= 60 
                  ? "Ready for raw proteins!" 
                  : "More equipment = more scratch options"}
              </Typography>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{ mb: 1, fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
            >
              Allergen Restrictions
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(97, 97, 97, 0.8)' }}>
              Select any Big 9 allergens to avoid district-wide.
            </Typography>
            
            <FormGroup>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                {allergenOptions.map((allergen) => (
                  <FormControlLabel
                    key={allergen.id}
                    control={
                      <Checkbox
                        checked={profile.allergens.includes(allergen.id)}
                        onChange={() => toggleAllergen(allergen.id)}
                        sx={{
                          color: 'rgba(76, 175, 80, 0.5)',
                          '&.Mui-checked': { color: 'rgba(76, 175, 80, 0.8)' },
                        }}
                      />
                    }
                    label={<Typography variant="body2">{allergen.label}</Typography>}
                  />
                ))}
              </Box>
            </FormGroup>

            {profile.allergens.length > 0 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(230, 81, 0, 0.9)' }}>
                  Products containing{' '}
                  {profile.allergens
                    .map((a) => allergenOptions.find((opt) => opt.id === a)?.label)
                    .join(', ')}{' '}
                  will be flagged.
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
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
        py: 4,
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

      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ color: 'rgba(76, 175, 80, 0.7)' }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Step indicators */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, justifyContent: 'center' }}>
          {steps.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: idx === activeStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: idx <= activeStep
                  ? 'rgba(76, 175, 80, 0.6)'
                  : 'rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Main Card */}
        <Card
          ref={cardRef}
          sx={{
            p: { xs: 3, md: 4 },
            backdropFilter: 'blur(24px)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06)',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}
        >
          {renderStepContent()}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, alignItems: 'center' }}>
            {/* Example button */}
            <Button
              startIcon={<AutoFixHighIcon />}
              onClick={fillExampleData}
              sx={{
                color: 'rgba(76, 175, 80, 0.5)',
                fontSize: '0.8rem',
                '&:hover': {
                  bgcolor: 'rgba(76, 175, 80, 0.05)',
                  color: 'rgba(76, 175, 80, 0.8)',
                },
              }}
            >
              Use Example
            </Button>

            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={activeStep === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
              sx={{
                px: 3,
                py: 1,
                fontFamily: '"Google Sans", sans-serif',
                background: 'linear-gradient(135deg, rgba(102,187,106,0.9) 0%, rgba(129,199,132,0.85) 100%)',
                color: 'white',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 28px rgba(76, 175, 80, 0.35)',
                },
              }}
            >
              {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </Box>
        </Card>

        {/* Step label */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: 'rgba(76, 175, 80, 0.5)',
            fontFamily: '"Google Sans", sans-serif',
          }}
        >
          Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
        </Typography>
      </Container>
    </Box>
  );
}
