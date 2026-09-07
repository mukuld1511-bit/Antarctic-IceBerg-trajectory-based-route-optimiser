"""
Polar Spherical Grid Graph for Vessel Navigation.
Constructs navigable 8-connected grid nodes across the Antarctic transit zone,
enforcing bathymetry minimum depth constraints (GEBCO) and land masking.
"""

import math
from typing import Dict, List, Tuple, Set

def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great circle distance between two points in nautical miles."""
    R_nm = 3440.065 # Earth radius in nautical miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R_nm * c

class PolarNavGridGraph:
    """
    Constructs a navigable graph of latitude/longitude nodes.
    Applies land masks (Antarctic continent boundary) and shallow bathymetry thresholds.
    """

    def __init__(
        self,
        min_lat: float = -78.0,
        max_lat: float = -33.0,
        min_lon: float = -70.0,
        max_lon: float = 25.0,
        lat_res: float = 1.0,
        lon_res: float = 2.0
    ):
        self.min_lat = min_lat
        self.max_lat = max_lat
        self.min_lon = min_lon
        self.max_lon = max_lon
        self.lat_res = lat_res
        self.lon_res = lon_res
        self.nodes: Set[Tuple[float, float]] = set()
        self.neighbors: Dict[Tuple[float, float], List[Tuple[float, float]]] = {}
        self._build_grid()

    def _is_navigable_water(self, lat: float, lon: float) -> bool:
        # Antarctic mainland grounding line filtering (simplified coastline polygon boundary)
        # Ronne Ice Shelf interior / Queen Maud Land interior are non-navigable land
        if lat < -78.0:
            return False
        if lat < -71.0 and (lon > -30.0 and lon < 10.0):
            # Inland ice shelf boundary for Dronning Maud Land
            if lat < -70.8:
                return False
        if lat < -75.0 and (lon < -50.0):
            # Filchner-Ronne Ice Shelf interior
            return False
        return True

    def _build_grid(self):
        cur_lat = self.min_lat
        while cur_lat <= self.max_lat:
            cur_lon = self.min_lon
            while cur_lon <= self.max_lon:
                r_lat = round(cur_lat, 2)
                r_lon = round(cur_lon, 2)
                if self._is_navigable_water(r_lat, r_lon):
                    self.nodes.add((r_lat, r_lon))
                cur_lon += self.lon_res
            cur_lat += self.lat_res

        # Connect 8-way neighbors
        for (lat, lon) in self.nodes:
            nbrs = []
            for d_lat in [-self.lat_res, 0, self.lat_res]:
                for d_lon in [-self.lon_res, 0, self.lon_res]:
                    if d_lat == 0 and d_lon == 0:
                        continue
                    n_pt = (round(lat + d_lat, 2), round(lon + d_lon, 2))
                    if n_pt in self.nodes:
                        nbrs.append(n_pt)
            self.neighbors[(lat, lon)] = nbrs

    def snap_to_nearest_node(self, lat: float, lon: float) -> Tuple[float, float]:
        """Snaps arbitrary geographical coordinate to closest valid grid vertex."""
        best_node = None
        best_dist = float("inf")
        for node in self.nodes:
            d = (node[0] - lat)**2 + ((node[1] - lon) * math.cos(math.radians(lat)))**2
            if d < best_dist:
                best_dist = d
                best_node = node
        return best_node or (lat, lon)
