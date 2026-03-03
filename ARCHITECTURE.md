# 🏗️ TECHNICAL ARCHITECTURE GUIDE

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER (Frontend)                      │
│  ┌─────────────── HTML/CSS/JavaScript ──────────────────┐      │
│  │  • Image upload interface                             │      │
│  │  • Real-time preview                                  │      │
│  │  • Results display                                    │      │
│  │  • Recommendations rendering                          │      │
│  └───────────────────────────────────────────────────────┘      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                         HTTP POST /analyze
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FLASK BACKEND (app.py)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Receive image file upload                            │   │
│  │ 2. Validate file type & size                            │   │
│  │ 3. Save to static/uploads/                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Image Preprocessing                                      │   │
│  │ • Load image with PIL                                   │   │
│  │ • Resize to 224x224                                     │   │
│  │ • Normalize to [0,1]                                    │   │
│  │ • Expand batch dimension                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Model Inference (TensorFlow)                             │   │
│  │ • Load trained model.keras                              │   │
│  │ • Generate predictions (7 classes)                      │   │
│  │ • Get argmax for predicted class                        │   │
│  │ • Calculate confidence score                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Data Retrieval (Pandas)                                 │   │
│  │ • Search nutrition.csv for food_name                    │   │
│  │ • Extract nutrition columns                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Verdict Logic (Rule-Based)                              │   │
│  │ if sugar > 25g:        → "⚠️ High Sugar"               │   │
│  │ elif fat > 30g:        → "⚠️ High Fat"                 │   │
│  │ elif calories < 250:   → "✓ Low Calorie/Snack"        │   │
│  │ else:                  → "⚖️ Moderate/Balanced"        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            ↓                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ JSON Response                                            │   │
│  │ • product_name                                          │   │
│  │ • confidence                                            │   │
│  │ • nutrition{calories, protein, fat, ...}               │   │
│  │ • verdict                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                        JSON Response 200/400/500
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BROWSER - Update UI                             │
│  • Display nutrition grid                                        │
│  • Show verdict with color coding                               │
│  • Render recommendations based on verdict                      │
│  • Scroll to results section                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (static/js/script.js)

**Key Functions:**
```javascript
analyze()              // Main entry point - handles form submission
preprocess()           // Prepares image for submission  
displayResults()       // Renders nutrition & verdict
getVerdictClass()      // Determines styling based on verdict
getRecommendation()    // Generates health tips
showLoading()          // Shows loading animation
showError()            // Displays error messages
```

**Flow:**
```
User selects image
    ↓
File preview shown
    ↓
Click "Analyze" button
    ↓
analyze() called
    ↓
FormData created with image
    ↓
fetch() POST to /analyze
    ↓
Wait for response
    ↓
displayResults() renders JSON response
    ↓
User sees nutrition & recommendations
```

### 2. Backend (app.py) - Core Logic

**Key Functions:**
```python
load_resources()           # Initialize model & CSV at startup
preprocess_image()         # Resize & normalize image to 224x224
predict_class()            # Run TensorFlow inference
get_nutrition_data()       # Search CSV for product data
determine_verdict()        # Apply health verdict rules
analyze() [POST /analyze]  # Main API endpoint
```

**Request/Response Flow:**
```
POST /analyze
├── Validate file exists & type
├── Save to static/uploads/{timestamp}_{filename}
├── preprocess_image(filepath)
│   ├── Load PIL Image
│   ├── Resize to (224, 224)
│   ├── Normalize [0,1]
│   └── Return np.ndarray (1,224,224,3)
├── predict_class(img_array)
│   ├── model.predict() → [batch_size, 7]
│   ├── argmax → predicted_idx
│   ├── Get confidence score
│   └── Return class_name, confidence
├── get_nutrition_data(predicted_class)
│   ├── Search nutrition_df
│   ├── Extract food_row
│   └── Return dict with nutrients
├── determine_verdict(nutrition_data)
│   ├── Check sugar threshold
│   ├── Check fat threshold
│   ├── Check calorie threshold
│   └── Return verdict string
└── Return JSON response
```

### 3. Model (train_model.py) - MobileNetV2 Architecture

```
Input: (224, 224, 3)
    ↓
[Pre-trained MobileNetV2 - ImageNet Weights]
    ↓
Global Average Pooling 2D
    ↓
Dense(128, relu)
    ↓
Dropout(0.3)
    ↓
Dense(7, softmax) → Output logits
    ↓
Argmax → Predicted class (0-6)
```

**Training Configuration:**
```python
Model: MobileNetV2 (2.26M parameters)
Optimizer: Adam(lr=0.0001)
Loss: Categorical Crossentropy
Metrics: Accuracy
Augmentation:
  - Rescale: 1/255
  - Shear: 0.2
  - Zoom: 0.2
  - Flip: Horizontal
Batch Size: 32
Epochs: 15
```

