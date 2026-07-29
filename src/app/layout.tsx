import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'primereact/resources/themes/soho-dark/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './globals.css';
import Header from '@/components/layout/Header';
import FloatingAiAgent from '@/components/ai/FloatingAiAgent';
import { PrimeReactProvider } from 'primereact/api';

import GalaxyBackground from '@/components/layout/GalaxyBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VELICHAM - Illuminate Your Knowledge',
  description: 'AI-powered connected knowledge platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" href="https://cdn.lineicons.com/4.0/lineicons.css" />
      </head>
      <body className={`${inter.className} bg-[--color-void] text-white min-h-screen flex flex-col antialiased relative overflow-x-hidden`}>
        <GalaxyBackground />
        <PrimeReactProvider>
          <Header />
          <main className="flex-1 flex flex-col w-full relative z-10">
            {children}
          </main>
          <FloatingAiAgent />
        </PrimeReactProvider>
      </body>
    </html>
  );
}
