import { AdminShell } from '@/components/admin/admin-shell';
import { MenuScreen } from '@/components/admin/menu-screen';

export default function AddItemPage() {
  return (
    <AdminShell activeScreen="menu">
      <MenuScreen
        initialWorkflowMode="add"
        initialSection="items"
        lockWorkflowMode
        lockSection
        title="menu.addItemPageTitle"
        subtitle="menu.addSectionSubtitle"
      />
    </AdminShell>
  );
}
