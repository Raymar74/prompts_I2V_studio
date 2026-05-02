import type { Character, Clip } from '../types'

interface OllamaConfig {
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

async function chat(
  config: OllamaConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const isDevServer = window.location.origin.includes('localhost:5173') ||
    window.location.origin.includes('127.0.0.1:5173')

  const url = isDevServer
    ? '/ollama/v1/chat/completions'
    : `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error (${response.status}): ${error}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function parseJSON<T>(raw: string): T {
  let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim()

  let jsonStr = extractJSONBlock(cleaned)
  if (!jsonStr) {
    throw new Error(`No se encontró JSON en la respuesta del modelo.\n\nRespuesta recibida:\n${raw.substring(0, 500)}`)
  }

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // continue to cleanup strategies
  }

  jsonStr = cleanLiteralNewlines(jsonStr)
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // continue
  }

  jsonStr = removeTrailingCommas(jsonStr)
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // continue
  }

  jsonStr = fixUnescapedQuotes(jsonStr)
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // continue
  }

  jsonStr = aggressiveClean(jsonStr)
  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // final attempt
  }

  throw new Error(
    `No se pudo parsear la respuesta JSON del modelo.\n\n` +
    `JSON recibido (primeros 500 chars):\n${jsonStr.substring(0, 500)}\n\n` +
    `Sugerencia: Probá bajar la temperatura en Ajustes (ej: 0.5) o cambiar el modelo.`
  )
}

function extractJSONBlock(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"' && !escape) {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return text.substring(start, i + 1)
      }
    }
  }

  return text.substring(start)
}

function cleanLiteralNewlines(json: string): string {
  return json.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
    return match.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' ')
  })
}

function removeTrailingCommas(json: string): string {
  return json.replace(/,\s*([}\]])/g, '$1')
}

function fixUnescapedQuotes(json: string): string {
  let result = ''
  let inString = false
  let escape = false

  for (let i = 0; i < json.length; i++) {
    const ch = json[i]

    if (escape) {
      result += ch
      escape = false
      continue
    }

    if (ch === '\\') {
      result += ch
      escape = true
      continue
    }

    if (ch === '"') {
      if (!inString) {
        inString = true
        result += ch
      } else {
        const next = json.substring(i + 1).trimStart()
        if (next === '' || next[0] === ':' || next[0] === ',' || next[0] === '}' || next[0] === ']') {
          inString = false
          result += ch
        } else {
          result += '\\"'
        }
      }
      continue
    }

    result += ch
  }

  return result
}

function aggressiveClean(json: string): string {
  json = json.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim()
  
  const extracted = extractJSONBlock(json)
  if (extracted) json = extracted

  json = json.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ')
  json = json.replace(/,\s*([}\]])/g, '$1')

  return json
}

// --- System Prompts ---

function buildGuionSystemPrompt(character: Character): string {
  const v = character.voz
  return `Eres un guionista experto especializado en crear contenido para el personaje digital ${character.nombre}.

═══════════════════════════════════════════
FICHA CANÓNICA DEL PERSONAJE — RESPETALA EN CADA LÍNEA
═══════════════════════════════════════════

IDENTIDAD:
- Nombre: ${character.nombre}
- Ocupación: ${character.ocupacion || 'no especificada'}
- Descripción: ${character.descripcion || 'no especificada'}
- Filosofía/Objetivo: ${character.filosofia || 'no especificada'}
- Frases características: ${character.frasesCaracteristicas.join(', ') || 'ninguna definida'}

VOZ Y PERSONALIDAD:
- Tono de voz: ${v.tono || 'no especificado'}
- Latiguillos: ${v.latiguillos.join(', ') || 'ninguno definido'}
- Muletillas naturales: ${v.muletillas.join(', ') || 'ninguna definida'}
- Referentes de estilo: ${v.referentes.join(', ') || 'ninguno'}
- Palabras/temas a EVITAR: ${v.evitar.join(', ') || 'ninguno'}
- Intensidad de humor: ${v.humorIntensidad}/100

═══════════════════════════════════════════
REGLAS CRÍTICAS DE ESCRITURA
═══════════════════════════════════════════
1. El guión debe sonar EXACTAMENTE como ${character.nombre}, no como un narrador genérico ni una IA
2. Incorporá los latiguillos de forma orgánica, no forzada
3. Respetá la filosofía/objetivo del personaje en cada sección del guión
4. Evitá terminantemente las palabras y temas prohibidos
5. El hook debe enganchar en los primeros 3 segundos
6. Usá las frases características cuando sea natural

IMPORTANTE: Tu respuesta debe ser SOLO un JSON válido. No incluyas texto antes ni después del JSON. No uses markdown code blocks. No uses saltos de línea dentro de los valores de texto. Usa \\n si necesitás saltos de línea.

Estructura exacta del JSON:
{
  "titulo": "título creativo del video",
  "descripcion": "una línea describiendo el concepto",
  "hook": "texto del gancho (0-3s)",
  "desarrollo": "texto del desarrollo central",
  "punchline": "texto del cierre/remate",
  "vozCompleta": "hook + desarrollo + punchline concatenados con espacios, listo para TTS"
}`
}

function buildImagenBasePrompt(character: Character, tema: string): string {
  const pv = character.produccionVisual
  return `Eres un prompt engineer especializado en generación de imágenes con SDXL.

══════════════════════════════════════════
FICHA VISUAL DEL PERSONAJE — RESPETALA
══════════════════════════════════════════

PERSONAJE: ${character.nombre}
- Descripción visual detallada: ${pv.descripcionVisual || 'no especificada'}
- Trigger word LoRA: ${pv.triggerWord || 'character'}
- Estilo base: ${pv.estiloRecurrente || 'no especificado'}
- Estilo de outfit: ${pv.estiloOutfit || 'casual'}
- Expresiones y gestos recurrentes: ${pv.expresionesFaciales.join(', ') || 'ninguno específico'}

══════════════════════════════════════════
CONTEXTO DEL VIDEO
══════════════════════════════════════════
Tema del video: "${tema}"

══════════════════════════════════════════
REGLAS CRÍTICAS
══════════════════════════════════════════
1. El prompt debe describir al personaje EN UNA ESCENA RELACIONADA CON EL TEMA del video
2. El outfit SIEMPRE respeta: "${pv.estiloOutfit || 'casual'}"
3. Incluir detalles de iluminación, composición, fondo relacionado al tema y estilo visual
4. Debe ser un frame estático, pose neutra o ligeramente expresiva (no animar boca)
5. El prompt va en INGLÉS
6. Debe empezar con "${pv.triggerWord || 'character'},"
7. La imagen debe servir como frame base para TODOS los clips del video

IMPORTANTE: Responde SOLO con un JSON válido.

{ "imagenBasePrompt": "prompt completo en inglés para SDXL" }`
}

function buildClipsSystemPrompt(character: Character, clipCount: number, duracionTotal: number): string {
  const pv = character.produccionVisual
  const duracionPorClip = Math.round(duracionTotal / clipCount)
  
  return `Eres un director de fotografía y prompt engineer especializado en IA generativa para video (LTX Video I2V).

══════════════════════════════════════════
FICHA VISUAL DEL PERSONAJE — RESPETALA
══════════════════════════════════════════

PERSONAJE: ${character.nombre}
- Descripción visual detallada: ${pv.descripcionVisual || 'no especificada'}
- Trigger word LoRA: ${pv.triggerWord || 'no definido'}
- Estilo base: ${pv.estiloRecurrente || 'no especificado'}
- Estilo de outfit: ${pv.estiloOutfit || 'casual'}
- Expresiones y gestos recurrentes: ${pv.expresionesFaciales.join(', ') || 'ninguno específico'}
- Plantillas de cámara: ${pv.plantillasCamara.join(', ') || 'estándar'}
${pv.notasExtra ? `- Notas extra: ${pv.notasExtra}` : ''}

══════════════════════════════════════════
REGLAS CRÍTICAS — INNEGOCIABLES
══════════════════════════════════════════
1. El outfit SIEMPRE respeta: "${pv.estiloOutfit || 'casual'}" — NUNCA cambies la ropa
2. Los prompts I2V JAMÁS deben animar la boca, labios, ni mandíbula (MuseTalk controla el lip sync)
3. Los prompts I2V solo pueden animar: movimiento de cabeza, cejas, ojos, hombros, manos, postura
4. El campo [SUBJECT] debe ser consistente en TODOS los clips (misma descripción del personaje)
5. Todos los prompts van en INGLÉS
6. El campo [DIALOGUE] debe incluir SIEMPRE la frase literal del personaje en formato: Subject says: "exact text from the script" — luego agregar la expresión facial/micro-gestos

══════════════════════════════════════════
ESTRUCTURA DEL PROMPT I2V (4 SECCIONES)
══════════════════════════════════════════

Cada clip tiene 4 campos separados que juntos forman el prompt I2V:

[SUBJECT]: Descripción del sujeto/personaje. Debe ser IDENTICA en todos los clips. Ej: "A woman in her 20s with curly brown hair, wearing a black leather jacket, sitting at a desk"

[VISUAL]: Movimiento de cámara, iluminación, ambiente y acción visual. Ej: "Slow push-in camera movement, warm rim lighting from the right, subtle head nod"

[DIALOGUE]: SIEMPRE en este formato: Subject says: "exact text of what the character says in this clip" — luego describe expresión facial y micro-gestos (SIN mencionar movimiento de boca). Ej: "Subject says: 'Did you know that gravity is not actually a force?' — Confident expression with raised eyebrows, eyes locking with the viewer, slight head tilt forward"

[AUDIO]: Contexto sonoro, música de fondo y efectos ambientales. Ej: "Lo-fi hip hop beat playing softly, ambient city noise in the background"

══════════════════════════════════════════
SEGMENTACIÓN DEL GUIÓN
══════════════════════════════════════════
- Dividir el guión completo en exactamente ${clipCount} segmentos
- Cada segmento debe ser de ~28 palabras o menos (lo que cabe en ${duracionPorClip} segundos de habla natural)
- Cortar en pausas naturales (finales de oración, comas, puntos)
- El segmento de voz (segmentoVoz) va en ESPAÑOL, tal cual el guión original

══════════════════════════════════════════
DURACIÓN
══════════════════════════════════════════
- Genera exactamente ${clipCount} clips (numerados del 0 al ${clipCount - 1})
- Cada clip dura ~${duracionPorClip} segundos
- Duración total: ${duracionTotal} segundos
- El clip 0 es el keyframe principal/portada

IMPORTANTE: Tu respuesta debe ser SOLO un JSON válido. No incluyas texto antes ni después. No uses markdown code blocks.

Estructura del JSON:
{
  "clips": [
    {
      "numero": 0,
      "duracion": ${duracionPorClip},
      "movimientoCamara": "nombre del movimiento",
      "textoPantalla": "",
      "subject": "descripción del sujeto en inglés (IDÉNTICA en todos los clips)",
      "visual": "descripción visual en inglés",
      "dialogue": "Subject says: \"texto literal del clip\" — expresión facial en inglés",
      "audio": "descripción de audio en inglés",
      "segmentoVoz": "fragmento exacto del guión en español que corresponde a este clip"
    }
  ]
}`
}

function buildCaptionSystemPrompt(character: Character): string {
  return `Eres el community manager de ${character.nombre}, ${character.ocupacion}.
Escribí captions que sean coherentes con la voz y filosofía del personaje.
Incluí: 1 línea de gancho, descripción breve, hashtags relevantes (8-12).
Tono: ${character.voz.tono || 'natural'}.
Frases del personaje: ${character.frasesCaracteristicas.join(', ') || 'n/a'}.

IMPORTANTE: Responde SOLO con un JSON válido. No incluyas texto antes ni después.

{ "caption": "texto completo del caption" }`
}

// --- Exported Functions ---

export async function generateGuion(
  config: OllamaConfig,
  character: Character,
  params: { tema: string; gancho?: string }
): Promise<{
  titulo: string
  descripcion: string
  hook: string
  desarrollo: string
  punchline: string
  vozCompleta: string
}> {
  const userPrompt = `Tema: "${params.tema}"${params.gancho ? `\nGancho sugerido: "${params.gancho}"` : ''}`

  const raw = await chat(config, buildGuionSystemPrompt(character), userPrompt)
  return parseJSON(raw)
}

export async function generateImagenBasePrompt(
  config: OllamaConfig,
  character: Character,
  tema: string
): Promise<string> {
  const raw = await chat(config, buildImagenBasePrompt(character, tema), `Generá el prompt de imagen base para este personaje en un video sobre: "${tema}".`)
  const data = parseJSON<{ imagenBasePrompt: string }>(raw)
  return data.imagenBasePrompt
}

export async function generateClips(
  config: OllamaConfig,
  character: Character,
  guion: { hook: string; desarrollo: string; punchline: string },
  duracionTotal: number
): Promise<Clip[]> {
  const clipCount = Math.max(3, Math.round(duracionTotal / 11))
  
  const userPrompt = `Guión del video:
HOOK: ${guion.hook}
DESARROLLO: ${guion.desarrollo}
PUNCHLINE: ${guion.punchline}

Distribuye el guión proporcionalmente entre los ${clipCount} clips.
Duración total objetivo: ${duracionTotal} segundos.`

  const raw = await chat(
    config,
    buildClipsSystemPrompt(character, clipCount, duracionTotal),
    userPrompt
  )
  const data = parseJSON<{ clips: Clip[] }>(raw)
  return data.clips
}

export async function generateCaption(
  config: OllamaConfig,
  character: Character,
  guion: { titulo: string; descripcion: string },
  plataforma: string
): Promise<string> {
  const userPrompt = `Video: "${guion.titulo}"\nConcepto: ${guion.descripcion}\nPlataforma: ${plataforma}`

  const raw = await chat(
    config,
    buildCaptionSystemPrompt(character),
    userPrompt
  )
  const data = parseJSON<{ caption: string }>(raw)
  return data.caption
}

/**
 * Segmentación determinista de voz por tiempo.
 * Divide el texto en trozos de ~28 palabras (ritmo normal: 2.5 palabras/seg × 11s).
 * Prioriza cortar en pausas naturales (puntos, comas, signos de puntuación).
 */
export function segmentarVoz(
  vozCompleta: string,
  _duracionTotal: number,
  palabrasPorClip = 28
): string[] {
  const palabras = vozCompleta.split(/\s+/).filter(Boolean)
  const segmentos: string[] = []
  let inicio = 0

  while (inicio < palabras.length) {
    const fin = Math.min(inicio + palabrasPorClip, palabras.length)
    let corte = fin

    // Buscar pausa natural entre inicio y fin (preferir punto, luego coma)
    for (let i = fin - 1; i > inicio; i--) {
      const lastWord = palabras[i]
      if (lastWord.endsWith('.') || lastWord.endsWith('!') || lastWord.endsWith('?') || lastWord.endsWith(':')) {
        corte = i + 1
        break
      }
      if (lastWord.endsWith(',') || lastWord.endsWith(';')) {
        corte = i + 1
        break
      }
    }

    segmentos.push(palabras.slice(inicio, corte).join(' '))
    inicio = corte
  }

  return segmentos
}

/**
 * Ensambla un prompt I2V completo listo para copiar/pegar.
 */
export function ensamblarI2VPrompt(clip: {
  subject?: string
  visual?: string
  dialogue?: string
  audio?: string
}): string {
  const partes: string[] = []
  if (clip.subject) partes.push(`[SUBJECT]: ${clip.subject}`)
  if (clip.visual) partes.push(`[VISUAL]: ${clip.visual}`)
  if (clip.dialogue) partes.push(`[DIALOGUE]: ${clip.dialogue}`)
  if (clip.audio) partes.push(`[AUDIO]: ${clip.audio}`)
  return partes.join('\n\n')
}
