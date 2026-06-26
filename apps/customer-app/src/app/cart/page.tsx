import { redirect } from 'next/navigation';
import { parseOrderContext } from '@/lib/order-context';
import { routes } from '@/lib/routes';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CartPage({ searchParams }: PageProps) {
  const context = parseOrderContext(await searchParams);
  redirect(routes.cart(context));
}
