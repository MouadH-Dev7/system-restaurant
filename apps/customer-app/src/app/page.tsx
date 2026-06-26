import { LanguageSelector } from '@/components/language-selector';
import { parseOrderContext } from '@/lib/order-context';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const context = parseOrderContext(await searchParams);
  return <LanguageSelector initialContext={context} />;
}
