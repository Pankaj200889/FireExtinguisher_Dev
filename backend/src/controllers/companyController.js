const { Company } = require('../models');

// Get Company Profile (Singleton)
exports.getProfile = async (req, res) => {
    try {
        let company = await Company.findOne();
        if (!company) {
            // Create default if not exists
            company = await Company.create({
                name: 'IgnisGuard User',
                contact_email: 'admin@ignisguard.com'
            });
        }
        res.json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Company Profile
exports.updateProfile = async (req, res) => {
    try {
        let company = await Company.findOne();
        if (!company) {
            company = await Company.create(req.body);
        } else {
            await company.update(req.body);
        }
        res.json(company);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload Logo
exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Cloudinary storage provides 'path' or 'secure_url'
        const logoUrl = req.file.path || req.file.secure_url;
        console.log('File uploaded to Cloudinary:', logoUrl);

        let company = await Company.findOne();
        if (!company) {
            company = await Company.create({ logo_url: logoUrl });
        } else {
            await company.update({ logo_url: logoUrl });
        }

        res.json({ logo_url: logoUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
