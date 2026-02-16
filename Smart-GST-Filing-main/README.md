# Smart GST Filing Platform

A comprehensive AI-powered GST filing platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Public Website
- Modern landing page with hero section
- Feature showcase and pricing plans
- Responsive design for all devices
- Multi-language support (8 Indian languages)

### Authentication System
- **Clerk Authentication**: Secure email/password authentication
- User registration and login with Clerk
- Admin and user separate login flows
- Password reset functionality
- Session management and security

### User Dashboard
- **Invoice Management**: Create, edit, and track invoices
- **Expense Tracking**: Categorize and manage business expenses
- **GST Filing**: Automated GSTR-1, GSTR-3B, and annual returns
- **Transaction History**: Complete financial transaction records
- **Reports & Analytics**: Comprehensive business insights
- **AI Assistant**: 24/7 GST query support

### Admin Dashboard
- **User Management**: Complete user oversight and control
- **Business Profiles**: Verification and management
- **Filing Monitor**: Track all GST filings and success rates
- **Document Center**: Manage and verify user documents
- **Analytics**: Revenue, user growth, and performance metrics
- **Notifications**: Broadcast messages and alerts

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Clerk
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Netlify

## 📦 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd smart-gst-filing-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure Clerk:
   - Create a Clerk account at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your Clerk keys to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
     CLERK_SECRET_KEY=your_secret_key
     ```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
- Connect your GitHub repository to Netlify
- Set build command: `npm run build`
- Set publish directory: `out`
- Add your Clerk environment variables in Netlify
- Deploy!

## 📱 Mobile Support

The platform is fully responsive and works perfectly on:
- Desktop computers
- Tablets
- Mobile phones
- Progressive Web App (PWA) ready

## 🔒 Security Features

- Clerk authentication with JWT tokens
- XSS protection
- CSRF protection
- Content Security Policy
- Secure headers
- Input validation
- Error boundaries

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email support@smartgst.com or join our Slack channel.
