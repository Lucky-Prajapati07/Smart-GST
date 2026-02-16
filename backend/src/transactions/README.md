# Transactions API

This module provides complete CRUD operations for managing transactions in the Smart GST Filing system.

## Database Schema

The `Transactions` model in Prisma schema includes the following fields:

- `id`: Auto-incrementing primary key
- `transactionType`: Type of transaction (e.g., 'Income', 'Expense', 'Transfer')
- `mode`: Payment mode (e.g., 'Cash', 'Online', 'Cheque', 'UPI')
- `amount`: Transaction amount (stored as string for precision)
- `date`: Transaction date
- `description`: Transaction description
- `reference`: Optional reference number
- `category`: Optional transaction category
- `notes`: Optional additional notes
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

## API Endpoints

### 1. Create Transaction
**POST** `/transactions`

Create a new transaction record.

**Request Body:**
```json
{
  "transactionType": "Income",
  "mode": "Online",
  "amount": "15000.00",
  "date": "2025-08-28T10:30:00Z",
  "description": "Payment received from client",
  "reference": 12345,
  "category": "Service Revenue",
  "notes": "GST invoice generated"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "transactionType": "Income",
  "mode": "Online",
  "amount": "15000.00",
  "date": "2025-08-28T10:30:00.000Z",
  "description": "Payment received from client",
  "reference": 12345,
  "category": "Service Revenue",
  "notes": "GST invoice generated",
  "createdAt": "2025-08-28T12:00:00.000Z",
  "updatedAt": "2025-08-28T12:00:00.000Z"
}
```

### 2. Get All Transactions
**GET** `/transactions`

Retrieve all transactions, ordered by creation date (newest first).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "transactionType": "Income",
    "mode": "Online",
    "amount": "15000.00",
    "date": "2025-08-28T10:30:00.000Z",
    "description": "Payment received from client",
    "reference": 12345,
    "category": "Service Revenue",
    "notes": "GST invoice generated",
    "createdAt": "2025-08-28T12:00:00.000Z",
    "updatedAt": "2025-08-28T12:00:00.000Z"
  }
]
```

### 3. Get Transaction by ID
**GET** `/transactions/:id`

Retrieve a specific transaction by its ID.

**Response:** `200 OK` (same format as create response)

**Error Response:** `404 Not Found`
```json
{
  "statusCode": 404,
  "message": "Transaction with ID 999 not found"
}
```

### 4. Update Transaction
**PATCH** `/transactions/:id`

Update an existing transaction. Only provided fields will be updated.

**Request Body:** (partial update)
```json
{
  "amount": "16000.00",
  "notes": "Updated amount after verification"
}
```

**Response:** `200 OK` (updated transaction object)

### 5. Delete Transaction
**DELETE** `/transactions/:id`

Delete a transaction by its ID.

**Response:** `200 OK`
```json
{
  "message": "Transaction with ID 1 has been deleted successfully"
}
```

### 6. Get Transactions by Type
**GET** `/transactions/type/:transactionType`

Retrieve all transactions of a specific type.

**Example:** `GET /transactions/type/Income`

**Response:** `200 OK` (array of transactions)

### 7. Get Transactions by Date Range
**GET** `/transactions/date-range?startDate=2025-01-01&endDate=2025-12-31`

Retrieve transactions within a specific date range.

**Query Parameters:**
- `startDate`: Start date (ISO string format)
- `endDate`: End date (ISO string format)

**Response:** `200 OK` (array of transactions)

### 8. Get Statistics by Type
**GET** `/transactions/stats/by-type`

Get transaction count grouped by transaction type.

**Response:** `200 OK`
```json
[
  {
    "transactionType": "Income",
    "count": 5
  },
  {
    "transactionType": "Expense",
    "count": 3
  }
]
```

## DTOs

### CreateTransactionDto
- `transactionType`: string (required)
- `mode`: string (required)
- `amount`: string (required)
- `date`: string (required, ISO date format)
- `description`: string (required)
- `reference`: number (optional)
- `category`: string (optional)
- `notes`: string (optional)

### UpdateTransactionDto
Partial type of CreateTransactionDto - all fields are optional.

### TransactionResponseDto
Complete transaction object returned by the API, including:
- All CreateTransactionDto fields
- `id`: number
- `createdAt`: Date
- `updatedAt`: Date

## Validation

The API includes comprehensive validation:
- Required fields are validated
- Date strings must be in valid ISO format
- String fields must not be empty when required
- Reference must be a valid integer when provided

## Error Handling

The API provides appropriate HTTP status codes and error messages:
- `400 Bad Request`: Validation errors or operation failures
- `404 Not Found`: Transaction not found
- `201 Created`: Successful creation
- `200 OK`: Successful retrieval, update, or deletion

## Usage Examples

### Frontend Integration
```javascript
// Create a new transaction
const createTransaction = async (transactionData) => {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  return response.json();
};

// Get all transactions
const getAllTransactions = async () => {
  const response = await fetch('/api/transactions');
  return response.json();
};

// Update a transaction
const updateTransaction = async (id, updateData) => {
  const response = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  return response.json();
};
```

## Testing

Use the provided `test-transactions-api.js` file to test all endpoints:

```bash
node test-transactions-api.js
```

Make sure your backend server is running on `http://localhost:3000` before running the tests.

## Features

✅ Complete CRUD operations
✅ Input validation with class-validator
✅ Type-safe DTOs
✅ Proper error handling
✅ Database integration with Prisma
✅ Additional utility endpoints (by type, date range, statistics)
✅ Comprehensive documentation
✅ Test file included

The transactions module is now fully functional and ready for integration with your Smart GST Filing frontend application.
