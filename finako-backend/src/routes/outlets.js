const express = require('express');
const router = express.Router();
const outletsController = require('../controllers/outletsController');
const validateAccess = require('../middlewares/validateAccess');

// Middleware validateMembership sudah diterapkan di index.js untuk /api/outlets

// Semua user (owner & staff) bisa melihat outlet jika fitur POS aktif
router.get('/', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), outletsController.getAll);
router.get('/:id', validateAccess({ feature: 'pos', roles: ['owner', 'staff'] }), outletsController.getById);

// Hanya owner yang bisa create, update, delete outlet
router.post('/', validateAccess({ feature: 'pos', roles: ['owner'] }), outletsController.create);
router.put('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), outletsController.update);
router.delete('/:id', validateAccess({ feature: 'pos', roles: ['owner'] }), outletsController.remove);

module.exports = router;
