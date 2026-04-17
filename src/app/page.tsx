import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'CryptoMomentum | Early Buyer Intelligence',
  description: 'AI-driven momentum screener for the top 500 crypto assets.',
};

export default function Home() {
  return (
    <main>
      <Dashboard />
    </main>
  );
}
