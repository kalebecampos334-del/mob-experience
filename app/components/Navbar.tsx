'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'client' | 'vendor' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);

        // Verifica se é vendor ou client
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (vendorData) {
          setUserRole('vendor');
        } else {
          setUserRole('client');
        }
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Mob Experience
        </Link>

        {/* Links Centrais */}
        <div className="hidden md:flex gap-8">
          <Link href="/vendors" className="text-gray-700 hover:text-blue-600 transition font-medium">
            Vendors
          </Link>
          <Link href="/services" className="text-gray-700 hover:text-blue-600 transition font-medium">
            Serviços
          </Link>
          {user && (
            <Link href="/bookings" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Meus Agendamentos
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {loading ? (
            <p className="text-gray-600">...</p>
          ) : user ? (
            <>
              {/* Dashboard Link */}
              {userRole === 'vendor' ? (
                <Link
                  href="/vendors/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition font-medium hidden sm:block"
                >
                  Dashboard Vendor
                </Link>
              ) : (
                <span className="text-sm text-gray-600 hidden sm:block">
                  Olá, {user.email?.split('@')[0]}
                </span>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Cadastro
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu (simples) */}
      <div className="md:hidden px-4 pb-4 flex gap-2 flex-wrap">
        <Link href="/vendors" className="text-sm text-gray-700 hover:text-blue-600">
          Vendors
        </Link>
        <Link href="/services" className="text-sm text-gray-700 hover:text-blue-600">
          Serviços
        </Link>
        {user && userRole === 'vendor' && (
          <Link href="/vendors/dashboard" className="text-sm text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  );
}