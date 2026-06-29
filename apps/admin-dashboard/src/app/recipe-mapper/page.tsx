import { AdminShell } from '@/components/admin/admin-shell';
import { RecipeMapperScreen } from '@/components/admin/recipe-mapper-screen';

export default function RecipeMapperPage() {
  return (
    <AdminShell activeScreen="recipe-mapper">
      <RecipeMapperScreen />
    </AdminShell>
  );
}
