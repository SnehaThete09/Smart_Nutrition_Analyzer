"""
Flask Backend for Nutrition Analyzer
Handles image upload, classification, and nutritional analysis
"""

from flask import Flask, request, jsonify, render_template
import pandas as pd
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import os
from datetime import datetime
import random

# =============================
# FLASK SETUP
# =============================
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'static/uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# =============================
# CLASS NAMES (MUST MATCH TRAINING)
# =============================
CLASS_NAMES = [
    'amul_milk',
    'govind_curd',
    'kit_kat',
    'lays_chips',
    'maggie',
    'oreo',
    'parle_g'
]

DISPLAY_NAME_OVERRIDES = {
    'govind_curd': 'Curd'
}

model = None
nutrition_df = None


# =============================
# LOAD MODEL + CSV
# =============================
def load_resources():
    global model, nutrition_df

    print("Loading resources...")

    # Load trained model
    try:
        model = load_model("best_model_v3.keras")
        print("✓ Model loaded successfully")
    except Exception as e:
        print("✗ Model loading failed:", e)

    # Load nutrition CSV
    try:
        nutrition_df = pd.read_csv("nutrition.csv")
        nutrition_df.columns = nutrition_df.columns.str.strip()
        print("✓ Nutrition CSV loaded successfully")
    except Exception as e:
        print("✗ CSV loading failed:", e)


# =============================
# IMAGE PREPROCESSING
# =============================
def preprocess_image(img_path):
    img = Image.open(img_path).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


# =============================
# PREDICTION FUNCTION
# =============================
def predict_class(img_array):
    predictions = model.predict(img_array)
    idx = np.argmax(predictions[0])
    confidence = float(predictions[0][idx])
    return CLASS_NAMES[idx], confidence


def get_display_food_name(food_key):
    normalized = str(food_key or '').strip().lower()
    if normalized in DISPLAY_NAME_OVERRIDES:
        return DISPLAY_NAME_OVERRIDES[normalized]
    return normalized.replace('_', ' ').title()


# =============================
# GET NUTRITION DATA
# =============================
def get_nutrition_data(food_name):
    """
    Get nutrition data for a food item and calculate actual values for the whole pack.
    Formula: Actual Value = (Value_per_100g / 100) * net_weight_g
    """
    print(f"\n[DEBUG] Getting nutrition for: {food_name}")
    print(f"[DEBUG] Available food names: {nutrition_df['food_name'].tolist()}")
    
    row = nutrition_df[
        nutrition_df['food_name'].str.lower().str.strip() == food_name.lower().strip()
    ]
    
    if row.empty:
        print(f"[DEBUG] No match found for {food_name}")
        return None
    
    # Convert to dict and ensure all nutrition keys exist with proper values
    nutrition_dict = row.iloc[0].to_dict()
    print(f"[DEBUG] Raw nutrition_dict: {nutrition_dict}")
    
    # Get net weight in grams
    net_weight_g = float(nutrition_dict.get('net_weight_g', 100))
    
    # Calculate actual values for the whole pack using formula:
    # Actual Value = (Value_per_100g / 100) * net_weight_g
    result = {
        'calories': round((float(nutrition_dict.get('calories_per_100', 0)) / 100) * net_weight_g, 2),
        'protein': round((float(nutrition_dict.get('protein_g_per_100', 0)) / 100) * net_weight_g, 2),
        'fat': round((float(nutrition_dict.get('fat_g_per_100g', 0)) / 100) * net_weight_g, 2),
        'carbs': round((float(nutrition_dict.get('carbs_g_per_100', 0)) / 100) * net_weight_g, 2),
        'sugar': round((float(nutrition_dict.get('sugar_g_per_100', 0)) / 100) * net_weight_g, 2),
        'sodium': round((float(nutrition_dict.get('sodium_g_per_100', 0)) / 100) * net_weight_g, 2)
    }
    print(f"[DEBUG] Calculated result (for {net_weight_g}g pack): {result}")
    return result


