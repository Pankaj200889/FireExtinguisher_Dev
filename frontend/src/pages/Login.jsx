import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ChevronLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const api = (await import('../lib/api')).default;
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message || 'Login failed';
            setError(`Error ${status || 'Unknown'}: ${msg}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555685812-4b943f3e9942?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl z-10"
            >
                <button
                    onClick={() => navigate('/')}
                    className="text-gray-400 hover:text-white flex items-center gap-1 mb-8 text-sm transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Home
                </button>

                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-gray-400">Sign in to access your dashboard</p>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Email / Username</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Enter your email"
                                className="w-full bg-slate-800/50 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-600"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-brand-500 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-slate-800/50 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-600"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors">
                            <input type="checkbox" className="rounded bg-slate-800 border-gray-700 text-brand-600 focus:ring-brand-500" />
                            Remember me
                        </label>
                        <a href="#" className="text-brand-500 hover:text-brand-400 transition-colors">Forgot Password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-brand-900/20 transition-all transform active:scale-95"
                    >
                        Sign In
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
