import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 text-center space-y-8 px-4"
            >
                {/* Explicit inline style to force spacing */}
                <div style={{ marginBottom: '4rem', paddingTop: '2rem' }} className="flex justify-center">
                    <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
                        <ShieldCheck className="w-20 h-20 text-brand-500" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 pb-4 leading-tight drop-shadow-2xl">
                        IgnisGuard
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed mt-4">
                        Safety at your fingertips, Compliance in your pocket.
                    </p>

                    <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 backdrop-blur-sm mt-4">
                        v1.0.0 (MVP)
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="mt-12 px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white text-lg font-semibold rounded-xl shadow-lg shadow-brand-900/50 transition-all duration-300 flex items-center gap-2 mx-auto"
                >
                    <Flame className="w-5 h-5" />
                    Get Started
                </motion.button>
            </motion.div>

            <div className="absolute bottom-8 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} IgnisGuard Systems
            </div>
        </div>
    );
};

export default LandingPage;
