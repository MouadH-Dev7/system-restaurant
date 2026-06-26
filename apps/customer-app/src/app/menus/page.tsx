import { MenuSelection } from '@/components/menu-selection';
import { parseOrderContext } from '@/lib/order-context';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MenusPage({ searchParams }: PageProps) {
  const context = parseOrderContext(await searchParams);
  return <MenuSelection initialContext={context} />;
}
