param(
  [string]$InstallRoot = "C:\RestaurantServer",
  [string]$OutputDir = ".\release\windows-local-server\winsw"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir "..\..\..")
$target = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $root $OutputDir
}
$templateDir = Join-Path $scriptDir "templates"

New-Item -ItemType Directory -Path $target -Force | Out-Null

$nodeExe = "$InstallRoot\runtime\node\node.exe"
$nextBin = "$InstallRoot\node_modules\next\dist\bin\next"

$services = @(
  @{
    Template = "restaurant-backend.xml"
    Output = "RestaurantBackend.xml"
    Id = "RestaurantBackend"
    Name = "Restaurant Backend"
    Description = "Restaurant backend API service"
    WorkDir = "$InstallRoot\backend"
    LogDir = "$InstallRoot\logs\backend"
    Command = $nodeExe
    Arguments = "dist/main.js"
  },
  @{
    Template = "restaurant-frontend.xml"
    Output = "RestaurantCustomerApp.xml"
    Id = "RestaurantCustomerApp"
    Name = "Restaurant Customer App"
    Description = "Restaurant customer web app"
    WorkDir = "$InstallRoot\apps\customer-app"
    LogDir = "$InstallRoot\logs\customer-app"
    Command = $nodeExe
    Arguments = "$nextBin start -H 0.0.0.0 -p 3001"
  },
  @{
    Template = "restaurant-frontend.xml"
    Output = "RestaurantPosApp.xml"
    Id = "RestaurantPosApp"
    Name = "Restaurant POS App"
    Description = "Restaurant POS web app"
    WorkDir = "$InstallRoot\apps\pos-app"
    LogDir = "$InstallRoot\logs\pos-app"
    Command = $nodeExe
    Arguments = "$nextBin start -H 0.0.0.0 -p 3002"
  },
  @{
    Template = "restaurant-frontend.xml"
    Output = "RestaurantKitchenApp.xml"
    Id = "RestaurantKitchenApp"
    Name = "Restaurant Kitchen App"
    Description = "Restaurant kitchen web app"
    WorkDir = "$InstallRoot\apps\kitchen-app"
    LogDir = "$InstallRoot\logs\kitchen-app"
    Command = $nodeExe
    Arguments = "$nextBin start -H 0.0.0.0 -p 3003"
  },
  @{
    Template = "restaurant-frontend.xml"
    Output = "RestaurantAdminApp.xml"
    Id = "RestaurantAdminApp"
    Name = "Restaurant Admin App"
    Description = "Restaurant admin dashboard"
    WorkDir = "$InstallRoot\apps\admin-dashboard"
    LogDir = "$InstallRoot\logs\admin-dashboard"
    Command = $nodeExe
    Arguments = "$nextBin start -H 0.0.0.0 -p 3004"
  },
  @{
    Template = "restaurant-frontend.xml"
    Output = "RestaurantWaiterApp.xml"
    Id = "RestaurantWaiterApp"
    Name = "Restaurant Waiter App"
    Description = "Restaurant waiter app"
    WorkDir = "$InstallRoot\apps\waiter-app"
    LogDir = "$InstallRoot\logs\waiter-app"
    Command = $nodeExe
    Arguments = "$nextBin start -H 0.0.0.0 -p 3005"
  }
)

foreach ($service in $services) {
  $templatePath = Join-Path $templateDir $service.Template
  $content = Get-Content -Path $templatePath -Raw
  $content = $content.Replace("__SERVICE_ID__", $service.Id)
  $content = $content.Replace("__SERVICE_NAME__", $service.Name)
  $content = $content.Replace("__SERVICE_DESCRIPTION__", $service.Description)
  $content = $content.Replace("__EXECUTABLE__", $service.Command)
  $content = $content.Replace("__ARGUMENTS__", $service.Arguments)
  $content = $content.Replace("__WORKDIR__", $service.WorkDir)
  $content = $content.Replace("__LOGDIR__", $service.LogDir)

  Set-Content -Path (Join-Path $target $service.Output) -Value $content -Encoding UTF8
}

Write-Host "WinSW XML files generated in $target" -ForegroundColor Green
