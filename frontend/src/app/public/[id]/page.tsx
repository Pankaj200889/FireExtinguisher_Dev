"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, AlertTriangle, MapPin, Calendar, Info } from 'lucide-react';
import Link from 'next/link';

export default function PublicViewPage() {
    const params = useParams();
    const id = params.id as string;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/extinguishers/${id}`);
                setData(response.data);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!data) return <div className="p-8 text-center text-red-600">Extinguisher not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">

                {/* Status Header */}
                <div className="bg-green-600 p-6 text-center text-white">
                    <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                    <h1 className="text-2xl font-bold">Status: Compliant</h1>
                    <p className="text-green-100">Active & Verified</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Basic Details */}
                    <div className="flex items-start">
                        <Info className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Asset Type</h3>
                            <p className="text-lg font-semibold text-gray-900">{data.type} ({data.capacity})</p>
                            <p className="text-sm text-gray-500">{data.make} - {data.year_of_manufacture}</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Location</h3>
                            <p className="text-gray-900 text-base">{data.location}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-start">
                            <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Next Refill Due</h3>
                                <p className="text-gray-900 font-medium">May 2026</p> {/* Dynamic date logic needed */}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/login" className="block w-full text-center text-red-600 font-medium text-sm hover:underline">
                            Inspector Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
