# Finance Dashboard Backend API

A RESTful backend for a finance dashboard system built with **Node.js**, **Express**, and **MongoDB**. Implements role-based access control (RBAC), financial record management, and aggregated analytics APIs.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Runtime      | Node.js (ES Modules / `import`)     |
| Framework    | Express.js                          |
| Database     | MongoDB + Mongoose ODM              |
| Auth         | JWT (jsonwebtoken) + bcryptjs       |
| Validation   | express-validator                   |
| Rate Limit   | express-rate-limit                  |
| Logging      | morgan                              |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile
│   │   ├── userController.js      # User management (admin only)
│   │   ├── transactionController.js  # CRUD for financial records
│   │   └── dashboardController.js    # Analytics & aggregations
│   ├── middleware/
│   │   ├── auth.js                # JWT verify + role guard
│   │   ├── errorHandler.js        # Global error handler
│   │   └── validate.js            # express-validator runner
│   ├── models/
│   │   ├── User.js                # User schema
│   │   └── Transaction.js         # Transaction schema (soft delete)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── seed.js                # Demo data seeder
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Steps

```bash
# 1. Clone / download the project
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set your MONGODB_URI and JWT_SECRET

# 4. (Optional) Seed demo data
npm run seed

# 5. Start the server
npm run dev       # Development with nodemon
npm start         # Production
```

Server runs at: `http://localhost:5000`

---

## Environment Variables

| Variable        | Description                          | Default                                      |
|-----------------|--------------------------------------|----------------------------------------------|
| `PORT`          | Port to run the server               | `5000`                                       |
| `MONGODB_URI`   | MongoDB connection string            | `mongodb://localhost:27017/finance_dashboard` |
| `JWT_SECRET`    | Secret for signing JWT tokens        | *(must be set)*                              |
| `JWT_EXPIRES_IN`| Token expiry duration                | `7d`                                         |
| `NODE_ENV`      | Environment mode                     | `development`                                |

---

## Roles & Permissions

| Action                       | Viewer | Analyst | Admin |
|------------------------------|--------|---------|-------|
| Login / View own profile     | ✅     | ✅      | ✅    |
| View transactions            | ✅     | ✅      | ✅    |
| Create / Update transactions | ❌     | ✅      | ✅    |
| Delete transactions          | ❌     | ❌      | ✅    |
| View dashboard analytics     | ❌     | ✅      | ✅    |
| Manage users                 | ❌     | ❌      | ✅    |

---

## API Reference

All endpoints are prefixed with `/api`.  
Protected routes require: `Authorization: Bearer <token>`

---

### Auth

