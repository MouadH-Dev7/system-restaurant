# Build Installer Steps

## Step 1

Prepare release bundle:

```powershell
pnpm run release:windows-bundle
```

## Step 2

Build production apps:

```powershell
powershell -ExecutionPolicy Bypass -File .\release\windows-local-server\bundle\run-build.ps1
```

## Step 3

Prepare installer workspace:

```powershell
pnpm run release:windows-local-server
```

## Step 4

Prepare runtime folders:

```powershell
powershell -ExecutionPolicy Bypass -File .\deployment\windows-local-server\runtime\prepare-runtime-folders.ps1 -OutputDir .\release\windows-local-server\runtime
```

## Step 5

Copy real runtime binaries into:

- `release/windows-local-server/runtime/node`
- `release/windows-local-server/runtime/pnpm`
- `release/windows-local-server/runtime/winsw`
- `release/windows-local-server/runtime/nginx`
- `release/windows-local-server/runtime/postgres`
- `release/windows-local-server/runtime/redis`

## Step 6

Generate WinSW XML files:

```powershell
powershell -ExecutionPolicy Bypass -File .\deployment\windows-local-server\services\winsw\generate-winsw-configs.ps1 -OutputDir .\release\windows-local-server\winsw-generated
```

## Step 7

Compile Inno Setup script:

- `release/windows-local-server/installer/restaurant-server.iss`

## Step 8

Test on a clean Windows machine before customer delivery.
