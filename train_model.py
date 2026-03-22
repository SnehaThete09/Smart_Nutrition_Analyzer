"""
Training script for Nutrition Analyzer using MobileNetV2 (Transfer Learning)
"""

import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.optimizers import Adam

# =============================
# PATHS
# =============================
DATASET_DIR = "Dataset"
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")
MODEL_PATH = "model.keras"

# =============================
# CONFIG
# =============================
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15

CLASS_NAMES = [
    'amul_milk',
    'amul_curd',
    'kit_kat',
    'lays_chips',
    'maggi',
    'oreo',
    'parle_g'
]

NUM_CLASSES = len(CLASS_NAMES)


# =============================
# MODEL CREATION
# =============================
def create_model():
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )

    # Freeze base layers
    base_model.trainable = False

    # Custom classification head
    x = GlobalAveragePooling2D()(base_model.output)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(NUM_CLASSES, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=outputs)

    model.compile(
        optimizer=Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


# =============================
# DATA GENERATORS
# =============================
def create_data_generators():
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True
    )

    val_datagen = ImageDataGenerator(rescale=1./255)

    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASS_NAMES
    )

    val_generator = val_datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASS_NAMES
    )

    return train_generator, val_generator


# =============================
# TRAINING
# =============================
def train_model():
    print("Creating model...")
    model = create_model()
    model.summary()

    print("\nCreating data generators...")
    train_gen, val_gen = create_data_generators()

    print(f"\nTraining model for {EPOCHS} epochs...")

    model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        steps_per_epoch=train_gen.samples // BATCH_SIZE,
        validation_steps=val_gen.samples // BATCH_SIZE
    )

    print(f"\nSaving model to {MODEL_PATH}...")
    model.save(MODEL_PATH)

    print("Training completed successfully!")


if __name__ == "__main__":
    train_model()
