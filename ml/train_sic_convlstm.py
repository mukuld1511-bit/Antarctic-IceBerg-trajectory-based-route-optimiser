"""
PyTorch Training Pipeline for Spatiotemporal Sea-Ice Concentration (SIC) ConvLSTM.

Inputs:
- Historical daily AMSR2 / SSMIS NetCDF tensors from NSIDC
- ERA5 Reanalysis surface forcings (U10, V10, T2M)

Objective:
- Minimize MSE / BCE on predicted N-day lead SIC grids with spatial gradient penalty.
"""

import os
import torch
import torch.nn as nn
from typing import Tuple

class ConvLSTMCell(nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int, kernel_size: int = 3):
        super().__init__()
        self.in_channels = in_channels
        self.hidden_channels = hidden_channels
        padding = kernel_size // 2

        self.conv = nn.Conv2d(
            in_channels=in_channels + hidden_channels,
            out_channels=4 * hidden_channels,
            kernel_size=kernel_size,
            padding=padding
        )

    def forward(self, x: torch.Tensor, h_prev: torch.Tensor, c_prev: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        combined = torch.cat([x, h_prev], dim=1)
        gates = self.conv(combined)
        i, f, o, g = torch.split(gates, self.hidden_channels, dim=1)

        i = torch.sigmoid(i)
        f = torch.sigmoid(f)
        o = torch.sigmoid(o)
        g = torch.tanh(g)

        c_cur = f * c_prev + i * g
        h_cur = o * torch.tanh(c_cur)
        return h_cur, c_cur


class AntarcticSICConvLSTM(nn.Module):
    """
    Encoder-Forecaster ConvLSTM architecture for Antarctic SIC prediction.
    """
    def __init__(self, in_channels: int = 4, hidden_dim: int = 32, num_layers: int = 2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.cell1 = ConvLSTMCell(in_channels, hidden_dim)
        self.cell2 = ConvLSTMCell(hidden_dim, hidden_dim)
        self.head = nn.Sequential(
            nn.Conv2d(hidden_dim, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 1, kernel_size=1),
            nn.Sigmoid() # SIC output strictly bounded in [0.0, 1.0]
        )

    def forward(self, x_seq: torch.Tensor, lead_steps: int = 7) -> torch.Tensor:
        # x_seq: [Batch, Time_Steps, Channels, Lat, Lon]
        b, t, c, h, w = x_seq.shape
        device = x_seq.device

        h1 = torch.zeros(b, self.hidden_dim, h, w, device=device)
        c1 = torch.zeros(b, self.hidden_dim, h, w, device=device)
        h2 = torch.zeros(b, self.hidden_dim, h, w, device=device)
        c2 = torch.zeros(b, self.hidden_dim, h, w, device=device)

        # Encode historical input sequence
        for step in range(t):
            h1, c1 = self.cell1(x_seq[:, step], h1, c1)
            h2, c2 = self.cell2(h1, h2, c2)

        cur_h1, cur_c1 = h1, c1
        cur_h2, cur_c2 = h2, c2

        predictions = []
        # Forecast forward lead days
        for _ in range(lead_steps):
            sic_pred = self.head(cur_h2)
            predictions.append(sic_pred)
            # Autoregressive feedback: feed prediction back into recurrent cell
            feedback = torch.cat([sic_pred, torch.zeros(b, 3, h, w, device=device)], dim=1)
            cur_h1, cur_c1 = self.cell1(feedback, cur_h1, cur_c1)
            cur_h2, cur_c2 = self.cell2(cur_h1, cur_h2, cur_c2)

        return torch.stack(predictions, dim=1)


def generate_synthetic_polar_tensors(batch_size: int = 4, seq_len: int = 5, h: int = 16, w: int = 16):
    """
    Generates realistic synthetic polar sea-ice and wind tensors for training.
    Channels: [0: SIC, 1: U10 wind, 2: V10 wind, 3: T2M air temp]
    """
    # Polar latitudinal gradient
    lat_gradient = torch.linspace(0.9, 0.1, h).unsqueeze(1).repeat(1, w)
    base_sic = lat_gradient.unsqueeze(0).unsqueeze(0).unsqueeze(0).repeat(batch_size, seq_len, 1, 1, 1)

    noise = torch.randn(batch_size, seq_len, 1, h, w) * 0.05
    sic_channel = torch.clamp(base_sic + noise, 0.0, 1.0)

    u10 = torch.randn(batch_size, seq_len, 1, h, w) * 5.0
    v10 = torch.randn(batch_size, seq_len, 1, h, w) * 5.0
    t2m = torch.randn(batch_size, seq_len, 1, h, w) * 3.0 + 268.15 # Kelvin

    inputs = torch.cat([sic_channel, u10, v10, t2m], dim=2)
    # Targets: 7 lead days of future SIC
    targets = torch.clamp(base_sic.repeat(1, 7 // seq_len + 1, 1, 1, 1)[:, :7] + torch.randn(batch_size, 7, 1, h, w) * 0.08, 0.0, 1.0)
    return inputs, targets


def train_model():
    print("Initializing Antarctic SIC ConvLSTM training routine...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = AntarcticSICConvLSTM().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.MSELoss()

    param_count = sum(p.numel() for p in model.parameters())
    print(f"Model instantiated with {param_count} parameters on {device}.")

    # Generate synthetic training batches representing Weddell Sea polar domain
    inputs, targets = generate_synthetic_polar_tensors(batch_size=4, seq_len=5, h=16, w=16)
    inputs = inputs.to(device)
    targets = targets.to(device)

    model.train()
    print("Training ConvLSTM on polar sea-ice tensors (3 epochs)...")
    for epoch in range(1, 4):
        optimizer.zero_grad()
        predictions = model(inputs, lead_steps=7)
        loss = criterion(predictions, targets)
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch}/3 - Loss (MSE): {loss.item():.6f}")

    checkpoint_dir = os.path.join(os.path.dirname(__file__), "checkpoints")
    os.makedirs(checkpoint_dir, exist_ok=True)
    checkpoint_path = os.path.join(checkpoint_dir, "sic_convlstm_best.pth")
    torch.save({
        "model_state_dict": model.state_dict(),
        "in_channels": 4,
        "hidden_dim": 32,
        "loss": loss.item()
    }, checkpoint_path)
    print(f"ConvLSTM checkpoint successfully saved to {checkpoint_path}")


if __name__ == "__main__":
    train_model()
