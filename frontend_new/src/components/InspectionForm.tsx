"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { Camera, ArrowLeft, Calendar, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useRouter } from 'next/navigation';

interface Extinguisher {
    id: string;
    sl_no: string;
    type: string;
    capacity: string;
    location: string;
    make?: string;
    year_of_manufacture?: number;
    last_inspection_date?: string;
}

interface InspectionFormProps {
    extinguisherId: string;
    extinguisherData?: Extinguisher; // Pass full data for "Frozen" fields
    onSuccess: () => void;
}

export default function InspectionForm({ extinguisherId, extinguisherData, onSuccess }: InspectionFormProps) {
    const { register, handleSubmit, watch, setValue } = useForm();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Watch inspection type to auto-calculate due date
    const inspectionType = watch("inspection_type");

    // Gallery State
    const [gallery, setGallery] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Signature State
    const sigPad = useRef<SignatureCanvas>(null);

    // Auto-calculate Next Service Due Date
    useEffect(() => {
        const today = new Date();
        let nextDue = new Date();

        if (inspectionType === "Monthly") {
            nextDue.setMonth(today.getMonth() + 1);
        } else if (inspectionType === "Quarterly") {
            nextDue.setMonth(today.getMonth() + 3);
        } else if (inspectionType === "Annual") {
            nextDue.setFullYear(today.getFullYear() + 1);
        }

        setValue("next_service_due", nextDue.toISOString().split('T')[0]);
    }, [inspectionType, setValue]);


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

    // Generate/Retrieve Device ID
    useEffect(() => {
        if (!localStorage.getItem('device_id')) {
            const newDeviceId = 'DEV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem('device_id', newDeviceId);
        }
    }, []);

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            // 1. Upload Gallery Images
            const imageUrls: string[] = [];
            for (const item of gallery) {
                const formData = new FormData();
                formData.append('file', item.file);
                try {
                    const res = await api.post('/upload/', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    imageUrls.push(res.data.url);
                } catch (e) {
                    console.error("Upload failed", e);
                }
            }

            // 2. Signature Placeholder
            let signatureUrl = "mock_signature.png";
            // if (sigPad.current && !sigPad.current.isEmpty()) { ... }

            const payload = {
                extinguisher_id: extinguisherId,
                inspection_type: data.inspection_type,
                observation: data.observation,
                remarks: data.remarks,

                // New Fields
                pressure_tested_on: data.pressure_tested_on ? new Date(data.pressure_tested_on).toISOString() : null,
                date_of_discharge: data.date_of_discharge ? new Date(data.date_of_discharge).toISOString() : null,
                refilled_on: data.refilled_on ? new Date(data.refilled_on).toISOString() : null,
                due_for_refilling: data.due_for_refilling ? new Date(data.due_for_refilling).toISOString() : null,
                hydro_pressure_tested_on: data.hydro_pressure_tested_on ? new Date(data.hydro_pressure_tested_on).toISOString() : null,
                next_hydro_pressure_test_due: data.next_hydro_pressure_test_due ? new Date(data.next_hydro_pressure_test_due).toISOString() : null,

                signature_path: signatureUrl,
                photo_path: imageUrls.length > 0 ? imageUrls[0] : null,
                image_urls: imageUrls,
                next_service_due: data.next_service_due ? new Date(data.next_service_due).toISOString() : null,
                device_id: localStorage.getItem('device_id')
            };

            await api.post('/inspections/', payload);
            alert("Inspection Submitted Successfully!");
            onSuccess();
        } catch (error: any) {
            console.error("Submission failed", error);
            alert("Submission failed. Check console for details.");
        } finally {
            setSubmitting(false);
        }
    };

    // Manual Refill Date - Removed Auto Calculation per User Request

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">

            {/* 1. Asset Details */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" /> Asset Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Serial No</span>
                        <span className="text-lg md:text-xl font-black text-slate-800 break-all">{extinguisherData?.sl_no || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Type</span>
                        <span className="text-lg md:text-xl font-black text-slate-800">{extinguisherData?.type || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Capacity</span>
                        <span className="text-lg md:text-xl font-black text-slate-800">{extinguisherData?.capacity || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Make / Year</span>
                        <span className="text-lg md:text-xl font-black text-slate-800">{extinguisherData?.make || 'Gen'} / {extinguisherData?.year_of_manufacture || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* 2. Inspection Findings */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" /> Inspection Findings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inspection Type</label>
                        <div className="relative group">
                            <select
                                {...register("inspection_type")}
                                className="w-full bg-slate-50 border border-slate-200 px-5 py-4 text-lg text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-all"
                                defaultValue="Monthly"
                            >
                                <option value="Monthly">Monthly Inspection</option>
                                <option value="Quarterly">Quarterly Inspection</option>
                                <option value="Annual">Yearly Inspection</option>
                            </select>
                            <Calendar className="absolute right-4 top-4.5 h-6 w-6 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Observation Status</label>
                        <div className="relative group">
                            <select
                                {...register("observation")}
                                className="w-full bg-slate-50 border border-slate-200 px-5 py-4 text-lg text-slate-800 font-bold rounded-xl pl-12 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                defaultValue="Ok"
                            >
                                <option value="Ok">Routine Check - OK</option>
                                <option value="Not Ok">Issue Found - Not OK</option>
                                <option value="Refill Needed">Refill Needed</option>
                            </select>
                            <CheckCircle className="absolute left-4 top-4.5 h-6 w-6 text-green-500 pointer-events-none group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Remarks</label>
                    <textarea
                        {...register("remarks")}
                        className="w-full bg-slate-50 border border-slate-200 px-5 py-4 text-base text-slate-800 min-h-[120px] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Describe any observations, damages, or specific actions taken..."
                    ></textarea>
                </div>
            </div>

            {/* 3. Evidence Photos */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <label className="block text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-blue-600" /> Evidence Photos
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{gallery.length}/6</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gallery.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
                            <img src={img.preview} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                            <button
                                type="button"
                                onClick={() => removePhoto(idx)}
                                className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                    {gallery.length < 6 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group"
                        >
                            <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:shadow-md transition-shadow">
                                <Camera className="h-6 w-6 text-blue-400 group-hover:text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest group-hover:text-blue-600">Add Photo</span>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleFileSelect}
                />
            </div>

            {/* 4. Technical Dates Section */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Calendar className="h-6 w-6 text-slate-400" /> Inspections' Dates
                </h3>

                {/* Input Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Pressure Tested On</label>
                        <input {...register('pressure_tested_on')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Date of Discharge</label>
                        <input {...register('date_of_discharge')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Refilled On</label>
                        <input {...register('refilled_on')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Due for Refilling</label>
                        <input {...register('due_for_refilling')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                </div>

                {/* Hydro Pressure Test Section (New) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pt-4 border-t border-slate-50">
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Hydro Pressure Tested On</label>
                        <input {...register('hydro_pressure_tested_on')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block group-focus-within:text-blue-600 transition-colors">Next Due Hydro Test</label>
                        <input {...register('next_hydro_pressure_test_due')} type="date" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                </div>

                {/* Frozen Calculated Schedules */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Next Inspections Schedule
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative pt-2">
                            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block absolute -top-1 left-3 bg-white px-2 rounded-full border border-blue-100 shadow-sm z-10">Next Monthly</label>
                            <input
                                readOnly
                                value={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}
                                className="w-full px-4 py-3 text-lg font-black text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm"
                            />
                        </div>
                        <div className="relative pt-2">
                            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block absolute -top-1 left-3 bg-white px-2 rounded-full border border-blue-100 shadow-sm z-10">Next Quarterly</label>
                            <input
                                readOnly
                                value={new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]}
                                className="w-full px-4 py-3 text-lg font-black text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm"
                            />
                        </div>
                        <div className="relative pt-2">
                            <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block absolute -top-1 left-3 bg-white px-2 rounded-full border border-blue-100 shadow-sm z-10">Next Yearly</label>
                            <input
                                readOnly
                                value={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                                className="w-full px-4 py-3 text-lg font-black text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Input for Logic Binding */}
            <input {...register('next_service_due')} type="hidden" />

            {/* 5. Inspector Signature & Action Buttons (Combined Bottom Card) */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <label className="block text-base font-bold text-slate-800 mb-6">Inspector Signature</label>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 relative mb-8 hover:bg-slate-50 hover:border-slate-300 transition-colors" style={{ height: 180 }}>
                    <SignatureCanvas
                        ref={sigPad}
                        canvasProps={{ className: 'w-full h-full' }}
                        backgroundColor="rgba(255,255,255,0)"
                    />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-300 pointer-events-none select-none flex flex-col items-center">
                        <span className="text-4xl opacity-50">✍️</span>
                        <span className="text-sm font-bold mt-2 text-slate-400">Sign within the box</span>
                    </div>
                    <button
                        type="button"
                        onClick={clearSignature}
                        className="absolute bottom-4 right-4 text-xs font-bold text-red-500 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                        Clear Signature
                    </button>
                </div>

                <div className="flex flex-col-reverse md:flex-row gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="py-4 px-8 border border-slate-200 rounded-xl text-slate-600 font-bold text-lg hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2 w-full md:w-auto md:min-w-[160px]"
                    >
                        <ArrowLeft className="h-5 w-5" /> Go Back
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl py-4 px-8 text-xl font-bold flex items-center justify-center shadow-lg shadow-orange-200 transform active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                Submit Inspection <CheckCircle className="ml-3 h-6 w-6" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
