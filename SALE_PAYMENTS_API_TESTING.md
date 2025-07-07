# Sale Payments API Testing Guide

## Prerequisites
1. Backend server running on http://localhost:3000
2. Valid JWT tokens for testing organizations
3. Existing sales data in database untuk testing

## Test Endpoints

### 1. Get Payment Methods (Public)
```bash
curl -X GET "http://localhost:3000/api/sale-payments/methods" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Get All Payments (dengan filter)
```bash
# Get all payments
curl -X GET "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payments for specific sale
curl -X GET "http://localhost:3000/api/sale-payments?sale_id=123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payments by method
curl -X GET "http://localhost:3000/api/sale-payments?method=cash" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Payments for Specific Sale
```bash
curl -X GET "http://localhost:3000/api/sale-payments/sale/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Create Payment
```bash
curl -X POST "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 123,
    "method": "cash",
    "amount": 50000
  }'
```

### 5. Update Payment
```bash
curl -X PUT "http://localhost:3000/api/sale-payments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "transfer",
    "amount": 60000
  }'
```

### 6. Delete Payment
```bash
curl -X DELETE "http://localhost:3000/api/sale-payments/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Business Logic Testing

### Multi-Payment Scenario
```bash
# Sale total: 100,000
# Payment 1: Cash 50,000
curl -X POST "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 123,
    "method": "cash",
    "amount": 50000
  }'

# Payment 2: Transfer 50,000
curl -X POST "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 123,
    "method": "transfer",
    "amount": 50000
  }'
```

### Error Testing
```bash
# Test payment exceeding sale total (should fail)
curl -X POST "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 123,
    "method": "cash",
    "amount": 150000
  }'

# Test invalid payment method (should fail)
curl -X POST "http://localhost:3000/api/sale-payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": 123,
    "method": "invalid_method",
    "amount": 10000
  }'
```

## Organization Isolation Testing

### Test with Different Organizations
1. Create payment with Org A token
2. Try to access payment with Org B token (should fail)
3. Verify payments are filtered by organization

## Expected Responses

### Success Response
```json
{
  "id": 1,
  "sale_id": 123,
  "method": "cash",
  "amount": "50000",
  "created_at": "2025-01-07T...",
  "sales": {
    "id": 123,
    "total": "100000",
    "customers": {
      "id": 1,
      "name": "Customer Name"
    }
  }
}
```

### Error Response
```json
{
  "error": "Total payments cannot exceed sale total",
  "sale_total": 100000,
  "current_payments": 50000,
  "attempted_payment": 60000
}
```
