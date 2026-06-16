import React from 'react'
import { AlertTriangle } from './Icons.jsx'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative bg-dark-800 border border-dark-500 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-2 rounded-xl ${danger ? 'bg-red-500/20' : 'bg-brand-500/20'}`}>
            <AlertTriangle size={22} className={danger ? 'text-red-400' : 'text-brand-400'} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{title}</h3>
            <p className="text-dark-200 text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
