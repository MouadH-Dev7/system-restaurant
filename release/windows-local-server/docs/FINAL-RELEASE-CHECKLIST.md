# Final Release Checklist

Use this checklist before generating the final customer installer.

## 1. Build The Application

- Run `pnpm install`
- Run `pnpm run release:windows-bundle`
- Run the generated build script from `release/windows-local-server/bundle/run-build.ps1`

## 2. Prepare Release Workspace

- Run `pnpm run release:windows-local-server`
- Confirm the folder exists:
  - `release/windows-local-server`

## 3. Add Runtime Payload Files

Copy real binaries into:

- `release/windows-local-server/runtime/node/node.exe`
- `release/windows-local-server/runtime/pnpm/pnpm.cmd`
- `release/windows-local-server/runtime/winsw/WinSW-x64.exe`
- `release/windows-local-server/runtime/nginx/nginx.exe`
- `release/windows-local-server/runtime/postgres/postgresql-installer.exe`
- `release/windows-local-server/runtime/redis/redis-server.exe`

## 4. Validate Runtime Payload

Before building installer, validate that required files are present.

Expected required payload:

- Node
- pnpm
- WinSW
- nginx

Optional according to packaging strategy:

- none for the full installer path

## 5. Generate WinSW XML Files

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\deployment\windows-local-server\services\winsw\generate-winsw-configs.ps1 -OutputDir .\release\windows-local-server\winsw-generated
```

## 6. Review Installer Inputs

Verify:

- `release/windows-local-server/installer/restaurant-server.iss`
- `release/windows-local-server/installer/postinstall.ps1`
- `release/windows-local-server/installer/validate-runtime.ps1`
- `release/windows-local-server/installer/install-services.ps1`

## 7. Build The Installer

Open the Inno Setup compiler and compile:

- `release/windows-local-server/installer/restaurant-server.iss`

## 8. Test On Clean Windows Machine

Test:

- installation path creation
- runtime validation
- env file generation
- WinSW XML generation
- service wrapper preparation
- LAN access URLs
- backup and restore scripts

## 9. Production Acceptance Before Customer Delivery

Confirm:

- backend starts
- frontends start
- nginx proxies routes correctly
- customer ordering works
- POS works
- kitchen works
- waiter works
- admin works
- database persists after restart
- logs are written
- services restart after reboot
