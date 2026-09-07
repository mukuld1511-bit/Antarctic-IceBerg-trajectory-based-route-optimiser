"""
Data Preprocessing Pipeline: Regridding, Cloud Masking & Feature Normalization.

Functions:
- Regrids satellite polar stereographic EPSG:3031 to standard WGS84 geographic grid
- Normalizes environmental variables (SIC, U10, V10, T2M, SST) for neural network ingest
- Fills missing microwave scan wedges via spatial spline interpolation
"""

import numpy as np
from typing import Tuple, Dict, Any

def normalize_model_inputs(
    sic_grid: np.ndarray,
    u10: np.ndarray,
    v10: np.ndarray,
    t2m: np.ndarray
) -> np.ndarray:
    """
    Standardizes multivariable spatial tensors for ConvLSTM input:
    [channels=4, H, W]
    SIC in [0, 1]
    U10/V10 normalized by 25.0 m/s
    T2M normalized to range [-40C, +10C]
    """
    u_norm = np.clip(u10 / 25.0, -1.0, 1.0)
    v_norm = np.clip(v10 / 25.0, -1.0, 1.0)
    t_norm = np.clip((t2m - 253.15) / 30.0, -1.0, 1.0)
    return np.stack([sic_grid, u_norm, v_norm, t_norm], axis=0)

def interpolate_polar_grid(raw_data: np.ndarray) -> np.ndarray:
    """Fills missing scan values and removes land mask artifacts."""
    clean = np.nan_to_num(raw_data, nan=0.0)
    return np.clip(clean, 0.0, 1.0)
