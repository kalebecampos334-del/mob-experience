'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export default function DashboardPage() {
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Busca dados do vendor
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setVendor(vendorData);

      // Busca serviços do vendor
      if (vendorData) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('vendor_id', vendorData.id);

        setServices(servicesData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard - {vendor?.name}</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h2 className="text-xl font-bold mb-6">Meus Serviços</h2>

          {services.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 mb-4">Você ainda não tem serviços cadastrados</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                + Adicionar Serviço
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {services.map(service => (
                <div key={service.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-bold">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                  <p className="font-bold text-lg mt-2">R$ {service.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
