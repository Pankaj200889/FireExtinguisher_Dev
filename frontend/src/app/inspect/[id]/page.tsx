"use client";

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Camera, PenTool, CheckCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function InspectionPage() {
    const { register, handleSubmit } = useForm();
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [submitting, setSubmitting] = useState(false);
    const [lockError, setLockError] = useState<string | null>(null);

    // Gallery State
    const [gallery, setGallery] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Signature State
    const sigPad = useRef<SignatureCanvas>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (gallery.length + files.length > 6) {
                alert("Maximum 6 photos allowed");
                return;
            }

            const newPhotos = files.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setGallery(prev => [...prev, ...newPhotos]);
        }
    };

    const removePhoto = (index: number) => {
        setGallery(prev => prev.filter((_, i) => i !== index));
    };

    const clearSignature = () => {
        sigPad.current?.clear();
    };

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        setLockError(null);
        try {
            // 1. Upload Gallery Images
            const imageUrls: string[] = [];
            for (const item of gallery) {
                const formData = new FormData();
                formData.append('file', item.file);
                const uploadRes = await api.post('/upload/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrls.push(uploadRes.data.url);
            }

            // 2. Upload Signature
            let signatureUrl = "mock_signature.png";
            if (sigPad.current && !sigPad.current.isEmpty()) {
                const sigBlob = await new Promise<Blob | null>(resolve =>
                    sigPad.current?.getCanvas().toBlob(resolve, 'image/png')
                );

                if (sigBlob) {
                    const sigData = new FormData();
                    sigData.append('file', sigBlob, 'signature.png');
                    const sigRes = await api.post('/upload/', sigData);
                    signatureUrl = sigRes.data.url;
                }
            }

            const payload = {
                extinguisher_id: id,
                inspection_type: data.inspection_type,
                remarks: data.remarks,
                signature_path: signatureUrl,
                photo_path: imageUrls.length > 0 ? imageUrls[0] : null,
                image_urls: imageUrls,
                pressure_tested_on: data.pressure_tested_on ? new Date(data.pressure_tested_on).toISOString() : null,
                // ... map other Annex H fields
            };

            await api.post('/inspections/', payload);
            alert("Inspection Submitted Successfully!");
            router.push('/');
        } catch (error: any) {
            console.error("Submission failed", error);
            if (error.response?.status === 400 && error.response?.data?.detail?.includes("locked")) {
                setLockError(error.response.data.detail);
            } else {
                alert("Submission failed. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (lockError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Inspection Locked</h2>
                    <p className="text-gray-600">{lockError}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-6 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    <h1 className="text-lg font-bold text-gray-800">New Inspection</h1>
                    <p className="text-xs text-gray-500">Annex H Compliance Check</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Inspection Type</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input {...register('inspection_type')} type="radio" value="Quarterly" className="form-radio text-red-600" defaultChecked />
                                <span className="ml-2">Quarterly</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input {...register('inspection_type')} type="radio" value="Annual" className="form-radio text-red-600" />
                                <span className="ml-2">Annual</span>
                            </label>
                        </div>
                    </div>

                    {/* Gallery Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photo Gallery (Max 6)</label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {gallery.map((img, idx) => (
                                <div key={idx} className="relative aspect-square">
                                    <img src={img.preview} alt="preview" className="w-full h-full object-cover rounded-md border" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(idx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1 hover:bg-red-600"
                                    >
                                        <div className="h-3 w-3 flex items-center justify-center">x</div>
                                    </button>
                                </div>
                            ))}
                            {gallery.length < 6 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center aspect-square text-gray-400 hover:border-red-500 hover:text-red-500"
                                >
                                    <Camera className="h-6 w-6" />
                                    <span className="text-xs mt-1">Add</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                        />
                        <p className="text-xs text-gray-500">Capture Tube, Valve, Pressure Gauge, etc.</p>
                    </div>

                    {/* Annex H Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pressure Test Date</label>
                        <input {...register('pressure_tested_on')} type="date" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks (Mandatory)</label>
                        <textarea {...register('remarks', { required: true })} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border p-2" placeholder="Condition of seal, nozzle, etc."></textarea>
                    </div>

                    {/* Signature Section */}
                    <div className="border border-gray-300 rounded-lg p-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Inspector Signature</label>
                        <div className="border border-gray-200 bg-white shadow-inner">
                            <SignatureCanvas
                                ref={sigPad}
                                penColor='black'
                                canvasProps={{
                                    width: 300,
                                    height: 150,
                                    className: 'sigCanvas w-full h-40'
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={clearSignature}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                            Clear Signature
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Inspection'}
                    </button>
                </form>
            </div>
        </div>
    );
}
