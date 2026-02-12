const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ storage: storage }).single('logo');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// @route   GET api/company
// @desc    Get company profile
// @access  Private
router.get('/', auth, companyController.getProfile);

// @route   PUT api/company
// @desc    Update company profile
// @access  Private (Admin)
router.put('/', auth, checkRole('admin'), companyController.updateProfile);

// @route   POST api/company/logo
// @desc    Upload company logo
// @access  Private (Admin)
router.post('/logo', auth, checkRole('admin'), upload, companyController.uploadLogo);

module.exports = router;
