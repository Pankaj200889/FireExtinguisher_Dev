"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// We'll use 'jose' for lightweight decoding or just simple parsing if needed. 
// Standard 'jwt-decode' is good but let's stick to simple if we can or use the lib installed.
import { jwtVerify, decodeJwt } from 'jose';

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
                // Simple decode to check expiry
                const decoded = decodeJwt(token);
                if (decoded && decoded.exp) {
                    if (decoded.exp * 1000 < Date.now()) {
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        // Valid
                        setUser({
                            username: decoded.sub as string,
                            role: (decoded.role as string) || 'inspector',
                            sub: decoded.sub as string
                        });
                    }
                }
            } catch (error) {
                console.error("Token Decode Error", error);
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, redirectPath?: string) => {
        localStorage.setItem('token', token);
        const decoded = decodeJwt(token);

        const userData = {
            username: decoded.sub as string,
            role: (decoded.role as string) || 'inspector',
            sub: decoded.sub as string
        };
        setUser(userData);

        if (redirectPath) {
            // Hard Redirect to ensure fresh state
            window.location.href = redirectPath;
        } else {
            router.push('/admin/dashboard');
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
