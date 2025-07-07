require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client with service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');
const validateMembership = require('./middlewares/validateMembership');

// Import routes
const registerRoutes = require('./routes/register');
const productsRoutes = require('./routes/products');
const customersRoutes = require('./routes/customers');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const expenseCategoriesRoutes = require('./routes/expenseCategories');
const dashboardRoutes = require('./routes/dashboard');
const transactionsRoutes = require('./routes/transactions');
const stocksRoutes = require('./routes/stocks');

// New enhanced routes
const productCategoriesRoutes = require('./routes/productCategories');
const businessProfilesRoutes = require('./routes/businessProfiles');
const outletsRoutes = require('./routes/outlets');
const organizationFeaturesRoutes = require('./routes/organizationFeatures');
const usersRoutes = require('./routes/users');

// Sale payments route - FASE 1 Implementation
const salePaymentsRoutes = require('./routes/salePayments');

// Stock movements route - FASE 1 Implementation
const stockMovementsRoutes = require('./routes/stockMovements');

// Suppliers route - FASE 2 Implementation
const suppliersRoutes = require('./routes/suppliers');

// Purchase Orders route - FASE 2 Implementation
const purchaseOrdersRoutes = require('./routes/purchaseOrders');

// Auth & Admin routes
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Finako Backend API v2.0.0 - SaaS Multi-Tenant',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Finako Backend API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Test POST endpoint
app.post('/api/test', (req, res) => {
  console.log('🧪 Test POST received:', req.body);
  res.json({
    message: 'Test POST successful',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint untuk cek organization_members
app.get('/api/debug/members/:organizationId/:userId', async (req, res) => {
  try {
    const { organizationId, userId } = req.params;
    
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    res.json({ data, error, organizationId, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Business profile endpoint (bypass RLS untuk SaaS flow)
app.get('/api/business-profile/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({ data: data || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply routes
app.use('/api', registerRoutes);
app.use('/api/products', validateMembership, productsRoutes);
app.use('/api/customers', validateMembership, customersRoutes);
app.use('/api/sales', validateMembership, salesRoutes);
app.use('/api/expenses', validateMembership, expensesRoutes);
app.use('/api/expense-categories', validateMembership, expenseCategoriesRoutes);
app.use('/api/dashboard', validateMembership, dashboardRoutes);
app.use('/api/transactions', validateMembership, transactionsRoutes);
app.use('/api/stocks', validateMembership, stocksRoutes);

// Enhanced routes
app.use('/api/product-categories', validateMembership, productCategoriesRoutes);
app.use('/api/business-profile', validateMembership, businessProfilesRoutes);
app.use('/api/outlets', validateMembership, outletsRoutes);
app.use('/api/organization-features', validateMembership, organizationFeaturesRoutes);
app.use('/api/users', validateMembership, usersRoutes);

// FASE 1 - Sale Payments API
app.use('/api/sale-payments', validateMembership, salePaymentsRoutes);

// FASE 1 - Stock Movements API
app.use('/api/stock-movements', validateMembership, stockMovementsRoutes);

// FASE 2 - Suppliers API (Pro Plan feature)
app.use('/api/suppliers', validateMembership, suppliersRoutes);

// FASE 2 - Purchase Orders API (Pro Plan feature)
app.use('/api/purchase-orders', validateMembership, purchaseOrdersRoutes);

// Auth & Onboarding routes (no validateMembership needed)
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak ditemukan',
    message: `Path ${req.originalUrl} tidak tersedia`
  });
});

app.listen(port, () => {
  console.log(`🚀 Finako Backend API v2.0.0 running on port ${port}`);
  console.log(`📊 Multi-tenant SaaS mode enabled`);
});