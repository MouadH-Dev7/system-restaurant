param(
  [string]$InstallRoot = "C:\RestaurantServer",
  [string]$ManifestPath = "C:\RestaurantServer\runtime\install-manifest.json"
)

if (-not (Test-Path $ManifestPath)) {
  throw "Runtime manifest not found: $ManifestPath"
}

$manifest = Get-Content -Path $ManifestPath -Raw | ConvertFrom-Json
$results = @()

$manifest.runtime.PSObject.Properties | ForEach-Object {
  $name = $_.Name
  $item = $_.Value
  $fullPath = Join-Path $InstallRoot $item.path
  $exists = Test-Path $fullPath

  $results += [pscustomobject]@{
    Name = $name
    Required = [bool]$item.required
    Exists = $exists
    Path = $fullPath
  }
}

$results | Format-Table -AutoSize

$missingRequired = $results | Where-Object { $_.Required -and -not $_.Exists }
if ($missingRequired.Count -gt 0) {
  throw "Some required runtime files are missing."
}

Write-Host "Runtime validation passed." -ForegroundColor Green
