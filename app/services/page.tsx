'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  vendor_id: string;
  vendors: Array<{
    name: string;
    category: string;
  }>;
}
export default function ServicesPage() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor');
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      let query = supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, vendor_id, vendors(name, category)')
        .order('name');

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar serviços:', error);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    fetchServices();
  }, [vendorId]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {vendorId ? 'Serviços do Vendor' : 'Todos os Serviços'}
            </h1>
            <p className="text-gray-600">Escolha o serviço perfeito para seu evento</p>
          </div>
          {vendorId && (
            <Link
              href="/vendors"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Voltar para Vendors
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum serviço disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">
                {service.vendors[0].name} • {service.vendors[0].category}
                  </p>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                  
                  <div className="space-y-2 mb-4 pb-4 border-b">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço:</span>
                      <span className="font-bold text-lg text-blue-600">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                    {service.duration_minutes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duração:</span>
                        <span className="text-gray-900">{service.duration_minutes} min</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Agendar Serviço
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}