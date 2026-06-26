import { AdminShell } from '@/components/admin/admin-shell';
import { AnalyticsScreen } from '@/components/admin/analytics-screen';

export default function AnalyticsPage() {
  return (
    <AdminShell activeScreen="analytics">
      <AnalyticsScreen />
    </AdminShell>
  );
}
