'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('Erro na autenticação:', error);
          router.push('/auth/login?error=oauth_failed');
          return;
        }

        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!clientData) {
          const { error: insertError } = await supabase
            .from('clients')
            .insert([
              {
                user_id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email,
                email: session.user.email,
                avatar_url: session.user.user_metadata?.avatar_url || null,
              },
            ]);

          if (insertError) {
            console.error('Erro ao criar cliente:', insertError);
          }
        }

        router.push('/vendors/dashboard');
      } catch (err) {
        console.error('Erro no callback:', err);
        router.push('/auth/login?error=callback_error');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Finalizando autenticação...</p>
      </div>
    </div>
  );
}