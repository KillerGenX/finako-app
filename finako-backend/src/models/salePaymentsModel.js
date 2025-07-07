// src/models/salePaymentsModel.js
const supabase = require('./db');

// Get all payments with optional filters
exports.getAll = async (organizationId, filters = {}) => {
  let query = supabase
    .from('sale_payments')
    .select(`
      *,
      sales(
        id,
        total,
        created_at,
        customers(
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters if provided
  if (filters.sale_id) {
    query = query.eq('sale_id', filters.sale_id);
  }
  
  if (filters.method) {
    query = query.eq('method', filters.method);
  }

  // Organization isolation through sale relationship
  query = query.eq('sales.organization_id', organizationId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get payments for specific sale
exports.getBySaleId = async (saleId, organizationId) => {
  const { data, error } = await supabase
    .from('sale_payments')
    .select(`
      *,
      sales!inner(
        id,
        total,
        organization_id
      )
    `)
    .eq('sale_id', saleId)
    .eq('sales.organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Get payment by ID with organization validation
exports.getById = async (id, organizationId) => {
  const { data, error } = await supabase
    .from('sale_payments')
    .select(`
      *,
      sales!inner(
        id,
        total,
        organization_id,
        customers(
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .eq('sales.organization_id', organizationId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Create new payment
exports.create = async (paymentData, organizationId) => {
  // First verify the sale belongs to organization
  const saleCheck = await supabase
    .from('sales')
    .select('id, organization_id')
    .eq('id', paymentData.sale_id)
    .eq('organization_id', organizationId)
    .single();

  if (saleCheck.error) {
    throw new Error('Sale not found or access denied');
  }

  const { data, error } = await supabase
    .from('sale_payments')
    .insert([{
      ...paymentData,
      created_at: new Date().toISOString()
    }])
    .select(`
      *,
      sales(
        id,
        total,
        customers(
          id,
          name
        )
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

// Update payment
exports.update = async (id, updateData, organizationId) => {
  // First check if payment exists and belongs to organization
  const existingPayment = await this.getById(id, organizationId);
  if (!existingPayment) {
    return null;
  }

  const { data, error } = await supabase
    .from('sale_payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      sales(
        id,
        total,
        customers(
          id,
          name
        )
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

// Delete payment
exports.remove = async (id, organizationId) => {
  // First check if payment exists and belongs to organization
  const existingPayment = await this.getById(id, organizationId);
  if (!existingPayment) {
    return false;
  }

  const { error } = await supabase
    .from('sale_payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Utility functions for business logic validation

// Verify sale exists and belongs to organization
exports.verifySaleExists = async (saleId, organizationId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('id')
    .eq('id', saleId)
    .eq('organization_id', organizationId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};

// Get sale total amount
exports.getSaleTotal = async (saleId, organizationId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .eq('id', saleId)
    .eq('organization_id', organizationId)
    .single();
  
  if (error) throw error;
  return parseFloat(data.total);
};

// Get total payments amount for a sale
exports.getPaymentsTotal = async (saleId, organizationId) => {
  const { data, error } = await supabase
    .from('sale_payments')
    .select(`
      amount,
      sales!inner(organization_id)
    `)
    .eq('sale_id', saleId)
    .eq('sales.organization_id', organizationId);
  
  if (error) throw error;
  
  return data.reduce((total, payment) => {
    return total + parseFloat(payment.amount);
  }, 0);
};

// Get payment summary for a sale
exports.getPaymentSummary = async (saleId, organizationId) => {
  const [saleTotal, payments] = await Promise.all([
    this.getSaleTotal(saleId, organizationId),
    this.getBySaleId(saleId, organizationId)
  ]);

  const totalPaid = payments.reduce((total, payment) => {
    return total + parseFloat(payment.amount);
  }, 0);

  const remaining = saleTotal - totalPaid;
  const isPaidFull = remaining <= 0;

  return {
    sale_total: saleTotal,
    total_paid: totalPaid,
    remaining: remaining,
    is_paid_full: isPaidFull,
    payments: payments,
    payment_count: payments.length
  };
};
