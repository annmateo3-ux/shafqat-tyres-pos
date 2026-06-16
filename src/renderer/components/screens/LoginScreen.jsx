import React, { useState } from 'react'
import { invoke } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import { Lock, User, Store, Eye, EyeOff } from '../ui/Icons.jsx'

export default function LoginScreen() {
  const { login, showToast } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await invoke('auth:login', form)
      if (res?.success) {
        login(res.user)
        showToast(`Welcome, ${res.user.name}!`)
      } else {
        showToast('Invalid username or password', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-500/25">
            <Store size={30} className="text-dark-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">Shafqat Tyres</h1>
          <p className="text-dark-300 text-sm mt-1">& Rim House — Kharian</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-2">Sign In</h2>

          <div>
            <label className="label">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><User size={16} /></span>
              <input
                type="text"
                className="input pl-9"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required autoFocus
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300"><Lock size={16} /></span>
              <input
                type={showPass ? 'text' : 'password'}
                className="input pl-9 pr-9"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-300 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-2.5">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-dark-400 text-xs mt-6">
          Default: admin / admin123 · staff / staff123
        </p>
      </div>
    </div>
  )
}
