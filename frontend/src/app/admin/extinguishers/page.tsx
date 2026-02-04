"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Edit, Plus, Trash2, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function ExtinguisherListPage() {
    const [extinguishers, setExtinguishers] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchExtinguishers();
    }, []);

    const fetchExtinguishers = async () => {
        try {
            const response = await api.get('/extinguishers/');
            setExtinguishers(response.data);
        } catch (error) {
            console.error("Failed to fetch", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Asset Registry</h1>
                    <Link
                        href="/admin/extinguishers/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Add New
                    </Link>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Capacity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {extinguishers.map((ext) => (
                                <tr key={ext.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ext.sl_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ext.type} - {ext.capacity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ext.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                        <button className="text-indigo-600 hover:text-indigo-900 flex items-center inline-block">
                                            <Edit className="h-4 w-4 mr-1" /> Edit
                                        </button>
                                        <button onClick={() => window.open(ext.qr_code_url, '_blank')} className="text-green-600 hover:text-green-900 flex items-center inline-block">
                                            <QrCode className="h-4 w-4 mr-1" /> QR
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
