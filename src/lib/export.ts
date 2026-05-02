import JSZip from 'jszip'
import type { Character, Paquete } from '../types'
import { ensamblarI2VPrompt } from './ollama'

export async function exportToZip(
  paquete: Paquete,
  character: Character
): Promise<void> {
  const zip = new JSZip()

  const readme = `═══════════════════════════════════════════════════════════
Video: ${paquete.guion.titulo}
Plataforma: ${paquete.params.plataforma} · ${paquete.params.formato}s
Generado: ${paquete.createdAt}

PIPELINE DE PRODUCCIÓN
──────────────────────────────────────────────────────────
1. IMAGEN BASE (SDXL + LoRA)
   → Usa imagen_base.txt como único prompt para la imagen keyframe
   → Trigger word: ${character.produccionVisual.triggerWord}
   → Estilo de outfit: ${character.produccionVisual.estiloOutfit}
   → Descripción visual: ${character.produccionVisual.descripcionVisual}

2. AUDIO (F5-TTS)
   → Usa voz_completa.txt como input
   → O usa los archivos en voz_segmentos/ para sincronizar por clip
   → Velocidad TTS sugerida: ${character.produccionVisual.ttsSpeed}x
   → Sample de voz: ${character.produccionVisual.voiceSampleName ?? 'configura en ficha del personaje'}

3. VÍDEO (LTX I2V) — CLIPS SILENCIOSOS
   → Cada clip tiene 4 secciones: subject, visual, dialogue, audio
   → Prompts individuales en prompts_i2v/ (formato 4 secciones)
   → ⚠️ Generar SIN audio — el audio lo pone MuseTalk
   → Duración por clip en config.json

4. LIP SYNC (MuseTalk en ComfyUI)
   → Input: clip_XX.mp4 (silencioso) + audio_XX.wav
   → Output: clip_XX_lipsynced.mp4

5. CONCATENACIÓN (FFmpeg)
   → ffmpeg -f concat -safe 0 -i lista_clips.txt -c copy output_final.mp4
   → Luego: mezclar con música de fondo (vol -18dB)

CAPTION
──────────────────────────────────────────────────────────
${paquete.caption}
`

  zip.file('README.txt', readme)

  const duracionTotal = paquete.params.formato === 'Personalizado'
    ? paquete.params.duracionPersonalizada
    : parseInt(paquete.params.formato, 10)

  const configJson = {
    personaje: {
      nombre: character.nombre,
      ocupacion: character.ocupacion,
      triggerWord: character.produccionVisual.triggerWord,
    },
    video: {
      plataforma: paquete.params.plataforma,
      duracionTotal: `${duracionTotal}s`,
      totalClips: paquete.clips.length,
      imagenBase: paquete.imagenBasePrompt,
    },
    clips: paquete.clips.map((c) => ({
      numero: c.numero,
      duracion: c.duracion,
      movimientoCamara: c.movimientoCamara,
      textoPantalla: c.textoPantalla || '',
      subject: c.subject || '',
      visual: c.visual || '',
      dialogue: c.dialogue || '',
      audio: c.audio || '',
    })),
    tts: {
      speed: character.produccionVisual.ttsSpeed,
      pitch: character.produccionVisual.ttsPitch,
      voiceSample: character.produccionVisual.voiceSampleName ?? '',
    },
  }
  zip.file('config.json', JSON.stringify(configJson, null, 2))

  zip.file('imagen_base.txt', paquete.imagenBasePrompt)

  const guionText = `GUIÓN: ${paquete.guion.titulo}
${'═'.repeat(60)}
${paquete.guion.descripcion}

── HOOK (0-3s) ──────────────────────────────────────────────
${paquete.guion.hook}

── DESARROLLO ────────────────────────────────────────────────
${paquete.guion.desarrollo}

── PUNCHLINE / CIERRE ────────────────────────────────────────
${paquete.guion.punchline}
`
  zip.file('guion.txt', guionText)
  zip.file('voz_completa.txt', paquete.guion.vozCompleta)
  zip.file('caption.txt', paquete.caption)

  const vozSeg = zip.folder('voz_segmentos')!
  paquete.clips.forEach((clip) => {
    const name =
      clip.numero === 0
        ? '00_portada'
        : `${String(clip.numero).padStart(2, '0')}_clip`
    vozSeg.file(`${name}.txt`, clip.segmentoVoz)
  })

  const promptsI2v = zip.folder('prompts_i2v')!
  const promptsI2vCompletos: string[] = []

  paquete.clips.forEach((clip) => {
    const name =
      clip.numero === 0
        ? '00_portada'
        : `${String(clip.numero).padStart(2, '0')}_clip`

    const fullPrompt = ensamblarI2VPrompt(clip)

    promptsI2v.file(`${name}.txt`, fullPrompt)
    promptsI2vCompletos.push(
      `${'═'.repeat(60)}\nCLIP ${clip.numero} (${clip.duracion}s)\n${'═'.repeat(60)}\n${fullPrompt}\n`
    )
  })

  zip.file('prompts_i2v_completo.txt', promptsI2vCompletos.join('\n'))

  const listaClips = paquete.clips
    .map(
      (clip) =>
        `file '${
          clip.numero === 0
            ? '00_portada'
            : `${String(clip.numero).padStart(2, '0')}_clip`
        }_lipsynced.mp4'\nduration ${clip.duracion}`
    )
    .join('\n')
  zip.file('lista_clips.txt', listaClips)

  const safeName = paquete.guion.titulo
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 40)
  const dateStr = new Date().toISOString().split('T')[0]
  const zipName = `${character.nombre}_${safeName}_${dateStr}.zip`

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  URL.revokeObjectURL(url)
}
