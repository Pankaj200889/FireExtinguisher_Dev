import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, AlertCircle } from 'lucide-react';

const QRScanner = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);

    useEffect(() => {
        const scannerId = "reader";

        // Cleanup previous instance if exists (safety check)
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const startScanning = async () => {
            try {
                // Use "environment" facing mode (Back Camera)
                // Prefer clean UI without controls
                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        // Success Callback
                        handleScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // Error Callback (ignore frame errors)
                    }
                );
                isScanningRef.current = true;
            } catch (err) {
                console.error("Camera access error:", err);
                setError("Camera permission denied or not supported.");
            }
        };

        const handleScanSuccess = async (decodedText) => {
            if (isScanningRef.current) {
                // Stop scanning immediately on success to prevent multiple triggers
                isScanningRef.current = false;
                try {
                    await html5QrCode.stop();
                    html5QrCode.clear(); // Clear the canvas
                } catch (ignore) { }

                // Determine destination
                let serial = decodedText;
                // If it's a full URL, parse it
                if (decodedText.includes('/v/')) {
                    const parts = decodedText.split('/v/');
                    if (parts.length > 1) {
                        serial = parts[1].split('?')[0]; // simple cleaning
                    }
                }

                // Navigate
                navigate(`/v/${encodeURIComponent(serial)}`);
            }
        };

        // Delay start slightly to ensure DOM is ready
        setTimeout(startScanning, 100);

        return () => {
            isScanningRef.current = false;
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
            }
        };
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-black text-white z-50 flex flex-col">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-lg font-semibold tracking-wide">Scan QR Code</h1>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Camera Viewport */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <div id="reader" className="w-full h-full object-cover"></div>

                {/* Visual Overlay Guidelines */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-brand-500 rounded-3xl relative animate-pulse shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-xl"></div>
                    </div>
                </div>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-8 text-center z-20">
                        <div>
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-lg font-medium">{error}</p>
                            <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold">Go Back</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Instructions */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-center z-10">
                <p className="text-gray-300 text-sm">Align the QR code within the frame to scan.</p>
            </div>
        </div>
    );
};

export default QRScanner;
