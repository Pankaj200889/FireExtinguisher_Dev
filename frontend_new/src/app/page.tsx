"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // For App Router
import { ShieldCheck, QrCode, Search, ArrowRight, Flame } from 'lucide-react'; // Added Flame icon

export default function Home() {
  const [manualId, setManualId] = useState('');
  const router = useRouter();

  const handleManualScan = () => {
    if (manualId.trim()) {
      // Support full URL or just ID
      const id = manualId.trim().split('/').pop();
      router.push(`/extinguisher/${id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-800 bg-[#F4F7FE]">
      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">

        <div className="mb-12 animate-float">
          <div className="inline-flex p-8 bg-white rounded-[2rem] mb-8 shadow-xl shadow-blue-100 border border-slate-100">
            <Flame className="h-24 w-24 text-blue-600 drop-shadow-sm fill-blue-50" />
          </div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 mb-4 tracking-tighter drop-shadow-sm">
            Fire Safety
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed tracking-wide">
            Next-Gen Extinguisher Management System
          </p>
        </div>

        {/* Cards Container */}
        <div className="w-full max-w-md perspective-container">

          {/* Private Card: Officer Access */}
          <div className="bg-white p-10 flex flex-col items-center hover:scale-[1.02] transition-transform duration-500 shadow-2xl shadow-slate-200 border border-slate-100 rounded-[2.5rem] relative overflow-hidden group">

            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="h-20 w-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-3 flex items-center justify-center mb-8 shadow-lg shadow-indigo-200 border border-white ring-4 ring-indigo-50 relative z-10">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight relative z-10">Officer Portal</h2>
            <p className="text-slate-400 mb-8 text-center text-sm font-bold relative z-10">
              Secure access for Fire Safety Officers.
            </p>

            <div className="w-full space-y-4 relative z-10">
              <button
                onClick={() => router.push('/login')}
                className="w-full py-4 text-lg flex items-center justify-center gap-3 group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-200 transition-all active:scale-95"
              >
                <span className="relative z-10">Enter Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-bold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-500" />
                <span>Scan physical tags for public view</span>
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center p-6 text-slate-400 text-xs font-bold tracking-widest uppercase">
        <p>Siddhi Industrial Solutions &bull; System v2.3</p>
      </footer>
    </div>
  );
}
