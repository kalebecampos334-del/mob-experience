'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface Application {
  id: string;
  full_name: string;
  user_email: string;
  category: string;
  bio: string;
  document_url: string | null;
  status: string;
}

export default function AdminVendorsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('status', 'pending');

      setApplications(data || []);
      setLoading(false);
    };

    fetchApplications();
  }, [router]);

async function handleApprove(app: any) {
  try {
    // 1. Criar conta em auth.users
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: app.user_email,
      password: app.password_hash,
      email_confirm: true
    });

    if (authError) {
      alert(`Erro: ${authError.message}`);
      return;
    }

    // 2. Criar vendor
    await supabase.from('vendors').insert({
      user_id: newUser.user.id,
      name: app.full_name,
      email: app.user_email,
      phone: app.phone,
      description: app.bio,
      category: app.category,
      status: 'approved',
      approved_at: new Date()
    });

    // 3. Atualizar status da aplicação
    await supabase
      .from('vendor_applications')
      .update({ status: 'approved' })
      .eq('id', app.id);

    alert('✅ Vendor aprovado!');
    setApplications(applications.filter(a => a.id !== app.id));
  } catch (err) {
    alert('Erro ao aprovar vendor');
  }
}

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-8">Gerenciar Vendors</h1>

        {applications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600">Nenhuma aplicação pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold">{app.full_name}</h3>
                <p className="text-gray-600">{app.user_email}</p>
                <p className="text-gray-600">Categoria: {app.category}</p>
                <p className="mt-2">{app.bio}</p>

                {app.document_url && (
                  <a href={app.document_url} target="_blank" className="text-blue-600 block mt-2">
                    📄 Ver Documento
                  </a>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleApprove(app)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(app)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
