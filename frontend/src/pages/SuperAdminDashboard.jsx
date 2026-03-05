import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Building2, ShieldCheck, Search, Plus, Trash2, ShieldAlert } from 'lucide-react';
import api from '../lib/api';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        companyName: '',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    useEffect(() => {
        if (currentUser.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/superadmin/companies');
            setCompanies(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch companies:", error);
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            await api.post('/superadmin/companies', formData);
            alert('Company & Admin created successfully!');
            setShowCreateModal(false);
            setFormData({ companyName: '', subdomain: '', adminName: '', adminEmail: '', adminPassword: '' });
            fetchCompanies();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create company');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this company?`)) return;
        try {
            await api.put(`/superadmin/companies/${id}/status`, { is_active: !currentStatus });
            fetchCompanies();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="text-white text-center mt-20">Loading Super Admin...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-slate-800/50 p-6 rounded-2xl border border-pink-500/20 shadow-lg shadow-pink-500/10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/20 rounded-lg border border-pink-500/50">
                        <ShieldAlert className="w-8 h-8 text-pink-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-500">
                            Super Admin Console
                        </h1>
                        <p className="text-pink-200/50 text-sm">Tenant & Software Control</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-white/10"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-96 pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white outline-none focus:border-pink-500 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    New Tenant Company
                </button>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map(company => (
                    <div key={company.id} className="bg-slate-800/80 border border-white/10 rounded-2xl p-6 hover:border-pink-500/50 transition-colors shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold">
                                        {company.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg">{company.name}</h3>
                                    <p className="text-xs text-brand-400">{company.subdomain}.siddhiss.com</p>
                                </div>
                            </div>
                            <button
                                onClick={() => toggleStatus(company.id, company.is_active)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${company.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/20'}`}
                            >
                                {company.is_active ? 'Active' : 'Suspended'}
                            </button>
                        </div>
                        <div className="text-sm text-gray-400 mt-4 border-t border-white/5 pt-4">
                            <p>Created: {new Date(company.createdAt).toLocaleDateString()}</p>
                            <p>Contact: {company.contact_email || 'Not Provided'}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">Provision New Tenant</h2>
                        <form onSubmit={handleCreateCompany} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                                <input required type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-brand-500" placeholder="e.g. TGMIN-BW2" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Subdomain Name</label>
                                <div className="flex items-center">
                                    <input required type="text" value={formData.subdomain} onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })} className="w-full bg-slate-800 p-3 rounded-l-xl border border-white/10 border-r-0 text-white outline-none focus:border-brand-500 text-right" placeholder="bw2" />
                                    <span className="bg-slate-700 p-3 rounded-r-xl border border-white/10 border-l-0 text-gray-400">.siddhiss.com</span>
                                </div>
                            </div>
                            <div className="border-t border-white/10 my-4 pt-4">
                                <h3 className="text-sm font-semibold text-brand-400 mb-3">Initial Admin Setup</h3>
                                <input required type="text" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-brand-500 mb-4" placeholder="Admin Full Name" />
                                <input required type="email" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-brand-500 mb-4" placeholder="Admin Email" />
                                <input required type="password" value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} className="w-full bg-slate-800 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-brand-500" placeholder="Temporary Password" />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-pink-600 to-red-600 rounded-xl text-white font-bold tracking-wide hover:opacity-90 shadow-lg">Provision System</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
