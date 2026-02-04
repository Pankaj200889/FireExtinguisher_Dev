"use client";
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DebugPage() {
    const [info, setInfo] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [env, setEnv] = useState<any>({});

    useEffect(() => {
        // 1. Capture Environment
        setEnv({
            apiBase: process.env.NEXT_PUBLIC_API_URL || 'Using Default',
            token: localStorage.getItem('token'),
            browser: navigator.userAgent
        });

        // 2. Test Fetch
        api.get('/extinguishers/')
            .then(res => setInfo(res.data))
            .catch(err => setError(JSON.stringify(err)));

    }, []);

    return (
        <div className="p-8 font-mono bg-black text-green-400 min-h-screen">
            <h1 className="text-xl font-bold mb-4">SYSTEM DEBUG</h1>

            <div className="mb-4 text-white">
                <h2 className="underline">Environment</h2>
                <pre>{JSON.stringify(env, null, 2)}</pre>
            </div>

            <div className="mb-4 text-blue-400">
                <h2 className="underline">API Status</h2>
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <p>Connected! Found {Array.isArray(info) ? info.length : 'Unknown'} extinguishers.</p>
                )}
            </div>

            <div className="text-xs text-gray-500">
                If this page works, the backend is fine.
            </div>
        </div>
    );
}
