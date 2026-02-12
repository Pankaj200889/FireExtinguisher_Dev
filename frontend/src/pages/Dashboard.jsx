import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Flame,
    Droplets,
    Waves,
    Box,
    FileText,
    Users,
    Building2,
    LogOut,
    QrCode
} from 'lucide-react';
import api from '../lib/api';

const StatCard = ({ label, value, color, isLoading }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className={`p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg`}
    >
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        {isLoading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse mt-1"></div>
        ) : (
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
        )}
    </motion.div>
);

const BigButton = ({ icon: Icon, label, color, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05, translateY: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative group overflow-hidden p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${color} shadow-xl flex flex-col items-center justify-center gap-4 h-48 w-full transition-all`}
    >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-inner">
            <Icon className="w-10 h-10 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide">{label}</span>
    </motion.button>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [loading, setLoading] = React.useState(true);
    const [assets, setAssets] = React.useState([]);
    const [selectedCategory, setSelectedCategory] = React.useState('All');

    // Stats State
    const [stats, setStats] = React.useState({ total: 0, operational: 0, attention: 0 });
    const [categoryStats, setCategoryStats] = React.useState({});
    const [overallHealth, setOverallHealth] = React.useState(0);
    const [company, setCompany] = React.useState(null);

    const [myStats, setMyStats] = React.useState(null);
    const isInspector = currentUser.role === 'inspector';

    React.useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [compRes, assetRes] = await Promise.all([
                    api.get('/company'),
                    api.get('/assets')
                ]);
                setCompany(compRes.data);
                setAssets(assetRes.data);

                if (isInspector) {
                    const statsRes = await api.get('/inspections/my-stats');
                    setMyStats(statsRes.data);
                }
            } catch (error) {
                console.error("Dashboard Load Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isInspector]);

    // Recalculate stats when assets or filter changes
    React.useEffect(() => {
        if (isInspector && myStats?.breakdown) {
            setCategoryStats(myStats.breakdown);
            const breakdown = myStats.breakdown;
            let totalInspections = 0;
            let totalPass = 0;
            Object.values(breakdown).forEach(item => {
                totalInspections += item.total || 0;
                totalPass += item.operational || 0;
            });
            // Set overall health based on inspections pass rate
            setOverallHealth(totalInspections === 0 ? 0 : Math.round((totalPass / totalInspections) * 100));
            return;
        }

        // CRITICAL: If I am an inspector, NEVER run the global logic below.
        if (isInspector) {
            // Ensure we at least show zeros if data hasn't loaded or is empty
            if (!myStats?.breakdown) {
                setCategoryStats({
                    'Fire Extinguisher': { total: 0, operational: 0, health: 0 },
                    'Fire Hose Reel': { total: 0, operational: 0, health: 0 },
                    'Hydrant Hose Reel': { total: 0, operational: 0, health: 0 },
                    'Fire Sand Bucket': { total: 0, operational: 0, health: 0 }
                });
                setOverallHealth(0);
            }
            return;
        }

        if (!assets.length) return;

        // Global Logic for Admin
        // 1. Filter based on selection
        const filtered = selectedCategory === 'All'
            ? assets
            : assets.filter(a => a.type === selectedCategory);

        // 2. Calculate Top-Level Card Stats (Global)
        const total = filtered.length;
        const operational = filtered.filter(a => a.status === 'Operational').length;
        const attention = total - operational;

        setStats({ total, operational, attention });

        // 3. Calculate Category Breakdown for Analytics
        const allCats = ['Fire Extinguisher', 'Fire Hose Reel', 'Hydrant Hose Reel', 'Fire Sand Bucket'];
        const activeCats = selectedCategory === 'All' ? allCats : [selectedCategory];

        const breakdown = {};
        let totalAssets = 0;
        let totalOps = 0;

        activeCats.forEach(type => {
            // Filter from the main assets list to get counts for this specific type
            const typeAssets = assets.filter(a => a.type === type);
            const count = typeAssets.length;
            const ops = typeAssets.filter(a => a.status === 'Operational').length;

            // Only add to breakdown if it exists or if we are in specific view (even if 0)
            if (count > 0 || selectedCategory !== 'All') {
                breakdown[type] = {
                    total: count,
                    operational: ops,
                    health: count === 0 ? 0 : Math.round((ops / count) * 100)
                };
                totalAssets += count;
                totalOps += ops;
            }
        });

        setCategoryStats(breakdown);
        // Overall health should reflect the visible/filtered set
        setOverallHealth(totalAssets === 0 ? 0 : Math.round((totalOps / totalAssets) * 100));

    }, [assets, selectedCategory, isInspector, myStats]);

    // Helper to ensure logo URL is complete
    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        // Fallback for relative paths: point to backend directly
        return `http://localhost:5000${url}`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    {company?.logo_url && (
                        <img
                            src={getLogoUrl(company.logo_url)}
                            alt="Logo"
                            className="w-12 h-12 rounded-full object-cover border-2 border-brand-500 shadow-lg shadow-brand-500/20"
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-orange-500">
                            {company?.name || 'IgnisGuard'}
                        </h1>
                        <p className="text-gray-400 text-sm">Command Center</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium">{currentUser.name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser.role || 'Access'}</p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>
            </header>

            {/* Dashboard Statistics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

                {/* 1. Main Stats Card (Dynamic based on Role) */}
                {isInspector ? (
                    <div className="order-2 lg:order-1 lg:col-span-2 bg-slate-800/50 border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <FileText className="w-64 h-64 -mr-16 -mt-16 text-brand-500" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <h3 className="text-gray-400 font-semibold tracking-wider text-sm uppercase">My Total Inspections</h3>
                                <div className="text-7xl font-bold mb-8 tracking-tight text-white">
                                    {loading || !myStats ? <div className="h-20 w-32 bg-white/10 animate-pulse rounded-xl"></div> : myStats.total}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Pass</p>
                                    <p className="text-2xl font-bold text-green-400">{myStats?.passed || 0}</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Fail</p>
                                    <p className="text-2xl font-bold text-red-500">{myStats?.failed || 0}</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Maint.</p>
                                    <p className="text-2xl font-bold text-yellow-500">{myStats?.maintenance || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 bg-slate-800/50 border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
                        {/* Background Pattern */}
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Flame className="w-64 h-64 -mr-16 -mt-16 text-brand-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-gray-400 font-semibold tracking-wider text-sm uppercase">Total Active Assets</h3>
                                    {/* Category Filter inside the card for context */}
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="bg-slate-900/50 border border-white/10 text-white text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2 outline-none cursor-pointer hover:bg-slate-900 transition-colors"
                                    >
                                        <option value="All" className="text-slate-900">All Categories</option>
                                        <option value="Fire Extinguisher" className="text-slate-900">Fire Extinguisher</option>
                                        <option value="Fire Hose Reel" className="text-slate-900">Fire Hose Reel</option>
                                        <option value="Hydrant Hose Reel" className="text-slate-900">Hydrant Hose Reel</option>
                                        <option value="Fire Sand Bucket" className="text-slate-900">Fire Bucket</option>
                                    </select>
                                </div>
                                <div className="text-7xl font-bold mb-8 tracking-tight text-white">
                                    {loading ? <div className="h-20 w-32 bg-white/10 animate-pulse rounded-xl"></div> : stats.total}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Operational</p>
                                    <p className="text-3xl font-bold text-green-400">{loading ? '-' : stats.operational}</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
                                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Attention Needed</p>
                                    <p className="text-3xl font-bold text-red-500">{loading ? '-' : stats.attention}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* 2. Side Card (Compliance for Admin, Summary for Inspector) */}
                {isInspector ? (
                    <div className="order-1 lg:order-2 bg-slate-800/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative">
                        <div className="w-24 h-24 mb-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                            <Users className="w-12 h-12 text-brand-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Inspector Profile</h3>
                        <p className="text-white text-lg font-medium mb-1">{currentUser.name}</p>
                        <p className="text-gray-400 text-sm mb-4">{currentUser.email}</p>
                        <div className="text-xs text-gray-500">
                            Keep up the good work! Ensure all inspections are accurate.
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative">
                        <div className="absolute top-4 right-4 text-gray-500">
                            <QrCode className="w-5 h-5 opacity-20" />
                        </div>
                        <div className="relative w-40 h-40 mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Track */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    className="stroke-slate-700 fill-none"
                                    strokeWidth="10"
                                />
                                {/* Progress */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    className={`fill-none transition-all duration-1000 ease-out ${overallHealth >= 90 ? 'stroke-green-500' : overallHealth >= 70 ? 'stroke-yellow-500' : 'stroke-red-500'}`}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray="283" // 2 * pi * 45 (approx 282.7)
                                    strokeDashoffset={283 - (283 * overallHealth) / 100}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white">{overallHealth}</span>
                                <span className="text-sm text-gray-400 -mt-1">%</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Compliance Score</h3>
                        <p className="text-gray-400 text-sm">
                            Real-time operational status of {selectedCategory === 'All' ? 'all' : 'displayed'} assets.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. Safety Health Overview (Full Width) */}
            <div className="mb-12 bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                    <h3 className="text-lg font-bold text-gray-200">
                        {isInspector ? 'My Performance Overview' : 'Category Health Overview'}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(categoryStats).length > 0 ? (
                        Object.entries(categoryStats).map(([type, data]) => (
                            <div key={type} className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-gray-400 text-sm font-medium">{type === 'Fire Sand Bucket' ? 'Fire Bucket' : type}</span>
                                    <span className={`text-sm font-bold ${data.health >= 90 ? 'text-green-400' : data.health >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {data.health}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-1000 ${data.health >= 90 ? 'bg-green-500' : data.health >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${data.health}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    {data.operational} / {data.total} {isInspector ? 'Pass' : 'Ops'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-4 text-center text-gray-500 py-4">No data available</div>
                    )}
                </div>
            </div>

            {/* The Big Four */}
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                Asset Management
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <BigButton
                    icon={Flame}
                    label="Fire Extinguisher"
                    color="from-red-600 to-orange-600"
                    onClick={() => navigate('/assets/fire-extinguisher')}
                />
                <BigButton
                    icon={Droplets}
                    label="Fire Hose Reel"
                    color="from-blue-600 to-cyan-600"
                    onClick={() => navigate('/assets/hose-reel')}
                />
                <BigButton
                    icon={Waves}
                    label="Hydrant System"
                    color="from-indigo-600 to-purple-600"
                    onClick={() => navigate('/assets/hydrant')}
                />
                <BigButton
                    icon={Box}
                    label="Fire Bucket"
                    color="from-yellow-600 to-amber-600"
                    onClick={() => navigate('/assets/sand-bucket')}
                />
            </div>

            {/* Navigation Grid */}
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-gray-500 rounded-full"></span>
                Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Available for Everyone (Admin & Inspector) */}
                <button
                    onClick={() => navigate('/scan')}
                    className="flex items-center gap-4 p-6 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-500/50 hover:bg-slate-800 transition-all group">
                    <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold">Scan QR Code</h3>
                        <p className="text-sm text-gray-500">Scan & Inspect Assets</p>
                    </div>
                </button>

                {/* Admin Only Features */}
                {currentUser?.role === 'admin' && (
                    <>
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center gap-4 p-6 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-500/50 hover:bg-slate-800 transition-all group">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold">User Management</h3>
                                <p className="text-sm text-gray-500">Manage roles & access</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/compliance')}
                            className="flex items-center gap-4 p-6 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-500/50 hover:bg-slate-800 transition-all group">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold">Compliance Reports</h3>
                                <p className="text-sm text-gray-500">Annex H & Exports</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/admin/company')}
                            className="flex items-center gap-4 p-6 rounded-xl bg-slate-800/50 border border-white/5 hover:border-brand-500/50 hover:bg-slate-800 transition-all group">
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold">Company Profile</h3>
                                <p className="text-sm text-gray-500">Settings & Logo</p>
                            </div>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
