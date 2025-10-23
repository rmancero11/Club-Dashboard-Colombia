export default function Home() {
  return (
    <main style={{display:'grid',placeItems:'center',minHeight:'100vh',fontFamily:'system-ui, Arial'}}>
      <div>
        <h1 style={{marginBottom:8}}>Home</h1>
        <p style={{opacity:.8}}>Página raíz temporal. Si ves esto, / funciona.</p>
        <a href="/login" style={{textDecoration:'underline'}}>Ir a /login</a>
      </div>
    </main>
  );
}
