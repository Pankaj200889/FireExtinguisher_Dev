"use client";

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { LockKeyhole, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { AxiosError } from 'axios';

function ResetPasswordForm() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const onSubmit = async (data: any) => {
        if (!token) {
            setStatus('error');
            setMessage("Invalid or missing token.");
            return;
        }

        setLoading(true);
        setStatus('idle');
        setMessage("");

        try {
            await api.post('/auth/reset-password', {
                token: token,
                new_password: data.password
            });
            setStatus('success');
            setMessage("Password reset successfully. You can now login.");
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            console.error("Reset failed", err);
            const axiosError = err as AxiosError<{ detail: string }>;
            setStatus('error');
            setMessage(axiosError.response?.data?.detail || "Password reset failed. Token might be expired.");
        } finally {
            setLoading(false);
        }
    };

    const password = watch("password");
    console.log("Token:", token);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FE]">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                    <div className="inline-flex p-3 bg-red-50 rounded-full mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Link</h2>
                    <p className="text-slate-500 mb-6 font-medium">This password reset link is invalid or missing.</p>
                    <Link href="/login" className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors">
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F7FE]">
            <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-slate-100 relative overflow-hidden transition-all">

                {/* Decorative Blur */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
                        <LockKeyhole className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reset Password</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">Create a new secure password.</p>
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Success!</p>
                            <p className="text-sm">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Error</p>
                            <p className="text-sm">{message}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                {status !== 'success' && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                            <input
                                {...register('password', {
                                    required: "Password is required",
                                    minLength: { value: 6, message: "Minimum 6 characters" }
                                })}
                                type="password"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-medium"
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {String(errors.password.message)}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                            <input
                                {...register('confirmPassword', {
                                    required: "Please confirm password",
                                    validate: (val: string) => val === password || "Passwords do not match"
                                })}
                                type="password"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:font-medium"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {String(errors.confirmPassword.message)}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 mt-4 flex justify-center items-center gap-2 group"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Set New Password"}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center relative z-10">
                    <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
            <p className="text-center text-slate-300 text-xs font-bold mt-8 uppercase tracking-widest">Siddhi Industrial Solutions</p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
