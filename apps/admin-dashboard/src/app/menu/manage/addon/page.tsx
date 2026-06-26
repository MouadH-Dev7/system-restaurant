import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function ManageAddonPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="edit"
        initialSection="modifiers"
        lockWorkflowMode
        lockSection
        title="menu.manageAddonPageTitle"
        subtitle="menu.manageSectionSubtitle"
      />
    </AdminShell>
  );
}
