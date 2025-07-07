// src/routes/salePayments.js
const express = require('express');
const router = express.Router();
const salePaymentsController = require('../controllers/salePaymentsController');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/sale-payments

// Get all payments (with optional filters: ?sale_id=123&method=cash)
router.get('/', salePaymentsController.getAll);

// Get available payment methods
router.get('/methods', salePaymentsController.getPaymentMethods);

// Get payments for specific sale
router.get('/sale/:saleId', salePaymentsController.getBySaleId);

// Get payment by ID
router.get('/:id', salePaymentsController.getById);

// Create new payment
router.post('/', salePaymentsController.create);

// Update payment
router.put('/:id', salePaymentsController.update);

// Delete payment
router.delete('/:id', salePaymentsController.remove);

module.exports = router;
