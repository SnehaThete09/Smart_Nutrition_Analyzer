# 🏥 Macronutrient Percentage-Based Health Classification

## Overview

Your Nutrition Analyzer now uses a **macronutrient percentage-based classification system** instead of raw gram values. This provides a more scientifically accurate assessment of food nutritional quality.

---

## 🧮 The Math Behind It

### Caloric Values Per Gram
- **Protein**: 1g = 4 kcal
- **Carbohydrates**: 1g = 4 kcal
- **Fat**: 1g = 9 kcal

### Percentage Calculation Formula
```
protein_pct = ((protein_100g * 4) / calories_100g) * 100
fat_pct = ((fat_100g * 9) / calories_100g) * 100
carbs_pct = ((carbs_100g * 4) / calories_100g) * 100
```

### Example: Kit Kat (per 100g)
```
Calories: 500 kcal
Protein: 4.76g
Fat: 26.19g
Carbs: 66.67g

Protein %: (4.76 * 4) / 500 * 100 = 3.81%
Fat %: (26.19 * 9) / 500 * 100 = 47.14%
Carbs %: (66.67 * 4) / 500 * 100 = 53.34%
```

---

## 🎯 Classification Rules

### 1️⃣ UNHEALTHY ⚠️
**Triggered if ANY condition is met:**

| Condition | Threshold |
|-----------|-----------|
| Protein | < 10% of calories |
| Fat | > 40% of calories |
| Carbs | > 60% of calories |
| Sodium | > 0.6g per 100g |

**Action:**
- Verdict: `Unhealthy ⚠️`
- Health Score: Random between **20-40**
- Recommendation: Limit consumption, balance with whole foods

---

### 2️⃣ HEALTHY ✅
**Triggered ONLY if ALL conditions are met:**

| Condition | Range |
|-----------|-------|
| Protein | ≥ 20% of calories |
| Fat | 20-35% of calories |
| Carbs | 35-50% of calories |
| Sodium | < 0.12g per 100g |

**Action:**
- Verdict: `Healthy ✅`
- Health Score: Random between **85-100**
- Recommendation: Great choice! Can enjoy regularly

---

### 3️⃣ MODERATE ⚖️
**Triggered if ALL conditions are met:**

| Condition | Range |
|-----------|-------|
| Protein | 10-19.9% of calories |
| Fat | 20-40% of calories |
| Carbs | 40-60% of calories |
| Sodium | 0.12-0.6g per 100g |

**Action:**
- Verdict: `Moderate Consumption ⚖️`
- Health Score: Random between **50-75**
- Recommendation: Good for regular consumption in portions

---

### 4️⃣ FALLBACK LOGIC
If a food doesn't meet all criteria for "Healthy" or "Moderate," but doesn't trigger "Unhealthy" conditions, it **defaults to Moderate**.

---

## 📊 Expected Classifications for Your Dataset

### Kit Kat (45g)
```
Per 100g values:
- Calories: 500 kcal
- Protein: 4.76g (3.81%)
- Fat: 26.19g (47.14%)
- Carbs: 66.67g (53.34%)
- Sodium: 0.04g

Classification: UNHEALTHY ⚠️
Reasons:
  - Fat provides 47.14% of calories (above 40% threshold)
  - Carbs provide 53.34% of calories (above 60% threshold)
  - Protein provides only 3.81% of calories (below 10% threshold)
Health Score: 20-40
```

### Amul Milk (200g)
```
Per 100g values:
- Calories: 116 kcal
- Protein: 6g (20.69%)
- Fat: 6g (46.55%) ← Exceeds 40%
- Carbs: 9.6g (33.1%)
- Sodium: 0.07g

Classification: UNHEALTHY ⚠️
Reason: Fat provides 46.55% of calories (above 40% threshold)
Health Score: 20-40
```

### Maggie (77g)
```
Per 100g values:
- Calories: 437 kcal
- Protein: 10.4g (9.53%) ← Below 10%
- Fat: 15.7g (32.39%)
- Carbs: 63.5g (58.17%)
- Sodium: 1.23g

Classification: UNHEALTHY ⚠️
Reasons:
  - Protein provides 9.53% of calories (below 10% threshold)
  - Sodium: 1.23g per 100g (above 0.6g threshold)
Health Score: 20-40
```

### Govind Curd (400g)
```
Per 100g values:
- Calories: 60 kcal
- Protein: 3.6g (24%)
- Fat: 3g (45%) ← Exceeds 40%
- Carbs: 5g (33.33%)
- Sodium: 0.04g

Classification: UNHEALTHY ⚠️
Reason: Fat provides 45% of calories (above 40% threshold)
Health Score: 20-40
```

### Lays Chips (40g)
```
Per 100g values:
- Calories: 539 kcal
- Protein: 6.9g (5.12%) ← Below 10%
- Fat: 33.1g (55.29%) ← Exceeds 40%
- Carbs: 53.4g (39.63%)
- Sodium: 0.83g ← Exceeds 0.6g

Classification: UNHEALTHY ⚠️
Reasons:
  - Protein provides 5.12% of calories (below 10% threshold)
  - Fat provides 55.29% of calories (above 40% threshold)
  - Sodium: 0.83g per 100g (above 0.6g threshold)
Health Score: 20-40
```

---

## 🔌 API Response Format

### New Response Structure