# =============================
# GET PER-100G NUTRITION DATA
# =============================
def get_per_100g_nutrition(food_name):
    """
    Extract per-100g nutrition values from CSV for macronutrient percentage calculations.
    Returns raw per-100g values (not scaled to pack size).
    """
    print(f"\n[DEBUG] Getting per-100g nutrition for: {food_name}")
    
    row = nutrition_df[
        nutrition_df['food_name'].str.lower().str.strip() == food_name.lower().strip()
    ]
    
    if row.empty:
        print(f"[DEBUG] No match found for {food_name}")
        return None
    
    nutrition_dict = row.iloc[0].to_dict()
    print(f"[DEBUG] Raw nutrition_dict: {nutrition_dict}")
    
    result = {
        'food_name': str(nutrition_dict.get('food_name', food_name)).strip(),
        'net_weight_g': float(nutrition_dict.get('net_weight_g', 100)),
        'calories_100g': float(nutrition_dict.get('calories_per_100', 0)),
        'protein_100g': float(nutrition_dict.get('protein_g_per_100', 0)),
        'fat_100g': float(nutrition_dict.get('fat_g_per_100g', nutrition_dict.get('fat_g_per_100', 0))),
        'carbs_100g': float(nutrition_dict.get('carbs_g_per_100', 0)),
        'sugar_100g': float(nutrition_dict.get('sugar_g_per_100', 0)),
        'sodium_100g': float(nutrition_dict.get('sodium_g_per_100', 0))
    }
    print(f"[DEBUG] Per-100g values: {result}")
    return result


# =============================
# CALCULATE MACRONUTRIENT PERCENTAGES
# =============================
def calculate_macronutrient_percentages(protein_100g, carbs_100g, fat_100g, calories_100g):
    """
    Calculate the percentage of total calories from each macronutrient.
    
    Formula:
    - protein_pct = ((protein_100g * 4) / calories_100g) * 100
    - fat_pct = ((fat_100g * 9) / calories_100g) * 100
    - carbs_pct = ((carbs_100g * 4) / calories_100g) * 100
    
    Args:
        protein_100g: Protein in grams per 100g
        carbs_100g: Carbs in grams per 100g
        fat_100g: Fat in grams per 100g
        calories_100g: Calories per 100g
    
    Returns:
        dict with protein_pct, fat_pct, carbs_pct or None if calories_100g is 0
    """
    try:
        if calories_100g == 0:
            print("[DEBUG] ZeroDivisionError: Calories per 100g cannot be 0")
            raise ZeroDivisionError("Calories per 100g cannot be 0")
        
        protein_pct = ((protein_100g * 4) / calories_100g) * 100
        fat_pct = ((fat_100g * 9) / calories_100g) * 100
        carbs_pct = ((carbs_100g * 4) / calories_100g) * 100
        
        result = {
            'protein_pct': round(protein_pct, 2),
            'fat_pct': round(fat_pct, 2),
            'carbs_pct': round(carbs_pct, 2)
        }
        print(f"[DEBUG] Macronutrient percentages: {result}")
        return result
    except ZeroDivisionError as e:
        print(f"[DEBUG] Error in macronutrient calculation: {e}")
        return None


