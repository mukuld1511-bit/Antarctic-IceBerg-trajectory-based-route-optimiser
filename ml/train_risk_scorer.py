"""
Scikit-Learn / MLP Training Pipeline for Navigational Risk Scoring.

Maps environmental hazards (SIC, iceberg proximity, wind, wave height)
to an empirical passage risk score in [0.0, 1.0].
"""

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier

def train_risk_model():
    print("Fitting Navigational Risk Scoring Model against synthetic vessel logs...")
    # Features: [SIC (0-1), Iceberg_Density (0-1), Wind_Speed (m/s), Wave_Height (m)]
    # Target: 0 (Safe transit), 1 (Hazard / Ice entrapment / Collision threat)
    X_synthetic = np.array([
        [0.05, 0.0, 5.0, 1.5],
        [0.20, 0.0, 12.0, 2.8],
        [0.45, 0.1, 15.0, 3.2],
        [0.75, 0.0, 8.0, 1.2],
        [0.85, 0.4, 20.0, 4.0],
        [0.10, 0.9, 10.0, 2.0],
        [0.92, 0.8, 25.0, 4.5]
    ])
    y_synthetic = np.array([0, 0, 0, 1, 1, 1, 1])

    clf = LogisticRegression()
    clf.fit(X_synthetic, y_synthetic)
    print(f"Fit weights: {clf.coef_}, Intercept: {clf.intercept_}")

if __name__ == "__main__":
    train_risk_model()
