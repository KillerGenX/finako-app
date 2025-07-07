const express = require('express');
const router = express.Router();
const suppliersController = require('../controllers/suppliersController');
const authenticateToken = require('../middlewares/authenticate');

// Apply authentication middleware untuk semua routes
router.use(authenticateToken);

// Routes dengan feature gating di controller
router.get('/', suppliersController.getAll);                    // GET /api/suppliers
router.get('/search/:term', suppliersController.search);         // GET /api/suppliers/search/:term
router.get('/:id', suppliersController.getById);                // GET /api/suppliers/:id
router.post('/', suppliersController.create);                   // POST /api/suppliers
router.put('/:id', suppliersController.update);                 // PUT /api/suppliers/:id
router.delete('/:id', suppliersController.delete);              // DELETE /api/suppliers/:id
router.get('/:id/purchase-orders', suppliersController.getPurchaseOrders); // GET /api/suppliers/:id/purchase-orders

module.exports = router;
