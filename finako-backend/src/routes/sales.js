const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/sales


const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user (owner/staff) bisa lihat dan create sales jika punya fitur 'pos'
router.get('/', validateAccess({ feature: 'pos', roles: ['owner', 'pegawai'] }), salesController.getAll);
router.post('/', validateAccess({ feature: 'pos', roles: ['owner', 'pegawai'] }), salesController.create);
router.get('/:id', validateAccess({ feature: 'pos', roles: ['owner', 'pegawai'] }), salesController.getById);
router.put('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), salesController.update);
router.delete('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), salesController.remove);

// ===== ENHANCED INTEGRATION ENDPOINTS =====

// Get enhanced sale details with payments and stock movements
router.get('/:id/enhanced', salesController.getEnhancedById);

// Payment management for specific sale
router.get('/:id/payments', salesController.getPayments);
router.post('/:id/payments', salesController.addPayment);

// Stock movement tracking for specific sale
router.get('/:id/stock-movements', salesController.getStockMovements);

module.exports = router;
