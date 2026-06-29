'use client';

import { useEffect, useState } from 'react';
import { getElapsedMinutes } from '@/lib/order-utils';

export function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [minutes, setMinutes] = useState(1);

  useEffect(() => {
    setMounted(true);
    setMinutes(getElapsedMinutes(createdAt));

    const timer = window.setInterval(() => {
      setMinutes(getElapsedMinutes(createdAt));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [createdAt]);

  return <>{mounted ? `${minutes}m` : '--'}</>;
}
