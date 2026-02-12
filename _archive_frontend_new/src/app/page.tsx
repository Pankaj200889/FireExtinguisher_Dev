"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Flame, QrCode } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="z-10 text-center space-y-8 px-4 animate-slide-up">
        {/* Logo/Icon Area */}
        <div style={{ marginBottom: '4rem', paddingTop: '2rem' }} className="flex justify-center">
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl shadow-rose-900/20">
            <ShieldCheck className="w-20 h-20 text-rose-500" />
          </div>
        </div>

        {/* Main Text */}
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 pb-4 leading-tight drop-shadow-2xl">
            IgnisGuard
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed mt-4">
            Safety at your fingertips, Compliance in your pocket.
          </p>

          <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 backdrop-blur-sm mt-4 font-mono">
            v2.3.0 (Cloud)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <button
            onClick={() => router.push('/login')}
            className="px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white text-lg font-bold rounded-xl shadow-lg shadow-rose-900/50 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95 group"
          >
            <Flame className="w-5 h-5 group-hover:animate-bounce" />
            Get Started
          </button>

          <button
            onClick={() => router.push('/scan')}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm"
          >
            <QrCode className="w-5 h-5" />
            Scan Tag
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-gray-500 text-xs font-bold tracking-widest uppercase animate-fade-in" style={{ animationDelay: '0.5s' }}>
        &copy; {new Date().getFullYear()} IgnisGuard Systems
      </div>
    </div>
  );
}
