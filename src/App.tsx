import { useState } from 'react'
import { useSettingsStore } from './store/useSettingsStore'
import { Sidebar } from './components/layout/Sidebar'
import { GenerarPage } from './pages/GenerarPage'
import { PersonajePage } from './pages/PersonajePage'
import { BibliotecaPage } from './pages/BibliotecaPage'
import { SettingsPage } from './pages/SettingsPage'
import { OllamaConnectionModal } from './components/ollama/OllamaConnectionModal'

export function App() {
  const [activePage, setActivePage] = useState('generar')
  const [showModal, setShowModal] = useState(true)
  const { settings } = useSettingsStore()

  const renderPage = () => {
    switch (activePage) {
      case 'generar':
        return <GenerarPage />
      case 'personaje':
        return <PersonajePage />
      case 'biblioteca':
        return <BibliotecaPage />
      case 'ajustes':
        return <SettingsPage />
      default:
        return <GenerarPage />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onShowConnection={() => setShowModal(true)}
      />
      <main className="main-content">{renderPage()}</main>
      {showModal && (
        <OllamaConnectionModal
          ollamaUrl={settings.ollamaUrl}
          onConnected={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
