import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 128 }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `qrcode_${value.split('/').pop()}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    return (
        <div className="flex flex-col gap-2 items-center">
            <div ref={qrRef} className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 inline-block">
                <QRCodeCanvas value={value} size={size} level={"H"} />
            </div>
            <button
                onClick={downloadQR}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
                type="button"
            >
                <Download className="h-3 w-3" /> Download
            </button>
        </div>
    );
};

export default QRCodeGenerator;
