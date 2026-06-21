import { Activity, Briefcase, GraduationCap, Users, Star, type LucideIcon } from 'lucide-react'
import type { Vertical } from '../../types'

interface NavItem {
  id: Vertical | null
  label: string
  Icon: LucideIcon
  disabled?: boolean
}

const ITEMS: NavItem[] = [
  { id: 'salud_mental',  label: 'Salud',     Icon: Activity },
  { id: 'empleabilidad', label: 'Empleo',    Icon: Briefcase },
  { id: 'formaciones',   label: 'Formación', Icon: GraduationCap },
  { id: null,            label: 'Mentorías', Icon: Users,         disabled: true },
  { id: null,            label: 'Experi.',   Icon: Star,          disabled: true },
]

interface Props {
  vertical: Vertical
  onChange: (v: Vertical) => void
  horizontal?: boolean
}

export default function NavDock({ vertical, onChange, horizontal = false }: Props) {
  if (horizontal) {
    return (
      <div
        className="glass-strong flex items-center justify-around px-2"
        style={{ paddingTop: 6, paddingBottom: `max(6px, env(safe-area-inset-bottom, 0px))` }}
      >
        {ITEMS.map(({ id, label, Icon, disabled }) => {
          const active = id === vertical
          const off    = disabled || id === null
          return (
            <button
              key={label}
              disabled={off}
              onClick={() => id && onChange(id)}
              className="flex flex-col items-center gap-0.5 rounded-full transition-all duration-200"
              style={{
                opacity:   off ? 0.3 : 1,
                minWidth:  52,
                minHeight: 48,
                padding:   '6px 8px',
                background: active ? 'rgba(47,217,244,0.15)' : 'transparent',
                transform: active ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? '#2fd9f4' : '#859397' }}
              />
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? '#2fd9f4' : '#859397' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="glass flex flex-col gap-1 p-2 rounded-[1.75rem]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
    >
      {ITEMS.map(({ id, label, Icon, disabled }) => {
        const active = id === vertical
        const off    = disabled || id === null
        return (
          <button
            key={label}
            disabled={off}
            onClick={() => id && onChange(id)}
            title={label}
            className="relative flex flex-col items-center gap-1 w-12 py-3 rounded-2xl transition-all duration-200"
            style={{
              opacity:    off ? 0.3 : 1,
              background: active ? 'rgba(47,217,244,0.15)' : 'transparent',
            }}
          >
            <Icon
              size={22}
              strokeWidth={active ? 2 : 1.5}
              style={{ color: active ? '#2fd9f4' : '#859397' }}
            />
            <span
              className="text-[9px] font-semibold tracking-wider uppercase"
              style={{ color: active ? '#2fd9f4' : '#859397' }}
            >
              {label}
            </span>
            {active && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-[#2fd9f4]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
