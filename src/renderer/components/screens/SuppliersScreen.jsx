import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Edit, Trash, Search, Eye, CreditCard, RefreshCw } from '../ui/Icons.jsx'

const EMPTY = { name: '', phone: '', city: '', address: '', notes: '' }

function SupplierForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { ...item } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Supplier name" /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="03..." /></div>
        <div><label className="label">City</label><input className="input" value={form.city} onChange={set('city')} placeholder="e.g. Karachi" /></div>
        <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={set('address')} /></div>
        <div className="col-span-2"><label className="label">Notes</label><textarea className="input h-16 resize-none" value={form.notes} onChange={set('notes')} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : item ? 'Update' : 'Add Supplier'}</button>
      </div>
    </div>
  )
}

function PaymentModal({ supplier, onClose, onDone }) {
  const { showToast } = useApp()
  const [payments, setPayments] = useState([])
  const [form, setForm] = useState({ amount: '', type: 'payment', notes: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    invoke('suppliers:payments', supplier.id).then(p => setPayments(p || []))
  }, [supplier.id])

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    await invoke('suppliers:addPayment', { supplier_id: supplier.id, amount: Number(form.amount), type: form.type, notes: form.notes, date: form.date })
    showToast(form.type === 'purchase' ? 'Purchase recorded' : 'Payment recorded')
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="space-y-5">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white">{supplier.name}</div>
          <div className="text-xs text-t2">{supplier.phone} · {supplier.city}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-t2">Amount Owed</div>
          <div className={`text-xl font-bold ${supplier.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt.currency(supplier.balance)}</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Record Transaction</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="payment">Payment (money paid to supplier)</option>
              <option value="purchase">Purchase (goods received)</option>
            </select>
          </div>
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div><label className="label">Amount (Rs)</label><input type="number" className="input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" /></div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Record'}</button>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Transaction History</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {payments.length === 0 ? <p className="text-t2 text-sm">No transactions yet</p> : payments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-card rounded-xl text-sm">
              <div>
                <div className={`font-medium ${p.type === 'purchase' ? 'text-red-400' : 'text-green-400'}`}>
                  {p.type === 'purchase' ? '+ Purchase' : '- Payment'} {fmt.currency(p.amount)}
                </div>
                {p.notes && <div className="text-xs text-t2">{p.notes}</div>}
              </div>
              <div className="text-t2 text-xs">{fmt.date(p.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SuppliersScreen() {
  const { isAdmin, showToast } = useApp()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [payItem, setPayItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await invoke('suppliers:list')
    setSuppliers(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers.filter(s => !q || [s.name, s.phone, s.city].some(f => f?.toLowerCase().includes(q)))
  }, [suppliers, search])

  const handleSave = async (data) => {
    if (editItem) { await invoke('suppliers:update', { id: editItem.id, ...data }); showToast('Supplier updated') }
    else { await invoke('suppliers:create', data); showToast('Supplier added') }
    setModal(null); setEditItem(null); load()
  }

  const handleDelete = async () => {
    await invoke('suppliers:delete', deleteId)
    showToast('Supplier deleted', 'error')
    setDeleteId(null); load()
  }

  const totalOwed = useMemo(() => suppliers.reduce((s, c) => s + (c.balance || 0), 0), [suppliers])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          <p className="text-t2 text-sm">{suppliers.length} suppliers · {fmt.currency(totalOwed)} owed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={16} /></button>
          {isAdmin && <button onClick={() => { setEditItem(null); setModal('form') }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Supplier</button>}
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t2"><Search size={16} /></span>
        <input className="input pl-9" placeholder="Search name, phone, city..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-xs text-t2 font-medium">City</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs text-t2 font-medium">Balance Owed</th>}
                <th className="px-4 py-3 text-center text-xs text-t2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-t2">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-t2">No suppliers found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-t2">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-t2">{s.city || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {s.balance > 0 ? <span className="text-red-400 font-bold">{fmt.currency(s.balance)}</span> : <span className="text-green-400 text-xs">Clear</span>}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setPayItem(s)} className="p-1.5 hover:bg-card rounded-lg text-t2 hover:text-accent transition-colors" title="Transactions"><Eye size={14} /></button>
                      <button onClick={() => { setEditItem(s); setModal('form') }} className="p-1.5 hover:bg-card rounded-lg text-t2 hover:text-accent transition-colors"><Edit size={14} /></button>
                      {isAdmin && <button onClick={() => setDeleteId(s.id)} className="p-1.5 hover:bg-card rounded-lg text-t2 hover:text-red-400 transition-colors"><Trash size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editItem ? 'Edit Supplier' : 'Add Supplier'} onClose={() => { setModal(null); setEditItem(null) }}>
          <SupplierForm item={editItem} onSave={handleSave} onClose={() => { setModal(null); setEditItem(null) }} />
        </Modal>
      )}

      {payItem && (
        <Modal title="Supplier Transactions" onClose={() => setPayItem(null)} size="lg">
          <PaymentModal supplier={payItem} onClose={() => setPayItem(null)} onDone={load} />
        </Modal>
      )}

      {deleteId && isAdmin && (
        <ConfirmDialog title="Delete Supplier?" message="This will remove the supplier. Linked inventory items will remain but lose the supplier link." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}
