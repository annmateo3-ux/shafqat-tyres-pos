import React, { useState, useMemo } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { FileText, TrendingUp, Package, RefreshCw, Printer } from '../ui/Icons.jsx'

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function StatBox({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-t2 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-t2 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function ReportsScreen() {
  const [dateFrom, setDateFrom] = useState(monthStart)
  const [dateTo, setDateTo] = useState(today)
  const [report, setReport] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const loadReport = async () => {
    setLoading(true)
    const [r, tp] = await Promise.all([
      invoke('reports:salesReport', { date_from: dateFrom, date_to: dateTo }),
      invoke('reports:topProducts', { date_from: dateFrom, date_to: dateTo }),
    ])
    setReport(r)
    setTopProducts(tp || [])
    setLoading(false)
  }

  const profit = useMemo(() => {
    if (!report) return 0
    const revenue = report.totals?.revenue || 0
    const cogs = report.costOfGoods?.cogs || 0
    const expenses = report.expenses?.total || 0
    return revenue - cogs - expenses
  }, [report])

  const salesByDay = useMemo(() => {
    if (!report?.sales) return []
    const map = {}
    report.sales.forEach(s => {
      const day = s.created_at?.split('T')[0] || s.created_at?.split(' ')[0]
      if (!map[day]) map[day] = { day, revenue: 0, count: 0 }
      map[day].revenue += s.total
      map[day].count++
    })
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day)).map(d => ({
      ...d,
      dayLabel: new Date(d.day + 'T00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    }))
  }, [report])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2"><Printer size={16} />Print Report</button>
      </div>

      {/* Date Range */}
      <div className="card p-4 flex items-end gap-4 flex-wrap">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Today', from: today, to: today },
            { label: 'This Month', from: monthStart, to: today },
            { label: 'Last 7 Days', from: new Date(Date.now() - 6*86400000).toISOString().split('T')[0], to: today },
          ].map(({ label, from, to }) => (
            <button key={label} onClick={() => { setDateFrom(from); setDateTo(to) }} className="btn-ghost text-sm">{label}</button>
          ))}
        </div>
        <button onClick={loadReport} disabled={loading} className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {!report ? (
        <div className="flex flex-col items-center justify-center py-20 text-t2">
          <TrendingUp size={48} className="mb-3 opacity-30" />
          <p>Select a date range and click Generate Report</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Revenue" value={fmt.currency(report.totals?.revenue)} sub={`${report.totals?.count} sales`} color="text-accent" />
            <StatBox label="Cost of Goods" value={fmt.currency(report.costOfGoods?.cogs)} color="text-red-400" />
            <StatBox label="Expenses" value={fmt.currency(report.expenses?.total)} color="text-red-400" />
            <StatBox
              label="Net Profit"
              value={fmt.currency(profit)}
              sub={report.totals?.revenue > 0 ? `${((profit / report.totals.revenue) * 100).toFixed(1)}% margin` : ''}
              color={profit >= 0 ? 'text-green-400' : 'text-red-400'}
            />
          </div>

          {/* Chart */}
          {salesByDay.length > 1 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Daily Revenue</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
                  <XAxis dataKey="dayLabel" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [fmt.currency(v), 'Revenue']} contentStyle={{ background: '#1a1a24', border: '1px solid #3d3d52', borderRadius: 12 }} />
                  <Bar dataKey="revenue" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Top Products by Sales</h3>
              {topProducts.length === 0 ? (
                <p className="text-t2 text-sm">No sales in this period</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-t2 font-mono">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{p.brand} {p.size}</div>
                        <div className="text-xs text-t2">{p.pattern && `${p.pattern} · `}{p.sold} sold</div>
                      </div>
                      <div className="text-xs font-medium text-accent shrink-0">{fmt.currency(p.revenue)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales List Summary */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Sales Summary ({report.sales?.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {report.sales?.length === 0 ? (
                  <p className="text-t2 text-sm">No sales in this period</p>
                ) : report.sales?.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-card rounded-xl text-xs">
                    <div>
                      <div className="font-mono text-accent">{s.invoice_no}</div>
                      <div className="text-t2">{s.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white">{fmt.currency(s.total)}</div>
                      <div className={`badge-${s.payment_status}`}>{s.payment_status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
