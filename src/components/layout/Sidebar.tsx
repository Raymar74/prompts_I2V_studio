import { useCharacterStore } from '../../store/useCharacterStore'
import { useCallback } from 'react'

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  onShowConnection: () => void
}

export function Sidebar({ activePage, onNavigate, onShowConnection }: SidebarProps) {
  const { characters, activeId, setActive, createBlank, upsert } =
    useCharacterStore()
  const activeCharacter =
    characters.find((c) => c.id === activeId) || null

  const handleNew = useCallback(() => {
    const blank = createBlank()
    upsert(blank)
  }, [createBlank, upsert])

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
          <p className="empty-hint">No hay personajes. Creá uno para empezar.</p>
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
      </div>
    </aside>
  )
}
