import React, { useState } from 'react'
import { useApp } from '../../store/AppContext.jsx'

const SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
      { id: 'sales',     label: 'Sales',     icon: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></> },
      { id: 'inventory', label: 'Inventory', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> },
    ]
  },
  {
    label: 'MANAGE',
    adminOnly: false,
    items: [
      { id: 'customers',  label: 'Customers',  icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
      { id: 'suppliers',  label: 'Suppliers',  icon: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></> },
      { id: 'purchases',  label: 'Purchases',  icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
      { id: 'expenses',   label: 'Expenses',   icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
    ]
  },
  {
    label: 'ADMIN',
    adminOnly: true,
    items: [
      { id: 'reports',  label: 'Reports',      adminOnly: true, icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
      { id: 'logs',     label: 'Activity Log', adminOnly: true, icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
      { id: 'settings', label: 'Settings',     adminOnly: true, icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
    ]
  }
]

function SvgIcon({ children }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  )
}

export default function Sidebar() {
  const { screen, setScreen, logout, isAdmin } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width: collapsed ? '52px' : '210px',
      background: '#0d1117',
      borderRight: '1px solid #1e2837',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* ── LOGO ── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderBottom: '1px solid #1e2837',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
        minHeight: '70px',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
            <img
              src="./logo.png"
              alt="Shafqat Tyres"
              style={{ height: '44px', width: 'auto', flexShrink: 0, display: 'block' }}
            />
          </div>
        )}
        {collapsed && (
          <img src="./logo.png" alt="" style={{ height: '32px', width: 'auto', display: 'block' }} />
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: '4px', borderRadius: '5px', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#9ca3af'}
            onMouseLeave={e => e.currentTarget.style.color = '#374151'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position: 'absolute', left: '52px', top: '18px', background: '#1e2837', border: '1px solid #2a3a52', color: '#9ca3af', cursor: 'pointer', padding: '4px 3px', borderRadius: '0 5px 5px 0', display: 'flex', zIndex: 20 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>

      {/* ── NAV ── */}
      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {SECTIONS.map(section => {
          if (section.adminOnly && !isAdmin) return null
          const visibleItems = section.items.filter(i => !i.adminOnly || isAdmin)
          if (!visibleItems.length) return null

          return (
            <div key={section.label}>
              {!collapsed && (
                <div style={{ fontSize: '9px', color: '#1e2837', textTransform: 'uppercase', letterSpacing: '0.18em', padding: '10px 8px 4px', fontWeight: 600 }}>
                  {section.label}
                </div>
              )}
              {collapsed && <div style={{ height: '10px' }} />}
              {visibleItems.map(({ id, label, icon }) => {
                const active = screen === id
                return (
                  <button key={id} onClick={() => setScreen(id)} title={collapsed ? label : ''} style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : '9px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '8px' : '8px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontFamily: 'inherit',
                    fontWeight: active ? 600 : 400,
                    background: active ? '#e53e3e15' : 'none',
                    color: active ? '#e53e3e' : '#4b5563',
                    transition: 'all 0.15s',
                    borderLeft: active ? '2px solid #e53e3e' : '2px solid transparent',
                    marginLeft: active ? '-1px' : '0',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#151c28'; e.currentTarget.style.color = '#9ca3af' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#4b5563' }}}>
                    <SvgIcon>{icon}</SvgIcon>
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && active && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* ── FOOTER ── */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #1e2837', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ fontSize: '9px', color: '#1e2837', textAlign: 'center', marginBottom: '6px', letterSpacing: '0.05em' }}>
            v1.0.4 · © 2026 Shafqat Tyres
          </div>
        )}
        <button onClick={logout} title={collapsed ? 'Sign out' : ''} style={{
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : '9px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px' : '8px 10px',
          borderRadius: '7px', border: 'none',
          width: '100%', cursor: 'pointer',
          background: 'none', color: '#374151',
          fontSize: '12.5px', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f8717112'; e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#374151' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
