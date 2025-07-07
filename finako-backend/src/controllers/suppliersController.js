const suppliersModel = require('../models/suppliersModel');
const organizationFeaturesModel = require('../models/organizationFeaturesModel');

// Feature gating middleware (consistent dengan pattern existing APIs)
const requireSupplierManagement = async (req, res, next) => {
  try {
    const hasFeature = await organizationFeaturesModel.checkFeature(
      req.organizationId, 
      'supplier_management'
    );
    
    if (!hasFeature) {
      return res.status(403).json({ 
        success: false,
        error: 'Supplier Management feature tidak tersedia di paket Anda. Upgrade ke Pro Plan.' 
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Get all suppliers dengan pagination & search
exports.getAll = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const { page = 1, limit = 10, search } = req.query;
    
    const suppliers = await suppliersModel.getAll(organizationId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search
    });
    
    res.json({ 
      success: true, 
      data: suppliers.data,
      pagination: suppliers.pagination 
    });
  } catch (error) {
    next(error);
  }
}];

// Get supplier by ID dengan purchase history
exports.getById = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const supplierId = req.params.id;
    
    const supplier = await suppliersModel.getById(organizationId, supplierId);
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supplier tidak ditemukan' 
      });
    }
    
    res.json({ 
      success: true, 
      data: supplier 
    });
  } catch (error) {
    next(error);
  }
}];

// Create new supplier
exports.create = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const supplierData = {
      ...req.body,
      organization_id: organizationId
    };
    
    // Validation
    if (!supplierData.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nama supplier wajib diisi' 
      });
    }
    
    // Check duplicate name
    const existingSupplier = await suppliersModel.getByName(organizationId, supplierData.name);
    if (existingSupplier) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nama supplier sudah ada' 
      });
    }
    
    const newSupplier = await suppliersModel.create(supplierData);
    
    res.status(201).json({ 
      success: true, 
      message: 'Supplier berhasil dibuat',
      data: newSupplier 
    });
  } catch (error) {
    next(error);
  }
}];

// Update supplier
exports.update = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const supplierId = req.params.id;
    const updateData = req.body;
    
    // Check if supplier exists
    const existingSupplier = await suppliersModel.getById(organizationId, supplierId);
    if (!existingSupplier) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supplier tidak ditemukan' 
      });
    }
    
    // Check duplicate name if name is being updated
    if (updateData.name && updateData.name !== existingSupplier.name) {
      const duplicateSupplier = await suppliersModel.getByName(organizationId, updateData.name);
      if (duplicateSupplier) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nama supplier sudah ada' 
        });
      }
    }
    
    const updatedSupplier = await suppliersModel.update(organizationId, supplierId, updateData);
    
    res.json({ 
      success: true, 
      message: 'Supplier berhasil diupdate',
      data: updatedSupplier 
    });
  } catch (error) {
    next(error);
  }
}];

// Delete supplier (dengan purchase order restriction check)
exports.delete = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const supplierId = req.params.id;
    
    // Check if supplier exists
    const existingSupplier = await suppliersModel.getById(organizationId, supplierId);
    if (!existingSupplier) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supplier tidak ditemukan' 
      });
    }
    
    // Check for existing purchase orders
    const hasActivePurchaseOrders = await suppliersModel.hasActivePurchaseOrders(organizationId, supplierId);
    if (hasActivePurchaseOrders) {
      return res.status(400).json({ 
        success: false, 
        error: 'Supplier tidak dapat dihapus karena masih memiliki purchase order aktif' 
      });
    }
    
    await suppliersModel.delete(organizationId, supplierId);
    
    res.json({ 
      success: true, 
      message: 'Supplier berhasil dihapus' 
    });
  } catch (error) {
    next(error);
  }
}];

// Get purchase orders for specific supplier
exports.getPurchaseOrders = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const supplierId = req.params.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const purchaseOrders = await suppliersModel.getPurchaseOrders(organizationId, supplierId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    res.json({ 
      success: true, 
      data: purchaseOrders.data,
      pagination: purchaseOrders.pagination 
    });
  } catch (error) {
    next(error);
  }
}];

// Search suppliers by name/phone/email
exports.search = [requireSupplierManagement, async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const searchTerm = req.params.term;
    const { limit = 5 } = req.query;
    
    const suppliers = await suppliersModel.search(organizationId, searchTerm, {
      limit: parseInt(limit)
    });
    
    res.json({ 
      success: true, 
      data: suppliers 
    });
  } catch (error) {
    next(error);
  }
}];
