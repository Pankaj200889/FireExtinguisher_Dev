const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// All routes require SuperAdmin role
router.use(auth, checkRole(['superadmin']));

// Create new company and its first admin
router.post('/companies', superAdminController.createCompany);

// Get all companies
router.get('/companies', superAdminController.getAllCompanies);

// Toggle company active status
router.put('/companies/:id/status', superAdminController.toggleCompanyStatus);

// Soft delete company
router.delete('/companies/:id', superAdminController.deleteCompany);

module.exports = router;
