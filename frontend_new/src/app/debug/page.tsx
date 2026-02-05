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
            apiBase: process.env.NEXT_PUBLIC_API_URL || 'Using Default (localhost)',
            token: typeof window !== 'undefined' ? localStorage.getItem('token') : 'SSR',
            browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'
        });

        // 2. Test Fetch
        api.get('/')
            .then(res => setInfo(res.data))
            .catch(err => setError(err.message || JSON.stringify(err)));

    }, []);

    return (
        <div className="p-8 font-mono bg-black text-green-400 min-h-screen">
            <h1 className="text-xl font-bold mb-4">SYSTEM DEBUG (REBUILD)</h1>

            <div className="mb-4 text-white">
                <h2 className="underline">Environment</h2>
                <pre className="text-xs">{JSON.stringify(env, null, 2)}</pre>
            </div>

            <div className="mb-4 text-blue-400">
                <h2 className="underline">API Status</h2>
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <div>
                        <p>Connected!</p>
                        <pre className="text-xs text-gray-400">{JSON.stringify(info, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
