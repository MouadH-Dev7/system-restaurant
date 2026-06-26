param(
  [string]$ServerIp = "127.0.0.1",
  [string]$OutputDir = ".\release\windows-local-server\bundle",
  [switch]$SkipBuild
)

$root = Resolve-Path "."
$bundleDir = Join-Path $root $OutputDir
$configDir = Join-Path $bundleDir "config"
$logsDir = Join-Path $bundleDir "logs"
$guardScript = Join-Path $root 'deployment\windows-local-server\scripts\prisma-guards.ps1'

if (-not (Test-Path $guardScript)) {
  throw "Prisma guard script not found: $guardScript"
}

. $guardScript

if (-not (Test-Path $bundleDir)) {
  New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null
}

New-Item -ItemType Directory -Path $configDir -Force | Out-Null
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

$publicBaseUrl = "http://$ServerIp"
$commonCors = @(
  $publicBaseUrl,
  "$publicBaseUrl:3001",
  "$publicBaseUrl:3002",
  "$publicBaseUrl:3003",
  "$publicBaseUrl:3004",
  "$publicBaseUrl:3005"
) -join ','

$backendEnv = @"
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
DATABASE_URL=postgresql://postgres:{GENERATED_AT_INSTALL}@127.0.0.1:5432/restaurant_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET={GENERATED_AT_INSTALL}
JWT_REFRESH_SECRET={GENERATED_AT_INSTALL}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CUSTOMER_APP_URL=$publicBaseUrl
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
CORS_ORIGIN=$commonCors
HOST_IP=$ServerIp
"@

$customerEnv = @"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BASE_PATH=
"@

$posEnv = @"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BASE_PATH=/pos
"@

$kitchenEnv = @"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BASE_PATH=/kitchen
"@

$adminEnv = @"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BASE_PATH=/admin
"@

$waiterEnv = @"
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=$publicBaseUrl
API_INTERNAL_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BASE_PATH=/waiter
"@

Set-Content -Path (Join-Path $configDir "backend.env") -Value $backendEnv -Encoding UTF8
Set-Content -Path (Join-Path $configDir "customer-app.env") -Value $customerEnv -Encoding UTF8
Set-Content -Path (Join-Path $configDir "pos-app.env") -Value $posEnv -Encoding UTF8
Set-Content -Path (Join-Path $configDir "kitchen-app.env") -Value $kitchenEnv -Encoding UTF8
Set-Content -Path (Join-Path $configDir "admin-dashboard.env") -Value $adminEnv -Encoding UTF8
Set-Content -Path (Join-Path $configDir "waiter-app.env") -Value $waiterEnv -Encoding UTF8

if ($SkipBuild) {
  Write-Host "Environment files prepared only at $configDir" -ForegroundColor Yellow
  exit 0
}

$buildScript = Join-Path $bundleDir "run-build.ps1"
$buildContent = @"
`$ErrorActionPreference = 'Stop'
Set-Location '$root'

function Invoke-AppBuild {
  param(
    [string]`$Filter,
    [string]`$BasePath
  )

  `$env:NODE_ENV = 'production'
  `$env:NEXT_PUBLIC_API_URL = '/api'
  `$env:NEXT_PUBLIC_SOCKET_URL = '$publicBaseUrl'
  `$env:API_INTERNAL_URL = 'http://127.0.0.1:4000'
  `$env:NEXT_PUBLIC_BASE_PATH = `$BasePath
  pnpm --filter `$Filter build
}

`$env:NODE_ENV = 'production'
pnpm --filter @repo/backend prisma:generate
if (`$LASTEXITCODE -ne 0) {
  Write-Error 'Backend prisma generate failed during production build.'
  throw 'Production Prisma build failed.'
}
Assert-PrismaClientGenerated -BasePath '$root' -Context 'Production build Prisma gate'
pnpm --filter @repo/backend build

Invoke-AppBuild -Filter '@repo/customer-app' -BasePath ''
Invoke-AppBuild -Filter '@repo/pos-app' -BasePath '/pos'
Invoke-AppBuild -Filter '@repo/kitchen-app' -BasePath '/kitchen'
Invoke-AppBuild -Filter '@repo/admin-dashboard' -BasePath '/admin'
Invoke-AppBuild -Filter '@repo/waiter-app' -BasePath '/waiter'
"@

Set-Content -Path $buildScript -Value $buildContent -Encoding UTF8

Write-Host "Bundle config prepared at $bundleDir" -ForegroundColor Green
Write-Host "To build production apps run:" -ForegroundColor Cyan
Write-Host "powershell -ExecutionPolicy Bypass -File `"$buildScript`"" -ForegroundColor White
