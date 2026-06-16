import React, { useState, useEffect } from 'react'
import { invoke, fmt } from '../../utils/index.js'
import { useApp } from '../../store/AppContext.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Package, Users, AlertTriangle, DollarSign, ShoppingCart, RefreshCw } from '../ui/Icons.jsx'

function StatCard({ label, value, sub, icon: Icon, color = 'brand', adminOnly = false }) {
  const { isAdmin } = useApp()
  if (adminOnly && !isAdmin) return null
  const colors = {
    brand: 'bg-brand-500/15 text-brand-400',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-300 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-dark-300 text-xs mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-dark-700 border border-dark-500 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-dark-300 mb-1">{label}</p>
        <p className="text-brand-400 font-bold">{fmt.currency(payload[0]?.value)}</p>
        <p className="text-dark-300">{payload[1]?.value} sales</p>
      </div>
    )
  }
  return null
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
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  const { todaySales, monthSales, totalInventoryValue, totalInventoryQty, pendingBalance, lowStock, todayExpenses, monthExpenses, recentSales, last7days, topProducts } = data || {}

  const chartData = last7days?.map(d => ({
    day: new Date(d.day + 'T00:00').toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric' }),
    revenue: d.revenue,
    sales: d.count,
  })) || []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-300 text-sm">{fmt.date(new Date().toISOString())}</p>
        </div>
        <button onClick={load} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={16} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={fmt.currency(todaySales?.total)} sub={`${todaySales?.count} transactions`} icon={ShoppingCart} color="brand" />
        <StatCard label="Month Sales" value={fmt.currency(monthSales?.total)} sub={`${monthSales?.count} transactions`} icon={TrendingUp} color="green" />
        {isAdmin && <StatCard label="Stock Value" value={fmt.currency(totalInventoryValue?.val)} sub={`${totalInventoryQty?.qty} tyres`} icon={Package} color="blue" adminOnly />}
        <StatCard label="Credit Due" value={fmt.currency(pendingBalance?.bal)} sub="from customers" icon={Users} color="red" />
        {isAdmin && <StatCard label="Today Expenses" value={fmt.currency(todayExpenses?.total)} sub={`Month: ${fmt.currency(monthExpenses?.total)}`} icon={DollarSign} color="purple" adminOnly />}
        {lowStock?.c > 0 && (
          <div className="stat-card border-red-500/30 cursor-pointer hover:border-red-500/60 transition-colors" onClick={() => setScreen('inventory')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-dark-300 text-xs font-medium uppercase tracking-wide">Low Stock Alert</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{lowStock.c}</p>
                <p className="text-dark-300 text-xs mt-0.5">items need restocking</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 animate-pulse-soft">
                <AlertTriangle size={20} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue — Last 7 Days</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
                <XAxis dataKey="day" tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="revenue" fill="#eab308" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sales" fill="#3d3d52" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-dark-300 text-sm">No sales data yet</div>
          )}
        </div>

        {/* Top Products (admin only) */}
        {isAdmin && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Top Products (This Month)</h3>
            {topProducts?.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-dark-300 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{p.brand} {p.size}</div>
                      <div className="text-xs text-dark-300">{p.sold} sold</div>
                    </div>
                    <div className="text-xs font-medium text-brand-400">{fmt.currency(p.revenue)}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-dark-300 text-xs">No sales yet</p>}
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="px-5 py-4 border-b border-dark-600 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Sales</h3>
          <button onClick={() => setScreen('sales')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-dark-600">
                <th className="px-5 py-3 text-xs text-dark-300 font-medium">Invoice</th>
                <th className="px-5 py-3 text-xs text-dark-300 font-medium">Customer</th>
                <th className="px-5 py-3 text-xs text-dark-300 font-medium">Amount</th>
                <th className="px-5 py-3 text-xs text-dark-300 font-medium">Status</th>
                <th className="px-5 py-3 text-xs text-dark-300 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales?.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-5 py-3 font-mono text-xs text-brand-400">{s.invoice_no}</td>
                  <td className="px-5 py-3 text-white">{s.customer_name}</td>
                  <td className="px-5 py-3 font-medium">{fmt.currency(s.total)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge-${s.payment_status}`}>{s.payment_status}</span>
                  </td>
                  <td className="px-5 py-3 text-dark-300 text-xs">{fmt.dateTime(s.created_at)}</td>
                </tr>
              ))}
              {!recentSales?.length && (
                <tr><td colSpan="5" className="px-5 py-8 text-center text-dark-300">No sales yet. Make your first sale!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
