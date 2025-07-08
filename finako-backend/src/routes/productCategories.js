const express = require('express');
const router = express.Router();

const productCategoriesController = require('../controllers/productCategoriesController');
const validateAccess = require('../middlewares/validateAccess');
const organizationFeatures = require('../middlewares/organizationFeatures');


// Middleware validateMembership sudah diterapkan di index.js untuk /api/product-categories
// Inject active features for feature gating
router.use(organizationFeatures);

// All users (owner & staff) can view product categories if core_pos feature is active

// Semua user (owner & staff) bisa melihat kategori produk jika fitur POS aktif
router.get('/', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), productCategoriesController.getAll);
router.get('/:id', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), productCategoriesController.getById);

// Hanya owner yang bisa create, update, delete kategori produk
router.post('/', validateAccess({ feature: 'pos', roles: ['owner'] }), productCategoriesController.create);
router.put('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), productCategoriesController.update);
router.delete('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), productCategoriesController.remove);

module.exports = router;