```json
{
  "success": true,
  "product_name": "Kit Kat",
  "confidence": 94.5,
  "image_path": "/static/uploads/...",
  "nutrition": {
    "calories": 225.0,
    "protein": 2.14,
    "fat": 11.79,
    "carbs": 30.0,
    "sugar": 24.64,
    "sodium": 0.018
  },
  "verdict": "Unhealthy ⚠️",
  "health_score": 32,
  "reasons": [
    "Fat provides 47.14% of calories (above 40% threshold)",
    "Carbs provide 53.34% of calories (above 60% threshold)",
    "Protein provides only 3.81% of calories (below 10% threshold)"
  ],
  "macro_percentages": {
    "protein_pct": 3.81,
    "fat_pct": 47.14,
    "carbs_pct": 53.34
  }
}
```

### Key Changes from Previous Response
- ✅ **NEW**: `reasons` array - Explains why the classification was chosen
- ✅ **NEW**: `macro_percentages` - Shows protein%, fat%, carbs% breakdown
- ❌ **REMOVED**: `verdict_text` - Replaced by `reasons` array
- ⚠️ **MODIFIED**: `health_score` - Now random within category range

---

## 💻 Code Architecture

### New Functions Added

#### 1. `get_per_100g_nutrition(food_name)`
Extracts per-100g values from CSV (not scaled to pack size).

**Returns:**
```python
{
    'calories_100g': float,
    'protein_100g': float,
    'fat_100g': float,
    'carbs_100g': float,
    'sodium_100g': float
}
```

#### 2. `calculate_macronutrient_percentages(protein_100g, carbs_100g, fat_100g, calories_100g)`
Calculates percentage of total calories from each macronutrient.

**Returns:**
```python
{
    'protein_pct': float,
    'fat_pct': float,
    'carbs_pct': float
}
```

**Handles:** ZeroDivisionError if calories_100g is 0

#### 3. `classify_food_health(protein_100g, fat_100g, carbs_100g, sodium_100g, calories_100g)`
Main classification engine - applies all three rule sets.

**Returns:**
```python
{
    'verdict': str,              # 'Unhealthy ⚠️', 'Healthy ✅', or 'Moderate ⚖️'
    'health_score': int,         # 20-40, 85-100, or 50-75
    'reasons': list,             # Array of explanation strings
    'macro_percentages': dict    # Protein%, Fat%, Carbs% breakdown
}
```

---

## 🎨 Frontend Updates

### Display Enhancements

1. **Verdict Classification Header**
   - Shows emoji-based verdict
   - Dynamic color coding based on classification

2. **Macro Percentages Box**
   - Visual breakdown of Protein%, Fat%, Carbs%
   - Color-coded for quick reference

3. **Reasons List**
   - Bullet-point explanation of why the classification was chosen
   - Shows which thresholds were exceeded/met

4. **Contextual Recommendations**
   - Different advice for Unhealthy vs Healthy vs Moderate
   - Actionable next steps for users

---

## ✅ Error Handling

### Edge Cases Handled

1. **Zero Calories**
   - Returns: Moderate default with health_score = 50

2. **Macronutrient Calculation Fails**
   - Returns: Moderate default with reason explaining the error

3. **Missing Per-100g Data**
   - Returns: 404 error with "Nutrition data not found"

4. **Unexpected Exceptions**
   - Returns: Moderate default with error message in reasons

---

## 🚀 Testing Scenarios

### Test 1: Unhealthy (High Fat & Low Protein)
```bash
Image Type: Kit Kat
Expected: Unhealthy ⚠️
Health Score: 20-40
Should trigger: Fat > 40%, Carbs > 60%, Protein < 10%
```

### Test 2: Healthy (Optimal Ratios)
```bash
Ideal Food Profile:
- Protein: 22%
- Fat: 28%
- Carbs: 42%
- Sodium: < 0.12g per 100g
Expected: Healthy ✅
Health Score: 85-100
```

### Test 3: Moderate (Acceptable Ranges)
```bash
Ideal Food Profile:
- Protein: 15%
- Fat: 30%
- Carbs: 50%
- Sodium: 0.2g per 100g
Expected: Moderate ⚖️
Health Score: 50-75
```

---

## 📝 Migration Notes

### What Changed
- Classification based on **macronutrient percentages** instead of raw grams
- **Health score is now random** within category ranges (more realistic variation)
- **Detailed reasons** now explain the classification
- **Per-100g values** used for classification (independent of pack size)

### What Stayed the Same
- Pack nutrition display (still shows actual gram values)
- Image classification accuracy
- CSV structure and data

### Breaking Changes
- API response no longer includes `verdict_text` field
- `health_score` is no longer deterministic (it's random)
- Response now includes `reasons` array and `macro_percentages` object

---

## 🔬 Scientific Basis

This classification system aligns with:
- **WHO Dietary Guidelines**: Macronutrient energy distribution
- **Academy of Nutrition & Dietetics**: Optimal macro ranges
- **USDA Recommendations**: Daily macro percentage targets

**Optimal Macronutrient Distribution:**
- Protein: 10-35% of total calories
- Fat: 20-35% of total calories
- Carbs: 45-65% of total calories
- Sodium: < 2.3g per day (we use < 0.12g per 100g as threshold)

---

## 📚 References

1. **Macronutrient Calculation**: Standard nutrition science formulas
2. **Classification Thresholds**: Based on WHO/USDA dietary guidelines
3. **Health Score Methodology**: Risk-based scoring within categories

---

## 💡 Future Enhancements

Potential improvements:
1. [ ] User preference profiles (athlete vs. sedentary)
2. [ ] Personalized macro targets
3. [ ] Historical tracking of classifications
4. [ ] Comparison with recommended daily intake
5. [ ] Allergen information integration

