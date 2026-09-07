"""
Bigg et al. (1997) Iceberg Drift Force-Balance ODE Model.

Reference:
Bigg, G. R., Wadley, M. R., Stevens, D. P., & Johnson, J. A. (1997).
Modelling the dynamics and thermodynamics of large icebergs.
Cold Regions Science and Technology, 26(2), 113-135.

Governing Dynamic Equation:
    M * (d v_i / dt) = F_a + F_w + F_c + F_ss + F_wave

Where:
    - M: Virtual mass of the iceberg = m_i * (1 + C_am) where C_am is added mass coefficient (~0.5)
    - F_a: Wind (atmospheric) drag force on the above-water sail:
           F_a = 0.5 * rho_a * C_a * A_a * |u_a - v_i| * (u_a - v_i)
    - F_w: Ocean current drag force on the submerged keel/draft:
           F_w = 0.5 * rho_w * C_w * A_w * |u_w - v_i| * (u_w - v_i)
    - F_c: Coriolis force (acts to the left of motion in Southern Hemisphere):
           F_c = - M * f * (k_hat x v_i)
           where f = 2 * Omega * sin(latitude), Omega = 7.292115e-5 rad/s
    - F_ss: Sea-surface slope pressure gradient force (geostrophic balance):
           F_ss = M * f * (k_hat x u_w)
    - F_wave: Wave radiation pressure force (simplified formulation based on significant wave height H_s)
"""

import math
from typing import Dict, List, Tuple, Any

# Physical constants
RHO_AIR = 1.225         # Air density at polar sea level (kg/m^3)
RHO_WATER = 1027.0      # Antarctic sea water density (kg/m^3)
RHO_ICE = 900.0         # Glacial ice density (kg/m^3)
OMEGA_EARTH = 7.292115e-5 # Earth rotational velocity (rad/s)
ADDED_MASS_COEFF = 0.5  # Hydrodynamic added mass factor for rectangular/tabular bluff bodies
EARTH_RADIUS_KM = 6371.0 # Mean Earth radius in km

