const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

// ─── Auto Updater ─────────────────────────────────────────────────────────────
let autoUpdater
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then(r => { if (r.response === 0) autoUpdater.quitAndInstall() })
    })
    autoUpdater.on('error', (e) => console.log('Updater error:', e.message))
  } catch(e) { console.log('Updater not available') }
}

// ─── Database Setup ───────────────────────────────────────────────────────────
let db
let SQL

async function initDatabase() {
  const initSqlJs = require('sql.js')
  SQL = await initSqlJs()

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'shafqat_tyres.db')

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  createTables()
  migrateDatabase()
  seedData()
  saveDb(dbPath)
  // Auto-save every 30 seconds
  setInterval(() => saveDb(dbPath), 30000)
}

function saveDb(dbPath) {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

function getDbPath() {
  return path.join(app.getPath('userData'), 'shafqat_tyres.db')
}

// Helper: run query and return all rows as objects
function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  } catch(e) {
    console.error('DB all error:', e.message, sql)
    return []
  }
}

// Helper: run and return first row
function get(sql, params = []) {
  const rows = all(sql, params)
  return rows[0] || null
}

// Helper: run insert/update/delete
function run(sql, params = []) {
  try {
    db.run(sql, params)
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0]
    const changes = db.exec('SELECT changes() as c')[0]
    return {
      lastInsertRowid: lastId ? lastId.values[0][0] : null,
      changes: changes ? changes.values[0][0] : 0
    }
  } catch(e) {
    console.error('DB run error:', e.message, sql)
    throw e
  }
}
function logActivity(action, entity, entity_id, description, user_id, user_name) {
  try {
    run('INSERT INTO activity_log (action, entity, entity_id, description, user_id, user_name) VALUES (?,?,?,?,?,?)',
      [action, entity, entity_id||null, description||'', user_id||null, user_name||'System'])
  } catch(e) { console.error('Log error:', e.message) }
}
function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_iban TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    address TEXT,
    balance REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    vehicle_plate TEXT,
    address TEXT,
    balance REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    size TEXT NOT NULL,
    pattern TEXT,
    dot TEXT,
    cost_price REAL NOT NULL DEFAULT 0,
    sell_price REAL NOT NULL DEFAULT 0,
    min_price REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    supplier_id INTEGER REFERENCES suppliers(id),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT,
    vehicle_plate TEXT,
    vehicle_km TEXT,
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    paid REAL NOT NULL DEFAULT 0,
    balance REAL NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    inventory_id INTEGER REFERENCES inventory(id),
    brand TEXT,
    size TEXT,
    pattern TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS supplier_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    amount REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'payment',
    notes TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'payment',
    notes TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS seed_done (
    id INTEGER PRIMARY KEY,
    done INTEGER DEFAULT 0
  )`)

  db.run(`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    user_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`)
}
function migrateDatabase() {
  try {
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      description TEXT,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    console.log('Migration: ensured activity_log table')
  } catch(e) {}
  try {
    db.run(`ALTER TABLE sales ADD COLUMN vehicle_km TEXT DEFAULT ''`)
    console.log('Migration: added vehicle_km column')
  } catch(e) {}
  try {
    db.run(`ALTER TABLE inventory ADD COLUMN category TEXT DEFAULT 'Tyre'`)
    console.log('Migration: added category column')
  } catch(e) {}
  try {
    db.run(`CREATE TABLE IF NOT EXISTS purchase_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id),
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
    console.log('Migration: ensured purchase_batches table')
  } catch(e) {}
  try {
    db.run(`CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL REFERENCES purchase_batches(id),
      inventory_id INTEGER REFERENCES inventory(id),
      brand TEXT,
      size TEXT,
      pattern TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      cost_price REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0
    )`)
    console.log('Migration: ensured purchase_items table')
  } catch(e) {}
 try {
    db.run(`ALTER TABLE inventory ADD COLUMN shipping_cost REAL DEFAULT 0`)
    console.log('Migration: added shipping_cost column')
  } catch(e) {}
  try {
    db.run(`ALTER TABLE purchase_items ADD COLUMN shipping_cost REAL DEFAULT 0`)
    console.log('Migration: added shipping_cost to purchase_items')
  } catch(e) {}
}  

