import { useState, useEffect } from 'react'
import { OllamaSetupPanel } from './OllamaSetupPanel'

interface OllamaConnectionModalProps {
  ollamaUrl: string
  onConnected: () => void
}

function detectProtocol(): 'https' | 'http' | 'file' {
  if (window.location.protocol === 'file:') return 'file'
  if (window.location.protocol === 'https:') return 'https'
  return 'http'
}

function isLocalhost(): boolean {
  return window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
}

function isDevServer(): boolean {
  return isLocalhost() && (
    window.location.port === '5173'
  )
}

function isServerCjs(): boolean {
  return isLocalhost() && (
    window.location.port === '8000'
  )
}

async function testConnection(url: string, protocol: string): Promise<boolean> {
  try {
    let fullUrl: string
    if (isDevServer() || isServerCjs()) {
      fullUrl = '/ollama/api/tags'
    } else if (protocol === 'file') {
      fullUrl = `${url}/api/tags`
    } else {
      fullUrl = `${url}/api/tags`
    }
    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

function ConnectionInstructions() {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-yellow-400">Por qué pasa esto</h4>
        <p className="text-xs text-white/60">
          Tu navegador bloquea conexiones desde sitios seguros (HTTPS) hacia tu computadora local (HTTP).
          La solución es correr la app desde un servidor local en tu máquina.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Opción 1: Servidor incluido (recomendado)</h4>
        <div className="space-y-2">
          <p className="text-xs text-white/40">Incluye proxy automático a Ollama. No necesita configuración extra.</p>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
            <code className="text-xs font-mono text-white/70 flex-1 break-all select-all">
              node server.cjs
            </code>
            <button
              className="text-xs text-white/30 hover:text-white/50 px-2 py-1 rounded border border-white/10 transition-colors"
              onClick={() => navigator.clipboard.writeText('node server.cjs')}
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-white/30">
            Abrí <code className="font-mono">http://localhost:8000</code> en tu navegador
          </p>
        </div>
      </div>

      <div className="border-t border-white/8 pt-3 space-y-3">
        <h4 className="text-sm font-semibold">Opción 2: Modo desarrollo</h4>
        <div className="space-y-2">
          <p className="text-xs text-white/40">Requiere Node.js instalado.</p>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
            <code className="text-xs font-mono text-white/70 flex-1 break-all select-all">
              npm run dev
            </code>
            <button
              className="text-xs text-white/30 hover:text-white/50 px-2 py-1 rounded border border-white/10 transition-colors"
              onClick={() => navigator.clipboard.writeText('npm run dev')}
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-white/30">
            Abrí <code className="font-mono">http://localhost:5173</code> en tu navegador
          </p>
        </div>
      </div>

      <div className="border-t border-white/8 pt-3 space-y-3">
        <h4 className="text-sm font-semibold">Opción 3: Configurar CORS en Ollama</h4>
        <div className="space-y-2">
          <p className="text-xs text-white/40">Habilita conexiones directas desde cualquier origen.</p>
          <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
            <code className="text-xs font-mono text-white/70 flex-1 break-all select-all">
              setx OLLAMA_ORIGINS "*"
            </code>
            <button
              className="text-xs text-white/30 hover:text-white/50 px-2 py-1 rounded border border-white/10 transition-colors"
              onClick={() => navigator.clipboard.writeText('setx OLLAMA_ORIGINS "*"')}
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-white/30">
            Luego reiniciá Ollama con <code className="font-mono">ollama serve</code>
          </p>
        </div>
      </div>
    </div>
  )
}

export function OllamaConnectionModal({ ollamaUrl, onConnected: _onConnected }: OllamaConnectionModalProps) {
  const [status, setStatus] = useState<'checking' | 'disconnected' | 'connected'>('checking')
  const [dismissed, setDismissed] = useState(false)
  const protocol = detectProtocol()

  useEffect(() => {
    const check = async () => {
      const connected = await testConnection(ollamaUrl, protocol)
      setStatus(connected ? 'connected' : 'disconnected')
    }
    check()
  }, [ollamaUrl, protocol])

  const handleDismiss = () => {
    setDismissed(true)
  }

  const handleTest = async (): Promise<boolean> => {
    const connected = await testConnection(ollamaUrl, protocol)
    return connected
  }

  if (status === 'connected') {
    return null
  }

  if (dismissed && status === 'disconnected') {
    return null
  }

  if (status === 'checking') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card p-6 max-w-md w-full mx-4 text-center space-y-4">
          <div className="spinner mx-auto" />
          <p className="text-sm text-white/60">Verificando conexión con Ollama...</p>
        </div>
      </div>
    )
  }

  const isRemote = protocol === 'https' || (protocol !== 'file' && !isLocalhost())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card p-6 max-w-lg w-full mx-4 space-y-4 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-lg leading-none"
          onClick={handleDismiss}
          title="Cerrar (la app funcionará igual, pero puede que no pueda conectarse a Ollama)"
        >
          ×
        </button>

        <div className="space-y-2">
          <div className="text-3xl">🔌</div>
          <h2 className="text-lg font-semibold">No se detectó Ollama</h2>
          {isRemote ? (
            <p className="text-sm text-white/50">
              La app se carga desde un sitio seguro (HTTPS). Los navegadores bloquean conexiones a tu Ollama local por seguridad.
              Necesitás correr la app desde un servidor local.
            </p>
          ) : (
            <p className="text-sm text-white/50">
              La app necesita comunicarse con Ollama para generar contenido.
              Seguí las instrucciones de abajo para configurar la conexión.
            </p>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          {isRemote ? (
            <ConnectionInstructions />
          ) : (
            <OllamaSetupPanel ollamaUrl={ollamaUrl} onTest={handleTest} />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <button
            className="text-xs text-white/30 hover:text-white/50"
            onClick={handleDismiss}
          >
            Cerrar (usar de todos modos)
          </button>
        </div>
      </div>
    </div>
  )
}
