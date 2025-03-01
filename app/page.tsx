export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
        BlockSwarms - AI Powered Solana Trading
      </h1>
      <p style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        The ultimate platform for Solana token analysis, trading signals, and portfolio management.
      </p>
      <div>
        <a href="/api/health" style={{ 
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.25rem',
          fontWeight: 'bold'
        }}>
          Check API Status
        </a>
      </div>
    </div>
  );
}