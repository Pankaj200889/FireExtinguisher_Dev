import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size = 128 }) => {
    return (
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 inline-block">
            <QRCodeCanvas value={value} size={size} level={"H"} />
        </div>
    );
};

export default QRCodeGenerator;
