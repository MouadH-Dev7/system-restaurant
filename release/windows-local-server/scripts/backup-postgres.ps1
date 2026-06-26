param(
  [string]$PgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
  [string]$Database = "restaurant_db",
  [string]$Username = "postgres",
  [string]$Password = "123456",
  [string]$BackupDir = "C:\RestaurantServer\data\backups"
)

if (-not (Test-Path $PgDumpPath)) {
  throw "pg_dump was not found at: $PgDumpPath"
}

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = Join-Path $BackupDir "restaurant_db_$timestamp.backup"

$env:PGPASSWORD = $Password
try {
  & $PgDumpPath -U $Username -d $Database -F c -f $backupFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }
  Write-Host "Backup created: $backupFile" -ForegroundColor Green
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
