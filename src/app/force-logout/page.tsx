'use client';

import { useEffect, useState } from 'react';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ForceLogoutPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState('Menghapus sesi...');

  useEffect(() => {
    const performForceLogout = async () => {
      try {
        setMessage('Menghapus data login...');
        
        // Call force-logout API
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            await fetch('/api/auth/force-logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: user.id }),
            });
          } catch (e) {
            console.error('Failed to call force-logout API:', e);
          }
        }

        setMessage('Menghapus data lokal...');
        
        // Clear all session data
        localStorage.removeItem('user');
        sessionStorage.clear();
        localStorage.clear();

        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        });

        setMessage('Redirecting ke halaman login...');

        // Delay slightly to show processing message
        setTimeout(() => {
          window.location.replace('/login');
        }, 500);
      } catch (error) {
        console.error('Error during force logout:', error);
        setMessage('Terjadi kesalahan. Mengalihkan ke halaman login...');
        
        // Force redirect even if there's an error
        setTimeout(() => {
          window.location.replace('/login');
        }, 1000);
      }
    };

    performForceLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            {isProcessing ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Shield className="h-10 w-10 text-primary" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Force Logout</h1>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Semua sesi akan dihapus dan Anda akan dialihkan ke halaman login.
            </AlertDescription>
          </Alert>

          {!isProcessing && (
            <Button
              onClick={() => window.location.replace('/login')}
              className="w-full"
            >
              Kembali ke Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