# =============================
# CLASSIFY FOOD HEALTH (NEW RULE ENGINE)
# =============================
def classify_food_health(protein_100g, fat_100g, carbs_100g, sodium_100g, calories_100g):
    """
    Classify food as Unhealthy, Healthy, or Moderate based on macronutrient percentages.
    
    Classification Rules:
    
    1. UNHEALTHY (Trigger if ANY condition is met):
       - protein_pct < 10
       - fat_pct > 45
       - carbs_pct > 60
       - sodium_100g > 0.6
    
    2. HEALTHY (Trigger ONLY if ALL conditions are met):
       - protein_pct >= 20
       - fat_pct is between 20 and 35
       - carbs_pct is between 35 and 50
       - sodium_100g < 0.12
    
    3. MODERATE (Trigger if ALL conditions are met):
       - protein_pct is between 10 and 19.9
       - fat_pct is between 20 and 45
       - carbs_pct is between 40 and 60
       - sodium_100g is between 0.12 and 0.6
    
    4. FALLBACK: If doesn't fit Healthy or Moderate but isn't Unhealthy, default to Moderate.
    
    Returns:
        dict with verdict, health_score, reasons array, and macro_percentages
    """
    try:
        # Handle zero calories edge case
        if calories_100g == 0:
            print("[DEBUG] Zero calories detected, returning default Moderate classification")
            return {
                'verdict': 'Moderate Consumption ⚖️',
                'health_score': 50,
                'reasons': ['Unable to classify: zero calories per 100g'],
                'macro_percentages': {}
            }
        
        # Calculate macronutrient percentages
        macro_stats = calculate_macronutrient_percentages(protein_100g, carbs_100g, fat_100g, calories_100g)
        
        if macro_stats is None:
            print("[DEBUG] Failed to calculate macronutrient percentages, returning default")
            return {
                'verdict': 'Moderate Consumption ⚖️',
                'health_score': 50,
                'reasons': ['Unable to calculate macronutrient percentages'],
                'macro_percentages': {}
            }
        
        protein_pct = macro_stats['protein_pct']
        fat_pct = macro_stats['fat_pct']
        carbs_pct = macro_stats['carbs_pct']
        
        print(f"[DEBUG] Classification - Protein: {protein_pct}%, Fat: {fat_pct}%, Carbs: {carbs_pct}%, Sodium: {sodium_100g}g")
        
        reasons = []
        
        # ===== CHECK UNHEALTHY CONDITIONS (ANY condition triggers it) =====
        unhealthy_conditions = []
        
        if protein_pct < 10:
            unhealthy_conditions.append(f"Protein provides only {protein_pct:.1f}% of calories (below 10% threshold)")
        
        if fat_pct > 45:
            unhealthy_conditions.append(f"Fat provides {fat_pct:.1f}% of calories (above 45% threshold)")
        
        if carbs_pct > 60:
            unhealthy_conditions.append(f"Carbs provide {carbs_pct:.1f}% of calories (above 60% threshold)")
        
        if sodium_100g > 0.6:
            unhealthy_conditions.append(f"Sodium content is {sodium_100g}g per 100g (above 0.6g threshold)")
        
        if unhealthy_conditions:
            print(f"[DEBUG] Classified as UNHEALTHY: {unhealthy_conditions}")
            return {
                'verdict': 'Unhealthy ⚠️',
                'health_score': random.randint(20, 40),
                'reasons': unhealthy_conditions,
                'macro_percentages': macro_stats
            }
        
        # ===== CHECK HEALTHY CONDITIONS (ALL must be met) =====
        if (protein_pct >= 20 and
            20 <= fat_pct <= 35 and
            35 <= carbs_pct <= 50 and
            sodium_100g < 0.12):
            
            reasons = [
                f"Protein provides {protein_pct:.1f}% of calories (≥20% recommended)",
                f"Fat provides {fat_pct:.1f}% of calories (optimal 20-35% range)",
                f"Carbs provide {carbs_pct:.1f}% of calories (optimal 35-50% range)",
                f"Sodium content is {sodium_100g}g per 100g (<0.12g threshold)"
            ]
            
            print(f"[DEBUG] Classified as HEALTHY: {reasons}")
            return {
                'verdict': 'Healthy ✅',
                'health_score': random.randint(85, 100),
                'reasons': reasons,
                'macro_percentages': macro_stats
            }
        
        # ===== CHECK MODERATE CONDITIONS (ALL must be met) =====
        if (10 <= protein_pct < 20 and
            20 <= fat_pct <= 45 and
            40 <= carbs_pct <= 60 and
            0.12 <= sodium_100g <= 0.6):
            
            reasons = [
                f"Protein provides {protein_pct:.1f}% of calories (acceptable 10-20% range)",
                f"Fat provides {fat_pct:.1f}% of calories (acceptable 20-45% range)",
                f"Carbs provide {carbs_pct:.1f}% of calories (acceptable 40-60% range)",
                f"Sodium content is {sodium_100g}g per 100g (acceptable 0.12-0.6g range)"
            ]
            
            print(f"[DEBUG] Classified as MODERATE: {reasons}")
            return {
                'verdict': 'Moderate Consumption ⚖️',
                'health_score': random.randint(50, 75),
                'reasons': reasons,
                'macro_percentages': macro_stats
            }
        
        # ===== FALLBACK: Default to Moderate =====
        # If doesn't perfectly fit Healthy or Moderate, but isn't flagged as Unhealthy
        fallback_reasons = [
            f"Protein: {protein_pct:.1f}% of calories",
            f"Fat: {fat_pct:.1f}% of calories",
            f"Carbs: {carbs_pct:.1f}% of calories",
            f"Sodium: {sodium_100g}g per 100g",
            "Nutritional profile does not perfectly match Healthy criteria, defaulting to Moderate"
        ]
        
        print(f"[DEBUG] Classified as MODERATE (fallback): {fallback_reasons}")
        return {
            'verdict': 'Moderate Consumption ⚖️',
            'health_score': random.randint(50, 75),
            'reasons': fallback_reasons,
            'macro_percentages': macro_stats
        }
    
    except Exception as e:
        print(f"[DEBUG] Unexpected error in classify_food_health: {str(e)}")
        return {
            'verdict': 'Moderate Consumption ⚖️',
            'health_score': 50,
            'reasons': [f'Error during classification: {str(e)}'],
            'macro_percentages': {}
        }





