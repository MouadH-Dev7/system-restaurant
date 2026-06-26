import { AdminShell } from '@/components/admin/admin-shell';
import { DashboardScreen } from '@/components/admin/dashboard-screen';

export default function Page() {
  return (
    <AdminShell activeScreen="dashboard">
      <DashboardScreen />
    </AdminShell>
  );
}
