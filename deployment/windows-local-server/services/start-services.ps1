$serviceNames = @(
  "RestaurantBackend",
  "RestaurantCustomerApp",
  "RestaurantPosApp",
  "RestaurantKitchenApp",
  "RestaurantAdminApp",
  "RestaurantWaiterApp",
  "RestaurantNginx"
)

foreach ($serviceName in $serviceNames) {
  $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($null -eq $service) {
    Write-Host "Service not found: $serviceName" -ForegroundColor Yellow
    continue
  }

  if ($service.Status -ne 'Running') {
    Start-Service -Name $serviceName
    Write-Host "Started: $serviceName" -ForegroundColor Green
  } else {
    Write-Host "Already running: $serviceName" -ForegroundColor Cyan
  }
}
