# Runtime Payload Layout

This folder defines the runtime payload structure that the final installer should ship to the customer machine.

## Goal

The installer should copy runtime binaries into:

- `C:\RestaurantServer\runtime`

## Planned Runtime Contents

- `node\node.exe`
- `pnpm\pnpm.cmd`
- `winsw\WinSW-x64.exe`
- `nginx\nginx.exe`
- `postgres\installer\postgresql-installer.exe`
- `redis\Memurai-Developer.msi` or another compatible local cache runtime

## Current State

This project now includes placeholder folders and payload documentation.

The real binaries are not committed yet.

## Expected Final Layout On Customer Machine

- `C:\RestaurantServer\runtime\node\`
- `C:\RestaurantServer\runtime\pnpm\`
- `C:\RestaurantServer\runtime\winsw\`
- `C:\RestaurantServer\runtime\nginx\`
- `C:\RestaurantServer\runtime\postgres\`
- `C:\RestaurantServer\runtime\redis\`
