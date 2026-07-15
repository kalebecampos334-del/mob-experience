'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function VendorRequestPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    category: 'bartender',
    bio: '',
    phone: ''
  });
  const [document, setDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setDocument(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validações
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não correspondem');
      setLoading(false);
      return;
    }

    if (!document) {
      setError('Documento é obrigatório');
      setLoading(false);
      return;
    }

    try {
      let documentUrl = null;

      // 1. Upload documento para Supabase Storage
      const fileName = `${formData.email}-${Date.now()}-${document.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(fileName, document);

      if (uploadError) {
        setError(`Erro ao fazer upload: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      // Pega URL pública do documento
      const { data: publicUrlData } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(fileName);

      documentUrl = publicUrlData.publicUrl;

      // 2. Criar aplicação de vendor (status: pending)
      const { error: applicationError } = await supabase
        .from('vendor_applications')
        .insert({
          user_email: formData.email,
          full_name: formData.fullName,
          category: formData.category,
          bio: formData.bio,
          phone: formData.phone,
          document_url: documentUrl,
          password_hash: formData.password, // Temporário - será hash no backend
          status: 'pending'
        });

      if (applicationError) {
        setError(applicationError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      alert('✅ Solicitação enviada com sucesso! Admin vai revisar em breve.');
      
      // Limpa form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        category: 'bartender',
        bio: '',
        phone: ''
      });
      setDocument(null);
    } catch (err) {
      setError('Erro ao enviar solicitação');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Seja um Vendor</h1>
        <p className="text-center text-gray-600 mb-8">Solicitação de acesso</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            Solicitação enviada com sucesso!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="João Silva"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="bartender">Bartender</option>
              <option value="dj">DJ</option>
              <option value="foto">Fotógrafo</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="11999999999"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobre Você (Experiência)
            </label>
            <textarea
              name="bio"
              placeholder="Descreva sua experiência e certificações"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documento (CPF, RG ou Certificado)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            <p className="text-xs text-gray-500 mt-1">Formatos: PDF, JPG, PNG</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Já tem conta?{' '}
          <a href="/auth/login" className="text-blue-600 font-bold hover:underline">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
