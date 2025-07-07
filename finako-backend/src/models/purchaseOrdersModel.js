const supabase = require('./db');

// Get all purchase orders dengan pagination & filters
exports.getAll = async (organizationId, filters = {}) => {
  const { page = 1, limit = 10, status, supplier_id, start_date, end_date } = filters;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers!inner(id, name, contact_person, phone, email),
      purchase_order_items(
        id,
        product_id,
        quantity,
        cost_per_item,
        total_cost,
        received_quantity,
        products!inner(id, name, sku, unit)
      )
    `, { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  
  if (supplier_id) {
    query = query.eq('supplier_id', supplier_id);
  }
  
  if (start_date) {
    query = query.gte('order_date', start_date);
  }
  
  if (end_date) {
    query = query.lte('order_date', end_date);
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

// Get purchase order by ID dengan complete details
exports.getById = async (organizationId, purchaseOrderId) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      suppliers!inner(id, name, contact_person, phone, email, address),
      purchase_order_items(
        id,
        product_id,
        quantity,
        cost_per_item,
        total_cost,
        received_quantity,
        products!inner(id, name, sku, unit, selling_price)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('id', purchaseOrderId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  // Calculate additional summary data
  if (data && data.purchase_order_items) {
    data.summary = {
      total_items: data.purchase_order_items.length,
      total_quantity: data.purchase_order_items.reduce((sum, item) => sum + item.quantity, 0),
      total_received: data.purchase_order_items.reduce((sum, item) => sum + (item.received_quantity || 0), 0),
      total_pending: data.purchase_order_items.reduce((sum, item) => sum + (item.quantity - (item.received_quantity || 0)), 0)
    };
    
    // Rename for consistency
    data.items = data.purchase_order_items;
    delete data.purchase_order_items;
  }
  
  return data;
};

// Create purchase order with items (transaction)
exports.createWithItems = async (purchaseOrderData, items) => {
  // Generate PO number
  const poNumber = await generatePONumber(purchaseOrderData.organization_id);
  
  const poData = {
    ...purchaseOrderData,
    po_number: poNumber
  };
  
  // Create purchase order
  const { data: purchaseOrder, error: poError } = await supabase
    .from('purchase_orders')
    .insert([poData])
    .select()
    .single();
    
  if (poError) throw poError;
  
  // Create purchase order items
  const itemsWithPOId = items.map(item => ({
    purchase_order_id: purchaseOrder.id,
    organization_id: purchaseOrderData.organization_id,
    product_id: item.product_id,
    quantity: item.quantity,
    cost_per_item: item.cost_per_item,
    received_quantity: 0 // Initialize as 0
  }));
  
  const { data: createdItems, error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(itemsWithPOId)
    .select(`
      *,
      products!inner(id, name, sku, unit)
    `);
    
  if (itemsError) {
    // Rollback PO creation if items creation fails
    await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', purchaseOrder.id);
    throw itemsError;
  }
  
  // Return complete purchase order with items
  return {
    ...purchaseOrder,
    items: createdItems
  };
};

// Update purchase order basic data
exports.update = async (organizationId, purchaseOrderId, updateData) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updateData)
    .eq('organization_id', organizationId)
    .eq('id', purchaseOrderId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
};

// Update purchase order status
exports.updateStatus = async (organizationId, purchaseOrderId, status, notes) => {
  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updateData)
    .eq('organization_id', organizationId)
    .eq('id', purchaseOrderId)
    .select()
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
};

// Update received quantities for items
exports.updateReceivedQuantities = async (organizationId, purchaseOrderId, receivedItems) => {
  // Update each item's received quantity
  for (const item of receivedItems) {
    if (item.item_id && item.received_quantity !== undefined) {
      const { error } = await supabase
        .from('purchase_order_items')
        .update({ received_quantity: item.received_quantity })
        .eq('id', item.item_id)
        .eq('organization_id', organizationId);
        
      if (error) throw error;
    }
  }
  
  return true;
};

// Delete purchase order and its items
exports.delete = async (organizationId, purchaseOrderId) => {
  // Delete items first (foreign key constraint)
  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .delete()
    .eq('purchase_order_id', purchaseOrderId)
    .eq('organization_id', organizationId);
    
  if (itemsError) throw itemsError;
  
  // Delete purchase order
  const { error: poError } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', purchaseOrderId);
    
  if (poError) throw poError;
  
  return true;
};

// Get purchase orders by supplier
exports.getBySupplier = async (organizationId, supplierId, options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('purchase_orders')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
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

// Get dashboard summary untuk purchase orders
exports.getDashboardSummary = async (organizationId) => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('status, total_amount')
    .eq('organization_id', organizationId);
    
  if (error) throw error;
  
  const summary = {
    total_pos: data.length,
    draft_count: data.filter(po => po.status === 'draft').length,
    ordered_count: data.filter(po => po.status === 'ordered').length,
    partially_received_count: data.filter(po => po.status === 'partially_received').length,
    completed_count: data.filter(po => po.status === 'completed').length,
    cancelled_count: data.filter(po => po.status === 'cancelled').length,
    total_amount: data.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0),
    pending_amount: data
      .filter(po => ['ordered', 'partially_received'].includes(po.status))
      .reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0)
  };
  
  return summary;
};

// Helper function to generate PO number
async function generatePONumber(organizationId) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `PO${year}${month}`;
  
  // Get the last PO number for this month
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('organization_id', organizationId)
    .ilike('po_number', `${prefix}%`)
    .order('po_number', { ascending: false })
    .limit(1);
    
  if (error) throw error;
  
  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].po_number.replace(prefix, '');
    nextNumber = parseInt(lastNumber) + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

// Search purchase orders
exports.search = async (organizationId, searchTerm, options = {}) => {
  const { limit = 5 } = options;
  
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      po_number,
      status,
      total_amount,
      order_date,
      suppliers!inner(name)
    `)
    .eq('organization_id', organizationId)
    .or(`po_number.ilike.%${searchTerm}%,suppliers.name.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data || [];
};
