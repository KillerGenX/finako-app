const express = require('express');
const router = express.Router();
const expensesController = require('../controllers/expensesController');
const validateAccess = require('../middlewares/validateAccess');
// Middleware validateMembership sudah diterapkan di index.js untuk /api/expenses
const organizationFeatures = require('../middlewares/organizationFeatures');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user (owner/staff) bisa lihat dan input pengeluaran jika punya fitur 'expenses'
router.get('/', validateAccess({ feature: 'expenses', roles: ['owner', 'pegawai'] }), expensesController.getAll);
router.post('/', validateAccess({ feature: 'expenses', roles: ['owner', 'pegawai'] }), expensesController.create);
router.get('/:id', validateAccess({ feature: 'expenses', roles: ['owner', 'pegawai'] }), expensesController.getById);

// Hanya owner yang boleh edit/hapus pengeluaran
router.put('/:id', validateAccess({ feature: 'expenses', roles: ['owner'] }), expensesController.update);
router.delete('/:id', validateAccess({ feature: 'expenses', roles: ['owner'] }), expensesController.remove);

module.exports = router;
