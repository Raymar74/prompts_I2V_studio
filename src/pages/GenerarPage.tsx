import { useState, useRef, useCallback } from 'react'
import { useCharacterStore } from '../store/useCharacterStore'
import { useBibliotecaStore } from '../store/useBibliotecaStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { generateGuion, generateClips, generateCaption, generateImagenBasePrompt, ensamblarI2VPrompt, segmentarVoz, analizarImagenBase, type ImagenAnalizada } from '../lib/ollama'
import { exportToZip } from '../lib/export'
import { exportProject } from '../lib/file-io'
import { CopyButton } from '../components/ui/CopyButton'
import type { Paquete, Clip } from '../types'

type Step = 'idle' | 'generating-guion' | 'review-guion' | 'generating-prompts' | 'done' | 'error'
type ResultTab = 'guion' | 'prompts' | 'caption' | 'export'

const plataformas = ['Reel', 'TikTok', 'Short', 'YouTube']
const formatosPreset = ['30s', '45s', '60s', '90s']

export function GenerarPage() {
  const { getActive } = useCharacterStore()
  const { add } = useBibliotecaStore()
  const { settings } = useSettingsStore()
  const character = getActive()

  const [form, setForm] = useState({
    tema: '',
    plataforma: 'Reel',
    formato: '30s',
    duracionPersonalizada: 45,
    humorIntensidad: character?.voz.humorIntensidad ?? 50,
    gancho: '',
  })

  const [step, setStep] = useState<Step>('idle')
  const [resultTab, setResultTab] = useState<ResultTab>('guion')
  const [error, setError] = useState('')
  const [paquete, setPaquete] = useState<Paquete | null>(null)

  const [draftGuion, setDraftGuion] = useState<{
    titulo: string
    descripcion: string
    hook: string
    desarrollo: string
    punchline: string
    vozCompleta: string
  } | null>(null)

  const [draftImagenPrompt, setDraftImagenPrompt] = useState('')
  const [draftImagenBase64, setDraftImagenBase64] = useState<string | null>(null)
  const [draftImagenAnalizada, setDraftImagenAnalizada] = useState<ImagenAnalizada | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!character) {
    return (
      <div className="empty-page">
        <div className="empty-icon">🎭</div>
        <p className="empty-text">Primero creá un personaje en la pestaña Personaje</p>
      </div>
    )
  }

  const updateForm = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const getDuracionTotal = () => {
    if (form.formato === 'Personalizado') {
      return form.duracionPersonalizada
    }
    return parseInt(form.formato, 10)
  }

  const getOllamaConfig = () => ({
    baseUrl: settings.ollamaUrl,
    model: settings.model,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  })

  const getGuionFromState = () => {
    if (!draftGuion) throw new Error('No hay guion generado')
    return {
      titulo: draftGuion.titulo,
      descripcion: draftGuion.descripcion,
      hook: draftGuion.hook,
      desarrollo: draftGuion.desarrollo,
      punchline: draftGuion.punchline,
      vozCompleta: draftGuion.vozCompleta,
    }
  }

  const buildVozCompleta = () => {
    if (!draftGuion) return ''
    return `${draftGuion.hook} ${draftGuion.desarrollo} ${draftGuion.punchline}`.trim()
  }

  const handleGenerateGuion = async () => {
    if (!form.tema.trim()) return
    setStep('generating-guion')
    setError('')
    setDraftGuion(null)
    setDraftImagenPrompt('')
    setDraftImagenBase64(null)
    setDraftImagenAnalizada(null)
    setIsAnalyzing(false)

    try {
      const config = getOllamaConfig()
      const guion = await generateGuion(config, character, {
        tema: form.tema,
        gancho: form.gancho || undefined,
      })
      setDraftGuion(guion)

      const imagenBasePrompt = await generateImagenBasePrompt(config, character, form.tema)
      setDraftImagenPrompt(imagenBasePrompt)

      setStep('review-guion')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setStep('error')
      setError(msg)
    }
  }

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      setDraftImagenBase64(base64)
      setDraftImagenAnalizada(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleAnalyzeImage = async () => {
    if (!draftImagenBase64) return
    setIsAnalyzing(true)
    setError('')

    try {
      const config = getOllamaConfig()
      const analyzed = await analizarImagenBase(config, draftImagenBase64)
      setDraftImagenAnalizada(analyzed)
      setIsAnalyzing(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al analizar imagen'
      setStep('error')
      setError(msg)
    }
  }

  const handleUpdateGuionField = (field: string, value: string) => {
    if (!draftGuion) return
    setDraftGuion(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const handleGenerateClips = async () => {
    if (!draftGuion) return
    setStep('generating-prompts')
    setError('')

    try {
      const config = getOllamaConfig()
      const duracionTotal = getDuracionTotal()
      const clipCount = Math.max(3, Math.min(6, Math.round(duracionTotal / 11)))

      const vozCompleta = buildVozCompleta()
      const segmentosVoz = segmentarVoz(vozCompleta, clipCount)

      const clipsFromLLM = await generateClips(
        config,
        character,
        segmentosVoz,
        duracionTotal,
        draftImagenPrompt,
        draftImagenAnalizada || undefined
      )

      const clips = segmentosVoz.map((segmento, i) => {
        const llmClip = clipsFromLLM[i] || {
          subject: '',
          visual: '',
          dialogue: '',
          audio: '',
          movimientoCamara: 'Static shot',
          textoPantalla: '',
        }
        return {
          numero: i,
          duracion: Math.round(duracionTotal / segmentosVoz.length),
          movimientoCamara: llmClip.movimientoCamara,
          textoPantalla: llmClip.textoPantalla || '',
          subject: llmClip.subject || '',
          visual: llmClip.visual || '',
          dialogue: llmClip.dialogue || '',
          audio: llmClip.audio || '',
          segmentoVoz: segmento,
        }
      })

      const guionFinal = getGuionFromState()
      const caption = await generateCaption(config, character, guionFinal, form.plataforma)

      const nuevoPaquete: Paquete = {
        id: crypto.randomUUID(),
        characterId: character.id,
        characterNombre: character.nombre,
        createdAt: new Date().toISOString(),
        params: { ...form },
        guion: guionFinal,
        imagenBasePrompt: draftImagenPrompt,
        clips,
        caption,
        publicado: false,
      }

      add(nuevoPaquete)
      setPaquete(nuevoPaquete)
      setStep('done')
      setResultTab('guion')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setStep('error')
      setError(msg)
    }
  }

  const updateClipField = (clipIndex: number, field: keyof Clip, value: string | number) => {
    if (!paquete) return
    const updated = { ...paquete }
    updated.clips = updated.clips.map((c, i) =>
      i === clipIndex ? { ...c, [field]: value } : c
    )
    setPaquete(updated)
  }

  if (step === 'error') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="card p-5 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error al generar</h3>
          <p className="text-white/50 text-sm mb-4">{error}</p>
          <p className="text-xs text-white/30 mb-4">
            Asegurate de que Ollama esté corriendo ({settings.ollamaUrl}) y el modelo{' '}
            <code className="font-mono">{settings.model}</code> esté descargado.
          </p>
          <button className="btn-primary" onClick={() => setStep('idle')}>
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  const p = paquete

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              ¿Qué explica hoy{' '}
              <span className="text-brand-500">{character.nombre}</span>?
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              Imagen base · Guión · Prompts I2V · Caption · Export
            </p>
          </div>
          {step === 'done' && (
            <button className="btn-primary" onClick={() => { setStep('idle'); setPaquete(null); }}>
              Generar otro
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="label">Tema o idea</label>
          <textarea
            className="input"
            rows={3}
            value={form.tema}
            onChange={(e) => updateForm('tema', e.target.value)}
            placeholder="Ej: ¿Por qué la gravedad no es una fuerza sino una curvatura?"
            disabled={step !== 'idle' && step !== 'done'}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="label">Plataforma</label>
            <select
              className="input"
              value={form.plataforma}
              onChange={(e) => updateForm('plataforma', e.target.value)}
              disabled={step !== 'idle' && step !== 'done'}
            >
              {plataformas.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label">Duración</label>
            <select
              className="input"
              value={form.formato}
              onChange={(e) => updateForm('formato', e.target.value)}
              disabled={step !== 'idle' && step !== 'done'}
            >
              {formatosPreset.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="Personalizado">Personalizar...</option>
            </select>
            {form.formato === 'Personalizado' && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  className="input w-20"
                  min={15}
                  max={180}
                  value={form.duracionPersonalizada}
                  onChange={(e) => updateForm('duracionPersonalizada', Number(e.target.value))}
                  disabled={step !== 'idle' && step !== 'done'}
                />
                <span className="text-xs text-white/40">segundos</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label">Intensidad de humor</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={form.humorIntensidad}
              onChange={(e) => updateForm('humorIntensidad', Number(e.target.value))}
              className="flex-1 accent-brand-500"
              disabled={step !== 'idle' && step !== 'done'}
            />
            <span className="text-sm text-white/50 w-8 text-right">{form.humorIntensidad}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label">Gancho sugerido (opcional)</label>
          <input
            className="input"
            value={form.gancho}
            onChange={(e) => updateForm('gancho', e.target.value)}
            placeholder='Ej: "Esto te va a volar la cabeza"'
            disabled={step !== 'idle' && step !== 'done'}
          />
        </div>

        {step === 'idle' && (
          <button
            className="btn-primary w-full justify-center"
            onClick={handleGenerateGuion}
            disabled={!form.tema.trim()}
          >
            Generar guión
          </button>
        )}

        {step === 'generating-guion' && (
          <div className="flex items-center gap-3 justify-center py-4">
            <div className="spinner" />
            <span className="text-sm text-white/60">Generando guión y prompt de imagen...</span>
          </div>
        )}
      </div>

      {step === 'review-guion' && draftGuion && (
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-brand-500">Revisión del guión</h3>
              <p className="text-xs text-white/40 mt-0.5">Editá si es necesario, cargá la imagen base y aprobá para generar los clips</p>
            </div>
            <button className="btn-secondary text-sm" onClick={() => { setStep('idle'); }}>
              ← Volver al form
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="label">Título</label>
              <input className="input" value={draftGuion.titulo} onChange={(e) => handleUpdateGuionField('titulo', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="label">Descripción</label>
              <input className="input" value={draftGuion.descripcion} onChange={(e) => handleUpdateGuionField('descripcion', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="label">HOOK (0-3s)</label>
              <textarea className="input" rows={2} value={draftGuion.hook} onChange={(e) => handleUpdateGuionField('hook', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="label">DESARROLLO</label>
              <textarea className="input" rows={4} value={draftGuion.desarrollo} onChange={(e) => handleUpdateGuionField('desarrollo', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="label">PUNCHLINE</label>
              <textarea className="input" rows={2} value={draftGuion.punchline} onChange={(e) => handleUpdateGuionField('punchline', e.target.value)} />
            </div>
            <div className="border border-brand-500/30 rounded-lg p-4 space-y-2 bg-brand-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-400 font-semibold">VOZ COMPLETA (para TTS)</span>
                <CopyButton text={buildVozCompleta()} label="Copiar" />
              </div>
              <p className="text-xs text-white/60 font-mono break-words">{buildVozCompleta()}</p>
            </div>
          </div>

          <div className="border border-white/8 rounded-lg p-4 space-y-3 bg-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30 font-semibold">PROMPT DE IMAGEN BASE</span>
              <CopyButton text={draftImagenPrompt} label="Copiar" />
            </div>
            <p className="text-xs text-white/60 font-mono break-words">{draftImagenPrompt}</p>
          </div>

          <div className="border border-white/8 rounded-lg p-4 space-y-3">
            <span className="text-xs text-white/30 font-semibold">IMAGEN BASE</span>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {draftImagenBase64 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img src={`data:image/jpeg;base64,${draftImagenBase64}`} alt="Imagen base" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                  <div className="space-y-1">
                    <p className="text-xs text-green-400">Imagen cargada</p>
                    <div className="flex gap-2">
                      <button className="text-xs text-brand-400 hover:text-brand-300 underline" onClick={() => fileInputRef.current?.click()}>Cambiar</button>
                      {!draftImagenAnalizada && (
                        <button className="text-xs text-brand-400 hover:text-brand-300 underline" onClick={handleAnalyzeImage}>Analizar con IA</button>
                      )}
                    </div>
                  </div>
                </div>
                {draftImagenAnalizada && (
                  <div className="space-y-2 text-xs bg-green-500/10 border border-green-500/20 rounded p-3">
                    <p className="text-green-400 font-semibold">Análisis de imagen</p>
                    <p><span className="text-white/40">Subject:</span> <span className="text-white/60 font-mono">{draftImagenAnalizada.subject}</span></p>
                    <p><span className="text-white/40">Outfit:</span> <span className="text-white/60 font-mono">{draftImagenAnalizada.outfit}</span></p>
                    <p><span className="text-white/40">Entorno:</span> <span className="text-white/60 font-mono">{draftImagenAnalizada.entorno}</span></p>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="spinner" />
                    <span className="text-xs text-white/60">Analizando imagen...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-brand-500/30 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <p className="text-sm text-white/40">Arrastrá una imagen o hacé click para cargar</p>
                <p className="text-xs text-white/30 mt-1">PNG, JPG, WEBP</p>
              </div>
            )}
          </div>

          <div className="border border-white/8 rounded-lg p-4 space-y-2 bg-white/5">
            <p className="text-xs text-white/30">Estimación de clips</p>
            <p className="text-sm text-white/60">
              {buildVozCompleta().split(/\s+/).filter(Boolean).length} palabras →{' '}
              <strong className="text-brand-400">{Math.max(3, Math.min(6, Math.round(getDuracionTotal() / 11)))} clips</strong> de ~{Math.round(getDuracionTotal() / Math.max(3, Math.min(6, Math.round(getDuracionTotal() / 11))))}s
            </p>
          </div>

          <button className="btn-primary w-full justify-center" onClick={handleGenerateClips} disabled={isAnalyzing}>
            {isAnalyzing ? 'Analizando...' : 'Aprobar y generar clips'}
          </button>
        </div>
      )}

      {step === 'generating-prompts' && (
        <div className="card p-5">
          <div className="flex items-center gap-3 justify-center py-4">
            <div className="spinner" />
            <span className="text-sm text-white/60">Generando prompts I2V y caption...</span>
          </div>
        </div>
      )}

      {p && step === 'done' && (
        <div className="card p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['guion', 'prompts', 'caption', 'export'] as ResultTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${resultTab === tab ? 'active' : ''}`}
                  onClick={() => setResultTab(tab)}
                >
                  {tab === 'guion' && 'Guión'}
                  {tab === 'prompts' && 'Prompts'}
                  {tab === 'caption' && 'Caption'}
                  {tab === 'export' && 'Export'}
                </button>
              )
            )}
          </div>

          {resultTab === 'guion' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-brand-500 font-semibold">{p.guion.titulo}</h3>
                <CopyButton text={p.guion.vozCompleta} label="Voz completa" />
              </div>
              <p className="text-sm text-white/50 italic">{p.guion.descripcion}</p>
              <div className="space-y-2 text-sm">
                <div className="result-block">
                  <span className="result-label">HOOK</span>
                  <p>{p.guion.hook}</p>
                </div>
                <div className="result-block">
                  <span className="result-label">DESARROLLO</span>
                  <p>{p.guion.desarrollo}</p>
                </div>
                <div className="result-block">
                  <span className="result-label">PUNCHLINE</span>
                  <p>{p.guion.punchline}</p>
                </div>
              </div>
            </div>
          )}

          {resultTab === 'prompts' && (
            <div className="space-y-4">
              <div className="border border-brand-500/30 rounded-lg p-4 space-y-2 bg-brand-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-400 font-semibold">IMAGEN BASE (SDXL) — Copiar y pegar en tu generador</span>
                  <CopyButton text={p.imagenBasePrompt} label="Copiar" />
                </div>
                <p className="text-xs text-white/60 font-mono break-words">{p.imagenBasePrompt}</p>
              </div>

              {p.clips.map((clip, idx) => {
                const i2vEnsamblado = ensamblarI2VPrompt(clip)
                return (
                  <div key={clip.numero} className="border border-white/8 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/30 font-mono">
                        CLIP {clip.numero} · {clip.duracion}s · {clip.movimientoCamara}
                      </span>
                      <CopyButton text={i2vEnsamblado} label="Copiar I2V" />
                    </div>

                    {clip.textoPantalla && (
                      <p className="text-xs text-white/40">
                        Texto en pantalla: {clip.textoPantalla}
                      </p>
                    )}

                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-brand-400 font-semibold">PROMPT I2V COMPLETO — Listo para copiar</span>
                      </div>
                      <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-words">{i2vEnsamblado}</pre>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-white/30 font-semibold uppercase tracking-wide">[SUBJECT]</label>
                        <textarea
                          className="input mt-1 text-xs font-mono"
                          rows={2}
                          value={clip.subject || ''}
                          onChange={(e) => updateClipField(idx, 'subject', e.target.value)}
                          placeholder="Describe the subject/character..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/30 font-semibold uppercase tracking-wide">[VISUAL]</label>
                        <textarea
                          className="input mt-1 text-xs font-mono"
                          rows={2}
                          value={clip.visual || ''}
                          onChange={(e) => updateClipField(idx, 'visual', e.target.value)}
                          placeholder="Camera movement, lighting, action..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/30 font-semibold uppercase tracking-wide">[DIALOGUE]</label>
                        <textarea
                          className="input mt-1 text-xs font-mono"
                          rows={2}
                          value={clip.dialogue || ''}
                          onChange={(e) => updateClipField(idx, 'dialogue', e.target.value)}
                          placeholder="Subject says: &quot;texto...&quot; — facial expression..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/30 font-semibold uppercase tracking-wide">[AUDIO]</label>
                        <textarea
                          className="input mt-1 text-xs font-mono"
                          rows={2}
                          value={clip.audio || ''}
                          onChange={(e) => updateClipField(idx, 'audio', e.target.value)}
                          placeholder="Background music, SFX, ambient..."
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-white/30">Voz:</span>{' '}
                      <span className="text-white/60">{clip.segmentoVoz}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {resultTab === 'caption' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-mono">
                  {p.params.plataforma}
                </span>
                <CopyButton text={p.caption} />
              </div>
              <p className="text-sm whitespace-pre-wrap">{p.caption}</p>
            </div>
          )}

          {resultTab === 'export' && (
            <div className="text-center space-y-4 py-4">
              <div className="text-3xl">📦</div>
              <h3 className="font-semibold">Paquete listo para exportar</h3>
              <p className="text-sm text-white/40">
                Se descargará un ZIP con imagen base, guión, prompts I2V estructurados, caption y lista FFmpeg.
              </p>
              <button
                className="btn-primary w-full justify-center"
                onClick={() => exportToZip(p, character)}
              >
                Descargar ZIP de producción
              </button>
              <div className="border-t border-white/8 pt-4 space-y-3">
                <p className="text-xs text-white/30">
                  ¿Querés guardar este proyecto para recuperarlo después?
                </p>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={() => {
                    const filename = exportProject(character, [p])
                    alert(`✅ Proyecto guardado como "${filename}"`)
                  }}
                >
                  📂 Guardar proyecto (JSON)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
