"use client";

import React, { useState } from 'react';
import api from '@/lib/api';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const handleReset = async () => {
        if (confirmText !== "CONFIRM_RESET") {
            alert("Please type CONFIRM_RESET exactly.");
            return;
        }

        if (!confirm("Are you ABSOLUTELY sure? This will accept all data and cannot be undone.")) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/settings/reset', null, {
                params: { confirmation: confirmText }
            });
            alert("System Reset Successful. Redirecting...");
            router.push('/admin/dashboard');
        } catch (error) {
            console.error("Reset failed", error);
            alert("Reset Failed. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-3 w-full">
                            <h3 className="text-lg font-medium text-red-800">Factory Reset / Data Wipe</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    This action will define this installation as "Fresh". It will:
                                </p>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                    <li>Delete all registered Fire Extinguishers.</li>
                                    <li>Delete all Inspection History.</li>
                                    <li><strong>KEEP</strong> User Accounts (Admin/Inspector).</li>
                                </ul>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-red-700">
                                    Type <strong>CONFIRM_RESET</strong> to proceed:
                                </label>
                                <div className="mt-1 flex space-x-3">
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                        placeholder="CONFIRM_RESET"
                                    />
                                    <button
                                        onClick={handleReset}
                                        disabled={loading || confirmText !== "CONFIRM_RESET"}
                                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ minWidth: '160px' }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {loading ? 'Wiping...' : 'Wipe Data'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
