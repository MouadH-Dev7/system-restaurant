param(
  [string]$InstallRoot = "C:\RestaurantServer",
  [string]$NodeExe = "C:\RestaurantServer\runtime\node.exe",
  [string]$PnpmCmd = "C:\RestaurantServer\runtime\pnpm.cmd"
)

$services = @(
  @{
    Name = "RestaurantBackend"
    Workdir = "$InstallRoot\backend"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant Backend"
  },
  @{
    Name = "RestaurantCustomerApp"
    Workdir = "$InstallRoot\apps\customer-app"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant Customer App"
  },
  @{
    Name = "RestaurantPosApp"
    Workdir = "$InstallRoot\apps\pos-app"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant POS App"
  },
  @{
    Name = "RestaurantKitchenApp"
    Workdir = "$InstallRoot\apps\kitchen-app"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant Kitchen App"
  },
  @{
    Name = "RestaurantAdminApp"
    Workdir = "$InstallRoot\apps\admin-dashboard"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant Admin App"
  },
  @{
    Name = "RestaurantWaiterApp"
    Workdir = "$InstallRoot\apps\waiter-app"
    Command = "`"$PnpmCmd`" start"
    DisplayName = "Restaurant Waiter App"
  }
)

Write-Host "Windows service registration plan" -ForegroundColor Cyan
foreach ($service in $services) {
  Write-Host ""
  Write-Host "Service: $($service.Name)" -ForegroundColor Green
  Write-Host "Display: $($service.DisplayName)"
  Write-Host "Working directory: $($service.Workdir)"
  Write-Host "Command: $($service.Command)"
}

Write-Host ""
Write-Host "Next step: connect this script to NSSM or WinSW in the installer phase." -ForegroundColor Yellow
