import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function AddMenuPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="add"
        initialSection="menus"
        lockWorkflowMode
        lockSection
        title="menu.addMenuPageTitle"
        subtitle="menu.addSectionSubtitle"
      />
    </AdminShell>
  );
}
