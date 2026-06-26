param(
  [string]$InstallRoot = "C:\RestaurantServer",
  [string]$PostgresPassword,
  [string]$PostgresPort = "5432",
  [string]$PostgresDataDir = "C:\pgsql-data-utf8",
  [string]$PostgresServiceName = "",
  [string]$PostgresInstallDir = ""
)

$postgresInstaller = Join-Path $InstallRoot "runtime\postgres\postgresql-installer.exe"
$memuraiInstaller = Join-Path $InstallRoot "runtime\redis\Memurai-Developer.msi"
$pwDir = Join-Path $InstallRoot "data\postgres-bootstrap"
$pwFile = Join-Path $pwDir "pw.txt"
$postgresBinRoot = $null
$pgCtl = $null
$psql = $null
$createdb = $null
$initdb = $null

$ErrorActionPreference = 'Stop'

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Ensure-FirewallPort([int]$Port) {
  $ruleName = "Restaurant App Port $Port"
  if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -Profile Any | Out-Null
  }
}

function Get-RequiredEnv([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Required environment value missing: $Name"
  }

  return $value.Trim()
}

function Resolve-PostgresInstallDir {
  if ($PostgresInstallDir -and (Test-Path $PostgresInstallDir)) {
    return $PostgresInstallDir
  }

  $uninstallKeys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
  )

  foreach ($key in $uninstallKeys) {
    $match = Get-ItemProperty -Path $key -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -like 'PostgreSQL*' -and $_.InstallLocation } |
      Sort-Object DisplayVersion -Descending |
      Select-Object -First 1

    if ($match -and (Test-Path (Join-Path $match.InstallLocation 'bin'))) {
      return $match.InstallLocation.TrimEnd('\')
    }
  }

  $defaultRoots = @(
    'C:\Program Files\PostgreSQL',
    'C:\Program Files (x86)\PostgreSQL'
  )

  foreach ($root in $defaultRoots) {
    if (-not (Test-Path $root)) {
      continue
    }

    $candidate = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
      Where-Object { Test-Path (Join-Path $_.FullName 'bin\pg_ctl.exe') } |
      Sort-Object Name -Descending |
      Select-Object -First 1

    if ($candidate) {
      return $candidate.FullName
    }
  }

  throw 'Could not resolve PostgreSQL installation directory.'
}

function Initialize-PostgresBinaries {
  $script:postgresBinRoot = Join-Path (Resolve-PostgresInstallDir) 'bin'
  $script:pgCtl = Join-Path $script:postgresBinRoot 'pg_ctl.exe'
  $script:psql = Join-Path $script:postgresBinRoot 'psql.exe'
  $script:createdb = Join-Path $script:postgresBinRoot 'createdb.exe'
  $script:initdb = Join-Path $script:postgresBinRoot 'initdb.exe'

  foreach ($path in @($script:pgCtl, $script:psql, $script:createdb, $script:initdb)) {
    if (-not (Test-Path $path)) {
      throw "PostgreSQL binary missing: $path"
    }
  }
}

function Resolve-PostgresServiceName {
  if ($PostgresServiceName -and (Get-Service -Name $PostgresServiceName -ErrorAction SilentlyContinue)) {
    return $PostgresServiceName
  }

  $service = Get-Service -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'postgresql*' -or $_.DisplayName -like 'PostgreSQL*' } |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if ($service) {
    return $service.Name
  }

  throw 'Could not resolve PostgreSQL Windows service.'
}

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

function Wait-ForTcpPort([string]$Host, [int]$Port, [int]$TimeoutSeconds = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $result = Test-NetConnection -ComputerName $Host -Port $Port -WarningAction SilentlyContinue
      if ($result.TcpTestSucceeded) {
        return
      }
    } catch {
    }

    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)

  throw "TCP port check failed for ${Host}:${Port}"
}

