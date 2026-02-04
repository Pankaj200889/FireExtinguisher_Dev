"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ArrowLeft, History, Smartphone, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuditLog {
    id: string;
    action: string;
    username: string;
    role: string;
    timestamp: string;
    ip_address: string;
    device_info: string;
    details: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/audit/');
            setLogs(response.data);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const getDeviceIcon = (ua: string) => {
        if (!ua) return <Monitor className="h-4 w-4 text-gray-400" />;
        if (ua.toLowerCase().includes('mobile') || ua.toLowerCase().includes('android')) {
            return <Smartphone className="h-4 w-4 text-blue-500" />;
        }
        return <Monitor className="h-4 w-4 text-gray-500" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <History className="h-6 w-6 mr-2 text-indigo-600" />
                        System Activity Log
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading history...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device / IP</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatTime(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{log.username}</div>
                                            <div className="text-xs text-gray-500 uppercase">{log.role}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${log.action === 'LOGIN' ? 'bg-green-100 text-green-800' :
                                                    log.action === 'RESET' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                {getDeviceIcon(log.device_info)}
                                                <span className="ml-2 truncate max-w-xs" title={log.device_info}>
                                                    {log.ip_address}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
