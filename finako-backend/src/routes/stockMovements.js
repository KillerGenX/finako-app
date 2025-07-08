// src/routes/stockMovements.js
const express = require('express');
const router = express.Router();
const stockMovementsController = require('../controllers/stockMovementsController');
const validateAccess = require('../middlewares/validateAccess');
// Middleware validateMembership sudah diterapkan di index.js untuk /api/stock-movements
const organizationFeatures = require('../middlewares/organizationFeatures');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user (owner/staff) bisa lihat pergerakan stok jika punya fitur 'inventory_audit'
router.get('/', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getAll);
router.get('/types', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getMovementTypes);
router.get('/audit', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getAuditReport);
router.get('/low-stock', validateAccess({ feature: 'stock_alert', roles: ['owner', 'pegawai'] }), stockMovementsController.getLowStock);
router.get('/product/:productId', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getByProductId);
router.get('/outlet/:outletId', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getByOutletId);
router.get('/product/:productId/summary', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getStockSummary);
router.get('/:id', validateAccess({ feature: 'inventory_audit', roles: ['owner', 'pegawai'] }), stockMovementsController.getById);

// Hanya owner yang boleh create/update/delete movement (stock adjustment)
router.post('/', validateAccess({ feature: 'stock_adjustment', roles: ['owner'] }), stockMovementsController.create);
router.put('/:id', validateAccess({ feature: 'stock_adjustment', roles: ['owner'] }), stockMovementsController.update);
router.delete('/:id', validateAccess({ feature: 'stock_adjustment', roles: ['owner'] }), stockMovementsController.remove);

module.exports = router;
