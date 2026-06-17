import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'

const today = new Date().toISOString().split('T')[0]

function NewPurchaseForm({ suppliers, inventory, onSave, onClose }) {
  const { showToast } = useApp()
  const [supplier_id, setSupplierId] = useState('')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const filteredInv = useMemo(() => {
    const q = search.toLowerCase()
    return inventory.filter(i => !q || [i.brand, i.size, i.pattern].some(f => f?.toLowerCase().includes(q)))
  }, [inventory, search])

  const addItem = (inv) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.inventory_id === inv.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing].quantity += 1
        updated[existing].total_price = updated[existing].quantity * updated[existing].cost_price
        return updated
      }
      return [...prev, {
        inventory_id: inv.id, brand: inv.brand, size: inv.size, pattern: inv.pattern || '',
        quantity: 1, cost_price: inv.cost_price, total_price: inv.cost_price,
      }]
    })
    setShowPicker(false)
    setSearch('')
  }

  const updateItem = (idx, key, val) => {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [key]: Number(val) }
      updated[idx].total_price = updated[idx].quantity * updated[idx].cost_price
      return updated
    })
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const total = items.reduce((s, i) => s + i.total_price, 0)

  const handleSave = async () => {
    if (items.length === 0) { showToast('Add at least one item', 'error'); return }
    setSaving(true)
    const res = await invoke('purchases:create', {
      supplier_id: supplier_id || null,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity), cost_price: Number(i.cost_price), total_price: Number(i.total_price) })),
      notes, date,
    })
    setSaving(false)
    if (res?.success) { showToast('Purchase recorded'); onSave() }
    else showToast('Failed to save', 'error')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={supplier_id} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— Select Supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Items ({items.length})</span>
            <button onClick={() => setShowPicker(true)} className="btn-primary" style={{ fontSize: '13px', padding: '6px 14px' }}>+ Add Item</button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#4a4a6a' }}>No items added yet</div>
          ) : (
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#6b7280', fontSize: '11px', fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '8px', textAlign: 'center', color: '#6b7280', fontSize: '11px', fontWeight: 600, width: '70px' }}>Qty</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#6b7280', fontSize: '11px', fontWeight: 600, width: '120px' }}>Cost Price</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#6b7280', fontSize: '11px', fontWeight: 600, width: '120px' }}>Total</th>
                  <th style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{item.brand}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.size} {item.pattern && `· ${item.pattern}`}</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <input type="number" min="1" className="input" style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                        value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" className="input" style={{ textAlign: 'right', padding: '4px' }}
                        value={item.cost_price} onChange={e => updateItem(idx, 'cost_price', e.target.value)} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'white' }}>{fmt.currency(item.total_price)}</td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color='#6b7280'}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showPicker && (
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3d', borderRadius: '16px', padding: '16px' }}>
            <input autoFocus className="input" placeholder="Search brand, size..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '10px' }} />
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredInv.map(inv => (
                <button key={inv.id} onClick={() => addItem(inv)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'none',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#1e1e2e'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '13px' }}>{inv.brand} <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '11px' }}>{inv.size}</span></div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{inv.pattern}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '13px' }}>{fmt.currency(inv.cost_price)}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{inv.quantity} in stock</div>
                  </div>
                </button>
              ))}
              {filteredInv.length === 0 && <p style={{ color: '#4a4a6a', textAlign: 'center', padding: '20px' }}>No items found</p>}
            </div>
            <button onClick={() => setShowPicker(false)} className="btn-secondary" style={{ marginTop: '10px', width: '100%', fontSize: '13px' }}>Close</button>
          </div>
        )}
      </div>

      <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Summary</h3>
        <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Items</span>
            <span style={{ color: 'white' }}>{items.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#6b7280' }}>Supplier</span>
            <span style={{ color: 'white' }}>{suppliers.find(s => s.id === Number(supplier_id))?.name || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #1e1e2e', paddingTop: '12px', marginTop: '8px' }}>
            <span style={{ color: '#6b7280' }}>Total</span>
            <span style={{ color: '#ef4444' }}>{fmt.currency(total)}</span>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || items.length === 0} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
          {saving ? 'Saving...' : '💾 Record Purchase'}
        </button>
        <button onClick={onClose} className="btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function PurchasesScreen() {
  const { isAdmin, showToast } = useApp()
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [viewPurchase, setViewPurchase] = useState(null)

  const load = async () => {
    setLoading(true)
    const [p, s, inv] = await Promise.all([
      invoke('purchases:list'),
      invoke('suppliers:list'),
      invoke('inventory:list'),
    ])
    setPurchases(p || [])
    setSuppliers(s || [])
    setInventory(inv || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    await invoke('purchases:delete', deleteId)
    showToast('Purchase deleted', 'error')
    setDeleteId(null)
    load()
  }

  const totalSpent = useMemo(() => purchases.reduce((s, p) => s + (p.total || 0), 0), [purchases])

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>Purchases</h1>
          <p style={{ fontSize: '13px', color: '#4a4a6a', marginTop: '2px' }}>{purchases.length} records · {fmt.currency(totalSpent)} total spent</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          + New Purchase
        </button>
      </div>

      <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a2a' }}>
                {['#', 'Supplier', 'Date', 'Items', 'Total', 'Notes', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Total' ? 'right' : 'left', fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4a4a6a' }}>Loading...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#4a4a6a' }}>No purchases yet</td></tr>
              ) : purchases.map((p, idx) => (
                <tr key={p.id} className="table-row">
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#ef4444' }}>#{p.id}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'white' }}>{p.supplier_name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>{fmt.date(p.date)}</td>
                  <td style={{ padding: '12px 16px' }}>{p.items?.length || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{fmt.currency(p.total)}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{p.notes || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => setViewPurchase(p)} className="action-btn" title="View">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleteId(p.id)} className="action-btn" title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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

      {modal && (
        <Modal title="New Purchase" onClose={() => setModal(false)} size="full">
          <NewPurchaseForm
            suppliers={suppliers}
            inventory={inventory}
            onSave={() => { setModal(false); load() }}
            onClose={() => setModal(false)}
          />
        </Modal>
      )}

      {viewPurchase && (
        <Modal title={`Purchase #${viewPurchase.id}`} onClose={() => setViewPurchase(null)} size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#1a1a2a', borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Supplier</div>
                <div style={{ fontWeight: 600, color: 'white' }}>{viewPurchase.supplier_name || '—'}</div>
              </div>
              <div style={{ background: '#1a1a2a', borderRadius: '12px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Date</div>
                <div style={{ fontWeight: 600, color: 'white' }}>{fmt.date(viewPurchase.date)}</div>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Brand', 'Size', 'Pattern', 'Qty', 'Cost Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Qty' || h === 'Cost Price' || h === 'Total' ? 'right' : 'left', fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viewPurchase.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'white' }}>{item.brand}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '11px' }}>{item.size}</td>
                    <td style={{ padding: '8px 12px' }}>{item.pattern || '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt.currency(item.cost_price)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{fmt.currency(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '16px', fontWeight: 700, color: 'white', borderTop: '1px solid #1e1e2e', paddingTop: '12px' }}>
              Total: <span style={{ color: '#ef4444', marginLeft: '12px' }}>{fmt.currency(viewPurchase.total)}</span>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && isAdmin && (
        <ConfirmDialog
          title="Delete Purchase?"
          message="This will reverse inventory quantities and supplier balance."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}