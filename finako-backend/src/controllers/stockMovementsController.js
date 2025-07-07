// src/controllers/stockMovementsController.js
const stockMovementsModel = require('../models/stockMovementsModel');

// Get all stock movements with optional filters
exports.getAll = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { product_id, outlet_id, type, start_date, end_date } = req.query;
    
    const filters = {
      product_id,
      outlet_id, 
      type,
      start_date,
      end_date
    };
    
    const movements = await stockMovementsModel.getAll(organizationId, filters);
    res.json(movements);
  } catch (err) {
    next(err);
  }
};

// Get movements by product ID
exports.getByProductId = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { productId } = req.params;
    const { outlet_id, limit } = req.query;
    
    const movements = await stockMovementsModel.getByProductId(
      productId, 
      organizationId, 
      { outlet_id, limit: limit ? parseInt(limit) : 50 }
    );
    res.json(movements);
  } catch (err) {
    next(err);
  }
};

// Get movements by outlet ID
exports.getByOutletId = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { outletId } = req.params;
    const { product_id, type, limit } = req.query;
    
    const movements = await stockMovementsModel.getByOutletId(
      outletId, 
      organizationId,
      { product_id, type, limit: limit ? parseInt(limit) : 50 }
    );
    res.json(movements);
  } catch (err) {
    next(err);
  }
};

// Get movement by ID
exports.getById = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const movement = await stockMovementsModel.getById(id, organizationId);
    if (!movement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json(movement);
  } catch (err) {
    next(err);
  }
};

// Create new stock movement
exports.create = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;
    const { product_id, outlet_id, type, quantity, note } = req.body;
    
    // Validate required fields
    if (!product_id || !outlet_id || !type || quantity === undefined) {
      return res.status(400).json({ 
        error: 'product_id, outlet_id, type, and quantity are required' 
      });
    }

    // Validate movement type
    const validTypes = ['sale', 'purchase', 'adjustment', 'transfer', 'initial', 'loss'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid movement type. Valid types: ' + validTypes.join(', ')
      });
    }

    // Validate quantity
    if (typeof quantity !== 'number') {
      return res.status(400).json({ 
        error: 'Quantity must be a number' 
      });
    }

    // For stock-reducing movements, ensure we have enough stock
    if (['sale', 'loss', 'transfer'].includes(type) && quantity > 0) {
      const currentStock = await stockMovementsModel.getCurrentStock(product_id, outlet_id, organizationId);
      if (currentStock < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock',
          current_stock: currentStock,
          requested_quantity: quantity
        });
      }
    }

    // Verify product and outlet belong to organization
    const validRefs = await stockMovementsModel.verifyReferences(product_id, outlet_id, organizationId);
    if (!validRefs.product_exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (!validRefs.outlet_exists) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const movementData = { 
      product_id, 
      outlet_id, 
      type, 
      quantity: parseInt(quantity), 
      note,
      user_id: userId 
    };
    
    const movement = await stockMovementsModel.create(movementData, organizationId);
    res.status(201).json(movement);
  } catch (err) {
    next(err);
  }
};

// Update stock movement (only note and user_id can be updated)
exports.update = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const { note } = req.body;

    // Only allow updating note field for audit purposes
    const allowedUpdates = { note };
    
    const updatedMovement = await stockMovementsModel.update(id, allowedUpdates, organizationId);
    if (!updatedMovement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json(updatedMovement);
  } catch (err) {
    next(err);
  }
};

// Delete stock movement (only for specific types and recent movements)
exports.remove = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    // Get movement details first
    const movement = await stockMovementsModel.getById(id, organizationId);
    if (!movement) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    // Only allow deletion of 'adjustment' and 'initial' movements
    const deletableTypes = ['adjustment', 'initial'];
    if (!deletableTypes.includes(movement.type)) {
      return res.status(400).json({ 
        error: 'Only adjustment and initial movements can be deleted'
      });
    }

    // Check if movement is recent (within 24 hours)
    const movementTime = new Date(movement.created_at);
    const now = new Date();
    const hoursDiff = (now - movementTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({ 
        error: 'Can only delete movements created within the last 24 hours'
      });
    }

    const deleted = await stockMovementsModel.remove(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }
    res.json({ message: 'Stock movement deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get audit report
exports.getAuditReport = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { product_id, outlet_id, start_date, end_date } = req.query;
    
    const report = await stockMovementsModel.getAuditReport(organizationId, {
      product_id,
      outlet_id,
      start_date,
      end_date
    });
    
    res.json(report);
  } catch (err) {
    next(err);
  }
};

// Get products with low stock
exports.getLowStock = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { outlet_id, threshold } = req.query;
    
    const lowStockProducts = await stockMovementsModel.getLowStockProducts(
      organizationId, 
      { 
        outlet_id, 
        threshold: threshold ? parseInt(threshold) : 10 
      }
    );
    
    res.json(lowStockProducts);
  } catch (err) {
    next(err);
  }
};

// Get movement types
exports.getMovementTypes = async (req, res, next) => {
  try {
    const movementTypes = [
      { value: 'sale', label: 'Penjualan', description: 'Stock keluar karena penjualan' },
      { value: 'purchase', label: 'Pembelian', description: 'Stock masuk dari pembelian' },
      { value: 'adjustment', label: 'Penyesuaian', description: 'Manual adjustment admin' },
      { value: 'transfer', label: 'Transfer', description: 'Transfer antar outlet' },
      { value: 'initial', label: 'Stok Awal', description: 'Initial stock setup' },
      { value: 'loss', label: 'Kehilangan', description: 'Stock hilang/rusak' }
    ];
    res.json(movementTypes);
  } catch (err) {
    next(err);
  }
};

// Get stock summary for a product
exports.getStockSummary = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { productId } = req.params;
    const { outlet_id } = req.query;
    
    const summary = await stockMovementsModel.getStockSummary(productId, organizationId, outlet_id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
