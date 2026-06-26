param(
  [string]$InstallRoot = "C:\RestaurantServer",
  [string]$ServerIp = "127.0.0.1"
)

Write-Host "Preparing Restaurant Server post-install bootstrap..." -ForegroundColor Cyan

$nodeExe = Join-Path $InstallRoot "runtime\node\node.exe"
$pnpmCmd = Join-Path $InstallRoot "runtime\pnpm\pnpm.cmd"
$ErrorActionPreference = 'Stop'
$prismaGuardScript = Join-Path $InstallRoot 'scripts\prisma-guards.ps1'
$installLogPath = Join-Path $InstallRoot 'logs\install.log'

function Ensure-InstallLog {
  $logDir = Split-Path -Path $installLogPath -Parent
  if ($logDir -and -not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  }

  if (-not (Test-Path $installLogPath)) {
    New-Item -ItemType File -Path $installLogPath -Force | Out-Null
  }
}

function Write-InstallLog([string]$Step, [string]$Status, [string]$Message) {
  Ensure-InstallLog
  $timestamp = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss.fffK')
  Add-Content -Path $installLogPath -Value "[$timestamp] [$Status] [$Step] $Message"
}

function Invoke-InstallStep([string]$StepName, [scriptblock]$Action) {
  Write-InstallLog -Step $StepName -Status 'START' -Message 'Step started.'
  try {
    & $Action
    Write-InstallLog -Step $StepName -Status 'SUCCESS' -Message 'Step completed successfully.'
  } catch {
    $message = $_.Exception.Message
    Write-InstallLog -Step $StepName -Status 'FAILURE' -Message $message
    throw
  }
}

if (-not (Test-Path $prismaGuardScript)) {
  throw "Prisma guard script not found: $prismaGuardScript"
}

. $prismaGuardScript

