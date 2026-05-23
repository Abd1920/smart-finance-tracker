# 💰 Smart Finance Tracker

A full-stack personal finance management web application built with the MERN stack. Track income, expenses, accounts, debts, and generate financial reports - all in one place.

---

## 🚀 Features

### Authentication

- Email & password registration with **OTP email verification**
- **Google Sign-In** (OAuth 2.0)
- JWT-based authentication with protected routes
- Forgot password / Reset password via email
- Profile picture upload
- Dark mode preference saved per user

### Dashboard

- Real-time financial overview
- Income vs Expenses bar chart
- Expense breakdown pie chart
- Monthly savings trend line chart
- Recent transactions feed
- Summary cards (balance, income, expenses, debt)

### Accounts

- Multiple account types (Bank, Cash, Credit Card, Savings, Wallet)
- Auto-updates account balance on every transaction
- Color-coded account cards
- Total balance across all accounts

### Transactions

- Add income and expense transactions
- 15 predefined categories for income and expenses
- Filter by type, category, account, month, year
- Full-text search across description and category
- Pagination (15 per page)
- Edit and delete with automatic balance reversal

### Debts & Loans

- Track money you owe and money owed to you
- Due date tracking with overdue warnings
- Mark as settled / pending toggle
- Summary cards with net position

### Reports

- Monthly and yearly views
- Income vs Expenses bar chart
- Savings trend line chart
- Expense and income category breakdowns
- Account balance progress bars

### Settings

- Update profile name and currency
- Upload / remove profile picture
- Change password (or set password for Google users)
- Dark mode toggle
- Delete account with password confirmation

### Notifications

- Real-time debt alerts (overdue, due today, due in 1–3 days, due in 4–7 days)
- Mark all read / mark individual read
- Auto-refreshes every 5 minutes

---

## 🛠 Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | React 18, Tailwind CSS, React Router v6 |
| Charts         | Recharts                                |
| HTTP Client    | Axios                                   |
| Backend        | Node.js, Express.js                     |
| Database       | MongoDB Atlas (Mongoose)                |
| Authentication | JWT, bcryptjs, Google OAuth 2.0         |
| Email          | Nodemailer + Gmail SMTP                 |
| Dev Tools      | Vite, Nodemon                           |

---

## 📁 Project Structure

```
smart-finance-tracker/
├── server/                     # Node.js + Express backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   └── debtController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect middleware
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Transaction.js
│   │   └── Debt.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   └── debts.js
│   ├── utils/
│   │   └── emailService.js
│   └── index.js
│
└── client/                     # React + Tailwind frontend
    └── src/
        ├── components/
        │   ├── auth/           # ProtectedRoute, GuestRoute, GoogleButton
        │   ├── layout/         # Sidebar, Navbar, NotificationPanel
        │   ├── accounts/       # AccountCard, AccountForm
        │   ├── debts/          # DebtCard, DebtForm
        │   ├── transactions/   # TransactionRow, TransactionForm, TransactionFilters
        │   └── shared/         # Modal, ConfirmDialog, EmptyState, Spinner, SummaryCard
        ├── context/
        │   ├── AuthContext.jsx
        │   └── NotificationContext.jsx
        ├── layouts/
        │   ├── AuthLayout.jsx  # Split-screen auth pages
        │   └── AppLayout.jsx   # Sidebar + Navbar wrapper
        ├── pages/
        │   ├── auth/           # Login, Register (OTP), ForgotPassword, ResetPassword
        │   ├── dashboard/
        │   ├── accounts/
        │   ├── transactions/
        │   ├── debts/
        │   ├── reports/
        │   └── settings/
        ├── services/           # API call wrappers
        └── utils/              # Category constants and colors
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Google Cloud Console project (for Google OAuth)
- Gmail account with App Password (for email sending)

### 1. Clone the repository

```bash
git clone https://github.com/Abd1920/smart-finance-tracker.git
cd smart-finance-tracker
```

### 2. Backend setup

```bash
cd server
cp .env.example .env
```

Fill in your `.env` file:

```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/financeTracker?...
JWT_SECRET=your_long_random_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail SMTP
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### 3. Frontend setup

```bash
cd client
```

Create a `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint                          | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| POST   | `/api/auth/send-verification`     | Send OTP to email             |
| POST   | `/api/auth/verify-email`          | Verify OTP and create account |
| POST   | `/api/auth/login`                 | Login with email & password   |
| POST   | `/api/auth/google`                | Google OAuth login            |
| POST   | `/api/auth/forgot-password`       | Send password reset email     |
| POST   | `/api/auth/reset-password/:token` | Reset password                |
| GET    | `/api/auth/profile`               | Get logged-in user profile    |
| PUT    | `/api/auth/profile`               | Update profile                |
| PUT    | `/api/auth/change-password`       | Change password               |
| DELETE | `/api/auth/account`               | Delete account                |

### Accounts

| Method | Endpoint            | Description                      |
| ------ | ------------------- | -------------------------------- |
| GET    | `/api/accounts`     | Get all accounts + total balance |
| POST   | `/api/accounts`     | Create account                   |
| PUT    | `/api/accounts/:id` | Update account                   |
| DELETE | `/api/accounts/:id` | Soft delete account              |

### Transactions

| Method | Endpoint                       | Description                                  |
| ------ | ------------------------------ | -------------------------------------------- |
| GET    | `/api/transactions`            | Get transactions (with filters & pagination) |
| POST   | `/api/transactions`            | Create transaction + update balance          |
| PUT    | `/api/transactions/:id`        | Update transaction + recalculate balance     |
| DELETE | `/api/transactions/:id`        | Delete transaction + reverse balance         |
| GET    | `/api/transactions/summary`    | Monthly summary for charts                   |
| GET    | `/api/transactions/categories` | Category breakdown                           |

### Debts

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/api/debts`            | Get all debts + totals |
| POST   | `/api/debts`            | Create debt            |
| PUT    | `/api/debts/:id`        | Update debt            |
| PUT    | `/api/debts/:id/settle` | Toggle settled/pending |
| DELETE | `/api/debts/:id`        | Delete debt            |

---

## 🚢 Deployment

| Service  | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Render        |
| Database | MongoDB Atlas |

### Deploy Frontend (Vercel)

1. Push `client/` to GitHub
2. Import repo in Vercel
3. Set `VITE_GOOGLE_CLIENT_ID` in environment variables
4. Deploy

### Deploy Backend (Render)

1. Push `server/` to GitHub
2. Create a Web Service on Render
3. Add all `.env` variables in Render environment settings
4. Set start command: `node index.js`
5. Deploy

---

## 👤 Author

**M.H. Abdur Rahman**

- GitHub: [@Abd1920](https://github.com/Abd1920)
- Portfolio: [abd1920.github.io/portfolio](https://abd1920.github.io/portfolio)

---

## 📄 License

This project is for personal and educational use.
