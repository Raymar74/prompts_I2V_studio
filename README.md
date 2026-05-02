# Analia Studio

> Generador de contenido para personajes digitales con IA local

Crea guiones, prompts de imagen/video, captions y paquetes de producción listos para exportar — todo corriendo en tu navegador con un LLM local.

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Raymar74/prompts_I2V_studio/deploy.yml?label=build&logo=github)
![License](https://img.shields.io/github/license/Raymar74/prompts_I2V_studio)

---

## ¿Qué es?

Analia Studio te permite definir la personalidad y estilo visual de un personaje digital, y luego genera automáticamente guiones coherentes con esa voz, prompts de imagen (SDXL) y video (LTX I2V) estructurados y listos para usar en tu pipeline de producción.

## ✨ Features

| Feature | Descripción |
|---|---|
| **Personajes** | Ficha completa: identidad, voz, estilo visual |
| **Guiones** | Generados con la personalidad del personaje |
| **Imagen base** | Prompt SDXL contextualizado al tema del video |
| **Clips I2V** | 4 secciones editables (`[SUBJECT]`, `[VISUAL]`, `[DIALOGUE]`, `[AUDIO]`) |
| **Captions** | Adaptados a cada plataforma (Reel, TikTok, Short, YouTube) |
| **Export ZIP** | Todo el material de producción organizado |
| **Guardar/Cargar** | Archivos JSON para backup y portabilidad |
| **Drag & Drop** | Arrastrá archivos `.json` para cargar |
| **100% local** | Tu IA corre en tu máquina, sin APIs externas |

## 🚀 Inicio rápido (3 pasos)

### Paso 1: Instalar Ollama

```powershell
# Descargar e instalar desde https://ollama.com
# Luego descargar el modelo:
ollama pull llama3.1:8b
```

### Paso 2: Configurar CORS (una sola vez)

```powershell
setx OLLAMA_ORIGINS "*"
ollama serve
```

### Paso 3: Usar la app

**Opción A — GitHub Pages (sin instalar nada):**
Abrí https://raymar74.github.io/prompts_I2V_studio/

**Opción B — Servidor local (si GitHub Pages no conecta):**
```bash
git clone https://github.com/Raymar74/prompts_I2V_studio.git
cd prompts_I2V_studio
npm install
node server.cjs
# Abrir http://localhost:8000
```

## 📖 Manual completo

Guía paso a paso con ejemplos reales usando el personaje Analía:

→ **[docs/manual.md](docs/manual.md)**

Incluye:
- Cómo crear tu primer personaje
- Cómo generar contenido
- Cómo editar prompts I2V
- Cómo guardar y cargar proyectos
- Pipeline completo de producción
- Resolución de problemas

## 🛠 Para desarrolladores

### Stack

| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | Frontend |
| Vite | Build + dev server |
| Tailwind CSS | Estilos |
| Zustand | State management |
| JSZip | Export de paquetes |
| Ollama (llama3.1:8b) | LLM local |

### Instalación

```bash
git clone https://github.com/Raymar74/prompts_I2V_studio.git
cd prompts_I2V_studio
npm install
npm run dev
# Abrir http://localhost:5173
```

### Build de producción

```bash
npm run build
# Genera dist/index.html (single-file, ~320KB)
```

### Estructura del proyecto

```
src/
├── components/
│   ├── layout/       # Sidebar
│   ├── ollama/       # Modal y panel de conexión a Ollama
│   └── ui/           # Botones, campos de formulario
├── lib/
│   ├── ollama.ts     # Cliente Ollama, parser JSON, segmentación de voz
│   ├── export.ts     # Generador de ZIP de producción
│   └── file-io.ts    # Export/import de personajes y proyectos
├── pages/            # Vistas principales
├── store/            # Zustand stores
├── types/            # TypeScript interfaces
├── App.tsx           # App principal
└── main.tsx          # Entry point
```

### Cómo contribuir

1. Fork el repo
2. Creá una rama (`git checkout -b feature/mi-feature`)
3. Commit tus cambios (`git commit -m 'Add mi feature'`)
4. Push a la rama (`git push origin feature/mi-feature`)
5. Abrí un Pull Request

## 📄 Licencia

[MIT](LICENSE)

## 🗺 Roadmap

- [ ] Auth + cloud sync (Supabase)
- [ ] Templates de personajes precargados
- [ ] Compartir personajes entre usuarios
- [ ] Multi-idioma UI
- [ ] Preview de imagen desde el navegador
- [ ] Versionado de guiones

---

Hecho con ❤️ para creadores de contenido con IA.
