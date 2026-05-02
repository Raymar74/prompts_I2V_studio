import { useSettingsStore } from '../store/useSettingsStore'
import { Field } from '../components/ui/FormField'

const modelOptions: Record<string, string[]> = {
  llama3: ['llama3.1:8b', 'llama3.1:70b', 'llama3:8b', 'llama3:70b'],
  mistral: ['mistral:7b', 'mistral-large'],
  qwen: ['qwen2.5:7b', 'qwen2.5:14b', 'qwen2.5:32b'],
  llava: ['llava:latest', 'llava:7b', 'llava:13b'],
  custom: [],
}

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore()

  const update = (key: string, value: string | number) => {
    updateSettings({ [key]: value })
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="text-sm text-white/40 mt-1">Configuración de Ollama y modelo local</p>
      </div>

      <div className="card p-5 space-y-5">
        <p className="section-title">Conexión Ollama</p>

        <Field label="URL de Ollama" hint="Por defecto: http://localhost:11434">
          <input
            className="input font-mono text-xs"
            value={settings.ollamaUrl}
            onChange={(e) => update('ollamaUrl', e.target.value)}
            placeholder="http://localhost:11434"
          />
        </Field>

        <Field label="Modelo" hint="Modelo descargado en Ollama">
          <input
            className="input font-mono text-xs"
            value={settings.model}
            onChange={(e) => update('model', e.target.value)}
            placeholder="llama3.1:8b"
          />
        </Field>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-white/30 self-center">Sugeridos:</span>
          {modelOptions.llama3.map((m) => (
            <button
              key={m}
              className={`text-xs px-2 py-1 rounded border ${
                settings.model === m
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
              onClick={() => update('model', m)}
            >
              {m}
            </button>
          ))}
          {modelOptions.mistral.map((m) => (
            <button
              key={m}
              className={`text-xs px-2 py-1 rounded border ${
                settings.model === m
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
              onClick={() => update('model', m)}
            >
              {m}
            </button>
          ))}
          {modelOptions.qwen.map((m) => (
            <button
              key={m}
              className={`text-xs px-2 py-1 rounded border ${
                settings.model === m
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
              onClick={() => update('model', m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="border-t border-white/8 pt-4 space-y-4">
          <p className="section-title">Parámetros de generación</p>

          <Field label="Temperatura" hint="Creatividad del modelo (0 = determinista, 1 = más variado)">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.1}
                max={1.5}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => update('temperature', Number(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <span className="text-sm text-white/50 w-10 text-right">
                {settings.temperature}
              </span>
            </div>
          </Field>

          <Field label="Max tokens" hint="Límite de tokens por respuesta">
            <input
              className="input font-mono text-xs"
              type="number"
              min={512}
              max={8192}
              step={256}
              value={settings.maxTokens}
              onChange={(e) => update('maxTokens', Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <p className="section-title">Estado de la conexión</p>
        <button
          className="btn-secondary w-full justify-center"
          onClick={async () => {
            try {
              const isDevServer = window.location.origin.includes('localhost:5173') ||
                window.location.origin.includes('127.0.0.1:5173')
              const url = isDevServer
                ? '/ollama/api/tags'
                : `${settings.ollamaUrl}/api/tags`
              const res = await fetch(url)
              if (res.ok) {
                alert('✅ Ollama está corriendo correctamente')
              } else {
                alert('❌ Ollama respondió con error')
              }
            } catch {
              alert('❌ No se pudo conectar a Ollama. Asegurate de que esté corriendo.')
            }
          }}
        >
          Verificar conexión
        </button>
        <p className="text-xs text-white/30">
          Ollama debe estar ejecutándose en tu máquina para que Studio funcione.
          <br />
          Corré <code className="font-mono">ollama serve</code> si no está activo.
        </p>
      </div>
    </div>
  )
}
