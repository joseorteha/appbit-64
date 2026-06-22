import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, BarChart2, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/mapa',      label: 'Mapa',      Icon: Map            },
  { to: '/analytics', label: 'Analytics', Icon: BarChart2      },
  { to: '/alertas',   label: 'Alertas',   Icon: Bell           },
]

export default function AppNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/') }

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-[500] h-14 items-center px-5 gap-0"
        style={{
          background: 'rgba(14,16,18,0.88)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8 shrink-0">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <rect x="0" y="8"  width="4" height="6" rx="1" fill="#ef4444" />
            <rect x="6" y="4"  width="4" height="10" rx="1" fill="#f59e0b" />
            <rect x="12" y="0" width="4" height="14" rx="1" fill="#2fd9f4" />
          </svg>
          <span className="text-sm font-semibold tracking-tight" style={{ color: '#dde4e6' }}>
            BiT <span style={{ color: '#2fd9f4', fontWeight: 400 }}>64</span>
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 mr-6 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Nav links */}
        <div className="flex items-center gap-0.5 flex-1">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={({ isActive }) => isActive
                ? { color: '#2fd9f4', background: 'rgba(47,217,244,0.08)' }
                : { color: '#7a8c91' }
              }
            >
              <Icon size={13} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User area */}
        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img src={user.picture} alt={user.name}
                  className="w-6 h-6 rounded-full"
                  style={{ border: '1.5px solid rgba(255,255,255,0.12)' }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(47,217,244,0.12)', color: '#2fd9f4' }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs truncate max-w-[100px] hidden lg:block" style={{ color: '#7a8c91' }}>
                {user.name?.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md transition-colors hover:bg-white/8"
              title="Cerrar sesión"
              style={{ color: '#3f5258' }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[500] flex items-center justify-around px-1 pb-safe"
        style={{
          background: 'rgba(14,16,18,0.94)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '8px',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        {LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all"
            style={({ isActive }) => isActive
              ? { color: '#2fd9f4' }
              : { color: '#3f5258' }
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl"
          style={{ color: '#3f5258' }}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Salir</span>
        </button>
      </nav>
    </>
  )
}
