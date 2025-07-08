// src/routes/products.js
const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const validateAccess = require('../middlewares/validateAccess');
const organizationFeatures = require('../middlewares/organizationFeatures');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user (owner/staff) bisa lihat produk jika punya fitur 'products'
router.get('/', validateAccess({ feature: 'products', roles: ['owner', 'pegawai'] }), productsController.getAll);
router.get('/:id', validateAccess({ feature: 'products', roles: ['owner', 'pegawai'] }), productsController.getById);

// Hanya owner yang boleh create/update/delete produk
router.post('/', validateAccess({ feature: 'products', roles: ['owner'] }), productsController.create);
router.put('/:id', validateAccess({ feature: 'products', roles: ['owner'] }), productsController.update);
router.delete('/:id', validateAccess({ feature: 'products', roles: ['owner'] }), productsController.remove);

module.exports = router;
