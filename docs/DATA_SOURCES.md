# Data Sources & Operational Ingestion Guide

This document details the real-world satellite, meteorological, and oceanographic datasets used by the Antarctic Decision Support System, and provides exact instructions for swapping sample fixtures for operational feeds.

---

## 1. Primary Datasets

| Dataset | Provider | Parameters | Resolution / Frequency | Access Protocol |
| :--- | :--- | :--- | :--- | :--- |
| **NSIDC-0051 / 0081** | NASA NSIDC / NOAA | Daily Sea Ice Concentration (SIC) | 25 km grid, daily | NASA Earthdata Token / HTTPS NetCDF |
| **AMSR2 / GCOM-W1** | JAXA / University of Bremen | High-res microwave SIC | 6.25 km, daily | Open OPeNDAP / FTP |
| **ERA5 Single Levels** | ECMWF / Copernicus CDS | 10m wind (u/v), 2m air temp, sea ice temp | 0.25° (~28 km), hourly | `cdsapi` Python Client |
| **ECMWF WAM** | ECMWF / Copernicus CDS | Significant Wave Height (swh), Mean Wave Period | 0.5°, 3-hourly | `cdsapi` Python Client |
| **HYCOM / OSCAR** | NOAA / NASA JPL | Surface ocean currents (u, v velocity) | 1/12° (~9 km), daily | NOAA CoastWatch ERDDAP |
| **NIC Antarctic Database**| US National Ice Center | Tracked iceberg IDs, bounding boxes, size classes | Weekly bulletins, Shapefile/CSV | US NIC Open Data Portal |
| **BYU Scatterometer Tracks**| Brigham Young University | Historical iceberg tracks (1999-present) | Tabular text / CSV | BYU Polar Remote Sensing Lab |
| **GEBCO 2023 Grid** | GEBCO / IHO | Bathymetry depth & coastal topography | 15 arc-seconds | GEBCO NetCDF GeoTIFF |
| **Sentinel-1 SAR** | ESA Copernicus / CDSE | Extra-Wide Swath (EW) HH/HV SAR | 20m pixel, 1-3 day repeat | Copernicus Data Space OData API |

---

## 2. Transitioning from Fixtures to Live APIs

### 2.1 NSIDC Live Ingestion
1. Register for a free NASA Earthdata account at [https://urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov).
2. Set your credentials in `.env`:
   ```bash
   EARTHDATA_USERNAME=your_username
   EARTHDATA_PASSWORD=your_password
   ```
3. In `backend/app/data/ingest_nsidc.py`, uncomment the `requests.Session` hook using Earthdata bearer token auth.

### 2.2 ECMWF ERA5 via CDS API
1. Register at [https://cds.climate.copernicus.eu](https://cds.climate.copernicus.eu).
2. Create `~/.cdsapirc`:
   ```
   url: https://cds.climate.copernicus.eu/api/v2
   key: <UID>:<API-KEY>
   ```
3. In `backend/app/data/ingest_era5.py`, install `cdsapi` and trigger the bounding box subset query:
   ```python
   import cdsapi
   c = cdsapi.Client()
   c.retrieve('reanalysis-era5-single-levels', {
       'product_type': 'reanalysis',
       'variable': ['10m_u_component_of_wind', '10m_v_component_of_wind', '2m_temperature'],
       'area': [-60, -60, -78, 15],  # North, West, South, East
       'format': 'netcdf'
   }, 'era5_latest.nc')
   ```

### 2.3 US National Ice Center (NIC) Weekly Scraping
1. NIC publishes weekly tabular tracking data at:
   `https://usicecenter.gov/Products/AntarcticIcebergData`
2. Configure a cron job targeting `backend/app/data/ingest_iceberg_db.py` to poll every Thursday evening UTC.
