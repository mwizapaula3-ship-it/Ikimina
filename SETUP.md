# Ikimina Smart Tracker - Complete Setup Guide

## Project Overview

**Ikimina Smart Tracker** is a modern, mobile-responsive web application designed to digitalize the record-keeping of Village Savings and Loan Associations (VSLAs) in Rwanda. It replaces paper ledgers with a secure, digital-first platform for managing group finances.

### Key Features

- **Contribution Logging**: Track member contributions with status (paid, late, missed)
- **Loan Management**: Issue loans, track repayments, calculate interest automatically
- **Automated Reminders**: Simulated SMS-style notifications for overdue payments (no cost)
- **Analytics Dashboard**: Visualize savings trends, compliance rates, cash flow projections
- **Financial Chatbot**: AI-powered assistant for member questions (Gemini API)
- **Bilingual Support**: English and Kinyarwanda UI
- **Role-Based Access**: Super Admin, Group Admin, Treasurer, Secretary, Member
- **Mobile-Friendly**: Optimized for 3G/low-bandwidth environments
- **100% Free**: No paid services required for demo/development

---

## Technology Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (no separate server)
- **Database**: SQLite with Prisma ORM (local dev) / Postgres (production-ready)
- **Auth**: JWT + bcryptjs (no paid auth provider)
- **AI**: Google Gemini API (free tier)
- **Charts**: Recharts (free, open-source)
- **Export**: XLSX (Excel) + PDFKit (PDF)
- **Hosting**: Vercel free tier or local development

---

## Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone & Install Dependencies

```bash
cd c:\Users\hp\Desktop\IKIMINA
npm install
```

**Note:** If npm install is still in progress, wait for it to complete. Prisma binaries can take a few minutes to compile on Windows.

### 2. Initialize the Database

```bash
# Run Prisma migrations
npm run prisma:migrate

# Seed with demo data
npm run prisma:seed
```

This creates a SQLite database (`prisma/dev.db`) with a demo VSLA group and 15 members.

### 3. Configure Environment Variables

Create/edit `.env.local`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_APP_NAME="Ikimina Smart Tracker"
NEXT_PUBLIC_CURRENCY="RWF"

# Google Gemini API (get free from Google AI Studio)
GEMINI_API_KEY="your-gemini-api-key"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

**Get Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key" → "Create API Key"
3. Copy the key and paste into `.env.local`

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Demo Credentials

After seeding, log in with these test accounts:

| Role | Email/Phone | Password |
|------|-------------|----------|
| **Super Admin** | admin@ikimina.local | Admin@2024 |
| **Group Admin** | president@group.local | President@2024 |
| **Treasurer** | +250788234567 | Treasurer@2024 |
| **Secretary** | +250788345678 | Secretary@2024 |
| **Members** | Any member phone | Member@2024 |

---

## Project Structure

```
src/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── auth/              # Login, register
│   │   ├── groups/            # Group management
│   │   ├── members/           # Member CRUD
│   │   ├── contributions/     # Contribution logging
│   │   ├── loans/             # Loan management
│   │   └── reminders/         # Notification engine
│   ├── login/                  # Login page
│   ├── member/                 # Member dashboards
│   ├── treasurer/              # Treasurer dashboards
│   ├── admin/                  # Admin dashboards
│   ├── secretary/              # Secretary dashboards
│   └── layout.tsx              # Root layout with providers
├── components/
│   └── providers/              # React context providers
├── lib/
│   ├── auth.ts                # JWT + password utilities
│   ├── prisma.ts              # Prisma client singleton
│   ├── utils.ts               # Helper functions
│   ├── errors.ts              # Error handling
│   ├── i18n.ts                # Bilingual strings
│   └── middleware.ts          # Auth middleware
├── types/                      # TypeScript types
└── prisma/
    ├── schema.prisma          # Database schema
    └── seed.ts                # Demo data seeder
```

---

## Build Order & Milestones

The application is being built incrementally:

### Milestone 1: Prisma + Database ✅
- [x] SQLite setup with Prisma ORM
- [x] Complete data model (Groups, Users, Contributions, Loans, Reminders, etc.)
- [x] Environment configuration
- [x] Seed script with demo data

### Milestone 2: Authentication ✅
- [x] JWT token generation/verification
- [x] Password hashing (bcryptjs)
- [x] Login/Register API routes
- [x] Auth middleware for protected routes

### Milestone 3: Core API Routes ✅
- [x] Groups API (GET all groups, POST new group)
- [x] Members API (CRUD operations, member statistics)
- [x] Contributions API (Record contributions, filter by status/date)
- [x] Loans API (Issue loans, track repayments, calculate balances)
- [x] Reminders API (Manual trigger, fetch reminders, mock SMS)

### Milestone 4-5: UI & Dashboards (In Progress)
- [ ] Member dashboard (savings, loans, history)
- [ ] Treasurer dashboard (bulk entry, repayment tracking)
- [ ] Admin dashboard (member management, analytics)
- [ ] Secretary dashboard (reports, read-only access)

### Milestone 6-7: Advanced Features (Coming)
- [ ] Analytics with Recharts charts
- [ ] PDF/Excel report exports
- [ ] Gemini chatbot integration
- [ ] Bilingual UI toggle

### Milestone 8-10: Polish & Deployment (Coming)
- [ ] Mobile responsiveness tweaks
- [ ] Error handling & validation
- [ ] Production build & Vercel deployment
- [ ] Performance optimization

---

