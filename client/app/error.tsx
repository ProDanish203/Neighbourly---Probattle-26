'use client';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const NotFoundPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold mb-2 text-destructive">Error</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Something went wrong. Let's get you back to the homepage.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-600/80 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
          <Link
            href="/"
            className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        If you believe this is a mistake, please contact our support team.
      </footer>
    </div>
  );
};

export default NotFoundPage;
