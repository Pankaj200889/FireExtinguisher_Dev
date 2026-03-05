const { Company } = require('../models');

// Get Company Profile (Singleton)
exports.getProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.company_id) {
            return res.status(403).json({ message: 'User is not assigned to a company' });
        }

        let company = await Company.findByPk(req.user.company_id);
        if (!company) {
            return res.status(404).json({ message: 'Company profile not found' });
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
        if (!req.user || !req.user.company_id) {
            return res.status(403).json({ message: 'User is not assigned to a company' });
        }

        let company = await Company.findByPk(req.user.company_id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Prevent updating critical setup fields directly this way if needed, but standard update is fine for now
        await company.update(req.body);
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

        if (!req.user || !req.user.company_id) {
            return res.status(403).json({ message: 'User is not assigned to a company' });
        }

        let company = await Company.findByPk(req.user.company_id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        await company.update({ logo_url: logoUrl });

        res.json({ logo_url: logoUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
