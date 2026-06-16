import React from 'react'
import { AppProvider, useApp } from './store/AppContext.jsx'
import LoginScreen from './components/screens/LoginScreen.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Toast from './components/ui/Toast.jsx'
import Dashboard from './components/screens/Dashboard.jsx'
import InventoryScreen from './components/screens/InventoryScreen.jsx'
import SalesScreen from './components/screens/SalesScreen.jsx'
import CustomersScreen from './components/screens/CustomersScreen.jsx'
import SuppliersScreen from './components/screens/SuppliersScreen.jsx'
import ExpensesScreen from './components/screens/ExpensesScreen.jsx'
import ReportsScreen from './components/screens/ReportsScreen.jsx'
import SettingsScreen from './components/screens/SettingsScreen.jsx'

function AppInner() {
  const { user, screen, toast } = useApp()

  if (!user) return <LoginScreen />

  const screens = {
    dashboard: <Dashboard />,
    inventory: <InventoryScreen />,
    sales: <SalesScreen />,
    customers: <CustomersScreen />,
    suppliers: <SuppliersScreen />,
    expenses: <ExpensesScreen />,
    reports: <ReportsScreen />,
    settings: <SettingsScreen />,
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in" key={screen}>
          {screens[screen] || <Dashboard />}
        </div>
      </main>
      <Toast toast={toast} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
