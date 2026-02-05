"use client";

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api';

function LoginForm() {
    const { register, handleSubmit } = useForm();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect') || undefined;

    const onSubmit = async (data: any) => {
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append('username', data.username);
            formData.append('password', data.password);

            const response = await api.post('/token', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // OAuth2 expects form data
            });

            login(response.data.access_token, redirectPath);
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.detail || "Login failed. Check console.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FE]">
            <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100 relative overflow-hidden">
                {/* Decorative Blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                <div className="text-center mb-10 relative z-10">
                    <div className="inline-flex p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-indigo-200">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Officer Portal</h2>
                    <p className="text-slate-400 font-medium">Secure access for authorized personnel.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                        <input
                            {...register('username')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Officer ID"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-bold placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Secure Sign In"}
                    </button>

                    <p className="text-center text-xs text-slate-400 font-medium mt-6">
                        Siddhi Industrial Solutions &bull; System V2.0
                    </p>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-white text-center mt-20">Loading Login...</div>}>
            <LoginForm />
        </Suspense>
    );
}
