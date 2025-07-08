const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');


const organizationFeatures = require('../middlewares/organizationFeatures');
const validateAccess = require('../middlewares/validateAccess');

// Inject fitur aktif ke req
router.use(organizationFeatures);

// Semua user bisa melihat daftar anggota
router.get('/', validateAccess({ feature: 'multi_user', roles: ['owner', 'pegawai'] }), usersController.getOrganizationMembers);
router.get('/:userId', validateAccess({ feature: 'multi_user', roles: ['owner', 'pegawai'] }), usersController.getMemberById);

// Hanya owner yang boleh menambah/mengubah/menghapus anggota
router.post('/', validateAccess({ feature: 'multi_user', roles: ['owner'] }), usersController.createMember);
router.put('/:userId/role', validateAccess({ feature: 'multi_user', roles: ['owner'] }), usersController.updateMemberRole);
router.delete('/:userId', validateAccess({ feature: 'multi_user', roles: ['owner'] }), usersController.removeMember);

module.exports = router;
