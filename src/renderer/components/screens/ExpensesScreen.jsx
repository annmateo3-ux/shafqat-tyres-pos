import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt, EXPENSE_CATEGORIES } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Edit, Trash, Search, RefreshCw } from '../ui/Icons.jsx'

const EMPTY = { category: 'Fuel', description: '', amount: '', date: new Date().toISOString().split('T')[0] }

function ExpenseForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { ...item } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.amount || !form.category) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={set('category')}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={set('date')} />
        </div>
        <div className="col-span-2">
          <label className="label">Amount (Rs)</label>
          <input type="number" className="input" value={form.amount} onChange={set('amount')} placeholder="0" />
        </div>
        <div className="col-span-2">
          <label className="label">Description</label>
          <textarea className="input h-20 resize-none" value={form.description} onChange={set('description')} placeholder="Details..." />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.amount} className="btn-primary">{saving ? 'Saving...' : item ? 'Update' : 'Add Expense'}</button>
      </div>
    </div>
  )
}

export default function ExpensesScreen() {
  const { isAdmin, user, showToast } = useApp()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await invoke('expenses:list', {})
    setExpenses(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return expenses.filter(e => {
      const matchSearch = !q || [e.category, e.description].some(f => f?.toLowerCase().includes(q))
      const matchCat = !filterCat || e.category === filterCat
      return matchSearch && matchCat
    })
  }, [expenses, search, filterCat])

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered])

  const handleSave = async (data) => {
    if (editItem) {
      await invoke('expenses:update', { id: editItem.id, ...data })
      showToast('Expense updated')
    } else {
      await invoke('expenses:create', { ...data, created_by: user?.id })
      showToast('Expense added')
    }
    setModal(null); setEditItem(null); load()
  }

  const handleDelete = async () => {
    await invoke('expenses:delete', deleteId)
    showToast('Expense deleted', 'error')
    setDeleteId(null); load()
  }

  const catTotals = useMemo(() => {
    const map = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [expenses])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-dark-300 text-sm">Total: {fmt.currency(total)} ({filtered.length} records)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={16} /></button>
          <button onClick={() => { setEditItem(null); setModal('form') }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Expense</button>
        </div>
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wide mb-3">By Category</h3>
          <div className="flex flex-wrap gap-2">
            {catTotals.map(([cat, total]) => (
              <button
                key={cat}
                onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterCat === cat ? 'bg-brand-500 text-dark-900' : 'bg-dark-600 text-dark-200 hover:bg-dark-500'}`}
              >
                {cat}: {fmt.currency(total)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Search size={16} /></span>
          <input className="input pl-9" placeholder="Search category, description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filterCat && <button onClick={() => setFilterCat('')} className="btn-ghost text-sm">Clear filter</button>}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Date</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Category</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Description</th>
                <th className="px-4 py-3 text-right text-xs text-dark-300 font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Added By</th>
                <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-12 text-center text-dark-300">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-12 text-center text-dark-300">No expenses found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="table-row">
                  <td className="px-4 py-3 text-dark-300 text-xs">{fmt.date(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-dark-600 text-dark-200 text-xs px-2 py-0.5 rounded-full">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-dark-200">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-400">{fmt.currency(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-dark-300">{e.created_by_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditItem(e); setModal('form') }} className="action-btn" title="Edit"><Edit size={15} /></button>
                      {isAdmin && <button onClick={() => setDeleteId(e.id)} className="action-btn" title="Delete"><Trash size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editItem ? 'Edit Expense' : 'Add Expense'} onClose={() => { setModal(null); setEditItem(null) }}>
          <ExpenseForm item={editItem} onSave={handleSave} onClose={() => { setModal(null); setEditItem(null) }} />
        </Modal>
      )}

      {deleteId && isAdmin && (
        <ConfirmDialog title="Delete Expense?" message="This expense record will be removed permanently." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}
