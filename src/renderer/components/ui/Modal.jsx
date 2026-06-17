import React, { useEffect } from 'react'

export default function Modal({ title, onClose, children, size = 'md', noPad = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sizes = { sm: '400px', md: '520px', lg: '680px', xl: '900px', full: '1100px' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="animate-modal-in" style={{
        position: 'relative', width: '100%', maxWidth: sizes[size],
        background: '#0f0f1a', border: '1px solid #2a2a3d', borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.05)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #1e1e2e', flexShrink: 0 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{title}</h2>
          <button onClick={onClose} style={{
            padding: '6px', borderRadius: '8px', border: 'none', background: 'none',
            color: '#4a4a6a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='#1e1e2e'; e.currentTarget.style.color='white' }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#4a4a6a' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: noPad ? 0 : '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
