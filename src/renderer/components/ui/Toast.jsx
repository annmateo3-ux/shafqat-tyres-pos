import React from 'react'
import { CheckCircle, XCircle, AlertCircle } from './Icons.jsx'

export default function Toast({ toast }) {
  if (!toast) return null
  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle }
  const colors = { success: 'border-green-500/40 bg-green-500/10 text-green-400', error: 'border-red-500/40 bg-red-500/10 text-red-400', warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' }
  const Icon = icons[toast.type] || CheckCircle
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm animate-slide-up ${colors[toast.type] || colors.success}`}>
      <Icon size={18} />
      <span className="text-sm font-medium text-white">{toast.message}</span>
    </div>
  )
}
