param(
  [string]$IsccPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
  [string]$IssFile = "C:\Users\mouad\Desktop\system restaurant\release\windows-local-server\installer\restaurant-server.iss"
)

if (-not (Test-Path $IsccPath)) {
  throw "Inno Setup Compiler was not found at: $IsccPath"
}

if (-not (Test-Path $IssFile)) {
  throw "Installer script was not found at: $IssFile"
}

& $IsccPath $IssFile

if ($LASTEXITCODE -ne 0) {
  throw "ISCC failed with exit code $LASTEXITCODE"
}

Write-Host "Installer build completed." -ForegroundColor Green
