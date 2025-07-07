const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/sales

// Basic CRUD operations
router.get('/', salesController.getAll);
router.post('/', salesController.create);
router.get('/:id', salesController.getById);
router.put('/:id', salesController.update);
router.delete('/:id', salesController.remove);

// ===== ENHANCED INTEGRATION ENDPOINTS =====

// Get enhanced sale details with payments and stock movements
router.get('/:id/enhanced', salesController.getEnhancedById);

// Payment management for specific sale
router.get('/:id/payments', salesController.getPayments);
router.post('/:id/payments', salesController.addPayment);

// Stock movement tracking for specific sale
router.get('/:id/stock-movements', salesController.getStockMovements);

module.exports = router;
