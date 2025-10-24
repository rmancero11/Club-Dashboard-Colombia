export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient'; 

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main style={{display:'grid',placeItems:'center',minHeight:'100vh',fontFamily:'system-ui, Arial'}}>
          <p>Cargando…</p>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
