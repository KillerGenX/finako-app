// src/routes/salePayments.js
const express = require('express');
const router = express.Router();
const salePaymentsController = require('../controllers/salePaymentsController');


const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/sale-payments
// Inject active features for feature gating
router.use(organizationFeatures);

// Semua user (owner & staff) bisa melihat dan menambah pembayaran jika fitur multi_payment aktif
router.get('/', validateAccess({ feature: 'multi_payment', roles: ['owner', 'staff'] }), salePaymentsController.getAll);
router.get('/methods', validateAccess({ feature: 'multi_payment', roles: ['owner', 'staff'] }), salePaymentsController.getPaymentMethods);
router.get('/sale/:saleId', validateAccess({ feature: 'multi_payment', roles: ['owner', 'staff'] }), salePaymentsController.getBySaleId);
router.get('/:id', validateAccess({ feature: 'multi_payment', roles: ['owner', 'staff'] }), salePaymentsController.getById);
router.post('/', validateAccess({ feature: 'multi_payment', roles: ['owner', 'staff'] }), salePaymentsController.create);
router.put('/:id', validateAccess({ feature: 'multi_payment', roles: ['owner'] }), salePaymentsController.update);
router.delete('/:id', validateAccess({ feature: 'multi_payment', roles: ['owner'] }), salePaymentsController.remove);

module.exports = router;
