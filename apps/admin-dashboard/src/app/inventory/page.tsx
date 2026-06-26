import { AdminShell } from '@/components/admin/admin-shell';
import { InventoryScreen } from '@/components/admin/inventory-screen';

export default function InventoryPage() {
  return (
    <AdminShell activeScreen="inventory">
      <InventoryScreen />
    </AdminShell>
  );
}
