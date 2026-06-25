const path = require('path')
const os = require('os')
const fs = require('fs')

async function seed() {
  const initSqlJs = require('./node_modules/sql.js')
  const SQL = await initSqlJs()
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'shafqat-tyres', 'shafqat_tyres.db')
  
  if (!fs.existsSync(dbPath)) {
    console.log('DB not found at:', dbPath)
    console.log('Run the app first, then run this script.')
    return
  }

  const fileBuffer = fs.readFileSync(dbPath)
  const db = new SQL.Database(fileBuffer)

  // Add test customers
  const customers = [
    ['Malik Faisal', '03001234567', 'LHR-4521'],
    ['Ahmed Raza', '03119876543', 'ISB-7890'],
    ['Usman Khan', '03334567890', 'RWP-1234'],
    ['Shoaib Akhtar', '03456789012', 'KHI-5678'],
    ['Tariq Mehmood', '03561234567', 'LHR-9012'],
  ]

  for (const [name, phone, plate] of customers) {
    try {
      db.run(`INSERT OR IGNORE INTO customers (name, phone, vehicle_plate) VALUES (?,?,?)`, [name, phone, plate])
    } catch(e) {}
  }

  // Get customer IDs and inventory IDs
  const custRows = db.exec('SELECT id, name FROM customers LIMIT 10')[0]
  const invRows = db.exec('SELECT id, brand, size, pattern, sell_price, cost_price FROM inventory WHERE quantity > 5 LIMIT 10')[0]

  if (!custRows || !invRows) {
    console.log('No customers or inventory found')
    return
  }

  const custs = custRows.values.map(r => ({ id: r[0], name: r[1] }))
  const invs = invRows.values.map(r => ({ id: r[0], brand: r[1], size: r[2], pattern: r[3], sell: r[4], cost: r[5] }))

  // Get max sale id
  const maxIdRow = db.exec('SELECT MAX(id) as m FROM sales')[0]
  let nextId = (maxIdRow?.values[0][0] || 0) + 1

  // Add test sales for last 7 days
  const statuses = ['paid', 'paid', 'paid', 'partial', 'unpaid']
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().replace('T', ' ').substring(0, 19))
  }

  for (let i = 0; i < 8; i++) {
    const cust = custs[i % custs.length]
    const inv = invs[i % invs.length]
    const qty = Math.floor(Math.random() * 3) + 1
    const total = inv.sell * qty
    const status = statuses[i % statuses.length]
    const paid = status === 'paid' ? total : status === 'partial' ? Math.floor(total * 0.5) : 0
    const balance = total - paid
    const date = dates[i % dates.length]
    const invoiceNo = `INV-${String(nextId).padStart(5, '0')}`
    const km = String(Math.floor(Math.random() * 80000) + 10000)

    try {
      db.run(`INSERT INTO sales (invoice_no, customer_id, customer_name, vehicle_plate, vehicle_km, subtotal, discount, total, paid, balance, payment_status, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [invoiceNo, cust.id, cust.name, 'TEST-' + (1000 + i), km, total, 0, total, paid, balance, status, 'Test sale', date])
      
      const saleId = db.exec('SELECT last_insert_rowid()')[0].values[0][0]
      
      db.run(`INSERT INTO sale_items (sale_id, inventory_id, brand, size, pattern, quantity, unit_price, total_price) VALUES (?,?,?,?,?,?,?,?)`,
        [saleId, inv.id, inv.brand, inv.size, inv.pattern || '', qty, inv.sell, total])

      db.run(`UPDATE inventory SET quantity = quantity - ? WHERE id=?`, [qty, inv.id])

      if (balance > 0) {
        db.run(`UPDATE customers SET balance = balance + ? WHERE id=?`, [balance, cust.id])
      }

      nextId++
    } catch(e) {
      console.log('Sale error:', e.message)
    }
  }

  // Add test expenses
  const expCats = ['Fuel', 'Maintenance', 'Salary', 'Utilities']
  for (let i = 0; i < 4; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    try {
      db.run(`INSERT INTO expenses (category, description, amount, date) VALUES (?,?,?,?)`,
        [expCats[i], 'Test expense ' + (i+1), (i+1) * 1500, d.toISOString().split('T')[0]])
    } catch(e) {}
  }

  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
  console.log('✅ Test data seeded successfully!')
  console.log('   - 5 customers added')
  console.log('   - 8 sales added (mix of paid/partial/unpaid)')
  console.log('   - 4 expenses added')
  console.log('\nRefresh the app to see the data.')
}

seed().catch(console.error)
