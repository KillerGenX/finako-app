// src/models/stockMovementsModel.js
const supabase = require('./db');

// Get all movements with optional filters
exports.getAll = async (organizationId, filters = {}) => {
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      products(
        id,
        name,
        sku,
        category:product_categories(
          id,
          name
        )
      ),
      outlets(
        id,
        name
      ),
      users:auth.users(
        id,
        profiles(
          full_name
        )
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id);
  }
  
  if (filters.outlet_id) {
    query = query.eq('outlet_id', filters.outlet_id);
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  // Search in note field
  if (filters.note_contains) {
    query = query.ilike('note', `%${filters.note_contains}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get movements by product ID
exports.getByProductId = async (productId, organizationId, options = {}) => {
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      outlets(
        id,
        name
      ),
      users:auth.users(
        id,
        profiles(
          full_name
        )
      )
    `)
    .eq('product_id', productId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options.outlet_id) {
    query = query.eq('outlet_id', options.outlet_id);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get movements by outlet ID
exports.getByOutletId = async (outletId, organizationId, options = {}) => {
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      products(
        id,
        name,
        sku
      ),
      users:auth.users(
        id,
        profiles(
          full_name
        )
      )
    `)
    .eq('outlet_id', outletId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options.product_id) {
    query = query.eq('product_id', options.product_id);
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get movement by ID
exports.getById = async (id, organizationId) => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      products(
        id,
        name,
        sku,
        category:product_categories(
          id,
          name
        )
      ),
      outlets(
        id,
        name
      ),
      users:auth.users(
        id,
        profiles(
          full_name
        )
      )
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Create new movement with automatic before/after stock calculation
exports.create = async (movementData, organizationId) => {
  const { product_id, outlet_id, type, quantity, note, user_id } = movementData;
  
  // Get current stock from stocks table
  const currentStock = await this.getCurrentStock(product_id, outlet_id, organizationId);
  
  // Calculate new stock based on movement type
  let stockChange = 0;
  
  // Positive movements (increase stock)
  if (['purchase', 'adjustment', 'initial'].includes(type)) {
    stockChange = Math.abs(quantity);
  }
  // Negative movements (decrease stock) 
  else if (['sale', 'loss', 'transfer'].includes(type)) {
    stockChange = -Math.abs(quantity);
  }
  
  const beforeStock = currentStock;
  const afterStock = currentStock + stockChange;
  
  // Start a transaction to update both stock_movements and stocks
  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert([{
      product_id,
      outlet_id,
      organization_id: organizationId,
      user_id,
      type,
      quantity: stockChange, // Store as positive/negative based on type
      before_stock: beforeStock,
      after_stock: afterStock,
      note,
      created_at: new Date().toISOString()
    }])
    .select(`
      *,
      products(
        id,
        name,
        sku
      ),
      outlets(
        id,
        name
      )
    `)
    .single();

  if (movementError) throw movementError;

  // Update the stocks table with new quantity
  await this.updateStock(product_id, outlet_id, organizationId, afterStock);

  return movement;
};

// Update movement (only note can be updated)
exports.update = async (id, updateData, organizationId) => {
  const { data, error } = await supabase
    .from('stock_movements')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select(`
      *,
      products(
        id,
        name,
        sku
      ),
      outlets(
        id,
        name
      )
    `)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Delete movement and revert stock changes
exports.remove = async (id, organizationId) => {
  // Get movement details first
  const movement = await this.getById(id, organizationId);
  if (!movement) return false;

  // Calculate stock reversion
  const stockReversion = -movement.quantity; // Reverse the movement
  const currentStock = await this.getCurrentStock(movement.product_id, movement.outlet_id, organizationId);
  const newStock = currentStock + stockReversion;

  // Delete the movement
  const { error } = await supabase
    .from('stock_movements')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) throw error;

  // Update stock
  await this.updateStock(movement.product_id, movement.outlet_id, organizationId, newStock);

  return true;
};

// Utility functions

// Get current stock for a product at an outlet
exports.getCurrentStock = async (productId, outletId, organizationId) => {
  const { data, error } = await supabase
    .from('stocks')
    .select('quantity')
    .eq('product_id', productId)
    .eq('outlet_id', outletId)
    .eq('organization_id', organizationId)
    .single();
  
  if (error && error.code === 'PGRST116') {
    // No stock record exists, return 0
    return 0;
  }
  if (error) throw error;
  
  return parseInt(data.quantity) || 0;
};

// Update stock in stocks table
exports.updateStock = async (productId, outletId, organizationId, newQuantity) => {
  // First try to update existing record
  const { data: existingStock } = await supabase
    .from('stocks')
    .select('id')
    .eq('product_id', productId)
    .eq('outlet_id', outletId)
    .eq('organization_id', organizationId)
    .single();

  if (existingStock) {
    // Update existing record
    const { error } = await supabase
      .from('stocks')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingStock.id);
    
    if (error) throw error;
  } else {
    // Create new stock record
    const { error } = await supabase
      .from('stocks')
      .insert([{
        product_id: productId,
        outlet_id: outletId,
        organization_id: organizationId,
        quantity: newQuantity,
        created_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
  }
};

// Verify product and outlet exist and belong to organization
exports.verifyReferences = async (productId, outletId, organizationId) => {
  const [productCheck, outletCheck] = await Promise.all([
    supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .single(),
    supabase
      .from('outlets')
      .select('id')
      .eq('id', outletId)
      .eq('organization_id', organizationId)
      .single()
  ]);

  return {
    product_exists: !productCheck.error,
    outlet_exists: !outletCheck.error
  };
};

// Get audit report
exports.getAuditReport = async (organizationId, filters = {}) => {
  let query = supabase
    .from('stock_movements')
    .select(`
      *,
      products(
        id,
        name,
        sku
      ),
      outlets(
        id,
        name
      )
    `)
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters.product_id) {
    query = query.eq('product_id', filters.product_id);
  }
  if (filters.outlet_id) {
    query = query.eq('outlet_id', filters.outlet_id);
  }
  if (filters.start_date) {
    query = query.gte('created_at', filters.start_date);
  }
  if (filters.end_date) {
    query = query.lte('created_at', filters.end_date);
  }

  const { data: movements, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;

  // Calculate summary statistics
  const summary = {
    total_movements: movements.length,
    movements_by_type: {},
    total_stock_in: 0,
    total_stock_out: 0,
    products_affected: new Set(),
    outlets_affected: new Set()
  };

  movements.forEach(movement => {
    // Count by type
    summary.movements_by_type[movement.type] = 
      (summary.movements_by_type[movement.type] || 0) + 1;
    
    // Track stock changes
    if (movement.quantity > 0) {
      summary.total_stock_in += movement.quantity;
    } else {
      summary.total_stock_out += Math.abs(movement.quantity);
    }
    
    // Track affected products and outlets
    summary.products_affected.add(movement.product_id);
    summary.outlets_affected.add(movement.outlet_id);
  });

  // Convert sets to counts
  summary.products_affected = summary.products_affected.size;
  summary.outlets_affected = summary.outlets_affected.size;

  return {
    summary,
    movements,
    filters_applied: filters
  };
};

// Get products with low stock
exports.getLowStockProducts = async (organizationId, options = {}) => {
  const { outlet_id, threshold = 10 } = options;
  
  let query = supabase
    .from('stocks')
    .select(`
      *,
      products(
        id,
        name,
        sku,
        category:product_categories(
          id,
          name
        )
      ),
      outlets(
        id,
        name
      )
    `)
    .eq('organization_id', organizationId)
    .lte('quantity', threshold)
    .order('quantity', { ascending: true });

  if (outlet_id) {
    query = query.eq('outlet_id', outlet_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data;
};

// Get stock summary for a product
exports.getStockSummary = async (productId, organizationId, outletId = null) => {
  let stockQuery = supabase
    .from('stocks')
    .select(`
      *,
      outlets(
        id,
        name
      )
    `)
    .eq('product_id', productId)
    .eq('organization_id', organizationId);

  if (outletId) {
    stockQuery = stockQuery.eq('outlet_id', outletId);
  }

  const { data: stocks, error: stockError } = await stockQuery;
  if (stockError) throw stockError;

  // Get recent movements
  const { data: recentMovements, error: movementsError } = await supabase
    .from('stock_movements')
    .select(`
      *,
      outlets(
        id,
        name
      )
    `)
    .eq('product_id', productId)
    .eq('organization_id', organizationId)
    .eq('outlet_id', outletId || stocks[0]?.outlet_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (movementsError) throw movementsError;

  const totalStock = stocks.reduce((sum, stock) => sum + parseInt(stock.quantity), 0);

  return {
    product_id: productId,
    total_stock: totalStock,
    stocks_by_outlet: stocks,
    recent_movements: recentMovements,
    last_movement: recentMovements[0] || null
  };
};
