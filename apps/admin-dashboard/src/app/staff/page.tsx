import { AdminShell } from '@/components/admin/admin-shell';
import { StaffScreen } from '@/components/admin/staff-screen';

export default function StaffPage() {
  return (
    <AdminShell activeScreen="staff">
      <StaffScreen />
    </AdminShell>
  );
}
