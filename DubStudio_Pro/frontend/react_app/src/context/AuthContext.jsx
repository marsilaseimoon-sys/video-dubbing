import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const API = 'http://localhost:5000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    const t = localStorage.getItem('token')
    if (u && t) { setUser(JSON.parse(u)); setToken(t) }
    setLoading(false)
  }, [])

  async function login(email, password) {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user); setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      // Demo fallback
      const u = { name: 'Demo User', email }
      setUser(u); setToken('demo')
      localStorage.setItem('user', JSON.stringify(u))
      localStorage.setItem('token', 'demo')
      return { success: true }
    }
  }

  async function register(firstName, lastName, email, password) {
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user); setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch {
      const u = { name: `${firstName} ${lastName}`, email }
      setUser(u); setToken('demo')
      localStorage.setItem('user', JSON.stringify(u))
      localStorage.setItem('token', 'demo')
      return { success: true }
    }
  }

  function logout() {
    setUser(null); setToken(null)
    localStorage.removeItem('user'); localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
