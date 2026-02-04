"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Activity, AlertTriangle, CheckCircle, FileText, Plus, Search, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        total: 0,
        compliant: 0,
        overdue: 0
    });
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchStats();

        // Connect to WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Assuming backend is on port 8000
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/dashboard`;

        socketRef.current = new WebSocket(wsUrl);

        socketRef.current.onmessage = (event) => {
            console.log("WS Update:", event.data);
            if (event.data === "update_dashboard") {
                fetchStats();
            }
        };

        return () => {
            if (socketRef.current) socketRef.current.close();
        };
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/extinguishers/');
            const all = response.data;
            // Simple logic for stats - in real app would use specific stats endpoint
            setStats({
                total: all.length,
                compliant: all.length, // Placeholder logic
                overdue: 0
            });
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Activity className="h-8 w-8 text-red-600" />
                            <span className="ml-2 text-xl font-bold text-gray-900">Fire Safety Admin</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">Welcome, {user?.username}</span>
                            <button
                                onClick={logout}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Extinguishers</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Compliant</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.compliant}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Overdue / Attention</dt>
                                        <dd className="text-lg font-medium text-gray-900">{stats.overdue}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                    <button
                        onClick={() => router.push('/admin/extinguishers/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Register New Extinguisher
                    </button>
                </div>

            </main>
        </div>
    );
}
