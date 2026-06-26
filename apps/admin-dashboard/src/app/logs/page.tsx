import { AdminShell } from '@/components/admin/admin-shell';
import { LogsScreen } from '@/components/admin/logs-screen';

export default function LogsPage() {
  return (
    <AdminShell activeScreen="logs">
      <LogsScreen />
    </AdminShell>
  );
}
