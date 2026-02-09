"use client";

import React, { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Plus, QrCode, LogOut, Camera, Flame, FireExtinguisher, ChevronRight, User, FileText, Download, Activity, Users, UserPlus, Shield, Lock, Trash2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { Html5Qrcode } from 'html5-qrcode';

import Link from 'next/link';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

interface Extinguisher {
    id: string;
    sl_no: string;
    type: string;
    location: string;
    qr_code_url?: string;
    status: string;
    last_inspection_status?: string;
    next_service_due?: string;
    capacity?: string;
    make?: string;
    year_of_manufacture?: number;
    last_inspection_date?: string;
    inspections?: Inspection[];
    hydro_pressure_tested_on?: string;
    next_hydro_pressure_test_due?: string;
}

interface AppUser {
    id: string;
    username: string;
    role: string;
}



interface Inspection {
    inspection_type: string;
    inspection_date: string;
    pressure_tested_on?: string;
    date_of_discharge?: string;
    refilled_on?: string;
    due_for_refilling?: string;
    hydro_pressure_tested_on?: string;
    next_hydro_pressure_test_due?: string;
    remarks?: string;
}

interface CompanySettings {
    company_name: string;
    logo_url?: string;
    timezone?: string;
}

export default function AdminDashboard() {
    const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
    const [companySettings, setCompanySettings] = useState<CompanySettings>({ company_name: "Siddhi Industrial Solutions" });

    // ... existing state ...
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'team'>('dashboard');
    const [chartData, setChartData] = useState<{ name: string, value: number }[]>([]); // Real Data
    const [statsSummary, setStatsSummary] = useState({ total: 0, change: 0, trend: 'up' }); // Real Summary

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedAssetForQR, setSelectedAssetForQR] = useState<Extinguisher | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const { register, handleSubmit, reset } = useForm();
    const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm();
    const { register: registerUser, handleSubmit: handleSubmitUser, reset: resetUser } = useForm();
    const { register: registerReset, handleSubmit: handleSubmitReset, reset: resetReset } = useForm();
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ...

    useEffect(() => {
        if (user) {
            loadData();
            loadSettings();
            loadStats(); // Fetch Chart Data
            if (user.role === 'admin') loadUsers();
        }
    }, [user]);

    // QR Scanner Logic
    // QR Scanner Logic
    useEffect(() => {
        if (isScannerOpen && !scannerRef.current) {
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;

            scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    // Handle Success
                    console.log("Scanned:", decodedText);
                    try {
                        // Expected URL format: https://.../extinguisher/{id}
                        const url = new URL(decodedText);
                        const parts = url.pathname.split('/');
                        const idIndex = parts.indexOf('extinguisher');
                        if (idIndex !== -1 && parts[idIndex + 1]) {
                            const id = parts[idIndex + 1];
                            // Stop scanner before navigating
                            scanner.stop().then(() => {
                                scanner.clear();
                                setIsScannerOpen(false);
                                scannerRef.current = null;
                                router.push(`/extinguisher/${id}`);
                            }).catch(console.error);
                        }
                    } catch (e) {
                        console.error("Invalid QR", e);
                    }
                },
                (errorMessage) => {
                    // Ignore parsing errors
                }
            ).catch(err => {
                console.error("Failed to start scanner", err);
            });
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    scannerRef.current = null;
                }).catch(err => {
                    console.warn("Scanner stop warning:", err);
                });
            }
        };
    }, [isScannerOpen]);

    const loadStats = () => {
        api.get('/inspections/stats')
            .then(res => {
                // Backend now returns { chart: [], total: 123, change: 10, trend: 'up' }
                // Handle legacy or new format
                if (res.data.chart) {
                    setChartData(res.data.chart);
                    setStatsSummary({
                        total: res.data.total,
                        change: res.data.change,
                        trend: res.data.trend
                    });
                } else {
                    // Fallback if backend not updated yet
                    setChartData(res.data);
                }
            })
            .catch(console.error);
    };

    const loadUsers = () => {
        api.get('/users/').then(res => setUsers(res.data)).catch(console.error);
    };

    const loadSettings = () => {
        api.get('/settings/')
            .then(res => {
                setCompanySettings(res.data);
                // Pre-fill form
                resetProfile({ company_name: res.data.company_name });
            })
            .catch(err => console.error("Failed to load settings", err));
    };

    const loadData = () => {
        setLoading(true);
        api.get('/extinguishers/')
            .then(res => {
                setExtinguishers(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                if (err.response?.status === 401) {
                    alert("Unauthorized. Please login.");
                    router.push('/login');
                }
                setLoading(false);
            });
    };

    const handleCreate = async (data: any) => {
        setSubmitting(true);
        try {
            await api.post('/extinguishers/', {
                sl_no: data.sl_no,
                type: data.type,
                location: data.location,
                capacity: `${data.capacity} ${data.capacity_unit || ''}`.trim(),
                make: data.make || "Generic",
                year_of_manufacture: data.year || 2024
            });
            alert("Created Successfully!");
            setIsModalOpen(false);
            reset();
            loadData();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Failed to create");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateProfile = async (data: any) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('company_name', data.company_name);
            if (data.logo && data.logo[0]) {
                formData.append('logo', data.logo[0]);
            }

            await api.post('/settings/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("Profile Updated Successfully!");
            setIsProfileModalOpen(false);
            loadSettings(); // Refresh
        } catch (e: any) {
            alert("Failed to update profile");
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateUser = async (data: any) => {
        setSubmitting(true);
        try {
            await api.post('/users/', {
                username: data.username,
                role: data.role,
                password: data.password
            });
            alert("User Created Successfully!");
            setIsUserModalOpen(false);
            resetUser();
            loadUsers();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (data: any) => {
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await api.post(`/users/${selectedUser.id}/reset-password`, {
                password: data.password
            });
            alert("Password Reset Successfully!");
            setIsResetModalOpen(false);
            resetReset();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Failed to reset password");
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerateLink = async (userId: string) => {
        setSubmitting(true);
        try {
            const response = await api.post('/auth/password-reset-link', { user_id: userId });
            const link = `${window.location.origin}/reset-password?token=${response.data.link_token}`;
            setGeneratedLink(link);
            setIsLinkModalOpen(true);
        } catch (e: any) {
            alert(e.response?.data?.detail || "Failed to generate link");
        } finally {
            setSubmitting(false);
        }
    };


    // Stats Logic
    const totalAssets = extinguishers.length;
    const operationalCount = extinguishers.filter(e => (e.status === 'Operational' || e.last_inspection_status === 'Operational')).length;
    const criticalCount = totalAssets - operationalCount;
    const scanRate = totalAssets > 0 ? ((operationalCount / totalAssets) * 100).toFixed(1) : "0";

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToRegister = () => {
        const element = document.getElementById('register-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToReports = () => {
        const element = document.getElementById('reports-section');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Header (Annex H Format)
        doc.setFontSize(10);
        doc.text("ANNEX H", 148, 10, { align: 'center' });
        doc.text("(Clauses 12 and 13)", 148, 16, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("REGISTER OF FIRE EXTINGUISHER", 148, 24, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("H-1 Record of fire extinguishers installed in a premise, its inspection, maintenance, and operational history shall be maintained as per the format given below:", 14, 34);

        // Helper to format dates based on Timezone
        const fmt = (dateStr?: string) => {
            if (!dateStr) return '-';
            try {
                return new Date(dateStr).toLocaleDateString('en-IN', {
                    timeZone: companySettings.timezone || 'Asia/Kolkata',
                    day: '2-digit', month: '2-digit', year: 'numeric'
                });
            } catch (e) { return '-'; }
        };

        // Table
        const tableData = extinguishers.map((ext, index) => {
            const inspections = ext.inspections || [];

            // Helper to extract and join unique dates
            const getDates = (filterFn: (i: Inspection) => boolean, dateField: keyof Inspection) => {
                const dates = inspections
                    .filter(filterFn)
                    .map(i => i[dateField])
                    .filter(d => d)
                    .map(d => {
                        // Force dd/mm/yyyy format
                        const date = new Date(d as string);
                        return date.toLocaleDateString('en-GB', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                        });
                    });
                return [...new Set(dates)].join('\n') || '-';
            };

            // Helper for specific inspection types
            // Monthly, Quarterly, Annual
            const monthlyDates = getDates(i => i.inspection_type === 'Monthly', 'inspection_date');
            const quarterlyDates = getDates(i => i.inspection_type === 'Quarterly', 'inspection_date');
            const annualDates = getDates(i => i.inspection_type === 'Annual', 'inspection_date');

            return [
                ext.sl_no,
                ext.type,
                ext.capacity || '-',
                ext.year_of_manufacture || '-',
                ext.make || '-',
                ext.location,
                monthlyDates,
                quarterlyDates,
                annualDates,

                getDates(i => !!i.pressure_tested_on, 'pressure_tested_on'),
                getDates(i => !!i.date_of_discharge, 'date_of_discharge'),
                getDates(i => !!i.refilled_on, 'refilled_on'),
                getDates(i => !!i.due_for_refilling, 'due_for_refilling'),

                // Hydro Test (Column 13)
                // Priority: flattened field on Extinguisher -> then Inspection history
                ext.hydro_pressure_tested_on ?
                    new Date(ext.hydro_pressure_tested_on).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : getDates(i => !!i.hydro_pressure_tested_on, 'hydro_pressure_tested_on'),

                // Next Hydro (Column 14)
                ext.next_hydro_pressure_test_due ?
                    new Date(ext.next_hydro_pressure_test_due).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : getDates(i => !!i.next_hydro_pressure_test_due, 'next_hydro_pressure_test_due'),

                ext.last_inspection_status || '-',
                // Remarks
                inspections.map(i => i.remarks).filter(Boolean).slice(0, 3).join(', ') || '-'
            ];
        });

        autoTable(doc, {
            startY: 40,
            head: [[
                'Sl', 'Type', 'Cap', 'Year', 'Make', 'Location',
                'Monthly', 'Quarterly', 'Annual',
                'Pressure\nTest', 'Date of\nDischarge', 'Refilled\nOn', 'Due for\nRefilling',
                'Hydro\nTest', 'Next\nHydro', 'Status', 'Remarks'
            ]],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineColor: [50, 50, 50],
                lineWidth: 0.1,
                valign: 'middle',
                halign: 'center',
                fontSize: 8
            },
            styles: {
                lineColor: [50, 50, 50],
                lineWidth: 0.1,
                fontSize: 7, // Smaller font for many columns
                valign: 'top',
                cellPadding: 1,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 12 },
                2: { cellWidth: 10 },
                3: { cellWidth: 10 },
                4: { cellWidth: 15 },
                5: { cellWidth: 20 },
                // Dates columns auto-stacked
            }
        });

        // Notes
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.text("NOTES", 14, finalY);
        doc.text("1. In remarks column fill details of date of operation as per annual maintenance date, date of rejection and disposal with details of observations.", 14, finalY + 5);
        doc.text("2. Each extinguisher should be allotted one full page and the particulars of a permanent nature like Sl No., type, capacity, year of manufacture etc can be transferred.", 14, finalY + 10);

        doc.save("Fire_Extinguisher_Register_Annex_H.pdf");
    };

    const handleDownloadCSV = () => {
        // Sort descending by SL No (Proxy for Timestamp as typically sequential)
        const sortedExtinguishers = [...extinguishers].sort((a, b) => b.sl_no.localeCompare(a.sl_no));

        const headers = ["Serial No,Type,Capacity,Year of Manufacture,Make,Location,Status,Next Due,Previous Inspection Date\n"];
        const rows = sortedExtinguishers.map(e =>
            `${e.sl_no},${e.type},${e.capacity || ''},${e.year_of_manufacture || ''},${e.make || ''},${e.location},${e.last_inspection_status || 'Pending'},${e.next_service_due || ''},${e.last_inspection_date || ''}`
        );

        const blob = new Blob([...headers, ...rows.join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fire_Extinguishers_List_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to remove user "${username}"?`)) return;

        try {
            await api.delete(`/users/${userId}`);
            // Optimistic update
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error(error);
            alert("Failed to delete user. Ensure you are Admin.");
        }
    };

    const handleDeleteAsset = async (assetId: string, sl_no: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to remove asset "${sl_no}"?`)) return;

        try {
            await api.delete(`/extinguishers/${assetId}`);
            setExtinguishers(extinguishers.filter(ex => ex.id !== assetId));
        } catch (error) {
            console.error(error);
            alert("Failed to delete asset.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FE] font-sans text-slate-900 pb-20">
            {/* 1. Modern Navbar (Siddhi Style) */}
            <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex justify-between items-center w-full md:w-auto">
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsProfileModalOpen(true)}>
                        <div className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-100 overflow-hidden bg-white border border-slate-100 flex items-center justify-center relative">
                            {companySettings.logo_url ? (
                                <img src={`${api.defaults.baseURL}${companySettings.logo_url}`} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-full h-full flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-0.5">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div><div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div><div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">{companySettings.company_name}</span>
                        <span className="text-xl font-black text-slate-800 tracking-tight sm:hidden">Siddhi</span>
                    </div>

                    {/* Mobile User Profile (Moved here for space efficiency on mobile) */}
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 uppercase">{user?.username || 'Admin'}</p>
                        </div>
                        <button onClick={() => logout()} className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Pill Navigation (Scrollable on Mobile) */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    <button onClick={() => { setActiveTab('dashboard'); scrollToTop(); }} className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>Overview</button>
                    {user?.role === 'admin' && activeTab === 'dashboard' && (
                        <>
                            <button onClick={scrollToRegister} className="px-5 py-2 rounded-full text-slate-500 font-semibold text-sm hover:bg-white hover:text-slate-700 transition-all whitespace-nowrap flex-shrink-0">Register</button>
                            <button onClick={scrollToReports} className="px-5 py-2 rounded-full text-slate-500 font-semibold text-sm hover:bg-white hover:text-slate-700 transition-all whitespace-nowrap flex-shrink-0">Compliance</button>
                        </>
                    )}
                    {user?.role === 'admin' && (
                        <>
                            <button onClick={() => setActiveTab('team')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}>Manage Team</button>
                            <button onClick={() => setIsProfileModalOpen(true)} className="px-5 py-2 rounded-full text-slate-500 font-semibold text-sm hover:bg-white hover:text-slate-700 transition-all whitespace-nowrap flex-shrink-0">Profile</button>
                        </>
                    )}
                    <button onClick={() => setIsScannerOpen(true)} className="px-5 py-2 rounded-full text-slate-500 font-semibold text-sm hover:bg-white hover:text-slate-700 transition-all whitespace-nowrap flex-shrink-0">Scan QR</button>
                </div>

                <div className="hidden md:flex items-center gap-4 ml-auto">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 uppercase">{user?.username || 'Admin'}</p>
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">{user?.role === 'admin' ? 'Super Admin' : 'Safety Inspector'}</p>
                    </div>
                    <button onClick={() => logout()} className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* 2. Header Section */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 mb-2">
                            {activeTab === 'dashboard' ? 'Inspection Summary' : 'Team Management'}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {activeTab === 'dashboard'
                                ? 'Real-time inspections and asset status overview.'
                                : 'Manage safety officers and system access.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live</span>
                    </div>
                </div>



                {/* Modals ... */}
                {/* ... existing modals ... */}

                {/* New User Modal */}
                {isUserModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">Create Authorized User</h3>
                            <form onSubmit={handleSubmitUser(handleCreateUser)} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                                    <input {...registerUser('username', { required: true })} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. officer_name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                                    <select {...registerUser('role')} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="inspector">Safety Inspector</option>
                                        <option value="admin">Admin Access</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                                    <input {...registerUser('password', { required: true })} type="password" className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Min 8 chars, 1 num, 1 special" />
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">Must include at least 1 number and 1 special character.</p>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                        {submitting ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {isResetModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">Reset Password</h3>
                            <p className="text-slate-500 font-medium mb-6">Updating password for <span className="text-blue-600 font-bold">{selectedUser?.username}</span></p>
                            <form onSubmit={handleSubmitReset(handleResetPassword)} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                    <input {...registerReset('password', { required: true })} type="password" className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Complexity required" />
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button type="button" onClick={() => setIsResetModalOpen(false)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                        {submitting ? 'Resetting...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* QR Code Print Modal */}
                {isQRModalOpen && selectedAssetForQR && (
                    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => setIsQRModalOpen(false)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <Plus className="rotate-45 h-5 w-5" />
                            </button>

                            <h3 className="text-2xl font-black text-slate-800 mb-1">{selectedAssetForQR.sl_no}</h3>
                            <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wider">{selectedAssetForQR.type} • {selectedAssetForQR.location}</p>

                            <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-inner inline-block mb-8">
                                <QRCodeGenerator value={`${window.location.origin}/extinguisher/${selectedAssetForQR.id}`} size={200} />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsQRModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        const printWindow = window.open('', '', 'width=600,height=600');
                                        if (printWindow) {
                                            printWindow.document.write(`
                                            <html>
                                                <head>
                                                    <title>Print QR - ${selectedAssetForQR.sl_no}</title>
                                                    <style>
                                                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                                                        h1 { font-size: 24px; margin-bottom: 5px; }
                                                        p { font-size: 14px; color: #666; margin-bottom: 20px; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <h1>${selectedAssetForQR.sl_no}</h1>
                                                    <p>${selectedAssetForQR.type} - ${selectedAssetForQR.location}</p>
                                                    <img 
                                                        src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/extinguisher/' + selectedAssetForQR.id)}" 
                                                        width="300" 
                                                        onload="window.print(); window.close();" 
                                                        onerror="alert('Failed to load QR code');"
                                                    />
                                                </body>
                                            </html>
                                        `);
                                            printWindow.document.close();
                                        }
                                    }}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-all"
                                >
                                    <span className="text-lg">🖨️</span> Print QR
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <div className="space-y-10">
                        {/* 3. Stats Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Left: Chart Placeholder (Increased Height) */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden min-h-[300px] flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-700">Inspection Volume</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Daily Trend</p>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-3xl font-black text-slate-800">{statsSummary.total.toLocaleString()}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${statsSummary.trend === 'up' ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                            {statsSummary.change >= 0 ? '+' : ''}{statsSummary.change}% vs Last Week
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full h-[250px] -ml-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData && chartData.length > 0 ? chartData : [{ name: 'No Data', value: 0 }]}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                                dy={10}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#3b82f6"
                                                strokeWidth={4}
                                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Right: Stats Column */}
                            <div className="space-y-6">
                                {/* Blue Gradient Card */}
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                                    <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-2">Total Active Assets</h3>
                                    <div className="text-6xl font-black mb-8">{totalAssets}</div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                            <span className="block text-[10px] text-blue-200 font-bold uppercase">Operational</span>
                                            <span className="text-xl font-bold">{operationalCount}</span>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm">
                                            <span className="block text-[10px] text-blue-200 font-bold uppercase">Pending</span>
                                            <span className="text-xl font-bold">{totalAssets - operationalCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Smaller White Stats */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3 text-red-500">
                                            <Flame className="h-5 w-5" />
                                        </div>
                                        <div className="text-2xl font-black text-slate-800">{criticalCount}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Issues</div>
                                    </div>
                                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3 text-orange-500">
                                            <QrCode className="h-5 w-5" />
                                        </div>
                                        <div className="text-2xl font-black text-slate-800">{scanRate}%</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scan Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* 4. Asset / Machine List */}
                        <div id="register-section" className="flex justify-between items-center mb-6 pt-10 border-t border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800">Registered Fire Extinguishers</h3>
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" /> Add Asset
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-[2rem] p-16 text-center border border-slate-100">
                                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500 font-medium">Loading Assets...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {extinguishers.map((ext) => (
                                    <div
                                        key={ext.id}
                                        onClick={() => router.push(`/extinguisher/${ext.id}`)}
                                        className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-100 transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <FireExtinguisher className="h-6 w-6" />
                                            </div>
                                            <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                <span className="text-xs font-bold text-slate-500">{ext.type}</span>
                                            </div>
                                        </div>

                                        {/* Serial & Location */}
                                        <div className="flex-grow">
                                            <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{ext.sl_no}</h3>
                                            <p className="text-sm font-medium text-slate-400 mb-6">{ext.location}</p>
                                        </div>

                                        {/* QR Code Display (Upfront) */}
                                        {/* QR Code Action */}
                                        <div className="mb-6 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                    <QrCode className="h-5 w-5 text-slate-700" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset QR</p>
                                                    <p className="text-xs font-bold text-blue-600">Scan to View</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedAssetForQR(ext); setIsQRModalOpen(true); }}
                                                className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                title="View & Print QR"
                                            >
                                                <QrCode className="h-5 w-5" />
                                            </button>
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={(e) => handleDeleteAsset(ext.id, ext.sl_no, e)}
                                                    className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm ml-2"
                                                    title="Delete Asset"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${(ext.status === 'Operational' || ext.last_inspection_status === 'Operational') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ext.status || ext.last_inspection_status || 'Pending'}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 5. Reports Section */}
                        {user?.role === 'admin' && (
                            <div id="reports-section" className="mt-16 pt-10 border-t border-slate-200">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-2">Compliance Reports</h3>
                                        <p className="text-slate-500 font-medium">Generate official reports for Safety Audits & Govt. Compliance.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PDF Report Card */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={handleDownloadPDF}>
                                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <FileText className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Main Safety Audit Report</h4>
                                        <p className="text-sm text-slate-400 mb-6">Standard 2A-Format compliance report including all active assets, inspection status, and due dates.</p>
                                        <span className="inline-flex items-center gap-2 text-red-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                                            Download PDF <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>

                                    {/* Excel Export Card */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={handleDownloadCSV}>
                                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                            <Download className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Inventory Export (Excel)</h4>
                                        <p className="text-sm text-slate-400 mb-6">Complete raw data export of all registered machinery and assets in CSV format for analysis.</p>
                                        <span className="inline-flex items-center gap-2 text-green-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                                            Download CSV <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>

                                    {/* Audit Log Export Card */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `${api.defaults.baseURL}/inspections/export`;
                                        link.setAttribute('download', 'audit_log.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    }}>
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Activity className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Export Activity Log</h4>
                                        <p className="text-sm text-slate-400 mb-6">Detailed history of all inspections including User ID, Device ID, timestamp, and actions.</p>
                                        <span className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                                            Download Log <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>

                                    {/* Safety Audit Report (CSV) Export Card */}
                                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer" onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `${api.defaults.baseURL}/inspections/export-csv`; // Use the new endpoint
                                        link.setAttribute('download', 'Safety_Audit_Report.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    }}>
                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                            <FileText className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Safety Audit Report (Excel)</h4>
                                        <p className="text-sm text-slate-400 mb-6">Download the official Annex H compliance report in CSV format for Excel.</p>
                                        <span className="inline-flex items-center gap-2 text-orange-600 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                                            Download CSV <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'team' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" /> Authorized Personnel
                            </h3>
                            <button
                                onClick={() => setIsUserModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                            >
                                <UserPlus className="h-4 w-4" /> Add Officer
                            </button>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-700">{u.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    onClick={() => { setSelectedUser(u); setIsResetModalOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                </button>
                                                {u.username !== user?.username && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.username)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                                        title="Remove User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGenerateLink(u.id)}
                                                    className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                                                    title="Generate Reset Link"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal & Overlays */}
                {isScannerOpen && (
                    <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md relative shadow-2xl">
                            <button onClick={() => setIsScannerOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full p-2 transition-colors">
                                <LogOut className="h-5 w-5" />
                            </button>
                            <h3 className="text-2xl font-black mb-8 text-center text-slate-800">Scan QR Code</h3>
                            <div className="overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-50">
                                <div id="reader" className="w-full"></div>
                            </div>
                            <p className="text-sm text-center text-slate-500 mt-6 font-bold">Align the QR code within the frame</p>
                        </div>
                    </div>
                )}

                {/* Register Modal (Simplified for New Style) */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">Register New Asset</h3>
                            <form onSubmit={handleSubmit(handleCreate)} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Serial Number</label>
                                    <input {...register('sl_no', { required: true })} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. SN-2024-001" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                                        <select {...register('type')} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="ABC">ABC Powder</option>
                                            <option value="CO2">CO2</option>
                                            <option value="Water">Water</option>
                                            <option value="Foam">Foam</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Capacity</label>
                                        <div className="flex gap-2">
                                            <input {...register('capacity')} defaultValue="6" className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Value" />
                                            <select {...register('capacity_unit')} className="bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="KG">KG</option>
                                                <option value="LTR">LTR</option>
                                                <option value="NOS">NOS</option>
                                                <option value="LBS">LBS</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                                    <input {...register('location')} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Main Lobby" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Make</label>
                                        <input {...register('make')} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brand" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mfg Year</label>
                                        <input {...register('year')} type="number" defaultValue={2024} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                    >
                                        {submitting ? 'Register' : 'Register'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Profile Update Modal */}
                {isProfileModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">Edit Company Profile</h3>
                            <form onSubmit={handleSubmitProfile(handleUpdateProfile)} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                                    <input {...registerProfile('company_name', { required: true })} className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company Logo</label>
                                    <input
                                        type="file"
                                        accept=".png, .jpg, .jpeg"
                                        {...registerProfile('logo')}
                                        className="block w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 font-medium">Supported formats: .png, .jpg, .jpeg</p>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsProfileModalOpen(false)}
                                        className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                    >
                                        {submitting ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Generated Link Modal */}
                {isLinkModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Secure Reset Link</h3>
                            <p className="text-slate-500 font-medium mb-6">Share this one-time link with the user. It expires in 1 hour.</p>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 break-all mb-6 font-mono text-sm text-slate-600">
                                {generatedLink}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedLink);
                                        alert("Copied to clipboard!");
                                    }}
                                    className="flex-1 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                >
                                    Copy Link
                                </button>
                                <button
                                    onClick={() => setIsLinkModalOpen(false)}
                                    className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
