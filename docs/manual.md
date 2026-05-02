# Manual de uso — Analia Studio

Guía completa para usar Analia Studio, desde la instalación hasta generar tu primer video con IA.

---

## Índice

1. [Primeros pasos](#1-primeros-pasos)
2. [Crear tu primer personaje](#2-crear-tu-primer-personaje)
3. [Generar contenido](#3-generar-contenido)
4. [Editar prompts I2V](#4-editar-prompts-i2v)
5. [Guardar y cargar proyectos](#5-guardar-y-cargar-proyectos)
6. [Pipeline de producción](#6-pipeline-de-producción)
7. [Resolución de problemas](#7-resolución-de-problemas)
8. [Ejemplo completo: de cero a ZIP](#8-ejemplo-completo-de-cero-a-zip)

---

## 1. Primeros pasos

### 1.1 Instalar Ollama

Ollama es el motor de IA local que genera los guiones y prompts.

1. Descargá Ollama desde https://ollama.com
2. Instalalo como cualquier programa
3. Abrí una terminal (PowerShell en Windows) y ejecutá:

```powershell
ollama pull llama3.1:8b
```

Esto descarga el modelo de IA (unos 4.7 GB). Solo se hace una vez.

### 1.2 Configurar CORS

Para que la app pueda comunicarse con Ollama desde el navegador:

```powershell
setx OLLAMA_ORIGINS "*"
```

Luego reiniciá Ollama:

```powershell
ollama serve
```

Esto se hace **una sola vez**. Después Ollama recordará la configuración.

### 1.3 Abrir la app

Tenés tres opciones:

| Método | Comando | URL | Cuándo usarlo |
|---|---|---|---|
| **GitHub Pages** | Ninguno | https://raymar74.github.io/prompts_I2V_studio/ | Uso rápido, sin instalar nada |
| **Servidor local** | `node server.cjs` | http://localhost:8000 | Si GitHub Pages no conecta con Ollama |
| **Modo desarrollo** | `npm run dev` | http://localhost:5173 | Si estás modificando el código |

**Recomendación:** Si Ollama está configurado correctamente con CORS, usá GitHub Pages. Si no, usá `node server.cjs`.

### 1.4 Verificar la conexión

Al abrir la app, aparece un modal que verifica automáticamente si Ollama está corriendo. Si lo detecta, el modal se cierra solo. Si no, muestra instrucciones para configurarlo.

Para verificar manualmente, andá a **Ajustes** → **Verificar conexión**.

---

## 2. Crear tu primer personaje

El personaje es la base de todo: su personalidad, voz y estilo visual determinan cómo se genera cada guión y prompt.

### 2.1 Crear un personaje nuevo

1. En el panel lateral izquierdo, hacé clic en el botón **+** (al lado de "Personajes")
2. Se crea un personaje vacío y se abre automáticamente
3. Hacé clic en la pestaña **Personaje** en el menú principal

### 2.2 La ficha del personaje

La ficha tiene 3 secciones:

#### Identidad

| Campo | Qué es | Ejemplo (Analía) |
|---|---|---|
| **Nombre** | Cómo se llama el personaje | `Analía` |
| **Ocupación / Rol** | Qué hace o a qué se dedica | `Profesora de física` |
| **Descripción** | Personalidad, historia, qué la hace única | `Analía es una profesora de física con humor negro y sarcasmo. Explica conceptos complejos usando analogías cotidianas y un tono directo, como si le hablara a un amigo.` |
| **Filosofía / Objetivo** | Qué busca lograr con su contenido | `Desmitificar la física para que cualquiera pueda entenderla. Mostrar que la ciencia no es aburrida y que todos podemos ser curiosos.` |
| **Frases características** | Frases que usa frecuentemente (una por línea) | `"¿Me explico?"`<br>`"Y aquí viene lo bueno"`<br>`"No es magia, es física"` |

#### Voz y personalidad

| Campo | Qué es | Ejemplo |
|---|---|---|
| **Tono de voz** | Cómo habla | `Cercano, irónico, con analogías cotidianas. Usa ejemplos de la vida diaria para explicar conceptos abstractos.` |
| **Latiguillos** | Frases recurrentes que la identifican | `¿Me explico?`<br>`Mirá...` |
| **Muletillas** | Palabras de relleno naturales | `eh`<br>`o sea`<br>`che` |
| **Referentes de estilo** | Cuentas o creadores similares | `Kurzgesagt`<br>`Veritasium` |
| **Palabras/temas a evitar** | Lo que NUNCA diría | `fórmulas matemáticas complejas`<br>`jerga académica` |
| **Intensidad de humor** | Slider de sutil a brutal | `65` (bastante humorístico) |

#### Producción visual

| Campo | Qué es | Ejemplo |
|---|---|---|
| **Trigger word del LoRA** | Palabra clave que activa el LoRA en SDXL | `analia_lora` |
| **Estilo recurrente** | Estilo visual general | `photorealistic, cinematic lighting, 4k, portrait photography` |
| **Descripción visual** | Apariencia física detallada (va al prompt) | `Woman in her 30s, shoulder-length wavy dark brown hair, warm brown eyes, medium build, light skin with small moles on left cheek, wearing a white shirt and black blazer, sitting at a desk` |
| **Estilo de outfit** | Ropa característica (se respeta siempre) | `White shirt, black blazer, black-framed glasses` |
| **Expresiones faciales** | Gestos típicos al hablar | `Raises one eyebrow when skeptical`<br>`Smiles slightly before explaining`<br>`Gestures with hands when enthusiastic` |
| **Plantillas de cámara** | Movimientos de cámara disponibles | `slow zoom in`<br>`static medium shot`<br>`subtle parallax` |

### 2.3 Tips

- **Sé específico** en la descripción visual. Cuanto más detallada, más consistente será la imagen generada.
- **El trigger word** debe coincidir con el que usaste al entrenar tu LoRA en SDXL.
- **Las muletillas y latiguillos** le dan naturalidad al guión. No los omitas.

---

## 3. Generar contenido

Una vez que tenés un personaje creado, podés generar guiones y prompts.

### 3.1 El formulario de generación

Andá a la pestaña **Generar** y completá:

| Campo | Qué es | Ejemplo |
|---|---|---|
| **Tema o idea** | De qué trata el video | `¿Por qué la gravedad no es una fuerza sino una curvatura del espacio-tiempo?` |
| **Plataforma** | Dónde se va a publicar | `Reel` (Instagram), `TikTok`, `Short` (YouTube), `YouTube` |
| **Duración** | Cuánto dura el video | `30s`, `45s`, `60s`, `90s`, o `Personalizar` (elegís los segundos exactos) |
| **Intensidad de humor** | Override del valor del personaje | Ajustá el slider si querés más o menos humor que lo normal |
| **Gancho sugerido** | Frase inicial opcional | `"Esto te va a volar la cabeza"` |

### 3.2 El proceso de generación

Al hacer clic en **Generar paquete**, la app hace esto:

1. **Genera el guión** (hook, desarrollo, punchline) adaptado al personaje
2. **Genera el prompt de imagen base** (SDXL) contextualizado al tema
3. **Genera los clips I2V** (4 secciones por clip) con la segmentación de voz
4. **Genera el caption** para la plataforma elegida

El proceso tarda entre 30 segundos y 2 minutos dependiendo del modelo y la PC.

### 3.3 Los resultados

Después de generar, aparecieron 4 pestañas:

#### Guión

Muestra el guión completo dividido en 3 partes:

- **HOOK** (0-3 segundos): El gancho que captura la atención
- **DESARROLLO**: El contenido principal
- **PUNCHLINE**: El cierre o remate

Podés copiar el texto completo de la voz con el botón **Voz completa**.

#### Prompts

Aquí es donde está todo el material para generar el video:

**Imagen base (SDXL):**
Un bloque con el prompt completo para generar la imagen del personaje. Clic en **Copiar** y pegalo en tu generador de imágenes (SDXL, ComfyUI, etc.).

**Clips I2V:**
Cada clip muestra:

1. **Prompt I2V completo** — Las 4 secciones ensambladas, listo para copiar y pegar en tu generador de video
2. **Secciones editables** — Cada una de las 4 secciones se puede editar individualmente:
   - `[SUBJECT]` — Descripción del personaje (consistente en todos los clips)
   - `[VISUAL]` — Movimiento de cámara, iluminación, ambiente
   - `[DIALOGUE]` — Texto literal del personaje + expresión facial
   - `[AUDIO]` — Música de fondo y efectos sonoros
3. **Texto de voz** — El fragmento del guión que corresponde a ese clip

#### Caption

El texto para publicar en la plataforma elegida, con hashtags incluidos.

#### Export

Botón para descargar un **ZIP de producción** con todo el material organizado.

---

## 4. Editar prompts I2V

Cada sección del prompt I2V es editable. Esto es útil cuando querés ajustar algo sin regenerar todo.

### 4.1 Cuándo editar

| Situación | Qué ajustar |
|---|---|
| El personaje se ve diferente en un clip | Modificar `[SUBJECT]` para que coincida con los demás |
| Querés un movimiento de cámara diferente | Modificar `[VISUAL]` |
| El texto del diálogo no te convence | Modificar `[DIALOGUE]` (la parte después de "Subject says:") |
| Querés cambiar la música de fondo | Modificar `[AUDIO]` |

### 4.2 Formato de [DIALOGUE]

Siempre debe incluir el texto literal del personaje:

```
Subject says: "texto exacto que dice el personaje en este clip" — descripción de la expresión facial en inglés
```

Ejemplo:
```
Subject says: "¿Sabías que la gravedad no es una fuerza?" — Confident expression with raised eyebrows, eyes locking with the viewer, slight head tilt forward
```

### 4.3 Copiar el prompt completo

Cada clip tiene un botón **Copiar I2V** que copia las 4 secciones ensambladas, listas para pegar en tu generador de video.

---

## 5. Guardar y cargar proyectos

### 5.1 Guardar un personaje

En la pestaña **Personaje**, hacé clic en **💾 Guardar** (en el header, junto a Eliminar).

Se descarga un archivo `personaje-analia-2026-05-02.json` con toda la ficha del personaje.

### 5.2 Guardar un proyecto completo

Después de generar contenido, andá a la pestaña **Export** y hacé clic en **📂 Guardar proyecto (JSON)**.

Se descarga un archivo `proyecto-analia-por-que-la-gravedad-2026-05-02.json` con:
- La ficha completa del personaje
- Todos los guiones generados
- Los clips con sus prompts

### 5.3 Cargar un personaje o proyecto

Tenés dos formas:

**Opción A: Botón Cargar**
1. Hacé clic en **📂 Cargar** en el footer del panel lateral
2. Seleccioná el archivo `.json`
3. Confirmá y el personaje/proyecto se carga automáticamente

**Opción B: Drag & Drop**
1. Arrastrá el archivo `.json` sobre el panel lateral
2. Soltalo y se carga automáticamente

### 5.4 Cuándo guardar

| Situación | Guardá... |
|---|---|
| Terminaste de configurar un personaje | Personaje (JSON) |
| Generaste un video que te gustó | Proyecto completo (JSON) |
| Vas a cambiar de PC o limpiar el navegador | Ambos |
| Querés compartir tu personaje con alguien | Personaje (JSON) |

---

## 6. Pipeline de producción

La app genera los **prompts y guiones**. El pipeline real para crear el video es:

```
Analia Studio
    ↓ (prompt de imagen)
SDXL + LoRA → imagen_base.png
    ↓ (imagen base + prompt I2V)
LTX Video / LTX-Video → clip_01.mp4, clip_02.mp4, ...
    ↓ (clip silencioso + audio TTS)
MuseTalk → clip_01_lipsynced.mp4, clip_02_lipsynced.mp4, ...
    ↓ (concatenar clips)
FFmpeg → video_final.mp4
```

### 6.1 Paso 1: Generar la imagen base

1. Copiá el prompt de imagen base desde la pestaña **Prompts**
2. Usalo en SDXL, ComfyUI, o tu generador favorito
3. Guardá la imagen como `imagen_base.png`

### 6.2 Paso 2: Generar los clips de video

Para cada clip:

1. Copiá el prompt I2V completo (botón **Copiar I2V**)
2. Usá la misma imagen base (`imagen_base.png`) como input
3. Generá el clip con LTX Video o similar
4. Guardá como `clip_01.mp4`, `clip_02.mp4`, etc.

### 6.3 Paso 3: Generar el audio (TTS)

1. Copiá el texto de `voz_completa.txt` (incluido en el ZIP)
2. Usá F5-TTS o tu generador de voz preferido
3. Podés generar todo el audio junto o por segmentos (en `voz_segmentos/`)

### 6.4 Paso 4: Lip sync

1. Usá MuseTalk en ComfyUI
2. Input: cada clip silencioso + su audio correspondiente
3. Output: clips con lip sync sincronizado

### 6.5 Paso 5: Concatenar

Usá el archivo `lista_clips.txt` del ZIP con FFmpeg:

```bash
ffmpeg -f concat -safe 0 -i lista_clips.txt -c copy video_final.mp4
```

---

## 7. Resolución de problemas

### "No se detectó Ollama"

**Causa:** La app no puede comunicarse con Ollama.

**Soluciones:**

1. **Verificá que Ollama esté corriendo:**
   ```powershell
   ollama serve
   ```

2. **Verificá que CORS esté habilitado:**
   ```powershell
   setx OLLAMA_ORIGINS "*"
   ```
   Luego reiniciá Ollama.

3. **Si usás GitHub Pages y no conecta:**
   Usá el servidor local en su lugar:
   ```powershell
   node server.cjs
   ```
   Y abrís http://localhost:8000

4. **Verificá la conexión manualmente:**
   Ajustes → Verificar conexión

### "Error al generar" / "No se pudo parsear JSON"

**Causa:** El modelo de IA devolvió una respuesta malformada.

**Soluciones:**

1. **Bajá la temperatura** en Ajustes (probá con 0.5)
2. **Usá un modelo más grande** (ej: `llama3.1:70b` en vez de `llama3.1:8b`)
3. **Reintentá** — a veces el modelo responde bien en el segundo intento

### "Los campos de texto no admiten espacios"

**Causa:** El modal de conexión está bloqueando la interacción.

**Solución:** Hacé clic en la **×** del modal o en "Cerrar (usar de todos modos)". El modal se recordará cerrado y no volverá a aparecer.

### "El ZIP se descarga vacío"

**Causa:** No se generó contenido todavía.

**Solución:** Primero generá un paquete completo desde la pestaña **Generar**.

### "Las imágenes no se guardan"

**Causa:** localStorage del navegador tiene un límite de ~5MB.

**Soluciones:**

1. **Exportá el personaje como JSON** para tener un backup
2. **Eliminá imágenes de referencia** que no necesites (máximo 4 por personaje)
3. **Usá imágenes de menor resolución** (la app ya las comprime automáticamente)

### "Los clips no tienen consistencia visual"

**Causa:** El campo `[SUBJECT]` varía entre clips.

**Solución:** Editá manualmente el campo `[SUBJECT]` de cada clip para que sea idéntico. El primer clip suele tener la descripción más completa — copiala y pegala en los demás.

---

## 8. Ejemplo completo: de cero a ZIP

Vamos a crear un video de Analía explicando la gravedad.

### Paso 1: Crear el personaje

1. Clic en **+** en el panel lateral
2. Andá a la pestaña **Personaje**
3. Completá la ficha:

**Identidad:**
- Nombre: `Analía`
- Ocupación: `Profesora de física`
- Descripción: `Profesora de física con humor negro que explica conceptos complejos usando analogías cotidianas y un tono directo.`
- Filosofía: `Desmitificar la física para que cualquiera pueda entenderla.`
- Frases características: `¿Me explico?` / `Y aquí viene lo bueno` / `No es magia, es física`

**Voz:**
- Tono: `Cercano, irónico, con analogías cotidianas`
- Latiguillos: `¿Me explico?` / `Mirá...`
- Muletillas: `eh` / `o sea`
- Intensidad de humor: `65`

**Visual:**
- Trigger word: `analia_lora`
- Estilo: `photorealistic, cinematic lighting, 4k`
- Descripción visual: `Woman in her 30s, shoulder-length wavy dark brown hair, warm brown eyes, medium build, light skin with small moles on left cheek, wearing a white shirt and black blazer`
- Outfit: `White shirt, black blazer, black-framed glasses`
- Expresiones: `Raises one eyebrow when skeptical` / `Smiles slightly before explaining`

### Paso 2: Generar contenido

1. Andá a la pestaña **Generar**
2. Completá:
   - Tema: `¿Por qué la gravedad no es una fuerza sino una curvatura del espacio-tiempo?`
   - Plataforma: `Reel`
   - Duración: `30s`
   - Humor: `65`
3. Clic en **Generar paquete**
4. Esperá 30-60 segundos

### Paso 3: Revisar y ajustar

1. Andá a la pestaña **Guión** — revisá que el contenido suene como Analía
2. Andá a **Prompts** — revisá la imagen base y los clips
3. Si algún `[SUBJECT]` es diferente, ajustalo para que sea consistente
4. Si algún `[DIALOGUE]` no te convence, modificalo

### Paso 4: Guardar

1. Clic en **💾 Guardar** en la pestaña Personaje → se descarga `personaje-analia-2026-05-02.json`
2. Andá a **Export** → clic en **📂 Guardar proyecto (JSON)** → se descarga el proyecto completo

### Paso 5: Exportar el ZIP

1. Andá a **Export** → clic en **Descargar ZIP de producción**
2. Se descarga `Analía_Porque_la_gravedad_2026-05-02.zip`

### Paso 6: Usar el ZIP en tu pipeline

El ZIP contiene:

```
Analía_Porque_la_gravedad_2026-05-02.zip
├── README.txt              # Instrucciones del pipeline
├── config.json             # Configuración del video
├── imagen_base.txt         # Prompt para SDXL
├── guion.txt               # Guión completo
├── voz_completa.txt        # Todo el texto para TTS
├── caption.txt             # Texto para publicar
├── prompts_i2v/            # Prompts I2V por clip
│   ├── 00_portada.txt
│   ├── 01_clip.txt
│   ├── 02_clip.txt
│   └── ...
├── voz_segmentos/          # Textos de voz por clip
│   ├── 00_portada.txt
│   ├── 01_clip.txt
│   └── ...
└── lista_clips.txt         # Lista para FFmpeg
```

Seguí las instrucciones del `README.txt` para generar el video completo.

---

## Atajos y consejos rápidos

| Acción | Cómo |
|---|---|
| Crear personaje | Panel lateral → **+** |
| Guardar personaje | Personaje → **💾 Guardar** |
| Cargar personaje | Panel lateral → **📂 Cargar** o arrastrar archivo |
| Guardar proyecto | Generar → tab Export → **📂 Guardar proyecto** |
| Descargar ZIP | Generar → tab Export → **Descargar ZIP** |
| Verificar conexión | Ajustes → **Verificar conexión** |
| Reabrir modal de conexión | Panel lateral → **🔌 Conexión** |
| Cambiar personaje | Panel lateral → clic en el nombre del personaje |
| Eliminar personaje | Personaje → **Eliminar** |
