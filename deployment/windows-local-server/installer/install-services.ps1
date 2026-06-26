param(
  [string]$InstallRoot = "C:\RestaurantServer"
)

$winswExe = Join-Path $InstallRoot "runtime\winsw\WinSW-x64.exe"
$winswGenerated = Join-Path $InstallRoot "winsw-generated"
$ErrorActionPreference = 'Stop'

function Wait-ForServiceRunning([string]$ServiceName, [int]$TimeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
      return
    }

    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)

  throw "Service did not reach Running state: $ServiceName"
}

if (-not (Test-Path $winswGenerated)) {
  throw "WinSW generated config directory not found: $winswGenerated"
}

if (-not (Test-Path $winswExe)) {
  throw "WinSW executable not found: $winswExe"
}

$xmlFiles = Get-ChildItem -Path $winswGenerated -Filter *.xml
foreach ($xmlFile in $xmlFiles) {
  $serviceBaseName = [System.IO.Path]::GetFileNameWithoutExtension($xmlFile.Name)
  $serviceExePath = Join-Path $winswGenerated "$serviceBaseName.exe"
  $serviceXmlPath = Join-Path $winswGenerated "$serviceBaseName.xml"

  Copy-Item -Path $winswExe -Destination $serviceExePath -Force

  if ($xmlFile.FullName -ne $serviceXmlPath) {
    Copy-Item -Path $xmlFile.FullName -Destination $serviceXmlPath -Force
  }

  Write-Host "Prepared WinSW wrapper for $serviceBaseName" -ForegroundColor Green

  & $serviceExePath stop 2>$null | Out-Null
  & $serviceExePath uninstall 2>$null | Out-Null
  & $serviceExePath install | Out-Null
  & $serviceExePath start | Out-Null
  Wait-ForServiceRunning -ServiceName $serviceBaseName

  Write-Host "Installed and started $serviceBaseName" -ForegroundColor Cyan
}
