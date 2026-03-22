# 🥗 Nutrition Analyzer - Complete ML Project

A full-stack machine learning application that identifies packaged food items from images and provides nutritional analysis with health verdicts using AI-powered classification.

## 📋 Project Overview

This project uses:
- **ML Framework**: TensorFlow/Keras with MobileNetV2 transfer learning
- **Backend**: Flask REST API
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Dataset**: 7 food classes with nutritional data

## 📁 Project Structure

```
Nutrition_Analyzer/
├── Dataset/
│   ├── train/          (Training images: 7 class folders)
│   ├── val/            (Validation images: 7 class folders)
│   └── test/           (Test images: 7 class folders)
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── uploads/        (Uploaded images storage)
├── templates/
│   └── index.html
├── app.py              (Flask backend)
├── train_model.py      (Model training script)
├── requirements.txt    (Dependencies)
├── nutrition.csv       (Nutritional data)
└── model.keras         (Trained model - generated after training)
```

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

```bash
cd Nutrition_Analyzer
pip install -r requirements.txt
```

### Step 2: Train the Model

```bash
python train_model.py
```

**Important**: Ensure your Dataset folder has the following structure:
- `Dataset/train/[class_name]/` - Training images
- `Dataset/val/[class_name]/` - Validation images
- `Dataset/test/[class_name]/` - Test images

Class names: `amul_milk`, `amul_curd`, `kit_kat`, `lays_chips`, `maggi`, `oreo`, `parle_g`

Expected training time: ~15-30 minutes (depends on GPU availability)

### Step 3: Run the Flask Application

```bash
python app.py
```

The application will start at `http://localhost:5000`

## 📊 Food Classes & Nutrition Data

The nutrition.csv contains the following columns:
- `food_name`: Product name
- `calories_per_100`: Calories per 100g
- `protein_g_per_100`: Protein in grams
- `fat_g_per_100g`: Fat in grams
- `sarbs_g_per_100`: Carbohydrates in grams (note: CSV has typo "sarbs")
- `sugar_g_per_100`: Sugar in grams
- `sodium_g_per_100`: Sodium in grams

## 🧠 Model Architecture

### Transfer Learning with MobileNetV2:
```
Input (224x224x3)
    ↓
Pre-trained MobileNetV2 (frozen base)
    ↓
GlobalAveragePooling2D
    ↓
Dense(128, activation='relu')
    ↓
Dropout(0.3)
    ↓
Dense(7, activation='softmax') → Output probabilities
```

**Key Features:**
- Pre-trained on ImageNet weights
- Base model layers frozen (transfer learning)
- Adam optimizer with learning rate 0.0001
- Categorical cross-entropy loss
- Data augmentation: rotation, shear, zoom, flip

## 🏥 Health Verdict Logic

The system applies the following rules in order:

```python
If sugar > 25g        → "⚠️ High Sugar"
Elif fat > 30g        → "⚠️ High Fat"
Elif calories < 250   → "✓ Low Calorie/Snack"
Else                  → "⚖️ Moderate/Balanced"
```

## 🔌 API Endpoints

### POST /analyze
Upload an image for analysis
- **Request**: `multipart/form-data` with `file` field
- **Response**: JSON with product name, nutrition data, and health verdict

**Example Response:**
```json
{
  "success": true,
  "product_name": "Kit Kat",
  "confidence": 87.34,
  "nutrition": {
    "calories": 500,
    "protein_g": 4.76,
    "fat_g": 26.19,
    "carbs_g": 66.67,
    "sugar_g": 54.76,
    "sodium_g": 0.04
  },
  "verdict": "⚠️ High Sugar"
}
```

### GET /health
Health check endpoint
- **Response**: Model and data loading status

## 🎨 Frontend Features

- **Image Preview**: Real-time preview before analysis
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Visual feedback during processing
- **Error Handling**: User-friendly error messages
- **Nutrition Display**: Grid layout for easy viewing
- **Smart Recommendations**: Context-based health tips

## 🔧 Configuration

### Model Training Hyperparameters (train_model.py):
```python
BATCH_SIZE = 32
EPOCHS = 15
IMG_SIZE = (224, 224)
LEARNING_RATE = 0.0001
```

### Flask Configuration (app.py):
```python
MAX_FILE_SIZE = 16 MB
UPLOAD_FOLDER = static/uploads
DEBUG_MODE = True
```

## 📈 Performance Metrics

After training, monitor:
- **Accuracy**: Classification accuracy on validation set
- **Loss**: Categorical cross-entropy loss
- **Inference Time**: ~100-200ms per image (CPU)

## 🐛 Troubleshooting

### Model not found error:
```
FileNotFoundError: model.keras
```
**Solution**: Run `python train_model.py` first

### Out of memory error during training:
**Solutions**:
- Reduce `BATCH_SIZE` from 32 to 16
- Reduce `EPOCHS` from 15 to 10
- Use GPU: Install CUDA + cuDNN

### Image upload fails:
- Check file format (.jpg, .png, .gif supported)
- Ensure file size < 16MB
- Verify `static/uploads/` folder exists

## 📱 Usage Workflow

1. User opens http://localhost:5000
2. User uploads food label image
3. Frontend sends image to `/analyze` endpoint
4. Model classifies the image
5. Backend retrieves nutrition data
6. Verdict logic applied
7. Results displayed with recommendations

## 🔐 Security Notes

- File upload validation: Only image formats allowed
- File size limit: 16MB max
- Uploaded files stored in `static/uploads/`
- CORS not enabled (local deployment)

## 💡 Tips for Best Results

1. **Image Quality**: Use clear, well-lit food label photos
2. **Angle**: Capture label straight on
3. **Background**: Plain backgrounds work better
4. **Resolution**: Minimum 224x224 pixels
5. **Training Data**: 50+ images per class recommended

## 📚 Libraries Used

- **tensorflow==2.15.0**: Deep learning framework
- **keras==2.15.0**: High-level API
- **flask==3.0.0**: Web framework
- **pandas==2.0.3**: Data processing
- **pillow==10.0.0**: Image processing
- **numpy==1.24.3**: Numerical computing

## 🎓 Learning Resources

- [MobileNetV2 Paper](https://arxiv.org/abs/1801.04381)
- [Transfer Learning Guide](https://keras.io/guides/transfer_learning/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [TensorFlow Tutorials](https://www.tensorflow.org/tutorials)

## ✨ Future Enhancements

- [ ] Add barcode scanning
- [ ] Implement user preferences/dietary restrictions
- [ ] Add nutrition history tracking
- [ ] Integrate with nutritionist chat
- [ ] Deploy to cloud (AWS/GCP)
- [ ] Add multi-language support
- [ ] Real-time nutrition recommendations

## 📝 Dataset Schema (nutrition.csv)

```csv
food_name,calories_per_100,protein_g_per_100,fat_g_per_100g,sarbs_g_per_100,sugar_g_per_100,sodium_g_per_100
parle_g,454,6.9,13,77.3,25.5,0.26
amul_milk,116,6,6,9.6,9.6,0.07
kit_kat,500,4.76,26.19,66.67,54.76,0.04
lays_chips,539,6.9,33.1,53.4,2.5,0.83
amul_curd,60,3.6,3,5,4.52,0.04
oreo,490,5,21,71,36,0.52
maggi,437,10.4,15.7,63.5,3.4,1.23
```

## ⚖️ License

This project is for educational purposes.

---

**Happy Analyzing! 🍎 Eat Healthy, Stay Fit! 💪**
