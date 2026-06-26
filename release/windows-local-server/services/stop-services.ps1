$serviceNames = @(
  "RestaurantNginx",
  "RestaurantWaiterApp",
  "RestaurantAdminApp",
  "RestaurantKitchenApp",
  "RestaurantPosApp",
  "RestaurantCustomerApp",
  "RestaurantBackend"
)

foreach ($serviceName in $serviceNames) {
  $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($null -eq $service) {
    Write-Host "Service not found: $serviceName" -ForegroundColor Yellow
    continue
  }

  if ($service.Status -ne 'Stopped') {
    Stop-Service -Name $serviceName -Force
    Write-Host "Stopped: $serviceName" -ForegroundColor Green
  } else {
    Write-Host "Already stopped: $serviceName" -ForegroundColor Cyan
  }
}
