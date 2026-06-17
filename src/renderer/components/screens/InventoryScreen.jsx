import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Edit, Trash, Search, AlertTriangle, Package, RefreshCw } from '../ui/Icons.jsx'

const EMPTY = { brand:'', size:'', pattern:'', dot:'', cost_price:'', sell_price:'', min_price:'', quantity:'', supplier_id:'', notes:'', category:'Tyre' }

function InventoryForm({ item, suppliers, onSave, onClose, isAdmin }) {
  const [form, setForm] = useState(item ? { ...item } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.brand || !form.size) return
    setSaving(true)
    const data = {
      ...form,
      cost_price: Number(form.cost_price),
      sell_price: Number(form.sell_price),
      min_price: Number(form.min_price),
      quantity: Number(form.quantity),
      supplier_id: form.supplier_id || null,
      category: form.category || 'Tyre',
    }
    await onSave(data)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Brand *</label>
          <input className="input" value={form.brand} onChange={set('brand')} placeholder="e.g. Bridgestone" />
        </div>
        <div>
          <label className="label">Size *</label>
          <input className="input" value={form.size} onChange={set('size')} placeholder="e.g. 195.65R15" />
        </div>
        <div>
          <label className="label">Pattern</label>
          <input className="input" value={form.pattern} onChange={set('pattern')} placeholder="e.g. Techno" />
        </div>
        <div>
          <label className="label">DOT</label>
          <input className="input" value={form.dot} onChange={set('dot')} placeholder="e.g. 2025" />
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-dark-600/50 rounded-xl border border-dark-500">
          <div>
            <label className="label">Cost Price (Rs)</label>
            <input className="input" type="number" value={form.cost_price} onChange={set('cost_price')} placeholder="0" />
          </div>
          <div>
            <label className="label">Sell Price (Rs)</label>
            <input className="input" type="number" value={form.sell_price} onChange={set('sell_price')} placeholder="0" />
          </div>
          <div>
            <label className="label">Min Price (Rs)</label>
            <input className="input" type="number" value={form.min_price} onChange={set('min_price')} placeholder="0" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Quantity</label>
          <input className="input" type="number" value={form.quantity} onChange={set('quantity')} placeholder="0" />
        </div>
        <div>
          <label className="label">Supplier</label>
          <select className="input" value={form.supplier_id || ''} onChange={set('supplier_id')}>
            <option value="">— None —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            <option value="Tyre">Tyre</option>
            <option value="Rim">Rim</option>
            <option value="Tube">Tube</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input h-16 resize-none" value={form.notes} onChange={set('notes')} placeholder="Optional notes" />
        </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.brand || !form.size} className="btn-primary">
          {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </div>
  )
}