function Assert-PostgresConnection {
  $env:PGPASSWORD = $PostgresPassword
  try {
    & $psql -h 127.0.0.1 -p $PostgresPort -U postgres -d postgres -tAc "SELECT 1;" | Out-Null
    if ($LASTEXITCODE -ne 0) {
      throw "psql connectivity check failed with exit code $LASTEXITCODE"
    }
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Ensure-PostgresInstalled {
  if ($PostgresInstallDir -and (Test-Path (Join-Path $PostgresInstallDir 'bin\pg_ctl.exe'))) {
    Write-Host "PostgreSQL binaries already available." -ForegroundColor Green
    return
  }

  if (-not (Test-Path $postgresInstaller)) {
    throw "PostgreSQL installer not found: $postgresInstaller"
  }

  $arguments = @(
    '--mode', 'unattended',
    '--superpassword', $PostgresPassword,
    '--servicename', 'postgresql-restaurant',
    '--serverport', $PostgresPort,
    '--prefix', 'C:\Program Files\PostgreSQL',
    '--datadir', $PostgresDataDir
  )

  Write-Host "Installing PostgreSQL silently..." -ForegroundColor Cyan
  $process = Start-Process -FilePath $postgresInstaller -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
  if ($process.ExitCode -ne 0) {
    throw "PostgreSQL installer failed with exit code $($process.ExitCode)"
  }
}

function Ensure-PostgresCluster {
  Ensure-Directory $PostgresDataDir

  if (-not (Test-Path (Join-Path $PostgresDataDir 'postgresql.conf'))) {
    Ensure-Directory $pwDir
    Set-Content -Path $pwFile -Value $PostgresPassword -Encoding ASCII
    try {
      Write-Host "Initializing PostgreSQL UTF-8 cluster..." -ForegroundColor Cyan
      & $initdb -D $PostgresDataDir -U postgres -A scram-sha-256 --pwfile=$pwFile -E UTF8 --locale-provider=builtin --builtin-locale=C.UTF-8 | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "initdb failed with exit code $LASTEXITCODE"
      }
    } finally {
      Remove-Item $pwFile -Force -ErrorAction SilentlyContinue
    }
  }
}

function Ensure-PostgresRunning {
  $resolvedService = Resolve-PostgresServiceName
  $script:PostgresServiceName = $resolvedService

  if (Get-Service -Name $resolvedService -ErrorAction SilentlyContinue) {
    try {
      Set-Service -Name $resolvedService -StartupType Automatic
      Start-Service -Name $resolvedService -ErrorAction Stop
      Wait-ForServiceRunning -ServiceName $resolvedService
    } catch {
      throw "PostgreSQL service failed to start: $resolvedService. $($_.Exception.Message)"
    }
  } else {
    throw 'PostgreSQL service is missing after installation.'
  }

  Wait-ForTcpPort -Host '127.0.0.1' -Port ([int]$PostgresPort)
  Assert-PostgresConnection
}

function Ensure-RestaurantDatabase {
  $env:PGPASSWORD = $PostgresPassword
  try {
    $exists = (& $psql -h 127.0.0.1 -p $PostgresPort -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'restaurant_db';").Trim()
    if ($exists -ne '1') {
      & $createdb -h 127.0.0.1 -p $PostgresPort -U postgres restaurant_db | Out-Null
      if ($LASTEXITCODE -ne 0) {
        throw "createdb failed with exit code $LASTEXITCODE"
      }
    }
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Ensure-MemuraiInstalled {
  $memuraiService = Get-Service -Name 'Memurai' -ErrorAction SilentlyContinue
  if (-not $memuraiService) {
    if (-not (Test-Path $memuraiInstaller)) {
      throw "Memurai installer not found: $memuraiInstaller"
    }

    Write-Host "Installing Memurai silently..." -ForegroundColor Cyan
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList @('/i', "`"$memuraiInstaller`"", '/qn', '/norestart') -Wait -PassThru -WindowStyle Hidden
    if ($process.ExitCode -ne 0) {
      throw "Memurai installer failed with exit code $($process.ExitCode)"
    }
  }

  try {
    Set-Service -Name 'Memurai' -StartupType Automatic
    Start-Service -Name 'Memurai' -ErrorAction Stop
    Wait-ForServiceRunning -ServiceName 'Memurai'
    Wait-ForTcpPort -Host '127.0.0.1' -Port 6379
  } catch {
    throw "Memurai service failed to start. $($_.Exception.Message)"
  }
}

if (-not $PostgresPassword) {
  $PostgresPassword = Get-RequiredEnv 'RESTAURANT_POSTGRES_PASSWORD'
}

Ensure-PostgresInstalled
Initialize-PostgresBinaries
Ensure-PostgresCluster
Ensure-PostgresRunning
Ensure-RestaurantDatabase
Ensure-MemuraiInstalled

foreach ($port in 3001, 3002, 3003, 3004, 3005, 4000, 5432, 6379) {
  Ensure-FirewallPort -Port $port
}

Write-Host "Database and cache bootstrap completed." -ForegroundColor Green
