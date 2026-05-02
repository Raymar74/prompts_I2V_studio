import { useState } from 'react'
import { CopyButton } from '../ui/CopyButton'

type OS = 'windows' | 'macos' | 'linux'

interface CommandStep {
  label: string
  cmd: string
}

function detectOS(): OS {
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'windows'
  if (ua.includes('Mac')) return 'macos'
  return 'linux'
}

const setupInstructions: Record<OS, { label: string; commands: CommandStep[] }> = {
  windows: {
    label: 'Windows',
    commands: [
      { label: 'Paso 1: Configurar CORS permanentemente', cmd: 'setx OLLAMA_ORIGINS "*"' },
      { label: 'Paso 2: Reiniciar Ollama', cmd: 'ollama serve' },
    ],
  },
  macos: {
    label: 'macOS',
    commands: [
      { label: 'Paso 1: Configurar CORS permanentemente', cmd: 'echo \'export OLLAMA_ORIGINS="*"\' >> ~/.zshrc && source ~/.zshrc' },
      { label: 'Paso 2: Reiniciar Ollama (si está corriendo)', cmd: 'pkill ollama && ollama serve &' },
    ],
  },
  linux: {
    label: 'Linux',
    commands: [
      { label: 'Paso 1: Configurar CORS permanentemente', cmd: 'echo \'export OLLAMA_ORIGINS="*"\' >> ~/.bashrc && source ~/.bashrc' },
      { label: 'Paso 2: Reiniciar Ollama (si está corriendo)', cmd: 'pkill ollama && ollama serve &' },
    ],
  },
}

interface OllamaSetupPanelProps {
  ollamaUrl: string
  onTest: () => Promise<boolean>
}

export function OllamaSetupPanel({ ollamaUrl, onTest }: OllamaSetupPanelProps) {
  const detectedOS = detectOS()
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<OS>(detectedOS)

  const handleTest = async () => {
    setStatus('checking')
    const result = await onTest()
    setStatus(result ? 'ok' : 'error')
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Configurar Ollama para uso web</h3>
        <p className="text-xs text-white/50">
          Para que la app pueda comunicarse con Ollama desde el navegador, necesitás habilitar CORS.
          <br />
          Solo se hace una vez. Copiá los comandos en tu terminal.
        </p>
      </div>

      <div className="flex gap-2">
        {(['windows', 'macos', 'linux'] as OS[]).map((os) => (
          <button
            key={os}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              activeTab === os
                ? 'border-brand-500 bg-brand-500/10 text-brand-500 font-medium'
                : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
            onClick={() => setActiveTab(os)}
          >
            {setupInstructions[os].label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {setupInstructions[activeTab].commands.map((step, i) => (
          <div key={i} className="space-y-1">
            <p className="text-xs text-white/40">{step.label}</p>
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-white/70 flex-1 break-all select-all">
                {step.cmd}
              </code>
              <CopyButton text={step.cmd} label="Copiar" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t border-white/8">
        <button
          className="btn-secondary w-full justify-center"
          onClick={handleTest}
          disabled={status === 'checking'}
        >
          {status === 'checking'
            ? 'Verificando...'
            : status === 'ok'
              ? '✅ Conexión exitosa'
              : status === 'error'
                ? '❌ No se pudo conectar — Probá de nuevo'
                : 'Probar conexión'}
        </button>
        {status === 'ok' && (
          <p className="text-xs text-green-400 text-center">
            Todo listo. Ya podés cerrar este panel y usar la app normalmente.
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-400 text-center">
            No se pudo conectar. Revisá que Ollama esté corriendo y los comandos se ejecutaron correctamente.
            <br />
            URL: <code className="font-mono">{ollamaUrl}</code>
          </p>
        )}
      </div>
    </div>
  )
}
