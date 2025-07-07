const supabase = require('./db');

exports.getAll = async (organizationId, startDate, endDate) => {
  let query = supabase.from('sales')
    .select(`
      *,
      customers(
        id,
        name,
        phone_number
      ),
      sale_payments(
        id,
        method,
        amount,
        created_at
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate + 'T23:59:59');
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Calculate payment summary for each sale
  const enhancedData = data.map(sale => {
    const totalPaid = sale.sale_payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
    const saleTotal = parseFloat(sale.total) || 0;
    const remaining = saleTotal - totalPaid;
    
    return {
      ...sale,
      payment_summary: {
        total_paid: totalPaid,
        remaining: remaining,
        is_paid_full: remaining <= 0,
        payment_count: sale.sale_payments?.length || 0
      }
    };
  });
  
  return enhancedData;
};

exports.getById = async (id, organizationId) => {
  const { data, error } = await supabase.from('sales')
    .select(`
      *,
      customers(
        id,
        name,
        phone_number,
        email
      ),
      sale_payments(
        id,
        method,
        amount,
        created_at
      )
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  // Calculate payment summary
  const totalPaid = data.sale_payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;
  const saleTotal = parseFloat(data.total) || 0;
  const remaining = saleTotal - totalPaid;
  
  return {
    ...data,
    payment_summary: {
      total_paid: totalPaid,
      remaining: remaining,
      is_paid_full: remaining <= 0,
      payment_count: data.sale_payments?.length || 0
    }
  };
};

exports.create = async (sale) => {
  const { data, error } = await supabase.from('sales')
    .insert([sale])
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.update = async (id, updates, organizationId) => {
  const { data, error } = await supabase.from('sales')
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
  const { data, error } = await supabase.from('sales')
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
