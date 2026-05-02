@echo off
echo ====================================
echo  Studio AI - Pipeline de Personajes
echo ====================================
echo.

REM Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I "ollama.exe" >NUL
if errorlevel 1 (
    echo [!] Advertencia: Ollama no parece estar corriendo.
    echo     Asegurate de iniciar Ollama antes de generar contenido.
    echo.
) else (
    echo [OK] Ollama detectado.
)

echo Iniciando servidor de desarrollo...
echo App disponible en: http://localhost:5173
echo.
echo No cierres esta ventana mientras uses la app.
echo Presiona Ctrl+C para detener el servidor.
echo.
node node_modules\vite\bin\vite.js --host
