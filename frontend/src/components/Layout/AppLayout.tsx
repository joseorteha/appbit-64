import { Outlet } from 'react-router-dom'
import AppNav from './AppNav'

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0c0f0f' }}>
      <AppNav />
      {/* paddingTop matches the 56px (h-14) desktop nav, paddingBottom for mobile nav */}
      <main className="md:pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
