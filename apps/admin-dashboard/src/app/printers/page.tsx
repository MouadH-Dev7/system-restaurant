import { AdminShell } from '@/components/admin/admin-shell';
import { PrintersScreen } from '@/components/admin/printers-screen';

export default function PrintersPage() {
  return (
    <AdminShell activeScreen="printers">
      <PrintersScreen />
    </AdminShell>
  );
}
