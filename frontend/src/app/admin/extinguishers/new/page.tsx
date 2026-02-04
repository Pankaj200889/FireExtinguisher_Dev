"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';

export default function NewExtinguisherPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const router = useRouter();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            // Combine Capacity
            const finalData = {
                ...data,
                capacity: `${data.capacity_value}${data.capacity_unit}`
            };

            const response = await api.post('/extinguishers/', finalData);
            const newId = response.data.id;

            // Fetch QR Code immediately
            const qrResponse = await api.get(`/extinguishers/${newId}/qr`, { responseType: 'blob' });
            const qrUrl = URL.createObjectURL(qrResponse.data);
            setQrCode(qrUrl);
        } catch (error) {
            console.error("Error creating extinguisher", error);
            if (axios.isAxiosError(error) && error.response) {
                alert(`Error: ${error.response.data.detail}`);
            } else {
                alert("Failed to create extinguisher. Ensure Sl No is unique.");
            }
        } finally {
            setLoading(false);
        }
    };

    const printQR = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && qrCode) {
            printWindow.document.write(`<img src="${qrCode}" onload="window.print()" />`);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Register New Extinguisher</h1>
                </div>

                {qrCode ? (
                    <div className="text-center py-10">
                        <div className="mb-4 text-green-600 font-medium text-lg">
                            Successfully Registered!
                        </div>
                        <img src={qrCode} alt="QR Code" className="mx-auto mb-6 border-4 border-black p-2" />
                        <div className="space-x-4">
                            <button
                                onClick={printQR}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                                <Printer className="-ml-1 mr-2 h-5 w-5" />
                                Print QR Code
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Register Another
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Serial Number (Sl No.)</label>
                                <input {...register('sl_no', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select {...register('type', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="ABC">ABC Powder</option>
                                    <option value="CO2">CO2</option>
                                    <option value="Water">Water</option>
                                    <option value="Foam">Foam</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <input
                                        {...register('capacity_value', { required: true })}
                                        type="number"
                                        step="0.1"
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="e.g. 6"
                                    />
                                    <select
                                        {...register('capacity_unit', { required: true })}
                                        className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="L">L</option>
                                        <option value="g">g</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Make</label>
                                <input {...register('make', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <input {...register('location', { required: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Year of Manufacture</label>
                                <select
                                    {...register('year_of_manufacture', { required: true, valueAsNumber: true })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => 2000 + i).reverse().map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {loading ? 'Registering...' : 'Register Extinguisher'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
