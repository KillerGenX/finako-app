# 🧪 Purchase Orders API Testing Documentation

## 📋 **Overview**
Complete test suite untuk Purchase Orders API (FASE 2 Implementation) - Pro Plan feature yang terintegrasi dengan Suppliers dan Stock Management.

**Base URL**: `http://localhost:3000/api/purchase-orders`
**Feature Required**: `purchase_orders` (Pro Plan)
**Authentication**: Required (x-user-id header)
**Dependencies**: Suppliers API, Stock Management, Stock Movements

---

## 🔐 **Authentication Setup**

Semua endpoint memerlukan authentication dan Pro Plan access:
```bash
x-user-id: [PRO_USER_UUID]
x-organization-id: [ORG_UUID]  # Optional, akan dideteksi otomatis
```

**Sample Headers:**
```bash
# Pro Plan Organization (memiliki purchase_orders feature)
x-user-id: "123e4567-e89b-12d3-a456-426614174000"
```

---

## 🧪 **Test Cases**

### **1. GET /api/purchase-orders - List All Purchase Orders**

**Test Case 1.1: Success dengan Basic Organization (No Feature)**
```bash
curl -X GET http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [BASIC_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 403 Forbidden
{
  "success": false,
  "error": "Purchase Orders feature tidak tersedia di paket Anda. Upgrade ke Pro Plan."
}
```

**Test Case 1.2: Success dengan Pro Organization (Empty List)**
```bash
curl -X GET http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

**Test Case 1.3: With Filters & Pagination**
```bash
curl -X GET "http://localhost:3000/api/purchase-orders?status=draft&page=1&limit=5&supplier_id=uuid" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

**Test Case 1.4: Date Range Filter**
```bash
curl -X GET "http://localhost:3000/api/purchase-orders?start_date=2025-01-01&end_date=2025-12-31" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

### **2. POST /api/purchase-orders - Create New Purchase Order**

**Test Case 2.1: Create PO (Success)**
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier-uuid-123",
    "expected_delivery_date": "2025-07-15",
    "notes": "Urgent order for new stock",
    "items": [
      {
        "product_id": "product-uuid-1",
        "quantity": 100,
        "cost_per_item": 15000
      },
      {
        "product_id": "product-uuid-2", 
        "quantity": 50,
        "cost_per_item": 25000
      }
    ]
  }'

# Expected Response: 201 Created
{
  "success": true,
  "data": {
    "id": "po-uuid-generated",
    "organization_id": "org-uuid",
    "supplier_id": "supplier-uuid-123",
    "user_id": "user-uuid",
    "po_number": "PO202507001",
    "status": "draft",
    "order_date": "2025-07-07",
    "expected_delivery_date": "2025-07-15",
    "total_amount": 2750000,
    "notes": "Urgent order for new stock",
    "created_at": "2025-07-07T14:30:00.000Z",
    "items": [
      {
        "id": "item-uuid-1",
        "product_id": "product-uuid-1",
        "quantity": 100,
        "cost_per_item": 15000,
        "total_cost": 1500000,
        "received_quantity": 0
      },
      {
        "id": "item-uuid-2",
        "product_id": "product-uuid-2",
        "quantity": 50,
        "cost_per_item": 25000,
        "total_cost": 1250000,
        "received_quantity": 0
      }
    ]
  },
  "message": "Purchase order created successfully"
}
```

**Test Case 2.2: Validation Error (Missing Supplier)**
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": "product-uuid-1", "quantity": 10, "cost_per_item": 15000}
    ]
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Supplier ID is required"
}
```

**Test Case 2.3: Validation Error (Empty Items)**
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier-uuid-123",
    "items": []
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Items are required and must be an array"
}
```

**Test Case 2.4: Validation Error (Invalid Item Data)**
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier-uuid-123",
    "items": [
      {"product_id": "product-uuid-1", "quantity": -10, "cost_per_item": 15000}
    ]
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Quantity must be greater than 0 and cost_per_item must be non-negative"
}
```

### **3. GET /api/purchase-orders/:id - Get Purchase Order Detail**

**Test Case 3.1: Get Existing PO with Items & Supplier**
```bash
curl -X GET http://localhost:3000/api/purchase-orders/[PO_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "po_number": "PO202507001",
    "status": "draft",
    "total_amount": 2750000,
    "suppliers": {
      "id": "supplier-uuid",
      "name": "PT. Supplier Indonesia",
      "contact_person": "John Doe",
      "phone": "081234567890",
      "email": "john@supplier.com",
      "address": "Jl. Supplier No. 123"
    },
    "items": [
      {
        "id": "item-uuid-1",
        "product_id": "product-uuid-1",
        "quantity": 100,
        "cost_per_item": 15000,
        "total_cost": 1500000,
        "received_quantity": 0,
        "products": {
          "id": "product-uuid-1",
          "name": "Product Name",
          "sku": "SKU001",
          "unit": "pcs"
        }
      }
    ],
    "summary": {
      "total_items": 2,
      "total_quantity": 150,
      "total_received": 0,
      "total_pending": 150
    }
  }
}
```

**Test Case 3.2: PO Not Found**
```bash
curl -X GET http://localhost:3000/api/purchase-orders/nonexistent-id \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 404 Not Found
{
  "success": false,
  "error": "Purchase order not found"
}
```

### **4. PUT /api/purchase-orders/:id - Update Purchase Order**

**Test Case 4.1: Update PO (Draft Status)**
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/[PO_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "expected_delivery_date": "2025-07-20",
    "notes": "Updated delivery date"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "expected_delivery_date": "2025-07-20",
    "notes": "Updated delivery date",
    "updated_at": "2025-07-07T14:45:00.000Z"
  },
  "message": "Purchase order updated successfully"
}
```

