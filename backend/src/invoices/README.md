# Invoices API Documentation

## Overview
The Invoices API provides comprehensive CRUD operations for managing invoices in the Smart GST Filing system. It supports both sales and purchase invoices with full GST compliance features.

## Base URL
```
http://localhost:3000/invoices
```

## Invoice Model
```typescript
{
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  invoiceType: string; // 'Sales' or 'Purchase'
  party: string; // Client or Supplier name
  partyGstin: string;
  amount?: string;
  ewayBillNumber?: string;
  transportMode?: string;
  notes?: string;
  gst?: string;
  totalAmount?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### 1. Create Invoice
**POST** `/invoices`

Creates a new invoice.

**Request Body:**
```json
{
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15T00:00:00.000Z",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "invoiceType": "Sales",
  "party": "ABC Company Ltd",
  "partyGstin": "27AAPFU0939F1ZV",
  "amount": "10000.00",
  "gst": "1800.00",
  "totalAmount": "11800.00",
  "status": "Pending",
  "notes": "Monthly service invoice"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15T00:00:00.000Z",
  "dueDate": "2024-02-15T00:00:00.000Z",
  "invoiceType": "Sales",
  "party": "ABC Company Ltd",
  "partyGstin": "27AAPFU0939F1ZV",
  "amount": "10000.00",
  "gst": "1800.00",
  "totalAmount": "11800.00",
  "status": "Pending",
  "notes": "Monthly service invoice",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get All Invoices
**GET** `/invoices`

Retrieves all invoices with optional filtering.

**Query Parameters:**
- `invoiceType` (optional): Filter by invoice type ('Sales' or 'Purchase')
- `status` (optional): Filter by status
- `partyGstin` (optional): Filter by party GSTIN
- `startDate` (optional): Filter by date range (start date)
- `endDate` (optional): Filter by date range (end date)

**Examples:**
- `GET /invoices` - Get all invoices
- `GET /invoices?invoiceType=Sales` - Get all sales invoices
- `GET /invoices?status=Pending` - Get all pending invoices
- `GET /invoices?startDate=2024-01-01&endDate=2024-01-31` - Get invoices for January 2024

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    // ... other invoice fields
  }
]
```

### 3. Get Invoice by ID
**GET** `/invoices/:id`

Retrieves a specific invoice by its ID.

**Response:** `200 OK` or `404 Not Found`

### 4. Get Invoice by Invoice Number
**GET** `/invoices/search/invoice-number/:invoiceNumber`

Retrieves a specific invoice by its invoice number.

**Example:** `GET /invoices/search/invoice-number/INV-2024-001`

**Response:** `200 OK` or `404 Not Found`

### 5. Get Invoices by Party GSTIN
**GET** `/invoices/search/party-gstin/:partyGstin`

Retrieves all invoices for a specific party GSTIN.

**Example:** `GET /invoices/search/party-gstin/27AAPFU0939F1ZV`

**Response:** `200 OK`

### 6. Get Invoices by Type
**GET** `/invoices/search/type/:invoiceType`

Retrieves all invoices of a specific type.

**Example:** `GET /invoices/search/type/Sales`

**Response:** `200 OK`

### 7. Get Invoices by Status
**GET** `/invoices/search/status/:status`

Retrieves all invoices with a specific status.

**Example:** `GET /invoices/search/status/Pending`

**Response:** `200 OK`

### 8. Get Invoice Statistics
**GET** `/invoices/stats`

Retrieves invoice statistics including total count and breakdown by type.

**Response:** `200 OK`
```json
{
  "totalInvoices": 150,
  "salesInvoices": 90,
  "purchaseInvoices": 60
}
```

### 9. Update Invoice by ID
**PATCH** `/invoices/:id`

Updates a specific invoice by its ID.

**Request Body:** (partial update supported)
```json
{
  "status": "Paid",
  "notes": "Payment received on 2024-01-20"
}
```

**Response:** `200 OK` or `404 Not Found`

### 10. Update Invoice by Invoice Number
**PATCH** `/invoices/invoice-number/:invoiceNumber`

Updates a specific invoice by its invoice number.

**Example:** `PATCH /invoices/invoice-number/INV-2024-001`

**Response:** `200 OK` or `404 Not Found`

### 11. Delete Invoice by ID
**DELETE** `/invoices/:id`

Deletes a specific invoice by its ID.

**Response:** `200 OK`
```json
{
  "message": "Invoice with ID 1 successfully deleted"
}
```

### 12. Delete Invoice by Invoice Number
**DELETE** `/invoices/invoice-number/:invoiceNumber`

Deletes a specific invoice by its invoice number.

**Example:** `DELETE /invoices/invoice-number/INV-2024-001`

**Response:** `200 OK`
```json
{
  "message": "Invoice with number INV-2024-001 successfully deleted"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Invoice with ID 1 not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Invoice with this invoiceNumber already exists",
  "error": "Conflict"
}
```

## Validation Rules

### Required Fields
- `invoiceNumber`: Must be unique
- `invoiceDate`: Must be a valid ISO date string
- `dueDate`: Must be a valid ISO date string
- `invoiceType`: Must be a string
- `party`: Must be a string
- `partyGstin`: Must be a string

### Optional Fields
- `amount`: String representation of amount
- `ewayBillNumber`: E-way bill number
- `transportMode`: Transportation mode
- `notes`: Additional notes
- `gst`: GST amount
- `totalAmount`: Total amount including GST
- `status`: Invoice status

## Usage Examples

### Creating a Sales Invoice
```javascript
const response = await fetch('/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    invoiceNumber: 'SALES-2024-001',
    invoiceDate: '2024-01-15T00:00:00.000Z',
    dueDate: '2024-02-15T00:00:00.000Z',
    invoiceType: 'Sales',
    party: 'Customer Company Ltd',
    partyGstin: '27AAPFU0939F1ZV',
    amount: '50000.00',
    gst: '9000.00',
    totalAmount: '59000.00',
    status: 'Draft'
  }),
});
```

### Getting Monthly Sales Report
```javascript
const response = await fetch('/invoices?invoiceType=Sales&startDate=2024-01-01&endDate=2024-01-31');
const salesInvoices = await response.json();
```

### Updating Invoice Status
```javascript
const response = await fetch('/invoices/1', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'Paid'
  }),
});
```

## Testing

Run the test script to verify the API functionality:
```bash
cd backend
node test-invoices-api.js
```

The test script will create, read, update, and delete invoices to ensure all endpoints are working correctly.
