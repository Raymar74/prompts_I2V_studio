import { useCharacterStore } from '../../store/useCharacterStore'
import { useBibliotecaStore } from '../../store/useBibliotecaStore'
import { useCallback, useRef, useState, DragEvent } from 'react'
import { importFile, getImportSummary } from '../../lib/file-io'
import type { CharacterFile, ProjectFile } from '../../lib/file-io'
import type { Paquete } from '../../types'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onShowConnection: () => void
}

export function Sidebar({ activePage, onNavigate, onShowConnection }: SidebarProps) {
  const { characters, activeId, setActive, upsert, createBlank } =
    useCharacterStore()
  const { add: addPaquete } = useBibliotecaStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeCharacter =
    characters.find((c) => c.id === activeId) || null

  const [dragOver, setDragOver] = useState(false)
  const [importError, setImportError] = useState('')

  const handleNew = useCallback(() => {
    const blank = createBlank()
    upsert(blank)
  }, [createBlank, upsert])

  const handleFile = async (file: File) => {
    setImportError('')
    try {
      const parsed = await importFile(file)
      const summary = getImportSummary(parsed)

      if (parsed.type === 'personaje') {
        const cf = parsed as CharacterFile
        upsert(cf.data)
      } else if (parsed.type === 'proyecto') {
        const pf = parsed as ProjectFile
        upsert(pf.character)
        pf.paquetes.forEach((p: Paquete) => addPaquete(p))
        setActive(pf.character.id)
      }

      alert(`✅ ${summary}`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al cargar el archivo')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      handleFile(file)
    } else if (file) {
      setImportError('Solo se aceptan archivos .json')
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo-text">
          <span className="logo-icon">◆</span> Studio
        </h1>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activePage === 'generar' ? 'active' : ''}`}
          onClick={() => onNavigate('generar')}
        >
          <span className="nav-icon">⚡</span> Generar
        </button>
        <button
          className={`nav-item ${activePage === 'personaje' ? 'active' : ''}`}
          onClick={() => onNavigate('personaje')}
        >
          <span className="nav-icon">🎭</span> Personaje
        </button>
        <button
          className={`nav-item ${activePage === 'biblioteca' ? 'active' : ''}`}
          onClick={() => onNavigate('biblioteca')}
        >
          <span className="nav-icon">📁</span> Biblioteca
        </button>
        <button
          className={`nav-item ${activePage === 'ajustes' ? 'active' : ''}`}
          onClick={() => onNavigate('ajustes')}
        >
          <span className="nav-icon">⚙️</span> Ajustes
        </button>
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-characters">
        <div className="characters-header">
          <span className="characters-label">Personajes</span>
          <button className="btn-add" onClick={handleNew} title="Nuevo personaje">
            +
          </button>
        </div>

        {characters.length === 0 && (
          <p className="empty-hint">No hay personajes. Creá uno o cargá un archivo guardado.</p>
        )}

        {characters.map((char) => (
          <button
            key={char.id}
            className={`char-item ${activeId === char.id ? 'active' : ''}`}
            onClick={() => setActive(char.id)}
          >
            <div className="char-avatar">
              {char.nombre ? char.nombre.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="char-info">
              <div className="char-name">{char.nombre || 'Sin nombre'}</div>
              <div className="char-role">{char.ocupacion || 'Sin ocupación'}</div>
            </div>
          </button>
        ))}
      </div>

      {dragOver && (
        <div
          className="sidebar-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <p className="text-xs text-white/50">Soltá el archivo aquí</p>
        </div>
      )}

      {importError && (
        <div className="sidebar-error">
          <p className="text-xs text-red-400">{importError}</p>
          <button
            className="text-xs text-white/30 hover:text-white/50"
            onClick={() => setImportError('')}
          >
            ✕
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        {activeCharacter && (
          <div className="active-character">
            <span className="status-dot" />
            <span className="active-name">{activeCharacter.nombre}</span>
          </div>
        )}
        <button
          className="btn-connection"
          onClick={onShowConnection}
          title="Verificar conexión con Ollama"
        >
          <span className="nav-icon">🔌</span> Conexión
        </button>
        <button
          className="btn-load"
          onClick={() => fileInputRef.current?.click()}
          title="Cargar personaje desde archivo JSON"
        >
          <span className="nav-icon">📂</span> Cargar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    </aside>
  )
}
