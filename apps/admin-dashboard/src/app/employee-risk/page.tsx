import { AdminShell } from '@/components/admin/admin-shell';
import { EmployeeRiskScreen } from '@/components/admin/employee-risk-screen';

export default function EmployeeRiskPage() {
  return (
    <AdminShell activeScreen="employee-risk">
      <EmployeeRiskScreen />
    </AdminShell>
  );
}
