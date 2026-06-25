import React, { useState, useEffect, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

function StatCard({ label, value, trend, trendLabel, iconBg, icon, onClick }) {
  const isPos = !trend?.startsWith('-')
  return (
    <div onClick={onClick} style={{
      background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px',
      padding: '16px', cursor: 'pointer', flex: 1,
      transition: 'border-color 0.2s, transform 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a3a52'; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2837'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{icon}</div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{value}</div>
      {trend && <div style={{ fontSize: '10px', color: isPos ? '#22c55e' : '#f87171' }}>
        {isPos ? '▲' : '▼'} {trend} {trendLabel}
      </div>}
    </div>
  )
}

const DONUT_COLORS = ['#e53e3e', '#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6']
const BRANDS = [
  { name: 'Bridgestone', value: 45 },
  { name: 'Yokohama', value: 20 },
  { name: 'Dunlop', value: 15 },
  { name: 'Michelin', value: 10 },
  { name: 'Others', value: 10 },
]
const FAST_SIZES = ['195/55R16', '185/65R15', '225/45R17', '215/60R16', '235/55R18']

export default function Dashboard() {
  const { isAdmin, setScreen, user } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartTab, setChartTab] = useState('Daily')
  const [search, setSearch] = useState('')
  const [greeting, setGreeting] = useState('Good Morning')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good Morning')
    else if (h < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await invoke('reports:dashboard')
    setData(res)
    setLoading(false)
  }

  // Search navigation
  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const q = search.toLowerCase()
      if (q.includes('sale')) setScreen('sales')
      else if (q.includes('invent') || q.includes('tyre') || q.includes('rim')) setScreen('inventory')
      else if (q.includes('customer')) setScreen('customers')
      else if (q.includes('supplier')) setScreen('suppliers')
      else if (q.includes('expense')) setScreen('expenses')
      else if (q.includes('report')) setScreen('reports')
      else if (q.includes('purchase')) setScreen('purchases')
      else if (q.includes('log') || q.includes('activ')) setScreen('logs')
      else if (q.includes('setting')) setScreen('settings')
      setSearch('')
    }
  }

  const chartData = useMemo(() => {
    if (!data?.last7days?.length) return []
    return data.last7days.map(d => ({
      date: new Date(d.day + 'T00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
      revenue: d.revenue || 0,
    }))
  }, [data])

  const today = new Date().toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0b0f18' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #1e2837', borderTopColor: '#e53e3e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ color: '#6b7280', fontSize: '12px' }}>Loading...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const { todaySales, monthSales, totalInventoryValue, pendingBalance, lowStockItems, recentSales, topProducts } = data || {}


  return (
    <div style={{ background: '#0b0f18', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#0d1117', borderBottom: '1px solid #1e2837', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 10 }}>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#151c28', border: '1px solid #1e2837', borderRadius: '8px', padding: '7px 12px', width: '180px', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Search... (Enter)" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch} style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontSize: '11px', color: '#9ca3af', fontFamily: 'inherit' }} />
        </div>

        {/* Quick Actions */}
        {[
          { label: 'New Sale',     screen: 'sales',    bg: '#e53e3e', icon: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></> },
          { label: 'Add Stock',   screen: 'purchases', bg: '#22c55e', icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
          { label: 'Add Customer',screen: 'customers', bg: '#3b82f6', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
          { label: 'New Expense', screen: 'expenses',  bg: '#f59e0b', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
        ].map(({ label, screen, bg, icon }) => (
          <button key={label} onClick={() => setScreen(screen)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: bg + '18', border: `1px solid ${bg}35`,
            borderRadius: '8px', padding: '7px 11px',
            color: bg, fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = bg + '30'}
          onMouseLeave={e => e.currentTarget.style.background = bg + '18'}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            {label}
          </button>
        ))}

        {/* Stats + Admin */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { label: "TODAY'S SALES", value: fmt.currency(todaySales?.total || 0), icon: '🛒', screen: 'sales' },
            { label: 'INVOICES',      value: todaySales?.count || 0,               icon: '📄', screen: 'sales' },
            { label: 'PENDING',       value: fmt.currency(pendingBalance?.bal || 0),icon: '⏳', screen: 'customers' },
          ].map(({ label, value, icon, screen }) => (
            <div key={label} onClick={() => setScreen(screen)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: '#151c28', border: '1px solid #1e2837',
              borderRadius: '8px', padding: '6px 11px', cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2a3a52'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2837'}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '8px', color: '#6b7280', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{value}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'capitalize' }}>{user?.role || 'Administrator'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, padding: '20px', minWidth: 0 }}>

          {/* Greeting */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{greeting}, {user?.name || 'Admin'} 👋</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Here's what's happening with your business today.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#151c28', border: '1px solid #1e2837', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', color: '#9ca3af' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {today}
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <StatCard label="Today's Sales" value={fmt.currency(todaySales?.total || 0)} trend="+12.5%" trendLabel="vs yesterday" iconBg="#e53e3e30" icon="💰" onClick={() => setScreen('reports')} />
            <StatCard label="This Month Sales" value={fmt.currency(monthSales?.total || 0)} trend="+18.7%" trendLabel="vs last month" iconBg="#22c55e30" icon="📈" onClick={() => setScreen('reports')} />
            <StatCard label="Inventory Value" value={fmt.currency(totalInventoryValue?.val || 0)} trend="+4.3%" trendLabel="vs last month" iconBg="#3b82f630" icon="📦" onClick={() => setScreen('inventory')} />
            <StatCard label="Gross Profit" value={fmt.currency(Math.round((todaySales?.total || 0) * 0.22))} trend="+15.2%" trendLabel="vs last month" iconBg="#f59e0b30" icon="💹" onClick={() => setScreen('reports')} />
          </div>

          {/* Charts row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: 2, background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Sales Overview</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['Daily', 'Weekly', 'Monthly'].map(t => (
                    <button key={t} onClick={() => setChartTab(t)} style={{ padding: '4px 10px', borderRadius: '5px', border: 'none', fontSize: '10px', fontWeight: 500, background: chartTab === t ? '#e53e3e' : 'transparent', color: chartTab === t ? 'white' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e53e3e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={v => [fmt.currency(v), 'Revenue']} contentStyle={{ background: '#1e2837', border: '1px solid #2a3a52', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#e53e3e" strokeWidth={2} fill="url(#redGrad)" dot={{ fill: '#e53e3e', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1, background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>Best Selling Brands</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={BRANDS} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {BRANDS.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`]} contentStyle={{ background: '#1e2837', border: '1px solid #2a3a52', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {BRANDS.map((b, i) => (
                  <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DONUT_COLORS[i], flexShrink: 0 }} />
                      <span style={{ color: '#9ca3af' }}>{b.name}</span>
                    </div>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{b.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Low Stock Alert</div>
                <span onClick={() => setScreen('inventory')} style={{ fontSize: '10px', color: '#e53e3e', cursor: 'pointer' }}>View All</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(lowStockItems || []).slice(0, 3).map((item, i) => (
                  <div key={i} onClick={() => setScreen('inventory')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: '#0b0f18', borderRadius: '8px', cursor: 'pointer', border: '1px solid #111827', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#e53e3e40'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#111827'}>
                    <img src="./wheel-tyres.png" alt="" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.brand} {item.size}</div>
                      <div style={{ fontSize: '9px', color: '#e53e3e', marginTop: '1px' }}>Remaining: {item.quantity}</div>
                    </div>
                  </div>
                ))}
                {(!lowStockItems || lowStockItems.length === 0) && (
                  <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '11px', padding: '20px 0' }}>✓ All stock levels OK</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div style={{ background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Recent Sales</div>
              <span onClick={() => setScreen('sales')} style={{ fontSize: '10px', color: '#e53e3e', cursor: 'pointer' }}>View All</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2837' }}>
                  {['Invoice #', 'Customer', 'Vehicle', 'Items', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#4b5563', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentSales || []).slice(0, 5).map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #111827', cursor: 'pointer' }}
                    onClick={() => setScreen('sales')}
                    onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 10px', color: '#e53e3e', fontFamily: 'monospace', fontSize: '10px' }}>{s.invoice_no}</td>
                    <td style={{ padding: '8px 10px', color: '#e2e8f0', fontWeight: 500 }}>{s.customer_name}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{s.vehicle_plate || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{s.items?.length || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 600 }}>{fmt.currency(s.total)}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{fmt.date(s.created_at)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500, background: s.payment_status === 'paid' ? '#22c55e20' : s.payment_status === 'partial' ? '#f59e0b20' : '#e53e3e20', color: s.payment_status === 'paid' ? '#22c55e' : s.payment_status === 'partial' ? '#f59e0b' : '#e53e3e' }}>
                        {s.payment_status === 'paid' ? 'Completed' : s.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!recentSales || recentSales.length === 0) && (
                  <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#4b5563' }}>No sales yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ width: '220px', flexShrink: 0, padding: '20px 16px 20px 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div style={{ background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Summary</div>
            {[
              { label: 'Sales',           value: fmt.currency(todaySales?.total || 0), color: '#fff', screen: 'sales' },
              { label: 'Profit',          value: fmt.currency(Math.round((todaySales?.total || 0) * 0.17)), color: '#22c55e', screen: 'reports' },
              { label: 'Invoices',        value: todaySales?.count || 0, color: '#fff', screen: 'sales' },
              { label: 'Average Invoice', value: fmt.currency(todaySales?.count ? Math.round(todaySales.total / todaySales.count) : 0), color: '#fff', screen: 'reports' },
            ].map(({ label, value, color, screen }) => (
              <div key={label} onClick={() => setScreen(screen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1e2837', paddingTop: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '9px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Top Product</div>
              {topProducts?.[0] ? (
                <div onClick={() => setScreen('inventory')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <img src="./wheel-tyres.png" alt="" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#e2e8f0' }}>{topProducts[0].brand} {topProducts[0].size}</div>
                    <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1px' }}>{topProducts[0].size}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#4b5563' }}>No data yet</div>
              )}
            </div>
          </div>

          <div style={{ background: '#151c28', border: '1px solid #1e2837', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fast Moving Sizes</div>
              <span onClick={() => setScreen('inventory')} style={{ fontSize: '9px', color: '#e53e3e', cursor: 'pointer' }}>View All</span>
            </div>
            {FAST_SIZES.map((size, i) => (
              <div key={size} onClick={() => setScreen('inventory')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0d1117'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '9px', color: '#4b5563', width: '12px', fontFamily: 'monospace' }}>{i + 1}</span>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>{size}</span>
                </div>
                <svg width="20" height="12" viewBox="0 0 20 12">
                  <polyline points="0,10 5,6 10,8 15,3 20,1" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
