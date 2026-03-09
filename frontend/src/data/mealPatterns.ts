/**
 * @file mealPatterns.ts
 * @brief USDA Meal Pattern requirements by grade group
 *
 * @details Sourced from USDA NSLP/CACFP meal pattern requirements.
 * Contains daily and weekly minimums, serving sizes, calorie ranges,
 * and vegetable subgroup requirements for each grade group.
 * This is a client-side copy of functions/data/usda_meal_patterns.json
 * so the frontend can work without the backend API.
 *
 * @date 2026-03-09
 */

export interface MealPatternServingSizes {
  meat_ma_oz: number;
  grain_oz_eq: number;
  veg_cups: number;
  fruit_cups: number;
  milk_cups: number;
}

export interface MealPatternDaily {
  meat_ma_oz_min: number;
  grain_oz_eq_min: number;
  veg_cups_min: number;
  fruit_cups_min: number;
  milk_cups_min: number;
}

export interface MealPatternWeekly {
  meat_ma_oz_min: number;
  meat_ma_oz_max?: number;
  grain_oz_eq_min: number;
  grain_oz_eq_max?: number;
  veg_cups_min: number;
  fruit_cups_min: number;
  milk_cups_min: number;
}

export interface MealPattern {
  label: string;
  meal_type: string;
  daily: MealPatternDaily;
  weekly: MealPatternWeekly;
  serving_sizes: MealPatternServingSizes;
  veg_subgroups?: Record<string, number>;
  calories_min: number;
  calories_max: number;
  sodium_mg_max: number;
}

export const mealPatterns: Record<string, MealPattern> = {
  prek: {
    label: 'Pre-K (3-5)',
    meal_type: 'CACFP',
    daily: { meat_ma_oz_min: 1.5, grain_oz_eq_min: 0.5, veg_cups_min: 0.125, fruit_cups_min: 0.25, milk_cups_min: 0.75 },
    weekly: { meat_ma_oz_min: 7.5, grain_oz_eq_min: 2.5, veg_cups_min: 0.625, fruit_cups_min: 1.25, milk_cups_min: 3.75 },
    serving_sizes: { meat_ma_oz: 1.5, grain_oz_eq: 0.5, veg_cups: 0.125, fruit_cups: 0.25, milk_cups: 0.75 },
    calories_min: 350,
    calories_max: 500,
    sodium_mg_max: 600,
  },
  elementary: {
    label: 'Elementary (K-5)',
    meal_type: 'NSLP',
    daily: { meat_ma_oz_min: 1.0, grain_oz_eq_min: 1.0, veg_cups_min: 0.75, fruit_cups_min: 0.5, milk_cups_min: 1.0 },
    weekly: { meat_ma_oz_min: 10, meat_ma_oz_max: 12, grain_oz_eq_min: 8, grain_oz_eq_max: 10, veg_cups_min: 3.75, fruit_cups_min: 2.5, milk_cups_min: 5 },
    veg_subgroups: { dark_green: 0.5, red_orange: 0.75, beans_peas: 0.5, starchy: 0.5, other: 0.5 },
    serving_sizes: { meat_ma_oz: 2.0, grain_oz_eq: 1.0, veg_cups: 0.75, fruit_cups: 0.5, milk_cups: 1.0 },
    calories_min: 550,
    calories_max: 650,
    sodium_mg_max: 1230,
  },
  middle: {
    label: 'Middle School (6-8)',
    meal_type: 'NSLP',
    daily: { meat_ma_oz_min: 1.0, grain_oz_eq_min: 1.0, veg_cups_min: 0.75, fruit_cups_min: 0.5, milk_cups_min: 1.0 },
    weekly: { meat_ma_oz_min: 10, meat_ma_oz_max: 12, grain_oz_eq_min: 8, grain_oz_eq_max: 10, veg_cups_min: 3.75, fruit_cups_min: 2.5, milk_cups_min: 5 },
    veg_subgroups: { dark_green: 0.5, red_orange: 0.75, beans_peas: 0.5, starchy: 0.5, other: 0.5 },
    serving_sizes: { meat_ma_oz: 2.0, grain_oz_eq: 1.0, veg_cups: 0.75, fruit_cups: 0.5, milk_cups: 1.0 },
    calories_min: 600,
    calories_max: 700,
    sodium_mg_max: 1360,
  },
  high: {
    label: 'High School (9-12)',
    meal_type: 'NSLP',
    daily: { meat_ma_oz_min: 2.0, grain_oz_eq_min: 2.0, veg_cups_min: 1.0, fruit_cups_min: 1.0, milk_cups_min: 1.0 },
    weekly: { meat_ma_oz_min: 12, meat_ma_oz_max: 14, grain_oz_eq_min: 10, grain_oz_eq_max: 12, veg_cups_min: 5.0, fruit_cups_min: 5.0, milk_cups_min: 5 },
    veg_subgroups: { dark_green: 0.5, red_orange: 1.25, beans_peas: 0.5, starchy: 0.5, other: 0.75 },
    serving_sizes: { meat_ma_oz: 2.0, grain_oz_eq: 2.0, veg_cups: 1.0, fruit_cups: 1.0, milk_cups: 1.0 },
    calories_min: 750,
    calories_max: 850,
    sodium_mg_max: 1420,
  },
};

/** Grade group display metadata */
export const gradeGroupMeta: Record<string, { emoji: string; color: string }> = {
  prek: { emoji: '👶', color: 'rgba(156, 39, 176, 0.8)' },
  elementary: { emoji: '🎒', color: 'rgba(33, 150, 243, 0.8)' },
  middle: { emoji: '📚', color: 'rgba(255, 152, 0, 0.8)' },
  high: { emoji: '🎓', color: 'rgba(76, 175, 80, 0.8)' },
};
