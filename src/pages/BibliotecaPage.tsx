import { useState } from 'react'
import { useBibliotecaStore } from '../store/useBibliotecaStore'
import { useCharacterStore } from '../store/useCharacterStore'
import { exportToZip } from '../lib/export'
import { CopyButton } from '../components/ui/CopyButton'

export function BibliotecaPage() {
  const { paquetes, remove, updatePublicado } = useBibliotecaStore()
  const { characters } = useCharacterStore()
  const [filter, setFilter] = useState<string>('all')
  const [editingUrl, setEditingUrl] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState('')

  const filtered =
    filter === 'all' ? paquetes : paquetes.filter((p) => p.characterId === filter)

  const getCharacter = (id: string) => {
    return characters.find((c) => c.id === id) ?? null
  }

  const handlePublish = (id: string) => {
    setEditingUrl(id)
    const existing = paquetes.find((p) => p.id === id)
    setUrlValue(existing?.publicadoUrl ?? '')
  }

  const savePublish = (id: string) => {
    updatePublicado(id, true, urlValue || undefined)
    setEditingUrl(null)
  }

  if (paquetes.length === 0) {
    return (
      <div className="empty-page">
        <div className="empty-icon">📁</div>
        <p className="empty-text">No hay paquetes generados aún</p>
        <p className="text-xs text-white/30">Generá contenido desde la pestaña Generar</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Biblioteca</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40">Filtrar:</span>
          <select
            className="input text-sm py-1"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.guion.titulo}</h3>
                <p className="text-xs text-white/40">
                  {p.characterNombre} · {p.params.plataforma} · {p.params.formato} ·{' '}
                  {new Date(p.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.publicado ? (
                  <span className="badge-ok">Publicado</span>
                ) : (
                  <span className="badge-pending">Sin publicar</span>
                )}
              </div>
            </div>

            <p className="text-sm text-white/50 line-clamp-2">{p.guion.descripcion}</p>

            <div className="flex items-center gap-2 flex-wrap">
              <CopyButton text={p.caption} label="Caption" />
              <button
                className="btn-ghost text-xs py-1 px-2"
                onClick={() => {
                  const char = getCharacter(p.characterId)
                  if (char) exportToZip(p, char)
                }}
              >
                <span>📦</span> Re-exportar ZIP
              </button>
              {p.publicado ? (
                <button
                  className="btn-ghost text-xs py-1 px-2 text-brand-400"
                  onClick={() => updatePublicado(p.id, false)}
                >
                  Desmarcar publicado
                </button>
              ) : (
                <button
                  className="btn-ghost text-xs py-1 px-2 text-green-400"
                  onClick={() => handlePublish(p.id)}
                >
                  Marcar publicado
                </button>
              )}
              <button
                className="btn-ghost text-xs py-1 px-2 text-red-400 hover:text-red-300"
                onClick={() => remove(p.id)}
              >
                Eliminar
              </button>
            </div>

            {editingUrl === p.id && (
              <div className="flex gap-2 pt-2 border-t border-white/8">
                <input
                  className="input text-xs flex-1"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="URL de la publicación..."
                />
                <button className="btn-primary text-xs py-1 px-3" onClick={() => savePublish(p.id)}>
                  Guardar
                </button>
                <button
                  className="btn-ghost text-xs py-1 px-3"
                  onClick={() => setEditingUrl(null)}
                >
                  Cancelar
                </button>
              </div>
            )}

            {p.publicado && p.publicadoUrl && (
              <p className="text-xs text-white/30 font-mono truncate">
                🔗 {p.publicadoUrl}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
