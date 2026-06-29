import { AdminShell } from '@/components/admin/admin-shell';
import { SuppliersScreen } from '@/components/admin/suppliers-screen';

export default function SuppliersPage() {
  return (
    <AdminShell activeScreen="suppliers">
      <SuppliersScreen />
    </AdminShell>
  );
}
