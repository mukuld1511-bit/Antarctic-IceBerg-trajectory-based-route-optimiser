"""
Generates representative synthetic fixtures for Antarctic Sea-Ice, Icebergs, and Bathymetry
Target region: Weddell Sea / Dronning Maud Land (Bharati / Maitri transit corridors)
Bounding box roughly 20°W to 60°W (and eastward to 15°E for Maitri approach), 60°S to 78°S.
"""
import json
import math
import os

def generate_sic_grid(lead_days=7):
    # Latitudes: -60.0 to -78.0 with step 1.0
    # Longitudes: -60.0 to 15.0 with step 2.5
    lats = [round(-60.0 - i * 1.0, 1) for i in range(19)]
    lons = [round(-60.0 + j * 2.5, 1) for j in range(31)]
    
    forecasts = []
    for day in range(1, lead_days + 1):
        cells = []
        total_sic = 0.0
        for lat in lats:
            for lon in lons:
                # Physics-informed synthetic sea-ice distribution:
                # - High concentration near Ronne/Filchner Ice Shelf (-75 to -78S, -60 to -40W)
                # - Coastal current gyre (Weddell Gyre) clockwise rotation
                # - Decreases northward toward -60S
                # - Day progression brings slight seasonal expansion + cyclonic deformation
                dist_from_pole = (-lat - 60.0) / 18.0  # 0 at -60S, 1 at -78S
                lon_factor = math.sin((lon + 60.0) * math.pi / 75.0) * 0.25
                day_growth = day * 0.018
                
                base_sic = 0.92 * (dist_from_pole ** 1.3) + lon_factor + day_growth
                # Add gyre eddy fluctuation
                eddy = 0.08 * math.sin(lat * 0.8 + lon * 0.4 + day * 0.3)
                sic_val = max(0.0, min(0.98, base_sic + eddy))
                
                # Confidence decreases with lead time
                confidence = max(0.65, 0.96 - (day - 1) * 0.045 - abs(eddy) * 0.8)
                thickness = round(max(0.1, sic_val * 2.2), 2) if sic_val > 0.15 else 0.0
                
                cells.append({
                    "lat": lat,
                    "lon": lon,
                    "sic": round(sic_val, 3),
                    "confidence": round(confidence, 3),
                    "thickness_m": thickness
                })
                total_sic += sic_val
        
        mean_sic = round(total_sic / len(cells), 3)
        forecasts.append({
            "lead_day": day,
            "valid_time": f"2026-09-{6 + day:02d}T12:00:00Z",
            "mean_concentration": mean_sic,
            "grid_cells": cells
        })
        
    return {
        "region_name": "Weddell Sea / Dronning Maud Land (Maitri-Bharati Corridor)",
        "lat_range": [-78.0, -60.0],
        "lon_range": [-60.0, 15.0],
        "lead_days": lead_days,
        "forecasts": forecasts
    }

def generate_iceberg_fixtures():
    # Prominent tracked icebergs in the Weddell and Southern Ocean sectors
    # Based on US National Ice Center (NIC) designations
    icebergs = [
        {
            "iceberg_id": "A-23a",
            "name": "Megaberg A-23a (Sub-Antarctic Drift)",
            "current_lat": -61.2,
            "current_lon": -48.5,
            "size_class": "D",
            "length_m": 3800.0,
            "width_m": 2900.0,
            "sail_height_m": 42.0,
            "draft_m": 220.0,
            "mass_kg": 1.1e12,
            "drift_speed_knots": 1.45,
            "drift_heading_deg": 38.0,
            "last_observed": "2026-09-05T08:00:00Z",
            "source": "NIC Weekly Tracking / Sentinel-1 SAR",
            "hazard_level": "CRITICAL",
            "notes": "World's largest tabular iceberg drifting into the Southern Ocean Scotia Arc transit lane."
        },
        {
            "iceberg_id": "A-81",
            "name": "Iceberg A-81 (Weddell Continental Slope)",
            "current_lat": -68.4,
            "current_lon": -35.2,
            "size_class": "D",
            "length_m": 1250.0,
            "width_m": 820.0,
            "sail_height_m": 38.0,
            "draft_m": 180.0,
            "mass_kg": 3.8e10,
            "drift_speed_knots": 0.85,
            "drift_heading_deg": 310.0,
            "last_observed": "2026-09-05T10:30:00Z",
            "source": "NIC Weekly Tracking",
            "hazard_level": "HIGH",
            "notes": "Calved from Brunt Ice Shelf, interacting with bathymetric bank."
        },
        {
            "iceberg_id": "B-15z-3",
            "name": "Fragment B-15z-3 (Eastern Weddell)",
            "current_lat": -64.8,
            "current_lon": -18.4,
            "size_class": "C",
            "length_m": 380.0,
            "width_m": 210.0,
            "sail_height_m": 28.0,
            "draft_m": 110.0,
            "mass_kg": 7.4e8,
            "drift_speed_knots": 1.1,
            "drift_heading_deg": 65.0,
            "last_observed": "2026-09-05T14:15:00Z",
            "source": "Sentinel-1 SAR Auto-detection",
            "hazard_level": "MODERATE",
            "notes": "Directly in the approach sector for Indian Antarctic Expedition (Maitri Supply Line)."
        },
        {
            "iceberg_id": "D-30b",
            "name": "Bergy Cluster D-30b (Princess Astrid Coast)",
            "current_lat": -67.2,
            "current_lon": 8.5,
            "size_class": "B",
            "length_m": 55.0,
            "width_m": 35.0,
            "sail_height_m": 16.0,
            "draft_m": 55.0,
            "mass_kg": 6.8e6,
            "drift_speed_knots": 0.65,
            "drift_heading_deg": 250.0,
            "last_observed": "2026-09-05T16:00:00Z",
            "source": "AMSR2 / High Res Optical",
            "hazard_level": "MODERATE",
            "notes": "Fast-ice edge shear zone near Maitri coastal access point."
        },
        {
            "iceberg_id": "IB-2026-09",
            "name": "Growler Swarm GS-09 (South Georgia Channel)",
            "current_lat": -62.5,
            "current_lon": -32.0,
            "size_class": "A",
            "length_m": 12.0,
            "width_m": 9.0,
            "sail_height_m": 3.5,
            "draft_m": 18.0,
            "mass_kg": 4.5e5,
            "drift_speed_knots": 1.8,
            "drift_heading_deg": 52.0,
            "last_observed": "2026-09-05T18:00:00Z",
            "source": "BYU Radar Scattering Database",
            "hazard_level": "CRITICAL",
            "notes": "Low radar cross-section hazard to non-ice strengthened hulls."
        }
    ]
    return icebergs

