
const express = require('express');
const router = express.Router();
const stocksController = require('../controllers/stocksController');
const validateAccess = require('../middlewares/validateAccess');
const organizationFeatures = require('../middlewares/organizationFeatures');


// Middleware validateMembership sudah diterapkan di index.js untuk /api/stocks
// Inject active features for feature gating
router.use(organizationFeatures);

// Semua user (owner & staff) bisa melihat stok jika fitur inventory_management aktif
router.get('/', validateAccess({ feature: 'inventory_management', roles: ['owner', 'staff'] }), stocksController.getAll);
router.get('/:id', validateAccess({ feature: 'inventory_management', roles: ['owner', 'staff'] }), stocksController.getById);

// Hanya owner yang bisa create, update, delete stok
router.post('/', validateAccess({ feature: 'inventory_management', roles: ['owner'] }), stocksController.create);
router.put('/:id', validateAccess({ feature: 'inventory_management', roles: ['owner'] }), stocksController.update);
router.delete('/:id', validateAccess({ feature: 'inventory_management', roles: ['owner'] }), stocksController.remove);

module.exports = router;