## Data Flow Sequences

### Scenario 1: Image Classification

```
Timeline: t=0 to t=500ms

t=0ms:     User uploads image
t=10ms:    Backend receives FormData
t=20ms:    File saved to disk
t=30ms:    Image preprocessed (PIL load + resize)
t=100ms:   Model inference (MobileNetV2)
t=150ms:   CSV search for nutrition data
t=160ms:   Verdict logic applied
t=170ms:   JSON response generated
t=200ms:   Browser receives response
t=300ms:   UI updated with results
t=500ms:   Animations complete
```

### Scenario 2: Error Handling

```
File Upload Errors:
  ├── No file → 400 "No file provided"
  ├── Wrong type (pdf/txt) → 400 "Invalid file type"
  ├── > 16MB → 413 "File too large"
  └── Save failed → 500 "File save error"

Model Errors:
  ├── Model not loaded → 500 "Model not available"
  └── Inference failed → 500 "Prediction failed"

Data Errors:
  ├── CSV not found → 500 "Nutrition data missing"
  └── Food not in DB → 404 "Nutrition data not found"

Image Process Errors:
  ├── Corrupted image → 400 "Failed to process image"
  ├── Invalid dimensions → 400 "Image too small"
  └── Decode error → 500 "Image decode failed"
```

## Database Schema

### nutrition.csv Structure

```
Column                  Type        Range          Notes
─────────────────────────────────────────────────────────
food_name              STRING      -              Product name
calories_per_100       INT         60-539         kcal per 100g
protein_g_per_100      FLOAT       3.6-10.4       grams
fat_g_per_100g         FLOAT       3-33.1         grams
sarbs_g_per_100        INT         5-77.3         carbs (typo in CSV)
sugar_g_per_100        FLOAT       2.5-54.76      grams
sodium_g_per_100       FLOAT       0.04-1.23      grams
```

**Verdict Rule Thresholds:**
```python
Trigger              Threshold    Verdict           Color
────────────────────────────────────────────────────────
sugar_g              > 25g        "High Sugar"      🔴 Red
fat_g                > 30g        "High Fat"        🔴 Red
calories             < 250        "Low Calorie"     🟢 Green
(default)            -            "Moderate"        🟡 Yellow
```

## Performance Metrics

### Model Performance
- **Inference Time**: ~100-200ms (CPU), ~20-50ms (GPU)
- **Model Size**: ~9.2MB (MobileNetV2)
- **Memory**: ~200MB RAM (at runtime)

### API Performance
- **File Upload**: ~10-50ms
- **Image Preprocess**: ~50-100ms  
- **Model Inference**: ~100-200ms
- **CSV Lookup**: ~5-10ms
- **Total Output**: ~165-370ms

### Frontend Performance
- **Page Load**: ~1-2s
- **Image Preview**: ~50-100ms
- **File Validation**: <10ms
- **UI Rendering**: ~100-200ms

## Security Considerations

### File Upload Security
```python
✓ Extension validation: .jpg, .png, .gif only
✓ Size limit: 16MB max
✓ MIME type check (future enhancement)
✓ Filename sanitization with timestamp
✓ Isolated upload directory
```

### Model Security
```python
✓ Pre-trained weights (no custom code)
✓ Input validation & preprocessing
✓ Bounds checking on predictions
✓ Error handling & logging
```

### API Security
```python
✓ Input validation on all endpoints
✓ Error messages don't expose paths
✓ File cleanup (future implementation)
✓ Rate limiting (future implementation)
```

## Scalability Considerations

### Current Limitations
- Single-threaded Flask (development)
- Sequential request processing
- No caching
- No load balancing

### Production Deployment
```
Proposed Architecture:
  ├── Load Balancer (Nginx)
  ├── Flask Instances (Gunicorn × N)
  ├── Redis Cache (predictions)
  ├── PostgreSQL (user data)
  ├── S3 Storage (uploads)
  └── GPU Server (model inference)
```

## Monitoring & Logging

### Recommended Metrics
```python
# Track in app.py:
- Requests per minute
- Average inference time
- Model accuracy on real data
- File upload success rate
- Error rate by type
- Cache hit ratio
```

## Future Enhancements

### Phase 1: Robustness
- [ ] Model versioning
- [ ] A/B testing framework
- [ ] Confidence threshold tuning
- [ ] More food classes (50+)

### Phase 2: Features
- [ ] Barcode reading
- [ ] Nutrition history
- [ ] Dietary restriction filtering
- [ ] Family profiles

### Phase 3: Infrastructure
- [ ] Cloud deployment
- [ ] Multi-model ensemble
- [ ] Real-time model updates
- [ ] Mobile app

---

**Ready to deploy? Check QUICKSTART.md!**
