const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');

// @route   POST api/upload
// @desc    Upload a single image
// @access  Public (or Private)
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Return the URL to access the file
        // Assumes 'uploads' is served statically from root
        // const protocol = req.protocol;
        // const host = req.get('host');
        // const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        // Return relative path is often safer for proxies, or full URL if needed
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: 'Server error during upload' });
    }
});

module.exports = router;
