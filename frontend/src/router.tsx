import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import Landing from './pages/Landing'
import MapPage from './pages/MapPage'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Alertas from './pages/Alertas'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Protected — wrapped in AppLayout (top/bottom nav) */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alertas"   element={<Alertas />} />
      </Route>

      {/* Map page — protected but uses its own layout (full-screen) */}
      <Route path="/mapa" element={
        <ProtectedRoute>
          <MapPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
