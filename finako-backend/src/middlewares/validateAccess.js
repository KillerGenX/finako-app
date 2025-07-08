// src/middlewares/validateAccess.js
// Middleware untuk validasi feature gating dan role (owner/staff)

module.exports = function validateAccess(options) {
  // Support both object parameter and separate parameters for backward compatibility
  let featureId, allowedRoles;
  
  if (typeof options === 'object' && options.feature) {
    featureId = options.feature;
    allowedRoles = options.roles || [];
  } else if (typeof options === 'string') {
    featureId = options;
    allowedRoles = arguments[1] || [];
  } else {
    throw new Error('validateAccess requires feature parameter');
  }

  return (req, res, next) => {
    const features = req.organizationFeatures || [];
    const role = req.userRole; // Pastikan sudah di-set oleh middleware auth/membership

    // Check if feature is available
    if (!features.includes(featureId)) {
      return res.status(403).json({
        error: 'Feature not available in your plan',
        feature: featureId,
        upgrade_required: true
      });
    }

    // Check if user role is allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Access denied for your role',
        role: role,
        required_roles: allowedRoles
      });
    }

    next();
  };
};
