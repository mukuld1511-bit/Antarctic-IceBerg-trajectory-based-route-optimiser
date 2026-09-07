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
    def __init__(self, in_channels: int = 4, hidden_dim: int = 64, num_layers: int = 2):
        super().__init__()
        self.cell1 = ConvLSTMCell(in_channels, hidden_dim)
        self.cell2 = ConvLSTMCell(hidden_dim, hidden_dim)
        self.head = nn.Sequential(
            nn.Conv2d(hidden_dim, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid() # SIC output strictly bounded in [0.0, 1.0]
        )

    def forward(self, x_seq: torch.Tensor, lead_steps: int = 7) -> torch.Tensor:
        # x_seq: [Batch, Time_Steps, Channels, Lat, Lon]
        b, t, c, h, w = x_seq.shape
        device = x_seq.device

        h1 = torch.zeros(b, 64, h, w, device=device)
        c1 = torch.zeros(b, 64, h, w, device=device)
        h2 = torch.zeros(b, 64, h, w, device=device)
        c2 = torch.zeros(b, 64, h, w, device=device)

        # Encode historical input sequence
        for step in range(t):
            h1, c1 = self.cell1(x_seq[:, step], h1, c1)
            h2, c2 = self.cell2(h1, h2, c2)

        predictions = []
        cur_h2 = h2
        cur_c2 = c2

        # Forecast forward lead days
        for _ in range(lead_steps):
            sic_pred = self.head(cur_h2)
            predictions.append(sic_pred)
            # Autoregressive feedback: feed prediction back into recurrent cell
            feedback = torch.cat([sic_pred, torch.zeros(b, 3, h, w, device=device)], dim=1)
            cur_h1, c1 = self.cell1(feedback, h1, c1)
            cur_h2, cur_c2 = self.cell2(cur_h1, cur_c2)

        return torch.stack(predictions, dim=1)


def train_model():
    print("Initializing Antarctic SIC ConvLSTM training routine...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = AntarcticSICConvLSTM().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.MSELoss()

    print(f"Model instantiated with {sum(p.numel() for p in model.parameters())} parameters on {device}.")
    print("Ready for historical NSIDC NetCDF training dataset.")
    # torch.save(model.state_dict(), "ml/checkpoints/sic_convlstm_best.pth")

if __name__ == "__main__":
    train_model()
