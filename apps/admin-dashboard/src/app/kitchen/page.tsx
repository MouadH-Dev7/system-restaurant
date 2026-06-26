import { AdminShell } from '@/components/admin/admin-shell';
import { KitchenScreen } from '@/components/admin/kitchen-screen';

export default function KitchenPage() {
  return (
    <AdminShell activeScreen="kitchen">
      <KitchenScreen />
    </AdminShell>
  );
}