function seedData() {
  const seedRow = get('SELECT done FROM seed_done WHERE id=1')
  if (seedRow && seedRow.done) return

  run(`INSERT OR IGNORE INTO users (username, password, role, name) VALUES (?,?,?,?)`, ['admin', 'admin123', 'admin', 'Administrator'])
  run(`INSERT OR IGNORE INTO users (username, password, role, name) VALUES (?,?,?,?)`, ['staff', 'staff123', 'staff', 'Staff User'])

  run(`INSERT INTO company (name, address, phone, bank_name, bank_account, bank_iban) VALUES (?,?,?,?,?,?)`, [
    'Shafqat Tyres & Rim House',
    'Main GT Road Kharian, opposite Faysal Bank',
    '+92-331-9529378',
    'UBL',
    '0713325446428',
    'PK61UNIL0109000325446428'
  ])

  const supplierList = [
    ['Izzat Ullah Khan', '03339083648', 'Rawalpindi'],
    ['Pakistan Rubber and Tyre Company', '03008224583', 'Lahore flagship'],
    ['Khalid Khan', '03339175553', 'Lahore Truck Adda'],
    ['Waqas Khan', '03182354106', 'Karachi'],
    ['Zafar Enterprises', '03000228525', 'Karachi'],
    ['Burki Enterprises', '03334953010', 'Karachi'],
    ['Nawab Tire Corporation', '03453457548', 'Karachi'],
    ['Waseem Bhali', '03028137331', 'Sarghodha'],
    ['Ikram', '03356060602', 'Rawalpindi'],
    ['Lords Impex', '03324221247', 'Karachi'],
    ['Anees Tyre', '03007610035', 'Faisalabad'],
    ['AM Trading', '03027187189', 'Karachi'],
    ['Makki Tire', '03013464725', 'Sarghodha'],
    ['Mudasir Iqbal', '03334242406', 'Lahore Cantt'],
    ['Yasir Khan', '03348385700', 'Rawalpindi'],
    ['Shafqat & Co', '03216003032', 'Sarghodha'],
    ['Imran Bhalli', '03008703600', 'Sarghodha'],
    ['Haseeb Ahmad', '03700193115', 'Peshawar'],
    ['Qadr Ullah', '03333000427', 'Rawalpindi'],
    ['Safdar Khawajha', '03335321974', 'Rawalpindi'],
    ['Imran', '03224577093', 'Sarghodha'],
    ['Adnan Jawad J.Rasid', '03008477510', 'Lahore'],
    ['Ayesha+Maryam', '03326566515', 'Faisalabad'],
    ['Akhtar Tire Centre', '03204640964', 'Lahore'],
    ['Unknown', '', ''],
  ]

  for (const s of supplierList) {
    run(`INSERT INTO suppliers (name, phone, city) VALUES (?,?,?)`, s)
  }

  const supplierRows = all('SELECT id, name FROM suppliers')
  const supplierMap = {}
  supplierRows.forEach(r => { supplierMap[r.name] = r.id })

  const inv = [
    ['Dunlop','265.60R18','AT25','2025',48000,55000,54500,4,'Waqas Khan'],
    ['Continental','205.65R15','ComfortContact CC7','2025',24500,27500,27000,8,'Khalid Khan'],
    ['Continental','195.65R15','ComfortContact CC7','2025',23250,26000,25500,8,'Khalid Khan'],
    ['Teraflex','185R14','Ecorun101','0126',14800,16500,16000,4,'Izzat Ullah Khan'],
    ['Teraflex','195R14','Ecorun101','0126',16800,18500,18000,8,'Izzat Ullah Khan'],
    ['Teraflex','195R15','Ecorun101','0126',17800,20000,19000,8,'Izzat Ullah Khan'],
    ['Teraflex','185.70R14','Ecorun101','0126',12300,14000,13500,4,'Izzat Ullah Khan'],
    ['Teraflex','195.65R15','Ecorun101','0126',12700,14500,14000,8,'Izzat Ullah Khan'],
    ['Lassa','195R14','Transway','2025',28800,31500,31000,12,'Nawab Tire Corporation'],
    ['Yokohama','215.70R15','RY55','2025',34500,37500,37000,2,'Ikram'],
    ['Yokohama','285.50R20','V105','2025',67500,71000,70000,4,'Ikram'],
    ['Rapid','205.65R15','P329','3525',14500,16000,15500,4,'Waqas Khan'],
    ['Rapid','195.65R15','P329','3525',14000,15500,15000,14,'Waqas Khan'],
    ['Sonix','155.70R12','GoodRise','2025',8300,10000,9500,24,'Waseem Bhali'],
    ['Vitour','165.70R12','NEO Maxpowe','2025',10100,12500,12000,8,'Waseem Bhali'],
    ['Transmate','6.50R16','TR112','2024',29300,32500,32000,4,'Zafar Enterprises'],
    ['Double Coin','225.55R19','DS-66','2025',27200,30000,29500,3,'Zafar Enterprises'],
    ['Armstrong','195.65R15','BLU-TRAC PC','2024',16000,18500,18000,4,'Zafar Enterprises'],
    ['Zeetex','155.70R12','ZT1000','2024',9000,11000,10500,6,'Zafar Enterprises'],
    ['Michelin','215.75R14','XCD2','1825',39500,43000,42500,18,'Zafar Enterprises'],
    ['Roadx','165.70R121','H03','2023',10000,10500,10500,11,'Burki Enterprises'],
    ['Dunlop','195.65R15','R1','2025',18500,22000,21500,4,'Waqas Khan'],
    ['Dunlop','165.70R13','R1','2025',16500,19000,18500,4,'Waqas Khan'],
    ['Bridgestone','185.70R14','Techno','1025',20500,24000,23000,4,'Khalid Khan'],
    ['Bridgestone','195R15','R623','1825',32750,35000,34500,11,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','265.60R18','D697','0924',51500,54000,53000,4,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','265.65R17','D684ii','2625',50800,54000,53500,4,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','165.70R12','B70','4425',17500,19000,18500,4,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','195.55R16','Turanza T005','1525',28400,31000,30500,4,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','195.70R14','Techno','2125',23500,25500,25000,8,'Pakistan Rubber and Tyre Company'],
    ['Bridgestone','195.65R15','Techno','2125',25700,27500,27000,4,'Pakistan Rubber and Tyre Company'],
    ['Dunlop','265.60R18','AT25','3525',51750,57000,55000,4,'Waqas Khan'],
    ['Roadx','165.70R12','H03','0225',10500,12500,12000,8,'Burki Enterprises'],
    ['Teraflex','195.70R14','Ecorun101','3225',12300,14000,13500,8,'Izzat Ullah Khan'],
    ['Teraflex','195.65R15','Ecorun101','3225',12500,14500,13750,8,'Izzat Ullah Khan'],
    ['Michelin','195/65R15','\u2014','',8000,12000,10000,8,'Unknown'],
    ['Teraflex','195.65R15','Ecorun101','3225',12500,14500,13750,8,'Izzat Ullah Khan'],
  ]

  for (const row of inv) {
    const [brand, size, pattern, dot, cost, sell, min, qty, supplierName] = row
    const sid = supplierMap[supplierName] || supplierMap['Unknown'] || null
    run(`INSERT INTO inventory (brand, size, pattern, dot, cost_price, sell_price, min_price, quantity, supplier_id) VALUES (?,?,?,?,?,?,?,?,?)`,
      [brand, size, pattern, dot, cost, sell, min, qty, sid])
  }

  run(`INSERT INTO seed_done (id, done) VALUES (1, 1)`)
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('auth:login', (_, { username, password }) => {
  const user = get('SELECT * FROM users WHERE username=? AND password=? AND active=1', [username, password])
  if (!user) return { success: false, error: 'Invalid credentials' }
  logActivity('login', 'user', user.id, `${user.name} logged in`, user.id, user.name)
  saveDb(getDbPath())
  return { success: true, user: { id: user.id, username: user.username, role: user.role, name: user.name } }
})

ipcMain.handle('company:get', () => get('SELECT * FROM company ORDER BY id DESC LIMIT 1'))
ipcMain.handle('company:update', (_, data) => {
  const { name, address, phone, bank_name, bank_account, bank_iban } = data
  run(`UPDATE company SET name=?, address=?, phone=?, bank_name=?, bank_account=?, bank_iban=?, updated_at=datetime('now') WHERE id=1`,
    [name, address, phone, bank_name, bank_account, bank_iban])
  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('users:list', () => all('SELECT id,username,role,name,active,created_at FROM users'))
ipcMain.handle('users:create', (_, data) => {
  const { username, password, role, name } = data
  try {
    run('INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)', [username, password, role, name])
    saveDb(getDbPath())
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})
ipcMain.handle('users:update', (_, data) => {
  const { id, username, password, role, name, active } = data
  if (password) {
    run('UPDATE users SET username=?,password=?,role=?,name=?,active=? WHERE id=?', [username, password, role, name, active, id])
  } else {
    run('UPDATE users SET username=?,role=?,name=?,active=? WHERE id=?', [username, role, name, active, id])
  }
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('users:delete', (_, id) => {
  run('DELETE FROM users WHERE id=?', [id])
  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('suppliers:list', () => all('SELECT * FROM suppliers ORDER BY name'))
ipcMain.handle('suppliers:get', (_, id) => get('SELECT * FROM suppliers WHERE id=?', [id]))
ipcMain.handle('suppliers:create', (_, data) => {
  const { name, phone, city, address, notes } = data
  const r = run('INSERT INTO suppliers (name,phone,city,address,notes) VALUES (?,?,?,?,?)', [name, phone||'', city||'', address||'', notes||''])
  saveDb(getDbPath())
  return { success: true, id: r.lastInsertRowid }
})
ipcMain.handle('suppliers:update', (_, data) => {
  const { id, name, phone, city, address, notes } = data
  run('UPDATE suppliers SET name=?,phone=?,city=?,address=?,notes=? WHERE id=?', [name, phone, city, address, notes, id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('suppliers:delete', (_, id) => {
  run('DELETE FROM suppliers WHERE id=?', [id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('suppliers:payments', (_, id) => all('SELECT * FROM supplier_payments WHERE supplier_id=? ORDER BY date DESC', [id]))
ipcMain.handle('suppliers:addPayment', (_, data) => {
  const { supplier_id, amount, type, notes, date } = data
  run('INSERT INTO supplier_payments (supplier_id,amount,type,notes,date) VALUES (?,?,?,?,?)', [supplier_id, amount, type||'payment', notes||'', date])
  const sign = type === 'purchase' ? 1 : -1
  run('UPDATE suppliers SET balance = balance + ? WHERE id=?', [amount * sign, supplier_id])
  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('customers:list', () => all('SELECT * FROM customers ORDER BY name'))
ipcMain.handle('customers:get', (_, id) => get('SELECT * FROM customers WHERE id=?', [id]))
ipcMain.handle('customers:create', (_, data) => {
  const { name, phone, vehicle_plate, address, notes } = data
  const r = run('INSERT INTO customers (name,phone,vehicle_plate,address,notes) VALUES (?,?,?,?,?)', [name, phone||'', vehicle_plate||'', address||'', notes||''])
  saveDb(getDbPath())
  return { success: true, id: r.lastInsertRowid }
})
ipcMain.handle('customers:update', (_, data) => {
  const { id, name, phone, vehicle_plate, address, notes } = data
  run('UPDATE customers SET name=?,phone=?,vehicle_plate=?,address=?,notes=? WHERE id=?', [name, phone, vehicle_plate, address, notes, id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('customers:delete', (_, id) => {
  run('DELETE FROM customers WHERE id=?', [id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('customers:payments', (_, id) => all('SELECT * FROM customer_payments WHERE customer_id=? ORDER BY date DESC', [id]))
ipcMain.handle('customers:addPayment', (_, data) => {
  const { customer_id, amount, notes, date } = data
  run('INSERT INTO customer_payments (customer_id,amount,type,notes,date) VALUES (?,?,?,?,?)', [customer_id, amount, 'payment', notes||'', date])
  run('UPDATE customers SET balance = balance - ? WHERE id=?', [amount, customer_id])
  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('inventory:list', () => {
  return all(`SELECT i.*, s.name as supplier_name FROM inventory i LEFT JOIN suppliers s ON i.supplier_id=s.id ORDER BY i.brand, i.size`)
})
ipcMain.handle('inventory:get', (_, id) => get('SELECT * FROM inventory WHERE id=?', [id]))
ipcMain.handle('inventory:create', (_, data) => {
  const { brand, size, pattern, dot, cost_price, shipping_cost, sell_price, min_price, quantity, supplier_id, notes, category } = data
  const total_cost = (Number(cost_price)||0) + (Number(shipping_cost)||0)
  const r = run(`INSERT INTO inventory (brand,size,pattern,dot,cost_price,shipping_cost,sell_price,min_price,quantity,supplier_id,notes,category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [brand, size, pattern||'', dot||'', cost_price, shipping_cost||0, sell_price, min_price, quantity, supplier_id||null, notes||'', category||'Tyre'])
  saveDb(getDbPath())
  return { success: true, id: r.lastInsertRowid }
})
ipcMain.handle('inventory:update', (_, data) => {
  const { id, brand, size, pattern, dot, cost_price, shipping_cost, sell_price, min_price, quantity, supplier_id, notes, category } = data
  run(`UPDATE inventory SET brand=?,size=?,pattern=?,dot=?,cost_price=?,shipping_cost=?,sell_price=?,min_price=?,quantity=?,supplier_id=?,notes=?,category=?,updated_at=datetime('now') WHERE id=?`,
    [brand, size, pattern, dot, cost_price, shipping_cost||0, sell_price, min_price, quantity, supplier_id, notes, category||'Tyre', id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('inventory:delete', (_, id) => {
  const item = get('SELECT * FROM inventory WHERE id=?', [id])
  run('DELETE FROM inventory WHERE id=?', [id])
  if (item) logActivity('delete', 'inventory', id, `Deleted ${item.brand} ${item.size}`, null, null)
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('inventory:lowStock', () => {
  return all(`SELECT i.*, s.name as supplier_name FROM inventory i LEFT JOIN suppliers s ON i.supplier_id=s.id WHERE i.quantity <= 3 ORDER BY i.quantity`)
})

ipcMain.handle('sales:list', (_, filters = {}) => {
  let q = `SELECT s.*, u.name as created_by_name FROM sales s LEFT JOIN users u ON s.created_by=u.id`
  const params = []
  const conds = []
  if (filters.date_from) { conds.push(`date(s.created_at) >= ?`); params.push(filters.date_from) }
  if (filters.date_to) { conds.push(`date(s.created_at) <= ?`); params.push(filters.date_to) }
  if (filters.payment_status) { conds.push(`s.payment_status=?`); params.push(filters.payment_status) }
  if (conds.length) q += ' WHERE ' + conds.join(' AND ')
  q += ' ORDER BY s.created_at DESC'
  return all(q, params)
})
ipcMain.handle('sales:get', (_, id) => {
  const sale = get('SELECT * FROM sales WHERE id=?', [id])
  if (!sale) return null
  sale.items = all('SELECT * FROM sale_items WHERE sale_id=?', [id])
  return sale
})
ipcMain.handle('sales:create', (_, data) => {
  const { customer_id, customer_name, vehicle_plate, vehicle_km, items, discount, paid, notes, created_by } = data
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const total = subtotal - (discount || 0)
  const balance = total - (paid || 0)
  const payment_status = balance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
  const maxId = get('SELECT MAX(id) as maxId FROM sales')
  const invoice_no = `INV-${String((maxId.maxId || 0) + 1).padStart(5, '0')}`

  const r = run(`INSERT INTO sales (invoice_no,customer_id,customer_name,vehicle_plate,vehicle_km,subtotal,discount,total,paid,balance,payment_status,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [invoice_no, customer_id||null, customer_name||'Walk-in', vehicle_plate||'', vehicle_km||'', subtotal, discount||0, total, paid||0, balance, payment_status, notes||'', created_by||null])
  const saleId = r.lastInsertRowid

  for (const item of items) {
    run('INSERT INTO sale_items (sale_id,inventory_id,brand,size,pattern,quantity,unit_price,total_price) VALUES (?,?,?,?,?,?,?,?)',
      [saleId, item.inventory_id||null, item.brand, item.size, item.pattern||'', item.quantity, item.unit_price, item.total_price])
    if (item.inventory_id) {
      run('UPDATE inventory SET quantity = quantity - ? WHERE id=?', [item.quantity, item.inventory_id])
    }
  }
  let finalCustomerId = customer_id
  if (customer_id && balance > 0) {
    run('UPDATE customers SET balance = balance + ? WHERE id=?', [balance, customer_id])
  } else if (!customer_id && customer_name && customer_name !== 'Walk-in Customer') {
    const existing = get('SELECT id FROM customers WHERE name=? AND phone=?', [customer_name, ''])
    if (existing) {
      finalCustomerId = existing.id
      if (balance > 0) run('UPDATE customers SET balance = balance + ? WHERE id=?', [balance, existing.id])
    } else {
      const newCust = run('INSERT INTO customers (name, phone, vehicle_plate) VALUES (?,?,?)', [customer_name, '', vehicle_plate||''])
      finalCustomerId = newCust.lastInsertRowid
      if (balance > 0) run('UPDATE customers SET balance = balance + ? WHERE id=?', [balance, finalCustomerId])
    }
    if (finalCustomerId) {
      run('UPDATE sales SET customer_id=? WHERE id=?', [finalCustomerId, saleId])
    }
  }
  logActivity('create', 'sale', saleId, `Sale ${invoice_no} for ${customer_name||'Walk-in'} — Rs ${total}`, created_by, null)
  saveDb(getDbPath())
  return { success: true, id: saleId, invoice_no }
})

ipcMain.handle('sales:delete', (_, id) => {
  const sale = get('SELECT * FROM sales WHERE id=?', [id])
  const items = all('SELECT * FROM sale_items WHERE sale_id=?', [id])
  for (const item of items) {
    if (item.inventory_id) run('UPDATE inventory SET quantity = quantity + ? WHERE id=?', [item.quantity, item.inventory_id])
  }
  if (sale && sale.customer_id && sale.balance > 0) {
    run('UPDATE customers SET balance = balance - ? WHERE id=?', [sale.balance, sale.customer_id])
  }
  run('DELETE FROM sale_items WHERE sale_id=?', [id])
  run('DELETE FROM sales WHERE id=?', [id])
  if (sale) logActivity('delete', 'sale', id, `Deleted sale ${sale.invoice_no} — Rs ${sale.total}`, null, null)
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('expenses:list', (_, filters = {}) => {
  let q = `SELECT e.*, u.name as created_by_name FROM expenses e LEFT JOIN users u ON e.created_by=u.id`
  const params = []
  const conds = []
  if (filters.date_from) { conds.push(`date(e.date) >= ?`); params.push(filters.date_from) }
  if (filters.date_to) { conds.push(`date(e.date) <= ?`); params.push(filters.date_to) }
  if (conds.length) q += ' WHERE ' + conds.join(' AND ')
  q += ' ORDER BY e.date DESC'
  return all(q, params)
})
ipcMain.handle('expenses:create', (_, data) => {
  const { category, description, amount, date, created_by } = data
  run('INSERT INTO expenses (category,description,amount,date,created_by) VALUES (?,?,?,?,?)', [category, description||'', amount, date, created_by||null])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('expenses:update', (_, data) => {
  const { id, category, description, amount, date } = data
  run('UPDATE expenses SET category=?,description=?,amount=?,date=? WHERE id=?', [category, description, amount, date, id])
  saveDb(getDbPath())
  return { success: true }
})
ipcMain.handle('expenses:delete', (_, id) => {
  const exp = get('SELECT * FROM expenses WHERE id=?', [id])
  run('DELETE FROM expenses WHERE id=?', [id])
  if (exp) logActivity('delete', 'expense', id, `Deleted expense: ${exp.category} — Rs ${exp.amount}`, null, null)
  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('reports:dashboard', () => {
  const today = new Date().toISOString().split('T')[0]
  const month = today.slice(0, 7)
  const todaySales = get(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM sales WHERE date(created_at)=?`, [today])
  const monthSales = get(`SELECT COALESCE(SUM(total),0) as total, COUNT(*) as count FROM sales WHERE strftime('%Y-%m',created_at)=?`, [month])
  const totalInventoryValue = get(`SELECT COALESCE(SUM(cost_price*quantity),0) as val FROM inventory`)
  const totalInventoryQty = get(`SELECT COALESCE(SUM(quantity),0) as qty FROM inventory`)
  const pendingBalance = get(`SELECT COALESCE(SUM(balance),0) as bal FROM customers WHERE balance > 0`)
  const lowStock = get(`SELECT COUNT(*) as c FROM inventory WHERE quantity <= 3`)
  const lowStockItems = all(`SELECT * FROM inventory WHERE quantity <= 3 ORDER BY quantity LIMIT 5`)
  const todayExpenses = get(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date=?`, [today])
  const monthExpenses = get(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE strftime('%Y-%m',date)=?`, [month])
  const recentSales = all(`SELECT invoice_no, customer_name, total, payment_status, created_at FROM sales ORDER BY created_at DESC LIMIT 8`)
  const last7days = all(`SELECT date(created_at) as day, COALESCE(SUM(total),0) as revenue, COUNT(*) as count FROM sales WHERE date(created_at) >= date('now','-6 days') GROUP BY date(created_at) ORDER BY day`)
  const topProducts = all(`SELECT si.brand, si.size, SUM(si.quantity) as sold, SUM(si.total_price) as revenue FROM sale_items si WHERE si.sale_id IN (SELECT id FROM sales WHERE strftime('%Y-%m',created_at)=?) GROUP BY si.brand, si.size ORDER BY sold DESC LIMIT 5`, [month])
  return {
    todaySales, monthSales, totalInventoryValue, totalInventoryQty,
    pendingBalance, lowStock, lowStockItems, todayExpenses, monthExpenses,
    recentSales, last7days, topProducts
  }
})
ipcMain.handle('reports:salesReport', (_, { date_from, date_to }) => {
  const sales = all(`SELECT s.*, u.name as created_by_name FROM sales s LEFT JOIN users u ON s.created_by=u.id WHERE date(s.created_at) BETWEEN ? AND ? ORDER BY s.created_at DESC`, [date_from, date_to])
  const totals = get(`SELECT COALESCE(SUM(total),0) as revenue, COALESCE(SUM(discount),0) as discounts, COALESCE(SUM(paid),0) as collected, COALESCE(SUM(balance),0) as outstanding, COUNT(*) as count FROM sales WHERE date(created_at) BETWEEN ? AND ?`, [date_from, date_to])
  const expenses = get(`SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE date BETWEEN ? AND ?`, [date_from, date_to])
  const costOfGoods = get(`SELECT COALESCE(SUM(si.quantity * i.cost_price),0) as cogs FROM sale_items si JOIN sales s ON si.sale_id=s.id LEFT JOIN inventory i ON si.inventory_id=i.id WHERE date(s.created_at) BETWEEN ? AND ?`, [date_from, date_to])
  return { sales, totals, expenses, costOfGoods }
})

ipcMain.handle('reports:topProducts', (_, { date_from, date_to }) => {
  return all(`SELECT si.brand, si.size, si.pattern, SUM(si.quantity) as sold, SUM(si.total_price) as revenue FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE date(s.created_at) BETWEEN ? AND ? GROUP BY si.brand, si.size ORDER BY sold DESC LIMIT 20`, [date_from, date_to])
})
ipcMain.handle('activity:list', (_, limit = 100) => {
  return all(`SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?`, [limit])
})
ipcMain.handle('sales:update', (_, data) => {
  const { id, customer_id, customer_name, vehicle_plate, vehicle_km, items, discount, paid, notes } = data
  const oldSale = get('SELECT * FROM sales WHERE id=?', [id])
  const oldItems = all('SELECT * FROM sale_items WHERE sale_id=?', [id])
  if (!oldSale) return { success: false, error: 'Sale not found' }

  // Reverse old inventory
  for (const item of oldItems) {
    if (item.inventory_id) run('UPDATE inventory SET quantity = quantity + ? WHERE id=?', [item.quantity, item.inventory_id])
  }

  // Reverse old customer balance
  if (oldSale.customer_id && oldSale.balance > 0) {
    run('UPDATE customers SET balance = balance - ? WHERE id=?', [oldSale.balance, oldSale.customer_id])
  }

  // Calculate new totals
  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const total = subtotal - (discount || 0)
  const balance = total - (paid || 0)
  const payment_status = balance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')

  // Update sale
  run(`UPDATE sales SET customer_id=?,customer_name=?,vehicle_plate=?,vehicle_km=?,subtotal=?,discount=?,total=?,paid=?,balance=?,payment_status=?,notes=? WHERE id=?`,
    [customer_id||null, customer_name||'Walk-in', vehicle_plate||'', vehicle_km||'', subtotal, discount||0, total, paid||0, balance, payment_status, notes||'', id])

  // Delete old items
  run('DELETE FROM sale_items WHERE sale_id=?', [id])

  // Insert new items
  for (const item of items) {
    run('INSERT INTO sale_items (sale_id,inventory_id,brand,size,pattern,quantity,unit_price,total_price) VALUES (?,?,?,?,?,?,?,?)',
      [id, item.inventory_id||null, item.brand, item.size, item.pattern||'', item.quantity, item.unit_price, item.total_price])
    if (item.inventory_id) {
      run('UPDATE inventory SET quantity = quantity - ? WHERE id=?', [item.quantity, item.inventory_id])
    }
  }

  // Apply new customer balance
  if (customer_id && balance > 0) {
    run('UPDATE customers SET balance = balance + ? WHERE id=?', [balance, customer_id])
  }

  saveDb(getDbPath())
  return { success: true }
})

ipcMain.handle('customers:sales', (_, id) => {
  const sales = all(`SELECT * FROM sales WHERE customer_id=? ORDER BY created_at DESC`, [id])
  for (const sale of sales) {
    sale.items = all('SELECT * FROM sale_items WHERE sale_id=?', [sale.id])
  }
  return sales
})

ipcMain.handle('purchases:list', (_, supplierId) => {
  if (supplierId) {
    return all(`SELECT p.*, s.name as supplier_name FROM purchase_batches p LEFT JOIN suppliers s ON p.supplier_id=s.id WHERE p.supplier_id=? ORDER BY p.date DESC`, [supplierId])
  }
  return all(`SELECT p.*, s.name as supplier_name FROM purchase_batches p LEFT JOIN suppliers s ON p.supplier_id=s.id ORDER BY p.date DESC`)
})

ipcMain.handle('purchases:get', (_, id) => {
  const batch = get('SELECT * FROM purchase_batches WHERE id=?', [id])
  if (!batch) return null
  batch.items = all('SELECT * FROM purchase_items WHERE batch_id=?', [id])
  return batch
})

ipcMain.handle('purchases:create', (_, data) => {
  const { supplier_id, items, notes, date } = data
  const total = items.reduce((s, i) => s + i.total_price, 0)

  const r = run('INSERT INTO purchase_batches (supplier_id, total, notes, date) VALUES (?,?,?,?)',
    [supplier_id||null, total, notes||'', date])
  const batchId = r.lastInsertRowid

  for (const item of items) {
    run('INSERT INTO purchase_items (batch_id,inventory_id,brand,size,pattern,quantity,cost_price,total_price) VALUES (?,?,?,?,?,?,?,?)',
      [batchId, item.inventory_id||null, item.brand, item.size, item.pattern||'', item.quantity, item.cost_price, item.total_price])
    if (item.inventory_id) {
      run('UPDATE inventory SET quantity = quantity + ?, cost_price=? WHERE id=?', [item.quantity, item.cost_price, item.inventory_id])
    }
  }

  // Add to supplier balance
  if (supplier_id) {
    run('UPDATE suppliers SET balance = balance + ? WHERE id=?', [total, supplier_id])
    run('INSERT INTO supplier_payments (supplier_id,amount,type,notes,date) VALUES (?,?,?,?,?)',
      [supplier_id, total, 'purchase', notes||'', date])
  }

  saveDb(getDbPath())
  return { success: true, id: batchId }
})

ipcMain.handle('purchases:delete', (_, id) => {
  const batch = get('SELECT * FROM purchase_batches WHERE id=?', [id])
  const items = all('SELECT * FROM purchase_items WHERE batch_id=?', [id])
  for (const item of items) {
    if (item.inventory_id) run('UPDATE inventory SET quantity = quantity - ? WHERE id=?', [item.quantity, item.inventory_id])
  }
  if (batch && batch.supplier_id) {
    run('UPDATE suppliers SET balance = balance - ? WHERE id=?', [batch.total, batch.supplier_id])
  }
  run('DELETE FROM purchase_items WHERE batch_id=?', [id])
  run('DELETE FROM purchase_batches WHERE id=?', [id])
  saveDb(getDbPath())
  return { success: true }
})
// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1100, minHeight: 700,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#080810',
    show: false,
  })
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()
  if (!isDev && autoUpdater) setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 3000)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => {
  saveDb(getDbPath())
  if (process.platform !== 'darwin') app.quit()
})