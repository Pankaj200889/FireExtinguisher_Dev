const bcrypt = require('bcryptjs');
const { Company, User } = require('../models');

// @route   POST api/superadmin/companies
// @desc    Create a new company and its first admin user
// @access  SuperAdmin
exports.createCompany = async (req, res) => {
    try {
        const { companyName, subdomain, adminName, adminEmail, adminPassword } = req.body;

        // 1. Create Company
        const existingCompany = await Company.findOne({ where: { subdomain } });
        if (existingCompany) {
            return res.status(400).json({ message: 'Subdomain already in use' });
        }

        const company = await Company.create({
            name: companyName,
            subdomain: subdomain
        });

        // 2. Create first Admin for that company
        const existingUser = await User.findOne({ where: { email: adminEmail } });
        if (existingUser) {
            // Note: In an edge case where email exists, rolling back company creation would be ideal, 
            // but for MVP we return an error.
            return res.status(400).json({ message: 'Admin email already exists in the system' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            company_id: company.id
        });

        res.status(201).json({
            message: 'Company and Admin created successfully',
            company,
            admin: { id: adminUser.id, email: adminUser.email }
        });

    } catch (error) {
        console.error('Create Company Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @route   GET api/superadmin/companies
// @desc    Get all companies
// @access  SuperAdmin
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(companies);
    } catch (error) {
        console.error('Get Companies Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   PUT api/superadmin/companies/:id/status
// @desc    Suspend or Reactivate a company
// @access  SuperAdmin
exports.toggleCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        company.is_active = is_active;
        await company.save();

        res.json({ message: `Company ${is_active ? 'activated' : 'suspended'} successfully`, company });
    } catch (error) {
        console.error('Status Toggle Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   DELETE api/superadmin/companies/:id
// @desc    Delete a company (and potentially all its data via constraints/paranoid)
// @access  SuperAdmin
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findByPk(id);

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // With paranoid true or cascade deletes, this removes/soft-deletes the company.
        // You may want to destroy users first if strict constraints exist.
        await company.destroy();

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Delete Company Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
