# 🧪 Suppliers API Testing Guide

## 📋 **API Overview**

**Base URL**: `http://localhost:3000/api/suppliers`
**Feature Required**: `supplier_management` (Pro Plan atau Enterprise Plan)
**Authentication**: Bearer Token required
**Organization Isolation**: Semua data isolated per organization

---

## 🔐 **Authentication & Feature Gating**

### **Headers Required:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### **Feature Gating Response:**
```json
{
  "success": false,
  "error": "Supplier Management feature tidak tersedia di paket Anda. Upgrade ke Pro Plan."
}
```

---

## 🛠️ **API Endpoints Testing**

### **1. GET /api/suppliers - List All Suppliers**

**Basic Request:**
```bash
curl -X GET "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**With Pagination & Search:**
```bash
curl -X GET "http://localhost:3000/api/suppliers?page=1&limit=5&search=supplier" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "organization_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "PT Supplier Indonesia",
      "contact_person": "Budi Santoso",
      "phone": "081234567890",
      "email": "budi@supplier.com",
      "address": "Jl. Raya Jakarta No. 123",
      "notes": "Supplier utama untuk produk elektronik",
      "total_purchase_orders": "5",
      "total_purchase_amount": "15000000",
      "created_at": "2024-01-15T08:30:00.000Z",
      "updated_at": "2024-01-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### **2. GET /api/suppliers/:id - Get Supplier Detail**

**Request:**
```bash
curl -X GET "http://localhost:3000/api/suppliers/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "PT Supplier Indonesia",
    "contact_person": "Budi Santoso",
    "phone": "081234567890",
    "email": "budi@supplier.com",
    "address": "Jl. Raya Jakarta No. 123",
    "notes": "Supplier utama untuk produk elektronik",
    "total_purchase_orders": "5",
    "draft_orders": "1",
    "active_orders": "2",
    "completed_orders": "2",
    "total_purchase_amount": "15000000",
    "completed_purchase_amount": "12000000",
    "created_at": "2024-01-15T08:30:00.000Z",
    "updated_at": "2024-01-15T08:30:00.000Z"
  }
}
```

### **3. POST /api/suppliers - Create New Supplier**

**Request:**
```bash
curl -X POST "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CV Maju Jaya",
    "contact_person": "Siti Nurhaliza",
    "phone": "081298765432",
    "email": "siti@majujaya.com",
    "address": "Jl. Sudirman No. 456, Jakarta",
    "notes": "Supplier bahan baku makanan"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Supplier berhasil dibuat",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "CV Maju Jaya",
    "contact_person": "Siti Nurhaliza",
    "phone": "081298765432",
    "email": "siti@majujaya.com",
    "address": "Jl. Sudirman No. 456, Jakarta",
    "notes": "Supplier bahan baku makanan",
    "created_at": "2024-01-15T09:00:00.000Z",
    "updated_at": "2024-01-15T09:00:00.000Z"
  }
}
```

**Validation Error Example:**
```json
{
  "success": false,
  "error": "Nama supplier wajib diisi"
}
```

**Duplicate Error Example:**
```json
{
  "success": false,
  "error": "Nama supplier sudah ada"
}
```

### **4. PUT /api/suppliers/:id - Update Supplier**

**Request:**
```bash
curl -X PUT "http://localhost:3000/api/suppliers/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_person": "Siti Nurhaliza Baru",
    "phone": "081298765433",
    "notes": "Supplier bahan baku makanan & minuman"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Supplier berhasil diupdate",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "CV Maju Jaya",
    "contact_person": "Siti Nurhaliza Baru",
    "phone": "081298765433",
    "email": "siti@majujaya.com",
    "address": "Jl. Sudirman No. 456, Jakarta",
    "notes": "Supplier bahan baku makanan & minuman",
    "created_at": "2024-01-15T09:00:00.000Z",
    "updated_at": "2024-01-15T09:15:00.000Z"
  }
}
```

### **5. DELETE /api/suppliers/:id - Delete Supplier**

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/suppliers/660e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response:**
```json
{
  "success": true,
  "message": "Supplier berhasil dihapus"
}
```

**Restriction Error (Has Active POs):**
```json
{
  "success": false,
  "error": "Supplier tidak dapat dihapus karena masih memiliki purchase order aktif"
}
```

