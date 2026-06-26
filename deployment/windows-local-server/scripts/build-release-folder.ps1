param(
  [string]$OutputDir = ".\release\windows-local-server"
)

$root = Resolve-Path "."
$target = Join-Path $root $OutputDir
$ErrorActionPreference = 'Stop'
$guardScript = Join-Path $root 'deployment\windows-local-server\scripts\prisma-guards.ps1'

if (-not (Test-Path $guardScript)) {
  throw "Prisma guard script not found: $guardScript"
}

. $guardScript
$appPayloadPath = Join-Path $target 'app-payload'

if (Test-Path $target) {
  Get-ChildItem $target | ForEach-Object {
    if ($_.Name -eq "app-payload") {
      # Keep app-payload
    } elseif ($_.Name -eq "runtime") {
      # Clean up only metadata files in runtime, keep the large binary folders
      Get-ChildItem $_.FullName | ForEach-Object {
        if ($_.PSIsContainer -and @("node", "pnpm", "postgres", "redis", "nginx", "winsw") -contains $_.Name) {
          # Keep binary folder
        } else {
          Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
      }
    } else {
      Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

New-Item -ItemType Directory -Path $target -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "config") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "scripts") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "docs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "nginx") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "services") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "winsw") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "winsw\templates") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "installer") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target "runtime") -Force | Out-Null

Copy-Item ".\deployment\windows-local-server\client.env.example" (Join-Path $target "config\client.env.example")
Copy-Item ".\deployment\windows-local-server\README.md" (Join-Path $target "docs\README.md")
Copy-Item ".\deployment\windows-local-server\FINAL-RELEASE-CHECKLIST.md" (Join-Path $target "docs\FINAL-RELEASE-CHECKLIST.md")
Copy-Item ".\deployment\windows-local-server\PAYLOAD-INSTRUCTIONS.md" (Join-Path $target "docs\PAYLOAD-INSTRUCTIONS.md")
Copy-Item ".\deployment\windows-local-server\BUILD-INSTALLER-STEPS.md" (Join-Path $target "docs\BUILD-INSTALLER-STEPS.md")
Copy-Item ".\deployment\windows-local-server\scripts\prepare-client-env.ps1" (Join-Path $target "scripts\prepare-client-env.ps1")
Copy-Item ".\deployment\windows-local-server\scripts\backup-postgres.ps1" (Join-Path $target "scripts\backup-postgres.ps1")
Copy-Item ".\deployment\windows-local-server\scripts\restore-postgres.ps1" (Join-Path $target "scripts\restore-postgres.ps1")
Copy-Item ".\deployment\windows-local-server\scripts\build-production-bundle.ps1" (Join-Path $target "scripts\build-production-bundle.ps1")
Copy-Item ".\deployment\windows-local-server\scripts\start-local-runtime.ps1" (Join-Path $target "scripts\start-local-runtime.ps1")
Copy-Item ".\deployment\windows-local-server\scripts\prisma-guards.ps1" (Join-Path $target "scripts\prisma-guards.ps1")
Copy-Item ".\deployment\windows-local-server\nginx\unified-local-server.conf" (Join-Path $target "nginx\unified-local-server.conf")
Copy-Item ".\deployment\windows-local-server\services\README.md" (Join-Path $target "services\README.md")
Copy-Item ".\deployment\windows-local-server\services\register-services.ps1" (Join-Path $target "services\register-services.ps1")
Copy-Item ".\deployment\windows-local-server\services\start-services.ps1" (Join-Path $target "services\start-services.ps1")
Copy-Item ".\deployment\windows-local-server\services\stop-services.ps1" (Join-Path $target "services\stop-services.ps1")
Copy-Item ".\deployment\windows-local-server\services\restart-services.ps1" (Join-Path $target "services\restart-services.ps1")
Copy-Item ".\deployment\windows-local-server\services\service-status.ps1" (Join-Path $target "services\service-status.ps1")
Copy-Item ".\deployment\windows-local-server\services\winsw\README.md" (Join-Path $target "winsw\README.md")
Copy-Item ".\deployment\windows-local-server\services\winsw\generate-winsw-configs.ps1" (Join-Path $target "winsw\generate-winsw-configs.ps1")
Copy-Item ".\deployment\windows-local-server\services\winsw\templates\restaurant-backend.xml" (Join-Path $target "winsw\templates\restaurant-backend.xml")
Copy-Item ".\deployment\windows-local-server\services\winsw\templates\restaurant-frontend.xml" (Join-Path $target "winsw\templates\restaurant-frontend.xml")
Copy-Item ".\deployment\windows-local-server\installer\README.md" (Join-Path $target "installer\README.md")
Copy-Item ".\deployment\windows-local-server\installer\postinstall.ps1" (Join-Path $target "installer\postinstall.ps1")
Copy-Item ".\deployment\windows-local-server\installer\restaurant-server.iss" (Join-Path $target "installer\restaurant-server.iss")
Copy-Item ".\deployment\windows-local-server\installer\validate-runtime.ps1" (Join-Path $target "installer\validate-runtime.ps1")
Copy-Item ".\deployment\windows-local-server\installer\install-services.ps1" (Join-Path $target "installer\install-services.ps1")
Copy-Item ".\deployment\windows-local-server\installer\install-database-and-cache.ps1" (Join-Path $target "installer\install-database-and-cache.ps1")
Copy-Item ".\deployment\windows-local-server\installer\build-setup.ps1" (Join-Path $target "installer\build-setup.ps1")

$runtimeSource = Join-Path $root 'deployment\windows-local-server\runtime'
$runtimeTarget = Join-Path $target 'runtime'

robocopy $runtimeSource $runtimeTarget /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if ($LastExitCode -ge 8) {
  throw 'Failed to copy runtime payload into release workspace.'
}

$notes = @"
This folder is a release workspace for the future Windows installer.

Still required before shipping to customers:
- production builds
- bundled Node runtime
- Windows service wrapper
- PostgreSQL silent installer
- Redis-compatible local service installer
- first-run bootstrap script
"@

Set-Content -Path (Join-Path $target "docs\NEXT-STEPS.txt") -Value $notes -Encoding UTF8

if (-not (Test-Path $appPayloadPath)) {
  Write-Error "Release gate failed: missing app-payload at $appPayloadPath"
  throw 'Release gate failed: app-payload folder is missing.'
}

Assert-PrismaClientGenerated -BasePath $appPayloadPath -Context 'Release Prisma gate'

Write-Host "Release workspace prepared at $target" -ForegroundColor Green
