const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');


const validateAccess = require('../middlewares/validateAccess');
// Middleware validateMembership sudah diterapkan di index.js untuk /api/customers

// Semua user (owner & staff) bisa melihat dan menambah customer jika fitur POS aktif
router.get('/', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), customersController.getAll);
router.post('/', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), customersController.create);
router.get('/:id', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), customersController.getById);

// Hanya owner yang bisa update dan delete customer
router.put('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), customersController.update);
router.delete('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), customersController.remove);

module.exports = router;
