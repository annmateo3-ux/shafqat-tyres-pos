import React, { useState, useEffect, useRef, useMemo } from 'react'
import { invoke, fmt, PAYMENT_STATUS } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Trash, Search, Printer, Eye, RefreshCw, X, ShoppingCart } from '../ui/Icons.jsx'

// ─── Invoice Print View ───────────────────────────────────────────────────────
function InvoicePrint({ sale, items, company }) {
  return (
    <div className="bg-white text-black p-8 min-h-screen" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold">{company?.name}</h1>
        <p className="text-gray-600">{company?.address}</p>
        <p className="text-gray-600">Phone: {company?.phone}</p>
        {company?.bank_name && (
          <p className="text-gray-600 text-sm mt-1">
            Bank: {company.bank_name} | A/C: {company.bank_account} | IBAN: {company.bank_iban}
          </p>
        )}
      </div>

      {/* Invoice Info */}
      <div className="flex justify-between mb-6">
        <div>
          <p><strong>Invoice:</strong> {sale.invoice_no}</p>
          <p><strong>Customer:</strong> {sale.customer_name}</p>
          {sale.vehicle_plate && <p><strong>Vehicle:</strong> {sale.vehicle_plate}</p>}
        </div>
        <div className="text-right">
          <p><strong>Date:</strong> {fmt.dateTime(sale.created_at)}</p>
          <p><strong>Status:</strong> {sale.payment_status?.toUpperCase()}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left">#</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Brand</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Size</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Pattern</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
            <th className="border border-gray-300 px-3 py-2 text-right">Unit Price</th>
            <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
              <td className="border border-gray-300 px-3 py-2">{item.brand}</td>
              <td className="border border-gray-300 px-3 py-2">{item.size}</td>
              <td className="border border-gray-300 px-3 py-2">{item.pattern}</td>
              <td className="border border-gray-300 px-3 py-2 text-center">{item.quantity}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">Rs {Number(item.unit_price).toLocaleString()}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">Rs {Number(item.total_price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <table className="text-right">
          <tbody>
            <tr><td className="px-4 py-1 text-gray-600">Subtotal:</td><td className="px-4 py-1 font-medium">Rs {Number(sale.subtotal).toLocaleString()}</td></tr>
            {sale.discount > 0 && <tr><td className="px-4 py-1 text-gray-600">Discount:</td><td className="px-4 py-1 text-red-600">- Rs {Number(sale.discount).toLocaleString()}</td></tr>}
            <tr className="border-t-2 border-gray-800 text-lg font-bold"><td className="px-4 py-2">Total:</td><td className="px-4 py-2">Rs {Number(sale.total).toLocaleString()}</td></tr>
            <tr><td className="px-4 py-1 text-gray-600">Paid:</td><td className="px-4 py-1 text-green-700">Rs {Number(sale.paid).toLocaleString()}</td></tr>
            {sale.balance > 0 && <tr><td className="px-4 py-1 text-gray-600">Balance Due:</td><td className="px-4 py-1 text-red-700 font-bold">Rs {Number(sale.balance).toLocaleString()}</td></tr>}
          </tbody>
        </table>
      </div>

      {sale.notes && (
        <div className="mt-6 pt-4 border-t border-gray-300">
          <p className="text-sm text-gray-600"><strong>Notes:</strong> {sale.notes}</p>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm border-t pt-4">
        <p>Thank you for your business!</p>
        <p>{company?.name} — {company?.phone}</p>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Search size={16} /></span>
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
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Invoice</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Customer</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Vehicle</th>
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Total</th>
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Paid</th>
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Balance</th>
                <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Date</th>
                <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="py-12 text-center text-dark-300">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="py-12 text-center text-dark-300">No sales found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3 font-mono text-xs text-brand-400">{s.invoice_no}</td>
                  <td className="px-4 py-3 text-white">{s.customer_name}</td>
                  <td className="px-4 py-3 text-dark-300 text-xs">{s.vehicle_plate || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt.currency(s.total)}</td>
                  <td className="px-4 py-3 text-right text-green-400">{fmt.currency(s.paid)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{s.balance > 0 ? fmt.currency(s.balance) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge-${s.payment_status}`}>{s.payment_status}</span>
                  </td>
                  <td className="px-4 py-3 text-dark-300 text-xs">{fmt.dateTime(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openSale(s)} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-brand-400 transition-colors">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-red-400 transition-colors">
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
          <div className="no-print flex items-center justify-end gap-2 px-6 py-3 border-b border-dark-600">
            <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
              <Printer size={16} />Print Invoice
            </button>
          </div>
          <div className="p-6">
            <InvoicePrint sale={viewSale} items={viewItems} company={company} />
          </div>
        </Modal>
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
            <div className="py-8 text-center text-dark-300">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items added yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="py-2 text-left text-xs text-dark-300 font-medium">Item</th>
                  <th className="py-2 text-center text-xs text-dark-300 font-medium w-20">Qty</th>
                  <th className="py-2 text-right text-xs text-dark-300 font-medium w-32">Unit Price</th>
                  <th className="py-2 text-right text-xs text-dark-300 font-medium w-32">Total</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-dark-700">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-white">{item.brand}</div>
                      <div className="text-xs text-dark-300">{item.size} {item.pattern && `· ${item.pattern}`}</div>
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
                      <button onClick={() => removeItem(idx)} className="p-1 hover:bg-dark-500 rounded text-dark-300 hover:text-red-400">
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

          <div className="space-y-2 text-sm border-b border-dark-600 pb-3">
            <div className="flex justify-between text-dark-300">
              <span>Subtotal</span><span className="text-white">{fmt.currency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-dark-300">
              <span>Discount</span>
              <input type="number" className="input w-28 text-right py-1 text-sm" value={discount} onChange={e => setDiscount(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex justify-between font-bold text-white text-base pt-1">
              <span>Total</span><span className="text-brand-400">{fmt.currency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="label">Amount Received</label>
              <input type="number" className="input" value={paid} onChange={e => setPaid(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-dark-300">Balance Due</span>
              <span className={balance > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{fmt.currency(Math.max(0, balance))}</span>
            </div>
            <div className="text-xs text-dark-300 text-center pt-1">
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Search size={16} /></span>
              <input autoFocus className="input pl-9" placeholder="Search brand, size, pattern..." value={invSearch} onChange={e => setInvSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredInv.map(inv => (
                <button key={inv.id} onClick={() => addItem(inv)} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-dark-600 transition-colors text-left">
                  <div>
                    <div className="font-medium text-white">{inv.brand} <span className="font-mono text-xs text-dark-300">{inv.size}</span></div>
                    <div className="text-xs text-dark-300">{inv.pattern} {inv.dot && `· DOT ${inv.dot}`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-brand-400 font-bold">{fmt.currency(inv.sell_price)}</div>
                    <div className="text-xs text-dark-300">{inv.quantity} in stock</div>
                  </div>
                </button>
              ))}
              {filteredInv.length === 0 && (
                <p className="text-center text-dark-300 py-6">No matching tyres in stock</p>
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
        <div className="flex gap-1 bg-dark-700 rounded-xl p-1">
          <button onClick={() => setTab('new')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'new' ? 'bg-brand-500 text-dark-900' : 'text-dark-300 hover:text-white'}`}>New Sale</button>
          <button onClick={() => setTab('list')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'list' ? 'bg-brand-500 text-dark-900' : 'text-dark-300 hover:text-white'}`}>All Sales</button>
        </div>
      </div>

      {tab === 'new' ? <NewSaleForm onDone={() => setTab('list')} /> : <SalesList onNewSale={() => setTab('new')} isAdmin={isAdmin} />}
    </div>
  )
}