#### `POST /api/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "Alice Admin",
  "email": "alice@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Response `201`:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "name": "Alice Admin", "email": "alice@example.com", "role": "admin" }
}
```

---

#### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

---

#### `GET /api/auth/me`
Get the currently authenticated user's profile. Requires auth.

---

### Users *(Admin only)*

#### `GET /api/users`
List all users. Supports filters: `?role=analyst&isActive=true&page=1&limit=10`

#### `GET /api/users/:id`
Get a single user by ID.

#### `PATCH /api/users/:id/role`
Update a user's role.
```json
{ "role": "analyst" }
```

#### `PATCH /api/users/:id/status`
Activate or deactivate a user.
```json
{ "isActive": false }
```

#### `DELETE /api/users/:id`
Permanently delete a user.

---

### Transactions *(Auth required)*

#### `GET /api/transactions`
List all transactions with optional filters and pagination.

**Query Params:**
| Param       | Type     | Example              |
|-------------|----------|----------------------|
| `type`      | string   | `income` or `expense`|
| `category`  | string   | `food`, `salary`     |
| `startDate` | ISO date | `2024-01-01`         |
| `endDate`   | ISO date | `2024-12-31`         |
| `minAmount` | number   | `100`                |
| `maxAmount` | number   | `5000`               |
| `search`    | string   | keyword in description|
| `page`      | number   | `1`                  |
| `limit`     | number   | `10`                 |
| `sortBy`    | string   | `date`, `amount`     |
| `sortOrder` | string   | `asc` or `desc`      |

#### `GET /api/transactions/:id`
Get a single transaction by ID.

#### `POST /api/transactions` *(Analyst, Admin)*
Create a new transaction.
```json
{
  "amount": 2500.00,
  "type": "income",
  "category": "salary",
  "date": "2024-06-01",
  "description": "June salary"
}
```

#### `PUT /api/transactions/:id` *(Analyst, Admin)*
Update an existing transaction.

#### `DELETE /api/transactions/:id` *(Admin only)*
Soft-delete a transaction (sets `isDeleted: true`, not permanently removed).

**Valid Categories:**

| Income              | Expense          |
|---------------------|------------------|
| salary              | food             |
| freelance           | transport        |
| investment          | utilities        |
| business            | entertainment    |
| other_income        | healthcare       |
|                     | education        |
|                     | shopping         |
|                     | rent             |
|                     | other_expense    |

---

### Dashboard *(Analyst, Admin)*

#### `GET /api/dashboard/summary`
Returns total income, total expenses, net balance, and transaction counts.

**Response:**
```json
{
  "success": true,
  "summary": {
    "totalIncome": 45000.00,
    "totalExpenses": 18250.50,
    "netBalance": 26749.50,
    "totalTransactions": 50,
    "incomeCount": 20,
    "expenseCount": 30
  }
}
```

#### `GET /api/dashboard/category-breakdown`
Returns totals grouped by category and type. Optional: `?type=expense`

#### `GET /api/dashboard/monthly-trends`
Returns income vs expense per month for a given year. Optional: `?year=2024`

**Response:**
```json
{
  "success": true,
  "year": 2024,
  "trends": [
    { "month": 1, "income": 5000, "expense": 1800, "incomeCount": 2, "expenseCount": 8 },
    { "month": 2, "income": 4500, "expense": 2100, "incomeCount": 2, "expenseCount": 9 }
  ]
}
```

#### `GET /api/dashboard/recent-activity`
Returns the most recent transactions. Optional: `?limit=5`

#### `GET /api/dashboard/weekly-trends`
Returns income vs expense grouped by ISO week for the last 8 weeks.

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

| Status Code | Meaning                        |
|-------------|--------------------------------|
| 400         | Bad request / validation error |
| 401         | Unauthenticated                |
| 403         | Unauthorized (wrong role)      |
| 404         | Resource not found             |
| 409         | Conflict (duplicate data)      |
| 429         | Too many requests              |
| 500         | Internal server error          |

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 10 requests per 15 minutes per IP (brute-force protection)

---

## Demo Credentials (after running `npm run seed`)

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Admin   | admin@demo.com      | password123 |
| Analyst | analyst@demo.com    | password123 |
| Viewer  | viewer@demo.com     | password123 |

---

## Assumptions Made

1. **Soft delete for transactions**: Deleted transactions are flagged with `isDeleted: true` rather than removed from the database — this preserves audit history and allows recovery.

2. **Analysts can create/update transactions**: The assignment gave flexibility here. Analysts are treated as power users who manage data but cannot delete it or manage users.

3. **Viewers cannot access dashboard analytics**: Dashboard routes are restricted to analyst+ since raw aggregated financial data is considered sensitive insight.

4. **Categories are predefined**: A fixed category enum avoids inconsistent data (e.g. "Food" vs "food" vs "Foods") and makes aggregations more reliable.

5. **Password hashing via bcrypt**: All passwords are hashed with a cost factor of 12 before storage. Passwords are never returned in API responses.

6. **JWT-based auth**: Stateless token authentication. Tokens are not invalidated on the server side — logout is handled client-side by discarding the token.

7. **No multi-tenancy**: All users share the same pool of transactions. A production system might scope transactions to organizations.

---

## Potential Improvements

- Refresh token mechanism for better session management
- Email verification on registration
- Audit log for admin actions
- Organization/team-level data scoping
- Soft delete for users as well
- Full-text search using MongoDB Atlas Search
