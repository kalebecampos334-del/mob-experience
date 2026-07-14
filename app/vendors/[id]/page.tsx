'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BookingForm from '@/app/bookings/components/BookingForm';

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  avatar_url: string | null;
  email: string;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  vendor_id: string;
}

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // Busca dados do vendor
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, name, category, description, avatar_url, email, phone')
          .eq('id', vendorId)
          .single();

        if (vendorData) {
          setVendor(vendorData);

          // Busca serviços do vendor
          const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('name');

          setServices(servicesData || []);
        }
      } catch (err) {
        console.error('Erro ao buscar vendor:', err);
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <p className="text-gray-600">Carregando perfil...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vendor não encontrado</p>
          <a href="/vendors" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Voltar para Vendors
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Perfil Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            {vendor.avatar_url && (
              <img
                src={vendor.avatar_url}
                alt={vendor.name}
                className="w-48 h-48 rounded-lg object-cover"
              />
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">{vendor.name}</h1>
                  <span className="inline-block mt-2 bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
                    {vendor.category}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-lg mb-6">{vendor.description}</p>

              <div className="space-y-2 text-gray-700">
                {vendor.email && (
                  <p>
                    <strong>📧 Email:</strong>{' '}
                    <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:underline">
                      {vendor.email}
                    </a>
                  </p>
                )}
                {vendor.phone && (
                  <p>
                    <strong>📞 Telefone:</strong>{' '}
                    <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline">
                      {vendor.phone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Serviços */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Serviços</h2>

          {services.length === 0 ? (
            <p className="text-gray-600">Este vendor não tem serviços cadastrados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
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

                  <button
                    onClick={() => setSelectedService(service)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Agendar Serviço
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link voltar */}
        <div className="mt-8 text-center">
          <a href="/vendors" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Voltar para Vendors
          </a>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingForm
          serviceId={selectedService.id}
          serviceName={selectedService.name}
          price={selectedService.price}
          onClose={() => setSelectedService(null)}
          onSuccess={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
