import { useState } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { GenerarPage } from './pages/GenerarPage'
import { PersonajePage } from './pages/PersonajePage'
import { BibliotecaPage } from './pages/BibliotecaPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  const [activePage, setActivePage] = useState('generar')

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
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  )
}
