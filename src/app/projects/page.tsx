'use client';

import Header from '@/components/Header';
import Link from 'next/link';

export default function ProjectsPage(){
  return(
    <div className="min-h-screen flex flex-col bg-[#0D1B2A] text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-4xl font-extrabold text-[#FECB00] mb-6">Projektportal</h1>
        <p className="max-w-xl text-gray-200 mb-8">Här kommer aggregerad statistik och möjligheten att lägga till nya projekt. Funktionalitet utvecklas löpande.</p>
        <Link href="/projects/new" className="px-6 py-3 rounded bg-[#FECB00] text-[#0D1B2A] font-semibold hover:bg-[#e0b400]">Lägg till projekt</Link>
      </main>
    </div>
  );
} 