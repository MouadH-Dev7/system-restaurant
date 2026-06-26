import { AdminShell } from '@/components/admin/admin-shell';
import { PaymentsScreen } from '@/components/admin/payments-screen';

export default function PaymentsPage() {
  return (
    <AdminShell activeScreen="payments">
      <PaymentsScreen />
    </AdminShell>
  );
}
