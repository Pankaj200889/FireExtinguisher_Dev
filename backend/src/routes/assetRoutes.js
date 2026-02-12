const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// @route   POST api/assets
// @desc    Create a new asset
// @access  Private (Admin only)
router.post('/', [auth, checkRole(['admin'])], assetController.createAsset);

// @route   GET api/assets/compliance-reports
// @desc    Get compliance reports
// @access  Private (Admin only)
router.get('/compliance-reports', [auth, checkRole(['admin'])], assetController.getComplianceReports);

// @route   GET api/assets/scan/:serial
// @desc    Get asset by Serial Number (for Public Scan)
// @access  Public
router.get('/scan/:serial', assetController.getAssetBySerial);
router.get('/public/:serial', assetController.getAssetBySerial); // Alias for frontend consistency

// @route   GET api/assets
// @desc    Get all assets
// @access  Private (Authenticated users)
router.get('/', auth, assetController.getAllAssets);

// @route   GET api/assets/:id/inspections
// @desc    Get all inspections for an asset
// @access  Private
router.get('/:id/inspections', auth, assetController.getAssetInspections);

// @route   GET api/assets/:id
// @desc    Get asset by ID
// @access  Private
router.get('/:id', auth, assetController.getAssetById);

// @route   PUT api/assets/:id
// @desc    Update asset details
// @access  Private (Admin)
router.put('/:id', [auth, checkRole(['admin'])], assetController.updateAsset);

// @route   DELETE api/assets/:id
// @desc    Delete asset
// @access  Private (Admin)
router.delete('/:id', [auth, checkRole(['admin'])], assetController.deleteAsset);

module.exports = router;
