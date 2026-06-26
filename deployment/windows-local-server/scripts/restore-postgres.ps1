param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,

  [string]$PgRestorePath = "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe",
  [string]$Database = "restaurant_db",
  [string]$Username = "postgres",
  [string]$Password = "123456"
)

if (-not (Test-Path $PgRestorePath)) {
  throw "pg_restore was not found at: $PgRestorePath"
}

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$env:PGPASSWORD = $Password
try {
  & $PgRestorePath -U $Username -d $Database --clean --if-exists $BackupFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed with exit code $LASTEXITCODE"
  }
  Write-Host "Restore completed from: $BackupFile" -ForegroundColor Green
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
