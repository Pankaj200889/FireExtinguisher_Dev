"use client";

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function QRScannerPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render((decodedText, decodedResult) => {
            scanner.clear();
            setScanResult(decodedText);

            // Extract UUID from URL or Text
            let extinguisherId = decodedText;
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                // Assumes URL structure like /extinguisher/{uuid}
                const possibleId = pathParts[pathParts.length - 1];
                if (possibleId) extinguisherId = possibleId;
            } catch (e) {
                // Not a valid URL, assume raw UUID
                console.log("Not a URL, using raw text");
            }

            // Redirect Logic
            if (user?.role === 'admin' || user?.role === 'inspector') {
                // Go to INSPECTION page
                router.push(`/inspect/${extinguisherId}`);
            } else {
                // Go to PUBLIC STATUS page
                // If it was a full URL, we could just follow it, but router.push is safer for SPA
                router.push(`/extinguisher/${extinguisherId}`);
            }

        }, (error) => {
            // console.warn(error);
        });

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [router, user]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center mb-6">
                    <button onClick={() => router.back()} className="mr-4 text-gray-300 hover:text-white">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold">Scan QR Code</h1>
                </div>

                <div id="reader" className="w-full bg-white rounded-lg overflow-hidden text-black"></div>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    Align the QR code within the frame to scan.
                </p>

                {user?.role === 'admin' && (
                    <p className="mt-2 text-center text-xs text-gray-500">
                        Admin Mode Enabled
                    </p>
                )}
            </div>
        </div>
    );
}
