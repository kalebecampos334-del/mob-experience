'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BookingFormProps {
  serviceId: string;
  serviceName: string;
  price: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingForm({
  serviceId,
  serviceName,
  price,
  onClose,
  onSuccess,
}: BookingFormProps) {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Pega sessão do usuário
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Você precisa estar logado para agendar');
        setLoading(false);
        return;
      }

      // Busca dados do cliente
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('user_id', session.user.id)
        .single();

      if (!clientData) {
        setError('Erro ao buscar dados do cliente');
        setLoading(false);
        return;
      }

      // Cria booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            service_id: serviceId,
            client_id: clientData.id,
            event_date: eventDate,
            event_time: eventTime || null,
            status: 'pending',
            total_price: price,
            notes: notes || null,
          },
        ]);

      if (bookingError) {
        console.error('Erro ao criar booking:', bookingError);
        setError('Erro ao agendar serviço');
        setLoading(false);
        return;
      }

      alert('Agendamento realizado com sucesso! Você receberá uma confirmação em breve.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao processar agendamento');
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Agendar Serviço</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-2">{serviceName}</p>
        <p className="text-lg font-bold text-blue-600 mb-6">R$ {price.toFixed(2)}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data do Evento *
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora (opcional)
            </label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Deixe alguma observação importante..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}