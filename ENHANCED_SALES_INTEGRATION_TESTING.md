# Enhanced Sales Integration API Testing Guide

## Prerequisites
1. Backend server running on http://localhost:3000
2. Valid JWT tokens for testing organizations
3. Existing products, outlets, customers, and stocks data in database
4. Understanding of sale_payments and stock_movements APIs

## New Enhanced Endpoints

### 1. Enhanced Sales Creation (with payments and stock tracking)
```bash
# Create sale with multiple payments and automatic stock tracking
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "outlet_id": "OUTLET_UUID",
    "total": 100000,
    "items": [
      {
        "product_id": "PRODUCT_UUID_1",
        "name": "Product 1",
        "quantity": 2,
        "price": 25000
      },
      {
        "product_id": "PRODUCT_UUID_2", 
        "name": "Product 2",
        "quantity": 1,
        "price": 50000
      }
    ],
    "payments": [
      {
        "method": "cash",
        "amount": 60000
      },
      {
        "method": "transfer",
        "amount": 40000
      }
    ],
    "customer_name": "John Doe",
    "customer_phone": "081234567890"
  }'
```

### 2. Get Enhanced Sale Details
```bash
# Get sale with payments and stock movements
curl -X GET "http://localhost:3000/api/sales/SALE_ID/enhanced" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Payments for Specific Sale
```bash
curl -X GET "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Add Payment to Existing Sale
```bash
curl -X POST "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "qris",
    "amount": 25000
  }'
```

### 5. Get Stock Movements for Sale
```bash
curl -X GET "http://localhost:3000/api/sales/SALE_ID/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Enhanced Sales List (with payment summary)
```bash
# Get all sales with payment summary
curl -X GET "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filters
curl -X GET "http://localhost:3000/api/sales?start_date=2025-01-01&end_date=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration Testing Scenarios

### 1. Complete Sale Transaction Flow
```bash
# Step 1: Check initial stock for products
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 2: Create sale with payments and items
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "outlet_id": "OUTLET_UUID",
    "total": 50000,
    "items": [
      {
        "product_id": "PRODUCT_UUID",
        "name": "Test Product",
        "quantity": 3,
        "price": 15000
      }
    ],
    "payments": [
      {
        "method": "cash",
        "amount": 50000
      }
    ]
  }'

# Step 3: Verify stock was reduced
curl -X GET "http://localhost:3000/api/stock-movements/product/PRODUCT_UUID/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 4: Check sale payments
curl -X GET "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Step 5: Check stock movements
curl -X GET "http://localhost:3000/api/sales/SALE_ID/stock-movements" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Partial Payment Scenario
```bash
# Create sale with partial payment
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total": 100000,
    "outlet_id": "OUTLET_UUID",
    "payments": [
      {
        "method": "cash",
        "amount": 70000
      }
    ]
  }'

# Add remaining payment later
curl -X POST "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "transfer",
    "amount": 30000
  }'

# Verify payment summary
curl -X GET "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Insufficient Stock Test
```bash
# Try to sell more than available stock (should succeed with warning)
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "outlet_id": "OUTLET_UUID",
    "total": 10000,
    "items": [
      {
        "product_id": "PRODUCT_UUID",
        "quantity": 9999,
        "price": 1
      }
    ],
    "payments": [
      {
        "method": "cash",
        "amount": 10000
      }
    ]
  }'
```

### 4. Overpayment Validation Test
```bash
# Try to create sale with payments exceeding total (should fail)
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total": 50000,
    "outlet_id": "OUTLET_UUID",
    "payments": [
      {
        "method": "cash",
        "amount": 60000
      }
    ]
  }'

# Try to add payment that exceeds remaining balance (should fail)
curl -X POST "http://localhost:3000/api/sales/SALE_ID/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "transfer",
    "amount": 50000
  }'
```

### 5. Backward Compatibility Test
```bash
# Create sale the old way (should still work)
curl -X POST "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_ID",
    "total": 25000,
    "customer_name": "Legacy Customer",
    "items": "Legacy items format"
  }'

# Verify it appears in sales list
curl -X GET "http://localhost:3000/api/sales" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Enhanced Responses

### Enhanced Sale Creation Response
```json
{
  "id": 123,
  "customer_id": "customer-uuid",
  "outlet_id": "outlet-uuid",
  "total": "100000",
  "items": [...],
  "created_at": "2025-01-07T...",
  "organization_id": "org-uuid",
  "user_id": "user-uuid",
  "payments": [
    {
      "id": 1,
      "sale_id": 123,
      "method": "cash",
      "amount": "60000",
      "created_at": "2025-01-07T..."
    },
    {
      "id": 2,
      "sale_id": 123,
      "method": "transfer", 
      "amount": "40000",
      "created_at": "2025-01-07T..."
    }
  ],
  "stock_movements": [
    {
      "id": "movement-uuid",
      "product_id": "product-uuid",
      "type": "sale",
      "quantity": -2,
      "before_stock": 10,
      "after_stock": 8
    }
  ],
  "payment_summary": {
    "total_paid": 100000,
    "remaining": 0,
    "is_paid_full": true
  }
}
```

### Enhanced Sales List Response
```json
[
  {
    "id": 123,
    "total": "100000",
    "customer_name": "John Doe",
    "created_at": "2025-01-07T...",
    "customers": {
      "id": "customer-uuid",
      "name": "John Doe",
      "phone_number": "081234567890"
    },
    "sale_payments": [
      {
        "id": 1,
        "method": "cash",
        "amount": "60000"
      },
      {
        "id": 2,
        "method": "transfer",
        "amount": "40000"
      }
    ],
    "payment_summary": {
      "total_paid": 100000,
      "remaining": 0,
      "is_paid_full": true,
      "payment_count": 2
    }
  }
]
```

### Payment Summary Response
```json
{
  "sale_id": 123,
  "payments": [...],
  "summary": {
    "sale_total": 100000,
    "total_paid": 70000,
    "remaining": 30000,
    "is_paid_full": false,
    "payments": [...],
    "payment_count": 1
  }
}
```

## Error Responses

### Overpayment Error
```json
{
  "error": "Total payments cannot exceed sale total",
  "sale_total": 50000,
  "total_payments": 60000
}
```

### Insufficient Stock Warning
Stock movements will be created but may result in negative stock. Check stock_movements API for details.

## Integration Benefits

1. **Automatic Integration**: Sales now automatically create payments and stock movements
2. **Backward Compatibility**: Existing sales API calls still work without modifications
3. **Enhanced Data**: All sales responses now include payment summary
4. **Real-time Tracking**: Stock movements are created immediately with sales
5. **Payment Flexibility**: Support for multiple payment methods per transaction
6. **Audit Trail**: Complete tracking of stock changes and payments

## Testing Checklist

- [ ] Create sale with single payment - success
- [ ] Create sale with multiple payments - success  
- [ ] Create sale with overpayment - error
- [ ] Create sale without payments - success (backward compatibility)
- [ ] Add payment to existing sale - success
- [ ] Add payment exceeding remaining balance - error
- [ ] Stock movements created automatically - success
- [ ] Enhanced sales list shows payment summary - success
- [ ] Organization isolation maintained - success
- [ ] All existing functionality preserved - success
