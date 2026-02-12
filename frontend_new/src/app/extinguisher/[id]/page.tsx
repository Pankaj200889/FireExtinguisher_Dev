"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { MapPin, Info, Calendar, ArrowRight, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Signature Canvas
const InspectionForm = dynamic(() => import('@/components/InspectionForm'), {
    ssr: false,
    loading: () => <p className="text-center py-4">Loading Form...</p>
});

interface Extinguisher {
    id: string;
    sl_no: string;
    type: string;
    capacity: string;
    location: string;
    make?: string;
    year_of_manufacture?: number;
    last_inspection_status?: string;
    next_service_due?: string;
    last_inspector?: string;
    mode: "VIEW" | "EDIT" | "LOCKED";
    lastInspectionAt?: string;
    debug_info?: string;
    recent_inspections?: {
        id: string;
        date: string;
        type: string;
        status: string;
        inspector: string;
    }[];
}

import { useAuth } from '@/context/AuthContext';

export default function ExtinguisherMasterPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth(); // Get auth state
    const id = params.id as string;
    const [data, setData] = useState<Extinguisher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const handleReturn = () => {
        if (user) {
            router.push('/admin/dashboard');
        } else {
            router.push('/');
        }
    };

    const fetchData = useCallback(() => {
        setLoading(true);
        api.get<Extinguisher>(`/extinguishers/${id}`)
            .then(res => {
                setData(res.data);
                console.log("Master Page Mode Decision:", res.data.mode);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch extinguisher", err);
                const msg = err.response?.data?.detail
                    || err.message
                    || JSON.stringify(err);

                // Add status code if available
                const status = err.response?.status ? ` (Status: ${err.response.status})` : '';

                setError(`DEBUG ERROR: ${msg}${status}`);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] px-4">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={handleReturn} className="text-indigo-600 hover:underline">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // --- LOGIC BRANCHING ---

    // CASE 1: LOCKED
    if (data.mode === 'LOCKED') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FE]">
                <div className="max-w-md w-full glass-card p-8 text-center">
                    <div className="bg-red-100/50 p-4 rounded-full inline-block mb-4 backdrop-blur-sm">
                        <Lock className="h-12 w-12 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspection Locked</h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                        This extinguisher was inspected recently. Next inspection authorized after 48 hours to prevent duplicate records.
                    </p>
                    {data.lastInspectionAt && (
                        <p className="text-sm font-medium text-gray-600 bg-white/40 mb-8 py-2 px-4 rounded-lg inline-block">
                            Last Check: {new Date(data.lastInspectionAt).toLocaleString()}
                        </p>
                    )}

                    <button
                        onClick={handleReturn}
                        className="w-full glass-btn py-3 font-semibold mb-3"
                    >
                        {user ? 'Return to Dashboard' : 'Return Home'}
                    </button>

                    {user?.role === 'admin' && (
                        <>
                            <button
                                onClick={() => setData(prev => prev ? { ...prev, mode: 'EDIT' } : null)}
                                className="w-full py-3 font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm uppercase tracking-wide mb-6"
                            >
                                Admin Override: Edit / Re-Submit
                            </button>

                            {/* Admin History in Locked View */}
                            {data.recent_inspections && data.recent_inspections.length > 0 && (
                                <div className="text-left w-full mt-6 border-t border-gray-200 pt-6">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3 px-1">Recent Inspections</h3>
                                    <div className="space-y-2">
                                        {data.recent_inspections.map((insp) => (
                                            <div
                                                key={insp.id}
                                                onClick={() => router.push(`/admin/inspections/${insp.id}`)}
                                                className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all group"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${insp.status === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        <p className="text-xs font-bold text-gray-700">{new Date(insp.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-medium">{insp.type} • {insp.inspector}</p>
                                                </div>
                                                <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-indigo-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // CASE 2: EDIT (Perform Inspection)
    if (data.mode === 'EDIT') {
        return (
            <div className="min-h-screen py-8 px-4 bg-[#F4F7FE]">
                <div className="max-w-4xl mx-auto glass-card overflow-hidden">
                    <div className="px-6 py-6 border-b border-white/20 bg-white/10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Perform Inspection</h1>
                                <p className="text-sm text-gray-600 mt-1">{data.type} &bull; {data.location}</p>
                            </div>
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">EDIT MODE</span>
                        </div>
                    </div>
                    {/* Render Form Component */}
                    <div className="p-6">
                        <InspectionForm
                            extinguisherId={id}
                            extinguisherData={data}
                            onSuccess={() => {
                                // Refresh logic: fetch data again to see "LOCKED" state
                                fetchData();
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // CASE 3: VIEW (Default Public View)
    const isOperational = data.last_inspection_status === "Operational";
    return (
        <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-[#F4F7FE]">

            {/* Status Card */}
            <div className={`w-full max-w-sm glass-card mb-6 overflow-hidden relative ${isOperational ? 'border-green-400/50' : 'border-red-400/50'}`}>
                <div className={`absolute top-0 left-0 w-full h-2 ${isOperational ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="p-8 text-center pt-10">
                    {isOperational ? (
                        <div className="inline-flex p-4 rounded-full bg-green-100/50 mb-4 backdrop-blur-sm shadow-inner">
                            <CheckCircle className="h-16 w-16 text-green-600" />
                        </div>
                    ) : (
                        <div className="inline-flex p-4 rounded-full bg-red-100/50 mb-4 backdrop-blur-sm shadow-inner">
                            <AlertCircle className="h-16 w-16 text-red-600" />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{data.last_inspection_status || "Pending Check"}</h1>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Current Status</p>
                </div>
            </div>

            {/* Details Card */}
            <div className="w-full max-w-sm glass-card overflow-hidden">
                <div className="bg-white/20 px-6 py-4 border-b border-white/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{data.type} Extinguisher</h2>
                        <p className="text-xs text-gray-600 font-mono mt-0.5">Asset Number: {data.sl_no}</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">

                    {/* Make & Capacity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Capacity</p>
                            <p className="text-sm font-semibold text-gray-900">{data.capacity}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Make</p>
                            <p className="text-sm font-semibold text-gray-900">{data.make || 'N/A'}</p>
                        </div>
                    </div>

                    {/* MFG Year */}
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">MFG Year</p>
                        <p className="text-sm font-semibold text-gray-900">{data.year_of_manufacture || 'N/A'}</p>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-gray-200/50 pt-3">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Service Schedule</p>
                        <div className="flex justify-between">
                            <div className="text-left">
                                <span className="block text-[10px] text-gray-500">Next Service/Refill</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {data.next_service_due ? new Date(data.next_service_due).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Last Inspector */}
                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                            <p className="text-xs text-indigo-800 font-bold uppercase tracking-wide">Verified By</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 pl-4">{data.last_inspector || 'System'}</p>
                    </div>

                </div>
                {/* No Login Footer for Public View as per request */}
            </div>

            {/* Admin: Inspection History */}
            {user?.role === 'admin' && data.recent_inspections && data.recent_inspections.length > 0 && (
                <div className="w-full max-w-sm mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Inspection History</h3>
                    <div className="space-y-3">
                        {data.recent_inspections.map((insp) => (
                            <div
                                key={insp.id}
                                onClick={() => router.push(`/admin/inspections/${insp.id}`)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${insp.status === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <p className="text-sm font-bold text-slate-800">{new Date(insp.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{insp.type} • {insp.inspector}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="mt-8 text-xs text-white/50 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">IS 2190:2024 Compliant System</p>
        </div>
    );
}
