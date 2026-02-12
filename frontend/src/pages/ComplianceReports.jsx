import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Filter, Search, ChevronLeft } from 'lucide-react';
import api from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ComplianceReports = () => {
    const navigate = useNavigate();
    const [extinguishers, setExtinguishers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState('All');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        api.get('/assets/compliance-reports')
            .then(res => {
                setExtinguishers(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                const msg = err.response?.data?.details || err.response?.data?.sqlError || err.response?.data?.message || err.message || "Failed to load reports.";
                setError(msg);
                setLoading(false);
            });
    };

    if (error) return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/50 text-center max-w-md">
                <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Reports</h2>
                <p className="text-gray-300 mb-4">{error}</p>
                <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    Try Again
                </button>
            </div>
        </div>
    );

    const filteredAssets = extinguishers.filter(ext => {
        const matchesSearch = (ext.serial_number && ext.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ext.location && ext.location.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = selectedType === 'All' || ext.type === selectedType;
        return matchesSearch && matchesType;
    });

    const generateAnnexHPDF = async () => {
        const getBase64 = async (url) => {
            if (!url) return null;
            try {
                const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
                const res = await fetch(fullUrl);
                const blob = await res.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Image load failed", e);
                return null;
            }
        };

        const doc = new jsPDF({ orientation: 'landscape' });

        const groups = {};
        // If 'All' is selected, we group all filtered assets.
        // If specific type is selected, groupedAssets will mostly contain one group.
        filteredAssets.forEach(a => {
            const t = a.type || 'Unknown';
            if (!groups[t]) groups[t] = [];
            groups[t].push(a);
        });

        const typeOrder = ['Fire Extinguisher', 'Fire Hose Reel', 'Hydrant Hose Reel', 'Fire Sand Bucket'];
        const sortedTypes = Object.keys(groups).sort((a, b) => {
            const ia = typeOrder.indexOf(a);
            const ib = typeOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        for (let tIndex = 0; tIndex < sortedTypes.length; tIndex++) {
            const type = sortedTypes[tIndex];
            const assets = groups[type];

            if (tIndex > 0) doc.addPage();

            let startY = 20;

            if (type === 'Fire Extinguisher') {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("ANNEX H", 148, 10, { align: 'center' });
                doc.text("(Clauses 12 and 13)", 148, 16, { align: 'center' });
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("REGISTER OF FIRE EXTINGUISHER", 148, 24, { align: 'center' });

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const headerText = "H-1 Record of fire extinguishers installed in a premise, its inspection, maintenance, and operational history shall be maintained as per the format given below:";
                const splitTitle = doc.splitTextToSize(headerText, 270);
                doc.text(splitTitle, 14, 34);
                startY = 45;
            } else {
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text(`REGISTER OF ${type.toUpperCase()}`, 148, 20, { align: 'center' });
                startY = 35;
            }

            let columns = [];
            if (type === 'Fire Extinguisher') {
                columns = [
                    { header: 'Sl', dataKey: 'sl' },
                    { header: 'Asset No', dataKey: 'serial' },
                    { header: 'Type', dataKey: 'type_spec' },
                    { header: 'Capacity', dataKey: 'capacity' },
                    { header: 'Year', dataKey: 'year' },
                    { header: 'Make', dataKey: 'make' },
                    { header: 'Location', dataKey: 'location' },
                    { header: 'Monthly', dataKey: 'monthly' },
                    { header: 'Quarterly', dataKey: 'quarterly' },
                    { header: 'Annual', dataKey: 'annual' },
                    { header: 'Discharge', dataKey: 'discharge' },
                    { header: 'Refilled', dataKey: 'last_refill' },
                    { header: 'Due Refill', dataKey: 'next_refill' },
                    { header: 'Hydro Test', dataKey: 'last_hydro' },
                    { header: 'Next Hydro', dataKey: 'next_hydro' },
                ];
            } else if (type === 'Fire Hose Reel') {
                columns = [
                    { header: 'Sl', dataKey: 'sl' },
                    { header: 'Hose ID', dataKey: 'serial' },
                    { header: 'Drum Type', dataKey: 'drum_type' },
                    { header: 'Length', dataKey: 'capacity' },
                    { header: 'Year', dataKey: 'year' },
                    { header: 'Make', dataKey: 'make' },
                    { header: 'Location', dataKey: 'location' },
                    { header: 'Pressure Test', dataKey: 'last_hydro' },
                    { header: 'Next Pressure', dataKey: 'next_hydro' },
                    { header: 'Hose Replaced', dataKey: 'last_refill' },
                    { header: 'Next Replace', dataKey: 'next_refill' },
                ];
            } else if (type === 'Hydrant Hose Reel') {
                columns = [
                    { header: 'Sl', dataKey: 'sl' },
                    { header: 'Hydrant No', dataKey: 'serial' },
                    { header: 'Hose Size', dataKey: 'capacity' },
                    { header: 'Coupling', dataKey: 'coupling' },
                    { header: 'Cabinet', dataKey: 'cabinet' },
                    { header: 'Year', dataKey: 'year' },
                    { header: 'Location', dataKey: 'location' },
                    { header: 'Pressure Test', dataKey: 'last_hydro' },
                    { header: 'Next Pressure', dataKey: 'next_hydro' },
                    { header: 'Hose Replaced', dataKey: 'last_refill' },
                    { header: 'Next Replace', dataKey: 'next_refill' },
                ];
            } else if (type === 'Fire Sand Bucket') {
                columns = [
                    { header: 'Sl', dataKey: 'sl' },
                    { header: 'Bucket No', dataKey: 'serial' },
                    { header: 'Material', dataKey: 'bucket_type' }, // New
                    { header: 'Capacity', dataKey: 'capacity' }, // Bucket Cap
                    { header: 'Stand ID', dataKey: 'stand_id' },
                    { header: 'Location', dataKey: 'location' },
                    { header: 'Inspected On', dataKey: 'last_insp' },
                ];
            } else {
                columns = [
                    { header: 'Sl', dataKey: 'sl' },
                    { header: 'Asset No', dataKey: 'serial' },
                    { header: 'Type', dataKey: 'type_spec' },
                    { header: 'Location', dataKey: 'location' },
                    { header: 'Inspected On', dataKey: 'last_insp' },
                ];
            }

            columns.push({ header: 'Status', dataKey: 'status' });
            columns.push({ header: 'Remarks', dataKey: 'remarks' });
            columns.push({ header: 'Evidence', dataKey: 'evidence' });

            const body = [];
            const imageMap = {};

            for (let i = 0; i < assets.length; i++) {
                const ext = assets[i];
                const inspections = ext.inspections || ext.Inspections || [];
                const latest = inspections.length > 0 ? inspections[0] : null;

                const photoUrl = latest?.evidence_photos?.[0];
                const photoBase64 = photoUrl ? await getBase64(photoUrl) : null;
                if (photoBase64) imageMap[i] = photoBase64;

                const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';
                const specs = ext.specifications || {};

                const row = {
                    sl: i + 1,
                    serial: ext.serial_number,
                    year: ext.mfg_year || specs.mfg_year || '-',
                    make: ext.make || specs.make || '-',
                    location: ext.location,
                    status: ext.status || '-',
                    remarks: latest?.findings?.remarks || '-',
                    evidence: '',

                    monthly: inspections.find(ins => ins.inspection_type === 'Monthly') ? formatDate(inspections.find(ins => ins.inspection_type === 'Monthly').inspection_date) : '-',
                    quarterly: inspections.find(ins => ins.inspection_type === 'Quarterly') ? formatDate(inspections.find(ins => ins.inspection_type === 'Quarterly').inspection_date) : '-',
                    annual: inspections.find(ins => ins.inspection_type === 'Annual') ? formatDate(inspections.find(ins => ins.inspection_type === 'Annual').inspection_date) : '-',

                    last_hydro: formatDate(ext.last_hydro_test_date),
                    next_hydro: formatDate(ext.next_hydro_test_due),
                    discharge: formatDate(ext.discharge_date),
                    last_refill: formatDate(ext.last_refilled_date),
                    next_refill: formatDate(ext.next_refill_due),
                    last_insp: latest ? formatDate(latest.inspection_date) : '-',

                    type_spec: specs.extinguisher_type || ext.type,
                    bucket_type: specs.bucket_type || 'Sand', // Default to sand
                    capacity: type === 'Fire Hose Reel' ? (specs.hose_length || '-') :
                        type === 'Hydrant Hose Reel' ? (specs.hose_size || '-') :
                            type === 'Fire Sand Bucket' ? (`${ext.capacity || specs.capacity || ''} ${ext.unit || specs.unit || ''}`.trim() || '-') :
                                (`${ext.capacity || specs.capacity || ''} ${ext.unit || specs.unit || ''}`.trim()),
                    drum_type: specs.drum_type || '-',
                    coupling: specs.coupling_type || '-',
                    cabinet: specs.cabinet_type || '-',
                    stand_id: specs.stand_id || '-',
                    stand_capacity: specs.stand_capacity || '-', // If needed
                };
                body.push(row);
            }

            autoTable(doc, {
                startY: startY,
                columns: columns,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 8, halign: 'center', lineWidth: 0.1, lineColor: [100, 100, 100], minCellHeight: 10 },
                styles: { fontSize: 7, cellPadding: 1, valign: 'middle', halign: 'center', minCellHeight: 20, lineWidth: 0.1, lineColor: [200, 200, 200], overflow: 'linebreak' },
                didDrawCell: (data) => {
                    if (data.column.dataKey === 'evidence' && data.section === 'body') {
                        const img = imageMap[data.row.index];
                        if (img) {
                            try {
                                const dim = 16;
                                const x = data.cell.x + (data.cell.width - dim) / 2;
                                const y = data.cell.y + (data.cell.height - dim) / 2;
                                doc.addImage(img, 'JPEG', x, y, dim, dim);
                            } catch (err) { }
                        }
                    }
                }
            });

            if (type === 'Fire Extinguisher') {
                const finalY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text("NOTES:", 14, finalY);
                doc.text("1. In remarks column fill details of date of operation as per annual maintenance date, date of rejection and disposal with details of observations.", 14, finalY + 5);
            }
        }

        doc.save(selectedType === 'All' ? "Full_Asset_Register.pdf" : `${selectedType.replace(/ /g, '_')}_Register.pdf`);
    };

    const generateDetailedCSV = () => {
        const headers = [
            "Asset Number", "Type", "Location", "Make",
            "Last Inspected By", "Last Inspected On", "Device ID",
            "Status", "Next Due"
        ];

        const rows = filteredAssets.map(ext => {
            const inspections = ext.inspections || ext.Inspections || [];
            const latest = inspections.length > 0 ? inspections[0] : null;
            return [
                ext.serial_number,
                ext.type,
                ext.location,
                ext.make || '',
                latest?.User?.name || latest?.inspector || ext.last_inspector || 'System',
                latest?.inspection_date ? new Date(latest.inspection_date).toLocaleString() : '',
                latest?.device_id || ext.device_id || '',
                ext.status || 'Pending',
                ext.next_service_due || ''
            ].map(f => `"${String(f || '').replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const generateCombinedCSV = () => {
        const headers = [
            "Asset ID (Unique)", "Serial Number", "Asset Type", "Location", "Registered By", "Registered On", "Last Inspected By", "Last Inspected On", "Device ID"
        ];

        const rows = extinguishers.map(ext => {
            const inspections = ext.inspections || ext.Inspections || [];
            const latest = inspections.length > 0 ? inspections[0] : null;
            return [
                ext.id,
                ext.serial_number,
                ext.type,
                ext.location,
                ext.Creator?.name || (ext.created_by ? 'User' : 'System'),
                ext.createdAt ? new Date(ext.createdAt).toLocaleString() : '',
                latest?.User?.name || latest?.inspector || ext.last_inspector || 'N/A',
                latest?.inspection_date ? new Date(latest.inspection_date).toLocaleString() : 'Never',
                latest?.device_id || ext.device_id || 'N/A'
            ].map(f => `"${String(f || '').replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Master_Asset_Data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <div className="text-white text-center p-10">Loading Report Data...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 pb-20">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">Compliance Reports</h1>
                    <p className="text-gray-400 text-sm">Annex H & Regulatory Exports</p>
                </div>
            </header>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 mb-8">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-end">
                    <div className="w-full lg:w-1/3">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full bg-slate-900 border border-gray-700 rounded-xl px-4 py-3 font-bold text-white outline-none focus:border-brand-500 transition-all cursor-pointer"
                        >
                            <option value="All">All Assets</option>
                            <option value="Fire Extinguisher">Fire Extinguisher</option>
                            <option value="Fire Hose Reel">Fire Hose Reel</option>
                            <option value="Hydrant Hose Reel">Hydrant Hose Reel</option>
                            <option value="Fire Sand Bucket">Fire Sand Bucket</option>
                        </select>
                    </div>

                    <div className="w-full lg:w-1/3">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Assets</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search No. or Location..."
                                className="w-full bg-slate-900 border border-gray-700 rounded-xl pl-12 pr-4 py-3 font-bold text-white outline-none focus:border-brand-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                        <button onClick={generateCombinedCSV} className="px-4 py-3 rounded-xl border border-gray-600 font-bold text-gray-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                            <FileText className="w-4 h-4" /> Master CSV
                        </button>
                        <button onClick={generateDetailedCSV} className="px-4 py-3 rounded-xl border border-brand-500/50 bg-brand-500/10 font-bold text-brand-400 hover:bg-brand-500/20 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                            <FileText className="w-4 h-4" /> {selectedType === 'All' ? 'Detailed CSV' : `${selectedType} CSV`}
                        </button>
                        <button onClick={generateAnnexHPDF} className="px-4 py-3 rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                            <Download className="w-4 h-4" /> PDF Report
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-brand-500" /> Report Preview ({filteredAssets.length})
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Photo</th>
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Asset No</th>
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Inspection</th>
                                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredAssets.map(ext => {
                                const inspections = ext.inspections || ext.Inspections || [];
                                const latestInspection = inspections.length > 0 ? inspections[0] : null;
                                const thumb = latestInspection?.evidence_photos?.[0];

                                return (
                                    <tr key={ext.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4">
                                            {thumb ? (
                                                <img
                                                    src={thumb.startsWith('http') || thumb.startsWith('/uploads') ? `http://localhost:5000${thumb}` : thumb}
                                                    alt="Asset"
                                                    className="w-12 h-12 rounded object-cover border border-white/10"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-xs text-gray-600">No Img</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-white">{ext.serial_number}</td>
                                        <td className="py-4 px-4 font-medium text-gray-300">{ext.type}</td>
                                        <td className="py-4 px-4 font-medium text-gray-400">{ext.location}</td>
                                        <td className="py-4 px-4 font-medium text-gray-400">
                                            {ext.last_inspection_date ? new Date(ext.last_inspection_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ext.status === 'Operational' ? 'bg-green-500/10 text-green-400' :
                                                ext.status === 'Maintenance Required' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-700 text-gray-400'
                                                }`}>
                                                {ext.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredAssets.length === 0 && (
                        <div className="text-center py-10 text-gray-500 font-medium">No filtered assets found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplianceReports;
