"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/api';

interface User {
    username: string;
    role: string;
    sub: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, redirectPath?: string) => void;
    logout: (shouldRedirect?: boolean) => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                // Check if token is expired
                const exp = (decoded as any).exp;
                if (exp * 1000 < Date.now()) {
                    localStorage.removeItem('token');
                    setUser(null);
                    // Do not redirect here, let the page decide
                } else {
                    setUser(decoded);
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, redirectPath?: string) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode<User>(token);
        setUser(decoded);

        if (redirectPath) {
            router.push(redirectPath);
            return;
        }

        // Redirect based on role
        if (decoded.role === 'admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/'); // Or operator dashboard
        }
    };

    const logout = (shouldRedirect = true) => {
        localStorage.removeItem('token');
        setUser(null);
        if (shouldRedirect) router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
