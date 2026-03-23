# 💊 PharmaCare — Pharmacy Management System

A full-stack pharmacy management system built with **React**, **Node.js**, **PostgreSQL**, and **Tailwind CSS**.

---

## 🧩 Features

| Module | Features |
|---|---|
| 🏠 **Dashboard** | Revenue stats, low stock alerts, top medicines chart, recent sales |
| 💊 **Medicines** | Full CRUD, stock tracking, expiry dates, reorder levels, categories |
| 🛒 **POS / New Sale** | Live medicine search, cart management, discounts, tax, payment methods |
| 📋 **Sales History** | Invoice list, date filters, status filters, detailed invoice view |
| 👥 **Customers** | Add/edit/delete, search, purchase history ready |
| 🏭 **Suppliers** | Supplier management with contact details |
| 📊 **Reports** | Sales analytics, top medicines chart, low stock & expiry reports |
| 🔐 **Auth** | JWT login, role-based access (admin, pharmacist, staff) |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router v6, Tailwind CSS v3, Chart.js, react-hot-toast
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken) + bcryptjs

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

---

### 1. Create the PostgreSQL Database

```bash
psql -U postgres
CREATE DATABASE pharmacy_db;
\q
```

### 2. Initialize the Schema

```bash
psql -U postgres -d pharmacy_db -f backend/db/schema.sql
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pharmacy_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. Install Dependencies & Start

```bash
# From project root
npm install

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 5. Run the Application

**Option A — Run separately:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

**Option B — Run concurrently from root:**
```bash
npm run dev
```

### 6. Open the App

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🔐 Default Login

| Field | Value |
|---|---|
| Email | admin@pharmacy.com |
| Password | Admin@123 |

> ⚠️ Change the default password after first login in production!

---

## 📁 Project Structure

```
pharmacy-system/
├── backend/
│   ├── db/
│   │   ├── pool.js          # PostgreSQL connection pool
│   │   └── schema.sql       # Database schema & seed data
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Login & register
│   │   ├── medicines.js     # Medicine CRUD
│   │   ├── sales.js         # Sales & POS
│   │   └── general.js       # Customers, suppliers, categories, dashboard
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Express app entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   │   └── Modal.jsx    # Reusable modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Medicines.jsx
│   │   │   ├── NewSale.jsx
│   │   │   ├── Sales.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   └── Reports.jsx
│   │   ├── utils/
│   │   │   └── api.js       # Axios instance with auth interceptor
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css        # Tailwind + custom styles
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/login | Login and get JWT token |
| POST | /api/auth/register | Register new user |

### Medicines
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/medicines | List all medicines (with search/filter) |
| POST | /api/medicines | Add new medicine |
| PUT | /api/medicines/:id | Update medicine |
| DELETE | /api/medicines/:id | Delete medicine |

### Sales
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/sales | List sales (with date/status filter) |
| GET | /api/sales/:id | Get sale with items |
| POST | /api/sales | Create new sale (deducts stock) |

### Others
| Method | Endpoint | Description |
|---|---|---|
| GET/POST/PUT/DELETE | /api/customers | Customer CRUD |
| GET/POST/PUT | /api/suppliers | Supplier management |
| GET/POST | /api/categories | Category management |
| GET | /api/dashboard | Dashboard stats |

---

## 🔒 Security Notes for Production

1. Change `JWT_SECRET` to a long random string
2. Change default admin password immediately
3. Enable SSL for PostgreSQL connection
4. Set `NODE_ENV=production`
5. Use environment variables — never commit `.env`
6. Add rate limiting (`express-rate-limit`)
7. Add input validation (`joi` or `zod`)

---

## 📦 Optional Enhancements

- [ ] Purchase Order management
- [ ] Barcode scanning support
- [ ] PDF invoice generation
- [ ] Email notifications for low stock
- [ ] Multi-branch support
- [ ] Insurance claim management
- [ ] User management UI



### Thank You