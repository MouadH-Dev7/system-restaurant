# Inno Setup Installer Layer

This folder contains the first installer definition for the Windows local server deployment.

## Goal

Produce a future installer like:

- `RestaurantServerSetup.exe`

## What This Layer Does

- defines install location
- copies prepared release files
- creates data folders
- runs post-install bootstrap scripts
- prepares the path for service installation

## What Still Needs To Be Added Later

- bundled Node runtime payload
- PostgreSQL silent installer payload
- Redis-compatible local service payload
- Nginx binary payload
- WinSW executable payload
- final icons and branding assets

## Main Files

- `restaurant-server.iss`
  - main Inno Setup script
- `postinstall.ps1`
  - post-install bootstrap actions
