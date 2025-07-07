const salesModel = require('../models/salesModel');
const salePaymentsModel = require('../models/salePaymentsModel');
const stockMovementsModel = require('../models/stockMovementsModel');

exports.getAll = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const data = await salesModel.getAll(organizationId, startDate, endDate);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;
    const { payments, outlet_id, items, ...saleData } = req.body;
    
    // Create sale data with organization_id
    const fullSaleData = { 
      ...saleData, 
      organization_id: organizationId,
      user_id: userId 
    };
    
    // Create the sale transaction
    const sale = await salesModel.create(fullSaleData);
    
    // Process payments if provided
    let paymentRecords = [];
    if (payments && Array.isArray(payments) && payments.length > 0) {
      // Validate total payments don't exceed sale total
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const saleTotal = parseFloat(sale.total);
      
      if (totalPayments > saleTotal) {
        // Rollback sale creation if payment validation fails
        await salesModel.remove(sale.id, organizationId);
        return res.status(400).json({
          error: 'Total payments cannot exceed sale total',
          sale_total: saleTotal,
          total_payments: totalPayments
        });
      }
      
      // Create payment records
      for (const payment of payments) {
        const paymentData = {
          sale_id: sale.id,
          method: payment.method,
          amount: payment.amount
        };
        
        const paymentRecord = await salePaymentsModel.create(paymentData, organizationId);
        paymentRecords.push(paymentRecord);
      }
    }
    
    // Process stock movements if items and outlet_id provided
    let stockMovements = [];
    if (items && Array.isArray(items) && outlet_id) {
      for (const item of items) {
        if (item.product_id && item.quantity) {
          try {
            // Create stock movement for each item
            const movementData = {
              product_id: item.product_id,
              outlet_id: outlet_id,
              type: 'sale',
              quantity: parseInt(item.quantity), // Will be converted to negative in model
              note: `Sale #${sale.id} - ${item.name || 'Product'}`,
              user_id: userId
            };
            
            const movement = await stockMovementsModel.create(movementData, organizationId);
            stockMovements.push(movement);
          } catch (stockError) {
            // Log stock error but don't fail the sale
            console.warn(`Stock movement failed for product ${item.product_id}:`, stockError.message);
          }
        }
      }
    }
    
    // Return enhanced sale data with payments and stock info
    const enhancedSale = {
      ...sale,
      payments: paymentRecords,
      stock_movements: stockMovements,
      payment_summary: {
        total_paid: paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        remaining: parseFloat(sale.total) - paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        is_paid_full: paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount), 0) >= parseFloat(sale.total)
      }
    };
    
    res.status(201).json(enhancedSale);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const sale = await salesModel.getById(id, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const sale = await salesModel.update(id, req.body, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const result = await salesModel.remove(id, organizationId);
    if (!result) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json({ message: 'Sale deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ===== ENHANCED INTEGRATION ENDPOINTS =====

// Get payments for a specific sale
exports.getPayments = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    // Verify sale exists and belongs to organization
    const sale = await salesModel.getById(id, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const payments = await salePaymentsModel.getBySaleId(id, organizationId);
    const paymentSummary = await salePaymentsModel.getPaymentSummary(id, organizationId);
    
    res.json({
      sale_id: id,
      payments,
      summary: paymentSummary
    });
  } catch (err) {
    next(err);
  }
};

// Add payment to existing sale
exports.addPayment = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const { method, amount } = req.body;
    
    // Verify sale exists
    const sale = await salesModel.getById(id, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Validate payment data
    if (!method || !amount) {
      return res.status(400).json({ error: 'method and amount are required' });
    }
    
    // Check if total payments would exceed sale total
    const currentPaymentsTotal = await salePaymentsModel.getPaymentsTotal(id, organizationId);
    const saleTotal = parseFloat(sale.total);
    
    if (currentPaymentsTotal + parseFloat(amount) > saleTotal) {
      return res.status(400).json({
        error: 'Total payments cannot exceed sale total',
        sale_total: saleTotal,
        current_payments: currentPaymentsTotal,
        attempted_payment: amount
      });
    }
    
    // Create payment
    const paymentData = { sale_id: id, method, amount };
    const payment = await salePaymentsModel.create(paymentData, organizationId);
    
    // Get updated payment summary
    const paymentSummary = await salePaymentsModel.getPaymentSummary(id, organizationId);
    
    res.status(201).json({
      payment,
      summary: paymentSummary
    });
  } catch (err) {
    next(err);
  }
};

// Get stock movements for a specific sale
exports.getStockMovements = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    // Verify sale exists
    const sale = await salesModel.getById(id, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Get stock movements related to this sale
    const movements = await stockMovementsModel.getAll(organizationId, { 
      type: 'sale',
      note_contains: `Sale #${id}`
    });
    
    res.json({
      sale_id: id,
      stock_movements: movements
    });
  } catch (err) {
    next(err);
  }
};

// Get enhanced sale details with payments and stock movements
exports.getEnhancedById = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    
    // Get basic sale data
    const sale = await salesModel.getById(id, organizationId);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Get payments
    const payments = await salePaymentsModel.getBySaleId(id, organizationId);
    const paymentSummary = await salePaymentsModel.getPaymentSummary(id, organizationId);
    
    // Get stock movements
    const stockMovements = await stockMovementsModel.getAll(organizationId, { 
      type: 'sale',
      note_contains: `Sale #${id}`
    });
    
    const enhancedSale = {
      ...sale,
      payments,
      payment_summary: paymentSummary,
      stock_movements: stockMovements
    };
    
    res.json(enhancedSale);
  } catch (err) {
    next(err);
  }
};
