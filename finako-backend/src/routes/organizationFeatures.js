const express = require('express');
const router = express.Router();
const organizationFeaturesController = require('../controllers/organizationFeaturesController');
const validateAccess = require('../middlewares/validateAccess');

// Semua user bisa melihat fitur yang aktif
router.get('/', organizationFeaturesController.getAll);
router.get('/enabled', organizationFeaturesController.getEnabled);

// Hanya owner yang boleh update/toggle fitur

router.put('/:featureId', validateAccess({ feature: 'feature_management', roles: ['owner'] }), organizationFeaturesController.updateFeature);
router.post('/:featureId/toggle', validateAccess({ feature: 'feature_management', roles: ['owner'] }), organizationFeaturesController.toggle);

module.exports = router;
