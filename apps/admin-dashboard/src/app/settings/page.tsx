import { AdminShell } from '@/components/admin/admin-shell';
import { SettingsScreen } from '@/components/admin/settings-screen';

export default function SettingsPage() {
  return (
    <AdminShell activeScreen="settings">
      <SettingsScreen />
    </AdminShell>
  );
}