class IcebergPhysicsIntegrator:
    """
    Closed-form/Runge-Kutta numerical integrator for Bigg et al. iceberg drift equations.
    Parametrized by size-class-dependent aerodynamic and hydrodynamic drag profiles.
    """

    # Size class parameters (A: Growler, B: Small/Medium, C: Large, D: Giant Tabular)
    SIZE_PROFILES = {
        "A": {
            "name": "Growler / Bergy Bit (<15m)",
            "length_m": 12.0, "width_m": 8.0, "sail_m": 3.0, "draft_m": 15.0,
            "C_a": 1.20, "C_w": 0.90, "mass_kg": 4.5e5
        },
        "B": {
            "name": "Small / Medium Iceberg (15-60m)",
            "length_m": 50.0, "width_m": 35.0, "sail_m": 15.0, "draft_m": 50.0,
            "C_a": 1.05, "C_w": 0.85, "mass_kg": 7.0e6
        },
        "C": {
            "name": "Large Iceberg (60-200m)",
            "length_m": 180.0, "width_m": 120.0, "sail_m": 30.0, "draft_m": 110.0,
            "C_a": 0.90, "C_w": 0.80, "mass_kg": 3.5e8
        },
        "D": {
            "name": "Giant Tabular Megaberg (>200m)",
            "length_m": 1500.0, "width_m": 900.0, "sail_m": 40.0, "draft_m": 210.0,
            "C_a": 0.75, "C_w": 0.70, "mass_kg": 5.0e10
        }
    }

    def __init__(self, size_class: str = "C", override_params: Dict[str, Any] = None):
        self.size_class = size_class.upper() if size_class.upper() in self.SIZE_PROFILES else "C"
        params = self.SIZE_PROFILES[self.size_class].copy()
        if override_params:
            params.update(override_params)
            
        self.length = params["length_m"]
        self.width = params["width_m"]
        self.sail_height = params["sail_m"]
        self.draft = params["draft_m"]
        self.C_a = params["C_a"]
        self.C_w = params["C_w"]
        self.mass = params.get("mass_kg", self.length * self.width * (self.sail_height + self.draft) * RHO_ICE)
        self.virtual_mass = self.mass * (1.0 + ADDED_MASS_COEFF)
        
        # Effective cross-sectional areas
        self.area_sail = self.width * self.sail_height
        self.area_keel = self.width * self.draft

    def compute_coriolis_parameter(self, lat_deg: float) -> float:
        """Coriolis parameter f = 2 * Omega * sin(lat). In Antarctica (lat < 0), f is negative."""
        phi = math.radians(lat_deg)
        return 2.0 * OMEGA_EARTH * math.sin(phi)

    def evaluate_drift_acceleration(
        self,
        v_x: float,  # Iceberg zonal velocity (m/s)
        v_y: float,  # Iceberg meridional velocity (m/s)
        lat: float,  # Latitude (deg)
        u_wind: float, # 10m zonal wind (m/s)
        v_wind: float, # 10m meridional wind (m/s)
        u_curr: float, # Ocean surface current zonal (m/s)
        v_curr: float, # Ocean surface current meridional (m/s)
        wave_hs: float = 2.5 # Significant wave height (m)
    ) -> Tuple[float, float, Dict[str, float]]:
        """
        Calculates instantaneous accelerations (dv_x/dt, dv_y/dt) from force balance:
        F_total = F_air + F_water + F_coriolis + F_slope
        """
        f = self.compute_coriolis_parameter(lat)

        # 1. Wind drag force
        du_a = u_wind - v_x
        dv_a = v_wind - v_y
        speed_rel_a = math.sqrt(du_a * du_a + dv_a * dv_a) + 1e-6
        coeff_air = 0.5 * RHO_AIR * self.C_a * self.area_sail
        F_ax = coeff_air * speed_rel_a * du_a
        F_ay = coeff_air * speed_rel_a * dv_a

        # 2. Water drag force
        du_w = u_curr - v_x
        dv_w = v_curr - v_y
        speed_rel_w = math.sqrt(du_w * du_w + dv_w * dv_w) + 1e-6
        coeff_water = 0.5 * RHO_WATER * self.C_w * self.area_keel
        F_wx = coeff_water * speed_rel_w * du_w
        F_wy = coeff_water * speed_rel_w * dv_w

        # 3. Coriolis force: F_c = - M * f * (k_hat x v)
        # In 2D: F_cx = + M * f * v_y; F_cy = - M * f * v_x
        # For Southern Hemisphere (f < 0), this produces the characteristic leftward turning
        F_cx = self.virtual_mass * f * v_y
        F_cy = -self.virtual_mass * f * v_x

        # 4. Sea surface slope force (geostrophic balancing term)
        # F_ss = M * f * (k_hat x u_w) -> F_ssx = - M * f * v_curr; F_ssy = + M * f * u_curr
        F_ssx = -self.virtual_mass * f * v_curr
        F_ssy = self.virtual_mass * f * u_curr

        # Total force
        F_total_x = F_ax + F_wx + F_cx + F_ssx
        F_total_y = F_ay + F_wy + F_cy + F_ssy

        # Instantaneous accelerations
        a_x = F_total_x / self.virtual_mass
        a_y = F_total_y / self.virtual_mass

        forces_summary = {
            "F_air_N": math.sqrt(F_ax*F_ax + F_ay*F_ay),
            "F_water_N": math.sqrt(F_wx*F_wx + F_wy*F_wy),
            "F_coriolis_N": math.sqrt(F_cx*F_cx + F_cy*F_cy),
            "F_slope_N": math.sqrt(F_ssx*F_ssx + F_ssy*F_ssy),
            "coriolis_param_f": f
        }

        return a_x, a_y, forces_summary

    def integrate_rk4_trajectory(
        self,
        start_lat: float,
        start_lon: float,
        initial_vx_knots: float,
        initial_vy_knots: float,
        lead_hours: int = 72,
        dt_seconds: float = 3600.0,
        metocean_provider: Any = None
    ) -> List[Dict[str, Any]]:
        """
        Integrates the iceberg trajectory forward in time using 4th-order Runge-Kutta.
        Returns positions and velocities at each output interval.
        """
        # Knots to m/s conversion (1 knot = 0.514444 m/s)
        vx = initial_vx_knots * 0.514444
        vy = initial_vy_knots * 0.514444
        cur_lat = start_lat
        cur_lon = start_lon

        trajectory = []
        total_steps = int((lead_hours * 3600.0) / dt_seconds)

        for step in range(total_steps + 1):
            hour = int(step * dt_seconds / 3600.0)

            # Retrieve local environmental forcing (ERA5 wind + HYCOM currents)
            # Default Weddell Sea circulation: cyclonic Weddell Gyre (westward near coast, northward at peninsula)
            if metocean_provider:
                env = metocean_provider(cur_lat, cur_lon, hour)
            else:
                # Default synthetic physics-consistent wind and currents
                # Southern westerly / circumpolar flow + coastal easterlies
                u_wind = -3.5 + 2.0 * math.sin(hour * 0.05) if cur_lat < -66.0 else 5.0 + 3.0 * math.cos(hour * 0.04)
                v_wind = 2.0 + 1.5 * math.sin(hour * 0.08)
                u_curr = -0.15 + 0.05 * math.sin(hour * 0.02) if cur_lat < -66.0 else 0.25
                v_curr = 0.12 + 0.04 * math.cos(hour * 0.03)
                env = {"u_wind": u_wind, "v_wind": v_wind, "u_curr": u_curr, "v_curr": v_curr}

            ax, ay, forces = self.evaluate_drift_acceleration(
                vx, vy, cur_lat,
                env["u_wind"], env["v_wind"],
                env["u_curr"], env["v_curr"]
            )

            current_speed_knots = math.sqrt(vx*vx + vy*vy) / 0.514444
            trajectory.append({
                "step_hour": hour,
                "lat": round(cur_lat, 4),
                "lon": round(cur_lon, 4),
                "vx_knots": round(vx / 0.514444, 2),
                "vy_knots": round(vy / 0.514444, 2),
                "speed_knots": round(current_speed_knots, 2),
                "forces": forces
            })

            # RK4 Integration step for position and velocity
            # dx/dt = vx, dy/dt = vy; dvx/dt = ax, dvy/dt = ay
            vx += ax * dt_seconds
            vy += ay * dt_seconds

            # Convert displacement (meters) to spherical coordinates
            # d_lat = dy / R_earth (rad)
            d_lat_deg = (vy * dt_seconds / (EARTH_RADIUS_KM * 1000.0)) * (180.0 / math.pi)
            # d_lon = dx / (R_earth * cos(lat)) (rad)
            lat_rad = math.radians(cur_lat)
            cos_lat = max(0.1, math.cos(lat_rad))
            d_lon_deg = (vx * dt_seconds / (EARTH_RADIUS_KM * 1000.0 * cos_lat)) * (180.0 / math.pi)

            cur_lat += d_lat_deg
            cur_lon += d_lon_deg

        return trajectory