### **6. GET /api/suppliers/:id/purchase-orders - Get Supplier POs**

**Request:**
```bash
curl -X GET "http://localhost:3000/api/suppliers/550e8400-e29b-41d4-a716-446655440000/purchase-orders?page=1&limit=5&status=completed" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "organization_id": "123e4567-e89b-12d3-a456-426614174000",
      "supplier_id": "550e8400-e29b-41d4-a716-446655440000",
      "po_number": "PO-2024-0001",
      "status": "completed",
      "total_amount": "5000000",
      "notes": "Purchase order untuk restocking",
      "total_items": "3",
      "total_quantity": "150",
      "calculated_total": "5000000",
      "created_at": "2024-01-10T08:00:00.000Z",
      "updated_at": "2024-01-12T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 5,
    "totalPages": 1
  }
}
```

### **7. GET /api/suppliers/search/:term - Search Suppliers**

**Request:**
```bash
curl -X GET "http://localhost:3000/api/suppliers/search/maju?limit=3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "CV Maju Jaya",
      "contact_person": "Siti Nurhaliza",
      "phone": "081298765432",
      "email": "siti@majujaya.com"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "name": "PT Maju Mundur",
      "contact_person": "Ahmad Maju",
      "phone": "081234567899",
      "email": "ahmad@majumundur.com"
    }
  ]
}
```

---

## 🧪 **Testing Scenarios**

### **Test 1: Feature Gating (Basic Plan User)**
```bash
# Gunakan token dari user dengan Basic plan
# Expected: 403 Forbidden dengan pesan upgrade ke Pro
curl -X GET "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer BASIC_PLAN_TOKEN"
```

### **Test 2: CRUD Operations (Pro Plan User)**
```bash
# 1. Create supplier
curl -X POST "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Supplier", "contact_person": "Test Person"}'

# 2. List suppliers
curl -X GET "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN"

# 3. Update supplier
curl -X PUT "http://localhost:3000/api/suppliers/SUPPLIER_ID" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Updated notes"}'

# 4. Delete supplier
curl -X DELETE "http://localhost:3000/api/suppliers/SUPPLIER_ID" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN"
```

### **Test 3: Validation & Business Rules**
```bash
# Test duplicate name
curl -X POST "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Existing Supplier Name"}'
# Expected: 400 Bad Request

# Test empty name
curl -X POST "http://localhost:3000/api/suppliers" \
  -H "Authorization: Bearer PRO_PLAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contact_person": "Test"}'
# Expected: 400 Bad Request
```

### **Test 4: Organization Isolation**
```bash
# Test dengan 2 organization berbeda
# Supplier dari org A tidak boleh accessible dari org B
curl -X GET "http://localhost:3000/api/suppliers/SUPPLIER_FROM_ORG_A" \
  -H "Authorization: Bearer TOKEN_FROM_ORG_B"
# Expected: 404 Not Found
```

---

## ✅ **Expected Test Results Summary**

| Test Case | Expected Result |
|-----------|----------------|
| Basic Plan access | 403 Forbidden |
| Pro Plan access | 200 Success |
| Enterprise Plan access | 200 Success |
| Create supplier with valid data | 201 Created |
| Create supplier with duplicate name | 400 Bad Request |
| Create supplier without name | 400 Bad Request |
| Delete supplier with active POs | 400 Bad Request |
| Delete supplier without POs | 200 Success |
| Cross-organization access | 404 Not Found |
| Search functionality | 200 Success with filtered results |
| Pagination | 200 Success with pagination metadata |

---

## 🔧 **Development Notes**

### **Database Dependencies:**
- `suppliers` table must exist
- `purchase_orders` table untuk relationship check
- `organization_features` untuk feature gating
- `packages` & `package_features` untuk plan validation

### **Testing Order:**
1. Verify feature gating dengan different plan tokens
2. Test CRUD operations dengan valid Pro plan token
3. Test validation rules & business constraints
4. Test search & pagination functionality
5. Test organization isolation

### **Next Phase Integration:**
- Purchase Orders API akan depend pada Suppliers API
- Stock integration will connect via Purchase Orders
- Feature gating framework sudah ready untuk scaling
