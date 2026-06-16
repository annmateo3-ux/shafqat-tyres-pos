import React, { useEffect } from 'react'
import { X } from './Icons.jsx'

export default function Modal({ title, onClose, children, size = 'md', noPad = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-dark-800 border border-dark-500 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-600 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-600 text-dark-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className={`overflow-y-auto flex-1 ${noPad ? '' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