**Test Case 4.2: Update Non-Draft PO (Should Fail)**
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/[ORDERED_PO_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Trying to update ordered PO"
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Purchase order can only be updated when status is draft"
}
```

### **5. PUT /api/purchase-orders/:id/status - Update Status with Workflow**

**Test Case 5.1: Draft → Ordered**
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/[PO_ID]/status \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ordered",
    "notes": "PO sent to supplier"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "status": "ordered",
    "notes": "PO sent to supplier",
    "updated_at": "2025-07-07T15:00:00.000Z"
  },
  "message": "Purchase order status updated to ordered"
}
```

**Test Case 5.2: Invalid Status Transition**
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/[DRAFT_PO_ID]/status \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Cannot change status from draft to completed"
}
```

**Test Case 5.3: Invalid Status Value**
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/[PO_ID]/status \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "invalid_status"
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Invalid status. Valid statuses: draft, ordered, partially_received, completed, cancelled"
}
```

### **6. GET /api/purchase-orders/:id/receive-form - Get Receiving Form**

**Test Case 6.1: Get Receiving Form (Ordered PO)**
```bash
curl -X GET http://localhost:3000/api/purchase-orders/[ORDERED_PO_ID]/receive-form \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "purchase_order": {
      "id": "po-uuid",
      "po_number": "PO202507001",
      "status": "ordered",
      "supplier": { ... }
    },
    "items": [
      {
        "id": "item-uuid-1",
        "product_id": "product-uuid-1",
        "quantity": 100,
        "received_quantity": 0,
        "remaining_quantity": 100,
        "can_receive": true,
        "cost_per_item": 15000,
        "products": { ... }
      }
    ]
  }
}
```

**Test Case 6.2: Get Receiving Form (Draft PO - Should Fail)**
```bash
curl -X GET http://localhost:3000/api/purchase-orders/[DRAFT_PO_ID]/receive-form \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Purchase order is not available for receiving"
}
```

### **7. POST /api/purchase-orders/:id/receive - Receive Goods with Stock Integration**

**Test Case 7.1: Partial Receive**
```bash
curl -X POST http://localhost:3000/api/purchase-orders/[ORDERED_PO_ID]/receive \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "outlet_id": "outlet-uuid-main",
    "notes": "Partial delivery - rest coming tomorrow",
    "receivedItems": [
      {
        "item_id": "item-uuid-1",
        "received_quantity": 60
      },
      {
        "item_id": "item-uuid-2",
        "received_quantity": 0
      }
    ]
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "id": "po-uuid",
    "status": "partially_received",
    "items": [
      {
        "id": "item-uuid-1",
        "quantity": 100,
        "received_quantity": 60,
        "remaining": 40
      },
      {
        "id": "item-uuid-2",
        "quantity": 50,
        "received_quantity": 0,
        "remaining": 50
      }
    ]
  },
  "message": "Goods received successfully and stock updated"
}
```

**Test Case 7.2: Complete Receive**
```bash
curl -X POST http://localhost:3000/api/purchase-orders/[PARTIALLY_RECEIVED_PO_ID]/receive \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "outlet_id": "outlet-uuid-main",
    "notes": "Final delivery completed",
    "receivedItems": [
      {
        "item_id": "item-uuid-1",
        "received_quantity": 40
      },
      {
        "item_id": "item-uuid-2",
        "received_quantity": 50
      }
    ]
  }'

# Expected Response: 200 OK with status = "completed"
```

**Test Case 7.3: Receive without Outlet ID**
```bash
curl -X POST http://localhost:3000/api/purchase-orders/[ORDERED_PO_ID]/receive \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json" \
  -d '{
    "receivedItems": [
      {"item_id": "item-uuid-1", "received_quantity": 50}
    ]
  }'

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Outlet ID is required for receiving goods"
}
```

### **8. DELETE /api/purchase-orders/:id - Delete Purchase Order**

**Test Case 8.1: Delete Draft PO (Success)**
```bash
curl -X DELETE http://localhost:3000/api/purchase-orders/[DRAFT_PO_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "message": "Purchase order deleted successfully"
}
```

**Test Case 8.2: Delete Non-Draft PO (Should Fail)**
```bash
curl -X DELETE http://localhost:3000/api/purchase-orders/[ORDERED_PO_ID] \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 400 Bad Request
{
  "success": false,
  "error": "Purchase order can only be deleted when status is draft"
}
```

### **9. GET /api/purchase-orders/search/:term - Search Purchase Orders**

