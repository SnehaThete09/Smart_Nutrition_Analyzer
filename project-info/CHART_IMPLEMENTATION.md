# 📊 Grouped Bar Chart Implementation

## Overview

The nutrition chart has been upgraded from a single 6-metric bar chart to a **grouped bar chart** that compares actual macronutrient values against scientifically-calculated thresholds.

---

## 🎯 Why This Change?

### Previous Chart
- ❌ Single bar per metric (calories, protein, fat, carbs, sugar, sodium)
- ❌ Vastly different scales made small values unreadable
- ❌ No context or benchmark for evaluation

### New Chart
- ✅ **Grouped bars** show actual vs. threshold side-by-side
- ✅ **Four key metrics** only: Protein, Fat, Carbs, Sodium
- ✅ **Clear benchmarking** - instantly see if you're meeting targets or exceeding limits
- ✅ **Consistent scale** - all values in grams, much more readable

---

## 📐 Chart Structure

### Metrics Displayed
| Metric | Unit | Why? |
|--------|------|------|
| Protein (g) | grams | Essential macronutrient |
| Fat (g) | grams | Important for health but needs limiting |
| Carbs (g) | grams | Major energy source, needs balancing |
| Sodium (g) | grams | Health concern - must limit |

### Two Datasets
1. **Actual Content** (Coral Orange: #FF7F50)
   - The actual macronutrient values from the food

2. **Threshold / Limit** (Medium Grey: #B0B0B0)
   - The maximum/minimum values you should aim for
   - Calculated dynamically based on total calories

---

## 🧮 Threshold Calculation Formulas

All thresholds are calculated on the frontend using these formulas:

### 1. Protein Threshold (Minimum Target)
```javascript
threshold_protein = (total_calories * 0.10) / 4
```
- **Meaning**: 10% of total calories should come from protein
- **Formula**: Convert percentage back to grams using 4 kcal/g for protein
- **Example**: 500 kcal × 0.10 ÷ 4 = 12.5g minimum protein

### 2. Fat Threshold (Maximum Limit)
```javascript
threshold_fat = (total_calories * 0.40) / 9
```
- **Meaning**: Maximum 40% of total calories from fat
- **Formula**: Convert percentage back to grams using 9 kcal/g for fat
- **Example**: 500 kcal × 0.40 ÷ 9 = 22.2g maximum fat

### 3. Carbs Threshold (Maximum Limit)
```javascript
threshold_carbs = (total_calories * 0.60) / 4
```
- **Meaning**: Maximum 60% of total calories from carbs
- **Formula**: Convert percentage back to grams using 4 kcal/g for carbs
- **Example**: 500 kcal × 0.60 ÷ 4 = 75g maximum carbs

### 4. Sodium Threshold (Fixed Maximum)
```javascript
threshold_sodium = 0.6
```
- **Meaning**: Fixed maximum limit of 0.6g per 100g of food
- **Note**: Not scaled by calories - it's a fixed health limit

---

## 💻 JavaScript Implementation

### Function Signature
```javascript
function initChart(nutrition)
```

### Parameters
The function expects a `nutrition` object with these properties:
```javascript
{
    protein: float,      // Actual protein in grams
    fat: float,          // Actual fat in grams
    carbs: float,        // Actual carbs in grams
    sodium: float,       // Actual sodium in grams
    calories: float      // Total calories (used for calculations)
}
```

### Step-by-Step Logic

1. **Extract Actual Values**
   ```javascript
   const actualProtein = parseFloat(nutrition.protein) || 0;
   const actualFat = parseFloat(nutrition.fat) || 0;
   const actualCarbs = parseFloat(nutrition.carbs) || 0;
   const actualSodium = parseFloat(nutrition.sodium) || 0;
   const totalCalories = parseFloat(nutrition.calories) || 0;
   ```

2. **Calculate Thresholds**
   ```javascript
   const thresholdProtein = (totalCalories * 0.10) / 4;
   const thresholdFat = (totalCalories * 0.40) / 9;
   const thresholdCarbs = (totalCalories * 0.60) / 4;
   const thresholdSodium = 0.6;
   ```

3. **Create Two Datasets**
   - Dataset 1: Actual values [protein, fat, carbs, sodium]
   - Dataset 2: Threshold values [threshold_protein, threshold_fat, threshold_carbs, 0.6]

4. **Render Grouped Chart**
   - Bars appear side-by-side for easy comparison
   - Tooltips show detailed information

---

## 🎨 Colors & Styling

### Dataset Colors
| Dataset | Primary Color | Hover Color | Border Color |
|---------|---|---|---|
| Actual Content | #FF7F50 (Coral Orange) | #FF6B3D (Darker Orange) | #FF6B3D |
| Threshold / Limit | #B0B0B0 (Medium Grey) | #808080 (Dark Grey) | #808080 |

### Font & Layout
- **Font Family**: Poppins (matches site theme)
- **Font Size**: 12-14px for readability
- **Border Radius**: 6px for modern look
- **Legend Position**: Top of chart

---

## 🖱️ Tooltip Behavior

### Hover Information
When you hover over a bar, you see:

1. **Title**: The metric name (e.g., "Protein (g)")
2. **Data Points**: 
   - Actual Content: X.XX g
   - Threshold / Limit: Y.YY g
3. **Status**:
   - Protein: "✅ ABOVE TARGET" or "⚠️ BELOW TARGET"
   - Other metrics: "✅ WITHIN LIMIT" or "🚨 EXCEEDS LIMIT"

### Example Tooltip
```
Protein (g)
Actual Content: 2.14 g
Threshold / Limit: 12.50 g
Status: ⚠️ BELOW TARGET
```

---

## 📈 Visual Examples

### Example 1: Kit Kat (500 cal/100g)
```
Thresholds for 500 calories:
- Protein: 12.5g (you have 4.76g) ⚠️ LOW
- Fat: 22.2g (you have 26.19g) 🚨 HIGH
- Carbs: 75g (you have 66.67g) ✅ GOOD
- Sodium: 0.6g (you have 0.04g) ✅ GOOD

Chart shows: Bars for Fat exceed threshold
```

### Example 2: Ideal Healthy Food
```
Thresholds for 300 calories:
- Protein: 7.5g (you have 15g) ✅ ABOVE TARGET
- Fat: 13.3g (you have 8g) ✅ WITHIN LIMIT
- Carbs: 45g (you have 48g) ✅ WITHIN LIMIT
- Sodium: 0.6g (you have 0.1g) ✅ WITHIN LIMIT

Chart shows: All actual bars below or match thresholds
```

---

## 🔄 Chart Lifecycle

### Initialization
1. User uploads image
2. Backend classifies image and returns nutrition data
3. `displayResults()` is called with API response
4. `displayResults()` calls `initChart(nutrition)` with pack values

### Destruction & Recreation
- If old chart exists: `nutritionChart.destroy()`
- New chart is created with fresh data
- Ensures no memory leaks on repeated uploads

### Code
```javascript
// Destroy existing chart if it exists
if (nutritionChart) {
    nutritionChart.destroy();
}

// Create new grouped bar chart
nutritionChart = new Chart(ctx, { /* config */ });
```

---

## 📊 Technical Specifications

### Chart Type
- **Type**: Grouped Bar Chart (vertical bars)
- **Stacked**: No (bars appear side-by-side)
- **Responsive**: Yes
- **Aspect Ratio**: Maintains container ratio

### Data Structure
```javascript
{
    labels: ['Protein (g)', 'Fat (g)', 'Carbs (g)', 'Sodium (g)'],
    datasets: [
        {
            label: 'Actual Content',
            data: [actualProtein, actualFat, actualCarbs, actualSodium],
            backgroundColor: '#FF7F50',
            borderColor: '#FF6B3D',
            // ... styling
        },
        {
            label: 'Threshold / Limit',
            data: [thresholdProtein, thresholdFat, thresholdCarbs, 0.6],
            backgroundColor: '#B0B0B0',
            borderColor: '#808080',
            // ... styling
        }
    ]
}
```

---

## 🛠️ Configuration Options

### Options Object Key Settings
```javascript
{
    responsive: true,          // Responsive to container size
    maintainAspectRatio: false, // Height determined by canvas parent
    indexAxis: undefined,       // Vertical bars (not horizontal)
    grouped: true,              // Enable grouped display
    // ... other options
}
```

### Scale Configuration
```javascript
scales: {
    y: {
        beginAtZero: true,     // Y-axis starts at 0
        stacked: false,        // Grouped, not stacked
        // ... ticks, grid
    },
    x: {
        // X-axis (metrics)
    }
}
```

---

## 🐛 Debug Output

The function logs debug information to the browser console:

```
[DEBUG] Chart Data:
Actual - Protein: 2.14 | Threshold: 12.50
Actual - Fat: 11.79 | Threshold: 22.22
Actual - Carbs: 30.00 | Threshold: 75.00
Actual - Sodium: 0.018 | Threshold: 0.60
```

Use your browser's Developer Tools (F12) to see these logs.

---

## ✨ Key Improvements Over Previous Chart

| Aspect | Before | After |
|--------|--------|-------|
| **Metrics** | 6 metrics (mixed units) | 4 focused metrics (grams) |
| **Scale** | Vastly different ranges | Consistent gram scale |
| **Context** | Just numbers | Actual vs. Threshold comparison |
| **Readability** | Small values hidden | All values clearly visible |
| **Information** | No guidance | Status indicators (✅ 🚨 ⚠️) |
| **Visuals** | Single-color bars | Two-color grouped bars |

---

## 📱 Responsive Behavior

### On Different Screen Sizes
- **Desktop**: Full chart with detailed tooltips
- **Tablet**: Scaled proportionally, tooltip friendly
- **Mobile**: Responsive bars, touch-friendly tooltips

The chart uses `responsive: true` and `maintainAspectRatio: false` for flexible sizing.

---

## 🔗 Integration Points

### Called From
- `displayResults(data)` function when API response is received

### Receives Data From
- Backend API `/analyze` endpoint
- Response contains `nutrition` object with actual values

### Updates
- Chart canvas with ID `nutritionChart`
- Must exist in HTML: `<canvas id="nutritionChart"></canvas>`

---

## 💡 Future Enhancements

Possible additions:
1. [ ] Year/week progress tracking
2. [ ] Dietary preference profiles (vegetarian, keto, etc.)
3. [ ] Personalized threshold adjustments
4. [ ] Trend graphs (multiple foods over time)
5. [ ] Export chart as image

