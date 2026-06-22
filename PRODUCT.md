# Product

## Register

product

## Users

Gestores públicos municipales de Florianópolis, Brasil. Trabajan en programas sociales (salud mental, empleabilidad, formaciones) y necesitan identificar dónde invertir recursos antes de lanzar políticas. No son técnicos de datos — son tomadores de decisiones que confían en la interfaz para interpretar datos complejos de movilidad CDR. Acceden principalmente desde desktop en contextos de reunión o presentación; ocasionalmente desde móvil. Valoran la claridad y la rapidez para llegar a la conclusión, no la exploración libre de datos.

## Product Purpose

App BiT 64 cruza datos de movilidad CDR (Call Detail Records) de operadoras móviles con indicadores sociales para detectar zonas de exclusión digital en Florianópolis. Permite a gestores públicos identificar clusters urbanos con alta concentración de sesiones 3G (proxy de brecha digital), flujos de movilidad laboral críticos, y población joven sin conectividad adecuada — todo antes de lanzar programas sociales. El éxito es: un gestor llega al mapa, identifica la zona crítica, y puede justificar la decisión con datos concretos en menos de 5 minutos.

## Brand Personality

Claro, directo, confiable. La interfaz no compite con los datos — los presenta. Tono: institucional sin ser burocrático, técnico sin ser hermético. La confianza viene de la precisión, no de la ornamentación.

## Anti-references

- **Templates SaaS genéricos** (clones de Vercel, Linear): sin gradientes morado-azul, sin Inter en todo, sin tarjetas anidadas dentro de tarjetas, sin glassmorphism generalizado como sustituto de diseño real.
- **Dashboards corporativos oscuros** (Grafana, DataDog, AWS Console): evitar la estética de monitoreo industrial — grid denso, colores de alerta en todo, sin jerarquía editorial.
- **Apps de gobierno aburridas**: nada de azul-gris-blanco institucional genérico sin personalidad. El producto es para gobierno pero no tiene que *verse* como gobierno.
- **Cualquier diseño que "grita IA"**: fondo negro puro + único acento cyan + glassmorphism en cada card = cliché. Usar variación, jerarquía, y tipografía con carácter.

## Design Principles

1. **Los datos son el héroe.** La UI retrocede. Los números, mapas y clusters son lo que el gestor vino a ver — la interfaz los encuadra, no los decora.
2. **Claridad antes que novedad.** Cada elemento de diseño debe justificar su presencia con una función de comunicación. Si no comunica nada, sale.
3. **Confianza a través de la precisión.** Tipografía limpia, alineación consistente, densidad apropiada. El gestor confía en la herramienta cuando siente que fue construida con atención.
4. **Jerarquía editorial, no tarjetas.** La jerarquía visual debe guiar al usuario desde lo más crítico hasta el detalle — no aplanar todo en cards del mismo peso.
5. **Institucional sin burocrático.** El tono visual debe sentirse como un informe de política bien diseñado, no como un SaaS de startup ni como un portal de gobierno.

## Accessibility & Inclusion

- WCAG AA mínimo (herramienta de uso público/gubernamental).
- Contraste de texto ≥ 4.5:1 en todos los contextos.
- Reduced motion: todas las animaciones deben tener alternativa sin movimiento.
- Tamaños de fuente legibles sin zoom en pantallas de presentación (14px mínimo body, 12px para labels).
- Sin dependencia de color solo para comunicar información crítica (ej: siempre acompañar color con label o icono en alertas).
