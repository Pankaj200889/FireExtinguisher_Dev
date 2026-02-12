import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Printer, Trash2 } from 'lucide-react';
import api from '../lib/api';

const AssetRegister = () => {
    const { type, serial } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [isEdit, setIsEdit] = useState(false);
    const [assetId, setAssetId] = useState(null);
    const [inspections, setInspections] = useState([]);

    // Format type for display and value
    const formattedType = type === 'sand-bucket' ? 'Fire Bucket' : type?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const dbTypeMap = {
        'fire-extinguisher': 'Fire Extinguisher',
        'hose-reel': 'Fire Hose Reel',
        'hydrant': 'Hydrant Hose Reel',
        'sand-bucket': 'Fire Sand Bucket'
    };

    const [formData, setFormData] = useState({
        serial_number: '',
        type: dbTypeMap[type] || 'Fire Extinguisher',
        location: '',
        installation_date: '',
        capacity: '',
        unit: 'KG', // Default
        make: '',
        mfg_year: new Date().getFullYear().toString(),
        hose_unit: 'Mtr', // Default for Hose Reel
    });

    const [userRole, setUserRole] = useState('');

    React.useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            setUserRole(parsedUser.role);
        }
    }, []);

    const canEdit = userRole === 'admin';

    // Populate data if Editing
    React.useEffect(() => {
        if (serial) {
            setIsEdit(true);
            setLoading(true);
            api.get(`/assets/public/${encodeURIComponent(serial)}`)
                .then(res => {
                    const data = res.data;
                    setAssetId(data.id);
                    setQrUrl(data.qr_code_url); // Keep existing QR for display

                    // Parse specifications to flat form
                    const specs = data.specifications || {};
                    let extraFields = { ...specs };

                    // Handle specific parsings
                    if (data.type === 'Fire Hose Reel' && specs.hose_length) {
                        const parts = specs.hose_length.split(' ');
                        extraFields.hose_length = parts[0];
                        extraFields.hose_unit = parts[1] || 'Mtr';
                    }

                    // For Sand Bucket capacity
                    // It uses core capacity/unit fields, but specs might have bucket_type

                    setFormData({
                        serial_number: data.serial_number,
                        type: data.type,
                        location: data.location || '',
                        installation_date: data.installation_date ? data.installation_date.split('T')[0] : '',
                        capacity: data.capacity || '',
                        unit: data.unit || 'KG',
                        make: data.make || '',
                        mfg_year: data.mfg_year || '',
                        ...extraFields
                    });
                })
                .catch(err => {
                    console.error("Fetch error", err);
                    alert("Could not load asset details");
                    navigate(`/assets/${type}`);
                })
                .finally(() => setLoading(false));
        }
    }, [serial, type, navigate]);

    // Fetch inspections when assetId is available
    React.useEffect(() => {
        if (assetId) {
            api.get(`/assets/${assetId}/inspections`)
                .then(res => setInspections(res.data))
                .catch(err => console.error("Error fetching inspections:", err));
        }
    }, [assetId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canEdit) {
            alert("You do not have permission to perform this action.");
            return;
        }

        if (isEdit && (!assetId || assetId === 'undefined')) {
            alert("Error: Asset ID is missing or invalid. Please reload the page.");
            return;
        }

        setLoading(true);
        try {
            // Map flat form to backend structure
            const specifications = {};
            if (type === 'fire-extinguisher') {
                specifications.extinguisher_type = formData.extinguisher_type;
            } else if (type === 'hose-reel') {
                specifications.hose_length = `${formData.hose_length} ${formData.hose_unit}`;
                specifications.drum_type = formData.drum_type;
            } else if (type === 'hydrant') {
                specifications.hose_size = formData.hose_size;
                specifications.coupling_type = formData.coupling_type;
                specifications.cabinet_type = formData.cabinet_type;
            } else if (type === 'sand-bucket') {
                specifications.bucket_type = formData.bucket_type || 'Sand';
                specifications.stand_id = formData.stand_id;
                specifications.stand_capacity = formData.stand_capacity;
            }

            const payload = {
                serial_number: formData.serial_number,
                type: formData.type,
                location: formData.location,
                installation_date: formData.installation_date,
                mfg_year: formData.mfg_year,
                make: formData.make,
                capacity: formData.capacity,
                unit: formData.unit,
                specifications: specifications
            };

            if (isEdit) {
                await api.put(`/assets/${assetId}`, payload);
                alert("Asset updated successfully!");
                navigate(`/assets/${type}`);
            } else {
                const res = await api.post('/assets', payload);
                setSuccess(true);
                setQrUrl(res.data.qr_code_url);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save asset: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 print:bg-white print:text-black print:p-0">
                <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-6 print:border-none print:shadow-none print:w-full print:max-w-none print:p-0">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto print:hidden">
                        <Save className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold print:hidden">Registration Successful!</h2>

                    {/* Print Content */}
                    <div className="print:flex print:flex-col print:items-center print:justify-center print:h-screen">
                        <div className="hidden print:block mb-4 text-center">
                            <h1 className="text-4xl font-bold mb-2">{formData.serial_number}</h1>
                            <p className="text-xl text-gray-600">{formData.location}</p>
                            <p className="text-sm text-gray-400 mt-1">{formData.type}</p>
                        </div>

                        <div className="p-4 bg-white rounded-xl mx-auto w-48 h-48 flex items-center justify-center print:w-64 print:h-64 print:border-4 print:border-black">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrUrl}`}
                                alt="QR Code"
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    <p className="text-gray-400 print:hidden">Asset {formData.serial_number} has been registered.</p>


                    <div className="flex gap-4 print:hidden">
                        <button onClick={() => window.print()} className="flex-1 py-3 bg-brand-600 rounded-xl font-semibold flex items-center justify-center gap-2">
                            <Printer className="w-5 h-5" /> Print QR
                        </button>
                        <button onClick={() => navigate(`/assets/${type}`)} className="flex-1 py-3 bg-slate-700 rounded-xl font-semibold">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(`/assets/${type}`)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{isEdit ? 'Edit Asset' : `Register New ${formattedType}`}</h1>
                    <p className="text-gray-400 text-sm">{isEdit ? 'Update details below' : 'Enter the specific details below'}</p>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    {type === 'sand-bucket' ? 'Bucket Number' :
                                        type === 'hydrant' ? 'Hydrant Serial No' :
                                            type === 'hose-reel' ? 'Hose Reel ID' : 'Serial Number'}
                                </label>
                                <input
                                    name="serial_number"
                                    required
                                    onChange={handleChange}
                                    value={formData.serial_number}
                                    className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                    placeholder={type === 'sand-bucket' ? "e.g. MCIMS/FB/WB/01" : "e.g. ID-123"}
                                    disabled={isEdit} // Prevent changing serial number on edit to allow consistent URLs
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                                <input name="location" required value={formData.location} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" placeholder="e.g. Server Room" />
                            </div>

                            {/* Make is common for most, but maybe not applied to Sand Bucket "Stand"? User said "Make/Brand" for Hose Reel. For Sand Bucket, didn't specify Make. I will keep it optional or label it generic. */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Make / Brand</label>
                                <input name="make" value={formData.make} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Installation Date</label>
                                <input name="installation_date" value={formData.installation_date} type="date" disabled={!canEdit} onChange={handleChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Mfg Year</label>
                                <input name="mfg_year" type="number" onChange={handleChange} value={formData.mfg_year} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" />
                            </div>

                            {/* Fire Extinguisher Specific */}
                            {type === 'fire-extinguisher' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Extinguisher Type</label>
                                        <select name="extinguisher_type" value={formData.extinguisher_type} disabled={!canEdit} onChange={handleChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                            <option value="">Select Type</option>
                                            <option value="ABC Powder">ABC Powder</option>
                                            <option value="CO2">CO2</option>
                                            <option value="Water">Water</option>
                                            <option value="Foam">Foam</option>
                                            <option value="Clean Agent">Clean Agent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Capacity</label>
                                        <div className="flex gap-2">
                                            <input name="capacity" type="number" value={formData.capacity} disabled={!canEdit} onChange={handleChange} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" placeholder="e.g. 5" />
                                            <select name="unit" value={formData.unit} onChange={handleChange} disabled={!canEdit} className="w-24 bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                                <option value="KG">KG</option>
                                                <option value="LTR">LTR</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Fire Hose Reel Specific */}
                            {type === 'hose-reel' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Hose Length</label>
                                        <div className="flex gap-2">
                                            <input
                                                name="hose_length"
                                                type="number"
                                                onChange={handleChange}
                                                value={formData.hose_length}
                                                disabled={!canEdit}
                                                className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                                placeholder="e.g. 30"
                                            />
                                            <select
                                                name="hose_unit"
                                                onChange={handleChange}
                                                value={formData.hose_unit}
                                                disabled={!canEdit}
                                                className="w-24 bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                            >
                                                <option value="Mtr">Mtr</option>
                                                <option value="Ft">Ft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Drum Type</label>
                                        <select name="drum_type" value={formData.drum_type} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                            <option value="">Select Drum Type</option>
                                            <option value="Fixed">Fixed</option>
                                            <option value="Automatic">Automatic</option>
                                            <option value="Swing-Arm">Swing-Arm</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Hydrant Hose Reel Specific */}
                            {type === 'hydrant' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Hose Size</label>
                                        <select name="hose_size" value={formData.hose_size} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                            <option value="">Select Size</option>
                                            <option value="63mm">63mm (Standard)</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Coupling Type</label>
                                        <select name="coupling_type" value={formData.coupling_type} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                            <option value="">Select Coupling</option>
                                            <option value="Instantaneous">Instantaneous</option>
                                            <option value="Threaded">Threaded</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Cabinet Type</label>
                                        <select name="cabinet_type" value={formData.cabinet_type} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50">
                                            <option value="">Select Cabinet</option>
                                            <option value="Wall Mounted">Wall Mounted</option>
                                            <option value="Post Mounted">Post Mounted</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Fire Sand Bucket Specific */}
                            {type === 'sand-bucket' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Material Type</label>
                                        <select
                                            name="bucket_type"
                                            value={formData.bucket_type}
                                            disabled={!canEdit}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    bucket_type: val,
                                                    unit: val === 'Sand' ? 'KG' : 'Ltr'
                                                }));
                                            }}
                                            className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                        >
                                            <option value="Sand">Sand</option>
                                            <option value="Water">Water</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Capacity</label>
                                        <div className="flex gap-2">
                                            <input
                                                name="capacity"
                                                type="number"
                                                value={formData.capacity}
                                                onChange={handleChange}
                                                disabled={!canEdit}
                                                className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                                placeholder="e.g. 9"
                                            />
                                            <select
                                                name="unit"
                                                value={formData.unit}
                                                onChange={handleChange}
                                                disabled={!canEdit}
                                                className="w-24 bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50"
                                            >
                                                <option value="KG">KG</option>
                                                <option value="Ltr">Ltr</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Stand ID</label>
                                        <input name="stand_id" value={formData.stand_id} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" placeholder="e.g. ST-01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">No. of Buckets on Stand</label>
                                        <input name="stand_capacity" type="number" value={formData.stand_capacity} onChange={handleChange} disabled={!canEdit} className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none disabled:opacity-50" placeholder="e.g. 4" />
                                    </div>
                                </>
                            )}
                        </div>

                        {canEdit && (
                            <div className="pt-6 flex gap-4">
                                {isEdit && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;
                                            setLoading(true);
                                            try {
                                                await api.delete(`/assets/${assetId}`);
                                                alert('Asset deleted successfully');
                                                navigate(`/assets/${type}`);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to delete asset');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold text-lg transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Delete
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold text-lg shadow-lg shadow-brand-900/40 transition-all">
                                    {loading ? (isEdit ? 'Updating...' : 'Registering...') : (isEdit ? 'Update Asset' : 'Complete Registration')}
                                </button>
                            </div>
                        )}
                        {!canEdit && isEdit && (
                            <div className="pt-6 text-center text-gray-500 italic">
                                Read-only mode: Only admins can edit asset details.
                            </div>
                        )}
                    </form>
                </div>

                {inspections.length > 0 && (
                    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 md:p-8">
                        <h2 className="text-xl font-bold mb-4">Inspection History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="text-xs uppercase bg-black/20 text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Inspector</th>
                                        <th className="px-4 py-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {inspections.map((insp) => (
                                        <tr key={insp.id} className="hover:bg-white/5">
                                            <td className="px-4 py-3">{new Date(insp.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${insp.status === 'Operational' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    {insp.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white">{insp.User?.name || 'Unknown'}</td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const f = insp.findings;
                                                    if (f && typeof f === 'object' && f.remarks) return f.remarks;
                                                    if (typeof f === 'string') return f;
                                                    return '-';
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetRegister;
