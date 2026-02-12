const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// @route   POST api/auth/register
// @desc    Register user
// @access  Private (Admin only) - actually public for initial setup usually, or protected
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // In a real app we might fetch from DB to get latest status
        res.json(req.user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', auth, checkRole('admin'), authController.getAllUsers);

// @route   DELETE api/auth/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/users/:id', auth, checkRole('admin'), authController.deleteUser);

// @route   POST api/auth/reset-link (Missing ID catch)
router.post('/reset-link', (req, res) => res.status(400).json({ message: 'Missing User ID in URL' }));

// @route   POST api/auth/reset-link/:id
// @desc    Generate password reset link
// @access  Private (Admin)
router.post('/reset-link/:id', auth, checkRole('admin'), authController.generateResetLink);

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', authController.resetPassword);

module.exports = router;
