const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const auth = require('../middleware/auth');

// @route   GET api/inspections/check-lock/:serial
// @desc    Check if asset is locked (48h rule)
// @access  Public (or semi-private, needed for scan flow)
router.get('/check-lock/:serial', inspectionController.checkLockStatus);

// @route   POST api/inspections
// @desc    Submit new inspection
// @access  Private (Inspector/Admin)
router.post('/', auth, inspectionController.submitInspection);

// @route   GET api/inspections/my-stats
// @desc    Get stats for logged in inspector
// @access  Private
router.get('/my-stats', auth, inspectionController.getMyStats);

// @route   GET api/inspections/history/:id
// @desc    Get inspection history for an asset ID
// @access  Private
// @route   GET api/inspections/history/:id
// @desc    Get inspection history for an asset ID
// @access  Private
router.get('/history/:id', auth, inspectionController.getAssetHistory);

// @route   GET api/inspections/:id
// @desc    Get single inspection by ID
// @access  Private
router.get('/:id', auth, inspectionController.getInspectionById);

module.exports = router;
