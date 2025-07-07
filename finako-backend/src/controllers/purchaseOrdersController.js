const purchaseOrdersModel = require('../models/purchaseOrdersModel');
const stocksModel = require('../models/stocksModel');
const stockMovementsModel = require('../models/stockMovementsModel');
const organizationFeaturesModel = require('../models/organizationFeaturesModel');

// Feature gating middleware (consistent dengan suppliers pattern)
const requirePurchaseOrders = async (req, res, next) => {
  try {
    const hasFeature = await organizationFeaturesModel.checkFeature(
      req.organizationId, 
      'purchase_orders'
    );
    
    if (!hasFeature) {
      return res.status(403).json({ 
        success: false,
        error: 'Purchase Orders feature tidak tersedia di paket Anda. Upgrade ke Pro Plan.' 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Get all purchase orders dengan pagination & filters
exports.getAll = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { page = 1, limit = 10, status, supplier_id, start_date, end_date } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      supplier_id,
      start_date,
      end_date
    };
    
    const purchaseOrders = await purchaseOrdersModel.getAll(organizationId, filters);
    
    res.json({ 
      success: true, 
      data: purchaseOrders.data,
      pagination: purchaseOrders.pagination 
    });
  } catch (error) {
    next(error);
  }
}];

// Get purchase order by ID dengan items & supplier detail
exports.getById = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    const purchaseOrder = await purchaseOrdersModel.getById(organizationId, id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    res.json({ 
      success: true, 
      data: purchaseOrder 
    });
  } catch (error) {
    next(error);
  }
}];

// Create new purchase order
exports.create = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;
    const { supplier_id, items, notes, expected_delivery_date } = req.body;
    
    // Validation
    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        error: 'Supplier ID is required'
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required and must be an array'
      });
    }
    
    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.cost_per_item) {
        return res.status(400).json({
          success: false,
          error: 'Each item must have product_id, quantity, and cost_per_item'
        });
      }
      
      if (item.quantity <= 0 || item.cost_per_item < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be greater than 0 and cost_per_item must be non-negative'
        });
      }
    }
    
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.cost_per_item);
    }, 0);
    
    // Create purchase order data
    const purchaseOrderData = {
      organization_id: organizationId,
      supplier_id,
      user_id: userId,
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0], // Today's date
      expected_delivery_date: expected_delivery_date || null,
      total_amount,
      notes: notes || null
    };
    
    // Create purchase order with items
    const purchaseOrder = await purchaseOrdersModel.createWithItems(purchaseOrderData, items);
    
    res.status(201).json({ 
      success: true, 
      data: purchaseOrder,
      message: 'Purchase order created successfully'
    });
  } catch (error) {
    next(error);
  }
}];

// Update purchase order (only draft status)
exports.update = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if PO exists and is editable
    const existingPO = await purchaseOrdersModel.getById(organizationId, id);
    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    if (existingPO.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Purchase order can only be updated when status is draft'
      });
    }
    
    // Remove fields that shouldn't be updated
    const allowedFields = ['supplier_id', 'expected_delivery_date', 'notes'];
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const updatedPO = await purchaseOrdersModel.update(organizationId, id, filteredData);
    
    res.json({ 
      success: true, 
      data: updatedPO,
      message: 'Purchase order updated successfully'
    });
  } catch (error) {
    next(error);
  }
}];

// Update purchase order status with workflow validation
exports.updateStatus = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['draft', 'ordered', 'partially_received', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }
    
    // Check if PO exists
    const existingPO = await purchaseOrdersModel.getById(organizationId, id);
    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    // Status transition validation
    const validTransitions = {
      'draft': ['ordered', 'cancelled'],
      'ordered': ['partially_received', 'completed', 'cancelled'],
      'partially_received': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': [] // Cannot change from cancelled
    };
    
    if (!validTransitions[existingPO.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${existingPO.status} to ${status}`
      });
    }
    
    const updatedPO = await purchaseOrdersModel.updateStatus(organizationId, id, status, notes);
    
    res.json({ 
      success: true, 
      data: updatedPO,
      message: `Purchase order status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
}];

