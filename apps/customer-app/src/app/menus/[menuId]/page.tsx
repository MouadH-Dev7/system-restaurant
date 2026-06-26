import { redirect } from 'next/navigation';
import { parseOrderContext } from '@/lib/order-context';
import { routes } from '@/lib/routes';

type PageProps = {
  params: Promise<{ menuId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MenuItemsPage({ params, searchParams }: PageProps) {
  const { menuId } = await params;
  const context = parseOrderContext(await searchParams);
  redirect(routes.menuItems(menuId, context));
}
