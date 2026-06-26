import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function AddAddonPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="add"
        initialSection="modifiers"
        lockWorkflowMode
        lockSection
        title="menu.addAddonPageTitle"
        subtitle="menu.addSectionSubtitle"
      />
    </AdminShell>
  );
}
