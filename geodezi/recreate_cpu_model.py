#!/usr/bin/env python3
"""
Recreate model with CPU-compatible GRU layers and copy weights
"""
import os
import tensorflow as tf
import keras
from keras import layers, models
import numpy as np

# Force CPU only
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

print("TensorFlow version:", tf.__version__)
print("Keras version:", keras.__version__)

# Load original model
model_path = "best_geofence_model.keras"
print(f"\nLoading model from {model_path}...")
original_model = keras.models.load_model(model_path)

print(f"Original model - Input: {original_model.input_shape}, Output: {original_model.output_shape}")

# Recreate model architecture with CPU-compatible layers
print("\nRecreating model with CPU-compatible layers...")

def build_cpu_model():
    """Build the same architecture but with CPU-compatible GRU"""
    inputs = layers.Input(shape=(20, 2), name="trajectory_window")
    
    x = layers.Conv1D(
        filters=32,
        kernel_size=3,
        padding="same",
        activation="relu",
        name="conv1d_1"
    )(inputs)
    
    x = layers.MaxPooling1D(pool_size=2, name="maxpool_1")(x)
    
    # Create GRU - ensure it uses standard implementation
    # In Keras 3, we can't directly set implementation, but we can ensure
    # it's created in CPU mode by disabling GPU
    x = layers.GRU(
        64,
        name="gru_1"
        # Note: In Keras 3/TF 2.x+, GRU should use standard ops when GPU is disabled
    )(x)
    
    x = layers.Dense(64, activation="relu", name="dense_1")(x)
    # Skip dropout in inference - it doesn't affect output
    # x = layers.Dropout(0.3, name="dropout_1")(x)  # Skip for inference
    
    outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
    
    model = models.Model(inputs=inputs, outputs=outputs, name="GeoFence_CNN_GRU_CPU")
    return model

# Create new model
cpu_model = build_cpu_model()
cpu_model.compile()  # Compile to initialize

print("✅ CPU model created")

# Copy weights layer by layer
print("\nCopying weights...")
for old_layer, new_layer in zip(original_model.layers, cpu_model.layers):
    if old_layer.name == new_layer.name:
        try:
            old_weights = old_layer.get_weights()
            if old_weights:
                new_layer.set_weights(old_weights)
                print(f"  ✓ Copied weights for {old_layer.name}")
            else:
                print(f"  - No weights for {old_layer.name}")
        except Exception as e:
            print(f"  ✗ Failed to copy weights for {old_layer.name}: {e}")

# Test the model
print("\nTesting CPU model...")
test_input = np.random.randn(1, 20, 2).astype(np.float32)
try:
    result = cpu_model(test_input, training=False)
    print(f"✅ Model works! Output shape: {result.shape}, Value: {result.numpy()[0][0]}")
except Exception as e:
    print(f"❌ Model test failed: {e}")
    import traceback
    traceback.print_exc()
    raise

# Export
export_dir = "exported_geofence_model"
if os.path.exists(export_dir):
    import shutil
    print(f"\nRemoving existing {export_dir}...")
    shutil.rmtree(export_dir)

print(f"\nExporting CPU model to {export_dir}...")
try:
    cpu_model.export(export_dir, training=False)
    print("✅ Model exported successfully!")
except Exception as e:
    print(f"❌ Export failed: {e}")
    import traceback
    traceback.print_exc()
    raise

# Verify
print("\nVerifying exported model...")
try:
    imported = tf.saved_model.load(export_dir)
    print("✅ Model loaded!")
    
    if 'serve' in imported.signatures:
        test_input = np.random.randn(1, 20, 2).astype(np.float32)
        result = imported.signatures['serve'](tf.constant(test_input))
        print(f"✅ Test prediction successful! Output: {result}")
    else:
        print("⚠️  No 'serve' signature found")
        print(f"Available signatures: {list(imported.signatures.keys())}")
        
except Exception as e:
    print(f"⚠️  Verification failed: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Done!")

