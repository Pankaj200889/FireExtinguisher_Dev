import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Building2, Save, Upload } from 'lucide-react';
import api from '../lib/api';

const CompanyProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        address: '',
        contact_email: '',
        contact_phone: '',
        logo_url: ''
    });

    const fetchProfile = async () => {
        try {
            const res = await api.get('/company');
            setProfile(res.data);
        } catch (error) {
            console.error("Failed to fetch company profile", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/company', profile);
            alert('Company profile updated successfully');
        } catch (error) {
            console.error("Failed to update profile", error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);

        try {
            // Need to set Content-Type header to multipart/form-data, 
            // axios usually handles this automatically when passing FormData
            const res = await api.post('/company/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = res.data.logo_url;
            // setProfile(prev => ({ ...prev, logo_url: newUrl }));
            // alert('Logo uploaded: ' + newUrl); 
            // The user already sees it's not working, let's fix the URL logic instead of alerting.
            // If the URL is http but we are https (unlikely on localhost), or if it has backslashes...
            console.log('New Logo URL:', newUrl);
            setProfile(prev => ({ ...prev, logo_url: newUrl }));
            alert('Logo uploaded successfully');
        } catch (error) {
            console.error("Failed to upload logo", error);
            alert('Failed to upload logo');
        }
    };

    const getLogoUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        // Assuming backend serves uploads at root/uploads or similar
        // Since we didn't set up a proxy for uploads in vite config properly yet,
        // we might need to prepend backend URL. 
        // For now, let's assume relative path works if proxy is set, or prepend API base.
        return url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Company Profile</h1>
                    <p className="text-gray-400 text-sm">Manage organization details</p>
                </div>
            </header>

            <div className="max-w-2xl mx-auto">
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <label className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 relative overflow-hidden group cursor-pointer hover:border-brand-500 transition-colors">
                            {profile.logo_url ? (
                                <img src={getLogoUrl(profile.logo_url)} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-10 h-10 text-gray-500" />
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                        </label>
                        <p className="text-sm text-gray-400">Tap to update logo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleInputChange}
                                className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                            <textarea
                                name="address"
                                value={profile.address}
                                onChange={handleInputChange}
                                className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none h-24"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={profile.contact_email}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={profile.contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900 border border-gray-700 rounded-lg p-3 text-white focus:border-brand-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-500 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfile;
