import type { Vertical } from '../../types'

interface NavItem {
  id: Vertical | null
  label: string
  sublabel: string
  icon: string
  disabled?: boolean
}

const ITEMS: NavItem[] = [
  { id: 'salud_mental',  label: 'Salud',     sublabel: 'Mental',    icon: '❤️‍🩹' },
  { id: 'empleabilidad', label: 'Empleo',    sublabel: 'Trabajo',   icon: '💼' },
  { id: 'formaciones',   label: 'Formación', sublabel: 'Tech',      icon: '📚' },
  { id: null,            label: 'Mentorías', sublabel: 'Próx.',     icon: '🤝', disabled: true },
  { id: null,            label: 'Experi.',   sublabel: 'Próx.',     icon: '⭐', disabled: true },
]

interface Props {
  vertical: Vertical
  onChange: (v: Vertical) => void
  horizontal?: boolean
}

export default function NavDock({ vertical, onChange, horizontal = false }: Props) {
  if (horizontal) {
    return (
      <div className="glass-strong flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {ITEMS.map((item) => {
          const active = item.id === vertical
          const disabled = item.disabled || item.id === null
          return (
            <button
              key={item.label}
              disabled={disabled}
              onClick={() => item.id && onChange(item.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              style={{ opacity: disabled ? 0.35 : 1 }}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? '#2fd9f4' : '#859397' }}
              >
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#2fd9f4]" />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Desktop: vertical pill dock
  return (
    <div
      className="glass flex flex-col gap-1 p-2 rounded-[1.75rem]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
    >
      {ITEMS.map((item) => {
        const active = item.id === vertical
        const disabled = item.disabled || item.id === null
        return (
          <button
            key={item.label}
            disabled={disabled}
            onClick={() => item.id && onChange(item.id)}
            title={item.label}
            className="relative flex flex-col items-center gap-1 w-12 py-3 rounded-2xl transition-all group"
            style={{
              opacity: disabled ? 0.3 : 1,
              background: active ? 'rgba(47,217,244,0.15)' : 'transparent',
            }}
          >
            <span className="text-2xl leading-none">{item.icon}</span>
            <span
              className="text-[9px] font-semibold tracking-wider uppercase"
              style={{ color: active ? '#2fd9f4' : '#859397' }}
            >
              {item.label}
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
