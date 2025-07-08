const express = require('express');
const router = express.Router();

const suppliersController = require('../controllers/suppliersController');
const authenticateToken = require('../middlewares/authenticate');
const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Apply authentication & inject features
router.use(authenticateToken);
router.use(organizationFeatures);

// Only owner can create, update, delete supplier (Pro feature)
router.get('/', validateAccess({ feature: 'supplier_management', roles: ['owner', 'pegawai'] }), suppliersController.getAll);                    // GET /api/suppliers
router.get('/search/:term', validateAccess({ feature: 'supplier_management', roles: ['owner', 'pegawai'] }), suppliersController.search);         // GET /api/suppliers/search/:term
router.get('/:id', validateAccess({ feature: 'supplier_management', roles: ['owner', 'pegawai'] }), suppliersController.getById);                // GET /api/suppliers/:id
router.post('/', validateAccess({ feature: 'supplier_management', roles: ['owner'] }), suppliersController.create);                   // POST /api/suppliers
router.put('/:id', validateAccess({ feature: 'supplier_management', roles: ['owner'] }), suppliersController.update);                 // PUT /api/suppliers/:id
router.delete('/:id', validateAccess({ feature: 'supplier_management', roles: ['owner'] }), suppliersController.delete);              // DELETE /api/suppliers/:id
router.get('/:id/purchase-orders', validateAccess({ feature: 'supplier_management', roles: ['owner', 'pegawai'] }), suppliersController.getPurchaseOrders); // GET /api/suppliers/:id/purchase-orders

module.exports = router;
