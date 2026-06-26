import { AdminShell } from '@/components/admin/admin-shell';
import { DiscountsScreen } from '@/components/admin/discounts-screen';

export default function DiscountsPage() {
  return (
    <AdminShell activeScreen="discounts">
      <DiscountsScreen />
    </AdminShell>
  );
}
