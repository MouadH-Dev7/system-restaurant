param(
  [string]$OutputDir = ".\release\windows-local-server\runtime"
)

$root = Resolve-Path "."
$target = Join-Path $root $OutputDir
$sourceRoot = Join-Path $root "deployment\windows-local-server\runtime"

$folders = @(
  "node",
  "pnpm",
  "winsw",
  "nginx",
  "postgres",
  "redis"
)

if (-not (Test-Path $target)) {
  New-Item -ItemType Directory -Path $target -Force | Out-Null
}

foreach ($folder in $folders) {
  $path = Join-Path $target $folder
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

foreach ($fileName in @("install-manifest.json", "layout.json", "prepare-runtime-folders.ps1", "README.md", "RUNTIME-STATUS.md")) {
  $sourceFile = Join-Path $sourceRoot $fileName
  if (Test-Path $sourceFile) {
    Copy-Item -Path $sourceFile -Destination (Join-Path $target $fileName) -Force
  }
}

foreach ($folder in $folders) {
  $sourcePath = Join-Path $sourceRoot $folder
  $targetPath = Join-Path $target $folder

  if (Test-Path $sourcePath) {
    robocopy $sourcePath $targetPath /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
    if ($LastExitCode -ge 8) {
      throw "Failed to copy runtime payload folder: $folder"
    }
  }

  $placeholder = Join-Path $targetPath ".keep"
  if (-not (Test-Path $placeholder)) {
    Set-Content -Path $placeholder -Value "Place runtime payload files here." -Encoding UTF8
  }
}

Write-Host "Runtime payload folders prepared at $target" -ForegroundColor Green
