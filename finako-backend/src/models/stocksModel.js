const supabase = require('./db');

exports.getAll = async (organizationId, outletId) => {
  let query = supabase.from('stocks')
    .select('*, products(name, sku, category_id, unit)')
    .eq('organization_id', organizationId);
  if (outletId) query = query.eq('outlet_id', outletId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

exports.getById = async (id, organizationId) => {
  const { data, error } = await supabase.from('stocks')
    .select('*, products(name, sku, category_id, unit)')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

exports.create = async (stock) => {
  const { data, error } = await supabase.from('stocks')
    .insert([stock])
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.update = async (id, updates, organizationId) => {
  const { data, error } = await supabase.from('stocks')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

exports.remove = async (id, organizationId) => {
  const { data, error } = await supabase.from('stocks')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

// Get current stock for a product at specific outlet
exports.getCurrentStock = async (organizationId, productId, outletId) => {
  const { data, error } = await supabase
    .from('stocks')
    .select('stock')
    .eq('organization_id', organizationId)
    .eq('product_id', productId)
    .eq('outlet_id', outletId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return 0; // Not found, return 0 stock
    throw error;
  }
  
  return data.stock || 0;
};

// Add stock quantity (untuk purchase orders)
exports.addStock = async (organizationId, productId, quantity, outletId) => {
  // First try to get existing stock record
  const { data: existingStock, error: getError } = await supabase
    .from('stocks')
    .select('id, stock')
    .eq('organization_id', organizationId)
    .eq('product_id', productId)
    .eq('outlet_id', outletId)
    .single();
    
  if (getError && getError.code !== 'PGRST116') {
    throw getError;
  }
  
  if (existingStock) {
    // Update existing stock
    const newStock = existingStock.stock + quantity;
    const { data, error } = await supabase
      .from('stocks')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', existingStock.id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Create new stock record
    const { data, error } = await supabase
      .from('stocks')
      .insert([{
        organization_id: organizationId,
        product_id: productId,
        outlet_id: outletId,
        stock: quantity
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
