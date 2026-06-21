/**
 * Genera los iconos PNG del PWA a partir del SVG fuente.
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = join(__dir, '..')
const svg   = readFileSync(join(root, 'public', 'icon.svg'))

const icons = [
  { size: 192, out: 'icon-192.png' },
  { size: 512, out: 'icon-512.png' },
  { size: 180, out: 'apple-touch-icon.png' },
  { size: 32,  out: 'favicon-32.png' },
]

for (const { size, out } of icons) {
  await sharp(svg).resize(size, size).png().toFile(join(root, 'public', out))
  console.log(`✓ ${out} (${size}x${size})`)
}
console.log('Iconos generados en public/')
