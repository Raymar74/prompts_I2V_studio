# Analia Studio

Generador de contenido para personajes digitales con IA local. Crea guiones, prompts de imagen/video, captions y paquetes de producción listos para exportar — todo corriendo en tu navegador con un LLM local.

## Qué hace

- **Personajes**: Define la identidad, voz y estilo visual de tu personaje digital
- **Guiones**: Genera guiones coherentes con la personalidad del personaje
- **Imagen base**: Prompt SDXL contextualizado al tema del video
- **Clips I2V**: Prompts estructurados en 4 secciones (`[SUBJECT]`, `[VISUAL]`, `[DIALOGUE]`, `[AUDIO]`) listos para copiar/pegar en tu generador de video
- **Captions**: Textos para redes sociales adaptados a cada plataforma
- **Export**: Descarga un ZIP con todo el material de producción organizado

## Stack

| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | Frontend |
| Vite | Build + dev server |
| Tailwind CSS | Estilos |
| Zustand | State management |
| JSZip | Export de paquetes |
| Ollama (llama3.1:8b) | LLM local |

## Requisitos

- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.com/) corriendo localmente con el modelo `llama3.1:8b`

## Instalación

```bash
# Clonar el repo
git clone https://github.com/TU-USUARIO/analía-studio.git
cd analía-studio

# Instalar dependencias
npm install

# Iniciar Ollama (en otra terminal)
ollama run llama3.1:8b

# Iniciar la app en modo desarrollo
npm run dev
```

La app se abre en `http://localhost:5173`.

## Uso rápido

1. **Crear personaje**: Ve a la pestaña "Personaje" y define la ficha completa (identidad, voz, estilo visual)
2. **Generar contenido**: Ve a "Generar", escribe un tema y haz clic en "Generar paquete"
3. **Editar prompts**: En la pestaña "Prompts" puedes editar cada sección individualmente
4. **Exportar**: Descarga el ZIP con todo organizado para tu pipeline de producción

## Pipeline de producción

```
Analia Studio → SDXL (imagen base) → LTX Video (clips I2V) → MuseTalk (lip sync) → FFmpeg (concatenar)
```

La app genera los **prompts y guiones**. Tú los usas en tu generador de imágenes/video favorito (ComfyUI, Automatic1111, etc.).

## Estructura del proyecto

```
src/
├── components/       # UI reutilizable
├── lib/             # Ollama client, export, helpers
├── pages/           # Vistas principales (Generar, Personaje, etc.)
├── store/           # Zustand stores (personajes, biblioteca, settings)
├── types/           # TypeScript interfaces
├── App.tsx          # Router principal
└── main.tsx         # Entry point
```

## Build de producción

```bash
npm run build
```

Genera un single-file HTML en `dist/index.html` que puedes abrir directamente en el navegador (requiere Ollama local con CORS habilitado).

## Configuración de Ollama para uso sin proxy

Si abres el archivo HTML directamente (sin el dev server de Vite), necesitas habilitar CORS en Ollama:

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"
ollama serve
```

**macOS/Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

## Roadmap

- [ ] Auth + cloud sync (Supabase)
- [ ] Templates de personajes precargados
- [ ] Compartir personajes entre usuarios
- [ ] Multi-idioma
- [ ] Preview de imagen desde el navegador
- [ ] Versionado de guiones

## Licencia

MIT — ver [LICENSE](LICENSE) para más detalles.

## Contribuir

1. Fork el repo
2. Crea una rama (`git checkout -b feature/mi-feature`)
3. Commit tus cambios (`git commit -m 'Add mi feature'`)
4. Push a la rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request
