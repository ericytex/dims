# 🚀 Production Deployment Guide

## 🎯 Overview

This guide covers deploying the Inventory Management System as a full-stack application with SQLite database and PWA sync functionality to Vercel.

## 🏗️ Architecture

### **Full-Stack Structure**
```
dmis/
├── src/                    # React frontend
├── server/                 # Express.js backend
│   ├── index.js           # Main server file
│   ├── package.json       # Server dependencies
│   └── ims.db            # SQLite database (auto-created)
├── dist/                   # Built frontend
├── package.json           # Frontend dependencies
└── vercel.json           # Vercel configuration
```

### **Technology Stack**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + SQLite
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT tokens
- **Deployment**: Vercel (full-stack)
- **PWA**: Service Worker + IndexedDB

## 🔧 Backend Features

### **Database Schema**
```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  facility_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Facilities table
CREATE TABLE facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  district TEXT,
  region TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory items table
CREATE TABLE inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  supplier TEXT,
  facility_id INTEGER,
  location TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES facilities (id)
);

-- Stock transactions table
CREATE TABLE stock_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  facility_id INTEGER NOT NULL,
  source TEXT,
  destination TEXT,
  reason TEXT NOT NULL,
  notes TEXT,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items (id),
  FOREIGN KEY (facility_id) REFERENCES facilities (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Transfers table
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  from_facility_id INTEGER NOT NULL,
  to_facility_id INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  request_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by INTEGER,
  approval_date DATE,
  delivery_date DATE,
  reason TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  tracking_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items (id),
  FOREIGN KEY (from_facility_id) REFERENCES facilities (id),
  FOREIGN KEY (to_facility_id) REFERENCES facilities (id),
  FOREIGN KEY (requested_by) REFERENCES users (id),
  FOREIGN KEY (approved_by) REFERENCES users (id)
);
```

### **API Endpoints**
```javascript
// Authentication
POST /api/login                    # User login
GET  /api/health                   # Health check

// Users
GET  /api/users                    # Get all users

// Facilities
GET  /api/facilities               # Get all facilities
POST /api/facilities               # Create facility

// Inventory
GET  /api/inventory                # Get all inventory items
POST /api/inventory                # Create inventory item

// Transactions
GET  /api/transactions             # Get all transactions
POST /api/transactions             # Create transaction

// Transfers
GET  /api/transfers                # Get all transfers
POST /api/transfers                # Create transfer
PUT  /api/transfers/:id/status     # Update transfer status

// Reports
GET  /api/reports/stock-levels     # Stock level report
GET  /api/reports/consumption      # Consumption report
```

## 📱 PWA Sync Features

### **Offline Database (IndexedDB)**
```typescript
// Database structure
{
  name: 'IMS_OfflineDB',
  version: 1,
  stores: {
    'transactions': { keyPath: 'id', indexes: ['status', 'timestamp', 'syncStatus'] },
    'inventory': { keyPath: 'id', indexes: ['syncStatus', 'timestamp'] },
    'transfers': { keyPath: 'id', indexes: ['syncStatus', 'timestamp'] },
    'syncMetadata': { keyPath: 'key' }
  }
}
```

### **Sync Process**
1. **Offline Operations**: Data saved to IndexedDB
2. **Sync Trigger**: Manual or automatic when online
3. **Progress Tracking**: Real-time sync status
4. **Conflict Resolution**: Handle data conflicts
5. **Error Recovery**: Retry failed syncs

### **Android PWA Features**
- ✅ **Install Prompt**: Custom install button
- ✅ **Offline Storage**: IndexedDB persistence
- ✅ **Sync Status**: Real-time progress indicators
- ✅ **Data Persistence**: Survives browser restarts
- ✅ **Background Sync**: Automatic sync when online

## 🚀 Deployment Steps

### **1. Environment Setup**
```bash
# Install dependencies
npm run full:install

# Set environment variables
export JWT_SECRET="your-secure-jwt-secret"
export NODE_ENV="production"
```

### **2. Local Testing**
```bash
# Start full-stack development
npm run full:dev

# Test endpoints
curl http://localhost:3001/api/health
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ims.com","password":"admin123"}'
```

### **3. Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
```

### **4. Database Initialization**
The SQLite database is automatically initialized with:
- **Default Users**: 5 demo accounts with different roles
- **Sample Facilities**: 4 facilities across Uganda
- **Sample Inventory**: 3 sample items for testing

## 🔐 Security Features

### **Authentication**
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Token Expiration**: 24-hour token validity
- **Role-Based Access**: RBAC for all endpoints

### **API Security**
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Built-in Express.js protection
- **Input Validation**: Request validation

## 📊 Production Features

### **Database Features**
- **ACID Compliance**: Transaction support
- **Foreign Keys**: Referential integrity
- **Indexes**: Optimized queries
- **Auto-increment**: Primary key management

### **API Features**
- **RESTful Design**: Standard HTTP methods
- **Error Handling**: Comprehensive error responses
- **Logging**: Morgan HTTP request logging
- **Health Checks**: Database connectivity monitoring

### **PWA Features**
- **Offline First**: Works without internet
- **Data Sync**: Automatic sync when online
- **Progress Tracking**: Real-time sync status
- **Error Recovery**: Retry failed operations

## 🎯 Testing

### **API Testing**
```bash
# Health check
curl https://dmis-uganda.vercel.app/api/health

# Login
curl -X POST https://dmis-uganda.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ims.com","password":"admin123"}'

# Get inventory (with auth token)
curl https://dmis-uganda.vercel.app/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **PWA Testing**
1. **Install on Android**: Use custom install prompt
2. **Test Offline**: Disconnect internet and add items
3. **Test Sync**: Reconnect and verify data sync
4. **Test Persistence**: Restart browser and check data

## 📈 Monitoring

### **Health Checks**
- **Database**: SQLite connection status
- **API**: Endpoint availability
- **PWA**: Service worker status
- **Sync**: Offline data status

### **Performance Metrics**
- **Response Time**: API endpoint performance
- **Sync Speed**: Offline data sync duration
- **Storage Usage**: IndexedDB usage
- **Error Rates**: Failed requests tracking

## 🎉 Success Metrics

- ✅ **Full-Stack**: Frontend + Backend + Database
- ✅ **Production Ready**: Security + Performance
- ✅ **PWA Compatible**: Android installation
- ✅ **Offline Capable**: IndexedDB + Sync
- ✅ **Scalable**: SQLite + Vercel
- ✅ **Secure**: JWT + bcrypt + Helmet
- ✅ **User Friendly**: Custom install prompt
- ✅ **Data Persistent**: Survives browser restarts

## 🚀 Live Deployment

### **Production URL**
- **Main App**: `https://dmis-uganda.vercel.app`
- **API Health**: `https://dmis-uganda.vercel.app/api/health`
- **PWA Install**: Available on Android Chrome

### **Demo Accounts**
- **Admin**: `admin@ims.com` / `admin123`
- **Regional**: `regional@ims.com` / `regional123`
- **District**: `district@ims.com` / `district123`
- **Facility**: `facility@ims.com` / `facility123`
- **Worker**: `worker@ims.com` / `worker123`

The system is now production-ready with full-stack capabilities, SQLite database, and PWA sync functionality! 🚀 