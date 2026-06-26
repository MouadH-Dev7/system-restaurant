$serviceNames = @(
  "RestaurantBackend",
  "RestaurantCustomerApp",
  "RestaurantPosApp",
  "RestaurantKitchenApp",
  "RestaurantAdminApp",
  "RestaurantWaiterApp",
  "RestaurantNginx"
)

$serviceNames | ForEach-Object {
  Get-Service -Name $_ -ErrorAction SilentlyContinue |
    Select-Object Name, Status, StartType
}
