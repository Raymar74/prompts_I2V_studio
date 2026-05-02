const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 8000
const OLLAMA = 'http://localhost:11434'

const htmlPath = path.join(__dirname, 'dist', 'index.html')
const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf-8') : null

const server = http.createServer((req, res) => {
  // Handle CORS preflight for Ollama proxy
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  // Serve the HTML file
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(html || '<h1>Run npm run build first</h1>')
    return
  }

  // Proxy to Ollama for any path starting with /api/ or /v1/
  if (req.url.startsWith('/api/') || req.url.startsWith('/v1/') || req.url.startsWith('/ollama/')) {
    let ollamaPath = req.url
    if (ollamaPath.startsWith('/ollama/')) {
      ollamaPath = ollamaPath.replace('/ollama', '')
    }
    const ollamaUrl = OLLAMA + ollamaPath
    const proxyReq = http.request(ollamaUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'localhost:11434',
        origin: undefined,
      },
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message)
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Ollama no esta corriendo en ' + OLLAMA }))
    })

    req.pipe(proxyReq)
    return
  }

  // 404
  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log('====================================')
  console.log(' Analia Studio - Pipeline de Personajes')
  console.log(' http://localhost:' + PORT)
  console.log(' Ollama: ' + OLLAMA)
  console.log('====================================')
  console.log(' No cierres esta ventana mientras uses la app.')
  console.log()
})
