import React, { useState, useEffect } from 'react'
import { invoke } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'

function TyreLogo({ size = 64, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={spin ? 'animate-spin-slow' : ''}>
      <circle cx="32" cy="32" r="30" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.3"/>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#ef4444" strokeWidth="4"/>
      <circle cx="32" cy="32" r="10" fill="#ef4444" opacity="0.2"/>
      <circle cx="32" cy="32" r="6" fill="#ef4444"/>
      {[0,60,120,180,240,300].map(a => {
        const r = a * Math.PI / 180
        const x1 = 32 + 10 * Math.cos(r), y1 = 32 + 10 * Math.sin(r)
        const x2 = 32 + 21 * Math.cos(r), y2 = 32 + 21 * Math.sin(r)
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
      })}
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = a * Math.PI / 180
        const x = 32 + 27 * Math.cos(r), y = 32 + 27 * Math.sin(r)
        return <rect key={a} x={x-2} y={y-4} width="4" height="8" rx="2" fill="#ef4444" opacity="0.6"
          transform={`rotate(${a}, ${x}, ${y})`}/>
      })}
    </svg>
  )
}

export default function LoginScreen() {
  const { login, showToast } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 100) }, [])

  const addRipple = (e) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`
    ripple.className = 'ripple'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    addRipple(e)
    setLoading(true)
    try {
      const res = await invoke('auth:login', form)
      if (res?.success) { login(res.user); showToast(`Welcome, ${res.user.name}!`) }
      else showToast('Invalid username or password', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#080810' }}>
      {/* Left — tyre background */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a0505 100%)' }}>
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute animate-spin-slow" style={{
              width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
              border: '2px solid #ef4444', borderRadius: '50%',
              top: '50%', left: '50%',
              transform: `translate(-50%, -50%)`,
              animationDuration: `${8 + i * 4}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }} />
          ))}
        </div>
        <div className="relative z-10 text-center" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease' }}>
          <div className="flex justify-center mb-6">
            <div style={{ filter: 'drop-shadow(0 0 40px rgba(239,68,68,0.4))' }}>
              <TyreLogo size={160} spin={true} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Shafqat Tyres</h1>
          <p className="text-red-400 text-lg font-medium">& Rim House</p>
          <p className="text-gray-600 text-sm mt-2">Main GT Road Kharian</p>
          <div className="mt-8 flex items-center gap-3 justify-center">
            {['Inventory', 'Sales', 'Reports', 'Analytics'].map((t, i) => (
              <span key={t} className="text-xs px-3 py-1 rounded-full border border-red-500/20 text-red-400/60"
                style={{ animationDelay: `${i * 0.1}s` }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="w-full lg:w-[420px] flex items-center justify-center p-8"
        style={{ background: '#0a0a12', borderLeft: '1px solid #1e1e2e' }}>
        <div className="w-full max-w-sm" style={{
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s'
        }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #1a0505, #2d0808)', border: '1px solid #ef444430', boxShadow: '0 0 30px rgba(239,68,68,0.15)' }}>
              <TyreLogo size={36} />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-gray-600 text-sm mt-1">Sign in to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input type="text" className="input pl-9" placeholder="Enter username"
                  value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required autoFocus />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type={showPass ? 'text' : 'password'} className="input pl-9 pr-10" placeholder="Enter password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" disabled={loading}
              onClick={addRipple}
              className="ripple-btn w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 active:scale-95 mt-2"
              style={{ background: loading ? '#991b1b' : 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  Signing in...
                </span>
              ) : 'SIGN IN'}
            </button>
          </form>

          <p className="text-center text-gray-700 text-xs mt-8">
            admin / admin123 · staff / staff123
          </p>
          <p className="text-center text-gray-800 text-xs mt-2">
            © 2026 Shafqat Tyres & Rim House
          </p>
        </div>
      </div>
    </div>
  )
}
