import React, { useState, useEffect, useRef } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (!value) return
    const target = Number(value)
    const duration = 1000
    const steps = 40
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) { setDisplay(target); clearInterval(timer) }
      else setDisplay(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{Number(display).toLocaleString('en-PK')}{suffix}</span>
}

function StatCard({ label, value, sub, icon, color, trend, adminOnly, delay = 0 }) {
  const { isAdmin } = useApp()
  if (adminOnly && !isAdmin) return null
  const colors = {
    red:    { bg: '#2d0808', border: '#ef444430', icon: '#ef4444', text: '#ef4444' },
    green:  { bg: '#052010', border: '#22c55e30', icon: '#22c55e', text: '#22c55e' },
    blue:   { bg: '#050d2d', border: '#3b82f630', icon: '#3b82f6', text: '#3b82f6' },
    amber:  { bg: '#1a0e00', border: '#f59e0b30', icon: '#f59e0b', text: '#f59e0b' },
    purple: { bg: '#150520', border: '#a855f730', icon: '#a855f7', text: '#a855f7' },
  }
  const c = colors[color] || colors.red
  return (
    <div className="animate-fade-up" style={{
      animationDelay: `${delay}ms`, opacity: 0,
      background: '#0f0f1a', border: `1px solid ${c.border}`,
      borderRadius: '16px', padding: '20px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${c.border}` }}
    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#4a4a6a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{label}</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'white', lineHeight: 1 }}>
            <AnimatedNumber value={typeof value === 'number' ? value : 0} />
            {typeof value === 'string' && value}
          </div>
          {sub && <div style={{ fontSize: '12px', color: '#4a4a6a', marginTop: '6px' }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ fontSize: '12px', color: trend >= 0 ? '#22c55e' : '#ef4444', marginTop: '4px', fontWeight: 500 }}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs yesterday
            </div>
          )}
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: c.bg, border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.icon, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3d', borderRadius: '12px', padding: '10px 14px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Rs {Number(payload[0]?.value || 0).toLocaleString()}</div>
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin, setScreen } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await invoke('reports:dashboard')
    setData(res)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
      <svg className="animate-spin-slow" width="48" height="48" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.3"/>
        <circle cx="32" cy="32" r="10" fill="none" stroke="#ef4444" strokeWidth="3"/>
        <circle cx="32" cy="32" r="4" fill="#ef4444"/>
        {[0,60,120,180,240,300].map(a => {
          const r = a * Math.PI / 180
          return <line key={a} x1={32+10*Math.cos(r)} y1={32+10*Math.sin(r)} x2={32+27*Math.cos(r)} y2={32+27*Math.sin(r)} stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
        })}
      </svg>
      <div style={{ color: '#4a4a6a', fontSize: '13px' }}>Loading dashboard...</div>
    </div>
  )

  const { todaySales, monthSales, totalInventoryValue, totalInventoryQty, pendingBalance, lowStock, todayExpenses, monthExpenses, recentSales, last7days, topProducts } = data || {}

  const chartData = last7days?.map(d => ({
    day: new Date(d.day + 'T00:00').toLocaleDateString('en-PK', { weekday: 'short' }),
    revenue: d.revenue, sales: d.count,
  })) || []

  return (
    <div className="screen-enter" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#4a4a6a', marginTop: '2px' }}>
            Welcome back — {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
          background: '#0f0f1a', border: '1px solid #2a2a3d', borderRadius: '10px',
          color: '#6b7280', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#ef4444'; e.currentTarget.style.color='#ef4444' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#2a2a3d'; e.currentTarget.style.color='#6b7280' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard delay={0} label="Today's Sales" value={todaySales?.total || 0}
          sub={`${todaySales?.count || 0} transactions`} color="red"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>} />
        <StatCard delay={80} label="Month Revenue" value={monthSales?.total || 0}
          sub={`${monthSales?.count || 0} total sales`} color="green"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>} />
        {isAdmin && <StatCard delay={160} label="Stock Value" value={totalInventoryValue?.val || 0}
          sub={`${totalInventoryQty?.qty || 0} tyres`} color="blue" adminOnly
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>} />}
        <StatCard delay={240} label="Credit Due" value={pendingBalance?.bal || 0}
          sub="from customers" color="amber"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} />
        {isAdmin && <StatCard delay={320} label="Today's Expenses" value={todayExpenses?.total || 0}
          sub={`Month: Rs ${Number(monthExpenses?.total||0).toLocaleString()}`} color="purple" adminOnly
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />}
        {lowStock?.c > 0 && (
          <div className="animate-fade-up animate-pulse-red" style={{
            animationDelay: '400ms', opacity: 0,
            background: '#1a0505', border: '1px solid #ef444450',
            borderRadius: '16px', padding: '20px', cursor: 'pointer',
          }} onClick={() => setScreen('inventory')}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Low Stock Alert</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{lowStock.c}</div>
                <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '6px' }}>items need restocking →</div>
              </div>
              <div style={{ fontSize: '28px' }}>⚠</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Weekly Revenue</h3>
            <span style={{ fontSize: '11px', color: '#4a4a6a', background: '#1a1a2a', padding: '4px 10px', borderRadius: '20px' }}>Last 7 Days</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#4a4a6a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a4a6a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05', radius: 4 }} />
                <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} style={{ animation: 'barGrow 0.5s ease-out' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a3d', fontSize: '13px' }}>No sales data yet</div>}
        </div>

        {isAdmin && topProducts?.length > 0 && (
          <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Top Products</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProducts.map((p, i) => (
                <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms`, opacity: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#4a4a6a', width: '16px', fontFamily: 'monospace' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.brand} {p.size}</div>
                    <div style={{ fontSize: '10px', color: '#4a4a6a' }}>{p.sold} sold</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>Rs {Number(p.revenue).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Recent Sales</h3>
          <button onClick={() => setScreen('sales')} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a2a' }}>
              {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: h === 'Amount' ? 'right' : 'left', fontSize: '11px', color: '#4a4a6a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentSales?.map((s, i) => (
              <tr key={s.invoice_no} className="table-row animate-fade-up" style={{ animationDelay: `${i * 40}ms`, opacity: 0 }}>
                <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '12px', color: '#ef4444' }}>{s.invoice_no}</td>
                <td style={{ padding: '12px 20px', color: 'white', fontWeight: 500 }}>{s.customer_name}</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600, color: 'white' }}>Rs {Number(s.total).toLocaleString()}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span className={`badge-${s.payment_status}`}>{s.payment_status}</span>
                </td>
                <td style={{ padding: '12px 20px', color: '#4a4a6a', fontSize: '12px' }}>{fmt.dateTime(s.created_at)}</td>
              </tr>
            ))}
            {!recentSales?.length && (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#2a2a3d' }}>No sales yet — make your first sale!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
