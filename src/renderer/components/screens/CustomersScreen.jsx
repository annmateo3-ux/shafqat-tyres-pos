import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Edit, Trash, Search, Eye, CreditCard, RefreshCw, ArrowLeft } from '../ui/Icons.jsx'

const EMPTY = { name: '', phone: '', vehicle_plate: '', address: '', notes: '' }

function CustomerForm({ item, onSave, onClose }) {
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
        <div className="col-span-2"><label className="label">Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Customer name" /></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+92..." /></div>
        <div><label className="label">Vehicle Plate</label><input className="input" value={form.vehicle_plate} onChange={set('vehicle_plate')} placeholder="e.g. LMN-1234" /></div>
        <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={set('address')} placeholder="Optional address" /></div>
        <div className="col-span-2"><label className="label">Notes</label><textarea className="input h-16 resize-none" value={form.notes} onChange={set('notes')} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">{saving ? 'Saving...' : item ? 'Update' : 'Add Customer'}</button>
      </div>
    </div>
  )
}

function PaymentModal({ customer, onClose, onDone }) {
  const { showToast } = useApp()
  const [payments, setPayments] = useState([])
  const [form, setForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    invoke('customers:payments', customer.id).then(p => setPayments(p || []))
  }, [customer.id])

  const handlePay = async () => {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    await invoke('customers:addPayment', { customer_id: customer.id, amount: Number(form.amount), notes: form.notes, date: form.date })
    showToast('Payment recorded')
    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="space-y-5">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-white">{customer.name}</div>
          <div className="text-xs text-dark-300">{customer.phone}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-dark-300">Outstanding Balance</div>
          <div className="text-xl font-bold text-red-400">{fmt.currency(customer.balance)}</div>
        </div>
      </div>

      {customer.balance > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Record Payment</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Amount (Rs)</label><input type="number" className="input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="col-span-2"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <button onClick={handlePay} disabled={saving} className="btn-primary w-full">{saving ? 'Saving...' : 'Record Payment'}</button>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Payment History</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {payments.length === 0 ? <p className="text-dark-300 text-sm">No payments yet</p> : payments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-dark-600 rounded-xl text-sm">
              <div>
                <div className="text-green-400 font-medium">{fmt.currency(p.amount)}</div>
                {p.notes && <div className="text-xs text-dark-300">{p.notes}</div>}
              </div>
              <div className="text-dark-300 text-xs">{fmt.date(p.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CustomersScreen() {
  const { isAdmin, showToast } = useApp()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [payItem, setPayItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await invoke('customers:list')
    setCustomers(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return customers.filter(c => !q || [c.name, c.phone, c.vehicle_plate].some(f => f?.toLowerCase().includes(q)))
  }, [customers, search])

  const handleSave = async (data) => {
    if (editItem) { await invoke('customers:update', { id: editItem.id, ...data }); showToast('Customer updated') }
    else { await invoke('customers:create', data); showToast('Customer added') }
    setModal(null); setEditItem(null); load()
  }

  const handleDelete = async () => {
    await invoke('customers:delete', deleteId)
    showToast('Customer deleted', 'error')
    setDeleteId(null); load()
  }

  const totalDue = useMemo(() => customers.reduce((s, c) => s + (c.balance || 0), 0), [customers])

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-dark-300 text-sm">{customers.length} customers · {fmt.currency(totalDue)} total due</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={16} /></button>
          <button onClick={() => { setEditItem(null); setModal('form') }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Customer</button>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Search size={16} /></span>
        <input className="input pl-9" placeholder="Search name, phone, vehicle plate..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Vehicle</th>
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Balance Due</th>
                <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="py-12 text-center text-dark-300">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="py-12 text-center text-dark-300">No customers found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3">{c.phone || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.vehicle_plate || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {c.balance > 0 ? <span className="text-red-400 font-bold">{fmt.currency(c.balance)}</span> : <span className="text-green-400 text-xs">Clear</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {c.balance > 0 && (
                        <button onClick={() => setPayItem(c)} className="action-btn" title="Record payment">
                          <CreditCard size={15} />
                        </button>
                      )}
                      <button onClick={() => setPayItem(c)} className="action-btn" title="View payments"><Eye size={15} /></button>
                      <button onClick={() => { setEditItem(c); setModal('form') }} className="action-btn" title="Edit"><Edit size={15} /></button>
                      {isAdmin && <button onClick={() => setDeleteId(c.id)} className="action-btn" title="Delete"><Trash size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editItem ? 'Edit Customer' : 'Add Customer'} onClose={() => { setModal(null); setEditItem(null) }}>
          <CustomerForm item={editItem} onSave={handleSave} onClose={() => { setModal(null); setEditItem(null) }} />
        </Modal>
      )}

      {payItem && (
        <Modal title="Customer Payments" onClose={() => setPayItem(null)} size="lg">
          <PaymentModal customer={payItem} onClose={() => setPayItem(null)} onDone={load} />
        </Modal>
      )}

      {deleteId && isAdmin && (
        <ConfirmDialog title="Delete Customer?" message="All customer data will be removed permanently." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}
