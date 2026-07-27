import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'primereact/resources/themes/arya-purple/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './globals.css';
import Header from '@/components/layout/Header';
import FloatingAiAgent from '@/components/ai/FloatingAiAgent';
import { PrimeReactProvider } from 'primereact/api';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Velicham - Illuminate Your Knowledge',
  description: 'AI-powered connected knowledge platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[--color-void] text-white min-h-screen flex flex-col antialiased`}>
        <PrimeReactProvider>
          <Header />
          <main className="flex-1 flex flex-col w-full relative">
            {children}
          </main>
          <FloatingAiAgent />
        </PrimeReactProvider>
      </body>
    </html>
  );
}
