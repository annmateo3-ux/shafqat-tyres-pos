import React, { useState, useEffect, useRef, useMemo } from 'react'
import { invoke, fmt, PAYMENT_STATUS } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Trash, Search, Printer, Eye, RefreshCw, X, ShoppingCart, Edit } from '../ui/Icons.jsx'

// ─── Invoice Print View ───────────────────────────────────────────────────────
function numberToWords(n) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n === 0) return 'Zero'
  const convert = (num) => {
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' ' + ones[num%10] : '')
    if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + convert(num%100) : '')
    if (num < 100000) return convert(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + convert(num%1000) : '')
    if (num < 10000000) return convert(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + convert(num%100000) : '')
    return convert(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + convert(num%10000000) : '')
  }
  return convert(Math.floor(n)) + ' Rupees Only'
}


function EditSaleModal({ sale, onClose, onSave }) {
  const { showToast } = useApp()
  const [customers, setCustomers] = useState([])
  const [inventory, setInventory] = useState([])
  const [customer, setCustomer] = useState({ id: sale.customer_id || '', name: sale.customer_name || '', plate: sale.vehicle_plate || '', km: sale.vehicle_km || '' })
  const [items, setItems] = useState((sale.items || []).map(i => ({ ...i })))
  const [discount, setDiscount] = useState(sale.discount || 0)
  const [paid, setPaid] = useState(sale.paid || 0)
  const [notes, setNotes] = useState(sale.notes || '')
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [invSearch, setInvSearch] = useState('')

  useEffect(() => {
    Promise.all([invoke('customers:list'), invoke('inventory:list')]).then(([c, inv]) => {
      setCustomers(c || [])
      setInventory(inv || [])
    })
  }, [])

  const filteredInv = useMemo(() => {
    const q = invSearch.toLowerCase()
    return inventory.filter(i => !q || [i.brand, i.size, i.pattern].some(f => f?.toLowerCase().includes(q)))
  }, [inventory, invSearch])

  const addItem = (inv) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.inventory_id === inv.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing].quantity += 1
        updated[existing].total_price = updated[existing].quantity * updated[existing].unit_price
        return updated
      }
      return [...prev, { inventory_id: inv.id, brand: inv.brand, size: inv.size, pattern: inv.pattern || '', quantity: 1, unit_price: inv.sell_price, total_price: inv.sell_price }]
    })
    setShowPicker(false)
    setInvSearch('')
  }

  const updateItem = (idx, key, val) => {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [key]: Number(val) }
      updated[idx].total_price = updated[idx].quantity * updated[idx].unit_price
      return updated
    })
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const total = subtotal - Number(discount)
  const balance = total - Number(paid)

  const handleSave = async () => {
    if (items.length === 0) { showToast('Add at least one item', 'error'); return }
    setSaving(true)
    const res = await invoke('sales:update', {
      id: sale.id,
      customer_id: customer.id || null,
      customer_name: customer.name || 'Walk-in Customer',
      vehicle_plate: customer.plate,
      vehicle_km: customer.km,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), total_price: Number(i.total_price) })),
      discount: Number(discount),
      paid: Number(paid),
      notes,
    })
    setSaving(false)
    if (res?.success) { showToast('Sale updated'); onSave() }
    else showToast('Failed to update', 'error')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '860px', background: '#0f1520', border: '1px solid #1e2837', borderRadius: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #1e2837', flexShrink: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Edit Sale — {sale.invoice_no}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#0d1117', border: '1px solid #1e2837', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Customer</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Select</div>
                  <select style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }}
                    value={customer.id} onChange={e => {
                      const c = customers.find(c => c.id === Number(e.target.value))
                      setCustomer(c ? { id: c.id, name: c.name, plate: c.vehicle_plate || '', km: '' } : { id: '', name: '', plate: '', km: '' })
                    }}>
                    <option value="">Walk-in</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Name</div>
                  <input style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Vehicle</div>
                  <input style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={customer.plate} onChange={e => setCustomer(p => ({ ...p, plate: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>KM</div>
                  <input type="number" style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={customer.km} onChange={e => setCustomer(p => ({ ...p, km: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ background: '#0d1117', border: '1px solid #1e2837', borderRadius: '10px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items</div>
                <button onClick={() => setShowPicker(true)} style={{ background: '#e53e3e18', border: '1px solid #e53e3e35', borderRadius: '6px', padding: '5px 12px', color: '#e53e3e', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2837' }}>
                    <th style={{ padding: '6px', textAlign: 'left', color: '#6b7280', fontSize: '10px' }}>Item</th>
                    <th style={{ padding: '6px', textAlign: 'center', color: '#6b7280', fontSize: '10px', width: '60px' }}>Qty</th>
                    <th style={{ padding: '6px', textAlign: 'right', color: '#6b7280', fontSize: '10px', width: '110px' }}>Price</th>
                    <th style={{ padding: '6px', textAlign: 'right', color: '#6b7280', fontSize: '10px', width: '100px' }}>Total</th>
                    <th style={{ width: '28px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #111827' }}>
                      <td style={{ padding: '6px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '11px' }}>{item.brand}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{item.size}</div>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <input type="number" min="1" style={{ width: '52px', textAlign: 'center', background: '#151c28', border: '1px solid #1e2837', borderRadius: '5px', padding: '4px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input type="number" style={{ width: '100%', textAlign: 'right', background: '#151c28', border: '1px solid #1e2837', borderRadius: '5px', padding: '4px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: '#e2e8f0', fontSize: '11px' }}>{fmt.currency(item.total_price)}</td>
                      <td style={{ padding: '6px' }}>
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color='#e53e3e'} onMouseLeave={e => e.currentTarget.style.color='#6b7280'}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {showPicker && (
                <div style={{ marginTop: '10px', background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '12px' }}>
                  <input autoFocus placeholder="Search inventory..." value={invSearch} onChange={e => setInvSearch(e.target.value)} style={{ width: '100%', background: '#0d1117', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    {filteredInv.map(inv => (
                      <button key={inv.id} onClick={() => addItem(inv)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.background='#1e2837'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                        <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{inv.brand} {inv.size}</span>
                        <span style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 600 }}>{fmt.currency(inv.sell_price)}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowPicker(false)} style={{ width: '100%', marginTop: '8px', padding: '7px', background: '#1e2837', border: '1px solid #2a3a52', borderRadius: '6px', color: '#9ca3af', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Notes</div>
              <textarea style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit', height: '60px', resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div style={{ background: '#0d1117', border: '1px solid #1e2837', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'start' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span style={{ color: '#e2e8f0' }}>{fmt.currency(subtotal)}</span>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Discount</div>
              <input type="number" style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, borderTop: '1px solid #1e2837', paddingTop: '10px' }}>
              <span style={{ color: '#6b7280' }}>Total</span>
              <span style={{ color: '#e53e3e' }}>{fmt.currency(total)}</span>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '5px' }}>Amount Paid</div>
              <input type="number" style={{ width: '100%', background: '#151c28', border: '1px solid #1e2837', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'inherit' }} value={paid} onChange={e => setPaid(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#6b7280' }}>Balance</span>
              <span style={{ color: balance > 0 ? '#e53e3e' : '#22c55e', fontWeight: 700 }}>{fmt.currency(Math.max(0, balance))}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: balance <= 0 ? '#22c55e20' : paid > 0 ? '#f59e0b20' : '#e53e3e20', color: balance <= 0 ? '#22c55e' : paid > 0 ? '#f59e0b' : '#e53e3e', border: `1px solid ${balance <= 0 ? '#22c55e30' : paid > 0 ? '#f59e0b30' : '#e53e3e30'}` }}>
                {balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'}
              </span>
            </div>
            <button onClick={handleSave} disabled={saving || items.length === 0} style={{ width: '100%', padding: '11px', background: saving ? '#2a3a52' : '#e53e3e', color: saving ? '#6b7280' : 'white', border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: '9px', background: '#1e2837', border: '1px solid #2a3a52', borderRadius: '7px', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoicePrint({ sale, items, company }) {
  const s = { fontFamily: 'Arial, sans-serif', color: 'black', background: 'white' }
  return (
    <div style={{ ...s, padding: '32px', minHeight: '100vh', fontSize: '13px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '2px solid #111', marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#111" strokeWidth="4"/>
          <circle cx="32" cy="32" r="10" fill="none" stroke="#111" strokeWidth="3"/>
          <circle cx="32" cy="32" r="4" fill="#111"/>
          {[0,60,120,180,240,300].map(a => { const r=a*Math.PI/180; return <line key={a} x1={32+10*Math.cos(r)} y1={32+10*Math.sin(r)} x2={32+27*Math.cos(r)} y2={32+27*Math.sin(r)} stroke="#111" strokeWidth="3" strokeLinecap="round"/> })}
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>{company?.name}</div>
          <div style={{ color: '#555', marginTop: '2px' }}>{company?.address}</div>
          <div style={{ color: '#555' }}>📞 {company?.phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '2px', color: '#111' }}>INVOICE</div>
          <table style={{ marginLeft: 'auto', marginTop: '6px', fontSize: '12px' }}>
            <tbody>
              <tr><td style={{ color: '#555', paddingRight: '12px' }}>Invoice No.</td><td style={{ fontWeight: 600 }}>: {sale.invoice_no}</td></tr>
              <tr><td style={{ color: '#555' }}>Date</td><td style={{ fontWeight: 600 }}>: {fmt.date(sale.created_at)}</td></tr>
              <tr><td style={{ color: '#555' }}>Time</td><td>: {new Date(sale.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</td></tr>
              <tr><td style={{ color: '#555' }}>Status</td><td style={{ fontWeight: 600, color: sale.payment_status==='paid'?'green':'red' }}>: {sale.payment_status?.toUpperCase()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer + Bank Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', color: '#333' }}>Customer Details</div>
          <table style={{ fontSize: '12px', width: '100%' }}>
            <tbody>
              <tr><td style={{ color: '#666', width: '80px', paddingBottom: '4px' }}>Name</td><td style={{ fontWeight: 600 }}>: {sale.customer_name}</td></tr>
              {sale.vehicle_plate && <tr><td style={{ color: '#666', paddingBottom: '4px' }}>Vehicle</td><td style={{ fontWeight: 600 }}>: {sale.vehicle_plate}</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', color: '#333' }}>Bank Details</div>
          <table style={{ fontSize: '12px', width: '100%' }}>
            <tbody>
              <tr><td style={{ color: '#666', width: '80px', paddingBottom: '4px' }}>Bank</td><td>: {company?.bank_name}</td></tr>
              <tr><td style={{ color: '#666', paddingBottom: '4px' }}>Account</td><td>: {company?.bank_account}</td></tr>
              <tr><td style={{ color: '#666', paddingBottom: '4px' }}>IBAN</td><td>: {company?.bank_iban}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['S.#','Brand','Size','Pattern','Qty','Unit Price','Total Price'].map(h => (
              <th key={h} style={{ border: '1px solid #ddd', padding: '8px 10px', textAlign: h==='Qty'?'center':(h==='Unit Price'||h==='Total Price')?'right':'left', fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px' }}>{i+1}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px', fontWeight: 600 }}>{item.brand}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px' }}>{item.size}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px' }}>{item.pattern||'-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px', textAlign: 'right' }}>Rs {Number(item.unit_price).toLocaleString()}</td>
              <td style={{ border: '1px solid #ddd', padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Rs {Number(item.total_price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + Amount in words */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ maxWidth: '55%' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Amount In Words:</div>
          <div style={{ fontSize: '12px', color: '#333', fontStyle: 'italic' }}>{numberToWords(Math.round(sale.total))}</div>
        </div>
        <table style={{ fontSize: '13px' }}>
          <tbody>
            <tr><td style={{ padding: '3px 20px 3px 0', color: '#555' }}>Sub Total</td><td style={{ padding: '3px 0', textAlign: 'right' }}>Rs {Number(sale.subtotal).toLocaleString()}</td></tr>
            <tr><td style={{ padding: '3px 20px 3px 0', color: '#555' }}>Discount</td><td style={{ padding: '3px 0', textAlign: 'right' }}>Rs {Number(sale.discount||0).toLocaleString()}</td></tr>
            <tr style={{ borderTop: '2px solid #111', fontWeight: 700, fontSize: '15px' }}>
              <td style={{ padding: '6px 20px 6px 0' }}>Total Amount</td>
              <td style={{ padding: '6px 0', textAlign: 'right' }}>Rs {Number(sale.total).toLocaleString()}</td>
            </tr>
            <tr><td style={{ padding: '3px 20px 3px 0', color: '#555' }}>Paid Amount</td><td style={{ padding: '3px 0', textAlign: 'right', color: 'green', fontWeight: 600 }}>Rs {Number(sale.paid).toLocaleString()}</td></tr>
            {sale.balance > 0 && <tr><td style={{ padding: '3px 20px 3px 0', color: '#555' }}>Balance</td><td style={{ padding: '3px 0', textAlign: 'right', color: 'red', fontWeight: 700 }}>Rs {Number(sale.balance).toLocaleString()}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {sale.notes && <div style={{ marginBottom: '16px', fontSize: '12px', color: '#555' }}><strong>Notes:</strong> {sale.notes}</div>}

      {/* Terms + Signature */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>Terms & Conditions</div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: 1.8 }}>
            • Goods once sold will not be taken back.<br/>
            • No warranty on tube & puncture.<br/>
            • Please check the goods before leaving.
          </div>
        </div>
        <div style={{ textAlign: 'center'  }}>
          <div style={{ width: '120px', borderTop: '1px solid #333', paddingTop: '6px', fontSize: '11px', color: '#555' }}>Authorized Signature</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '12px', color: '#888' }}>
        Thank you for your business! — {company?.name} — {company?.phone}
      </div>
    </div>
  )
}

// ─── Sales List View ──────────────────────────────────────────────────────────
function SalesList({ onNewSale, isAdmin }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewSale, setViewSale] = useState(null)
  const [viewItems, setViewItems] = useState([])
  const [company, setCompany] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [editSale, setEditSale] = useState(null)
  const { showToast } = useApp()

  const load = async () => {
    setLoading(true)
    const [s, c] = await Promise.all([invoke('sales:list', {}), invoke('company:get')])
    setSales(s || [])
    setCompany(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s => {
      const matchSearch = !q || [s.invoice_no, s.customer_name, s.vehicle_plate].some(f => f?.toLowerCase().includes(q))
      const matchStatus = !filterStatus || s.payment_status === filterStatus
      return matchSearch && matchStatus
    })
  }, [sales, search, filterStatus])

  const openEdit = async (sale) => {
    const full = await invoke('sales:get', sale.id)
    setEditSale(full)
  }

  const openSale = async (sale) => {
    const full = await invoke('sales:get', sale.id)
    setViewSale(full)
    setViewItems(full?.items || [])
  }

  const handleDelete = async () => {
    await invoke('sales:delete', deleteId)
    showToast('Sale deleted', 'error')
    setDeleteId(null)
    load()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t2"><Search size={16} /></span>
          <input className="input pl-9" placeholder="Search invoice, customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Invoice</th>
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Vehicle</th>
                <th className="px-4 py-3 text-right text-xs text-t2 font-medium">Total</th>
                <th className="px-4 py-3 text-right text-xs text-t2 font-medium">Paid</th>
                <th className="px-4 py-3 text-right text-xs text-t2 font-medium">Balance</th>
                <th className="px-4 py-3 text-center text-xs text-t2 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Date</th>
                <th className="px-4 py-3 text-center text-xs text-t2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="py-12 text-center text-t2">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="py-12 text-center text-t2">No sales found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-xs text-accent">{s.invoice_no}</td>
                  <td className="px-4 py-3 text-white">{s.customer_name}</td>
                  <td className="px-4 py-3 text-t2 text-xs">{s.vehicle_plate || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt.currency(s.total)}</td>
                  <td className="px-4 py-3 text-right text-green-400">{fmt.currency(s.paid)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{s.balance > 0 ? fmt.currency(s.balance) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge-${s.payment_status}`}>{s.payment_status}</span>
                  </td>
                  <td className="px-4 py-3 text-t2 text-xs">{fmt.dateTime(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openSale(s)} className="action-btn" title="View">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => openEdit(s)} className="action-btn" title="Edit"><Edit size={14} /></button>
                      )}
                      {isAdmin && (
                        <button onClick={() => setDeleteId(s.id)} className="action-btn" title="Delete">
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Sale Modal */}
      {viewSale && company && (
        <Modal title={`Invoice ${viewSale.invoice_no}`} onClose={() => setViewSale(null)} size="xl" noPad>
          <div className="no-print flex items-center justify-end gap-2 px-6 py-3 border-b border-border">
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
              <Printer size={16} />Print Invoice
            </button>
          </div>
          <div className="p-6">
            <InvoicePrint sale={viewSale} items={viewItems} company={company} />
          </div>
        </Modal>
      )}

      {editSale && (
        <EditSaleModal
          sale={editSale}
          onClose={() => setEditSale(null)}
          onSave={() => { setEditSale(null); load() }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Sale?"
          message="This will reverse inventory quantities and remove the sale permanently."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}

// ─── New Sale Form ────────────────────────────────────────────────────────────
function NewSaleForm({ onDone }) {
  const { user, showToast } = useApp()
  const [inventory, setInventory] = useState([])
  const [customers, setCustomers] = useState([])
  const [company, setCompany] = useState(null)
  const [customer, setCustomer] = useState({ id: '', name: '', plate: '' })
  const [items, setItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paid, setPaid] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [invSearch, setInvSearch] = useState('')
  const [showInvPicker, setShowInvPicker] = useState(false)
  const [savedSale, setSavedSale] = useState(null)
  const [savedItems, setSavedItems] = useState([])

  useEffect(() => {
    Promise.all([invoke('inventory:list'), invoke('customers:list'), invoke('company:get')]).then(([inv, cust, comp]) => {
      setInventory(inv || [])
      setCustomers(cust || [])
      setCompany(comp)
    })
  }, [])

  const filteredInv = useMemo(() => {
    const q = invSearch.toLowerCase()
    return inventory.filter(i => i.quantity > 0 && (!q || [i.brand, i.size, i.pattern].some(f => f?.toLowerCase().includes(q))))
  }, [inventory, invSearch])

  const addItem = (inv) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.inventory_id === inv.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1, total_price: (updated[existing].quantity + 1) * updated[existing].unit_price }
        return updated
      }
      return [...prev, {
        inventory_id: inv.id, brand: inv.brand, size: inv.size, pattern: inv.pattern || '',
        quantity: 1, unit_price: inv.sell_price, total_price: inv.sell_price,
        max_qty: inv.quantity, min_price: inv.min_price,
      }]
    })
    setShowInvPicker(false)
    setInvSearch('')
  }

  const updateItem = (idx, key, val) => {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [key]: val }
      if (key === 'quantity' || key === 'unit_price') {
        updated[idx].total_price = updated[idx].quantity * updated[idx].unit_price
      }
      return updated
    })
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.total_price, 0)
  const total = subtotal - Number(discount)
  const balance = total - Number(paid)

  const handleSave = async () => {
    if (items.length === 0) { showToast('Add at least one item', 'error'); return }
    setSaving(true)
    const res = await invoke('sales:create', {
      customer_id: customer.id || null,
      customer_name: customer.name || 'Walk-in Customer',
      vehicle_plate: customer.plate,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), total_price: Number(i.total_price) })),
      discount: Number(discount),
      paid: Number(paid),
      notes,
      created_by: user?.id,
    })
    setSaving(false)
    if (res?.success) {
      const full = await invoke('sales:get', res.id)
      setSavedSale(full)
      setSavedItems(full?.items || [])
      showToast(`Invoice ${res.invoice_no} saved!`)
    } else {
      showToast('Failed to save sale', 'error')
    }
  }

  // Show invoice after save
  if (savedSale && company) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSavedSale(null); setItems([]); setCustomer({ id:'', name:'', plate:'' }); setDiscount(0); setPaid(0) }} className="btn-secondary">New Sale</button>
          <button onClick={() => { window.print() }} className="btn-primary flex items-center gap-2"><Printer size={16} />Print Invoice</button>
          <button onClick={onDone} className="btn-ghost">View All Sales →</button>
        </div>
        <div className="print-wrapper">
          <InvoicePrint sale={savedSale} items={savedItems} company={company} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Items */}
      <div className="col-span-2 space-y-4">
        {/* Customer */}
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Customer</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Select Customer</label>
              <select className="input" value={customer.id} onChange={e => {
                const c = customers.find(c => c.id === Number(e.target.value))
                setCustomer(c ? { id: c.id, name: c.name, plate: c.vehicle_plate || '' } : { id: '', name: '', plate: '' })
              }}>
                <option value="">Walk-in / New</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Customer Name</label>
              <input className="input" value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Walk-in Customer" />
            </div>
            <div>
              <label className="label">Vehicle Plate</label>
              <input className="input" value={customer.plate} onChange={e => setCustomer(p => ({ ...p, plate: e.target.value }))} placeholder="e.g. LMN-1234" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Items ({items.length})</h3>
            <button onClick={() => setShowInvPicker(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus size={14} />Add Tyre
            </button>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-t2">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left text-xs text-t2 font-medium">Item</th>
                  <th className="py-2 text-center text-xs text-t2 font-medium w-20">Qty</th>
                  <th className="py-2 text-right text-xs text-t2 font-medium w-32">Unit Price</th>
                  <th className="py-2 text-right text-xs text-t2 font-medium w-32">Total</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-white">{item.brand}</div>
                      <div className="text-xs text-t2">{item.size} {item.pattern && `· ${item.pattern}`}</div>
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number" min="1" max={item.max_qty}
                        className="input w-16 text-center text-sm py-1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Math.max(1, Math.min(item.max_qty, Number(e.target.value))))}
                      />
                    </td>
                    <td className="py-2 pl-2">
                      <div className="relative">
                        <input
                          type="number"
                          className="input w-full text-right text-sm py-1 pr-2"
                          value={item.unit_price}
                          onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                        />
                        {item.unit_price < item.min_price && (
                          <div className="absolute -top-5 right-0 text-xs text-red-400 whitespace-nowrap">Below min!</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium">{fmt.currency(item.total_price)}</td>
                    <td className="py-2 pl-2">
                      <button onClick={() => removeItem(idx)} className="p-1 hover:bg-card rounded text-t2 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea className="input h-16 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes for this sale" />
        </div>
      </div>

      {/* Right: Summary */}
      <div className="space-y-4">
        <div className="card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Payment Summary</h3>

          <div className="space-y-2 text-sm border-b border-border pb-3">
            <div className="flex justify-between text-t2">
              <span>Subtotal</span><span className="text-white">{fmt.currency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-t2">
              <span>Discount</span>
              <input type="number" className="input w-28 text-right py-1 text-sm" value={discount} onChange={e => setDiscount(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex justify-between font-bold text-white text-base pt-1">
              <span>Total</span><span className="text-accent">{fmt.currency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="label">Amount Received</label>
              <input type="number" className="input" value={paid} onChange={e => setPaid(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-t2">Balance Due</span>
              <span className={balance > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{fmt.currency(Math.max(0, balance))}</span>
            </div>
            <div className="text-xs text-t2 text-center pt-1">
              Status: <span className={`badge-${balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid'}`}>{balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'}</span>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || items.length === 0} className="btn-primary w-full py-3 text-base">
            {saving ? 'Saving...' : '💾 Save & Invoice'}
          </button>
        </div>
      </div>

      {/* Inventory Picker */}
      {showInvPicker && (
        <Modal title="Select Tyre" onClose={() => { setShowInvPicker(false); setInvSearch('') }} size="lg">
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t2"><Search size={16} /></span>
              <input autoFocus className="input pl-9" placeholder="Search brand, size, pattern..." value={invSearch} onChange={e => setInvSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredInv.map(inv => (
                <button key={inv.id} onClick={() => addItem(inv)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-card transition-colors text-left">
                  <div>
                    <div className="font-medium text-white">{inv.brand} <span className="font-mono text-xs text-t2">{inv.size}</span></div>
                    <div className="text-xs text-t2">{inv.pattern} {inv.dot && `· DOT ${inv.dot}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-accent font-bold">{fmt.currency(inv.sell_price)}</div>
                    <div className="text-xs text-t2">{inv.quantity} in stock</div>
                  </div>
                </button>
              ))}
              {filteredInv.length === 0 && (
                <p className="text-center text-t2 py-6">No matching tyres in stock</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Sales Screen ─────────────────────────────────────────────────────────────
export default function SalesScreen() {
  const { isAdmin } = useApp()
  const [tab, setTab] = useState('new')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Sales</h1>
        <div className="flex gap-1 bg-card rounded-xl p-1">
          <button onClick={() => setTab('new')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'new' ? 'bg-brand-500 text-t2' : 'text-t2 hover:text-white'}`}>New Sale</button>
          <button onClick={() => setTab('list')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'list' ? 'bg-brand-500 text-t2' : 'text-t2 hover:text-white'}`}>All Sales</button>
        </div>
      </div>

      {tab === 'new' ? <NewSaleForm onDone={() => setTab('list')} /> : <SalesList onNewSale={() => setTab('new')} isAdmin={isAdmin} />}
    </div>
  )
}
