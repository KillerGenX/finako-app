const express = require('express');
const router = express.Router();
const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const authenticateToken = require('../middlewares/authenticate');

// Apply authentication middleware untuk semua routes
router.use(authenticateToken);

// Purchase Orders Management Routes
router.get('/', purchaseOrdersController.getAll);                       // GET /api/purchase-orders
router.get('/search/:term', purchaseOrdersController.search);           // GET /api/purchase-orders/search/:term
router.get('/:id', purchaseOrdersController.getById);                   // GET /api/purchase-orders/:id
router.post('/', purchaseOrdersController.create);                      // POST /api/purchase-orders
router.put('/:id', purchaseOrdersController.update);                    // PUT /api/purchase-orders/:id
router.put('/:id/status', purchaseOrdersController.updateStatus);       // PUT /api/purchase-orders/:id/status
router.delete('/:id', purchaseOrdersController.delete);                 // DELETE /api/purchase-orders/:id

// Goods Receiving Workflow Routes
router.get('/:id/receive-form', purchaseOrdersController.getReceivingForm);  // GET /api/purchase-orders/:id/receive-form
router.post('/:id/receive', purchaseOrdersController.receiveGoods);          // POST /api/purchase-orders/:id/receive

module.exports = router;
