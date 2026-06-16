export const fmt = {
  currency: (n) => `Rs ${Number(n || 0).toLocaleString('en-PK')}`,
  number: (n) => Number(n || 0).toLocaleString('en-PK'),
  date: (d) => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
  },
  dateTime: (d) => {
    if (!d) return '—'
    const date = new Date(d)
    return date.toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  },
  today: () => new Date().toISOString().split('T')[0],
  monthStart: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
}

export const api = window.electron || {}

export function invoke(channel, ...args) {
  const key = channel.replace(':', '_')
  if (!api[key]) {
    console.warn('IPC not available:', channel)
    return Promise.resolve(null)
  }
  return api[key](...args)
}

export const PAYMENT_STATUS = {
  paid: { label: 'Paid', cls: 'badge-paid' },
  partial: { label: 'Partial', cls: 'badge-partial' },
  unpaid: { label: 'Unpaid', cls: 'badge-unpaid' },
}

export const EXPENSE_CATEGORIES = ['Fuel', 'Maintenance', 'Salary', 'Rent', 'Utilities', 'Marketing', 'Miscellaneous']
