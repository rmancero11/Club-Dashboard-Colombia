export const dynamic = 'force-dynamic'; // temporal, fuerza que Vercel pueda servir /login

export default function LoginPage() {
  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'100vh',fontFamily:'system-ui, Arial'}}>
      <div>
        <h1 style={{marginBottom:8}}>Login</h1>
        <p style={{opacity:.8}}>Página de login mínima para verificación.</p>
      </div>
    </main>
  );
}
