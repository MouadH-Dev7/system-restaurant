# WinSW Integration

This folder contains WinSW-ready service templates for the restaurant local server deployment.

## Purpose

WinSW will be the preferred service wrapper for the final Windows installer because it is suitable for:

- running Node-based processes as Windows services
- restart policies
- clean log paths
- install and uninstall automation

## Services Covered

- backend
- customer app
- pos app
- kitchen app
- admin app
- waiter app

## Expected Final Installer Flow

1. Copy WinSW executable files.
2. Generate XML service files from templates.
3. Install each service.
4. Start each service.
5. Reverse proxy traffic through local Nginx.

## Current Files

- `generate-winsw-configs.ps1`
  - creates concrete XML files in a target folder
- `templates/*.xml`
  - WinSW service templates
