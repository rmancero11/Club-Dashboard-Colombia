'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTE_DASHBOARD_HOME, ROUTE_LOGIN } from './constants/routes';
import { useAuth } from './hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(`/${ROUTE_DASHBOARD_HOME}`);
    } else {
      router.push(ROUTE_LOGIN);
    }
  }, [user, router]);

  return null;
}
