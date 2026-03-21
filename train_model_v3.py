import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras import layers, models
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

DATASET_DIR = "Dataset"
SPLITS = ["train", "val", "test"]
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
VAL_DIR = os.path.join(DATASET_DIR, "val")
TEST_DIR = os.path.join(DATASET_DIR, "test")
MIN_IMAGES_PER_CLASS = 150


def audit_dataset_balance(dataset_path):
    print("Dataset balance check (all splits):\n")

    train_path = os.path.join(dataset_path, "train")
    class_names = sorted(
        [
            class_name
            for class_name in os.listdir(train_path)
            if os.path.isdir(os.path.join(train_path, class_name))
        ]
    )

    class_counts = {}
    gate_passed = True

    for class_name in class_names:
        total = 0
        for split in SPLITS:
            split_path = os.path.join(dataset_path, split, class_name)
            if os.path.exists(split_path):
                total += len(
                    [
                        f
                        for f in os.listdir(split_path)
                        if os.path.isfile(os.path.join(split_path, f))
                    ]
                )

        class_counts[class_name] = total
        if total < MIN_IMAGES_PER_CLASS:
            print(f"  X {class_name}: {total} images - need +{MIN_IMAGES_PER_CLASS - total}")
            gate_passed = False
        else:
            print(f"  OK {class_name}: {total} images")

    if not gate_passed:
        print("\nGate failed - collect missing images before retraining.")
        return class_counts, False

    print("\nGate passed - proceeding with training.")
    return class_counts, True


# Cutout augmentation for occlusion robustness

def cutout_augmentation(image):
    h, w = image.shape[:2]
    num_cutouts = np.random.randint(0, 3)
    for _ in range(num_cutouts):
        cut_h = np.random.randint(int(h * 0.1), int(h * 0.25))
        cut_w = np.random.randint(int(w * 0.1), int(w * 0.25))
        x = np.random.randint(0, w - cut_w)
        y = np.random.randint(0, h - cut_h)
        skin_color = np.array([
            np.random.randint(150, 220),
            np.random.randint(100, 170),
            np.random.randint(80, 140),
        ])
        image[y : y + cut_h, x : x + cut_w] = skin_color / 255.0
    return image


def main():
    _, ok_to_train = audit_dataset_balance(DATASET_DIR)
    if not ok_to_train:
        raise SystemExit(1)

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        brightness_range=[0.4, 1.6],
        horizontal_flip=True,
        zoom_range=0.25,
        shear_range=0.15,
        channel_shift_range=30.0,
        preprocessing_function=cutout_augmentation,
        fill_mode="nearest",
    )

    val_datagen = ImageDataGenerator(rescale=1.0 / 255)
    test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR, target_size=(224, 224), batch_size=32, class_mode="categorical"
    )

    val_generator = val_datagen.flow_from_directory(
        VAL_DIR, target_size=(224, 224), batch_size=32, class_mode="categorical"
    )

    test_generator = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=(224, 224),
        batch_size=32,
        class_mode="categorical",
        shuffle=False,
    )

    print("\nClass indices (verify this matches class_names in app.py):")
    print(train_generator.class_indices)
    class_names = list(train_generator.class_indices.keys())

    base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False

    model = models.Sequential(
        [
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dense(256, activation="relu"),
            layers.Dropout(0.4),
            layers.Dense(7, activation="softmax"),
        ]
    )

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.3, patience=3, min_lr=1e-7, verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            "best_model_v3.keras", monitor="val_accuracy", save_best_only=True, verbose=1
        ),
    ]

    print("\nPhase 1: Training top layers only...")
    history1 = model.fit(
        train_generator, validation_data=val_generator, epochs=25, callbacks=callbacks
    )

    print(f"Phase 1 best val_accuracy: {max(history1.history['val_accuracy']) * 100:.2f}%")

    print("\nPhase 2: Fine tuning last 40 layers...")
    base_model.trainable = True
    for layer in base_model.layers[:-40]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        train_generator, validation_data=val_generator, epochs=25, callbacks=callbacks
    )

    print(f"Phase 2 best val_accuracy: {max(history2.history['val_accuracy']) * 100:.2f}%")

    model.save("model_v3.keras")
    print("\nModel saved as model_v3.keras")

    print("\nEvaluating on test set...")
    test_loss, test_accuracy = model.evaluate(test_generator)
    print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
    print(f"Test Loss: {test_loss:.4f}")

    y_pred = np.argmax(model.predict(test_generator), axis=1)
    y_true = test_generator.classes

    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))

    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        xticklabels=class_names,
        yticklabels=class_names,
        cmap="Greens",
    )
    plt.title("Confusion Matrix - Model v3")
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig("confusion_matrix_v3.png")
    plt.show()
    print("Confusion matrix saved as confusion_matrix_v3.png")

    print("\nPer-class accuracy:")
    for i, class_name in enumerate(class_names):
        class_mask = y_true == i
        if np.sum(class_mask) > 0:
            class_acc = np.mean(y_pred[class_mask] == y_true[class_mask]) * 100
            status = "OK" if class_acc >= 85 else "COLLECT MORE IMAGES FOR THIS CLASS"
            print(f"  {class_name}: {class_acc:.1f}% [{status}]")

    plt.figure(figsize=(12, 4))

    plt.subplot(1, 2, 1)
    plt.plot(history1.history["accuracy"] + history2.history["accuracy"], label="Train")
    plt.plot(
        history1.history["val_accuracy"] + history2.history["val_accuracy"],
        label="Validation",
    )
    plt.axvline(
        x=len(history1.history["accuracy"]),
        color="r",
        linestyle="--",
        label="Phase 2 start",
    )
    plt.title("Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history1.history["loss"] + history2.history["loss"], label="Train")
    plt.plot(history1.history["val_loss"] + history2.history["val_loss"], label="Validation")
    plt.axvline(
        x=len(history1.history["loss"]),
        color="r",
        linestyle="--",
        label="Phase 2 start",
    )
    plt.title("Model Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()

    plt.tight_layout()
    plt.savefig("training_history_v3.png")
    plt.show()
    print("Training history saved as training_history_v3.png")


if __name__ == "__main__":
    np.random.seed(42)
    tf.random.set_seed(42)
    main()
