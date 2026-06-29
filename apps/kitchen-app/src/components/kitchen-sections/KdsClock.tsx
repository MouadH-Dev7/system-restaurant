'use client';

import { useEffect, useState } from 'react';

function formatClock(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function KdsClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className="text-xl font-bold tracking-tight text-primary"
      style={{ fontFamily: 'var(--font-jetbrains)' }}
    >
      {mounted && now ? formatClock(now) : '--:--'}
    </span>
  );
}
