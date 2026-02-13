import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Camera, CheckCircle, AlertTriangle, XCircle, Lock, Calendar, Save, Edit, AlertOctagon } from 'lucide-react';
import api from '../lib/api';
import { CHECKLISTS } from '../lib/checklists';
import CameraCapture from '../components/CameraCapture';

const InspectionForm = () => {
    const { id } = useParams(); // Treat as SERIAL NUMBER
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [asset, setAsset] = useState(null);
    const [lockStatus, setLockStatus] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Form State
    const [status, setStatus] = useState('Pass');
    const [findings, setFindings] = useState({});
    const [remarks, setRemarks] = useState('');
    const [photos, setPhotos] = useState([null, null]);

    // Camera State
    const [cameraOpen, setCameraOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(null);

    // Maintenance Dates (Editable)
    const [maintenance, setMaintenance] = useState({
        discharge_date: '',
        last_hydro_test_date: '',
        next_hydro_test_due: '',
        last_refilled_date: '',
        next_refill_due: ''
    });

    // Fetch Asset, Lock Status & potentially Edit Data
    useEffect(() => {
        const init = async () => {
            try {
                // Get User
                const userData = localStorage.getItem('user');
                if (userData) setCurrentUser(JSON.parse(userData));

                const resAsset = await api.get(`/assets/public/${encodeURIComponent(id)}`);
                const assetData = resAsset.data;
                setAsset(assetData);

                // Initialize maintenance dates from asset or defaults
                setMaintenance({
                    discharge_date: assetData.discharge_date || '',
                    last_hydro_test_date: assetData.last_hydro_test_date || '',
                    next_hydro_test_due: assetData.next_hydro_test_due || '',
                    last_refilled_date: assetData.last_refilled_date || '',
                    next_refill_due: assetData.next_refill_due || ''
                });

                const resLock = await api.get(`/inspections/check-lock/${encodeURIComponent(id)}`);
                setLockStatus(resLock.data);

                // Pre-fill if Edit Mode
                if (editId) {
                    try {
                        const resInsp = await api.get(`/inspections/${editId}`);
                        const insp = resInsp.data;
                        setStatus(insp.status);

                        if (insp.findings) {
                            const { remarks: rem, ...rest } = insp.findings;
                            setRemarks(rem || '');
                            setFindings(rest);
                        }

                        if (insp.evidence_photos && Array.isArray(insp.evidence_photos)) {
                            setPhotos([
                                insp.evidence_photos[0] || null,
                                insp.evidence_photos[1] || null
                            ]);
                        }
                    } catch (err) {
                        console.error("Failed to load inspection for editing", err);
                        // Fallback to fresh form is acceptable, or alert user
                    }
                }

            } catch (error) {
                console.error("Error loading inspection:", error);
                alert("Failed to load asset details. Invalid ID/Serial?");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, navigate, editId]);

    const handlePhotoCapture = async (file) => {
        if (!file || currentPhotoIndex === null) return;

        // Close camera immediately for better UX
        setCameraOpen(false);

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Show loading state for specific photo?
            // Simple approach: optimistically show local preview, then replace with server URL
            const previewUrl = URL.createObjectURL(file);
            const newPhotos = [...photos];
            newPhotos[currentPhotoIndex] = previewUrl;
            setPhotos(newPhotos);

            // Upload
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update with real server URL
            const serverUrl = res.data.url; // e.g., /uploads/filename.jpg
            newPhotos[currentPhotoIndex] = serverUrl;
            setPhotos(newPhotos);

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload photo");
            // Revert photo on error
            const newPhotos = [...photos];
            newPhotos[currentPhotoIndex] = null;
            setPhotos(newPhotos);
        } finally {
            setCurrentPhotoIndex(null);
        }
    };

    const openCamera = (index) => {
        setCurrentPhotoIndex(index);
        setCameraOpen(true);
    };

    const toggleFinding = (key) => {
        setFindings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleMaintenanceChange = (e) => {
        setMaintenance({ ...maintenance, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                asset_id: asset.id,
                status,
                findings: { ...findings, remarks },
                evidence_photos: photos.filter(p => p !== null),
                ...maintenance // Include maintenance dates updates
            };

            if (editId) {
                await api.put(`/inspections/${editId}`, payload);
                alert('Inspection updated successfully!');
            } else {
                await api.post('/inspections', payload);
                alert('Inspection submitted successfully!');
            }
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Submission failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const calculateNextDates = () => {
        if (!asset) return {};
        const today = new Date();
        const nextMonth = new Date(today); nextMonth.setMonth(today.getMonth() + 1);
        const nextQuarter = new Date(today); nextQuarter.setMonth(today.getMonth() + 3);
        const nextYear = new Date(today); nextYear.setFullYear(today.getFullYear() + 1);
        return {
            monthly: nextMonth.toLocaleDateString(),
            quarterly: nextQuarter.toLocaleDateString(),
            yearly: nextYear.toLocaleDateString()
        };
    };

    if (loading) return <div className="text-white text-center p-10">Loading...</div>;

    if (!asset) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Asset Not Found</h1>
                <p className="text-gray-400 mb-6">Could not load details for asset: {id}</p>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Admin Override Logic
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
    const lastInspectorId = lockStatus?.last_inspection?.inspector_id;
    const isSelfLocked = currentUser && lastInspectorId === currentUser.id;
    const isLocked = lockStatus?.locked;

    // Show Lock Screen if Locked AND (Not Admin OR Admin who inspected it)
    if (isLocked && (!isAdmin || isSelfLocked)) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Inspection Locked</h1>
                <p className="text-gray-400 mb-6 max-w-sm">
                    This asset was inspected recently by <span className="text-white font-bold">{lockStatus.last_inspection?.User?.name || 'an inspector'}</span>.
                    {isSelfLocked ? " You cannot inspect it again within 48 hours." : " Please wait before re-inspecting."}
                </p>
                <div className="bg-slate-800 p-4 rounded-xl mb-6 w-full max-w-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Unlock In</p>
                    <p className="text-3xl font-mono font-bold text-brand-400">{Math.ceil(lockStatus.remaining_hours)}h</p>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Back to Dashboard</button>
                    {/* Placeholder for Edit Last Inspection functionality */}
                    {isAdmin && (
                        <button onClick={() => alert("Edit functionality for past inspections coming soon!")} className="px-6 py-3 border border-slate-700 text-slate-400 hover:text-white rounded-xl flex items-center justify-center gap-2">
                            <Edit className="w-4 h-4" /> Edit Last Inspection
                        </button>
                    )}
                </div>
            </div>
        );
    }

    let checklistKey = asset?.type || 'Fire Extinguisher';
    if (asset?.type === 'Fire Sand Bucket' && asset.specifications?.bucket_type === 'Water') {
        checklistKey = 'Fire Water Bucket';
    }
    const currentChecklist = CHECKLISTS[checklistKey] || CHECKLISTS['Fire Extinguisher'];
    const nextDates = calculateNextDates();
    const showAdminBanner = isLocked && isAdmin && !isSelfLocked;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
            {cameraOpen && (
                <div className="fixed inset-0 z-50 bg-black">
                    <CameraCapture
                        onCapture={handlePhotoCapture}
                        onClose={() => setCameraOpen(false)}
                    />
                </div>
            )}

            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 py-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">New Inspection</h1>
            </header>

            {showAdminBanner && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-500 text-sm">Admin Override Active</h3>
                        <p className="text-xs text-yellow-200/80 mt-1">
                            This asset is currently locked for standard inspectors. As an admin, you can proceed with a new inspection.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">

                {/* Section 1: Asset Verification (Read Only) */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">1. Asset Verification</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="col-span-2 flex justify-between border-b border-white/5 pb-3 mb-2">
                            <span className="text-gray-400">
                                {asset.type === 'Fire Sand Bucket' ? 'Bucket No' :
                                    asset.type === 'Hydrant Hose Reel' ? 'Hydrant No' :
                                        asset.type === 'Fire Hose Reel' ? 'Hose Reel ID' : 'Asset Number'}
                            </span>
                            <span className="font-mono font-bold text-white text-lg">{asset.serial_number}</span>
                        </div>

                        {/* Fire Extinguisher Specifics */}
                        {(asset.type === 'Fire Extinguisher' || !asset.type) && (
                            <>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1">Type</span>
                                    <span className="font-semibold text-white">{asset.specifications?.extinguisher_type || '-'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-xs mb-1">Capacity</span>
                                    <span className="font-semibold text-white">{asset.capacity || asset.specifications?.capacity || '-'} {asset.unit || asset.specifications?.unit || ''}</span>
                                </div>
                            </>
                        )}

                        {/* Fire Hose Reel Specifics */}
                        {asset.type === 'Fire Hose Reel' && (
                            <>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1">Hose Length</span>
                                    <span className="font-semibold text-white">{asset.specifications?.hose_length || '-'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-xs mb-1">Drum Type</span>
                                    <span className="font-semibold text-white">{asset.specifications?.drum_type || '-'}</span>
                                </div>
                            </>
                        )}

                        {/* Hydrant Hose Reel Specifics */}
                        {asset.type === 'Hydrant Hose Reel' && (
                            <>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1">Hose Size</span>
                                    <span className="font-semibold text-white">{asset.specifications?.hose_size || '-'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-xs mb-1">Coupling</span>
                                    <span className="font-semibold text-white">{asset.specifications?.coupling_type || '-'}</span>
                                </div>
                            </>
                        )}

                        {/* Fire Sand Bucket Specifics */}
                        {asset.type === 'Fire Sand Bucket' && (
                            <>
                                <div>
                                    <span className="block text-gray-500 text-xs mb-1">Material</span>
                                    <span className="font-semibold text-white">{asset.specifications?.bucket_type || 'Sand'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-gray-500 text-xs mb-1">Capacity</span>
                                    <span className="font-semibold text-white">{asset.capacity || asset.specifications?.capacity || '-'} {asset.unit || asset.specifications?.unit || ''}</span>
                                </div>
                                <div className="mt-2">
                                    <span className="block text-gray-500 text-xs mb-1">Stand ID</span>
                                    <span className="font-semibold text-white">{asset.specifications?.stand_id || '-'}</span>
                                </div>
                                <div className="text-right mt-2">
                                    <span className="block text-gray-500 text-xs mb-1">Stand Cap.</span>
                                    <span className="font-semibold text-white">{asset.specifications?.stand_capacity || '-'} Buckets</span>
                                </div>
                            </>
                        )}

                        <div>
                            <span className="block text-gray-500 text-xs mb-1">Make</span>
                            <span className="font-semibold text-white">{asset.make || asset.specifications?.make || '-'}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-gray-500 text-xs mb-1">Mfg Year</span>
                            <span className="font-semibold text-white">{asset.mfg_year || asset.specifications?.mfg_year || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Installation & Maintenance (Editable) - Hidden for Sand Buckets */}
                {asset.type !== 'Fire Sand Bucket' && (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">2. Maintenance Data</h3>
                            </div>
                            <Edit className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white" />
                        </div>

                        <div className="space-y-6">
                            {(asset.type === 'Fire Hose Reel' || asset.type === 'Hydrant Hose Reel') ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Pressure Tested On</label>
                                        <input type="date" name="last_hydro_test_date" value={maintenance.last_hydro_test_date} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Next Pressure Test</label>
                                        <input type="date" name="next_hydro_test_due" value={maintenance.next_hydro_test_due} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Hose Replaced On</label>
                                        <input type="date" name="last_refilled_date" value={maintenance.last_refilled_date} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Next Hose Replacement</label>
                                        <input type="date" name="next_refill_due" value={maintenance.next_refill_due} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Date of Discharge</label>
                                        <input type="date" name="discharge_date" value={maintenance.discharge_date} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Hydro Pressure Tested On</label>
                                            <input type="date" name="last_hydro_test_date" value={maintenance.last_hydro_test_date} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Next Due Hydro Pressure Test</label>
                                            <input type="date" name="next_hydro_test_due" value={maintenance.next_hydro_test_due} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Refilled On</label>
                                            <input type="date" name="last_refilled_date" value={maintenance.last_refilled_date} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Due for Refilling</label>
                                            <input type="date" name="next_refill_due" value={maintenance.next_refill_due} onChange={handleMaintenanceChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-sm focus:border-brand-500 outline-none transition-colors" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Section 3: Inspection Dates (Read Only / Calculated) */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">3. Inspection Schedule</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                            {asset.type === 'Fire Sand Bucket' ? (
                                <>
                                    <span className="block text-gray-500 text-xs mb-1">Inspected On</span>
                                    <span className="font-semibold text-white">{new Date().toLocaleDateString('en-GB')}</span>
                                </>
                            ) : (
                                <>
                                    <span className="block text-gray-500 text-xs mb-1">Pressure Tested On</span>
                                    <span className="font-semibold text-white">{maintenance.last_hydro_test_date || '-'}</span>
                                </>
                            )}
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg text-right">
                            <span className="block text-gray-500 text-xs mb-1">Next Monthly</span>
                            <span className="font-semibold text-green-400">{nextDates.monthly}</span>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                            <span className="block text-gray-500 text-xs mb-1">Next Quarterly</span>
                            <span className="font-semibold text-white">{nextDates.quarterly}</span>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg text-right">
                            <span className="block text-gray-500 text-xs mb-1">Next Yearly</span>
                            <span className="font-bold text-white">{nextDates.yearly}</span>
                        </div>
                    </div>
                </div>

                {/* Section 4: Findings (Checklist) */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">4. {currentChecklist.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentChecklist.steps.map((step) => (
                            <div key={step.id} className="group">
                                <label className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-white transition-colors">
                                    {step.label}
                                </label>
                                {step.type === 'dropdown' ? (
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-900 border border-gray-700 rounded-xl p-3.5 text-base text-white focus:border-brand-500 outline-none appearance-none transition-colors cursor-pointer hover:border-gray-500"
                                            value={findings[step.id] || ''}
                                            onChange={(e) => setFindings(prev => ({ ...prev, [step.id]: e.target.value }))}
                                        >
                                            <option value="">Select Condition...</option>
                                            {step.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-between p-4 bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-900/80 transition-colors border border-gray-700/50">
                                        <span className="text-base text-gray-300">Pass / OK?</span>
                                        <input
                                            type="checkbox"
                                            checked={!!findings[step.id]}
                                            onChange={() => toggleFinding(step.id)}
                                            className="w-6 h-6 accent-brand-500 rounded focus:ring-brand-500"
                                        />
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 5: Inspection Findings & Status */}
                <div className="bg-slate-800/50 p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">5. Inspection Findings</h3>
                    </div>

                    <div className="space-y-6 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Inspection Type</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-900 border border-gray-700 rounded-xl p-3.5 text-base text-white focus:border-brand-500 outline-none appearance-none"
                                    value={findings.inspection_type || 'Routine'}
                                    onChange={(e) => setFindings(prev => ({ ...prev, inspection_type: e.target.value }))}
                                >
                                    <option value="Routine">Routine Inspection</option>
                                    <option value="Monthly">Monthly Inspection</option>
                                    <option value="Quarterly">Quarterly Inspection</option>
                                    <option value="Annual">Annual Maintenance</option>
                                    <option value="Surprise">Surprise Audit</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Observation Status</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => setStatus('Pass')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'Pass' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-900/20' : 'border-slate-700 bg-slate-900/50 text-gray-500 hover:border-gray-500'}`}>
                                    <CheckCircle className="w-8 h-8" /> <span className="text-xs font-bold">PASS</span>
                                </button>
                                <button type="button" onClick={() => setStatus('Fail')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'Fail' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-900/20' : 'border-slate-700 bg-slate-900/50 text-gray-500 hover:border-gray-500'}`}>
                                    <XCircle className="w-8 h-8" /> <span className="text-xs font-bold">FAIL</span>
                                </button>
                                <button type="button" onClick={() => setStatus('Maintenance')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${status === 'Maintenance' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-lg shadow-yellow-900/20' : 'border-slate-700 bg-slate-900/50 text-gray-500 hover:border-gray-500'}`}>
                                    <AlertTriangle className="w-8 h-8" /> <span className="text-xs font-bold">MAINT</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Additional Remarks</label>
                            <textarea placeholder="Enter any additional observations here..." className="w-full bg-slate-900 border border-gray-700 rounded-xl p-4 text-white text-base focus:border-brand-500 outline-none h-32 resize-none" value={remarks} onChange={(e) => setRemarks(e.target.value)}></textarea>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Evidence Photos (Max 2)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1].map((idx) => (
                            <div key={idx} className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors overflow-hidden ${photos[idx] ? 'border-green-500 bg-green-500/10' : 'border-gray-600 hover:border-gray-400 hover:bg-slate-800'}`}>
                                {photos[idx] ? (
                                    <>
                                        <img src={photos[idx].startsWith('http') ? photos[idx] : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photos[idx]}`} alt="Evidence" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                                            <CheckCircle className="w-10 h-10 text-green-500 shadow-xl" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newPhotos = [...photos];
                                                newPhotos[idx] = null;
                                                setPhotos(newPhotos);
                                            }}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full z-20 hover:bg-red-600"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => openCamera(idx)}
                                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
                                    >
                                        <Camera className="w-12 h-12 text-brand-500 mb-2" />
                                        <span className="text-sm text-brand-200 font-medium">Take Photo</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6">
                    <button type="submit" disabled={submitting} className="w-full py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold text-lg shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        {submitting ? 'Submitting...' : 'Submit Inspection'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-4">
                        By submitting, you confirm the accuracy of this inspection.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default InspectionForm;
