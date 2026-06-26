# Payload Instructions

This file describes what must be added manually or by CI before compiling the installer.

## Runtime Payload Root

Place binaries under:

- `release/windows-local-server/runtime`

## Required Binaries

### Node

Place:

- `node.exe`

Into:

- `release/windows-local-server/runtime/node/`

### pnpm

Place:

- `pnpm.cmd`

Into:

- `release/windows-local-server/runtime/pnpm/`

### WinSW

Place:

- `WinSW-x64.exe`

Into:

- `release/windows-local-server/runtime/winsw/`

### nginx

Place:

- `nginx.exe`

Into:

- `release/windows-local-server/runtime/nginx/`

## Optional Binaries

### PostgreSQL Installer

Place:

- `postgresql-installer.exe`

Into:

- `release/windows-local-server/runtime/postgres/`

### Redis Runtime

Place:

- `Memurai-Developer.msi`

Into:

- `release/windows-local-server/runtime/redis/`

## Why These Are Not In Git

These are binary payloads and should usually be distributed through:

- internal artifacts
- release storage
- CI packaging steps

not normal source control.
