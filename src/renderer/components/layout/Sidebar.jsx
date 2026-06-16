import React from 'react'
import { useApp } from '../../store/AppContext.jsx'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Truck,
  TrendingUp, DollarSign, Settings, LogOut, Store
} from '../ui/Icons.jsx'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   Icon: LayoutDashboard, adminOnly: false },
  { id: 'sales',      label: 'New Sale',     Icon: ShoppingCart,    adminOnly: false },
  { id: 'inventory',  label: 'Inventory',    Icon: Package,         adminOnly: false },
  { id: 'customers',  label: 'Customers',    Icon: Users,           adminOnly: false },
  { id: 'suppliers',  label: 'Suppliers',    Icon: Truck,           adminOnly: false },
  { id: 'expenses',   label: 'Expenses',     Icon: DollarSign,      adminOnly: false },
  { id: 'reports',    label: 'Reports',      Icon: TrendingUp,      adminOnly: true  },
  { id: 'settings',   label: 'Settings',     Icon: Settings,        adminOnly: true  },
]

export default function Sidebar() {
  const { screen, setScreen, user, logout, isAdmin } = useApp()

  const items = NAV.filter(n => !n.adminOnly || isAdmin)

  return (
    <aside className="w-60 bg-dark-800 border-r border-dark-600 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
            <Store size={18} className="text-dark-900" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight">Shafqat Tyres</div>
            <div className="text-xs text-dark-300 truncate">& Rim House</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setScreen(id)}
            className={`sidebar-item w-full text-left ${screen === id ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-600">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 bg-dark-500 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-dark-300 capitalize">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="sidebar-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          <span className="text-sm">Sign out</span>
        </button>
      </div>
    </aside>
  )
}
