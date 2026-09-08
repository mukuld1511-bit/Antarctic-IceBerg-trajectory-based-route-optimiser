@echo off
title Antarctic Sea-Ice & Iceberg DSS Launcher
color 0B

echo =========================================================
echo    ANTARCTIC SEA-ICE & NAVIGATION DECISION SUPPORT
echo    MoES / National Centre for Polar and Ocean Research
echo =========================================================
echo.
echo Starting Core DSS Platform (Vite + Express + AISStream)...
echo.

start "" "http://localhost:3000"

npm run dev
