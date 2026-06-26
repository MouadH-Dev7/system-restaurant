import { AdminShell } from '@/components/admin/admin-shell';
import { OrdersScreen } from '@/components/admin/orders-screen';

export default function OrdersPage() {
  return (
    <AdminShell activeScreen="orders">
      <OrdersScreen />
    </AdminShell>
  );
}
