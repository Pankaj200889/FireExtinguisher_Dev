"use client";

import React from 'react';

export default function BackgroundBlobs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {/* Pastel Blue Blob */}
            <div className="blob blob-1"></div>

            {/* Pastel Orange Blob */}
            <div className="blob blob-2"></div>

            {/* Pastel Purple Blob */}
            <div className="blob blob-3"></div>
        </div>
    );
}
