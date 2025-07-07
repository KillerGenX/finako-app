// src/controllers/salePaymentsController.js
const salePaymentsModel = require('../models/salePaymentsModel');

// Get all payments (with optional filters)
exports.getAll = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { sale_id, method } = req.query;
    const payments = await salePaymentsModel.getAll(organizationId, { sale_id, method });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// Get payments for specific sale
exports.getBySaleId = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { saleId } = req.params;
    const payments = await salePaymentsModel.getBySaleId(saleId, organizationId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

// Get payment by ID
exports.getById = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const payment = await salePaymentsModel.getById(id, organizationId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

// Create new payment for a sale
exports.create = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { sale_id, method, amount } = req.body;
    
    // Validate required fields
    if (!sale_id || !method || !amount) {
      return res.status(400).json({ 
        error: 'sale_id, method, and amount are required' 
      });
    }

    // Validate payment method
    const validMethods = ['cash', 'transfer', 'qris', 'debit_card', 'credit_card', 'points'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ 
        error: 'Invalid payment method. Valid methods: ' + validMethods.join(', ')
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Payment amount must be greater than 0' 
      });
    }

    // Verify sale exists and belongs to organization
    const saleExists = await salePaymentsModel.verifySaleExists(sale_id, organizationId);
    if (!saleExists) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Check if total payments would exceed sale total
    const saleTotal = await salePaymentsModel.getSaleTotal(sale_id, organizationId);
    const currentPaymentsTotal = await salePaymentsModel.getPaymentsTotal(sale_id, organizationId);
    
    if (currentPaymentsTotal + parseFloat(amount) > saleTotal) {
      return res.status(400).json({ 
        error: 'Total payments cannot exceed sale total',
        sale_total: saleTotal,
        current_payments: currentPaymentsTotal,
        attempted_payment: amount
      });
    }

    const paymentData = { sale_id, method, amount };
    const payment = await salePaymentsModel.create(paymentData, organizationId);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

// Update payment
exports.update = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const { method, amount } = req.body;

    // Validate payment method if provided
    if (method) {
      const validMethods = ['cash', 'transfer', 'qris', 'debit_card', 'credit_card', 'points'];
      if (!validMethods.includes(method)) {
        return res.status(400).json({ 
          error: 'Invalid payment method. Valid methods: ' + validMethods.join(', ')
        });
      }
    }

    // Validate amount if provided
    if (amount && amount <= 0) {
      return res.status(400).json({ 
        error: 'Payment amount must be greater than 0' 
      });
    }

    // If amount is being updated, check total payments constraint
    if (amount) {
      const payment = await salePaymentsModel.getById(id, organizationId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const saleTotal = await salePaymentsModel.getSaleTotal(payment.sale_id, organizationId);
      const currentPaymentsTotal = await salePaymentsModel.getPaymentsTotal(payment.sale_id, organizationId);
      const otherPaymentsTotal = currentPaymentsTotal - parseFloat(payment.amount);
      
      if (otherPaymentsTotal + parseFloat(amount) > saleTotal) {
        return res.status(400).json({ 
          error: 'Total payments cannot exceed sale total',
          sale_total: saleTotal,
          other_payments: otherPaymentsTotal,
          attempted_payment: amount
        });
      }
    }

    const updatedPayment = await salePaymentsModel.update(id, req.body, organizationId);
    if (!updatedPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(updatedPayment);
  } catch (err) {
    next(err);
  }
};

// Delete payment
exports.remove = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const deleted = await salePaymentsModel.remove(id, organizationId);
    if (!deleted) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Get available payment methods
exports.getPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = [
      { value: 'cash', label: 'Tunai' },
      { value: 'transfer', label: 'Transfer Bank' },
      { value: 'qris', label: 'QRIS/E-wallet' },
      { value: 'debit_card', label: 'Kartu Debit' },
      { value: 'credit_card', label: 'Kartu Kredit' },
      { value: 'points', label: 'Redemption Poin' }
    ];
    res.json(paymentMethods);
  } catch (err) {
    next(err);
  }
};
