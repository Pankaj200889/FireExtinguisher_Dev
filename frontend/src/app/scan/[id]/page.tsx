"use client";

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Loader } from 'lucide-react';

export default function ScanPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated, isLoading, user } = useAuth();
    const id = params.id as string;

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            // Not logged in -> Public View
            router.replace(`/public/${id}`);
            return;
        }

        // Logged in check
        if (user?.role === 'inspector' || user?.role === 'admin') {
            checkLockAndRedirect();
        } else {
            router.replace(`/public/${id}`);
        }

    }, [isAuthenticated, isLoading, user, id, router]);

    const checkLockAndRedirect = async () => {
        try {
            // We try to fetch the history or a specific "check-lock" endpoint
            // Here we just redirect to inspect page, which will handle the 48h error
            router.replace(`/inspect/${id}`);
        } catch (error) {
            console.error("Error checking lock", error);
            router.replace(`/public/${id}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <Loader className="h-10 w-10 animate-spin text-red-600 mx-auto" />
                <p className="mt-4 text-gray-600">Verifying access...</p>
            </div>
        </div>
    );
}
