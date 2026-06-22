import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

export interface AuthUser {
  email: string
  name: string
  picture: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (googleCredential: string) => Promise<void>
  devLogin: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'appbit64_token'
const USER_KEY  = 'appbit64_user'

function isTokenExpired(token: string): boolean {
  if (token === 'dev_token_no_expiry') return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (stored && storedUser && !isTokenExpired(stored)) {
      setToken(stored)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`
    }
  }, [])

  async function login(googleCredential: string) {
    const { data } = await api.post<{ access_token: string; user: AuthUser }>('/auth/google', {
      credential: googleCredential,
    })
    const { access_token, user: u } = data
    setToken(access_token)
    setUser(u)
    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  }

  function devLogin() {
    const mockUser: AuthUser = { email: 'dev@appbit64.local', name: 'Demo User', picture: '', role: 'analyst' }
    const mockToken = 'dev_token_no_expiry'
    setUser(mockUser)
    setToken(mockToken)
    localStorage.setItem(TOKEN_KEY, mockToken)
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
