# Expenses Module API Documentation

This module provides a complete CRUD REST API for managing expenses in the Smart GST Filing application.

## Features

- Create, Read, Update, Delete expenses
- Filter expenses by category, status, and date range
- Input validation using DTOs
- Error handling with appropriate HTTP status codes
- Prisma ORM integration

## API Endpoints

### Base URL: `/expenses`

### 1. Create Expense
- **POST** `/expenses`
- **Body:** CreateExpenseDto
- **Response:** 201 Created with ExpenseResponseDto

### 2. Get All Expenses
- **GET** `/expenses`
- **Query Parameters:**
  - `category` (optional): Filter by category (case-insensitive partial match)
  - `status` (optional): Filter by exact status
  - `startDate` (optional): Start date for date range filter (ISO string)
  - `endDate` (optional): End date for date range filter (ISO string)
- **Response:** 200 OK with ExpenseResponseDto[]

### 3. Get Expense by ID
- **GET** `/expenses/:id`
- **Parameters:** `id` (number)
- **Response:** 200 OK with ExpenseResponseDto or 404 Not Found

### 4. Update Expense
- **PATCH** `/expenses/:id`
- **Parameters:** `id` (number)
- **Body:** UpdateExpenseDto (partial)
- **Response:** 200 OK with ExpenseResponseDto or 404 Not Found

### 5. Delete Expense
- **DELETE** `/expenses/:id`
- **Parameters:** `id` (number)
- **Response:** 200 OK with success message or 404 Not Found

### 6. Get Expenses by Category
- **GET** `/expenses/category/:category`
- **Parameters:** `category` (string)
- **Response:** 200 OK with ExpenseResponseDto[]

### 7. Get Expenses by Status
- **GET** `/expenses/status/:status`
- **Parameters:** `status` (string)
- **Response:** 200 OK with ExpenseResponseDto[]

### 8. Get Expenses by Date Range
- **GET** `/expenses/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **Query Parameters:** `startDate`, `endDate` (ISO date strings)
- **Response:** 200 OK with ExpenseResponseDto[]

### 9. Get Incomplete Expenses
- **GET** `/expenses/incomplete`
- **Description:** Returns expenses with missing optional fields (status, description, or itc)
- **Response:** 200 OK with ExpenseResponseDto[]

## Data Transfer Objects (DTOs)

### CreateExpenseDto
```typescript
{
  title: string;           // Required
  category: string;        // Required
  amount: string;          // Required
  gst: string;            // Required
  totalAmount?: string;    // Optional
  vendor?: string;         // Optional
  paymentMode: string;     // Required
  date: string;           // Required (ISO date string)
  notes?: string;         // Optional
  uploadReceipt?: string; // Optional
  itc?: string;           // Optional
  status?: string;        // Optional
  description?: string;   // Optional
}
```

### UpdateExpenseDto
- Same as CreateExpenseDto but all fields are optional

### ExpenseResponseDto
```typescript
{
  id: number;
  title: string;
  category: string;
  amount: string;
  gst: string;
  totalAmount?: string;
  vendor?: string;
  paymentMode: string;
  date: Date;
  notes?: string;
  uploadReceipt?: string;
  itc?: string;
  status?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Example Usage

### Create an Expense with Minimal Fields
```bash
curl -X POST http://localhost:3001/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Travel Expense",
    "category": "Travel",
    "amount": "500.00",
    "gst": "90.00",
    "paymentMode": "Cash",
    "date": "2025-09-03T14:00:00.000Z"
  }'
```

### Create an Expense with All Fields
```bash
curl -X POST http://localhost:3001/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Office Supplies",
    "category": "Office Expenses",
    "amount": "1500.00",
    "gst": "270.00",
    "totalAmount": "1770.00",
    "vendor": "Office Mart",
    "paymentMode": "Credit Card",
    "date": "2025-09-03T10:00:00.000Z",
    "notes": "Monthly office supplies purchase",
    "itc": "Yes",
    "status": "Paid",
    "description": "Purchased stationery and office supplies"
  }'
```

### Get Incomplete Expenses
```bash
curl http://localhost:3001/expenses/incomplete
```

### Get All Expenses with Filters
```bash
# Get all expenses
curl http://localhost:3001/expenses

# Filter by category
curl http://localhost:3001/expenses?category=Office

# Filter by status
curl http://localhost:3001/expenses?status=Paid

# Filter by date range
curl "http://localhost:3001/expenses?startDate=2025-09-01&endDate=2025-09-30"
```

### Update an Expense
```bash
curl -X PATCH http://localhost:3001/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Pending",
    "amount": "2000.00"
  }'
```

### Delete an Expense
```bash
curl -X DELETE http://localhost:3001/expenses/1
```

## Error Responses

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Expense not found
- **409 Conflict**: Database operation failed

## Testing

Run the test script to verify all endpoints:

```bash
node test-expenses-api.js
```

Make sure your backend server is running on port 3001 before running tests.

## Database Schema

The Expenses table includes the following fields:
- `id`: Auto-incrementing primary key
- `title`: Expense title
- `category`: Expense category
- `amount`: Base amount
- `gst`: GST amount
- `totalAmount`: Total amount including GST (optional)
- `vendor`: Vendor name (optional)
- `paymentMode`: Payment method
- `date`: Expense date
- `notes`: Additional notes (optional)
- `uploadReceipt`: Receipt file path/URL (optional)
- `itc`: Input Tax Credit eligibility (optional)
- `status`: Expense status (optional)
- `description`: Detailed description (optional)
- `createdAt`: Record creation timestamp
- `updatedAt`: Record last update timestamp

## Schema Changes

**Recent Update**: The `itc`, `status`, and `description` fields have been changed from required to optional fields in the database schema. This allows for more flexible expense creation where users can initially create expenses with minimal information and complete the details later.
