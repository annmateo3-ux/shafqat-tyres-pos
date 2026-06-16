# Shafqat Tyres & Rim House — POS System

A complete offline desktop POS & inventory management system built with **Electron + React + SQLite**.

## Features

- **Role-based access** (Admin / Staff)
- **Dashboard** — stats, 7-day revenue chart, low stock alerts, recent sales
- **Inventory** — full CRUD, admin-only cost/value columns, low stock highlighting
- **Sales** — new sale with tyre picker, invoice, payment tracking, print
- **Customers** — balance tracking, payment history
- **Suppliers** — 24 pre-loaded, transaction history
- **Expenses** — category breakdown, filters
- **Reports** — date-range sales, profit, top products (admin only)
- **Settings** — company info, user management with role editor

## Pre-loaded Data

- **24 suppliers** (Waqas Khan, Khalid Khan, Izzat Ullah Khan, Pakistan Rubber, etc.)
- **37 inventory batches** (Bridgestone, Dunlop, Michelin, Continental, Yokohama, etc.)

## Default Logins

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| staff    | staff123  | Staff |

## Staff vs Admin Differences

| Feature               | Staff | Admin |
|-----------------------|-------|-------|
| New sales             | ✓     | ✓     |
| View inventory        | ✓     | ✓     |
| Cost/value prices     | ✗     | ✓     |
| Delete records        | ✗     | ✓     |
| Reports               | ✗     | ✓     |
| Settings / Users      | ✗     | ✓     |
| Stock value on dash   | ✗     | ✓     |

---

## Setup & Run (Development)

### Requirements
- Node.js 18+ (LTS recommended, v20 ideal for better-sqlite3 compatibility)
- Windows 10/11 with build tools

### Step 1 — Install Node.js Build Tools (Windows)
```
npm install -g windows-build-tools
```
Or install Visual Studio Build Tools with "C++ build tools" workload.

### Step 2 — Install Dependencies
```bash
cd shafqat-tyres
npm install
```

### Step 3 — Run in Dev Mode
```bash
npm run dev
```
This starts Vite (React) on port 5173 and then opens Electron automatically.

---

## Build Installer (.exe)

```bash
npm run build
```

Output will be in `dist/` folder as a Windows `.exe` installer.

---

## Database Location

The SQLite database (`shafqat_tyres.db`) is stored at:
```
C:\Users\<YourName>\AppData\Roaming\shafqat-tyres\shafqat_tyres.db
```

It is created automatically on first run with all seed data.

---

## Project Structure

```
shafqat-tyres/
├── src/
│   ├── main/
│   │   ├── main.js       # Electron main + SQLite + IPC handlers
│   │   └── preload.js    # Secure IPC bridge
│   └── renderer/
│       ├── components/
│       │   ├── layout/   # Sidebar
│       │   ├── screens/  # Dashboard, Inventory, Sales, etc.
│       │   └── ui/       # Modal, Toast, Icons, ConfirmDialog
│       ├── store/        # AppContext (auth, screen routing)
│       └── utils/        # Formatting, API helpers
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Changing Passwords

Go to **Settings → Users**, click Edit on any user to change their password.

## Adding More Users

Settings → Users → Add User. Assign Admin or Staff role.
