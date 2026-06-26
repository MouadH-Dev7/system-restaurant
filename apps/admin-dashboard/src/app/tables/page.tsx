import { AdminShell } from '@/components/admin/admin-shell';
import { TablesScreen } from '@/components/admin/tables-screen';

export default function TablesPage() {
  return (
    <AdminShell activeScreen="tables">
      <TablesScreen />
    </AdminShell>
  );
}
