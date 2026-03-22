# Smart GST Filing Platform

A comprehensive AI-powered GST filing and business management platform built with modern technologies to simplify GST compliance for Indian businesses.

## 🚀 Overview

Smart GST Filing Platform is a full-stack enterprise solution designed to automate and streamline GST filing, invoice management, expense tracking, and financial reporting for businesses in India. The platform provides an intuitive interface for both users and administrators, with multi-language support and real-time analytics.

## 🏗️ Architecture

This is a monorepo containing:
- **Frontend**: Next.js 14 application with TypeScript
- **Backend**: NestJS REST API with Prisma ORM
- **Database**: PostgreSQL

## ✨ Key Features

### 🔐 Authentication & Security
- **Auth0 Integration**: Secure authentication with email/password
- Role-based access control (User & Admin)
- Session management and JWT tokens
- Password reset functionality

### 📊 Business Management
- Multi-business profile support
- Business registration with complete KYC
- Document management (PAN, GST Certificate, Business License)
- Business turnover tracking
- Support for multiple business types:
  - Proprietorship
  - Private Limited
  - LLP (Limited Liability Partnership)
  - Partnership

### 👥 Client Management
- Comprehensive client database
- Customer and supplier management
- Credit limit tracking
- Billing and shipping address management
- GSTIN validation
- Contact information management

### 📄 Invoice Management
- Create and manage sales & purchase invoices
- Auto-generated invoice numbers
- E-way bill integration
- Multiple transport modes
- GST calculation and breakdown
- Invoice status tracking (Draft, Sent, Paid, Overdue)
- Due date reminders
- Invoice notes and references

### 💰 Expense Tracking
- Categorized expense management
- GST component tracking (ITC - Input Tax Credit)
- Receipt upload functionality
- Multiple payment modes
- Vendor management
- Expense status tracking
- Detailed expense descriptions

### 💳 Transaction Management
- Complete transaction history
- Multiple transaction types (income, expense, transfer)
- Payment mode tracking
- Transaction categorization
- Reference linking
- Status monitoring

### 📝 GST Filing
- **GSTR-1**: Outward supplies return
- **GSTR-3B**: Summary return
- Auto-calculation of tax liability
- IGST, CGST, SGST, and Cess breakdown
- Input Tax Credit (ITC) management
- Filing status tracking (Draft, Filed, Submitted)
- ARN (Acknowledgement Reference Number) tracking
- Due date reminders
- Detailed calculation data storage

### 📈 Reports & Analytics
- Sales reports
- Purchase reports
- GST reports
- Profit & Loss statements
- Custom date range selection
- Exportable reports
- Visual charts and graphs

### 📊 Dashboard
- Real-time business insights
- Total revenue and expenses
- Pending and overdue invoices
- Client statistics
- GST liability overview
- Monthly revenue trends
- Category-wise expense breakdown
- Quick action buttons

### ⚙️ Settings & Customization
- **Company Settings**: Logo, name, PAN, GSTIN, contact details
- **Bank Details**: Account number, IFSC, branch information
- **Invoice Settings**: 
  - Custom invoice prefix
  - Due days configuration
  - Invoice footer customization
  - E-invoice enablement
  - Terms & conditions
- **Notification Settings**:
  - GSTR-1 and GSTR-3B alerts
  - Payment due reminders
  - Email, SMS, and WhatsApp notifications
- **Display Settings**:
  - Theme selection (Light/Dark)
  - Compact mode
  - Accent color customization
  - Date format (DD/MM/YYYY, MM/DD/YYYY)
  - Currency format (INR)
  - Number format (Indian/International)

### 🤖 AI Assistant
- 24/7 GST query support
- Intelligent chatbot
- Tax calculation assistance
- Filing guidance

### 🌐 Multi-Language Support
- Supports 8+ Indian languages
- Dynamic language switching
- Complete UI translation

### 📱 Admin Dashboard
- User management
- Business profile verification
- Filing monitor and analytics
- Document verification
- System-wide statistics
- Revenue tracking
- User growth metrics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Authentication**: Auth0 Next.js SDK
- **State Management**: React Context API
- **Toast Notifications**: Sonner
- **Theme**: next-themes

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: class-validator, class-transformer
- **Email**: Nodemailer
- **Security**: bcrypt for password hashing

### DevOps & Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Testing**: Jest, Supertest
- **Deployment**: Netlify (Frontend)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Auth0 account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Lucky-Prajapati07/Smart-GST-Filing.git
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create .env file in backend directory
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_gst_db"
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed

# Start the backend server
npm run start:dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../Smart-GST-Filing-main

# Install dependencies
npm install

# Set up environment variables
# Copy env.example to .env.local
cp env.example .env.local
```

Edit `.env.local`:
```env
# Auth0 Configuration
AUTH0_SECRET='your-auth0-secret-key'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
# Start the development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🗄️ Database Schema

The platform uses PostgreSQL with the following main entities:

