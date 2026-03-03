print("Running predict file...")

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

MODEL_PATH = "model.keras"

CLASS_NAMES = [
    'amul_milk',
    'govind_curd',
    'kit_kat',
    'lays_chips',
    'maggie',
    'oreo',
    'parle_g'
]

def predict_image(img_path):
    model = tf.keras.models.load_model(MODEL_PATH)

    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)

    predicted_index = np.argmax(predictions[0])
    confidence = np.max(predictions[0])

    predicted_class = CLASS_NAMES[predicted_index]

    return predicted_class, confidence


if __name__ == "__main__":
    test_image = "test.jpg"
    label, conf = predict_image(test_image)
    print(f"Prediction: {label}")
    print(f"Confidence: {conf:.2f}")
