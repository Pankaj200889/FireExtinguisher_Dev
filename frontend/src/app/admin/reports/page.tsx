"use client";

import React, { useState } from 'react';
import api from '@/lib/api';
import { ArrowLeft, FileText, Table } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
    const router = useRouter();
    const [downloading, setDownloading] = useState("");

    const downloadReport = async (type: 'pdf' | 'excel') => {
        setDownloading(type);
        try {
            const response = await api.get(`/reports/export/${type}`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', type === 'pdf' ? `AnnexH_Register.pdf` : `Extinguisher_Data.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download report");
        } finally {
            setDownloading("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* PDF Card */}
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <FileText className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="ml-4 text-lg font-medium text-gray-900">Annex H Register</h3>
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">
                            Official compliant PDF format as per IS 2190:2024. Includes all extinguisher details formatted for audits.
                        </p>
                        <button
                            onClick={() => downloadReport('pdf')}
                            disabled={!!downloading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                            {downloading === 'pdf' ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>

                    {/* Excel Card */}
                    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Table className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="ml-4 text-lg font-medium text-gray-900">Excel Export</h3>
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">
                            Raw data export including all columns. Useful for custom analysis, filtering, and backup.
                        </p>
                        <button
                            onClick={() => downloadReport('excel')}
                            disabled={!!downloading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {downloading === 'excel' ? 'Generating...' : 'Download Excel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
