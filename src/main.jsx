import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppDemo from './AppDemo'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppDemo />
  </StrictMode>,
)
