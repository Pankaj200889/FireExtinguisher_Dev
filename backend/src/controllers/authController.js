const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');

// Register a new user (Admin only, or initial setup)
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'inspector',
        });

        res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                name: user.name
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting yourself
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Generate Reset Link (Admin only)
exports.generateResetLink = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Reset Target User not found' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetToken field
        user.resetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire (24 hours)
        user.resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        // Construct URL
        // In production, use req.protocol + '://' + req.get('host') or specific frontend env var
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        res.json({ success: true, resetUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Get hashed token
        const resetToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            where: {
                resetToken,
                resetTokenExpiry: { [require('sequelize').Op.gt]: Date.now() },
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset token fields
        user.resetToken = null;
        user.resetTokenExpiry = null;

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