## API Documentation

### Authentication

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "emailOrPhone": "president@group.local",
  "password": "President@2024"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { "id": "...", "name": "...", "role": "GROUP_ADMIN", ... }
  }
}
```

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "New Member",
  "phone": "+250788999999",
  "password": "SecurePass@2024",
  "groupId": "group-id",
  "role": "MEMBER"
}
```

### Groups

**Get All Groups:**
```bash
GET /api/groups
Authorization: Bearer {token}
```

**Create Group (Super Admin only):**
```bash
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New VSLA Group",
  "contributionAmount": 10000,
  "contributionFrequency": "monthly",
  "interestRate": 15,
  "cycleStartDate": "2024-01-01",
  "cycleEndDate": "2024-12-31"
}
```

### Contributions

**Record Contribution:**
```bash
POST /api/contributions
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberId": "member-id",
  "amount": 10000,
  "dueDate": "2024-12-01",
  "paidDate": "2024-11-28",
  "status": "PAID",
  "paymentMethod": "cash"
}
```

**Get Contributions:**
```bash
GET /api/contributions?memberId=...&status=PAID&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer {token}
```

### Loans

**Issue Loan:**
```bash
POST /api/loans
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberId": "member-id",
  "principal": 100000,
  "interestRate": 15,
  "dueDate": "2025-06-01"
}
```

**Get Loans:**
```bash
GET /api/loans?memberId=...&status=ACTIVE
Authorization: Bearer {token}
```

### Reminders

**Run Reminder Check:**
```bash
POST /api/reminders/check
Authorization: Bearer {token}
```

Returns: All reminders that were "sent" to members today.

**Get Reminders:**
```bash
GET /api/reminders
Authorization: Bearer {token}
```

---

## Role Permissions

| Action | Super Admin | Group Admin | Treasurer | Secretary | Member |
|--------|:-----------:|:-----------:|:---------:|:---------:|:------:|
| View all groups | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create groups | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage members | ❌ | ✅ | ❌ | ❌ | ❌ |
| Record contributions | ❌ | ✅ | ✅ | ❌ | ❌ |
| Issue loans | ❌ | ✅ | ❌ | ❌ | ❌ |
| Record repayments | ❌ | ✅ | ✅ | ❌ | ❌ |
| View analytics | ❌ | ✅ | ❌ | ✅ | ❌ |
| Export reports | ❌ | ✅ | ❌ | ✅ | ❌ |
| Send reminders | ❌ | ✅ | ✅ | ❌ | ❌ |
| View own data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Use chatbot | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Notif ication System (Simulated SMS)

The reminder system is **completely free and cost-free** because it simulates SMS notifications:

1. **No real SMS**: Messages are stored in the `Reminder` table, not sent to actual phone numbers
2. **In-app feed**: Members see reminders in an inbox styled like SMS thread
3. **Manual trigger**: Click "Run Reminder Check" to send reminders for:
   - Overdue contributions
   - Upcoming payments
   - Loan repayment reminders

**Future**: To integrate real SMS (WhatsApp, Twilio, etc.), implement a new `NotificationProvider` and inject it into the reminder engine - no other code changes needed.

---

## Internationalization (i18n)

The app supports **English** and **Kinyarwanda**. Strings are defined in `src/lib/i18n.ts`.

**Add new string:**
```typescript
strings.en.my_new_string = "Hello";
strings.rw.my_new_string = "Muraho";
```

**Use in components:**
```typescript
import { t } from '@/lib/i18n';

const label = t('my_new_string', language);
```

---

## Common Development Tasks

### Run database migrations
```bash
npm run prisma:migrate
```

### Reset database
```bash
npx prisma migrate reset
```

### Open Prisma Studio (visual DB browser)
```bash
npm run prisma:studio
```

### Build for production
```bash
npm run build
npm start
```

### Lint code
```bash
npm run lint
```

---

## Troubleshooting

### npm install taking a long time
- **Cause**: Prisma compiles native binaries on first install
- **Solution**: Be patient, can take 5-15 minutes on Windows

### Database locked error
- **Cause**: Multiple processes accessing SQLite simultaneously
- **Solution**: Close other terminals, or use Postgres in production

### Auth token errors
- **Cause**: JWT_SECRET changed or expired token
- **Solution**: Clear localStorage, log out, log back in

### Gemini API errors
- **Cause**: Missing or invalid API key
- **Solution**: Verify `.env.local` has `GEMINI_API_KEY` set

---

## Deployment

### Deploy to Vercel (Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Important**: For production, switch to Postgres:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then add a free Postgres database from:
- **Neon.tech** (free tier, 3 projects)
- **Supabase** (free tier, good for beginners)
- **Railway** (free tier)

---

## Support & Contributing

For issues, questions, or feature requests, please check:
- Milestone status above
- API documentation section
- Database schema in `prisma/schema.prisma`

---

## License

This project is built for educational and demonstration purposes.

---

## Next Steps

1. ✅ Wait for `npm install` to complete
2. ✅ Run `npm run prisma:migrate` to initialize the database
3. ✅ Run `npm run prisma:seed` to load demo data
4. ✅ Set up Gemini API key in `.env.local`
5. ✅ Run `npm run dev` and visit http://localhost:3000
6. 🎯 Log in with demo credentials
7. 📊 Test contribution tracking and loan management
8. 💬 (Coming) Try the chatbot feature
9. 📈 (Coming) Explore analytics dashboards

Happy building! 🚀
