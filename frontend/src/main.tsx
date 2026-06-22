import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './router'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  clientId
    ? <GoogleOAuthProvider clientId={clientId}>{app}</GoogleOAuthProvider>
    : app
)
