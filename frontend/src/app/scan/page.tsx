"use client";

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function QRScannerPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [scanResult, setScanResult] = useState<string | null>(null);

    // Refs to hold latest state for the scanner callback (avoid stale closures)
    const userRef = React.useRef(user);
    const isLoadingRef = React.useRef(isLoading);

    useEffect(() => {
        userRef.current = user;
        isLoadingRef.current = isLoading;
    }, [user, isLoading]);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render((decodedText, decodedResult) => {
            // Check if auth is still loading to prevent premature public redirect
            if (isLoadingRef.current) {
                console.log("Auth loading, ignoring scan...");
                return;
            }

            scanner.clear();
            setScanResult(decodedText);

            // Extract UUID
            let extinguisherId = decodedText;
            try {
                // Handle full URL "https://.../scan/123" OR "https://.../extinguisher/123"
                if (decodedText.startsWith('http')) {
                    const url = new URL(decodedText);
                    const pathParts = url.pathname.split('/');
                    // Filter out empty strings from split (e.g. start/end slashes)
                    const cleanParts = pathParts.filter(p => p.length > 0);
                    const possibleId = cleanParts[cleanParts.length - 1];
                    if (possibleId) extinguisherId = possibleId;
                }
            } catch (e) {
                console.log("Not a URL, using raw text");
            }

            const currentUser = userRef.current;
            const role = currentUser?.role?.toLowerCase();
            console.log("Scan Logic -> User Role (Lower):", role);

            // Force Hard Redirect to ensure fresh state
            if (role === 'admin' || role === 'inspector') {
                window.location.href = `/inspect/${extinguisherId}`;
            } else {
                window.location.href = `/extinguisher/${extinguisherId}`;
            }

        }, (error) => {
            // console.warn(error);
        });

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, [router]); // Only run once on mount (refs handle updates)

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
