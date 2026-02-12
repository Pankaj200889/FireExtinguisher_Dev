import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Printer, Search, ChevronLeft, Filter, Edit } from 'lucide-react';
import api from '../lib/api';

const AssetManagement = () => {
    const { type } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAssets = async () => {
        try {
            setLoading(true);

            // Determine if we need to filter by inspector
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            let url = '/assets';

            // Check role case-insensitively to ensure filter is applied
            if (user.role && user.role.toLowerCase() === 'inspector') {
                url += `?inspector_id=${user.id}`;
            }

            const res = await api.get(url);

            // Filter by type if needed
            const typeMap = {
                'fire-extinguisher': 'Fire Extinguisher',
                'hose-reel': 'Fire Hose Reel',
                'hydrant': 'Hydrant Hose Reel',
                'sand-bucket': 'Fire Sand Bucket'
            };
            const targetType = typeMap[type];

            const relevantAssets = res.data.filter(a => a.type === targetType);
            setAssets(relevantAssets);
            setFilteredAssets(relevantAssets);
        } catch (error) {
            console.error("Failed to fetch assets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [type]);

    useEffect(() => {
        let result = assets;

        // Apply Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.serial_number.toLowerCase().includes(lowerTerm) ||
                a.location.toLowerCase().includes(lowerTerm)
            );
        }

        // Apply Status Filter
        if (filterStatus !== 'All') {
            result = result.filter(a => a.status === filterStatus);
        }



        setFilteredAssets(result);
    }, [searchTerm, filterStatus, assets]);

    const handlePrintQR = (asset) => {
        // ALWAYS generate a fresh dynamic URL based on the current window location
        // This fixes issues where DB has old/invalid URLs or localhost/IP mismatches
        const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${window.location.origin}/v/${asset.serial_number}`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - ${asset.serial_number}</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                        h1 { margin: 0; font-size: 3rem; }
                        p { margin: 10px 0; font-size: 1.5rem; text-align: center; }
                        img { margin: 20px; border: 2px solid #000; padding: 10px; }
                        .meta { font-size: 1rem; color: #666; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <h1>${asset.serial_number}</h1>
                    <p>${asset.location}</p>
                    <img src="${qrSource}" width="250" height="250" />
                    <p class="meta">${asset.type}</p>
                    <script>
                        // Wait for image to load before printing
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const assetTypeLabel = type === 'sand-bucket' ? 'Fire Bucket' : type?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const getAssetTypeInfo = (asset) => {
        if (asset.type === 'Fire Hose Reel') return { label: 'Drum Type', value: asset.specifications?.drum_type || 'N/A' };
        if (asset.type === 'Hydrant Hose Reel') return { label: 'Coupling', value: asset.specifications?.coupling_type || 'N/A' };
        if (asset.type === 'Fire Extinguisher') return { label: 'Type', value: asset.specifications?.extinguisher_type || asset.type };
        if (asset.type === 'Fire Sand Bucket') return { label: 'Material', value: asset.specifications?.bucket_type || 'Sand' };
        return { label: 'Type', value: asset.type };
    };

    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            setUserRole(JSON.parse(user).role);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{assetTypeLabel} Management</h1>
                        <p className="text-gray-400 text-sm">Manage inventory and inspections</p>
                    </div>
                </div>
                {userRole === 'admin' && (
                    <button
                        onClick={() => navigate(`/assets/${type}/register`)}
                        className="px-6 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-brand-900/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Register New Asset
                    </button>
                )}
            </header>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by Serial Number, Location..."
                        className="w-full bg-slate-800 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-800 border border-gray-700 rounded-xl appearance-none hover:bg-slate-700 transition-colors outline-none cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Operational">Operational</option>
                        <option value="Maintenance Required">Maintenance Required</option>
                    </select>
                </div>
            </div>

            {/* Asset Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No assets found. {userRole === 'admin' ? 'Register one to get started.' : ''}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => (
                        <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 hover:border-brand-500/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${asset.status === 'Operational' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {asset.status}
                                </span>
                                <button
                                    onClick={() => handlePrintQR(asset)}
                                    title="Print QR"
                                    className="text-gray-500 hover:text-white transition-colors">
                                    <Printer className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-xl font-bold mb-1">{asset.serial_number}</h3>
                            <p className="text-gray-400 text-sm mb-4">{asset.location}</p>

                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex justify-between">
                                    <span>Last Inspection:</span>
                                    <span className="text-white">{asset.last_inspection_date ? new Date(asset.last_inspection_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{getAssetTypeInfo(asset).label}:</span>
                                    <span className="text-white">{getAssetTypeInfo(asset).value}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                <button
                                    onClick={() => navigate(`/assets/${type}/edit/${encodeURIComponent(asset.serial_number)}`)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                                    Details
                                </button>
                                {userRole === 'admin' && (
                                    <button
                                        onClick={() => navigate(`/assets/${type}/edit/${encodeURIComponent(asset.serial_number)}`)}
                                        className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                        title="Edit Details"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/inspection/${encodeURIComponent(asset.serial_number)}`)}
                                    className="flex-1 py-2 bg-brand-600/10 hover:bg-brand-600/20 text-brand-400 rounded-lg text-sm font-medium transition-colors">
                                    Inspect
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssetManagement;
