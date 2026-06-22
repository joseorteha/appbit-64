# Design

## Color

### Surfaces

| Token          | Value       | Usage                                      |
|----------------|-------------|--------------------------------------------|
| `--bg`         | `#0e1012`   | Canvas/page background (cool dark, not pure black) |
| `--bg-raised`  | `#161a1c`   | Elevated surfaces, sidebars                |
| `--bg-card`    | `#1b1f21`   | Cards, panels (solid — no blur/glass)      |
| `--bg-hover`   | `#202426`   | Interactive surface on hover               |
| `--border`     | `rgba(255,255,255,0.07)` | Default borders                |
| `--border-hi`  | `rgba(255,255,255,0.12)` | Focused / hover borders        |

### Text

| Token           | Value     | Usage                                  |
|-----------------|-----------|----------------------------------------|
| `--text`        | `#dde4e6` | Primary body text (not pure white)     |
| `--text-dim`    | `#7a8c91` | Secondary, labels, supporting info     |
| `--text-muted`  | `#3f5258` | Placeholder, disabled, dividers        |

### Accent

| Token           | Value     | Usage                                                    |
|-----------------|-----------|----------------------------------------------------------|
| `--cyan`        | `#2fd9f4` | Primary action, active states, current nav, data accent  |
| `--cyan-on`     | `#003640` | Text on cyan background                                  |
| `--cyan-dim`    | `rgba(47,217,244,0.1)` | Cyan background tint for hover/selected    |

### Semantic (data + alerts)

| Token     | Value     | Usage                                      |
|-----------|-----------|--------------------------------------------|
| `--red`   | `#ef4444` | Error, CRÍTICO alerts, 3G exclusión        |
| `--amber` | `#f59e0b` | Warning, ALTO alerts, flujos, 4G           |
| `--yellow`| `#eab308` | MEDIO alerts                               |
| `--green` | `#22c55e` | Success, status activo, 5G coverage        |
| `--gray`  | `#9ca3af` | BAJO alerts, neutral indicators            |

**Color rule**: Accent (`--cyan`) on primary actions, current selection, and data focus only. Never decoration. Semantic colors are for data states only — never surface decoration.

## Typography

### Font stacks

```css
font-family: 'Space Grotesk', system-ui, sans-serif;  /* UI — all labels, body, headings */
font-family: 'DM Mono', ui-monospace, monospace;        /* Data — metrics, cluster names, percentages, code */
```

Single family (Space Grotesk) carries all UI text. DM Mono is reserved strictly for numbers, metrics, cluster identifiers, and code.

### Scale (fixed rem, not fluid)

| Role           | Size    | Weight | Tracking      | Line height |
|----------------|---------|--------|---------------|-------------|
| Page title     | 1.25rem | 600    | -0.02em       | 1.3         |
| Section title  | 1rem    | 600    | -0.015em      | 1.35        |
| Card title     | 0.875rem| 600    | -0.01em       | 1.4         |
| Body           | 0.875rem| 400    | -0.01em       | 1.6         |
| Label/eyebrow  | 0.625rem| 700    | +0.08em (UC)  | 1           |
| Data metric    | varies  | 500    | -0.03em (mono)| 1           |
| Data small     | 0.75rem | 400    | 0             | 1.4         |

**Bans**: No display fonts in labels, buttons, or data fields. No `clamp()` on product UI headings. Labels are always uppercase + tracked, never mixed case.

## Components

### Cards

Solid surface, no backdrop-filter/blur (glassmorphism reserved ONLY for map overlays).

```css
.card {
  background: #1b1f21;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 20px;
}
.card:hover (interactive) {
  border-color: rgba(255,255,255,0.12);
  transition: border-color 180ms ease-out;
}
```

**Never**: nested cards, `backdrop-filter: blur()` on page cards.

### Glass (map-only)

```css
.glass {
  background: rgba(22,26,28,0.82);
  backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.07);
}
```

Reserved for floating elements on top of the Mapbox canvas only.

### Buttons

```css
/* Primary */
background: #2fd9f4; color: #003640; font-weight: 600;
border-radius: 9999px; padding: 8px 20px;
transition: opacity 150ms, transform 150ms;
hover: opacity 0.88, translateY(-1px);

/* Ghost */
background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65);
border-radius: 9999px;
hover: background rgba(255,255,255,0.11), color #fff;
```

### Severity badges

```
CRÍTICO  bg rgba(239,68,68,0.12)   text #ef4444   border rgba(239,68,68,0.25)
ALTO     bg rgba(245,158,11,0.10)  text #f59e0b   border rgba(245,158,11,0.20)
MEDIO    bg rgba(234,179,8,0.08)   text #eab308   border rgba(234,179,8,0.18)
BAJO     bg rgba(107,114,128,0.08) text #9ca3af   border rgba(107,114,128,0.18)
```

### Navigation

- Desktop: fixed top bar h-14, `rgba(14,16,18,0.88)` + blur(24px), border-bottom solid 1px
- Active link: `color #2fd9f4` + `background rgba(47,217,244,0.08)`, border-radius 8px
- Inactive link: `color #7a8c91`
- Mobile: fixed bottom tab bar, same surface treatment

### Data labels (eyebrow)

```css
font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
text-transform: uppercase; color: #7a8c91;
```

## Motion

- Default transitions: 180ms ease-out (border, color, opacity changes)
- Interactive feedback: 150ms ease-out
- Nothing above 250ms on product UI interactions
- `prefers-reduced-motion`: instant (no transition)
- **Bans**: no page-load sequences, no choreography on navigation, no decorative motion

## Spacing

Using 4px base grid. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 48px. Cards always 20px internal padding. Page gutter: 16px mobile / 32px desktop.

## Iconography

Lucide icons, strokeWidth 1.5 for structural/nav, strokeWidth 2 for status/severity. Size: 13–14px nav, 16px section headers, 18–20px mobile nav, 28–32px empty states.

## Z-index scale

```
100  map canvas
200  map controls overlay
300  period selector
400  floating panels (QueryBar, VerticalPanel, legend)
500  AppNav (always on top)
600  loading overlay
```
