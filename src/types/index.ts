export interface Character {
  id: string
  nombre: string
  ocupacion: string
  descripcion: string
  filosofia: string
  frasesCaracteristicas: string[]

  voz: {
    tono: string
    latiguillos: string[]
    muletillas: string[]
    referentes: string[]
    evitar: string[]
    humorIntensidad: number
  }

  produccionVisual: {
    triggerWord: string
    estiloRecurrente: string
    estiloOutfit: string
    expresionesFaciales: string[]
    descripcionVisual: string
    plantillasCamara: string[]
    notasExtra: string
    imagenesBase: string[]
    voiceSampleName?: string
    ttsSpeed: number
    ttsPitch: number
  }
}

export interface Clip {
  numero: number
  duracion: number
  movimientoCamara: string
  textoPantalla: string

  // 4 secciones separadas del prompt I2V (editables individualmente)
  subject: string
  visual: string
  dialogue: string
  audio: string

  segmentoVoz: string
}

export interface Paquete {
  id: string
  characterId: string
  characterNombre: string
  createdAt: string
  params: {
    tema: string
    plataforma: string
    formato: string
    duracionPersonalizada?: number
    humorIntensidad: number
    gancho: string
  }
  guion: {
    titulo: string
    descripcion: string
    hook: string
    desarrollo: string
    punchline: string
    vozCompleta: string
  }
  imagenBasePrompt: string
  clips: Clip[]
  caption: string
  publicado: boolean
  publicadoUrl?: string
}

export interface Settings {
  ollamaUrl: string
  model: string
  temperature: number
  maxTokens: number
}
