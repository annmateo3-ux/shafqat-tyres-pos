import React, { useState, useEffect } from 'react'
import { invoke } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import Modal from '../ui/Modal.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import { Plus, Edit, Trash, Eye, EyeOff, User } from '../ui/Icons.jsx'

function CompanySettings() {
  const { showToast } = useApp()
  const [form, setForm] = useState({ name: '', address: '', phone: '', bank_name: '', bank_account: '', bank_iban: '' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    invoke('company:get').then(r => { if (r) setForm(r) })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await invoke('company:update', form)
    showToast('Company info updated')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Company Information</h2>
      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Company Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div className="col-span-2"><label className="label">Address</label><input className="input" value={form.address} onChange={set('address')} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">Bank Name</label><input className="input" value={form.bank_name} onChange={set('bank_name')} /></div>
          <div><label className="label">Account Number</label><input className="input font-mono" value={form.bank_account} onChange={set('bank_account')} /></div>
          <div><label className="label">IBAN</label><input className="input font-mono" value={form.bank_iban} onChange={set('bank_iban')} /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  )
}

const USER_EMPTY = { username: '', password: '', role: 'staff', name: '', active: 1 }

function UserForm({ item, onSave, onClose }) {
  const [form, setForm] = useState(item ? { ...item, password: '' } : USER_EMPTY)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.username || !form.name) return
    if (!item && !form.password) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Full name" /></div>
        <div><label className="label">Username *</label><input className="input" value={form.username} onChange={set('username')} placeholder="login username" /></div>
        <div>
          <label className="label">Password {item ? '(leave blank to keep)' : '*'}</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className="input pr-9" value={form.password} onChange={set('password')} placeholder={item ? 'New password (optional)' : 'Set password'} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white">
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="admin">Admin (Full Access)</option>
            <option value="staff">Staff (Limited Access)</option>
          </select>
        </div>
        {item && (
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.active} onChange={e => setForm(p => ({ ...p, active: Number(e.target.value) }))}>
              <option value={1}>Active</option>
              <option value={0}>Disabled</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-dark-600/50 rounded-xl p-3 text-xs text-dark-300 space-y-1">
        <div className="font-medium text-dark-200 mb-1">Role Permissions:</div>
        <div><span className="text-brand-400">Admin:</span> Full access — inventory values, cost prices, delete, reports, settings, user management</div>
        <div><span className="text-dark-300">Staff:</span> Sales, view inventory (no costs), customers, suppliers, expenses — no delete, no reports</div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.username || !form.name || (!item && !form.password)} className="btn-primary">
          {saving ? 'Saving...' : item ? 'Update User' : 'Create User'}
        </button>
      </div>
    </div>
  )
}

function UsersSettings() {
  const { showToast, user: currentUser } = useApp()
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const load = () => invoke('users:list').then(r => setUsers(r || []))
  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    if (editItem) { await invoke('users:update', { id: editItem.id, ...data }); showToast('User updated') }
    else { 
      const r = await invoke('users:create', data)
      if (r?.success) showToast('User created')
      else showToast(r?.error || 'Failed to create user', 'error')
    }
    setModal(null); setEditItem(null); load()
  }

  const handleDelete = async () => {
    if (deleteId === currentUser?.id) { showToast("Can't delete your own account", 'error'); setDeleteId(null); return }
    await invoke('users:delete', deleteId)
    showToast('User deleted', 'error')
    setDeleteId(null); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">User Management</h2>
        <button onClick={() => { setEditItem(null); setModal('form') }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add User</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Username</th>
              <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Role</th>
              <th className="px-4 py-3 text-left text-xs text-dark-300 font-medium">Status</th>
              <th className="px-4 py-3 text-center text-xs text-dark-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="table-row">
                <td className="px-4 py-3 font-medium text-white">
                  {u.name} {u.id === currentUser?.id && <span className="text-xs text-brand-400">(you)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-dark-300 text-xs">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-500 text-dark-200'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.active ? 'text-green-400' : 'text-red-400'}`}>{u.active ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => { setEditItem(u); setModal('form') }} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-brand-400 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => setDeleteId(u.id)} disabled={u.id === currentUser?.id} className="p-1.5 hover:bg-dark-500 rounded-lg text-dark-300 hover:text-red-400 transition-colors disabled:opacity-30"><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={editItem ? 'Edit User' : 'Create User'} onClose={() => { setModal(null); setEditItem(null) }}>
          <UserForm item={editItem} onSave={handleSave} onClose={() => { setModal(null); setEditItem(null) }} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete User?" message="This user will no longer be able to log in." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  )
}

export default function SettingsScreen() {
  const [tab, setTab] = useState('company')

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="flex gap-1 bg-dark-700 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('company')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'company' ? 'bg-brand-500 text-dark-900' : 'text-dark-300 hover:text-white'}`}>Company</button>
        <button onClick={() => setTab('users')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'users' ? 'bg-brand-500 text-dark-900' : 'text-dark-300 hover:text-white'}`}>Users</button>
      </div>
      {tab === 'company' ? <CompanySettings /> : <UsersSettings />}
    </div>
  )
}
