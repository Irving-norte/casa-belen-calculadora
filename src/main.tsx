import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { sembrarCatalogoSiHaceFalta } from './lib/db/seed'
import './index.css'

// Idempotente: si el catálogo ya existe, no toca nada.
// Se espera antes de renderizar para que la primera pantalla ya tenga datos.
sembrarCatalogoSiHaceFalta()
  .catch((error) => {
    console.error('No se pudo sembrar el catálogo inicial:', error)
  })
  .finally(() => {
    // Además de intentar persistir el almacenamiento, para reducir el
    // riesgo de que Android desaloje IndexedDB por falta de espacio.
    void navigator.storage?.persist?.()

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    )
  })
