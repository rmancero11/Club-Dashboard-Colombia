'use client'

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTE_DASHBOARD_HOME, ROUTE_LOGIN } from './constants/routes';
import { useAuth } from './hooks/useAuth';

export default function Home() {
  const { user } = useAuth()
  useEffect(() => {
    if (user) {
      return redirect(`/${ROUTE_DASHBOARD_HOME}`);
    } else {
      return redirect(ROUTE_LOGIN)
    }
  }, [user]);
  return (
    null
  )
}
