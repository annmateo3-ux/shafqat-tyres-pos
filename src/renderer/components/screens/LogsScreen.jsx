import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'

const ACTION_COLORS = {
  login:  { bg: '#3b82f620', color: '#3b82f6' },
  create: { bg: '#22c55e20', color: '#22c55e' },
  update: { bg: '#f59e0b20', color: '#f59e0b' },
  delete: { bg: '#ef444420', color: '#ef4444' },
}

const ENTITY_LABELS = {
  sale: 'Sale', inventory: 'Inventory', expense: 'Expense',
  customer: 'Customer', supplier: 'Supplier', user: 'User', purchase: 'Purchase',
}

export default function LogsScreen() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const r = await invoke('activity:list', 200)
    setLogs(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      const matchSearch = !q || [l.description, l.user_name, l.entity].some(f => f?.toLowerCase().includes(q))
      const matchAction = !filterAction || l.action === filterAction
      return matchSearch && matchAction
    })
  }, [logs, search, filterAction])

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>Activity Logs</h1>
          <p style={{ fontSize: '13px', color: '#4a4a6a', marginTop: '2px' }}>{filtered.length} records · tracks who did what and when</p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          background: '#0f0f1a', border: '1px solid #2a2a3d', borderRadius: '10px',
          color: '#6b7280', fontSize: '12px', cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: '200px' }} placeholder="Search description, user..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: '160px' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="login">Logins</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
        </select>
      </div>

      <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a2a' }}>
                {['Action', 'Entity', 'Description', 'By', 'Date/Time'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#4a4a6a' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#4a4a6a' }}>No activity logs yet</td></tr>
              ) : filtered.map(log => {
                const colors = ACTION_COLORS[log.action] || ACTION_COLORS.update
                return (
                  <tr key={log.id} className="table-row">
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: colors.bg, color: colors.color, textTransform: 'capitalize' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{ENTITY_LABELS[log.entity] || log.entity}</td>
                    <td style={{ padding: '12px 16px', color: 'white' }}>{log.description}</td>
                    <td style={{ padding: '12px 16px' }}>{log.user_name || 'System'}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '12px' }}>{fmt.dateTime(log.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}