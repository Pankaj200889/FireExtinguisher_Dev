"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          // Inspector Home
          // router.push('/scan-qr');
          router.push('/admin/dashboard'); // Temp redirect for demo
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return <div className="p-10 text-center">Loading...</div>;
}
