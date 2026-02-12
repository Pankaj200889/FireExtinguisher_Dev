import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // Default to back camera

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [facingMode]);

    const startCamera = async () => {
        stopCamera();
        try {
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        // Mirror if front camera? usually environment is not mirrored.
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            {/* Header / Close */}
            <div className="absolute top-4 right-4 z-10">
                <button onClick={() => { stopCamera(); onClose(); }} className="p-3 bg-black/50 rounded-full text-white hover:bg-black/70">
                    <X className="w-8 h-8" />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white px-4">
                    <p className="text-red-500 font-bold text-xl mb-4">{error}</p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 rounded-lg">Close</button>
                </div>
            )}

            {/* Viewfinder */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover" // object-cover for full screen immersive feel
                    onLoadedMetadata={() => videoRef.current.play()}
                />

                {/* Switch Camera Button */}
                <button
                    onClick={switchCamera}
                    className="absolute top-4 left-4 p-3 bg-black/40 rounded-full text-white backdrop-blur-sm"
                >
                    <RefreshCw className="w-6 h-6" />
                </button>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center">
                <button
                    onClick={takePhoto}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 active:scale-95 transition-transform shadow-lg shadow-black/50"
                >
                    <div className="w-16 h-16 bg-white rounded-full"></div>
                </button>
            </div>
        </div>
    );
};

export default CameraCapture;