// Delete purchase order (only draft status)
exports.delete = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    // Check if PO exists and is deletable
    const existingPO = await purchaseOrdersModel.getById(organizationId, id);
    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    if (existingPO.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Purchase order can only be deleted when status is draft'
      });
    }
    
    await purchaseOrdersModel.delete(organizationId, id);
    
    res.json({ 
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}];

// Receive goods workflow dengan stock integration
exports.receiveGoods = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;
    const { id } = req.params;
    const { receivedItems, outlet_id, notes } = req.body;
    
    // Validation
    if (!outlet_id) {
      return res.status(400).json({
        success: false,
        error: 'Outlet ID is required for receiving goods'
      });
    }
    
    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Received items are required'
      });
    }
    
    // Check if PO exists and can receive goods
    const existingPO = await purchaseOrdersModel.getById(organizationId, id);
    if (!existingPO) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    if (!['ordered', 'partially_received'].includes(existingPO.status)) {
      return res.status(400).json({
        success: false,
        error: 'Can only receive goods for ordered or partially received purchase orders'
      });
    }
    
    // Process stock updates and create movements
    for (const item of receivedItems) {
      if (item.received_quantity > 0) {
        // Get current stock
        const currentStock = await stocksModel.getCurrentStock(
          organizationId, 
          item.product_id, 
          outlet_id
        );
        
        // Update stock
        await stocksModel.addStock(
          organizationId,
          item.product_id,
          item.received_quantity,
          outlet_id
        );
        
        // Create stock movement record (integration dengan FASE 1)
        await stockMovementsModel.create({
          organization_id: organizationId,
          product_id: item.product_id,
          outlet_id: outlet_id,
          user_id: userId,
          type: 'purchase',
          quantity: item.received_quantity,
          before_stock: currentStock,
          after_stock: currentStock + item.received_quantity,
          note: `PO #${existingPO.po_number} - ${notes || 'Goods received'}`
        });
      }
    }
    
    // Update PO items received quantities
    await purchaseOrdersModel.updateReceivedQuantities(organizationId, id, receivedItems);
    
    // Determine new PO status based on received vs ordered quantities
    const updatedPO = await purchaseOrdersModel.getById(organizationId, id);
    const newStatus = calculatePOStatus(updatedPO.items);
    
    if (newStatus !== existingPO.status) {
      await purchaseOrdersModel.updateStatus(organizationId, id, newStatus, notes);
    }
    
    const finalPO = await purchaseOrdersModel.getById(organizationId, id);
    
    res.json({ 
      success: true, 
      data: finalPO,
      message: 'Goods received successfully and stock updated'
    });
  } catch (error) {
    next(error);
  }
}];

// Helper function to calculate PO status based on received quantities
function calculatePOStatus(items) {
  let totalOrdered = 0;
  let totalReceived = 0;
  
  items.forEach(item => {
    totalOrdered += item.quantity;
    totalReceived += item.received_quantity || 0;
  });
  
  if (totalReceived === 0) {
    return 'ordered';
  } else if (totalReceived >= totalOrdered) {
    return 'completed';
  } else {
    return 'partially_received';
  }
}

// Get receiving form data
exports.getReceivingForm = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    const purchaseOrder = await purchaseOrdersModel.getById(organizationId, id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        error: 'Purchase order not found'
      });
    }
    
    if (!['ordered', 'partially_received'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        error: 'Purchase order is not available for receiving'
      });
    }
    
    // Prepare receiving form data with current received quantities
    const receivingData = {
      purchase_order: purchaseOrder,
      items: purchaseOrder.items.map(item => ({
        ...item,
        remaining_quantity: item.quantity - (item.received_quantity || 0),
        can_receive: (item.quantity - (item.received_quantity || 0)) > 0
      }))
    };
    
    res.json({ 
      success: true, 
      data: receivingData
    });
  } catch (error) {
    next(error);
  }
}];

// Search purchase orders
exports.search = [requirePurchaseOrders, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { term } = req.params;
    const { limit } = req.query;
    
    if (!term || term.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }
    
    const searchResults = await purchaseOrdersModel.search(organizationId, term.trim(), {
      limit: limit ? parseInt(limit) : 5
    });
    
    res.json({ 
      success: true, 
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
}];
