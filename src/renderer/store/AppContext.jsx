import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('dashboard')
  const [toast, setToast] = useState(null)

  const login = useCallback((u) => setUser(u), [])
  const logout = useCallback(() => { setUser(null); setScreen('dashboard') }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AppContext.Provider value={{ user, login, logout, screen, setScreen, toast, showToast, isAdmin }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
