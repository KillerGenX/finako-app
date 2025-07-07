# Stock Movements API Testing Guide

## Prerequisites
1. Backend server running on http://localhost:3000
2. Valid JWT tokens for testing organizations
3. Existing products, outlets, and stocks data in database

## Test Endpoints

### 1. Get Movement Types (Public)
```bash
curl -X GET "http://localhost:3000/api/stock-movements/types" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Get All Movements (dengan filter)
```bash
# Get all movements
curl -X GET "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get movements for specific product
curl -X GET "http://localhost:3000/api/stock-movements?product_id=PRODUCT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get movements by type
curl -X GET "http://localhost:3000/api/stock-movements?type=sale" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get movements with date range
curl -X GET "http://localhost:3000/api/stock-movements?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Movements by Product
```bash
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With outlet filter
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID?outlet_id=OUTLET_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Movements by Outlet
```bash
curl -X GET "http://localhost:3000/api/stock-movements/outlet/OUTLET_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Create Stock Movement
```bash
# Sale movement (stock out)
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID",
    "type": "sale",
    "quantity": 5,
    "note": "Penjualan reguler"
  }'

# Purchase movement (stock in)
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID",
    "type": "purchase",
    "quantity": 50,
    "note": "Pembelian dari supplier ABC"
  }'

# Stock adjustment
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID",
    "type": "adjustment",
    "quantity": -3,
    "note": "Koreksi stock opname"
  }'
```

### 6. Get Audit Report
```bash
# General audit report
curl -X GET "http://localhost:3000/api/stock-movements/audit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtered audit report
curl -X GET "http://localhost:3000/api/stock-movements/audit?product_id=PRODUCT_UUID&start_date=2025-01-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Get Low Stock Products
```bash
# Default threshold (10)
curl -X GET "http://localhost:3000/api/stock-movements/low-stock" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Custom threshold
curl -X GET "http://localhost:3000/api/stock-movements/low-stock?threshold=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# For specific outlet
curl -X GET "http://localhost:3000/api/stock-movements/low-stock?outlet_id=OUTLET_UUID&threshold=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Get Stock Summary
```bash
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# For specific outlet
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary?outlet_id=OUTLET_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 9. Update Movement (Note only)
```bash
curl -X PUT "http://localhost:3000/api/stock-movements/MOVEMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Updated note for audit purposes"
  }'
```

### 10. Delete Movement (Restricted)
```bash
curl -X DELETE "http://localhost:3000/api/stock-movements/MOVEMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Business Logic Testing Scenarios

### 1. Stock Tracking Test
```bash
# Step 1: Check initial stock
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 2: Create purchase movement (+50)
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID", 
    "type": "purchase",
    "quantity": 50,
    "note": "Test purchase"
  }'

# Step 3: Check updated stock
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 4: Create sale movement (-10)  
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID",
    "type": "sale", 
    "quantity": 10,
    "note": "Test sale"
  }'

# Step 5: Verify final stock
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Insufficient Stock Test
```bash
# Try to sell more than available (should fail)
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "outlet_id": "OUTLET_UUID",
    "type": "sale",
    "quantity": 9999,
    "note": "Should fail - insufficient stock"
  }'
```

### 3. Movement Types Test
```bash
# Test all movement types
types=("sale" "purchase" "adjustment" "transfer" "initial" "loss")

for type in "${types[@]}"; do
  curl -X POST "http://localhost:3000/api/stock-movements" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"product_id\": \"PRODUCT_UUID\",
      \"outlet_id\": \"OUTLET_UUID\",
      \"type\": \"$type\",
      \"quantity\": 1,
      \"note\": \"Test $type movement\"
    }"
done
```

### 4. Organization Isolation Test
```bash
# Create movement with Org A token
curl -X POST "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer ORG_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "ORG_A_PRODUCT_UUID",
    "outlet_id": "ORG_A_OUTLET_UUID",
    "type": "purchase",
    "quantity": 10,
    "note": "Org A movement"
  }'

# Try to access with Org B token (should not see Org A movements)
curl -X GET "http://localhost:3000/api/stock-movements" \
  -H "Authorization: Bearer ORG_B_TOKEN"
```

## Expected Responses

### Success Response - Create Movement
```json
{
  "id": "movement-uuid",
  "product_id": "product-uuid",
  "outlet_id": "outlet-uuid", 
  "organization_id": "org-uuid",
  "user_id": "user-uuid",
  "type": "purchase",
  "quantity": 50,
  "before_stock": 10,
  "after_stock": 60,
  "note": "Pembelian dari supplier",
  "created_at": "2025-01-07T...",
  "products": {
    "id": "product-uuid",
    "name": "Product Name",
    "sku": "SKU123"
  },
  "outlets": {
    "id": "outlet-uuid", 
    "name": "Outlet Name"
  }
}
```

### Success Response - Audit Report
```json
{
  "summary": {
    "total_movements": 25,
    "movements_by_type": {
      "sale": 10,
      "purchase": 8,
      "adjustment": 3,
      "initial": 4
    },
    "total_stock_in": 150,
    "total_stock_out": 75,
    "products_affected": 5,
    "outlets_affected": 2
  },
  "movements": [...],
  "filters_applied": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }
}
```

### Error Response - Insufficient Stock
```json
{
  "error": "Insufficient stock",
  "current_stock": 5,
  "requested_quantity": 10
}
```

### Error Response - Invalid Movement Type
```json
{
  "error": "Invalid movement type. Valid types: sale, purchase, adjustment, transfer, initial, loss"
}
```

## Integration with Sales API

Stock movements can be automatically created when sales transactions occur:

```bash
# This should trigger automatic stock movement creation
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "outlet_id": "OUTLET_UUID",
    "items": [
      {
        "product_id": "PRODUCT_UUID",
        "quantity": 2,
        "price": 10000
      }
    ],
    "total": 20000
  }'

# Check if stock movement was created automatically
curl -X GET "http://localhost:3000/api/stock-movements?type=sale" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
