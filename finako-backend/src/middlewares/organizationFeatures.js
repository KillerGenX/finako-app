// src/middlewares/organizationFeatures.js
// Middleware untuk inject daftar fitur aktif ke req.organizationFeatures
const supabase = require('../models/db');

module.exports = async function organizationFeatures(req, res, next) {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      return res.status(400).json({ error: 'Missing organizationId' });
    }
    // Ambil fitur aktif dari organization_features
    const { data, error } = await supabase
      .from('organization_features')
      .select('feature_id')
      .eq('organization_id', organizationId)
      .eq('is_enabled', true);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    req.organizationFeatures = data ? data.map(f => f.feature_id) : [];
    next();
  } catch (err) {
    next(err);
  }
};
