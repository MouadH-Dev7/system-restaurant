import { AdminShell } from '@/components/admin/admin-shell';
import { ConsumptionLogsScreen } from '@/components/admin/consumption-logs-screen';

export default function ConsumptionLogsPage() {
  return (
    <AdminShell activeScreen="consumption-logs">
      <ConsumptionLogsScreen />
    </AdminShell>
  );
}
