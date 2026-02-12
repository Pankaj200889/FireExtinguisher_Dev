import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Shield, Calendar, Clock, MapPin, Wrench, LogIn, Edit } from 'lucide-react';
import api from '../lib/api';

const PublicAssetView = () => {
    const { serial } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);
    const [showChecklist, setShowChecklist] = useState(false);

    useEffect(() => {
        // Check login status
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));

        // Fetch Asset
        const fetchAsset = async () => {
            try {
                const res = await api.get(`/assets/public/${encodeURIComponent(serial)}`);
                setAsset(res.data);
            } catch (err) {
                console.error("Error fetching asset:", err);
                setError(err.response?.data?.message || err.message || "Asset not found or invalid QR code.");
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [serial]);

    const handleLogin = () => {
        // Redirect to login, then back here
        navigate('/login', { state: { from: `/v/${serial}` } });
    };

    const handleInspect = () => {
        // Go to inspection form using the asset ID (or serial if that's how your route is set up)
        // Adjusting route to use Serial or ID as needed. Current App.jsx uses :id for InspectionForm
        // But let's check if the backend for inspection expects ID. Yes.
        // So we need to pass asset.id. 
        // Route path="/inspection/:id" element={<InspectionForm />} 
        navigate(`/inspection/${asset.serial_number}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Asset Details...</div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Invalid QR Code</h1>
            <p className="text-gray-500 mt-2">{error}</p>
            <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg">Go Home</button>
        </div>
    );



    // Mock generic checklist or fetch specific inspection findings if needed.
    // For now, if we have asset.Inspections[0], we technically have the data but it might need a separate fetch or field expansion if findings are JSON.
    // Assuming asset.Inspections[0].findings contains the checklist data.
    const lastInspection = asset?.Inspections?.[0];

    const handleViewChecklist = () => {
        if (!lastInspection) return alert("No inspection history available.");
        setShowChecklist(true);
    };

    const handleEditInspection = () => {
        if (!lastInspection) return;
        // Navigate to inspection form with edit mode params (or new route)
        // Since we are reusing InspectionForm, maybe pass state or query param
        // Simplest for now: Navigate to inspection form and maybe it detects "Edit" if we pass a param?
        // Or specific route: /inspection/:serial?edit=INSPECTION_ID
        navigate(`/inspection/${encodeURIComponent(asset.serial_number)}?edit=${lastInspection.id}`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Asset Details...</div>;

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Invalid QR Code</h1>
            <p className="text-gray-500 mt-2">{error}</p>
            <button onClick={() => navigate('/')} className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-lg">Go Home</button>
        </div>
    );

    const isOperational = asset.status === 'Operational';

    const getCapacityDetails = () => {
        if (asset.type === 'Fire Hose Reel') return { label: 'Hose Length', value: asset.specifications?.hose_length || 'N/A' };
        if (asset.type === 'Hydrant Hose Reel') return { label: 'Hose Size', value: asset.specifications?.hose_size || 'N/A' };
        // For Sand Bucket, show the bucket capacity (e.g. 9 KG or 9 Ltr)
        if (asset.type === 'Fire Sand Bucket') return {
            label: 'Capacity',
            value: `${asset.capacity || asset.specifications?.capacity || ''} ${asset.unit || asset.specifications?.unit || ''}`.trim() || 'N/A'
        };
        return { label: 'Capacity', value: `${asset.capacity || asset.specifications?.capacity || ''} ${asset.unit || asset.specifications?.unit || ''}`.trim() || 'N/A' };
    };
    const capDetails = getCapacityDetails();

    const getTypeLabel = () => {
        if (asset.type === 'Fire Hose Reel') return 'Drum Type';
        if (asset.type === 'Hydrant Hose Reel') return 'Coupling';
        if (asset.type === 'Fire Sand Bucket') return 'Material';
        return 'Type';
    };

    const getDisplayType = () => {
        if (asset.type === 'Fire Extinguisher') return asset.specifications?.extinguisher_type || asset.type;
        if (asset.type === 'Fire Hose Reel') return asset.specifications?.drum_type || 'N/A';
        if (asset.type === 'Hydrant Hose Reel') return asset.specifications?.coupling_type || 'N/A';
        if (asset.type === 'Fire Sand Bucket') return asset.specifications?.bucket_type || 'Sand';
        return asset.type;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 font-sans">
            <div className={`w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden ${showChecklist ? 'hidden' : ''}`}>
                {/* Header Status */}
                <div className={`p-8 text-center ${isOperational ? 'bg-green-600' : 'bg-red-600'} text-white relative`}>
                    <button onClick={() => navigate(-1)} className="absolute left-4 top-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    {isOperational ? (
                        <CheckCircle className="w-20 h-20 mx-auto mb-4 opacity-90" />
                    ) : (
                        <AlertTriangle className="w-20 h-20 mx-auto mb-4 opacity-90" />
                    )}
                    <h1 className="text-3xl font-bold tracking-tight">{asset.status.toUpperCase()}</h1>
                    <p className="mt-2 opacity-80">Serial: {asset.serial_number}</p>
                </div>

                {/* Details */}
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 text-gray-700">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{getTypeLabel()}:</span>
                        <span className="ml-auto font-bold">{getDisplayType()}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Location:</span>
                        <span className="ml-auto text-right w-1/2 break-words">{asset.location}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Make / Year</p>
                            <p className="font-semibold text-gray-800">{asset.make || asset.specifications?.make || 'N/A'} / {asset.mfg_year || asset.specifications?.mfg_year || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{capDetails.label}</p>
                            <p className="font-semibold text-gray-800">{capDetails.value}</p>
                        </div>
                    </div>

                    {/* History Card with "View Checklist" */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Latest Inspection</h3>
                            {lastInspection && (
                                <button
                                    onClick={handleViewChecklist}
                                    className="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                                >
                                    View Checklist
                                </button>
                            )}
                        </div>
                        <div className="flex items-start gap-4 mb-4">
                            <Calendar className="w-5 h-5 text-brand-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Last Inspected</p>
                                <p className="font-semibold text-gray-900">
                                    {asset.last_inspection_date ? new Date(asset.last_inspection_date).toLocaleDateString() : 'Never'}
                                </p>
                                {asset.Inspections && asset.Inspections[0]?.User?.name && (
                                    <p className="text-xs text-brand-600 font-medium mt-1">
                                        By: {asset.Inspections[0].User.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Next Service Due</p>
                                <p className="font-semibold text-gray-900">{asset.next_inspection_due ? new Date(asset.next_inspection_due).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 text-center space-y-3">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={handleInspect}
                                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all">
                                    <Wrench className="w-5 h-5" />
                                    New Inspection
                                </button>
                                {/* Edit Button (Admin Only) */}
                                {lastInspection && currentUser?.role === 'admin' && (
                                    <button
                                        onClick={handleEditInspection}
                                        className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                        <Wrench className="w-4 h-4" />
                                        Edit / Re-Submit (Correction)
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="text-brand-600 text-sm font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
                                <LogIn className="w-4 h-4" />
                                Officer Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Checklist View Modal or Overlay */}
            {showChecklist && lastInspection && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-lg text-gray-800">Inspection Checklist</h2>
                            <div className="flex items-center gap-2">
                                {isLoggedIn && currentUser?.role === 'admin' && (
                                    <button
                                        onClick={handleEditInspection}
                                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                                        title="Edit Inspection Record"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => setShowChecklist(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {/* Generic rendering of findings */}
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Result</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${lastInspection.status === 'Pass' || lastInspection.status === 'Operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {lastInspection.status}
                                    </span>
                                </div>

                                {lastInspection.findings && Object.entries(lastInspection.findings).map(([key, value]) => {
                                    if (key === 'remarks' || key === 'inspection_type') return null;
                                    return (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                            {typeof value === 'boolean' ? (
                                                value ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <span className="font-medium text-gray-800">{value}</span>
                                            )}
                                        </div>
                                    );
                                })}

                                {lastInspection.findings?.remarks && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Remarks</p>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic text-sm">"{lastInspection.findings.remarks}"</p>
                                    </div>
                                )}

                                {/* Photos */}
                                {lastInspection.evidence_photos && lastInspection.evidence_photos.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Evidence Photos</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {lastInspection.evidence_photos.map((photo, i) => (
                                                <img key={i} src={photo.startsWith('http') || photo.startsWith('/uploads') ? `http://localhost:5000${photo}` : photo} alt="Evidence" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center">
                <p className="text-brand-900 font-bold text-xl flex items-center justify-center gap-2">
                    <Shield className="w-6 h-6" /> IgnisGuard
                </p>
                <p className="text-gray-400 text-xs mt-2">Verified Safety Audit System</p>
            </div>
        </div>
    );
};

export default PublicAssetView;