# =============================
# ROUTES
# =============================
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/features")
def features():
    return render_template("features.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
        filename = timestamp + file.filename
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        # Preprocess image
        img_array = preprocess_image(filepath)

        # Predict class
        predicted_class, confidence = predict_class(img_array)
        predicted_class_name = get_display_food_name(predicted_class)

        # Get per-100g nutrition data for classification
        per_100g_nutrition = get_per_100g_nutrition(predicted_class)
        if per_100g_nutrition is None:
            return jsonify({"error": "Nutrition data not found"}), 404

        # Get actual pack nutrition for display
        nutrition_data = get_nutrition_data(predicted_class)
        if nutrition_data is None:
            return jsonify({"error": "Nutrition data not found"}), 404

        # Classify food health using macronutrient percentages (NEW LOGIC)
        health_classification = classify_food_health(
            protein_100g=per_100g_nutrition['protein_100g'],
            fat_100g=per_100g_nutrition['fat_100g'],
            carbs_100g=per_100g_nutrition['carbs_100g'],
            sodium_100g=per_100g_nutrition['sodium_100g'],
            calories_100g=per_100g_nutrition['calories_100g']
        )

        # Prepare unified analysis payload
        analysis_payload = {
            "success": True,
            "food_key": predicted_class,
            "product_name": predicted_class_name,
            "confidence": round(confidence * 100, 2),
            "image_path": "/" + filepath.replace("\\", "/"),
            "nutrition": nutrition_data,
            "per_100g": per_100g_nutrition,
            "net_weight_g": per_100g_nutrition['net_weight_g'],
            "verdict": health_classification['verdict'],
            "health_score": health_classification['health_score'],
            "reasons": health_classification['reasons'],
            "macro_percentages": health_classification['macro_percentages']
        }

        # Low-confidence flow: ask user confirmation on frontend,
        # while returning pending full analysis for the "Yes" path.
        if confidence < 0.55:
            return jsonify({
                "status": "low_confidence",
                "predicted_class": predicted_class_name,
                "confidence": float(confidence),
                "confidence_percent": round(confidence * 100, 2),
                "pending_result": analysis_payload
            })

        return jsonify(analysis_payload)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({
        "model_loaded": model is not None,
        "nutrition_loaded": nutrition_df is not None
    })


@app.route("/debug/nutrition")
def debug_nutrition():
    """Debug endpoint to see CSV data"""
    try:
        return jsonify({
            "csv_columns": nutrition_df.columns.tolist(),
            "csv_data": nutrition_df.to_dict(orient='records')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================
# RUN SERVER
# =============================
load_resources()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
