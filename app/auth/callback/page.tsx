'use client';

import dynamic from 'next/dynamic';

const CallbackHandler = dynamic(
  () => import('./components/CallbackHandler'),
  { ssr: false, loading: () => <p>Carregando...</p> }
);

export default function CallbackPage() {
  return <CallbackHandler />;
}