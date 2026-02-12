"use client";

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Download, Filter, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Extinguisher {
    id: string;
    sl_no: string;
    type: string;
    location: string;
    capacity?: string;
    make?: string;
    year_of_manufacture?: number;
    last_inspection_status?: string;
    next_service_due?: string;
    inspections?: Inspection[];
    last_inspection_date?: string;
    hydro_pressure_tested_on?: string;
    next_hydro_pressure_test_due?: string;
    last_inspector?: string;
    device_id?: string;
    image_url?: string; // Assuming we might have this, or get it from latest inspection
}

interface Inspection {
    inspection_type: string;
    inspection_date: string;
    inspector?: string;
    device_id?: string;
    pressure_tested_on?: string;
    date_of_discharge?: string;
    refilled_on?: string;
    due_for_refilling?: string;
    hydro_pressure_tested_on?: string;
    next_hydro_pressure_test_due?: string;
    remarks?: string;
    image_urls?: string[];
}

export default function ComplianceReports() {
    const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = () => {
        setLoading(true);
        api.get('/extinguishers/')
            .then(res => {
                setExtinguishers(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const filteredAssets = extinguishers.filter(ext =>
        ext.sl_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ext.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generateAnnexHPDF = async () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Loop through filtered assets to generate one page per asset
        for (let i = 0; i < filteredAssets.length; i++) {
            const ext = filteredAssets[i];

            if (i > 0) doc.addPage();

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

            // Asset Specific Header Info
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`Asset Number: ${ext.sl_no}  |  Location: ${ext.location}  |  Type: ${ext.type}`, 14, 42);

            // Table Data Construction (Similar to Dashboard but specific to this asset's history if needed, 
            // or just the single row summary as defined in the standard if that's what "Register" implies.
            // However, typical registers track history. We will show the summary row effectively.)

            const inspections = ext.inspections || [];

            // Helper to extract dates
            const getDates = (filterFn: (i: Inspection) => boolean, dateField: keyof Inspection) => {
                const dates = inspections
                    .filter(filterFn)
                    .map(i => i[dateField])
                    .filter(d => d)
                    .map(d => {
                        try {
                            return new Date(d as string).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        } catch { return '-'; }
                    });
                return [...new Set(dates)].join('\n') || '-';
            };

            const row = [
                ext.sl_no,
                ext.type,
                ext.capacity || '-',
                ext.year_of_manufacture || '-',
                ext.make || '-',
                ext.location,
                getDates(i => i.inspection_type === 'Monthly', 'inspection_date'),
                getDates(i => i.inspection_type === 'Quarterly', 'inspection_date'),
                getDates(i => i.inspection_type === 'Annual', 'inspection_date'),
                getDates(i => !!i.pressure_tested_on, 'pressure_tested_on'),
                getDates(i => !!i.date_of_discharge, 'date_of_discharge'),
                getDates(i => !!i.refilled_on, 'refilled_on'),
                getDates(i => !!i.due_for_refilling, 'due_for_refilling'),

                // Hydro Test Logic
                ext.hydro_pressure_tested_on ? new Date(ext.hydro_pressure_tested_on).toLocaleDateString('en-GB') : getDates(i => !!i.hydro_pressure_tested_on, 'hydro_pressure_tested_on'),
                ext.next_hydro_pressure_test_due ? new Date(ext.next_hydro_pressure_test_due).toLocaleDateString('en-GB') : getDates(i => !!i.next_hydro_pressure_test_due, 'next_hydro_pressure_test_due'),

                ext.last_inspection_status || '-',
                inspections.map(i => i.remarks).filter(Boolean).slice(0, 2).join(', ') || '-'
            ];

            autoTable(doc, {
                startY: 50,
                head: [[
                    'Sl', 'Type', 'Cap', 'Year', 'Make', 'Location',
                    'Monthly', 'Quarterly', 'Annual',
                    'Pressure\nTest', 'Date of\nDischarge', 'Refilled\nOn', 'Due for\nRefilling',
                    'Hydro\nTest', 'Next\nHydro', 'Status', 'Remarks'
                ]],
                body: [row], // Single row for this asset page
                theme: 'grid',
                headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 8, halign: 'center' },
                styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'center' },
                columnStyles: { 5: { cellWidth: 20 } } // Location width
            });

            // Add Photo if available
            // Check for latest inspection image
            const latestInspection = inspections[0]; // Assuming order is desc
            let imageUrl = ext.image_url;
            if (latestInspection && latestInspection.image_urls && latestInspection.image_urls.length > 0) {
                imageUrl = latestInspection.image_urls[0];
            }

            if (imageUrl) {
                try {
                    // We need to fetch the image to blob or base64 to add to PDF
                    // This might be blocked by CORS if not careful. 
                    // For now, we'll try adding it directly if supported or skip if it fails.
                    // doc.addImage(imageUrl, 'JPEG', 14, 100, 80, 60);

                    // Note: addImage requires Base64 or URL (if reliable). 
                    // Generating PDF client-side with remote images often requires pre-fetching.
                    // We will add a placeholder text for now to avoid breaking execution, 
                    // or attempt to add if it's a data URI.

                    // Simply noting the image presence for now as creating a proxy for images is complex here.
                    doc.text("Latest Inspection Photo:", 14, 90);
                    // doc.addImage(...) // Commented out to prevent CORS crash without proxy
                    doc.rect(14, 95, 80, 60); // Placeholder frame
                    doc.text("(Image Loading requires CORS/Base64)", 20, 125);

                } catch (e) {
                    console.error("Image add failed", e);
                }
            }

            // Notes Footer
            doc.setFontSize(8);
            doc.text("NOTES: 1. In remarks column fill details of date of operation...", 14, 190);
        }

        doc.save("Compliance_Report_Annex_H.pdf");
    };

    const generateDetailedCSV = () => {
        const headers = [
            "Asset Number", "Type", "Location", "Make",
            "Last Inspected By", "Last Inspected On", "Device ID",
            "Status", "Next Due"
        ];

        const rows = filteredAssets.map(ext => {
            const latest = ext.inspections && ext.inspections.length > 0 ? ext.inspections[0] : null;
            return [
                ext.sl_no,
                ext.type,
                ext.location,
                ext.make || '',
                latest?.inspector || ext.last_inspector || 'System',
                latest?.inspection_date ? new Date(latest.inspection_date).toLocaleString() : '',
                latest?.device_id || ext.device_id || '',
                ext.last_inspection_status || 'Pending',
                ext.next_service_due || ''
            ].map(f => `"${f}"`).join(','); // Quote fields
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <div className="text-center p-10">Loading Data...</div>;

    return (
        <div className="min-h-screen bg-[#F4F7FE] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.push('/admin/dashboard')} className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">Compliance Reports</h1>
                        <p className="text-slate-500 font-medium">Generate standard regulatory reports (Annex H).</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                        <div className="w-full md:w-1/2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Assets</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Asset Number or Location..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={generateDetailedCSV} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Export CSV
                            </button>
                            <button onClick={generateAnnexHPDF} className="px-6 py-3 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center gap-2">
                                <Download className="w-5 h-5" /> Generate PDF (Annex H)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-500" /> Report Preview ({filteredAssets.length} Assets)
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Asset No</th>
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Type</th>
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Location</th>
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Last Inspection</th>
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Inspector</th>
                                    <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.slice(0, 10).map(ext => (
                                    <tr key={ext.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-4 font-bold text-slate-800">{ext.sl_no}</td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">{ext.type}</td>
                                        <td className="py-4 px-4 font-medium text-slate-500">{ext.location}</td>
                                        <td className="py-4 px-4 font-medium text-slate-500">
                                            {ext.last_inspection_date ? new Date(ext.last_inspection_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-4 px-4 font-medium text-slate-500">{ext.last_inspector || '-'}</td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ext.last_inspection_status === 'Operational' ? 'bg-green-100 text-green-600' :
                                                ext.last_inspection_status === 'Maintenance Required' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {ext.last_inspection_status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredAssets.length === 0 && (
                            <div className="text-center py-10 text-slate-400 font-medium">No assets found matching your filter.</div>
                        )}
                        {filteredAssets.length > 10 && (
                            <div className="text-center py-6 text-slate-400 font-bold text-sm bg-slate-50/50 rounded-b-xl">
                                ...and {filteredAssets.length - 10} more assets included in report.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
