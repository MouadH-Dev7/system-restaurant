# Windows Services Layer

This folder prepares the project for a real Windows service deployment.

## Strategy

For the final installer, each runtime component should be managed as a Windows service.

Recommended service names:

- `RestaurantBackend`
- `RestaurantCustomerApp`
- `RestaurantPosApp`
- `RestaurantKitchenApp`
- `RestaurantAdminApp`
- `RestaurantWaiterApp`
- `RestaurantNginx`

## Current Purpose

These scripts do not bundle the final service manager yet.
They prepare:

- service registration commands
- runtime env mapping
- start and stop orchestration
- status inspection

## WinSW Direction

This project now includes a WinSW preparation layer in:

- `deployment/windows-local-server/services/winsw`

That layer includes:

- XML templates
- config generation script

WinSW is now the preferred service wrapper direction for the final installer.
