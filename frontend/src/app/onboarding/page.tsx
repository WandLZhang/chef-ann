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

const steps = ['District Info', 'Enrollment & Meals', 'Kitchen Equipment', 'Allergens'];

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
  enrollmentByGrade: Record<string, number>;
  servingDays: number;
  participationRates: {
    free: number;
    reduced: number;
    paid: number;
  };
  demographics: {
    freeRate: number;
    reducedRate: number;
    paidRate: number;
  };
  // Calculated fields
  adpByGrade: Record<string, number>;
  totalEnrollment: number;
  totalAdp: number;
  totalAnnualMeals: number;
  sites: string;
  foodCostPercentage: string;
  equipment: string[];
  allergens: string[];
}

// Industry standard default participation rates
const DEFAULT_PARTICIPATION_RATES = {
  free: 80,      // 80% of free-eligible students participate
  reduced: 70,   // 70% of reduced-eligible students participate
  paid: 40,      // 40% of paid students participate
};

// Default demographics (can be customized)
const DEFAULT_DEMOGRAPHICS = {
  freeRate: 85,     // 85% of students are free-eligible
  reducedRate: 5,   // 5% are reduced-eligible
  paidRate: 10,     // 10% are paid
};

// Example data for auto-fill
const exampleData: DistrictProfile = {
  districtName: 'Austin ISD',
  gradeLevels: ['prek', 'elementary', 'middle', 'high'],
  enrollmentByGrade: { prek: 625, elementary: 15000, middle: 5625, high: 3750 },
  servingDays: 180,
  participationRates: { free: 80, reduced: 70, paid: 40 },
  demographics: { freeRate: 85, reducedRate: 5, paidRate: 10 },
  adpByGrade: { prek: 500, elementary: 12000, middle: 4500, high: 3000 },
  totalEnrollment: 25000,
  totalAdp: 20000,
  totalAnnualMeals: 3600000,
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
    enrollmentByGrade: {},
    servingDays: 180,
    participationRates: { ...DEFAULT_PARTICIPATION_RATES },
    demographics: { ...DEFAULT_DEMOGRAPHICS },
    adpByGrade: {},
    totalEnrollment: 0,
    totalAdp: 0,
    totalAnnualMeals: 0,
    sites: '',
    foodCostPercentage: '',
    equipment: [],
    allergens: [],
  });

  // Calculate ADP and Annual Meals when inputs change
  useEffect(() => {
    const { enrollmentByGrade, servingDays, participationRates, demographics } = profile;
    
    // Calculate weighted participation rate
    const weightedParticipation = 
      (demographics.freeRate / 100) * (participationRates.free / 100) +
      (demographics.reducedRate / 100) * (participationRates.reduced / 100) +
      (demographics.paidRate / 100) * (participationRates.paid / 100);
    
    // Calculate ADP for each grade
    const newAdpByGrade: Record<string, number> = {};
    let totalEnroll = 0;
    let totalAdp = 0;
    
    Object.entries(enrollmentByGrade).forEach(([grade, enrollment]) => {
      const adp = Math.round(enrollment * weightedParticipation);
      newAdpByGrade[grade] = adp;
      totalEnroll += enrollment;
      totalAdp += adp;
    });
    
    const annualMeals = totalAdp * servingDays;
    
    // Only update if values actually changed to avoid infinite loop
    if (
      JSON.stringify(newAdpByGrade) !== JSON.stringify(profile.adpByGrade) ||
      totalEnroll !== profile.totalEnrollment ||
      totalAdp !== profile.totalAdp ||
      annualMeals !== profile.totalAnnualMeals
    ) {
      setProfile(prev => ({
        ...prev,
        adpByGrade: newAdpByGrade,
        totalEnrollment: totalEnroll,
        totalAdp: totalAdp,
        totalAnnualMeals: annualMeals,
      }));
    }
  }, [
    profile.enrollmentByGrade, 
    profile.servingDays, 
    profile.participationRates, 
    profile.demographics,
    profile.adpByGrade,
    profile.totalEnrollment,
    profile.totalAdp,
    profile.totalAnnualMeals,
  ]);

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

      case 1: {
        // Calculate weighted participation for display
        const weightedParticipation = 
          (profile.demographics.freeRate / 100) * (profile.participationRates.free / 100) +
          (profile.demographics.reducedRate / 100) * (profile.participationRates.reduced / 100) +
          (profile.demographics.paidRate / 100) * (profile.participationRates.paid / 100);
        
        return (
          <Box>
            <Typography
              variant="h5"
              sx={{ mb: 2, fontWeight: 500, fontFamily: '"Google Sans", sans-serif' }}
            >
              Enrollment & Meal Planning
            </Typography>
            
            {/* Grade Level Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Select grade levels served:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
              {gradeOptions.map((grade) => (
                <Box
                  key={grade.id}
                  onClick={() => toggleGrade(grade.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: profile.gradeLevels.includes(grade.id)
                      ? '2px solid rgba(76, 175, 80, 0.6)'
                      : '2px solid rgba(200, 200, 200, 0.3)',
                    bgcolor: profile.gradeLevels.includes(grade.id)
                      ? 'rgba(76, 175, 80, 0.08)'
                      : 'rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{grade.icon}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {grade.label}
                    </Typography>
                    {profile.gradeLevels.includes(grade.id) && (
                      <CheckCircleIcon sx={{ ml: 'auto', color: 'rgba(76, 175, 80, 0.8)', fontSize: 16 }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Enrollment by Grade */}
            {profile.gradeLevels.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Enter enrollment by grade level:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
                  {profile.gradeLevels.map((gradeId) => {
                    const grade = gradeOptions.find((g) => g.id === gradeId);
                    return (
                      <TextField
                        key={gradeId}
                        size="small"
                        label={`${grade?.label} Enrollment`}
                        type="number"
                        value={profile.enrollmentByGrade[gradeId] || ''}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            enrollmentByGrade: {
                              ...profile.enrollmentByGrade,
                              [gradeId]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        InputProps={{
                          inputProps: { min: 0 }
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Serving Days */}
                <TextField
                  fullWidth
                  size="small"
                  label="Serving Days per Year"
                  type="number"
                  value={profile.servingDays}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      servingDays: parseInt(e.target.value) || 180,
                    })
                  }
                  helperText="Typical: 180 days for lunch program"
                  sx={{ mb: 2 }}
                  InputProps={{
                    inputProps: { min: 1, max: 365 }
                  }}
                />

                {/* Demographics */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Student eligibility breakdown (%):
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    label="Free %"
                    type="number"
                    value={profile.demographics.freeRate}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        demographics: {
                          ...profile.demographics,
                          freeRate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                  <TextField
                    size="small"
                    label="Reduced %"
                    type="number"
                    value={profile.demographics.reducedRate}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        demographics: {
                          ...profile.demographics,
                          reducedRate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                  <TextField
                    size="small"
                    label="Paid %"
                    type="number"
                    value={profile.demographics.paidRate}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        demographics: {
                          ...profile.demographics,
                          paidRate: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                </Box>

                {/* Participation Rates */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Participation rates by eligibility (%):
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 3 }}>
                  <TextField
                    size="small"
                    label="Free"
                    type="number"
                    value={profile.participationRates.free}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        participationRates: {
                          ...profile.participationRates,
                          free: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                  <TextField
                    size="small"
                    label="Reduced"
                    type="number"
                    value={profile.participationRates.reduced}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        participationRates: {
                          ...profile.participationRates,
                          reduced: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                  <TextField
                    size="small"
                    label="Paid"
                    type="number"
                    value={profile.participationRates.paid}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        participationRates: {
                          ...profile.participationRates,
                          paid: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                        },
                      })
                    }
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                </Box>

                {/* Calculation Summary */}
                {profile.totalEnrollment > 0 && (
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(33, 150, 243, 0.06)', 
                      borderRadius: 2,
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.8)', fontWeight: 600, display: 'block', mb: 1 }}>
                      📊 ANNUAL MEAL PROJECTION
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, fontSize: '0.75rem' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Total Enrollment:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'right' }}>
                        {profile.totalEnrollment.toLocaleString()} students
                      </Typography>
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Weighted Participation:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'right' }}>
                        {(weightedParticipation * 100).toFixed(1)}%
                      </Typography>
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Average Daily Participation:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'right' }}>
                        {profile.totalAdp.toLocaleString()} students
                      </Typography>
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Serving Days:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, textAlign: 'right' }}>
                        {profile.servingDays} days
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(33, 150, 243, 0.3)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.9)', fontWeight: 600 }}>
                          ANNUAL MEALS:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'rgba(33, 150, 243, 0.9)' }}>
                          {profile.totalAnnualMeals.toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                        Formula: {profile.totalAdp.toLocaleString()} ADP × {profile.servingDays} days
                      </Typography>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        );
      }

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
