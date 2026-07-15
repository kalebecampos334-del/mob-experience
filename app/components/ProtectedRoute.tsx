'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login' 
}: { 
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(redirectTo);
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [redirectTo, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return <>{children}</>;
}
