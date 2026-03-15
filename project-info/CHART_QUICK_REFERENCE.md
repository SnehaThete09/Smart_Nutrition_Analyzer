# ⚡ Grouped Bar Chart - Quick Reference

## 🎯 One-Liner Summary
The new chart displays **Actual vs. Threshold** side-by-side for four key macronutrients (Protein, Fat, Carbs, Sodium).

---

## 📊 The Four Metrics

### 1. Protein (g) - Minimum Target
```
Threshold Formula: (total_calories × 0.10) ÷ 4
Status: ✅ ABOVE = Meeting target | ⚠️ BELOW = Insufficient
```
**Example**: 500 cal food → Target: 12.5g protein minimum

---

### 2. Fat (g) - Maximum Limit
```
Threshold Formula: (total_calories × 0.40) ÷ 9
Status: ✅ WITHIN = Healthy | 🚨 EXCEEDS = Too much fat
```
**Example**: 500 cal food → Max: 22.2g fat

---

### 3. Carbs (g) - Maximum Limit
```
Threshold Formula: (total_calories × 0.60) ÷ 4
Status: ✅ WITHIN = Healthy | 🚨 EXCEEDS = Too many carbs
```
**Example**: 500 cal food → Max: 75g carbs

---

### 4. Sodium (g) - Fixed Maximum
```
Threshold Formula: 0.6 (fixed, not calculated)
Status: ✅ WITHIN = Low sodium | 🚨 EXCEEDS = High sodium
```
**Example**: All foods → Max: 0.6g sodium

---

## 🎨 Color Key

