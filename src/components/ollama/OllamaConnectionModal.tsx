import { useState, useEffect } from 'react'
import { OllamaSetupPanel } from './OllamaSetupPanel'

interface OllamaConnectionModalProps {
  ollamaUrl: string
  onConnected: () => void
}

async function testConnection(url: string, isDevServer: boolean): Promise<boolean> {
  try {
    const fullUrl = isDevServer ? '/ollama/api/tags' : `${url}/api/tags`
    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export function OllamaConnectionModal({ ollamaUrl, onConnected }: OllamaConnectionModalProps) {
  const [status, setStatus] = useState<'checking' | 'disconnected' | 'connected'>('checking')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const check = async () => {
      const isDevServer = window.location.origin.includes('localhost:5173') ||
        window.location.origin.includes('127.0.0.1:5173')

      const connected = await testConnection(ollamaUrl, isDevServer)
      setStatus(connected ? 'connected' : 'disconnected')
    }
    check()
  }, [ollamaUrl])

  const handleDismiss = () => {
    setDismissed(true)
  }

  const handleTest = async (): Promise<boolean> => {
    const isDevServer = window.location.origin.includes('localhost:5173') ||
      window.location.origin.includes('127.0.0.1:5173')

    const connected = await testConnection(ollamaUrl, isDevServer)
    if (connected) {
      setStatus('connected')
      setTimeout(onConnected, 800)
    }
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
          <p className="text-sm text-white/50">
            La app necesita comunicarse con Ollama para generar contenido.
            <br />
            Si abrís la app desde el navegador, necesitás habilitar CORS en Ollama.
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <OllamaSetupPanel ollamaUrl={ollamaUrl} onTest={handleTest} />
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
