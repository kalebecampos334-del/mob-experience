'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Service {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number | null;
  category: string | null;
}

export default function ServicesCRUD({ vendorId }: { vendorId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: '',
  });

  // Buscar serviços
  useEffect(() => {
    fetchServices();
  }, [vendorId]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('name');

    if (error) {
      console.error('Erro ao buscar serviços:', error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      category: formData.category || null,
      vendor_id: vendorId,
    };

    if (editingId) {
      // Update
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingId);

      if (error) {
        console.error('Erro ao editar:', error);
        alert('Erro ao editar serviço');
      } else {
        alert('Serviço editado com sucesso!');
        fetchServices();
        resetForm();
      }
    } else {
      // Create
      const { error } = await supabase
        .from('services')
        .insert([serviceData]);

      if (error) {
        console.error('Erro ao criar:', error);
        alert('Erro ao criar serviço');
      } else {
        alert('Serviço criado com sucesso!');
        fetchServices();
        resetForm();
      }
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
      category: service.category || '',
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que quer deletar esse serviço?')) return;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar serviço');
    } else {
      alert('Serviço deletado com sucesso!');
      fetchServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_minutes: '',
      category: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Meus Serviços</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Serviço'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-bold mb-4">
            {editingId ? 'Editar Serviço' : 'Criar Novo Serviço'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Nome do serviço"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="number"
              placeholder="Preço (R$)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <textarea
            placeholder="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder="Duração (minutos)"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <input
              type="text"
              placeholder="Categoria"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            {editingId ? 'Atualizar Serviço' : 'Criar Serviço'}
          </button>
        </form>
      )}

      {/* Listagem */}
      {loading ? (
        <p className="text-gray-500">Carregando serviços...</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500">Você não tem serviços ainda. Crie um novo!</p>
      ) : (
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                  >
                    Deletar
                  </button>
                </div>
              </div>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>💰 R$ {service.price.toFixed(2)}</span>
                {service.duration_minutes && (
                  <span>⏱️ {service.duration_minutes} min</span>
                )}
                {service.category && <span>📂 {service.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}