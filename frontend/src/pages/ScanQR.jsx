import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const QRScanner = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText, decodedResult) => {
                scanner.clear();
                setScanResult(decodedText);
                // Handle full URL: https://domain/v/SERIAL -> Extract SERIAL
                // Handle raw ID: SERIAL
                let serial = decodedText;
                if (decodedText.includes('/v/')) {
                    serial = decodedText.split('/v/')[1];
                }

                // Encode serial to handle special characters (e.g., "/")
                navigate(`/v/${encodeURIComponent(serial)}`);
            },
            (errorMessage) => {
                // ignore errors during scanning
            }
        );

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4">
            <header className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Scan QR Code</h1>
            </header>
            <div className="max-w-md mx-auto bg-white rounded-xl overflow-hidden p-4 text-black">
                <div id="reader" width="100%"></div>
                <p className="text-center mt-4 text-sm text-gray-500">
                    Point camera at the Fire Extinguisher QR Code
                </p>
            </div>
        </div>
    );
};

export default QRScanner;