function Write-EnvFile([string]$Path, [string]$Content) {
  $dir = Split-Path -Path $Path -Parent
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

function New-RandomSecret([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
  return [Convert]::ToBase64String($buffer)
}

function New-RandomPassword([int]$Length = 20) {
  $allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $maxExclusive = $allowed.Length
  $limit = [byte](256 - (256 % $maxExclusive))
  $chars = 1..$Length | ForEach-Object {
    $buffer = New-Object byte[] 1
    do {
      $rng.GetBytes($buffer)
    } while ($buffer[0] -ge $limit)
    $allowed[$buffer[0] % $maxExclusive]
  }
  $rng.Dispose()

  return -join $chars
}

function Get-ManifestPath {
  return Join-Path $InstallRoot 'config\installation-secrets.json'
}

function Save-InstallSecrets([hashtable]$Secrets) {
  $manifestPath = Get-ManifestPath
  $manifestDir = Split-Path -Path $manifestPath -Parent
  if (-not (Test-Path $manifestDir)) {
    New-Item -ItemType Directory -Path $manifestDir -Force | Out-Null
  }

  ($Secrets | ConvertTo-Json -Depth 4) | Set-Content -Path $manifestPath -Encoding UTF8
}

function New-InstallSecrets {
  $adminPassword = New-RandomPassword
  return @{
    generatedAt = (Get-Date).ToString('o')
    postgresPassword = New-RandomPassword 24
    jwtSecret = New-RandomSecret 48
    jwtRefreshSecret = New-RandomSecret 48
    restaurantName = 'Restaurant Setup Required'
    restaurantAddress = 'Update this address after first sign-in'
    restaurantContactPhone = '+0000000000'
    adminName = 'System Administrator'
    adminEmail = 'admin@local.restaurant'
    adminStaffCode = 'ADMIN001'
    adminPassword = $adminPassword
    loginUrl = ''
  }
}

function Set-ProcessEnvironment([hashtable]$Secrets, [string]$DetectedIp) {
  [Environment]::SetEnvironmentVariable('RESTAURANT_POSTGRES_PASSWORD', $Secrets.postgresPassword, 'Process')
  [Environment]::SetEnvironmentVariable('JWT_SECRET', $Secrets.jwtSecret, 'Process')
  [Environment]::SetEnvironmentVariable('JWT_REFRESH_SECRET', $Secrets.jwtRefreshSecret, 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_NAME', $Secrets.restaurantName, 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_ADDRESS', $Secrets.restaurantAddress, 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_CONTACT_PHONE', $Secrets.restaurantContactPhone, 'Process')
  [Environment]::SetEnvironmentVariable('INITIAL_ADMIN_NAME', $Secrets.adminName, 'Process')
  [Environment]::SetEnvironmentVariable('INITIAL_ADMIN_EMAIL', $Secrets.adminEmail, 'Process')
  [Environment]::SetEnvironmentVariable('INITIAL_ADMIN_STAFF_CODE', $Secrets.adminStaffCode, 'Process')
  [Environment]::SetEnvironmentVariable('INITIAL_ADMIN_PASSWORD', $Secrets.adminPassword, 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_LANGUAGE', 'ar', 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_DIRECTION', 'rtl', 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_LOCALE', 'ar-DZ', 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_DATE_FORMAT', 'dd/MM/yyyy', 'Process')
  [Environment]::SetEnvironmentVariable('RESTAURANT_CURRENCY', 'DZD', 'Process')
  $Secrets.loginUrl = "http://$DetectedIp:3004"
}

function Get-PrimaryIPv4 {
  try {
    $candidate = Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.PrefixOrigin -ne 'WellKnown'
      } |
      Sort-Object InterfaceMetric |
      Select-Object -First 1 -ExpandProperty IPAddress

    if ($candidate) {
      return $candidate
    }
  } catch {
  }

  return $ServerIp
}

function Ensure-AppEnvFiles([string]$DetectedIp) {
  $apiUrl = "http://$DetectedIp:4000"
  $frontendEnv = @"
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
DATABASE_URL=postgresql://postgres:$([Environment]::GetEnvironmentVariable('RESTAURANT_POSTGRES_PASSWORD','Process'))@127.0.0.1:5432/restaurant_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=$([Environment]::GetEnvironmentVariable('JWT_SECRET','Process'))
JWT_REFRESH_SECRET=$([Environment]::GetEnvironmentVariable('JWT_REFRESH_SECRET','Process'))
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://$DetectedIp,http://$DetectedIp:3001,http://$DetectedIp:3002,http://$DetectedIp:3003,http://$DetectedIp:3004,http://$DetectedIp:3005,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost
CUSTOMER_APP_URL=http://$DetectedIp:3001
"@

  Write-EnvFile -Path (Join-Path $InstallRoot "backend\.env") -Content $frontendEnv

  $apps = @(
    @{ Path = "apps\customer-app\.env.local"; Port = 3001 },
    @{ Path = "apps\pos-app\.env.local"; Port = 3002 },
    @{ Path = "apps\kitchen-app\.env.local"; Port = 3003 },
    @{ Path = "apps\admin-dashboard\.env.local"; Port = 3004 },
    @{ Path = "apps\waiter-app\.env.local"; Port = 3005 }
  )

  foreach ($app in $apps) {
    $content = @"
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=http://$DetectedIp:4000
API_INTERNAL_URL=http://127.0.0.1:4000
PORT=$($app.Port)
"@
    Write-EnvFile -Path (Join-Path $InstallRoot $app.Path) -Content $content
  }
}

function Assert-DependenciesPresent {
  $requiredPaths = @(
    (Join-Path $InstallRoot 'node_modules\next\dist\bin\next'),
    (Join-Path $InstallRoot 'node_modules\.pnpm'),
    (Join-Path $InstallRoot 'backend\node_modules'),
    (Join-Path $InstallRoot 'backend\dist\main.js')
  )

  foreach ($path in $requiredPaths) {
    if (-not (Test-Path $path)) {
      throw "Packaged application payload is incomplete. Missing: $path"
    }
  }
}

function Apply-DatabaseMigrationsAndSeed {
  $env:Path = "$InstallRoot\runtime\node;$env:Path"
  Push-Location (Join-Path $InstallRoot "backend")
  try {
    & $pnpmCmd prisma generate | Out-Host
    if ($LASTEXITCODE -ne 0) {
      Write-Error 'pnpm prisma generate failed during installer postinstall.'
      throw 'Installer Prisma generate failed.'
    }
    Assert-PrismaClientGenerated -BasePath $InstallRoot -Context 'Installer Prisma gate'
    & $pnpmCmd prisma migrate deploy | Out-Host
    & $pnpmCmd prisma db seed | Out-Host
  } finally {
    Pop-Location
  }
}

function Wait-ForHttpHealth([string]$Url, [int]$TimeoutSeconds = 90) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 10
      if ($response.status -eq 'online' -or $response.status -eq 'warning') {
        return
      }
    } catch {
    }

    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  throw "HTTP health check failed: $Url"
}

