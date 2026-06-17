import React, { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  adminOnly: false, icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'sales',      label: 'Sales',      adminOnly: false, icon: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0' },
  { id: 'inventory',  label: 'Inventory',  adminOnly: false, icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  { id: 'customers',  label: 'Customers',  adminOnly: false, icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'suppliers',  label: 'Suppliers',  adminOnly: false, icon: 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
  { id: 'expenses',   label: 'Expenses',   adminOnly: false, icon: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { id: 'reports',    label: 'Reports',    adminOnly: true,  icon: 'M18 20V10 M12 20V4 M6 20v-6' },
  { id: 'settings',   label: 'Settings',   adminOnly: true,  icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  { id: 'purchases',  label: 'Purchases',  adminOnly: false, icon: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
]

function NavIcon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : 'M' + seg} />)}
    </svg>
  )
}

function TyreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="4"/>
      <circle cx="32" cy="32" r="10" fill="none" stroke="#ef4444" strokeWidth="3"/>
      <circle cx="32" cy="32" r="4" fill="#ef4444"/>
      {[0,60,120,180,240,300].map(a => {
        const rad = a * Math.PI / 180
        return <line key={a} x1={32+10*Math.cos(rad)} y1={32+10*Math.sin(rad)} x2={32+27*Math.cos(rad)} y2={32+27*Math.sin(rad)} stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
      })}
    </svg>
  )
}

export default function Sidebar() {
  const { screen, setScreen, user, logout, isAdmin } = useApp()
  const [collapsed, setCollapsed] = useState(false)
  const items = NAV.filter(n => !n.adminOnly || isAdmin)

  return (
    <aside style={{
      width: collapsed ? '64px' : '220px',
      background: '#0a0a12',
      borderRight: '1px solid #1a1a2a',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid #1a1a2a', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '64px' }}>
        <div className="tyre-spin" style={{ flexShrink: 0 }}>
          <div className="tyre-inner"><TyreIcon /></div>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Shafqat Tyres</div>
            <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 500 }}>& Rim House</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginLeft: 'auto', padding: '4px', background: 'none', border: 'none',
          color: '#3a3a52', cursor: 'pointer', flexShrink: 0, borderRadius: '6px',
          transition: 'color 0.2s',
        }} onMouseEnter={e => e.target.style.color='#ef4444'} onMouseLeave={e => e.target.style.color='#3a3a52'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map(({ id, label, icon }, idx) => {
          const active = screen === id
          return (
            <button key={id} onClick={() => setScreen(id)}
              className={`sidebar-item ${active ? 'active' : ''}`}
              style={{
                width: '100%', border: 'none', textAlign: 'left', background: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                animationDelay: `${idx * 0.04}s`,
                position: 'relative',
              }}
              title={collapsed ? label : ''}>
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '60%', background: '#ef4444', borderRadius: '0 2px 2px 0',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }} />
              )}
              <NavIcon d={icon} />
              {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #1a1a2a' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white',
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '10px', color: '#ef4444', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        )}
        <button onClick={logout} className="sidebar-item" style={{
          width: '100%', border: 'none', background: 'none', color: '#6b7280',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color='#6b7280'}
          title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span style={{ fontSize: '13px' }}>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
