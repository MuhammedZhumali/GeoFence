# Model Training

This directory contains the machine learning model training code.

## Files

- `geodez.ipynb` - Main training notebook
- `recreate_cpu_model.py` - Export model for CPU inference
- `best_geofence_model.keras` - Trained model (if available)
- `requirements.txt` - Python dependencies

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Training

1. Open `geodez.ipynb` in Jupyter
2. Run all cells to train the model
3. Model will be saved as `best_geofence_model.keras`

## Exporting for Production

After training, export the model for CPU inference:

```bash
python recreate_cpu_model.py
```

This creates `exported_geofence_model/` which should be copied to:
```
../backend/src/main/resources/exported_geofence_model/
```

## Model Architecture

- Input: 20 trajectory points (lat, lon)
- CNN-GRU architecture
- Output: Probability of entering AOI (0-1)

See main README.md for full details.

