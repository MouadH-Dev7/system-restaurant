import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function ManageMenuPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="edit"
        initialSection="menus"
        lockWorkflowMode
        lockSection
        title="menu.manageMenuPageTitle"
        subtitle="menu.manageSectionSubtitle"
      />
    </AdminShell>
  );
}
