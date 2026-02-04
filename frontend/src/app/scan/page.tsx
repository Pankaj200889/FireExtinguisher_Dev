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

            // Logic to handle URL
            // Expected URL: https://app.com/extinguisher/{uuid}
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                // Logic: if URL is like /extinguishers/UUID, redirect there
                // We'll just assume the text IS the full URL
                window.location.href = decodedText;
            } catch (e) {
                // Not a URL? Maybe just UUID?
                console.log("Scanned text is not a URL:", decodedText);
                // If it's just a UUID, redirect manually
                router.push(`/extinguisher/${decodedText}`);
            }
        }, (error) => {
            // console.warn(error);
        });

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [router]);

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
