import React, { useState, useEffect } from 'react'
import { invoke } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'

export default function LoginScreen() {
  const { login, showToast } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userFocus, setUserFocus] = useState(false)
  const [passFocus, setPassFocus] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
    const saved = localStorage.getItem('saved_username')
    if (saved) { setForm(p => ({ ...p, username: saved })); setRemember(true) }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await invoke('auth:login', form)
      if (res?.success) {
        if (remember) localStorage.setItem('saved_username', form.username)
        else localStorage.removeItem('saved_username')
        login(res.user)
        showToast(`Welcome, ${res.user.name}!`)
      } else {
        showToast('Invalid username or password', 'error')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif",
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>

      {/* ══════════════════════════════
          LEFT PANEL — 62%
      ══════════════════════════════ */}
      <div style={{
        width: '62%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 36px 28px 36px',
      }}>
        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('./background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }} />

        {/* Wheel image */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-35%, -52%)',
          width: '72%',
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          <img src="./wheel-tyres.png" alt=""
            style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(100deg, rgba(5,7,11,0.95) 0%, rgba(5,7,11,0.80) 28%, rgba(5,7,11,0.35) 58%, rgba(5,7,11,0.08) 100%)',
          zIndex: 2,
        }} />

        {/* TOP BRANDING */}
        <div style={{ position: 'relative', zIndex: 3 }}>

          {/* Logo icon + SHAFQAT text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {/* Just the red circle part of the logo */}
            <div style={{ width: '52px', height: '52px', flexShrink: 0, overflow: 'hidden' }}>
              <img src="./logo.png" alt="Logo"
                style={{
                  height: '52px',
                  width: 'auto',
                  display: 'block',
                  marginLeft: '-4px',
                }}
              />
            </div>
            {/* Company name text */}
            <div>
              <div style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.07em',
                lineHeight: 1,
                textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)',
              }}>SHAFQAT</div>
              <div style={{
                fontSize: '9.5px',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
                marginTop: '3px',
                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
              }}>TYRES &amp; RIMS HOUSE</div>
            </div>
          </div>

          {/* Authorized */}
          <div style={{
            fontSize: '9.5px',
            color: 'rgba(255,255,255,0.42)',
            textTransform: 'uppercase',
            letterSpacing: '0.26em',
            marginBottom: '7px',
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>AUTHORIZED</div>

          {/* Bridgestone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
            <div style={{
              width: '22px', height: '22px',
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}>
              <span style={{ color: '#111', fontSize: '14px', fontWeight: 900, fontStyle: 'italic', lineHeight: 1 }}>B</span>
            </div>
            <div style={{
              fontSize: '21px', fontWeight: 900, fontStyle: 'italic',
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.03em',
              textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            }}>RIDGESTONE</div>
          </div>

          <div style={{
            fontSize: '9px',
            color: 'rgba(255,255,255,0.32)',
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>WHOLESALER &amp; RETAILER</div>
        </div>

        {/* BOTTOM: Feature icons */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', gap: '22px' }}>
          {[
            { label: 'Inventory\nManagement', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> },
            { label: 'Tyre & Rim\nSales', icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/></> },
            { label: 'Accounts &\nExpenses', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
            { label: 'Business\nAnalytics', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
          ].map(({ label, icon }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.13)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.60)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </div>
              <div style={{
                fontSize: '9px', color: 'rgba(255,255,255,0.42)',
                textAlign: 'center', lineHeight: 1.5, whiteSpace: 'pre-line',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════
          RIGHT PANEL — 38%
      ══════════════════════════════ */}
      <div style={{
        width: '38%',
        flexShrink: 0,
        background: '#0e1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 56px',
      }}>
        <div style={{ width: '100%' }}>

          {/* Title */}
          <div style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', marginBottom: '6px', lineHeight: 1.2 }}>
            Welcome <span style={{ color: '#e53e3e' }}>Back!</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '28px' }}>
            Sign in to continue to your account
          </div>

          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginBottom: '7px' }}>Username</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#151c28',
                border: `1px solid ${userFocus ? 'rgba(229,62,62,0.7)' : '#1e2837'}`,
                borderRadius: '6px', padding: '12px 14px',
                transition: 'border-color 0.2s',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input
                  type="text" required autoFocus
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                  style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginBottom: '7px' }}>Password</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#151c28',
                border: `1px solid ${passFocus ? 'rgba(229,62,62,0.7)' : '#1e2837'}`,
                borderRadius: '6px', padding: '12px 14px',
                transition: 'border-color 0.2s',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  type={showPass ? 'text' : 'password'} required
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '12px', color: '#9ca3af', fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#4b5563', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: '13px', height: '13px', accentColor: '#e53e3e', cursor: 'pointer' }} />
                <span style={{ fontSize: '11.5px', color: '#6b7280' }}>Remember Me</span>
              </label>
              <span style={{ fontSize: '11.5px', color: '#e53e3e', opacity: 0.9, cursor: 'pointer' }}>Forgot Password?</span>
            </div>

            {/* LOGIN button */}
            <div style={{ display: 'flex', width: '100%', marginBottom: '20px', borderRadius: '6px', overflow: 'hidden' }}>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '14px',
                background: '#e53e3e', color: 'white', border: 'none',
                fontSize: '14px', fontWeight: 700, letterSpacing: '0.14em',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: loading ? 0.8 : 1,
              }}>
                {loading ? 'SIGNING IN...' : 'LOGIN'}
              </button>
              <button type="submit" disabled={loading} style={{
                width: '52px', background: '#c53030', border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.18)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>

          </form>

          {/* OR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '1px', background: '#1a2030' }} />
            <span style={{ fontSize: '10px', color: '#374151', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#1a2030' }} />
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', letterSpacing: '0.07em' }}>SHAFQAT TYRES &amp; RIMS HOUSE</div>
            <div style={{ fontSize: '10px', color: '#1f2937', marginTop: '3px' }}>Point-of-Sale System</div>
          </div>

        </div>
      </div>
    </div>
  )
}