def generate_polar_stations():
    return [
        {
            "id": "maitri",
            "name": "Maitri Research Station (India)",
            "lat": -70.7667,
            "lon": 11.7333,
            "country": "India",
            "agency": "NCPOR / MoES",
            "established": 1989,
            "role": "Primary winter/summer station, Schirmacher Oasis",
            "coastal_access": "Princess Astrid Coast (-69.9S, 12.0E)"
        },
        {
            "id": "bharati",
            "name": "Bharati Research Station (India)",
            "lat": -69.4069,
            "lon": 76.1906,
            "country": "India",
            "agency": "NCPOR / MoES",
            "established": 2012,
            "role": "Modern winter/summer polar laboratory, Larsemann Hills",
            "coastal_access": "Prydz Bay"
        },
        {
            "id": "cape_town",
            "name": "Port of Cape Town (South Africa)",
            "lat": -33.9249,
            "lon": 18.4241,
            "country": "South Africa",
            "agency": "Gateway Port",
            "established": 1652,
            "role": "Primary departure port for Indian Antarctic Resupply (Maitri)",
            "coastal_access": "Atlantic Ocean"
        },
        {
            "id": "punta_arenas",
            "name": "Punta Arenas (Chile)",
            "lat": -53.1638,
            "lon": -70.9171,
            "country": "Chile",
            "agency": "Gateway Port",
            "established": 1848,
            "role": "Weddell / Antarctic Peninsula logistics staging hub",
            "coastal_access": "Strait of Magellan"
        },
        {
            "id": "halley_vi",
            "name": "Halley VI Research Station (UK)",
            "lat": -75.5833,
            "lon": -25.5000,
            "country": "United Kingdom",
            "agency": "British Antarctic Survey (BAS)",
            "established": 2013,
            "role": "Brunt Ice Shelf atmospheric observatory",
            "coastal_access": "Weddell Sea coast"
        },
        {
            "id": "neumayer_iii",
            "name": "Neumayer-Station III (Germany)",
            "lat": -70.6667,
            "lon": -8.2667,
            "country": "Germany",
            "agency": "Alfred Wegener Institute (AWI)",
            "established": 2009,
            "role": "Ekström Ice Shelf coastal observatory",
            "coastal_access": "Atka Bay"
        }
    ]

def generate_sample_bathymetry():
    # GEBCO 2023 derived synthetic sample depths for the transit bounding box
    # Shallow shelves near Antarctica (<500m), Deep ocean trench (>3500m)
    return {
        "dataset": "GEBCO_2023 Grid Subsampled 0.5 deg",
        "reference": "General Bathymetric Chart of the Oceans",
        "safe_depth_contour_m": 50.0,
        "features": [
            {"name": "Weddell Abyssal Plain", "depth_range_m": [3800, 4700], "hazard": "NONE"},
            {"name": "Berkner Bank / Continental Shelf", "depth_range_m": [150, 400], "hazard": "ICEBERG_GROUNDING_ZONE"},
            {"name": "South Scotia Ridge", "depth_range_m": [250, 950], "hazard": "SUBMARINE_PINNACLES"},
            {"name": "Astrid Ridge (Maitri Approach)", "depth_range_m": [300, 1200], "hazard": "FAST_ICE_PINNING"}
        ]
    }

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(base_dir, exist_ok=True)
    
    sic_data = generate_sic_grid()
    with open(os.path.join(base_dir, "sample_sic_weddell.json"), "w") as f:
        json.dump(sic_data, f, indent=2)
        
    icebergs = generate_iceberg_fixtures()
    with open(os.path.join(base_dir, "sample_icebergs.json"), "w") as f:
        json.dump(icebergs, f, indent=2)
        
    stations = generate_polar_stations()
    with open(os.path.join(base_dir, "sample_stations.json"), "w") as f:
        json.dump(stations, f, indent=2)

    bathymetry = generate_sample_bathymetry()
    with open(os.path.join(base_dir, "sample_bathymetry.json"), "w") as f:
        json.dump(bathymetry, f, indent=2)
        
    print("Generated all sample fixtures in", base_dir)

if __name__ == "__main__":
    main()
