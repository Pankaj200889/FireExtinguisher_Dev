"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, FileText, Download, Calendar, User, MapPin, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

interface InspectionDetail {
    id: string;
    extinguisher_id: string;
    inspector_id: string;
    inspection_date: string;
    inspection_type: string;

    // Checklist Items
    pressure_gauge_in_green: boolean;
    safety_pin_present: boolean;
    hose_nozzle_condition: boolean;
    body_corrosion_damage: boolean;
    qr_code_readable: boolean;

    // Dates & Status
    pressure_tested_on?: string;
    date_of_discharge?: string;
    refilled_on?: string;
    due_for_refilling?: string;
    hydro_pressure_tested_on?: string;
    next_hydro_pressure_test_due?: string;

    status: string;
    remarks?: string;
    photo_path?: string;

    // Relations
    extinguisher_sl_no?: string;
    extinguisher_location?: string;
    extinguisher_type?: string;
    inspector_username?: string;
}

export default function InspectionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [inspection, setInspection] = useState<InspectionDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.get(`/inspections/${id}`)
                .then(res => {
                    setInspection(res.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    alert("Failed to load inspection details");
                    setLoading(false);
                });
        }
    }, [id]);

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/inspections/${id}/pdf`, {
                responseType: 'blob', // Important
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inspection_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("PDF Download failed", error);
            alert("Failed to download PDF");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!inspection) return <div>Inspection not found</div>;

    return (
        <div className="min-h-screen bg-[#F4F7FE] font-sans text-slate-900 pb-20">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" /> Back
                </button>
                <h1 className="text-xl font-black text-slate-800">Inspection Details</h1>
                <div className="w-10"></div> {/* Spacer */}
            </nav>

            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* Header Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${inspection.status === 'Operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {inspection.status}
                            </span>
                            <span className="text-slate-400 font-mono text-xs">{inspection.id.slice(0, 8)}...</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-1">{inspection.inspection_type} Inspection</h2>
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(inspection.inspection_date).toLocaleString()}
                        </div>
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                        <Download className="h-5 w-5" /> Download Report
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Details */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Checklist */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" /> Checklist Verification
                            </h3>
                            <div className="space-y-4">
                                <ChecklistItem label="Pressure Gauge in Green" checked={inspection.pressure_gauge_in_green} />
                                <ChecklistItem label="Safety Pin Present" checked={inspection.safety_pin_present} />
                                <ChecklistItem label="Hose/Nozzle Condition" checked={inspection.hose_nozzle_condition} />
                                <ChecklistItem label="Body Corrosion/Damage" checked={!inspection.body_corrosion_damage} inverseLabel="No Body Corrosion/Damage" />
                                <ChecklistItem label="QR Code Readable" checked={inspection.qr_code_readable} />
                            </div>
                        </div>

                        {/* Critical Dates */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Service Dates Recorded</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <DateItem label="Refilled On" date={inspection.refilled_on} />
                                <DateItem label="Due for Refill" date={inspection.due_for_refilling} />
                                <DateItem label="Pressure Test" date={inspection.pressure_tested_on} />
                                <DateItem label="Hydro Test" date={inspection.hydro_pressure_tested_on} />
                                <DateItem label="Next Hydro Test" date={inspection.next_hydro_pressure_test_due} />
                                <DateItem label="Discharge Date" date={inspection.date_of_discharge} />
                            </div>
                        </div>

                        {/* Remarks */}
                        {inspection.remarks && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Inspector Remarks</h3>
                                <p className="text-slate-600 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    "{inspection.remarks}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Meta & Photo */}
                    <div className="space-y-8">

                        {/* Asset Info */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Asset Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{inspection.extinguisher_sl_no || 'Unknown SN'}</p>
                                    <p className="text-xs text-slate-500">Serial Number</p>
                                </div>
                                <div className="border-t border-slate-50 pt-4">
                                    <p className="text-sm font-bold text-slate-800">{inspection.extinguisher_type || 'Unknown Type'}</p>
                                    <p className="text-xs text-slate-500">Type</p>
                                </div>
                                <div className="border-t border-slate-50 pt-4">
                                    <p className="text-sm font-bold text-slate-800">{inspection.extinguisher_location || 'Unknown Location'}</p>
                                    <p className="text-xs text-slate-500">Location</p>
                                </div>
                            </div>
                        </div>

                        {/* Inspector Info */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Inspector</h4>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{inspection.inspector_username || 'System'}</p>
                                    <p className="text-xs text-slate-500">ID: {inspection.inspector_id.slice(0, 6)}...</p>
                                </div>
                            </div>
                        </div>

                        {/* Photo Evidence */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Photo Evidence</h4>
                            {inspection.photo_path ? (
                                <div className="rounded-xl overflow-hidden border border-slate-200">
                                    {inspection.photo_path.startsWith('http') ? (
                                        <img
                                            src={inspection.photo_path}
                                            alt="Inspection Evidence"
                                            className="w-full h-auto"
                                        />
                                    ) : (
                                        <div className="bg-slate-100 p-8 text-center text-slate-400 text-xs">
                                            Local File (Cannot Display)<br />
                                            {inspection.photo_path}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-400 font-medium">No photo attached</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

function ChecklistItem({ label, checked, inverseLabel }: { label: string, checked: boolean, inverseLabel?: string }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
            <span className="font-bold text-slate-700 text-sm">{inverseLabel && checked ? inverseLabel : label}</span>
            {checked ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
        </div>
    );
}

function DateItem({ label, date }: { label: string, date?: string }) {
    if (!date) return null;
    return (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{new Date(date).toLocaleDateString()}</p>
        </div>
    );
}
