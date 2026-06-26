import { AdminShell } from '@/components/admin/admin-shell';
import { ReportsScreen } from '@/components/admin/reports-screen';

export default function ReportsPage() {
  return (
    <AdminShell activeScreen="reports">
      <ReportsScreen />
    </AdminShell>
  );
}
