import type { Character, Paquete } from '../types'

export interface CharacterFile {
  type: 'personaje'
  version: 1
  data: Character
  exportedAt: string
}

export interface ProjectFile {
  type: 'proyecto'
  version: 1
  character: Character
  paquetes: Paquete[]
  exportedAt: string
}

type ExportFile = CharacterFile | ProjectFile

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40) || 'sin-nombre'
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportCharacter(character: Character) {
  const safeName = sanitizeName(character.nombre)
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `personaje-${safeName}-${dateStr}.json`

  const file: CharacterFile = {
    type: 'personaje',
    version: 1,
    data: character,
    exportedAt: new Date().toISOString(),
  }

  downloadFile(filename, JSON.stringify(file, null, 2))
  return filename
}

export function exportProject(character: Character, paquetes: Paquete[]) {
  const safeName = sanitizeName(character.nombre)
  const safeTema = paquetes.length > 0
    ? sanitizeName(paquetes[0].guion.titulo)
    : 'proyecto'
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `proyecto-${safeName}-${safeTema}-${dateStr}.json`

  const file: ProjectFile = {
    type: 'proyecto',
    version: 1,
    character,
    paquetes,
    exportedAt: new Date().toISOString(),
  }

  downloadFile(filename, JSON.stringify(file, null, 2))
  return filename
}

export function importFile(file: File): Promise<ExportFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)

        if (!parsed.type || !parsed.version) {
          throw new Error('Formato de archivo no válido')
        }

        if (parsed.type === 'personaje' && parsed.version === 1) {
          if (!parsed.data?.id || !parsed.data?.nombre) {
            throw new Error('El archivo no contiene un personaje válido')
          }
          resolve(parsed as CharacterFile)
        } else if (parsed.type === 'proyecto' && parsed.version === 1) {
          if (!parsed.character?.id || !parsed.character?.nombre) {
            throw new Error('El archivo no contiene un proyecto válido')
          }
          resolve(parsed as ProjectFile)
        } else {
          throw new Error(`Tipo de archivo "${parsed.type}" no soportado o versión ${parsed.version} incompatible`)
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error al leer el archivo'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsText(file)
  })
}

export function getImportSummary(file: ExportFile): string {
  if (file.type === 'personaje') {
    const c = file.data
    return `Personaje: "${c.nombre}" (${c.ocupacion || 'sin ocupación'})`
  }
  const c = file.character
  const pkgCount = file.paquetes.length
  return `Proyecto: "${c.nombre}" — ${pkgCount} paquete${pkgCount !== 1 ? 's' : ''} guardado${pkgCount !== 1 ? 's' : ''}`
}
