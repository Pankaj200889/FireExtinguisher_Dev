"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { MapPin, Info, Calendar, ArrowRight, User, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import InspectionForm from '@/components/InspectionForm';

interface Extinguisher {
    id: string;
    sl_no: string;
    type: string;
    capacity: string;
    location: string;
    make: string;
    year_of_manufacture: number;
    last_inspection_status?: string;
    next_service_due?: string;
    last_inspector?: string;
    mode: "VIEW" | "EDIT" | "LOCKED";
    lastInspectionAt?: string;
}

export default function ExtinguisherMasterPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [data, setData] = useState<Extinguisher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                setError("Extinguisher details unavailable.");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline">
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Inspection Locked</h2>
                    <p className="text-gray-600 mb-4">
                        This extinguisher was inspected recently. Next inspection allowed after 48 hours.
                    </p>
                    {data.lastInspectionAt && (
                        <p className="text-xs text-gray-400 mb-6">Last Check: {new Date(data.lastInspectionAt).toLocaleString()}</p>
                    )}

                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // CASE 2: EDIT (Perform Inspection)
    if (data.mode === 'EDIT') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-lg mx-auto bg-white rounded-xl shadow border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                        <h1 className="text-lg font-bold text-gray-800">Perform Inspection</h1>
                        <p className="text-xs text-gray-500">{data.type} - {data.location}</p>
                    </div>
                    {/* Render Form Component */}
                    <div className="px-6 pb-6">
                        <InspectionForm
                            extinguisherId={id}
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
        <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center">

            {/* Status Card */}
            <div className={`w-full max-w-sm rounded-xl shadow-lg border-t-8 mb-6 ${isOperational ? 'border-green-500 bg-white' : 'border-yellow-500 bg-white'}`}>
                <div className="p-6 text-center">
                    {isOperational ? (
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    ) : (
                        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.last_inspection_status || "Pending Check"}</h1>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">Current Status</p>
                </div>
            </div>

            {/* Details Card */}
            <div className="w-full max-w-sm bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">{data.type} Extinguisher</h2>
                    <p className="text-xs text-gray-500 font-mono">SN: {data.sl_no}</p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Make/Capacity */}
                    <div className="flex items-center">
                        <Info className="h-5 w-5 text-indigo-500 mr-3" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Make & Capacity</p>
                            <p className="text-sm font-bold text-gray-900">{data.make} - {data.capacity}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-indigo-500 mr-3" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Location</p>
                            <p className="text-sm font-bold text-gray-900">{data.location}</p>
                        </div>
                    </div>

                    {/* Next Due */}
                    <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-indigo-500 mr-3" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Next Refill Due</p>
                            <p className="text-sm font-bold text-gray-900">
                                {data.next_service_due ? new Date(data.next_service_due).toLocaleDateString() : 'Not Scheduled'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login Action (Footer) - Only shown in VIEW mode */}
                <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-200">
                    <button
                        onClick={() => router.push(`/login?redirect=/extinguisher/${id}`)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
                    >
                        Inspector Login <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400">IS 2190:2024 Compliant System</p>
        </div>
    );
}
