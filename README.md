# Ticketing Portal

A comprehensive Next.js 16 ticketing portal for Customer Success teams to log, track, and manage work activities. Built with modern technologies including Neon PostgreSQL, shadcn/ui, and deployed on Vercel.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://ticketing-portal-one.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌐 Live Application

**Production URL:** [https://ticketing-portal-one.vercel.app](https://ticketing-portal-one.vercel.app)

**Test Credentials:**
- Email: `john.doe@company.com` or `admin@company.com`
- Password: `password`

## 📋 Overview

The Ticketing Portal enables Customer Success teams to initiate tickets for support issues and requirements, which are then resolved by Tech Delivery teams. The system features intelligent auto-fill based on classification mappings, comprehensive analytics, and role-based access control.

### Key Stakeholders

- **Customer Success Teams**: Initiate tickets for support issues and requirements
- **Tech Delivery Teams**: Resolve tickets and record work activities
- **SPOC (Single Point of Contact)**: Assign tickets and manage resolution workflow
- **Super Users/Leads**: View and manage all team tickets

## ✨ Features

### Core Functionality

- ✅ **Full Ticket Lifecycle Management**: Create, view, edit, and resolve tickets
- ✅ **Intelligent Auto-Fill**: Ticket title, estimated duration, and SPOC auto-populated based on classification
- ✅ **Real-time Dashboard**: Live statistics and recent tickets with auto-refresh
- ✅ **Advanced Analytics**: 9+ chart types showing ticket distribution, trends, and team performance
- ✅ **Team Management**: Create teams, assign members, and track team activities
- ✅ **Master Data Management**: Manage business units, categories, subcategories, and classification mappings
- ✅ **User Management**: Role-based access control (Admin, Manager, Team Lead, Support Agent, etc.)
- ✅ **Notifications System**: Real-time notifications with unread count badge
- ✅ **Comments & Attachments**: Full collaboration features on tickets
- ✅ **Search & Filtering**: Advanced filtering by status, priority, assignee, date ranges

### Auto-Fill Intelligence

When creating a ticket, selecting **Business Unit** → **Category** → **Subcategory** automatically populates:
- **Ticket Title** from predefined templates
- **Estimated Duration** in minutes
- **Assigned SPOC** based on business unit mapping

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | Neon PostgreSQL (Serverless) |
| **Styling** | Tailwind CSS 4.x |
| **UI Components** | shadcn/ui (60+ components) |
| **State Management** | Server Actions (no client-side state library) |
| **Forms** | react-hook-form + zod validation |
| **Charts** | Recharts |
| **Authentication** | Cookie-based with bcryptjs |
| **Deployment** | Vercel |

## 📁 Project Structure

```
ticketing-portal/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes (auth handlers)
│   ├── dashboard/            # Dashboard with stats
│   ├── tickets/              # Ticket CRUD pages
│   ├── teams/                # Team management
│   ├── master-data/          # Master data management
│   ├── analytics/            # Charts and reporting
│   └── settings/             # Application settings
├── components/               # React components
│   ├── ui/                   # shadcn/ui base components (60+)
│   ├── tickets/              # Ticket-related components
│   ├── teams/                # Team management components
│   ├── analytics/            # Chart components
│   └── layout/               # Navigation, header, sidebar
├── lib/
│   ├── db.ts                 # Database connection (Neon)
│   ├── actions/              # Server Actions
│   │   ├── tickets.ts        # Ticket CRUD operations
│   │   ├── master-data.ts    # Business units, categories
│   │   ├── teams.ts          # Team management
│   │   ├── stats.ts          # Dashboard statistics
│   │   └── notifications.ts  # Notification system
│   └── utils.ts              # Utility functions
├── scripts/                  # Database setup scripts
│   ├── import-excel-data.js  # Import master data from Excel
│   ├── setup-database-pg.js  # Database setup
│   └── *.sql                 # SQL migration files
└── Ticket-portal.xlsx        # Master data source (26 categories, 96 subcategories)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Neon PostgreSQL account (or any PostgreSQL database)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/weebHarsh/ticketing-portal.git
cd ticketing-portal
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

4. **Set up the database**

Run the setup script to create tables and seed data:

```bash
node scripts/setup-database-pg.js
```

Or import master data from Excel:

```bash
node scripts/import-excel-data.js
```

This will import:
- 26 categories
- 96 subcategories
- 768 classification mappings (for all 8 business units)

5. **Run the development server**

```bash
npm run dev
```

The application will be available at [http://localhost:4000](http://localhost:4000)

### Database Scripts

```bash
# Full database setup (recommended)
node scripts/setup-database-pg.js

# Import categories and subcategories from Excel
node scripts/import-excel-data.js

# Run a specific SQL file
node scripts/run-sql-file.js scripts/add-notifications.sql

# Verify database state
node scripts/verify-database.js
```

## 📊 Database Schema

### Core Tables

- **users**: User accounts with role-based access
- **tickets**: Main tickets table with status tracking
- **business_unit_groups**: 8 business units (Sales, CS Apps, CS Web, etc.)
- **categories**: 26 ticket categories
- **subcategories**: 96 subcategories linked to categories
- **ticket_classification_mapping**: Auto-fill configuration (768 mappings)
- **teams**: Team definitions
- **team_members**: User-team relationships
- **comments**: Ticket comments
- **attachments**: File attachments
- **notifications**: Real-time notification system

### Business Units

1. Sales
2. CS Apps
3. CS Web
4. CS Brand
5. CS BM (Brand monitoring)
6. TD North (Tech Delivery)
7. TD South
8. TD Others

## 🎯 Usage

### Creating a Ticket

1. Navigate to **Create Ticket**
2. Select **Business Unit** (e.g., "CS Web")
3. Select **Category** (e.g., "Brand safety initiation")
4. Select **Sub-Category** (optional, e.g., "Brand safety initiation for meta")
5. Watch as **Ticket Title**, **Estimated Duration**, and **Assignee** auto-populate
6. Add description and submit

### Dashboard

The dashboard provides:
- Quick stats (Total, Open, In Progress, Resolved tickets)
- Recent tickets list with status badges
- Auto-refresh every 30 seconds

### Analytics

View comprehensive analytics including:
- Tickets by Business Unit
- Tickets by Category
- Top 10 Subcategories
- Status Distribution (Pie chart)
- Ticket Type Distribution
- Priority Distribution
- 30-day Ticket Trend
- Team Performance
- 12-month Monthly Trend

## 🔐 Authentication

The application uses cookie-based authentication with bcryptjs password hashing.

**Test Accounts:**
- Admin: `admin@company.com` / `password`
- User: `john.doe@company.com` / `password`

**User Roles:**
- Admin
- Manager
- Team Lead
- Support Agent
- Developer
- QA Engineer
- Designer
- Analyst

## 📦 Deployment

### Vercel Deployment

The application is configured for Vercel deployment:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string

### Environment Variables

Required environment variables for production:

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## 🧪 Testing

Test the application manually:

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

**Test Flow:**
1. Login with test credentials
2. Create a new ticket with auto-fill
3. View ticket details
4. Add comments and attachments
5. Update ticket status
6. View analytics charts
7. Check notifications

## 📝 Configuration

### Port Configuration

The development server runs on port **4000** (configured in `package.json`):

```json
{
  "scripts": {
    "dev": "next dev -p 4000"
  }
}
```

### TypeScript

TypeScript is configured with `ignoreBuildErrors: true` in `next.config.mjs`. Fix types before production deployment.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Harsh Thapliyal** - [weebHarsh](https://github.com/weebHarsh)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Neon](https://neon.tech/)
- Deployed on [Vercel](https://vercel.com/)
- AI assistance from [Claude Code](https://claude.com/claude-code)

## 📞 Support

For support, please open an issue in the [GitHub repository](https://github.com/weebHarsh/ticketing-portal/issues).

---

**Live Demo:** [https://ticketing-portal-one.vercel.app](https://ticketing-portal-one.vercel.app)

**Built with ❤️ using Next.js 16 and Neon PostgreSQL**
