'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/app/components/ProtectedRoute';

interface Booking {
  id: string;
  service_id: string;
  event_date: string;
  event_time: string | null;
  status: string;
  total_price: number;
  notes: string | null;
  services: {
    name: string;
    vendors: Array<{
      name: string;
    }>;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Busca cliente do usuário
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!clientData) {
          setLoading(false);
          return;
        }

        // Busca bookings do cliente
        const { data } = await supabase
          .from('bookings')
          .select('id, service_id, event_date, event_time, status, total_price, notes, services(name, vendors(name))')
          .eq('client_id', clientData.id)
          .order('event_date', { ascending: false });

        setBookings(data || []);
      } catch (err) {
        console.error('Erro ao buscar bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Tem certeza que quer cancelar este agendamento?')) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      alert('Erro ao cancelar agendamento');
    } else {
      alert('Agendamento cancelado com sucesso!');
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Agendamentos</h1>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Carregando agendamentos...</p>
            </div>
) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">Você não tem agendamentos ainda</p>
              <a href="/vendors" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                Explorar Vendors
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {booking.services.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Vendor: {booking.services.vendors[0].name}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">📅 Data</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.event_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {booking.event_time && (
                      <div>
                        <p className="text-gray-600">🕐 Hora</p>
                        <p className="font-semibold text-gray-900">{booking.event_time}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">💰 Valor</p>
                      <p className="font-semibold text-blue-600">
                        R$ {booking.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Observações:</p>
                      <p className="text-gray-900">{booking.notes}</p>
                    </div>
                  )}

                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Cancelar Agendamento
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}