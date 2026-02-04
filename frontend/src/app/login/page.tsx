"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Lock, User } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    const onSubmit = async (data: any) => {
        setLoading(true);
        setError('');
        try {
            // Must use UrlSearchParams for OAuth2PasswordRequestForm
            const formData = new URLSearchParams();
            formData.append('username', data.username);
            formData.append('password', data.password);

            const response = await api.post('/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            login(response.data.access_token, redirectPath || undefined);
        } catch (err: any) {
            console.error("Login Error:", err);
            let msg = 'Login failed';

            if (err.response) {
                // Server responded with a status code
                msg = err.response.data.detail || `Server Error: ${err.response.status}`;
            } else if (err.request) {
                // Request made but no response
                msg = 'Network Error: No response from server. Check if backend is running.';
            } else {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Fire Safety System
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to access the dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                {...register('username', { required: true })}
                                type="text"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                {...register('password', { required: true })}
                                type="password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
