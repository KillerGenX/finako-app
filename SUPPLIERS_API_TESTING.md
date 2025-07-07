# 🧪 Suppliers API Testing Documentation

## 📋 **Overview**
Test suite untuk Suppliers API (FASE 2 Implementation) - Pro Plan feature yang memerlukan feature gating.

**Base URL**: `http://localhost:3000/api/suppliers`
**Feature Required**: `supplier_management` (Pro Plan)
**Authentication**: Required (x-user-id header)

---

## 🔐 **Authentication Setup**

Semua endpoint memerlukan authentication. Gunakan header berikut:
```bash
x-user-id: [USER_UUID]
x-organization-id: [ORG_UUID]  # Optional, akan dideteksi otomatis dari membership
```

**Sample Headers:**
```bash
# Pro Plan Organization (memiliki supplier_management feature)
x-user-id: "123e4567-e89b-12d3-a456-426614174000"
```

---

## 🧪 **Test Cases**

### **1. GET /api/suppliers - List All Suppliers**

**Test Case 1.1: Success dengan Basic Organization (No Feature)**
```bash
curl -X GET http://localhost:3000/api/suppliers \
  -H "x-user-id: [BASIC_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 403 Forbidden
{
  "success": false,
  "error": "Feature not available in your plan",
  "message": "supplier_management feature required"
}
```

**Test Case 1.2: Success dengan Pro Organization**
```bash
curl -X GET http://localhost:3000/api/suppliers \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Test Case 1.3: With Pagination & Search**
```bash
curl -X GET "http://localhost:3000/api/suppliers?page=1&limit=5&search=supplier" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

### **2. POST /api/suppliers - Create New Supplier**

**Test Case 2.1: Create Supplier (Success)**
```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PT. Supplier Indonesia",
    "contact_person": "John Doe",
    "phone": "081234567890",
    "email": "john@supplier.com",
    "address": "Jl. Supplier No. 123, Jakarta",
    "notes": "Supplier utama untuk produk elektronik"
  }'

# Expected Response: 201 Created
{
  "success": true,
  "data": {
    "id": "uuid-generated",
    "organization_id": "org-uuid",
    "name": "PT. Supplier Indonesia",
    "contact_person": "John Doe",
    "phone": "081234567890",
    "email": "john@supplier.com",
    "address": "Jl. Supplier No. 123, Jakarta",
    "notes": "Supplier utama untuk produk elektronik",
    "created_at": "2025-07-07T14:00:00.000Z",
    "updated_at": "2025-07-07T14:00:00.000Z"
  },
  "message": "Supplier created successfully"
}
```

**Test Case 2.2: Validation Error (Missing Name)**
```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_person": "John Doe",
    "phone": "081234567890"
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Validation Error",
  "message": "Name is required"
}
```

**Test Case 2.3: Duplicate Supplier Name**
```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PT. Supplier Indonesia",
    "contact_person": "Jane Doe"
  }'

# Expected Response: 409 Conflict
{
  "success": false,
  "error": "Supplier already exists",
  "message": "Supplier with name 'PT. Supplier Indonesia' already exists"
}
```

### **3. GET /api/suppliers/:id - Get Supplier Detail**

**Test Case 3.1: Get Existing Supplier**
```bash
curl -X GET http://localhost:3000/api/suppliers/[SUPPLIER_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "organization_id": "org-uuid",
    "name": "PT. Supplier Indonesia",
    "contact_person": "John Doe",
    "phone": "081234567890",
    "email": "john@supplier.com",
    "address": "Jl. Supplier No. 123, Jakarta",
    "notes": "Supplier utama untuk produk elektronik",
    "created_at": "2025-07-07T14:00:00.000Z",
    "updated_at": "2025-07-07T14:00:00.000Z"
  }
}
```

**Test Case 3.2: Supplier Not Found**
```bash
curl -X GET http://localhost:3000/api/suppliers/nonexistent-id \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 404 Not Found
{
  "success": false,
  "error": "Supplier not found"
}
```

