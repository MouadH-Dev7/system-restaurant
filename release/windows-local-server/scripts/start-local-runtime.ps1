param(
  [string]$ServerIp = "127.0.0.1",
  [string]$LogDir = ".\release\windows-local-server\runtime-logs"
)

$root = Resolve-Path "."
$logRoot = Join-Path $root $LogDir
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

function Start-AppProcess {
  param(
    [string]$Name,
    [string]$Workdir,
    [string]$Command,
    [hashtable]$EnvVars
  )

  $envAssignments = ($EnvVars.GetEnumerator() | ForEach-Object { "`$env:$($_.Key)='$($_.Value)'" }) -join '; '
  $fullCommand = "$envAssignments; $Command"
  $outFile = Join-Path $logRoot "$Name.log"
  $errFile = Join-Path $logRoot "$Name.error.log"

  Start-Process powershell -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $fullCommand
  ) -WorkingDirectory $Workdir -RedirectStandardOutput $outFile -RedirectStandardError $errFile -WindowStyle Hidden
}

$commonEnv = @{
  NODE_ENV = 'production'
  NEXT_PUBLIC_API_URL = '/api'
  NEXT_PUBLIC_SOCKET_URL = "http://$ServerIp"
  API_INTERNAL_URL = 'http://127.0.0.1:4000'
}

Start-AppProcess -Name "backend" -Workdir "$root\backend" -Command "pnpm start" -EnvVars @{
  NODE_ENV = 'production'
  HOST = '0.0.0.0'
  PORT = '4000'
  DATABASE_URL = 'postgresql://postgres:{LOCAL_DEV_ONLY_OVERRIDE}@127.0.0.1:5432/restaurant_db'
  REDIS_URL = 'redis://127.0.0.1:6379'
  CUSTOMER_APP_URL = "http://$ServerIp"
  NEXT_PUBLIC_SOCKET_URL = "http://$ServerIp"
  CORS_ORIGIN = "http://$ServerIp,http://$ServerIp:3001,http://$ServerIp:3002,http://$ServerIp:3003,http://$ServerIp:3004,http://$ServerIp:3005"
  JWT_SECRET = '{LOCAL_DEV_ONLY_OVERRIDE}'
  JWT_REFRESH_SECRET = '{LOCAL_DEV_ONLY_OVERRIDE}'
  JWT_EXPIRES_IN = '15m'
  JWT_REFRESH_EXPIRES_IN = '30d'
}

Start-AppProcess -Name "customer-app" -Workdir "$root\apps\customer-app" -Command "pnpm start" -EnvVars ($commonEnv + @{ NEXT_PUBLIC_BASE_PATH = '' })
Start-AppProcess -Name "pos-app" -Workdir "$root\apps\pos-app" -Command "pnpm start" -EnvVars ($commonEnv + @{ NEXT_PUBLIC_BASE_PATH = '/pos' })
Start-AppProcess -Name "kitchen-app" -Workdir "$root\apps\kitchen-app" -Command "pnpm start" -EnvVars ($commonEnv + @{ NEXT_PUBLIC_BASE_PATH = '/kitchen' })
Start-AppProcess -Name "admin-dashboard" -Workdir "$root\apps\admin-dashboard" -Command "pnpm start" -EnvVars ($commonEnv + @{ NEXT_PUBLIC_BASE_PATH = '/admin' })
Start-AppProcess -Name "waiter-app" -Workdir "$root\apps\waiter-app" -Command "pnpm start" -EnvVars ($commonEnv + @{ NEXT_PUBLIC_BASE_PATH = '/waiter' })

Write-Host "Local production runtime processes started." -ForegroundColor Green
Write-Host "Logs: $logRoot" -ForegroundColor Cyan
Write-Host "Note: final installer phase will replace this with managed Windows services." -ForegroundColor Yellow
