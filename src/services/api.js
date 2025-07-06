// Enhanced API Service Layer for Multi-Tenant SaaS
// Provides centralized API calls with JWT auth, organization context, and error handling

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.userStore = null; // Will be injected
  }

  // Set user store reference (to avoid circular imports)
  setUserStore(store) {
    this.userStore = store;
  }

  // Get organization store reference
  getOrganizationStore() {
    // Import here to avoid circular dependency
    const { useOrganizationStore } = require('@/stores/organizationStore');
    return useOrganizationStore();
  }

  // Get current auth headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add JWT token if available
    if (this.userStore?.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.userStore.session.access_token}`;
    }

    return headers;
  }

  // Build URL with organization context
  buildUrl(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}/api${endpoint}`);
    
    // Auto-add organization_id if available and not already in params
    try {
      const organizationStore = this.getOrganizationStore();
      if (organizationStore?.organizationId && !params.organization_id) {
        url.searchParams.set('organization_id', organizationStore.organizationId);
      }
    } catch (error) {
      // Silent fallback if organizationStore is not available (normal during initialization)
      // console.warn('OrganizationStore not available, skipping organization_id');
    }

    // Add other parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key]);
      }
    });

    return url;
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.error || data.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // Handle API errors
  handleError(error) {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.status === 401) {
      // Unauthorized - clear session and redirect to login
      this.userStore?.clearUserProfile();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    if (error.status === 403) {
      this.userStore?.showNotification('Akses tidak diizinkan untuk operasi ini', 'error');
      return;
    }

    if (error.status === 404) {
      this.userStore?.showNotification('Data tidak ditemukan', 'error');
      return;
    }

    if (error.status >= 500) {
      this.userStore?.showNotification('Server sedang bermasalah. Silakan coba lagi nanti', 'error');
      return;
    }

    // Default error handling
    const message = error.data?.error || error.message || 'Terjadi kesalahan tidak dikenal';
    this.userStore?.showNotification(message, 'error');
  }

  // Wrapper for async operations with loading and error handling
  async withErrorHandling(operation) {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error);
      throw error; // Re-throw for specific handling if needed
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    return this.withErrorHandling(async () => {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    });
  }

  // POST request
  async post(endpoint, data = {}, params = {}) {
    return this.withErrorHandling(async () => {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    });
  }

  // PUT request
  async put(endpoint, data = {}, params = {}) {
    return this.withErrorHandling(async () => {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    });
  }

  // DELETE request
  async delete(endpoint, params = {}) {
    return this.withErrorHandling(async () => {
      const url = this.buildUrl(endpoint, params);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    });
  }

  // Special method for file uploads
  async uploadFile(endpoint, formData, params = {}) {
    return this.withErrorHandling(async () => {
      const url = this.buildUrl(endpoint, params);
      const headers = {};
      
      // Add JWT token but not Content-Type (let browser set it for FormData)
      if (this.userStore?.session?.access_token) {
        headers['Authorization'] = `Bearer ${this.userStore.session.access_token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      return this.handleResponse(response);
    });
  }

  // Specific API methods for common operations

  // Products
  async getProducts(params = {}) {
    return this.get('/products', params);
  }

  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // Customers
  async getCustomers(params = {}) {
    return this.get('/customers', params);
  }

  async createCustomer(customerData) {
    return this.post('/customers', customerData);
  }

  async updateCustomer(id, customerData) {
    return this.put(`/customers/${id}`, customerData);
  }

  async deleteCustomer(id) {
    return this.delete(`/customers/${id}`);
  }

  // Sales
  async getSales(params = {}) {
    return this.get('/sales', params);
  }

  async createSale(saleData) {
    return this.post('/sales', saleData);
  }

  async updateSale(id, saleData) {
    return this.put(`/sales/${id}`, saleData);
  }

  async deleteSale(id) {
    return this.delete(`/sales/${id}`);
  }

  // Expenses
  async getExpenses(params = {}) {
    return this.get('/expenses', params);
  }

  async createExpense(expenseData) {
    return this.post('/expenses', expenseData);
  }

  async updateExpense(id, expenseData) {
    return this.put(`/expenses/${id}`, expenseData);
  }

  async deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  }

  // Expense Categories
  async getExpenseCategories(params = {}) {
    return this.get('/expense-categories', params);
  }

  async createExpenseCategory(categoryData) {
    return this.post('/expense-categories', categoryData);
  }

  async updateExpenseCategory(id, categoryData) {
    return this.put(`/expense-categories/${id}`, categoryData);
  }

  async deleteExpenseCategory(id) {
    return this.delete(`/expense-categories/${id}`);
  }

  // Transactions
  async getTransactions(params = {}) {
    return this.get('/transactions', params);
  }

  async createTransaction(transactionData) {
    return this.post('/transactions', transactionData);
  }

  // Stocks
  async getStocks(params = {}) {
    return this.get('/stocks', params);
  }

  async updateStock(id, stockData) {
    return this.put(`/stocks/${id}`, stockData);
  }

  // Dashboard
  async getDashboardData(params = {}) {
    return this.get('/dashboard', params);
  }

  // Business Profile
  async getBusinessProfile(organizationId) {
    return this.get(`/business-profile/${organizationId}`);
  }

  // Register endpoints
  async checkEmailAvailability(email) {
    return this.get('/register/check-email', { email });
  }

  async register(registrationData) {
    return this.post('/register', registrationData);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }

  // --- SAAS FLOW ENDPOINTS ---
  
  // Get packages
  async getPackages() {
    try {
      console.log('API Service: Building URL for /packages')
      const url = this.buildUrl('/packages');
      console.log('API Service: URL built:', url.toString())
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      console.log('API Service: Response status:', response.status)
      const data = await this.handleResponse(response);
      console.log('API Service: Response data:', data)
      
      return data; // Langsung return data, bukan {data, error}
    } catch (error) {
      console.error('Get packages error:', error);
      throw error;
    }
  }

  // Register tenant
  async registerTenant(registrationData) {
    try {
      const url = this.buildUrl('/register');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(registrationData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Register tenant error:', error);
      throw error;
    }
  }

  // Check session and get redirect info
  async getSessionInfo(userId) {
    try {
      const url = this.buildUrl(`/auth/session/${userId}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get session info error:', error);
      throw error;
    }
  }

  // Check onboarding status
  async getOnboardingStatus(organizationId) {
    try {
      const url = this.buildUrl(`/onboarding/status/${organizationId}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get onboarding status error:', error);
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(userId, organizationId, onboardingData) {
    try {
      const url = this.buildUrl(`/onboarding/complete/${userId}/${organizationId}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(onboardingData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
