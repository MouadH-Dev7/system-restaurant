function Get-PrismaPackagePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  return Join-Path $BasePath 'backend\node_modules\@prisma\client'
}

function Resolve-PrismaPackageDirectory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  $packagePath = Get-PrismaPackagePath -BasePath $BasePath
  if (-not (Test-Path $packagePath)) {
    return $packagePath
  }

  $item = Get-Item -LiteralPath $packagePath -Force
  if ($item.Target) {
    return [string]$item.Target[0]
  }

  return $item.FullName
}

function Get-PrismaCliPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  return Join-Path $BasePath 'backend\node_modules\prisma'
}

function Get-PrismaSchemaPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  return Join-Path $BasePath 'backend\prisma\schema.prisma'
}

function Get-PrismaGeneratedClientPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  $packageDirectory = Resolve-PrismaPackageDirectory -BasePath $BasePath
  $prismaNodeModulesRoot = Split-Path (Split-Path $packageDirectory -Parent) -Parent
  return Join-Path $prismaNodeModulesRoot '.prisma\client\default.js'
}

function Get-PrismaQueryEnginePath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  $packageDirectory = Resolve-PrismaPackageDirectory -BasePath $BasePath
  $prismaNodeModulesRoot = Split-Path (Split-Path $packageDirectory -Parent) -Parent
  return Join-Path $prismaNodeModulesRoot '.prisma\client\query_engine-windows.dll.node'
}

function Get-PrismaGeneratedClientDirectory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath
  )

  return Split-Path (Get-PrismaGeneratedClientPath -BasePath $BasePath) -Parent
}

function Assert-PrismaClientGenerated {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BasePath,

    [string]$Context = 'Prisma verification'
  )

  $packagePath = Get-PrismaPackagePath -BasePath $BasePath
  $cliPath = Get-PrismaCliPath -BasePath $BasePath
  $schemaPath = Get-PrismaSchemaPath -BasePath $BasePath
  $generatedClientPath = Get-PrismaGeneratedClientPath -BasePath $BasePath
  $queryEnginePath = Get-PrismaQueryEnginePath -BasePath $BasePath

  if (-not (Test-Path $packagePath)) {
    Write-Error "$Context failed: missing Prisma package at $packagePath"
    throw "$Context failed: missing @prisma/client package."
  }

  if (-not (Test-Path $cliPath)) {
    Write-Error "$Context failed: missing Prisma CLI at $cliPath"
    throw "$Context failed: missing prisma CLI package."
  }

  if (-not (Test-Path $schemaPath)) {
    Write-Error "$Context failed: missing Prisma schema at $schemaPath"
    throw "$Context failed: missing schema.prisma."
  }

  if (-not (Test-Path $generatedClientPath)) {
    Write-Error "$Context failed: missing generated Prisma client at $generatedClientPath"
    throw "$Context failed: missing generated Prisma client default.js."
  }

  if (-not (Test-Path $queryEnginePath)) {
    Write-Error "$Context failed: missing Prisma query engine at $queryEnginePath"
    throw "$Context failed: missing Prisma query engine."
  }
}
