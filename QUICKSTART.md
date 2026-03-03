## 🚀 QUICK START CHECKLIST

Complete the following steps to get your Nutrition Analyzer running:

### ✅ Step 1: Environment Setup
- [ ] Install Python 3.8+ 
- [ ] Navigate to project folder: `cd Nutrition_Analyzer`
- [ ] Create virtual environment (optional but recommended):
  ```
  python -m venv venv
  venv\Scripts\activate  # Windows
  source venv/bin/activate  # Mac/Linux
  ```

### ✅ Step 2: Install Dependencies
- [ ] Run: `pip install -r requirements.txt`
- [ ] Wait for all packages to install (~5-10 minutes)
- [ ] Verify TensorFlow installation: `python -c "import tensorflow; print(tensorflow.__version__)"`

### ✅ Step 3: Prepare Dataset
- [ ] Ensure Dataset folder has correct structure:
  ```
  Dataset/
  ├── train/
  │   ├── amul_milk/      (images)
  │   ├── govind_curd/    (images)
  │   ├── kit_kat/        (images)
  │   ├── lays_chips/     (images)
  │   ├── maggie/         (images)
  │   ├── oreo/           (images)
  │   └── parle_g/        (images)
  ├── val/               (same structure)
  └── test/              (same structure)
  ```
- [ ] Minimum 5-10 images per class, per split recommended

### ✅ Step 4: Train the Model
- [ ] Run: `python train_model.py`
- [ ] Monitor training progress:
  - Shows accuracy increasing
  - Loss decreasing
  - Should take 15-30 minutes
- [ ] Verify `model.keras` file created in root folder

### ✅ Step 5: Start the Application
- [ ] Run: `python app.py`
- [ ] Wait for output showing "Running on http://127.0.0.1:5000"
- [ ] Open browser → http://localhost:5000

### ✅ Step 6: Test the Application
- [ ] Click "Get Started" button
- [ ] Upload a test food image
- [ ] View results:
  - Product name and confidence
  - Nutrition table
  - Health verdict
  - Recommendations

### 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: tensorflow` | Run `pip install tensorflow==2.15.0` |
| `FileNotFoundError: model.keras` | First run `python train_model.py` |
| Port 5000 already in use | Change port in app.py: `app.run(port=5001)` |
| Image upload fails | Check file is .jpg/.png and < 16MB |
| Slow prediction | Use GPU: Install CUDA + cuDNN |

### 📊 Expected Accuracy
- Training: ~85-95%
- Validation: ~75-85%
- (Depends on dataset quality & size)

### 📁 File Descriptions

| File | Purpose |
|------|---------|
| `app.py` | Flask backend server |
| `train_model.py` | Model training script |
| `nutrition.csv` | Food nutrition database |
| `requirements.txt` | Python dependencies |
| `templates/index.html` | Frontend HTML |
| `static/css/style.css` | Frontend styling |
| `static/js/script.js` | Frontend logic |
| `model.keras` | Trained model (generated) |

### 🎯 API Test Example

Test the `/analyze` endpoint using curl:

```bash
curl -X POST -F "file=@test_image.jpg" http://localhost:5000/analyze
```

Expected JSON response:
```json
{
  "success": true,
  "product_name": "Kit Kat",
  "confidence": 92.5,
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

### 💡 Tips for Success

1. **Clear Images**: Use well-lit, straight-on photos of labels
2. **Balanced Dataset**: Similar number of images per class
3. **Image Size**: 224x224 minimum resolution
4. **GPU Acceleration**: Install CUDA for 10x faster training

### 🆘 Get Help

Check logs for detailed error messages:
- Training errors → See console output during `python train_model.py`
- Flask errors → Check browser console (F12 → Console tab)
- Image processing errors → Check `static/uploads/` folder

### ✨ Next Steps After Setup

1. Test with real food label photos
2. Improve dataset quality
3. Fine-tune model parameters
4. Deploy to production (AWS/Heroku)
5. Add more food classes
6. Implement user authentication

---

**Ready to go! Happy analyzing! 🍎**
