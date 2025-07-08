const express = require('express');
const router = express.Router();
const expenseCategoriesController = require('../controllers/expenseCategoriesController');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/expense-categories

const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user (owner/staff) bisa lihat kategori jika punya fitur 'expenses'
router.get('/', validateAccess({ feature: 'expenses', roles: ['owner', 'pegawai'] }), expenseCategoriesController.getAll);
router.get('/:id', validateAccess({ feature: 'expenses', roles: ['owner', 'pegawai'] }), expenseCategoriesController.getById);

// Hanya owner yang boleh create/update/delete kategori
router.post('/', validateAccess({ feature: 'expenses', roles: ['owner'] }), expenseCategoriesController.create);
router.put('/:id', validateAccess({ feature: 'expenses', roles: ['owner'] }), expenseCategoriesController.update);
router.delete('/:id', validateAccess({ feature: 'expenses', roles: ['owner'] }), expenseCategoriesController.remove);

module.exports = router;
