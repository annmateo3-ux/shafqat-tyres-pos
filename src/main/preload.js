const { contextBridge, ipcRenderer } = require('electron')

const channels = [
  'auth:login',
  'company:get', 'company:update',
  'users:list', 'users:create', 'users:update', 'users:delete',
  'suppliers:list', 'suppliers:get', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
  'suppliers:payments', 'suppliers:addPayment',
  'customers:list', 'customers:get', 'customers:create', 'customers:update', 'customers:delete',
  'customers:payments', 'customers:addPayment', 'customers:sales',
  'inventory:list', 'inventory:get', 'inventory:create', 'inventory:update', 'inventory:delete', 'inventory:lowStock',
  'sales:list', 'sales:get', 'sales:create', 'sales:update', 'sales:delete',
  'purchases:list', 'purchases:get', 'purchases:create', 'purchases:delete',
  'expenses:list', 'expenses:create', 'expenses:update', 'expenses:delete',
  'reports:dashboard', 'reports:salesReport', 'reports:topProducts',
  'activity:list',
  'window:print',
]

const api = {}
for (const ch of channels) {
  api[ch.replace(':', '_').replace(':', '_')] = (...args) => ipcRenderer.invoke(ch, ...args)
}

contextBridge.exposeInMainWorld('electron', api)