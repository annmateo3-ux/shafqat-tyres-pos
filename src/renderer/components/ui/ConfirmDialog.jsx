import React from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)' }} onClick={onCancel} />
      <div className="animate-modal-in" style={{
        position: 'relative', background: '#0f0f1a', border: '1px solid #2a2a3d',
        borderRadius: '20px', padding: '28px', maxWidth: '420px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: danger ? '#2d0808' : '#052010', border: `1px solid ${danger ? '#ef444430' : '#22c55e30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={danger ? '#ef4444' : '#22c55e'} strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'white', marginBottom: '6px' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{danger ? 'Delete' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  )
}
