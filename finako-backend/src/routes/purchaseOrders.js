const express = require('express');
const router = express.Router();

const purchaseOrdersController = require('../controllers/purchaseOrdersController');
const authenticateToken = require('../middlewares/authenticate');
const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Apply authentication & inject features
router.use(authenticateToken);
router.use(organizationFeatures);

// Only owner can create, update, delete PO (Pro feature)
router.get('/', validateAccess({ feature: 'purchase_orders', roles: ['owner', 'pegawai'] }), purchaseOrdersController.getAll);                       // GET /api/purchase-orders
router.get('/search/:term', validateAccess({ feature: 'purchase_orders', roles: ['owner', 'pegawai'] }), purchaseOrdersController.search);           // GET /api/purchase-orders/search/:term
router.get('/:id', validateAccess({ feature: 'purchase_orders', roles: ['owner', 'pegawai'] }), purchaseOrdersController.getById);                   // GET /api/purchase-orders/:id
router.post('/', validateAccess({ feature: 'purchase_orders', roles: ['owner'] }), purchaseOrdersController.create);                      // POST /api/purchase-orders
router.put('/:id', validateAccess({ feature: 'purchase_orders', roles: ['owner'] }), purchaseOrdersController.update);                    // PUT /api/purchase-orders/:id
router.put('/:id/status', validateAccess({ feature: 'purchase_orders', roles: ['owner'] }), purchaseOrdersController.updateStatus);       // PUT /api/purchase-orders/:id/status
router.delete('/:id', validateAccess({ feature: 'purchase_orders', roles: ['owner'] }), purchaseOrdersController.delete);                 // DELETE /api/purchase-orders/:id

// Goods Receiving Workflow Routes
router.get('/:id/receive-form', validateAccess({ feature: 'purchase_orders', roles: ['owner', 'pegawai'] }), purchaseOrdersController.getReceivingForm);  // GET /api/purchase-orders/:id/receive-form
router.post('/:id/receive', validateAccess({ feature: 'purchase_orders', roles: ['owner', 'pegawai'] }), purchaseOrdersController.receiveGoods);          // POST /api/purchase-orders/:id/receive

module.exports = router;
