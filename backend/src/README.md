# Backend Project Structure

## Overview
This is a NestJS mono-application backend for the Smart-GST system. The backend provides RESTful APIs for managing GST filings, invoices, clients, businesses, transactions, and related features.

## Directory Structure

### Root-Level Modules

```
src/
├── common/                 # Shared utilities, decorators, filters
│   ├── decorators/        # Custom decorators
│   └── utils/             # Utility functions (validation, formatting, etc.)
│
├── constants/             # Application-wide constants
│   ├── gst.constants.ts   # GST-related constants
│   ├── api.constants.ts   # API endpoints and messages
│   └── index.ts           # Constants barrel export
│
├── types/                 # Shared TypeScript interfaces and types
│   └── index.ts           # Type definitions (BaseEntity, API responses, etc.)
│
├── modules/               # Feature modules (organized by domain)
│   ├── admin/
│   ├── business/
│   ├── clients/
│   ├── dashboard/
│   ├── expenses/
│   ├── gst-filing/
│   ├── invoices/
│   ├── reminders/
│   ├── reports/
│   ├── settings/
│   ├── subscription/
│   └── transactions/
│
├── prisma/                # Prisma ORM service
├── app.module.ts          # Root module
├── app.controller.ts      # Root controller
├── app.service.ts         # Root service
└── main.ts                # Application entry point
```

## Module Structure

Each feature module follows this consistent structure:

```
module-name/
├── module-name.controller.ts      # HTTP request handlers
├── module-name.controller.spec.ts # Controller tests
├── module-name.service.ts         # Business logic
├── module-name.service.spec.ts    # Service tests
├── module-name.module.ts          # Module definition
├── dto/                           # Data Transfer Objects
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   ├── module-name-response.dto.ts
│   └── index.ts
├── index.ts                       # Module barrel export
└── README.md                      # Module documentation
```

## Architecture Overview

### Design Pattern
- **Pattern**: NestJS monolithic with feature modules
- **Database**: Prisma ORM + PostgreSQL
- **Authentication**: Auth0 (frontend) + userId validation (backend)
- **API Response**: RESTful JSON
- **Error Handling**: NestJS built-in exceptions

### Tenancy Model
- **Multi-tenant**: Single application, multiple customers
- **Tenant ID**: `userId` (string) from Auth0
- **Enforcement**: All queries filtered by userId

### Request Flow
```
Client Request
    ↓
Middleware (CORS)
    ↓
Controller (validates input, routes to service)
    ↓
Service (business logic, database operations)
    ↓
Prisma / Database
    ↓
Response (DTO format)
```

## Key Conventions

### Naming
- **Module**: kebab-case (e.g., `gst-filing`)
- **Files**: kebab-case (e.g., `create-invoice.dto.ts`)
- **Classes**: PascalCase (e.g., `InvoiceService`)
- **Functions**: camelCase (e.g., `calculateTotalAmount`)

### DTOs
- **Create DTO** (`create-*.dto.ts`): Required fields with validators
- **Update DTO** (`update-*.dto.ts`): All optional fields, decorators only
- **Response DTO** (`*-response.dto.ts`): Plain class, no decorators, lists exposed fields

### Service Methods
```typescript
// Standard CRUD operations
create(dto: CreateDto): Promise<ResponseDto>
findAll(userId: string): Promise<ResponseDto[]>
findOne(userId: string, id: number): Promise<ResponseDto>
update(userId: string, id: number, dto: UpdateDto): Promise<ResponseDto>
remove(userId: string, id: number): Promise<{ message: string }>
```

### Error Handling
```typescript
// Import from @nestjs/common
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

// Throw appropriate exceptions
if (!resource) throw new NotFoundException('Resource not found');
if (error.code === 'P2002') throw new ConflictException('Already exists');
```

### Controllers
```typescript
@Controller('resource')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateDto): Promise<ResponseDto>

  @Get()
  findAll(@Query('userId') userId: string): Promise<ResponseDto[]>

  @Get(':id')
  findOne(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ): Promise<ResponseDto>

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Query('userId') userId: string,
    @Body() dto: UpdateDto,
  ): Promise<ResponseDto>

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ): Promise<{ message: string }>
}
```

## Important Files

### Prisma Files
- `prisma/schema.prisma`: Database schema definition
- `prisma/migrations/`: Database migration history
- `prisma/prisma.service.ts`: Prisma client service

### Configuration
- `main.ts`: Application bootstrap, middleware setup
- `app.module.ts`: Root module with all feature modules
- `.env`: Environment variables (DATABASE_URL, PORT, etc.)
- `nest-cli.json`: NestJS CLI configuration

## Common Operations

### Adding a New Module
1. Create `src/modules/module-name/` directory
2. Create controller, service, module files
3. Create `dto/` folder with DTOs
4. Import module in `app.module.ts`
5. Add tests for controller and service
6. Create `index.ts` barrel export

### Adding Validators
- Use `class-validator` decorators in DTO classes
- Common decorators: `@IsString()`, `@IsNotEmpty()`, `@IsEmail()`, `@IsOptional()`

### Handling Database Errors
```typescript
try {
  return await this.prisma.resource.update({...})
} catch (error) {
  if (error.code === 'P2002') {
    throw new ConflictException('Resource already exists')
  }
  throw error
}
```

## API Response Format

### Success Response
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2025-03-26T10:00:00Z",
  "updatedAt": "2025-03-26T10:00:00Z"
}
```

### Array Response
```json
[
  { "id": 1, "field1": "value1", ... },
  { "id": 2, "field1": "value2", ... }
]
```

### Delete Response
```json
{
  "message": "Resource deleted successfully"
}
```

## Performance Considerations

1. **Database Indexes**: Ensure indexed fields for userId, common filters
2. **Query Optimization**: Use Prisma select/include strategically
3. **Pagination**: Implement for large datasets (not yet standardized)
4. **Caching**: Consider for frequently accessed static data

## Security Considerations

1. **userId Validation**: Always verify userId matches authenticated user
2. **CORS**: Configured for localhost development only
3. **Validation**: Use class-validator on all input DTOs
4. **SQL Injection**: Protected by Prisma parameterized queries
5. **Rate Limiting**: Can be added via NestJS throttler module

## Testing

### Unit Tests
- Located in `*.spec.ts` files
- Test individual methods in isolation
- Mock external dependencies (Prisma)

### Integration Tests
- Located in `test/` folder
- Test API endpoints end-to-end
- May connect to test database

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
```

## Troubleshooting

### Common Issues

**Issue**: Prisma client not found
- **Solution**: `npx prisma generate` in backend folder

**Issue**: Database connection errors
- **Solution**: Check DATABASE_URL in .env, verify PostgreSQL is running

**Issue**: P2025 errors in migrations
- **Solution**: Use `npx prisma db push --skip-generate --accept-data-loss`

**Issue**: Module not found errors
- **Solution**: Verify imports use correct paths, check barrel exports in index.ts

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Contact & Support

For questions about the backend architecture, refer to the module-specific READMEs or team documentation.