**Test Case 9.1: Search by PO Number**
```bash
curl -X GET "http://localhost:3000/api/purchase-orders/search/PO202507" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"

# Expected Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "po-uuid",
      "po_number": "PO202507001",
      "status": "ordered",
      "total_amount": 2750000,
      "order_date": "2025-07-07",
      "suppliers": {
        "name": "PT. Supplier Indonesia"
      }
    }
  ]
}
```

**Test Case 9.2: Search by Supplier Name**
```bash
curl -X GET "http://localhost:3000/api/purchase-orders/search/supplier" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

**Test Case 9.3: Search with Limit**
```bash
curl -X GET "http://localhost:3000/api/purchase-orders/search/PO?limit=3" \
  -H "x-user-id: [PRO_USER_ID]" \
  -H "Content-Type: application/json"
```

---

## 🔗 **Integration Testing with Existing APIs**

### **Stock Integration Tests**
```bash
# 1. Check stock before receiving
curl -X GET "http://localhost:3000/api/stocks?outlet_id=outlet-uuid" \
  -H "x-user-id: [PRO_USER_ID]"

# 2. Receive goods (should update stock)
curl -X POST http://localhost:3000/api/purchase-orders/[PO_ID]/receive \
  -H "x-user-id: [PRO_USER_ID]" \
  -d '{ "outlet_id": "outlet-uuid", "receivedItems": [...] }'

# 3. Verify stock updated
curl -X GET "http://localhost:3000/api/stocks?outlet_id=outlet-uuid" \
  -H "x-user-id: [PRO_USER_ID]"

# 4. Check stock movements created
curl -X GET "http://localhost:3000/api/stock-movements?type=purchase" \
  -H "x-user-id: [PRO_USER_ID]"
```

### **Suppliers Integration Tests**
```bash
# 1. Create supplier first
curl -X POST http://localhost:3000/api/suppliers \
  -H "x-user-id: [PRO_USER_ID]" \
  -d '{ "name": "Test Supplier" }'

# 2. Create PO for supplier
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "x-user-id: [PRO_USER_ID]" \
  -d '{ "supplier_id": "supplier-uuid", "items": [...] }'

# 3. Check supplier's purchase orders
curl -X GET "http://localhost:3000/api/suppliers/[SUPPLIER_ID]/purchase-orders" \
  -H "x-user-id: [PRO_USER_ID]"
```

---

## 🔒 **Feature Gating & Authorization Tests**

### **Plan-Based Access Testing**
1. ✅ **Basic Plan User** → Should get 403 for all PO endpoints
2. ✅ **Pro Plan User** → Should access all PO endpoints
3. ✅ **Enterprise Plan User** → Should access all PO endpoints

### **Status-Based Operations Testing**
1. ✅ **Draft PO** → Can update, delete, change to ordered/cancelled
2. ✅ **Ordered PO** → Can receive goods, change to partially_received/completed/cancelled
3. ✅ **Completed PO** → Read-only, no modifications allowed
4. ✅ **Cancelled PO** → Read-only, no modifications allowed

---

## 📊 **Performance & Edge Case Tests**

### **Large Dataset Testing**
```bash
# Test pagination with large number of POs
curl -X GET "http://localhost:3000/api/purchase-orders?page=100&limit=50" \
  -H "x-user-id: [PRO_USER_ID]"

# Test search performance
curl -X GET "http://localhost:3000/api/purchase-orders/search/PO" \
  -H "x-user-id: [PRO_USER_ID]"
```

### **Error Scenario Testing**
1. **Database Disconnection**: Test saat database unavailable
2. **Concurrent Receiving**: Multiple users receiving same PO simultaneously  
3. **Invalid Product IDs**: Create PO dengan non-existent products
4. **Insufficient Permissions**: Staff trying to access owner-only features
5. **Stock Overflow**: Receiving more than ordered quantity

---

## ✅ **Success Criteria**

**Purchase Orders API dianggap sukses jika:**
- ✅ Complete workflow: Draft → Ordered → Received → Completed
- ✅ Feature gating berfungsi (Basic plan = 403, Pro+ = 200)
- ✅ Stock integration working (auto-update saat receive goods)
- ✅ Stock movements created untuk audit trail
- ✅ PO number auto-generation working
- ✅ Status transition validation working
- ✅ Multi-tenant isolation perfect
- ✅ Suppliers integration seamless
- ✅ Error handling & validation robust
- ✅ Search & pagination performance optimal

**Business Impact:**
- ✅ Pro Plan users dapat complete purchase workflow
- ✅ Automatic stock management dengan audit trail
- ✅ Integration dengan suppliers untuk vendor relationship
- ✅ Business intelligence data untuk purchase analytics

---

## 🚀 **Next Steps After Testing**

1. **Frontend Integration** - Create PO management UI
2. **Advanced Features** - Auto-reorder, supplier performance analytics
3. **Mobile App** - Goods receiving via mobile dengan barcode scanner
4. **Reporting** - Purchase reports, supplier comparison, cost analysis

**Status**: ✅ **PURCHASE ORDERS API IMPLEMENTATION COMPLETED**  
**Ready for**: Frontend integration, advanced features, production deployment
