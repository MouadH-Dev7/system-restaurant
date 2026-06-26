import { OrderConfirmation } from '@/components/order-confirmation';
import { parseOrderContext } from '@/lib/order-context';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const context = parseOrderContext(resolvedSearchParams);
  return (
    <OrderConfirmation
      orderId={firstValue(resolvedSearchParams.orderId) ?? null}
      initialContext={context}
    />
  );
}