export default function InventoryScreen() {
  const { isAdmin, showToast } = useApp()
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterLow, setFilterLow] = useState(false)
  const [activeTab, setActiveTab] = useState('Tyre')
  const [modal, setModal] = useState(null) // null | 'add' | 'edit'
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    const [inv, sup] = await Promise.all([invoke('inventory:list'), invoke('suppliers:list')])
    setItems(inv || [])
    setSuppliers(sup || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const brands = useMemo(() => [...new Set(items.map(i => i.brand))].sort(), [items])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(i => {
      const matchSearch = !q || [i.brand, i.size, i.pattern, i.dot, i.supplier_name].some(f => f?.toLowerCase().includes(q))
      const matchBrand = !filterBrand || i.brand === filterBrand
      const matchLow = !filterLow || i.quantity <= 3
      const matchTab = (i.category || 'Tyre') === activeTab
      return matchSearch && matchBrand && matchLow && matchTab
    })
  }, [items, search, filterBrand, filterLow, activeTab])

  const handleSave = async (data) => {
    if (editItem) {
      await invoke('inventory:update', { id: editItem.id, ...data })
      showToast('Item updated')
    } else {
      await invoke('inventory:create', data)
      showToast('Item added')
    }
    setModal(null)
    setEditItem(null)
    load()
  }

  const handleDelete = async () => {
    await invoke('inventory:delete', deleteId)
    showToast('Item deleted', 'error')
    setDeleteId(null)
    load()
  }

  const totalValue = useMemo(() => items.reduce((s, i) => s + (i.cost_price * i.quantity), 0), [items])
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const lowCount = useMemo(() => items.filter(i => i.quantity <= 3).length, [items])

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-dark-300 text-sm">{filtered.length} items · {totalQty} total in stock</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={16} /></button>
          {isAdmin && (
            <button onClick={() => { setEditItem(null); setModal('add') }} className="btn-primary flex items-center gap-2">
              <Plus size={16} />Add Stock
            </button>
          )}
        </div>
      </div>

      {/* Summary (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/15 rounded-xl text-blue-400"><Package size={18} /></div>
            <div>
              <div className="text-xs text-dark-300">Total Stock Value</div>
              <div className="font-bold text-white">{fmt.currency(totalValue)}</div>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-500/15 rounded-xl text-brand-400"><Package size={18} /></div>
            <div>
              <div className="text-xs text-dark-300">Total Tyres</div>
              <div className="font-bold text-white">{fmt.number(totalQty)}</div>
            </div>
          </div>
          {lowCount > 0 && (
            <div className="card p-4 flex items-center gap-3 border-red-500/30 cursor-pointer" onClick={() => setFilterLow(true)}>
              <div className="p-2 bg-red-500/15 rounded-xl text-red-400 animate-pulse-soft"><AlertTriangle size={18} /></div>
              <div>
                <div className="text-xs text-dark-300">Low Stock</div>
                <div className="font-bold text-red-400">{lowCount} items</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {['Tyre', 'Rim', 'Tube', 'Other'].map(tab => {
          const count = items.filter(i => (i.category || 'Tyre') === tab).length
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '7px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
              background: activeTab === tab ? '#ef4444' : '#1e1e2e',
              color: activeTab === tab ? 'white' : '#6b7280',
            }}>
              {tab} <span style={{ opacity: 0.7, fontSize: '11px' }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Search size={16} /></span>
          <input className="input pl-9" placeholder="Search brand, size, pattern..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="">All Brands</option>
          {brands.map(b => <option key={b}>{b}</option>)}
        </select>
        <button
          onClick={() => setFilterLow(p => !p)}
          className={`btn-secondary flex items-center gap-2 text-sm ${filterLow ? 'border-red-500/50 text-red-400' : ''}`}
        >
          <AlertTriangle size={14} />Low Stock {filterLow ? '✓' : ''}
        </button>
        {(search || filterBrand || filterLow) && (
          <button onClick={() => { setSearch(''); setFilterBrand(''); setFilterLow(false) }} className="btn-ghost text-sm">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Brand / Size</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Category</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Pattern</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">DOT</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Cost</th>}
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Sell Price</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Min Price</th>}
                <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Qty</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Supplier</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="py-12 text-center text-dark-300">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="py-12 text-center text-dark-300">No items found</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={`table-row ${item.quantity <= 3 ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.brand}</div>
                    <div className="text-xs text-dark-300 font-mono">{item.size}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      background: item.category==='Rim' ? '#3b82f620' : item.category==='Tube' ? '#22c55e20' : item.category==='Other' ? '#f59e0b20' : '#ef444420',
                      color: item.category==='Rim' ? '#3b82f6' : item.category==='Tube' ? '#22c55e' : item.category==='Other' ? '#f59e0b' : '#ef4444',
                    }}>{item.category || 'Tyre'}</span>
                  </td>
                  <td className="px-4 py-3 text-dark-200">{item.pattern || '—'}</td>
                  <td className="px-4 py-3 text-dark-200 font-mono text-xs">{item.dot || '—'}</td>
                  {isAdmin && <td className="px-4 py-3 text-right text-dark-300 text-xs">{fmt.currency(item.cost_price)}</td>}
                  <td className="px-4 py-3 text-right font-medium text-brand-400">{fmt.currency(item.sell_price)}</td>
                  {isAdmin && <td className="px-4 py-3 text-right text-xs text-dark-300">{fmt.currency(item.min_price)}</td>}
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-base ${item.quantity <= 3 ? 'text-red-400' : item.quantity <= 8 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {item.quantity}
                    </span>
                    {item.quantity <= 3 && <AlertTriangle size={12} className="inline ml-1 text-red-400" />}
                  </td>
                  <td className="px-4 py-3 text-dark-200 text-xs">{item.supplier_name || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditItem(item); setModal('edit') }} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-brand-400 transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-red-400 transition-colors">
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <Modal title={modal === 'edit' ? 'Edit Stock Item' : 'Add Stock Item'} onClose={() => { setModal(null); setEditItem(null) }} size="lg">
          <InventoryForm item={editItem} suppliers={suppliers} onSave={handleSave} onClose={() => { setModal(null); setEditItem(null) }} isAdmin={isAdmin} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Item?"
          message="This will permanently remove this inventory item. Stock counts will not be adjusted."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
