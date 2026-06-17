import React from 'react'

export default function Toast({ toast }) {
  if (!toast) return null
  const icons = {
    success: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    error:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    warning: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>,
  }
  const colors = {
    success: { bg: '#052010', border: '#22c55e40', color: '#22c55e' },
    error:   { bg: '#2d0808', border: '#ef444440', color: '#ef4444' },
    warning: { bg: '#1a0e00', border: '#f59e0b40', color: '#f59e0b' },
  }
  const c = colors[toast.type] || colors.success
  return (
    <div className="animate-fade-up" style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 18px', borderRadius: '14px',
      background: c.bg, border: `1px solid ${c.border}`,
      boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px ${c.border}`,
      color: c.color,
    }}>
      {icons[toast.type] || icons.success}
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'white' }}>{toast.message}</span>
    </div>
  )
}
