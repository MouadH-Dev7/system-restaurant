# Windows Local Server Deployment

This project is best deployed for a restaurant customer as a single local server installed on one Windows machine inside the restaurant network.

## Recommended Architecture For This Project

For the current codebase, the most suitable production model is:

1. One Windows machine acts as the restaurant server.
2. The server runs the backend, frontends, database, and cache services locally.
3. Other devices connect over LAN using the browser.
4. Data stays on the customer machine.

This is better than asking the customer to use Docker commands manually.

## Why This Is The Best Fit For The Current Project

The current system already depends on:

- NestJS backend
- Prisma with PostgreSQL
- Redis-compatible cache and queue behavior
- Multiple frontend apps
- Real-time socket traffic

Because of that, SQLite is not the right final solution for this project:

- weaker for concurrent restaurant activity
- not aligned with the current Prisma/PostgreSQL schema
- would require risky backend changes

The best professional path is:

- keep PostgreSQL
- keep a Redis-compatible local service
- package everything behind a Windows installer

## Final Shape We Should Target

The customer should receive:

- `Restaurant Server Setup.exe`

After installation:

- the server starts automatically with Windows
- the database lives on the same customer machine
- the restaurant accesses the system from the LAN
- backups are saved locally

Example LAN URLs:

- `http://192.168.1.50/` customer
- `http://192.168.1.50/pos`
- `http://192.168.1.50/kitchen`
- `http://192.168.1.50/admin`
- `http://192.168.1.50/waiter`

## Practical Packaging Strategy

For this codebase, the clean path is:

1. Build production frontend apps.
2. Build the backend.
3. Bundle a local Node runtime.
4. Install PostgreSQL silently.
5. Install a Redis-compatible local service silently.
6. Register backend and web processes as Windows services.
7. Generate the customer `.env`.
8. Run Prisma migrations automatically on first launch.
9. Open firewall rules for the LAN ports.
10. Create desktop shortcuts for admin tools and backup tools.

## Recommended Runtime Layout On Customer Machine

Suggested install folder:

`C:\RestaurantServer`

Suggested data folders:

- `C:\RestaurantServer\data`
- `C:\RestaurantServer\data\backups`
- `C:\RestaurantServer\data\logs`
- `C:\RestaurantServer\data\postgres`
- `C:\RestaurantServer\data\redis`

## Ports

- `80` public local network entry
- `4000` backend internal API
- `5432` PostgreSQL local database
- `6379` Redis-compatible service
- `3001` customer app internal
- `3002` pos app internal
- `3003` kitchen app internal
- `3004` admin app internal
- `3005` waiter app internal

In the final installer, users should open only port `80` from other devices. The other ports can stay local-only if the reverse proxy is used correctly.

## What These Files In This Folder Are For

- `client.env.example`
  - template for customer runtime values
- `scripts/prepare-client-env.ps1`
  - generates a LAN-ready env file from the server IP
- `scripts/backup-postgres.ps1`
  - creates database backups
- `scripts/restore-postgres.ps1`
  - restores a backup
- `scripts/build-release-folder.ps1`
  - prepares a release workspace for the future installer

## What Still Needs To Be Built Later

These files prepare the deployment structure, but the final one-click installer still needs:

1. service wrapper selection
2. silent PostgreSQL installer wiring
3. silent Redis-compatible service installer wiring
4. Windows installer packaging
5. automatic first-run service bootstrap

## Recommended Next Development Step

The next technical step should be:

1. create a production release folder
2. serve all apps under one host cleanly
3. add a Windows service wrapper
4. build a final installer

This folder is the base for that work.

## Unified Host Routing Added In The Project

The frontend apps in this project now support runtime base paths through:

- `NEXT_PUBLIC_BASE_PATH`

Target routing model:

- customer app: `/`
- POS: `/pos`
- kitchen: `/kitchen`
- admin: `/admin`
- waiter: `/waiter`

The Nginx config prepared for this model is:

- `deployment/windows-local-server/nginx/unified-local-server.conf`

## Production Runtime Scripts Added

You now also have:

- `scripts/build-production-bundle.ps1`
  - prepares production env files for backend and all frontend apps
  - writes a ready build runner script into the release bundle
- `scripts/start-local-runtime.ps1`
  - starts the built apps locally in production mode for local server testing

This is not the final Windows service layer yet, but it is the bridge to it.

## Windows Service Scripts Added

Service preparation files now exist in:

- `deployment/windows-local-server/services`

They include:

- service registration planning
- start scripts
- stop scripts
- restart scripts
- service status inspection

These are the files the final installer can call after copying the built system onto the customer machine.

## Installer Files Added

The project now includes an Inno Setup installer layer in:

- `deployment/windows-local-server/installer`

It contains:

- installer definition file
- post-install bootstrap script
- installer notes

## Runtime Payload Layout Added

The project now also includes a runtime payload structure in:

- `deployment/windows-local-server/runtime`

This is where the final packaged binaries should be organized before building the customer installer.

## Installation Hooks Added

The installer layer now includes:

- runtime validation
- database and cache install hook
- WinSW config generation
- service installation preparation hooks

This means the install flow is now structurally connected end-to-end.

## Final Delivery Docs Added

The project now includes:

- `FINAL-RELEASE-CHECKLIST.md`
- `PAYLOAD-INSTRUCTIONS.md`
- `BUILD-INSTALLER-STEPS.md`

These files describe the final path from source code to customer installer.

## Application Payload Support Added

The installer now also supports copying an application payload from:

- `release/windows-local-server/app-payload`

This payload is intended to contain the built backend, built app folders, root node_modules, and required workspace files for the first installer generation path.
