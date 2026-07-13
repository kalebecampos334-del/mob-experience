'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  avatar_url: string | null;
  email: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category, description, avatar_url, email')
        .eq('status', 'approved')
        .order('name');

      if (error) {
        console.error('Erro ao buscar vendors:', error);
      } else {
        setVendors(data || []);
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Nossos Vendors</h1>
        <p className="text-gray-600 mb-12">Encontre profissionais incríveis para seu evento</p>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum vendor disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {vendor.avatar_url && (
                  <img
                    src={vendor.avatar_url}
                    alt={vendor.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                      {vendor.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{vendor.description}</p>
                  <Link
                    href={`/services?vendor=${vendor.id}`}
                    className="inline-block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ver Serviços
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}