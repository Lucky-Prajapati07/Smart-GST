# Clients REST API

This module provides a complete REST API for managing clients in the Smart GST Filing application.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Search by GSTIN, ID, and phone number
- ✅ Filter by GST type
- ✅ Input validation using class-validator
- ✅ Proper error handling with meaningful messages
- ✅ TypeScript support with strict typing
- ✅ Prisma ORM integration

## API Endpoints

### 1. Create Client
- **POST** `/clients`
- **Body**: CreateClientDto
- **Response**: ClientResponseDto
- **Status**: 201 Created

### 2. Get All Clients
- **GET** `/clients`
- **Query Parameters**: 
  - `gstType` (optional): Filter by GST type
- **Response**: ClientResponseDto[]
- **Status**: 200 OK

### 3. Get Client by GSTIN
- **GET** `/clients/:gstin`
- **Parameters**: `gstin` (string)
- **Response**: ClientResponseDto
- **Status**: 200 OK / 404 Not Found

### 4. Get Client by ID
- **GET** `/clients/id/:id`
- **Parameters**: `id` (number)
- **Response**: ClientResponseDto
- **Status**: 200 OK / 404 Not Found

### 5. Search Client by Phone Number
- **GET** `/clients/search/phone/:phoneNumber`
- **Parameters**: `phoneNumber` (string)
- **Response**: ClientResponseDto
- **Status**: 200 OK / 404 Not Found

### 6. Update Client by GSTIN
- **PATCH** `/clients/:gstin`
- **Parameters**: `gstin` (string)
- **Body**: UpdateClientDto
- **Response**: ClientResponseDto
- **Status**: 200 OK / 404 Not Found / 409 Conflict

### 7. Update Client by ID
- **PATCH** `/clients/id/:id`
- **Parameters**: `id` (number)
- **Body**: UpdateClientDto
- **Response**: ClientResponseDto
- **Status**: 200 OK / 404 Not Found / 409 Conflict

### 8. Delete Client by GSTIN
- **DELETE** `/clients/:gstin`
- **Parameters**: `gstin` (string)
- **Response**: `{ message: string }`
- **Status**: 200 OK / 404 Not Found

### 9. Delete Client by ID
- **DELETE** `/clients/id/:id`
- **Parameters**: `id` (number)
- **Response**: `{ message: string }`
- **Status**: 200 OK / 404 Not Found

## Data Transfer Objects (DTOs)

### CreateClientDto
```typescript
{
  name: string;               // Required
  gstin: string;              // Required, unique
  phoneNumber: string;        // Required, unique
  email?: string;             // Optional
  gstType: string;            // Required (Regular, Composition, Unregistered)
  creditLimit?: number;       // Optional
  billingAddress?: string;    // Optional
  shippingAddress?: string;   // Optional
}
```

### UpdateClientDto
- All fields from CreateClientDto are optional
- Uses PartialType from @nestjs/mapped-types

### ClientResponseDto
```typescript
{
  id: number;
  name: string;
  gstin: string;
  phoneNumber: string;
  email?: string | null;
  gstType: string;
  creditLimit?: number | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### 400 Bad Request
- Invalid input data
- Validation errors

### 404 Not Found
- Client with specified GSTIN/ID not found

### 409 Conflict
- Duplicate GSTIN or phone number
- Unique constraint violations

## Validation Rules

### Required Fields
- `name`: Non-empty string
- `gstin`: Non-empty string (must be unique)
- `phoneNumber`: Non-empty string (must be unique)
- `gstType`: Non-empty string

### Optional Fields
- `email`: Valid email format (if provided)
- `creditLimit`: Positive integer (if provided)
- `billingAddress`: String (if provided)
- `shippingAddress`: String (if provided)

## Database Schema

The API uses the `AddClient` Prisma model:

```prisma
model AddClient {
  id              Int      @id @default(autoincrement())
  name            String
  gstin           String   @unique
  phoneNumber     String   @unique
  email           String?
  gstType         String
  creditLimit     Int?
  billingAddress  String?
  shippingAddress String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Usage Examples

See `clients.api-examples.md` for detailed API usage examples with sample requests and responses.

## Development

### Running the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Run database migrations
npx prisma migrate dev

# View data in Prisma Studio
npx prisma studio
```

## Module Structure

```
src/clients/
├── dto/
│   ├── create-client.dto.ts     # Input validation for creating clients
│   ├── update-client.dto.ts     # Input validation for updating clients
│   └── client-response.dto.ts   # Response type definition
├── clients.controller.ts        # HTTP route handlers
├── clients.service.ts           # Business logic and database operations
├── clients.module.ts            # Module configuration
└── clients.api-examples.md      # API usage examples
```

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@nestjs/mapped-types` - DTO utilities
- `class-validator` - Input validation
- `class-transformer` - Data transformation
- `@prisma/client` - Database client

## Future Enhancements

- [ ] Pagination for large datasets
- [ ] Advanced search and filtering
- [ ] Bulk operations (create/update/delete multiple clients)
- [ ] Export functionality (CSV, Excel)
- [ ] Audit logging for all operations
- [ ] Rate limiting and throttling
- [ ] API documentation with Swagger/OpenAPI
