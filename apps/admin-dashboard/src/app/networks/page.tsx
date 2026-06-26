import { AdminShell } from '@/components/admin/admin-shell';
import { NetworksScreen } from '@/components/admin/networks-screen';

export default function NetworksPage() {
  return (
    <AdminShell activeScreen="networks">
      <NetworksScreen />
    </AdminShell>
  );
}
