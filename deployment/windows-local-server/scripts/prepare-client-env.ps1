param(
  [Parameter(Mandatory = $true)]
  [string]$ServerIp,

  [string]$OutputFile = ".\\deployment\\windows-local-server\\client.env"
)

$baseUrl = "http://$ServerIp"
$corsOrigins = @(
  $baseUrl,
  "$baseUrl:3001",
  "$baseUrl:3002",
  "$baseUrl:3003",
  "$baseUrl:3004",
  "$baseUrl:3005"
) -join ','

$content = @"
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
SERVER_IP=$ServerIp
PUBLIC_BASE_URL=$baseUrl
CUSTOMER_APP_URL=$baseUrl
NEXT_PUBLIC_SOCKET_URL=$baseUrl
CORS_ORIGIN=$corsOrigins
DATABASE_URL=postgresql://postgres:{GENERATED_AT_INSTALL}@127.0.0.1:5432/restaurant_db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET={GENERATED_AT_INSTALL}
JWT_REFRESH_SECRET={GENERATED_AT_INSTALL}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CUSTOMER_BASE_PATH=
POS_BASE_PATH=/pos
KITCHEN_BASE_PATH=/kitchen
ADMIN_BASE_PATH=/admin
WAITER_BASE_PATH=/waiter
"@

$targetDir = Split-Path -Path $OutputFile -Parent
if ($targetDir -and -not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Set-Content -Path $OutputFile -Value $content -Encoding UTF8
Write-Host "Client env created at $OutputFile" -ForegroundColor Green
Write-Host "Server LAN URL: $baseUrl" -ForegroundColor Cyan
