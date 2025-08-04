import React, { useEffect, useState } from 'react';

interface VercelAuthHandlerProps {
  children: React.ReactNode;
}

export const VercelAuthHandler: React.FC<VercelAuthHandlerProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkVercelAuth = async () => {
      try {
        // Check if we're on a Vercel authentication page
        const currentUrl = window.location.href;
        if (currentUrl.includes('vercel.com/sso-api')) {
          // We're on the auth page, wait for redirect
          return;
        }

        // Check if we have a stored token
        const token = localStorage.getItem('vercel-auth-token');
        if (token) {
          setIsAuthenticated(true);
          return;
        }

        // Try to get auth token from Vercel
        const response = await fetch('/.well-known/vercel-user-meta', {
          method: 'GET',
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.token) {
            localStorage.setItem('vercel-auth-token', userData.token);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.log('Vercel auth check failed:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkVercelAuth();
  }, []);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              This application requires Vercel authentication to access the backend services.
            </p>
            <button
              onClick={() => {
                // Redirect to Vercel auth
                const currentUrl = encodeURIComponent(window.location.href);
                window.location.href = `https://vercel.com/sso-api?url=${currentUrl}`;
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Authenticate with Vercel
            </button>
            <p className="text-sm text-gray-500 mt-4">
              You'll be redirected back to the application after authentication.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, show the app
  return <>{children}</>;
}; 