### **4. PUT /api/suppliers/:id - Update Supplier**

**Test Case 4.1: Update Supplier (Success)**
```bash
curl -X PUT http://localhost:3000/api/suppliers/[SUPPLIER_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PT. Supplier Indonesia Updated",
    "contact_person": "John Smith",
    "phone": "081234567891",
    "notes": "Updated supplier information"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "supplier-uuid",
    "name": "PT. Supplier Indonesia Updated",
    "contact_person": "John Smith",
    "phone": "081234567891",
    "notes": "Updated supplier information",
    "updated_at": "2025-07-07T14:15:00.000Z"
  },
  "message": "Supplier updated successfully"
}
```

### **5. DELETE /api/suppliers/:id - Delete Supplier**

**Test Case 5.1: Delete Supplier (Success)**
```bash
curl -X DELETE http://localhost:3000/api/suppliers/[SUPPLIER_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

**Test Case 5.2: Delete Non-existent Supplier**
```bash
curl -X DELETE http://localhost:3000/api/suppliers/nonexistent-id \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 404 Not Found
{
  "success": false,
  "error": "Supplier not found"
}
```

### **6. GET /api/suppliers/search/:term - Search Suppliers**

**Test Case 6.1: Search by Name**
```bash
curl -X GET "http://localhost:3000/api/suppliers/search/supplier" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "supplier-uuid",
      "name": "PT. Supplier Indonesia",
      "contact_person": "John Doe",
      "phone": "081234567890",
      "email": "john@supplier.com"
    }
  ]
}
```

**Test Case 6.2: Search with Limit**
```bash
curl -X GET "http://localhost:3000/api/suppliers/search/supplier?limit=3" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

---

## 🔒 **Feature Gating Tests**

### **Test Plan Feature Validation**
1. ✅ **Basic Plan User** → Should get 403 for all endpoints
2. ✅ **Pro Plan User** → Should access all endpoints
3. ✅ **Enterprise Plan User** → Should access all endpoints
4. ✅ **No Plan User** → Should get 403 for all endpoints

### **Test Role-Based Access**
1. ✅ **Owner Role** → Full CRUD access
2. ✅ **Staff Role** → Read-only atau dengan permission management
3. ✅ **No Role** → Should get 403

---

## 📊 **Performance Tests**

### **Load Testing Scenarios**
```bash
# Test 1: Pagination performance dengan large dataset
curl -X GET "http://localhost:3000/api/suppliers?page=100&limit=50"

# Test 2: Search performance dengan complex queries
curl -X GET "http://localhost:3000/api/suppliers/search/supplier%20indonesia"

# Test 3: Concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/suppliers \
    -H "x-user-id: [PRO_USER_ID]" &
done
```

---

## 🐛 **Bug Scenario Tests**

### **Edge Cases**
1. **Null/Undefined Values**: Test dengan empty strings dan null values
2. **SQL Injection**: Test dengan malicious SQL dalam search terms
3. **XSS Prevention**: Test dengan script tags dalam input
4. **Large Payloads**: Test dengan extremely long supplier names/addresses
5. **Concurrent Updates**: Test race conditions pada update operations

### **Error Recovery**
1. **Database Disconnection**: Test behavior saat database unavailable
2. **Memory Limits**: Test dengan pagination pada large datasets
3. **Rate Limiting**: Test API rate limits

---

## ✅ **Success Criteria**

**FASE 2 Suppliers API dianggap sukses jika:**
- ✅ All CRUD operations berjalan tanpa error
- ✅ Feature gating berfungsi sesuai plan (Basic = 403, Pro+ = 200)
- ✅ Authentication & authorization bekerja sempurna
- ✅ Pagination dan search performance optimal
- ✅ Data validation dan error handling robust
- ✅ Integration dengan organization features seamless
- ✅ API response format konsisten dengan existing APIs

**Next Steps:**
- 🔄 Lanjut ke Purchase Orders API
- 🔄 Integration test dengan frontend forms
- 🔄 Performance optimization untuk large datasets
