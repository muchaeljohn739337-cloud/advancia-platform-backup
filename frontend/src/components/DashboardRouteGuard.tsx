'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DashboardRouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router, isClient]);

  // During SSR or initial load, show loading
  if (!isClient || status === 'loading') {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
