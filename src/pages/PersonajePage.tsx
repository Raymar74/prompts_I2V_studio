import { useState, useRef, useCallback } from 'react'
import { useCharacterStore } from '../store/useCharacterStore'
import { Field, Slider, Tags } from '../components/ui/FormField'

type Section = 'identidad' | 'voz' | 'visual'

const MAX_IMAGES = 4
const MAX_IMAGE_DIM = 512
const IMAGE_QUALITY = 0.7
const LS_WARN_MB = 4

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM) {
          const ratio = Math.min(MAX_IMAGE_DIM / w, MAX_IMAGE_DIM / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas context failed')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY))
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function getLSUsageMB(): number {
  let total = 0
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2
      }
    }
  } catch { /* ignore */ }
  return total / (1024 * 1024)
}

export function PersonajePage() {
  const { getActive, upsert, remove } = useCharacterStore()
  const character = getActive()
  const [section, setSection] = useState<Section>('identidad')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [storageWarning, setStorageWarning] = useState('')

  const update = useCallback((field: string, value: unknown) => {
    if (!character) return
    upsert({ ...character, [field]: value })
  }, [character, upsert])

  const updateVoz = useCallback((field: string, value: unknown) => {
    if (!character) return
    upsert({ ...character, voz: { ...character.voz, [field]: value } })
  }, [character, upsert])

  const updateVisual = useCallback((field: string, value: unknown) => {
    if (!character) return
    upsert({ ...character, produccionVisual: { ...character.produccionVisual, [field]: value } })
  }, [character, upsert])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !character) return
    const current = character.produccionVisual.imagenesBase
    const remaining = MAX_IMAGES - current.length
    if (remaining <= 0) {
      alert(`Máximo ${MAX_IMAGES} imágenes por personaje.`)
      return
    }

    const toProcess = Array.from(files).slice(0, remaining)
    for (const file of toProcess) {
      try {
        const compressed = await compressImage(file)
        const updated = [...character.produccionVisual.imagenesBase, compressed]
        updateVisual('imagenesBase', updated)
        const usage = getLSUsageMB()
        if (usage > LS_WARN_MB) {
          setStorageWarning(`⚠ Almacenamiento local: ${usage.toFixed(1)} MB usado. Podrías tener problemas al guardar.`)
        } else {
          setStorageWarning('')
        }
      } catch (err) {
        console.error('Image compress failed:', err)
        alert(`Error al procesar ${file.name}`)
      }
    }
  }

  const removeImage = (index: number) => {
    if (!character) return
    const updated = character.produccionVisual.imagenesBase.filter((_, i) => i !== index)
    updateVisual('imagenesBase', updated)
    setStorageWarning('')
  }

  if (!character) {
    return (
      <div className="empty-page">
        <div className="empty-icon">🎭</div>
        <p className="empty-text">Seleccioná o creá un personaje desde el panel lateral</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {character.nombre || 'Sin nombre'}
          </h2>
          <p className="text-sm text-white/40">{character.ocupacion || 'Sin ocupación'}</p>
        </div>
        <button
          className="btn-ghost text-xs text-red-400 hover:text-red-300"
          onClick={() => {
            if (confirm('¿Eliminar este personaje?')) remove(character.id)
          }}
        >
          Eliminar
        </button>
      </div>

      {storageWarning && (
        <div className="card p-3 border-l-4 border-l-amber-500 bg-amber-500/5">
          <p className="text-sm text-amber-400">{storageWarning}</p>
        </div>
      )}

      <div className="flex gap-2">
        {(['identidad', 'voz', 'visual'] as Section[]).map((s) => (
          <button
            key={s}
            className={`tab-btn ${section === s ? 'active' : ''}`}
            onClick={() => setSection(s)}
          >
            {s === 'identidad' && 'Identidad'}
            {s === 'voz' && 'Voz y personalidad'}
            {s === 'visual' && 'Producción visual'}
          </button>
        ))}
      </div>

      {/* ==================== IDENTIDAD ==================== */}
      {section === 'identidad' && (
        <div className="card p-5 space-y-4">
          <Field label="Nombre" hint="El nombre que verá el público en los videos">
            <input
              className="input"
              value={character.nombre}
              onChange={(e) => update('nombre', e.target.value)}
              placeholder="Ej: Analía"
            />
          </Field>

          <Field label="Ocupación / Rol" hint="Ej: Profesora de física, YouTuber de tech, Divulgadora">
            <input
              className="input"
              value={character.ocupacion}
              onChange={(e) => update('ocupacion', e.target.value)}
              placeholder="Ej: Profesora de física"
            />
          </Field>

          <Field label="Descripción" hint="Personalidad, historia, qué hace único a este personaje">
            <textarea
              className="input resize-none"
              rows={4}
              value={character.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Analía es una profesora de física con humor negro que explica conceptos complejos usando analogías cotidianas..."
            />
          </Field>

          <Field label="Filosofía / Objetivo" hint="Qué busca lograr con su contenido, su misión, lo que quiere transmitir">
            <textarea
              className="input resize-none"
              rows={4}
              value={character.filosofia}
              onChange={(e) => update('filosofia', e.target.value)}
              placeholder="Desmitificar la física para que cualquiera pueda entenderla. Mostrar que la ciencia no es aburrida..."
            />
          </Field>

          <Field label="Frases características" hint="Frases completas que usa frecuentemente, una por línea">
            <Tags
              value={character.frasesCaracteristicas}
              onChange={(v) => update('frasesCaracteristicas', v)}
              placeholder="Uno por línea"
            />
          </Field>
        </div>
      )}

      {/* ==================== VOZ ==================== */}
      {section === 'voz' && (
        <div className="card p-5 space-y-5">
          <Field label="Tono de voz" hint="Cómo habla el personaje. Ej: Cercano, irónico, con analogías cotidianas">
            <input
              className="input"
              value={character.voz.tono}
              onChange={(e) => updateVoz('tono', e.target.value)}
              placeholder="Ej: Cercano, irónico, con analogías cotidianas"
            />
          </Field>

          <Field label="Latiguillos" hint="Frases recurrentes que identifica al personaje. Ej: '¿me explico?', 'Y aquí viene lo bueno'">
            <Tags
              value={character.voz.latiguillos}
              onChange={(v) => updateVoz('latiguillos', v)}
              placeholder="Uno por línea"
            />
          </Field>

          <Field label="Muletillas" hint="Palabras de relleno naturales que usa al hablar. Ej: 'eh', 'o sea', 'che'">
            <Tags
              value={character.voz.muletillas}
              onChange={(v) => updateVoz('muletillas', v)}
              placeholder="Uno por línea"
            />
          </Field>

          <Field label="Referentes de estilo" hint="Cuentas o creadores de referencia para el tono y estilo del contenido">
            <Tags
              value={character.voz.referentes}
              onChange={(v) => updateVoz('referentes', v)}
              placeholder="Uno por línea"
            />
          </Field>

          <Field label="Palabras / temas a evitar" hint="Cosas que el personaje nunca diría o temas prohibidos">
            <Tags
              value={character.voz.evitar}
              onChange={(v) => updateVoz('evitar', v)}
            />
          </Field>

          <Field label="Intensidad de humor por defecto">
            <Slider
              value={character.voz.humorIntensidad}
              onChange={(v) => updateVoz('humorIntensidad', v)}
              leftLabel="sutil"
              rightLabel="brutal"
            />
          </Field>

          <div className="border-t border-white/8 pt-5 space-y-4">
            <p className="section-title">Configuración TTS (F5-TTS)</p>

            <Field
              label="Sample de voz"
              hint="Archivo .wav de referencia para clonar la voz del personaje"
            >
              <div className="flex gap-2 items-center">
                <span className="text-xs text-white/40 font-mono flex-1 truncate">
                  {character.produccionVisual.voiceSampleName ?? 'Sin sample cargado'}
                </span>
                <label className="btn-ghost text-xs cursor-pointer flex-shrink-0">
                  🎙 Cargar sample
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) updateVisual('voiceSampleName', file.name)
                    }}
                  />
                </label>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Velocidad TTS">
                <Slider
                  value={character.produccionVisual.ttsSpeed}
                  onChange={(v) => updateVisual('ttsSpeed', v)}
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  leftLabel="0.8x"
                  rightLabel="1.2x"
                />
              </Field>

              <Field label="Pitch (semitonos)">
                <Slider
                  value={character.produccionVisual.ttsPitch}
                  onChange={(v) => updateVisual('ttsPitch', v)}
                  min={-10}
                  max={10}
                  step={1}
                  leftLabel="−10"
                  rightLabel="+10"
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRODUCCIÓN VISUAL ==================== */}
      {section === 'visual' && (
        <div className="card p-5 space-y-5">
          <Field label="Trigger word del LoRA" hint="La palabra clave que activa el LoRA del personaje en SDXL">
            <input
              className="input font-mono"
              value={character.produccionVisual.triggerWord}
              onChange={(e) => updateVisual('triggerWord', e.target.value)}
              placeholder="analia_lora"
            />
          </Field>

          <Field label="Estilo recurrente" hint="Descripción general del estilo visual. Ej: photorealistic, cinematic lighting, 4k">
            <input
              className="input"
              value={character.produccionVisual.estiloRecurrente}
              onChange={(e) => updateVisual('estiloRecurrente', e.target.value)}
              placeholder="photorealistic, cinematic lighting, 4k"
            />
          </Field>

          <Field label="Descripción visual detallada" hint="Apariencia física completa: rasgos faciales, cabello, complexión, edad aproximada. Esta descripción se envía al modelo como referencia canónica.">
            <textarea
              className="input resize-none font-mono text-xs"
              rows={5}
              value={character.produccionVisual.descripcionVisual}
              onChange={(e) => updateVisual('descripcionVisual', e.target.value)}
              placeholder="Mujer de 30 años, cabello oscuro ondulado hasta los hombros, ojos marrones, complexión media, piel clara con lunares en la mejilla izquierda..."
            />
          </Field>

          <Field label="Estilo de outfit" hint="Ropa característica del personaje. Se respeta en todos los clips generados">
            <input
              className="input font-mono text-xs"
              value={character.produccionVisual.estiloOutfit}
              onChange={(e) => updateVisual('estiloOutfit', e.target.value)}
              placeholder="Ej: Camisa blanca, blazer negro, gafas de montura negra"
            />
          </Field>

          <Field label="Expresiones faciales y gestos" hint="Gestos típicos que hace al hablar. Ej: levanta una ceja, sonrisa de medio lado, mueve las manos al explicar">
            <Tags
              value={character.produccionVisual.expresionesFaciales}
              onChange={(v) => updateVisual('expresionesFaciales', v)}
              placeholder="Uno por línea"
            />
          </Field>

          <Field
            label="Imágenes de referencia"
            hint={`Imágenes del personaje como referencia visual. Máximo ${MAX_IMAGES}. Se comprimen automáticamente. Se enviarán al modelo cuando uses un LLM con visión.`}
          >
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {character.produccionVisual.imagenesBase.map((img, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                    <img src={img} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-sm font-medium"
                      onClick={() => removeImage(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {character.produccionVisual.imagenesBase.length < MAX_IMAGES && (
                  <button
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 text-white/30 hover:border-brand-500/50 hover:text-brand-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-xs">Subir</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              {character.produccionVisual.imagenesBase.length > 0 && (
                <p className="text-xs text-white/30">
                  {character.produccionVisual.imagenesBase.length}/{MAX_IMAGES} imágenes · Click en una imagen para eliminarla
                </p>
              )}
            </div>
          </Field>

          <Field label="Plantillas de cámara" hint="Movimientos de cámara disponibles para los clips, uno por línea">
            <Tags
              value={character.produccionVisual.plantillasCamara}
              onChange={(v) => updateVisual('plantillasCamara', v)}
              placeholder="slow zoom in&#10;static medium shot&#10;subtle parallax"
            />
          </Field>

          <Field label="Notas extra" hint="Cualquier cosa que la IA deba recordar al generar prompts de imagen y video">
            <textarea
              className="input resize-none"
              rows={2}
              value={character.produccionVisual.notasExtra}
              onChange={(e) => updateVisual('notasExtra', e.target.value)}
              placeholder="Ej: siempre usa gafas de montura negra, cabello oscuro ondulado..."
            />
          </Field>

          <p className="text-center text-xs text-white/20">
            Todo lo que configures aquí se inyecta como contexto canónico en cada generación · Studio
          </p>
        </div>
      )}
    </div>
  )
}