| Color | Meaning |
|-------|---------|
| **Coral Orange (#FF7F50)** | Actual Content (what the food has) |
| **Medium Grey (#B0B0B0)** | Threshold / Limit (what you should aim for) |

---

## 💬 Tooltip Examples

### Hover Over Protein Bar
```
┌─────────────────────────────┐
│ Protein (g)                 │
├─────────────────────────────┤
│ Actual Content: 4.76 g      │
│ Threshold / Limit: 12.50 g  │
├─────────────────────────────┤
│ Status: ⚠️ BELOW TARGET     │
└─────────────────────────────┘
```

Meaning: This food has 4.76g protein, but you need 12.5g minimum.

---

### Hover Over Fat Bar
```
┌─────────────────────────────┐
│ Fat (g)                     │
├─────────────────────────────┤
│ Actual Content: 26.19 g     │
│ Threshold / Limit: 22.22 g  │
├─────────────────────────────┤
│ Status: 🚨 EXCEEDS LIMIT    │
└─────────────────────────────┘
```

Meaning: This food has 26.19g fat, exceeding the 22.2g limit.

---

## 📈 Reading the Chart

### Interpretation Guide

| Scenario | What It Means | Action |
|----------|---|---|
| Orange > Grey (Protein) | Good protein content | ✅ Keep it |
| Orange < Grey (Protein) | Low protein | ⚠️ Add protein source |
| Orange < Grey (Fat/Carbs) | Within healthy limits | ✅ Good choice |
| Orange > Grey (Fat/Carbs) | Exceeds limit | 🚨 Consume sparingly |
| Orange << Grey (Sodium) | Low sodium (ideal) | ✅ Heart healthy |
| Orange ≈ Grey (Sodium) | High sodium | 🚨 Limit intake |

---

## 🔢 Formula Breakdown

### Protein Threshold
```
Step 1: Calculate 10% of total calories
       500 kcal × 0.10 = 50 kcal from protein

Step 2: Convert kcal to grams (protein = 4 kcal/g)
       50 kcal ÷ 4 = 12.5 grams protein (minimum)
```

### Fat Threshold
```
Step 1: Calculate 40% of total calories
       500 kcal × 0.40 = 200 kcal from fat

Step 2: Convert kcal to grams (fat = 9 kcal/g)
       200 kcal ÷ 9 = 22.2 grams fat (maximum)
```

### Carbs Threshold
```
Step 1: Calculate 60% of total calories
       500 kcal × 0.60 = 300 kcal from carbs

Step 2: Convert kcal to grams (carbs = 4 kcal/g)
       300 kcal ÷ 4 = 75 grams carbs (maximum)
```

### Sodium Threshold
```
Fixed limit: 0.6 grams (per 100g of food)
No calculation needed - same for all foods
```

---

## 🧪 Test Cases

### Test 1: Kit Kat Analysis
```
Input: Kit Kat (45g pack)
- Calories: 225 kcal
- Actual Protein: 2.14g | Threshold: 5.625g → ⚠️ LOW
- Actual Fat: 11.79g | Threshold: 10g → 🚨 HIGH
- Actual Carbs: 30g | Threshold: 33.75g → ✅ OK
- Actual Sodium: 0.018g | Threshold: 0.6g → ✅ OK

Expected Chart: Fat bar exceeds threshold, Protein below threshold
```

### Test 2: Ideal Healthy Food
```
Input: Balanced 300 cal meal
- Calories: 300 kcal
- Actual Protein: 15g | Threshold: 7.5g → ✅ ABOVE
- Actual Fat: 8g | Threshold: 13.3g → ✅ WITHIN
- Actual Carbs: 45g | Threshold: 45g → ✅ PERFECT
- Actual Sodium: 0.05g | Threshold: 0.6g → ✅ WITHIN

Expected Chart: All actual bars below or at threshold (ideal)
```

### Test 3: High Sodium Snack
```
Input: Salty snack
- Sodium: 0.8g | Threshold: 0.6g → 🚨 EXCEEDS

Expected Chart: Sodium grey bar noticeably shorter, orange bar taller
```

---

## 🔧 Code Integration

### Function Call
```javascript
// This is called automatically when results are displayed
initChart(nutrition);

// Where nutrition contains:
// {
//     protein: 2.14,
//     fat: 11.79,
//     carbs: 30,
//     sodium: 0.018,
//     calories: 225
// }
```

### What Happens Internally
1. Old chart destroyed (if exists)
2. Thresholds calculated using formulas
3. Two datasets created: Actual vs. Threshold
4. Grouped bar chart rendered
5. Debug logs printed to console

---

## 💡 Pro Tips

### Understanding Colors
- 🟠 **Orange** = What you're eating (Actual)
- ⚪ **Grey** = What you should eat (Threshold)
- Compare the heights to see if you're hitting targets!

### Reading Status Badges
- ✅ = Positive (above target or within limit)
- ⚠️ = Warning (below target)
- 🚨 = Critical (exceeds limit)

### Threshold Philosophy
- **Protein**: Higher is better (minimum target)
- **Fat**: Lower is better (maximum limit)
- **Carbs**: Lower is better (maximum limit)
- **Sodium**: Much lower is better (dangerous if high)

---

## 🎓 Scientific Basis

### Why These Thresholds?

| Metric | Guideline Source | Rationale |
|--------|---|---|
| Protein 10% | WHO / USDA | Minimum for body repair & functions |
| Fat 40% | Nutrition science | Maximum for heart health |
| Carbs 60% | Dietary guidelines | Maximum for balanced nutrition |
| Sodium 0.6g | WHO recommendation | Reduces hypertension risk |

---

## 🐛 Troubleshooting

### Chart Not Showing?
- Check: Is canvas element `<canvas id="nutritionChart"></canvas>` in your HTML?
- Check: Is Chart.js library loaded?
- Check: Is `initChart()` being called?

### Numbers Look Wrong?
- Open browser console (F12)
- Look for `[DEBUG] Chart Data:` logs
- Verify thresholds match expected calculations

### Colors Inverted?
- Coral Orange should be "Actual Content"
- Grey should be "Threshold / Limit"
- If swapped, check dataset order in initChart function

---

## 📞 Quick Calc Tool

To manually verify thresholds for any food:

```
Protein Minimum:
  1. Get total calories
  2. Multiply by 0.10
  3. Divide by 4
  Example: 500 × 0.10 ÷ 4 = 12.5g

Fat Maximum:
  1. Get total calories
  2. Multiply by 0.40
  3. Divide by 9
  Example: 500 × 0.40 ÷ 9 = 22.2g

Carbs Maximum:
  1. Get total calories
  2. Multiply by 0.60
  3. Divide by 4
  Example: 500 × 0.60 ÷ 4 = 75g

Sodium Maximum:
  Always 0.6g (no calculation needed)
```