function Wait-ForHttpPage([string]$Url, [int]$TimeoutSeconds = 90) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
    }

    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  throw "Frontend page did not become reachable: $Url"
}

function Assert-AdminLoginWorks {
  $payload = @{
    staffCode = [Environment]::GetEnvironmentVariable('INITIAL_ADMIN_STAFF_CODE', 'Process')
    password = [Environment]::GetEnvironmentVariable('INITIAL_ADMIN_PASSWORD', 'Process')
  } | ConvertTo-Json

  $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4000/auth/login' -Method Post -Body $payload -ContentType 'application/json' -TimeoutSec 15
  if (-not $response.accessToken) {
    throw 'Admin login verification failed after installation.'
  }
}

function Create-AdminShortcut([string]$DetectedIp) {
  $shortcutPath = Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) 'Restaurant Admin.url'
  $content = @"
[InternetShortcut]
URL=http://$DetectedIp:3004
IconFile=$InstallRoot\runtime\node\node.exe
IconIndex=0
"@
  Set-Content -Path $shortcutPath -Value $content -Encoding ASCII
}

$paths = @(
  "$InstallRoot\data",
  "$InstallRoot\data\backups",
  "$InstallRoot\data\logs",
  "$InstallRoot\data\postgres",
  "$InstallRoot\data\redis",
  "$InstallRoot\logs",
  "$InstallRoot\runtime",
  "$InstallRoot\runtime\node",
  "$InstallRoot\runtime\pnpm",
  "$InstallRoot\runtime\winsw",
  "$InstallRoot\runtime\nginx",
  "$InstallRoot\runtime\postgres",
  "$InstallRoot\runtime\redis",
  "$InstallRoot\logs\backend",
  "$InstallRoot\logs\customer-app",
  "$InstallRoot\logs\pos-app",
  "$InstallRoot\logs\kitchen-app",
  "$InstallRoot\logs\admin-dashboard",
  "$InstallRoot\logs\waiter-app"
)

