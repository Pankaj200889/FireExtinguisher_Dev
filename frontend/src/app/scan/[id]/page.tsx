"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, ScanLine, Loader2 } from 'lucide-react';

export default function ScanRouterPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isAuthenticated } = useAuth(); // We'll assume AuthContext is fast enough now
    const id = params.id as string;
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        // STRICT IS 2190 COMPLIANCE:
        // Just redirect to the Master Page. It handles everything.
        window.location.href = `/extinguisher/${id}`;
    };

    route();

}, [isAuthenticated, user, id, router]);

return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        {/* Premium Pulse Animation */}
        <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
            <div className="relative bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 flex flex-col items-center">
                <div className="relative mb-6">
                    <ScanLine className="h-16 w-16 text-red-500 animate-pulse" />
                    <ShieldCheck className="h-8 w-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Processing QR Code</h2>
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                    <p className="text-sm text-slate-400">{status}</p>
                </div>
                {/* DEBUG OVERLAY */}
                <div className="mt-4 text-[10px] text-slate-500 font-mono text-left bg-black p-2 rounded w-full">
                    <p>Auth: {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p>User: {user ? user.username : 'None'}</p>
                    <p>Role: {user ? user.role : 'None'}</p>
                    <p>Token: {typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'Found' : 'Missing') : 'SSR'}</p>
                </div>
            </div>
        </div>

        <p className="mt-8 text-xs text-slate-600 font-mono">
            ID: {id?.slice(0, 8)}...
        </p>
    </div>
);
}
