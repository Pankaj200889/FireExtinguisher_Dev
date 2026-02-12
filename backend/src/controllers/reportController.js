const PDFDocument = require('pdfkit');
const { Asset, Inspection } = require('../models');

exports.generateComplianceReport = async (req, res) => {
    try {
        const assets = await Asset.findAll({
            include: [{
                model: Inspection,
                limit: 1,
                order: [['createdAt', 'DESC']]
            }]
        });

        const { Company } = require('../models');
        const company = await Company.findOne();

        // Fetch logo if exists
        // Note: PDFKit needs a buffer or local path for images. 
        // For remote images (Cloudinary), we need to fetch them first.
        // For now, let's just add the Company Name.
        // If we want the image, we would need 'axios' to get it as arraybuffer.

        const axios = require('axios');
        let logoBuffer = null;

        if (company && company.logo_url) {
            try {
                const response = await axios.get(company.logo_url, { responseType: 'arraybuffer' });
                logoBuffer = response.data;
            } catch (err) {
                console.error('Failed to fetch logo for report:', err.message);
            }
        }

        const doc = new PDFDocument();
        const filename = `Compliance_Report_${Date.now()}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header with Logo
        // Header with Logo
        let yPos = 40;

        if (logoBuffer) {
            // Draw logo 50px wide, centered
            // Draw logo 50px wide, centered, constrained to 50x50 box
            const x = (doc.page.width - 50) / 2;
            doc.image(logoBuffer, x, yPos, { fit: [50, 50], align: 'center' });
            yPos += 60; // Move down by image height + padding
        } else {
            yPos += 20;
        }

        const companyName = company ? company.name : 'IgnisGuard User';
        doc.fontSize(20).text(companyName, 50, yPos, { align: 'center', width: 500 });
        yPos += 30;

        doc.fontSize(16).text('Compliance Report', 50, yPos, { align: 'center', width: 500 });
        yPos += 25;

        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, yPos, { align: 'center', width: 500 });
        doc.moveDown();



        // Table Header
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Serial Number', 50, 150);
        doc.text('Type', 200, 150);
        doc.text('Location', 350, 150);
        doc.text('Status', 500, 150);
        doc.moveTo(50, 165).lineTo(550, 165).stroke();

        // Table Rows
        let y = 180;
        doc.font('Helvetica');

        assets.forEach(asset => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            const lastInspection = asset.Inspections?.[0];
            const status = lastInspection ? lastInspection.status : 'Pending';

            doc.text(asset.serial_number, 50, y);
            doc.text(asset.type, 200, y);
            doc.text(asset.location, 350, y);

            // Color code status
            if (status === 'Pass') doc.fillColor('green');
            else if (status === 'Fail') doc.fillColor('red');
            else doc.fillColor('black');

            doc.text(status, 500, y);
            doc.fillColor('black'); // Reset

            y += 20;
        });

        doc.end();

    } catch (error) {
        console.error('Report Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate report' });
    }
};
