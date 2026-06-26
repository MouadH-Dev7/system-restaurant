param(
  [string]$OutputDir = ".\release\windows-local-server\app-payload"
)

$root = Resolve-Path "."
$target = Join-Path $root $OutputDir
$ErrorActionPreference = 'Stop'
$guardScript = Join-Path $root 'deployment\windows-local-server\scripts\prisma-guards.ps1'

if (-not (Test-Path $guardScript)) {
  throw "Prisma guard script not found: $guardScript"
}

. $guardScript

Assert-PrismaClientGenerated -BasePath $root -Context 'Source build Prisma gate'

if (Test-Path $target) {
  # Avoid locks or issues: use robocopy to empty first or standard force delete
  Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $target -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "apps") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "backend") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "packages") -Force | Out-Null

Copy-Item ".\package.json" (Join-Path $target "package.json") -Force
Copy-Item ".\pnpm-workspace.yaml" (Join-Path $target "pnpm-workspace.yaml") -Force
Copy-Item ".\pnpm-lock.yaml" (Join-Path $target "pnpm-lock.yaml") -Force


$apps = @(
  "customer-app",
  "pos-app",
  "kitchen-app",
  "admin-dashboard",
  "waiter-app"
)

foreach ($app in $apps) {
  $appSource = Join-Path ".\apps" $app
  $appTarget = Join-Path (Join-Path $target "apps") $app
  New-Item -ItemType Directory -Path $appTarget -Force | Out-Null

  foreach ($entry in @(".next", "public", "package.json", "next.config.ts")) {
    $sourcePath = Join-Path $appSource $entry
    if (Test-Path $sourcePath) {
      if (Test-Path -Path $sourcePath -PathType Container) {
        robocopy $sourcePath (Join-Path $appTarget $entry) /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD "node_modules"
        if ($LastExitCode -lt 8) { $global:LASTEXITCODE = 0 }
      } else {
        Copy-Item $sourcePath (Join-Path $appTarget $entry) -Force
      }
    }
  }
}

foreach ($entry in @("dist", "prisma", "package.json", ".env", ".env.example")) {
  $sourcePath = Join-Path ".\backend" $entry
  if (Test-Path $sourcePath) {
    $backendTarget = Join-Path (Join-Path $target "backend") $entry
    if (Test-Path -Path $sourcePath -PathType Container) {
      robocopy $sourcePath $backendTarget /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD "node_modules"
      if ($LastExitCode -lt 8) { $global:LASTEXITCODE = 0 }
    } else {
      Copy-Item $sourcePath $backendTarget -Force
    }
  }
}

foreach ($pkg in @("shared-types", "ui", "eslint-config", "ts-config")) {
  $pkgSource = Join-Path ".\packages" $pkg
  if (Test-Path $pkgSource) {
    $pkgTarget = Join-Path (Join-Path $target "packages") $pkg
    New-Item -ItemType Directory -Path $pkgTarget -Force | Out-Null
    robocopy $pkgSource $pkgTarget /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP /XD "node_modules" "dist" ".turbo"
    if ($LastExitCode -lt 8) { $global:LASTEXITCODE = 0 }
  }
}

# Offline packaging path: Prisma artifacts must already exist in the source build.
# We install production dependencies into app-payload, then overlay the generated Prisma artifacts
# from the source backend so payload creation never depends on runtime engine downloads.
Write-Host "Installing production dependencies inside app-payload..." -ForegroundColor Cyan
Set-Content -Path (Join-Path $target ".npmrc") -Value "node-linker=hoisted`r`nshamefully-hoist=true" -Encoding UTF8
Push-Location $target
try {
  & pnpm install --prod --no-frozen-lockfile
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'pnpm install --prod failed inside app-payload.'
    throw 'Failed to install production dependencies inside app-payload.'
  }
} finally {
  Pop-Location
}

$sourceBackendNodeModules = Join-Path $root 'backend\node_modules'
$targetBackendNodeModules = Join-Path $target 'backend\node_modules'
$sourceGeneratedPrismaDir = Get-PrismaGeneratedClientDirectory -BasePath $root
$targetGeneratedPrismaDir = Join-Path $targetBackendNodeModules '.prisma\client'

New-Item -ItemType Directory -Path $targetBackendNodeModules -Force | Out-Null
New-Item -ItemType Directory -Path $targetGeneratedPrismaDir -Force | Out-Null

robocopy (Join-Path $sourceBackendNodeModules '@prisma') (Join-Path $targetBackendNodeModules '@prisma') /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if ($LastExitCode -ge 8) {
  throw 'Failed to copy @prisma package into app-payload backend node_modules.'
}

robocopy (Join-Path $sourceBackendNodeModules 'prisma') (Join-Path $targetBackendNodeModules 'prisma') /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if ($LastExitCode -ge 8) {
  throw 'Failed to copy prisma CLI into app-payload backend node_modules.'
}

robocopy $sourceGeneratedPrismaDir $targetGeneratedPrismaDir /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if ($LastExitCode -ge 8) {
  throw 'Failed to copy generated Prisma artifacts into app-payload backend node_modules.'
}

Assert-PrismaClientGenerated -BasePath $target -Context 'App payload Prisma gate'

Write-Host "Application payload prepared at $target" -ForegroundColor Green
