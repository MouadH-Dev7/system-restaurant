import { AdminShell } from '@/components/admin/admin-shell';
import { MonitoringScreen } from '@/components/admin/monitoring-screen';

export default function MonitoringPage() {
  return (
    <AdminShell activeScreen="monitoring">
      <MonitoringScreen />
    </AdminShell>
  );
}
