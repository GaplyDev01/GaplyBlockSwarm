import Link from 'next/link';

export default function NotFound() {
  return (    <div className="min-h-screen flex flex-col items-center justify-center bg-sapphire-900 text-emerald-400 p-4">    
        <h1 className="text-5xl md:text-6xl font-cyber text-emerald-400 mb-6">404</h1>    <h2 className="text-2xl md:text-3xl font-cyber mb-4">Page Not Found</h2>    <p className="mb-8 text-lg text-center max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>    <Link 
        href="/"
        className="px-6 py-3 bg-emerald-500 text-sapphire-900 font-cyber rounded-md hover:bg-emerald-400 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}