- **Business**: Business profiles and KYC details
- **Clients**: Customer and supplier management
- **Invoices**: Sales and purchase invoices
- **Expenses**: Business expenses with GST tracking
- **Transactions**: Financial transactions
- **GSTFiling**: GST return filings (GSTR-1, GSTR-3B)
- **Report**: Generated reports and analytics
- **DashboardStats**: Real-time dashboard metrics
- **Settings**: User preferences and configurations

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 🚀 Deployment

### Frontend Deployment (Netlify)

1. **Build the frontend:**
```bash
cd Smart-GST-Filing-main
npm run build
```

2. **Deploy to Netlify:**
- Connect your GitHub repository
- Set build command: `npm run build`
- Set publish directory: `.next`
- Add environment variables in Netlify dashboard
- Deploy!

### Backend Deployment

1. **Prepare for production:**
```bash
cd backend
npm run build
```

2. **Deploy options:**
- **Heroku**: Use Heroku PostgreSQL add-on
- **Railway**: Automatic PostgreSQL provisioning
- **AWS EC2**: Full control with RDS for PostgreSQL
- **DigitalOcean**: App Platform with managed database

3. **Set production environment variables**
4. **Run migrations**: `npx prisma migrate deploy`
5. **Start server**: `npm run start:prod`

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- 🖥️ Desktop (1920px+)
- 💻 Laptop (1366px - 1920px)
- 📱 Tablet (768px - 1366px)
- 📱 Mobile (320px - 768px)
- Progressive Web App (PWA) ready

## 🔒 Security Features

- ✅ Auth0 authentication with JWT
- ✅ XSS protection
- ✅ CSRF protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ Secure HTTP headers
- ✅ Environment variable protection
- ✅ Error handling and logging

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://your-api-domain.com
```

### Main Endpoints

#### Business
- `POST /business` - Create business profile
- `GET /business/:userId` - Get user businesses
- `PUT /business/:id` - Update business
- `DELETE /business/:id` - Delete business

#### Clients
- `POST /clients` - Create client
- `GET /clients/:userId` - Get all clients
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

#### Invoices
- `POST /invoices` - Create invoice
- `GET /invoices/:userId` - Get all invoices
- `GET /invoices/:id` - Get invoice by ID
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice

#### Expenses
- `POST /expenses` - Create expense
- `GET /expenses/:userId` - Get all expenses
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

#### GST Filing
- `POST /gst-filing` - Create GST filing
- `GET /gst-filing/:userId` - Get filings
- `PUT /gst-filing/:id` - Update filing
- `POST /gst-filing/:id/submit` - Submit filing

#### Dashboard
- `GET /dashboard/:userId` - Get dashboard stats

#### Reports
- `POST /reports` - Generate report
- `GET /reports/:userId` - Get all reports

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Frontend Tests
```bash
cd Smart-GST-Filing-main

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📝 Project Structure

```
Smart-GST/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── business/            # Business module
│   │   ├── clients/             # Client management
│   │   ├── invoices/            # Invoice management
│   │   ├── expenses/            # Expense tracking
│   │   ├── transactions/        # Transaction management
│   │   ├── gst-filing/          # GST filing module
│   │   ├── reports/             # Report generation
│   │   ├── dashboard/           # Dashboard stats
│   │   ├── settings/            # User settings
│   │   └── prisma/              # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Database migrations
│   └── package.json
│
├── Smart-GST-Filing-main/        # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # User dashboard
│   │   ├── admin-dashboard/     # Admin panel
│   │   ├── login/               # Auth pages
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   ├── dashboard-layout.tsx
│   │   └── navbar.tsx
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities and configs
│   └── package.json
│
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🐛 Known Issues

- File upload size limit: 5MB
- E-way bill API integration pending
- Bulk invoice upload feature in development

## 🔮 Roadmap

- [ ] WhatsApp integration for notifications
- [ ] Mobile app (React Native)
- [ ] E-invoice API integration
- [ ] Advanced AI-powered tax optimization
- [ ] Multi-currency support
- [ ] Automated bank reconciliation
- [ ] TDS module
- [ ] Inventory management
- [ ] Purchase order management
- [ ] Vendor payment tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Lucky Prajapati**
- GitHub: [@Lucky-Prajapati07](https://github.com/Lucky-Prajapati07)

## 📞 Support

For support, please:
- 📧 Email: support@smartgst.com
- 💬 Open an issue on GitHub
- 📱 Contact: +91-XXXXXXXXXX

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NestJS team for the robust backend framework
- Prisma team for the excellent ORM
- Auth0 for authentication services
- Radix UI for accessible components
- All open-source contributors

## 📊 Project Stats

- **Lines of Code**: 50,000+
- **Components**: 100+
- **API Endpoints**: 50+
- **Database Tables**: 11
- **Supported Languages**: 8+

---

**Note**: This project is under active development. Features and documentation are regularly updated.

Made with ❤️ in India for Indian businesses