import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Filter, Trash2, Edit, Key, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'inspector' });

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleGenerateLink = async (id) => {
        try {
            const res = await api.post(`/auth/reset-link/${id}`);
            setGeneratedLink(res.data.resetUrl);
            setShowLinkModal(true);
            setCopied(false);
        } catch (error) {
            alert('Failed to generate link: ' + (error.response?.data?.message || error.message));
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', newUser);
            setShowAddModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'inspector' });
            fetchUsers();
            alert('User added successfully');
        } catch (error) {
            alert('Failed to add user: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 relative">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">User Management</h1>
                        <p className="text-gray-400 text-sm">Control access and roles</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full md:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg transition-all">
                    <UserPlus className="w-5 h-5" />
                    Add User
                </button>
            </header>

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Password Reset Link</h2>
                        <p className="text-gray-400 text-sm mb-4">Share this link with the user. It will expire in 24 hours.</p>

                        <div className="bg-slate-900 p-4 rounded-lg border border-gray-700 flex items-center gap-2 mb-6 break-all">
                            <code className="text-brand-400 text-sm flex-1">{generatedLink}</code>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLinkModal(false)}
                                className="flex-1 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-green-600 hover:bg-green-500' : 'bg-brand-600 hover:bg-brand-500'}`}
                            >
                                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Link</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <input
                                placeholder="Full Name"
                                required
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                className="w-full bg-slate-900 p-3 rounded-lg border border-gray-700 text-white"
                            />
                            <input
                                placeholder="Email"
                                type="email"
                                required
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full bg-slate-900 p-3 rounded-lg border border-gray-700 text-white"
                            />
                            <input
                                placeholder="Password"
                                type="password"
                                required
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                className="w-full bg-slate-900 p-3 rounded-lg border border-gray-700 text-white"
                            />
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full bg-slate-900 p-3 rounded-lg border border-gray-700 text-white"
                            >
                                <option value="inspector">Inspector</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-700 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-brand-600 rounded-lg font-semibold">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel rounded-2xl overflow-hidden p-1">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-sm uppercase">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Loading users...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-sm text-gray-300">Active</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleGenerateLink(user.id)}
                                            title="Generate Reset Link"
                                            className="p-2 hover:bg-brand-500/20 rounded-lg text-brand-400 hover:text-brand-500 transition-colors">
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            title="Delete User"
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
