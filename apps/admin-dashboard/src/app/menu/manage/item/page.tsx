import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function ManageItemPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="edit"
        initialSection="items"
        lockWorkflowMode
        lockSection
        title="menu.manageItemPageTitle"
        subtitle="menu.manageSectionSubtitle"
      />
    </AdminShell>
  );
}
