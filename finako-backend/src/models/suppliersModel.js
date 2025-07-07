const supabase = require('./db');

// Get all suppliers dengan pagination & search
exports.getAll = async (organizationId, options = {}) => {
  const { page = 1, limit = 10, search } = options;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  if (error) throw error;
  
  return {
    data: data || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
};

// Get supplier by ID
exports.getById = async (organizationId, supplierId) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('id', supplierId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
};

// Get supplier by name (untuk duplicate check)
exports.getByName = async (organizationId, name) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .ilike('name', name)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  
  return data;
};

// Create new supplier
exports.create = async (supplierData) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplierData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Update supplier
exports.update = async (organizationId, supplierId, updateData) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updateData)
    .eq('organization_id', organizationId)
    .eq('id', supplierId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
};

// Delete supplier
exports.delete = async (organizationId, supplierId) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', supplierId);
    
  if (error) throw error;
  return true;
};

// Search suppliers (untuk autocomplete)
exports.search = async (organizationId, searchTerm, options = {}) => {
  const { limit = 5 } = options;
  
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, contact_person, phone, email')
    .eq('organization_id', organizationId)
    .or(`name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order('name', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data || [];
};

// Check if supplier has active purchase orders (menggunakan purchaseOrdersModel yang baru)
exports.hasActivePurchaseOrders = async (organizationId, supplierId) => {
  const purchaseOrdersModel = require('./purchaseOrdersModel');
  const activeOrders = await purchaseOrdersModel.getBySupplier(organizationId, supplierId, {
    page: 1,
    limit: 1,
    status: 'ordered'
  });
  
  return activeOrders.pagination.total > 0;
};

// Get purchase orders for supplier (menggunakan purchaseOrdersModel yang baru)
exports.getPurchaseOrders = async (organizationId, supplierId, options = {}) => {
  const purchaseOrdersModel = require('./purchaseOrdersModel');
  return await purchaseOrdersModel.getBySupplier(organizationId, supplierId, options);
};
