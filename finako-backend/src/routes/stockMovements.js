// src/routes/stockMovements.js
const express = require('express');
const router = express.Router();
const stockMovementsController = require('../controllers/stockMovementsController');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/stock-movements

// Get all movements (with optional filters: ?product_id=123&outlet_id=456&type=sale&start_date=2025-01-01&end_date=2025-01-31)
router.get('/', stockMovementsController.getAll);

// Get movement types
router.get('/types', stockMovementsController.getMovementTypes);

// Get audit report
router.get('/audit', stockMovementsController.getAuditReport);

// Get products with low stock
router.get('/low-stock', stockMovementsController.getLowStock);

// Get movements by product ID
router.get('/product/:productId', stockMovementsController.getByProductId);

// Get movements by outlet ID  
router.get('/outlet/:outletId', stockMovementsController.getByOutletId);

// Get stock summary for a product
router.get('/product/:productId/summary', stockMovementsController.getStockSummary);

// Get movement by ID
router.get('/:id', stockMovementsController.getById);

// Create new movement
router.post('/', stockMovementsController.create);

// Update movement (only note field)
router.put('/:id', stockMovementsController.update);

// Delete movement (restricted to certain types and recent movements)
router.delete('/:id', stockMovementsController.remove);

module.exports = router;