try {
  Invoke-InstallStep -StepName 'Prepare directories' -Action {
    foreach ($path in $paths) {
      if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
      }
    }
  }

  $prepareEnvScript = Join-Path $InstallRoot "scripts\prepare-client-env.ps1"
  Invoke-InstallStep -StepName 'Prepare client env' -Action {
    if (Test-Path $prepareEnvScript) {
      $script:ServerIp = Get-PrimaryIPv4
      powershell -ExecutionPolicy Bypass -File $prepareEnvScript -ServerIp $script:ServerIp -OutputFile "$InstallRoot\config\client.env"
    }
  }

  $installSecrets = $null
  Invoke-InstallStep -StepName 'Generate installation secrets' -Action {
    $script:installSecrets = New-InstallSecrets
  }

  Invoke-InstallStep -StepName 'Create application env files' -Action {
    Set-ProcessEnvironment -Secrets $script:installSecrets -DetectedIp $ServerIp
    Ensure-AppEnvFiles -DetectedIp $ServerIp
  }

  $runtimeValidator = Join-Path $InstallRoot "installer\validate-runtime.ps1"
  Invoke-InstallStep -StepName 'Validate runtime' -Action {
    if (Test-Path $runtimeValidator) {
      powershell -ExecutionPolicy Bypass -File $runtimeValidator -InstallRoot $InstallRoot -ManifestPath "$InstallRoot\runtime\install-manifest.json"
      if ($LASTEXITCODE -ne 0) {
        throw "Runtime validation script failed with exit code $LASTEXITCODE"
      }
    }
  }

  $installDbAndCacheScript = Join-Path $InstallRoot "installer\install-database-and-cache.ps1"
  Invoke-InstallStep -StepName 'Install database and cache' -Action {
    if (Test-Path $installDbAndCacheScript) {
      powershell -ExecutionPolicy Bypass -File $installDbAndCacheScript -InstallRoot $InstallRoot
      if ($LASTEXITCODE -ne 0) {
        throw "Database and cache installer failed with exit code $LASTEXITCODE"
      }
    }
  }

  Invoke-InstallStep -StepName 'Validate packaged dependencies' -Action {
    Assert-DependenciesPresent
  }

  Invoke-InstallStep -StepName 'Prisma generate migrate seed' -Action {
    Apply-DatabaseMigrationsAndSeed
  }

  $winswGenerator = Join-Path $InstallRoot "winsw\generate-winsw-configs.ps1"
  Invoke-InstallStep -StepName 'Generate WinSW configs' -Action {
    if (Test-Path $winswGenerator) {
      powershell -ExecutionPolicy Bypass -File $winswGenerator -InstallRoot $InstallRoot -OutputDir "$InstallRoot\winsw-generated"
      if ($LASTEXITCODE -ne 0) {
        throw "WinSW config generation failed with exit code $LASTEXITCODE"
      }
    }
  }

  $installServicesScript = Join-Path $InstallRoot "installer\install-services.ps1"
  Invoke-InstallStep -StepName 'Install Windows services' -Action {
    if (Test-Path $installServicesScript) {
      powershell -ExecutionPolicy Bypass -File $installServicesScript -InstallRoot $InstallRoot
      if ($LASTEXITCODE -ne 0) {
        throw "Service installation failed with exit code $LASTEXITCODE"
      }
    }
  }

  Invoke-InstallStep -StepName 'Backend health check' -Action {
    Wait-ForHttpHealth -Url 'http://127.0.0.1:4000/system/health'
  }

  Invoke-InstallStep -StepName 'Admin dashboard availability' -Action {
    Wait-ForHttpPage -Url "http://127.0.0.1:3004"
  }

  Invoke-InstallStep -StepName 'Admin login verification' -Action {
    Assert-AdminLoginWorks
  }

  Invoke-InstallStep -StepName 'Persist installation secrets' -Action {
    Save-InstallSecrets -Secrets $script:installSecrets
  }

  Invoke-InstallStep -StepName 'Create admin shortcut' -Action {
    Create-AdminShortcut -DetectedIp $ServerIp
  }

  Write-InstallLog -Step 'Post-install bootstrap' -Status 'SUCCESS' -Message 'Installation completed successfully.'
  Write-Host "Post-install bootstrap completed." -ForegroundColor Green
  Write-Host "Restaurant Server is installed, initialized, and services were started." -ForegroundColor Green
  Write-Host "Admin login details saved to $(Get-ManifestPath)" -ForegroundColor Yellow
} catch {
  Write-InstallLog -Step 'Post-install bootstrap' -Status 'FAILURE' -Message $_.Exception.Message
  throw
}
