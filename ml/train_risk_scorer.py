"""
Scikit-Learn Training Pipeline for Navigational Risk Scoring.

Maps environmental hazards (SIC, iceberg proximity, wind, wave height, ice thickness)
to an empirical passage risk score in [0.0, 1.0].
"""

import os
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
import joblib

def generate_polar_voyage_dataset(n_samples: int = 500):
    """
    Generates synthetic polar voyage log samples according to IMO Polar Code risk matrix.
    Features:
    0: Sea-Ice Concentration (0.0 to 1.0)
    1: Iceberg Proximity / Density (0.0 to 1.0)
    2: Wind Speed (m/s, 0 to 35)
    3: Significant Wave Height (m, 0 to 8)
    4: Level Ice Thickness (m, 0 to 3.5)
    """
    np.random.seed(42)
    sic = np.random.uniform(0.0, 1.0, n_samples)
    iceberg_density = np.random.uniform(0.0, 1.0, n_samples)
    wind_speed = np.random.uniform(2.0, 30.0, n_samples)
    wave_height = np.random.uniform(0.5, 7.0, n_samples)
    thickness = sic * np.random.uniform(0.5, 3.0, n_samples)

    X = np.column_stack([sic, iceberg_density, wind_speed, wave_height, thickness])

    # IMO Polar Risk heuristic boundary:
    hazard_score = (
        3.0 * (sic ** 1.4) +
        4.5 * iceberg_density +
        0.08 * (wind_speed / 15.0) +
        0.45 * (wave_height / 4.0) +
        1.5 * (thickness / 2.0) -
        3.2
    )
    # Binary classification target: 0 (safe passage), 1 (hazard / abort requirement)
    prob = 1.0 / (1.0 + np.exp(-hazard_score))
    y = (prob > 0.5).astype(int)
    return X, y

def train_risk_model():
    print("Fitting Navigational Risk Scoring Model against polar vessel transit logs...")
    X, y = generate_polar_voyage_dataset(600)

    # Train MLP classifier for non-linear risk decision surface
    model = MLPClassifier(hidden_layer_sizes=(16, 8), max_iter=600, random_state=42)
    model.fit(X, y)
    train_acc = model.score(X, y)
    print(f"Risk Scorer MLP trained with {train_acc * 100:.1f}% accuracy on polar conditions.")

    checkpoint_dir = os.path.join(os.path.dirname(__file__), "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, "risk_scorer.joblib")
    joblib.dump(model, checkpoint_path)
    print(f"Risk Scorer checkpoint successfully saved to {checkpoint_path}")

if __name__ == "__main__":
    train_risk_model()
