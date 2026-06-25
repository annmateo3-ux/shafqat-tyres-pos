const path = require('path')
const os = require('os')
const fs = require('fs')

async function clean() {
  const SQL = await require('./node_modules/sql.js')()
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'shafqat-tyres', 'shafqat_tyres.db')
  const db = new SQL.Database(fs.readFileSync(dbPath))

  db.run(`DELETE FROM sale_items WHERE sale_id IN (
    SELECT id FROM sales WHERE 
    customer_name IN ('Ahmed Raza','Malik Faisal','Usman Khan','Shoaib Akhtar','Tariq Mehmood')
    OR notes='Test sale'
  )`)
  db.run(`DELETE FROM sales WHERE 
    customer_name IN ('Ahmed Raza','Malik Faisal','Usman Khan','Shoaib Akhtar','Tariq Mehmood')
    OR notes='Test sale'`)
  db.run(`DELETE FROM customers WHERE notes='Test record - safe to delete'`)
  db.run(`DELETE FROM expenses WHERE description LIKE 'Test expense%' OR description LIKE 'TEST%'`)

  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
  console.log('Test data cleaned!')
}
clean().catch(console.error)
