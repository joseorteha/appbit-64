# App BiT 64 — Frontend

Interfaz web interactiva para visualizar y analizar datos de conectividad, salud mental,
empleabilidad y formaciones en Florianópolis, Brasil.

## Tecnologías

| Tecnología      | Versión  | Propósito                          |
|-----------------|----------|------------------------------------|
| React           | 18       | Biblioteca de UI                   |
| TypeScript      | 5        | Tipado estático                    |
| Vite            | 5        | Bundler y servidor de desarrollo   |
| Tailwind CSS    | 3        | Estilos utilitarios                |
| Leaflet         | 1.9      | Mapa interactivo                   |
| Axios           | 1        | Cliente HTTP                       |
| Lucide React    | latest   | Iconografía                        |

## Estructura del proyecto

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # Cliente axios con interceptores
│   ├── components/
│   │   ├── AIQuery/
│   │   │   └── QueryBar.tsx   # Barra de consultas con IA
│   │   ├── Map/
│   │   │   └── MapView.tsx    # Mapa interactivo Leaflet
│   │   ├── Nav/
│   │   │   └── NavDock.tsx    # Dock de navegación vertical
│   │   ├── Sidebar/
│   │   │   └── VerticalPanel.tsx  # Panel lateral de indicadores
│   │   └── ui/
│   │       ├── Badge.tsx          # Etiqueta de estado
│   │       ├── ErrorBanner.tsx    # Banner de errores de API
│   │       └── LoadingSpinner.tsx # Spinner de carga
│   ├── hooks/
│   │   ├── useAPI.ts          # Hook genérico para peticiones GET
│   │   ├── useDebounce.ts     # Retraso controlado de valores
│   │   ├── useLocalStorage.ts # Persistencia en localStorage
│   │   ├── useMediaQuery.ts   # Detección de breakpoints CSS
│   │   └── useToggle.ts       # Manejo de estados booleanos
│   ├── types/
│   │   └── index.ts           # Tipos e interfaces TypeScript
│   ├── utils/
│   │   ├── errors.ts          # Clase APIError y helper
│   │   └── formatters.ts      # Funciones de formato de datos
│   ├── App.tsx                # Componente raíz de la aplicación
│   ├── constants.ts           # Constantes globales (colores, metas)
│   └── main.tsx               # Punto de entrada
├── public/                    # Recursos estáticos
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview

# Verificar tipos TypeScript
npx tsc --noEmit
```

## Variables de entorno

Crea un archivo `.env` en la raíz de `frontend/` con:

```env
# URL base del backend (por defecto apunta a localhost)
VITE_API_URL=http://localhost:8000
```

## Verticales disponibles

| Vertical        | Descripción                                      |
|-----------------|--------------------------------------------------|
| `salud_mental`  | Indicadores de salud mental por zona de cobertura |
| `empleabilidad` | Métricas de acceso y calidad del empleo           |
| `formaciones`   | Datos de acceso a formación en jóvenes 18–24      |

## Períodos del día

Los datos de concentración pueden filtrarse por:

- **MADRUGADA** — 00:00–06:00
- **MANHA** — 06:00–12:00
- **TARDE** — 12:00–18:00
- **NOITE** — 18:00–00:00

## Conectar con el backend

El frontend se comunica exclusivamente con el backend FastAPI corriendo en `VITE_API_URL`.
Asegúrate de que el backend esté activo antes de iniciar el frontend. Puedes levantarlo con:

```bash
# Desde la raíz del repositorio
docker-compose up backend
```

O directamente desde la carpeta `backend/`:

```bash
cd backend
uvicorn main:app --reload --port 8000
```
