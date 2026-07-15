'use client';

import dynamic from 'next/dynamic';

const ServicesList = dynamic(
  () => import('./components/ServicesList'),
  { ssr: false, loading: () => <p>Carregando...</p> }
);

export default function ServicesPage() {
  return <ServicesList />;
}