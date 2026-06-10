import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import { BioterioActivoProvider, useBioterioActivo } from './context/BioterioActivoContext'
import { BiotheriumDemoProvider } from './context/BiotheriumContextDemo'
import { useBioterio } from './context/BiotheriumContextDemo'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import SelectorBioterio from './pages/SelectorBioterio'
import Dashboard from './pages/Dashboard'
import Animales from './pages/Animales'
import Camadas from './pages/Camadas'
import Calendario from './pages/Calendario'
import Rendimiento from './pages/Rendimiento'
import Reportes from './pages/Reportes'
import Stock from './pages/Stock'
import Sacrificios from './pages/Sacrificios'
import Entregas from './pages/Entregas'
import Temperatura from './pages/Temperatura'
import Estadisticas from './pages/Estadisticas'
import Incidentes from './pages/Incidentes'
import PaginaBloqueada from './pages/PaginaBloqueada'
import Login from './pages/Login'
import Landing from './pages/Landing'
import iterateNavLogo      from './assets/logoiterate.png'
import iterateNavLogoLight from './assets/logoiteratefondoclaro.png'

// Bioterios de Vista Global — bloqueados en demo
const VISTAS_GLOBALES = ['resumen_ratones', 'alimento_global', 'viruta_global', 'capacidad_global', 'genealogia_global']

// ── Pantallas de carga ────────────────────────────────────────────────────────
function PantallaCarga() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#050810' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', boxShadow: '0 0 20px rgba(0,230,118,0.15)' }}>
        🧬
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#00e676', borderTopColor: 'transparent' }} />
        <span className="text-sm font-mono" style={{ color: '#4a5f7a' }}>Verificando acceso...</span>
      </div>
    </div>
  )
}

// ── Pantalla para crear contraseña (invitación) ───────────────────────────────
function PantallaCrearPassword() {
  const { actualizarPassword } = useAuth()
  const [pass, setPass]         = useState('')
  const [error, setError]       = useState('')
  const [listo, setListo]       = useState(false)
  const [cargando, setCargando] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    if (pass.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setCargando(true)
    try {
      await actualizarPassword(pass)
      setListo(true)
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050810' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,21,40,0.95)', border: '1px solid rgba(0,230,118,0.2)', boxShadow: '0 0 60px rgba(0,230,118,0.06)' }}>
        <div className="px-8 py-7 text-center" style={{ borderBottom: '1px solid rgba(0,230,118,0.1)', background: 'rgba(0,230,118,0.03)' }}>
          <div className="text-3xl mb-3">🔑</div>
          <h1 className="text-xl font-bold text-white">Crear contraseña</h1>
          <p className="text-xs mt-1" style={{ color: '#4a5f7a' }}>Elegí una contraseña para tu cuenta</p>
        </div>
        {listo ? (
          <div className="px-8 py-10 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <div className="font-bold text-white">¡Contraseña creada!</div>
            <div className="text-sm" style={{ color: '#4a5f7a' }}>Ya podés usar el sistema normalmente.</div>
          </div>
        ) : (
          <form onSubmit={guardar} className="px-8 py-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a5f7a' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError('') }}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ width: '100%', background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,51,82,0.9)', color: '#c9d4e0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.25)', color: '#ff6b80' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={cargando} className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,230,118,0.15)', border: '1.5px solid rgba(0,230,118,0.4)', color: '#00e676', cursor: cargando ? 'not-allowed' : 'pointer' }}>
              {cargando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Banner demo ───────────────────────────────────────────────────────────────
function BannerDemo() {
  const { resetearDemo } = useBioterio()
  const [confirmando, setConfirmando] = useState(false)

  function handleReset() {
    if (!confirmando) { setConfirmando(true); return }
    resetearDemo()
    setConfirmando(false)
  }

  return (
    <div style={{
      background: '#f59e0b', color: '#1a1200',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '12px', padding: '6px 16px', fontSize: '12px', fontWeight: 700,
      letterSpacing: '0.04em', flexShrink: 0, flexWrap: 'wrap',
    }}>
      <span>MODO DEMO — Los datos son de ejemplo. No es tu colonia real.</span>
      <button
        onClick={handleReset}
        style={{
          background: confirmando ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)',
          border: '1px solid rgba(0,0,0,0.3)', borderRadius: '6px',
          color: '#1a1200', cursor: 'pointer', fontWeight: 800,
          fontSize: '11px', padding: '3px 10px', letterSpacing: '0.02em',
        }}
      >
        {confirmando ? '¿Seguro? Hacé clic de nuevo' : 'Resetear datos'}
      </button>
      {confirmando && (
        <button
          onClick={() => setConfirmando(false)}
          style={{ background: 'transparent', border: 'none', color: '#1a1200', cursor: 'pointer', fontWeight: 700, fontSize: '11px', textDecoration: 'underline' }}
        >
          Cancelar
        </button>
      )}
    </div>
  )
}

// ── CSS modo claro ────────────────────────────────────────────────────────────
const CSS_MODO_CLARO = `
  html.modo-claro body { background: #edf2f7 !important; color: #0d1e30 !important; }
  html.modo-claro #root { background: #edf2f7 !important; }
  html.modo-claro .text-white { color: #0d1e30 !important; }
  html.modo-claro .text-rat-light { color: #0d1e30 !important; }
  html.modo-claro .bg-lab-950 { background: #edf2f7 !important; }
  html.modo-claro .bg-lab-900 { background: #e2eef8 !important; }
  html.modo-claro .min-h-screen.flex.flex-col { background: #edf2f7 !important; }
  html.modo-claro main.flex-1 { background: #edf2f7 !important; }
  html.modo-claro .flex.min-h-screen { background: #edf2f7 !important; }
`

// ── Botón de brillo ───────────────────────────────────────────────────────────
function BotonBrillo() {
  const { modoBrillo, toggleBrillo } = useTheme()
  return (
    <button
      onClick={toggleBrillo}
      title={modoBrillo ? 'Cambiar a modo oscuro' : 'Cambiar a modo luminoso'}
      style={{
        position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '8px 13px', borderRadius: '20px',
        border: modoBrillo ? '1.5px solid rgba(30,100,200,0.45)' : '1.5px solid rgba(0,230,118,0.3)',
        background: modoBrillo ? 'rgba(230,240,255,0.97)' : 'rgba(8,13,26,0.97)',
        backdropFilter: 'blur(12px)', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
        color: modoBrillo ? '#1a3a6a' : '#00e676',
        boxShadow: modoBrillo ? '0 2px 16px rgba(30,100,200,0.2), 0 4px 12px rgba(0,0,0,0.15)' : '0 0 16px rgba(0,230,118,0.12), 0 4px 12px rgba(0,0,0,0.5)',
        transition: 'all 0.25s ease', letterSpacing: '0.3px',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{modoBrillo ? '🌙' : '☀️'}</span>
      <span>{modoBrillo ? 'Oscuro' : 'Claro'}</span>
    </button>
  )
}

// ── Layout principal de la demo ───────────────────────────────────────────────
function DemoAppLayout() {
  const { cerrarSesion } = useAuth()
  const { tema, modoBrillo } = useTheme()
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  function cerrarSidebar() { setSidebarAbierto(false) }

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <BannerDemo />

      <div className="flex flex-1 min-h-0">
        {sidebarAbierto && (
          <div
            className="fixed inset-0 z-30 md:hidden backdrop-blur-sm"
            style={{ background: 'rgba(5,8,16,0.75)' }}
            onClick={cerrarSidebar}
          />
        )}

        <div
          className={`fixed md:static top-0 left-0 z-40 h-full md:h-auto transition-transform duration-300 ease-in-out ${
            sidebarAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          style={{ height: '100dvh' }}
        >
          <Sidebar onCerrarSesion={cerrarSesion} onCerrarMenu={cerrarSidebar} />
        </div>

        <main className="flex-1 overflow-auto min-w-0 flex flex-col">
          {/* Topbar mobile */}
          <div
            className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:hidden shrink-0"
            style={{ background: '#050810', borderBottom: '1px solid rgba(0,230,118,0.12)' }}
          >
            <button
              onClick={() => setSidebarAbierto(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676' }}
            >
              ☰
            </button>
            <span className="font-bold text-white text-sm tracking-wide">BIOTERIO</span>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
              DEMO
            </div>
          </div>

          {/* Logo flotante — esquina inferior derecha, oculto en mobile */}
          <div className="hidden md:block"
            style={{ position: 'fixed', bottom: '20px', right: '15px', zIndex: 10, opacity: 0.85, pointerEvents: 'none', mixBlendMode: modoBrillo ? 'multiply' : 'normal' }}>
            <img
              src={modoBrillo ? iterateNavLogoLight : iterateNavLogo}
              alt="ITeRatE"
              style={{ height: '99px', width: 'auto', display: 'block', filter: modoBrillo ? 'none' : 'drop-shadow(0 0 8px rgba(0,230,118,0.2))' }}
            />
          </div>

          <div className="flex-1">
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/animales"     element={<Animales />} />
              <Route path="/camadas"      element={<Camadas />} />
              <Route path="/calendario"   element={<Calendario />} />
              <Route path="/rendimiento"  element={<Rendimiento />} />
              <Route path="/stock"        element={<Stock />} />
              <Route path="/sacrificios"  element={<Sacrificios />} />
              <Route path="/entregas"     element={<Entregas />} />
              <Route path="/temperatura"  element={<Temperatura />} />
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/incidentes"   element={<Incidentes />} />
              <Route path="/reportes"     element={<Reportes />} />
              {/* Secciones bloqueadas */}
              <Route path="/planificacion" element={<PaginaBloqueada />} />
              <Route path="/pedidos"       element={<PaginaBloqueada />} />
              <Route path="/auditoria"     element={<PaginaBloqueada />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Root de la demo con manejo de auth y bioterio ────────────────────────────
function DemoRoot() {
  const { sesion, cargando, necesitaPassword } = useAuth()
  const { bioterioActivo, limpiarBioterio } = useBioterioActivo()
  const { modoBrillo } = useTheme()
  const location = useLocation()

  function renderContenido() {
    if (cargando) return <PantallaCarga />

    if (necesitaPassword && sesion) return <PantallaCrearPassword />

    // /landing siempre accesible aunque haya sesión activa
    if (location.pathname === '/landing') return <Landing />

    if (!sesion) {
      return (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )
    }

    // Si el bioterio activo es una vista global → limpiar y volver al selector
    if (bioterioActivo && VISTAS_GLOBALES.includes(bioterioActivo)) {
      limpiarBioterio()
      return <SelectorBioterio />
    }

    // Sin bioterio elegido → selector
    if (!bioterioActivo) return <SelectorBioterio />

    // Con bioterio elegido → app demo con datos locales
    return (
      <BiotheriumDemoProvider>
        <DemoAppLayout />
      </BiotheriumDemoProvider>
    )
  }

  return (
    <>
      {modoBrillo && <style dangerouslySetInnerHTML={{ __html: CSS_MODO_CLARO }} />}
      {renderContenido()}
      <BotonBrillo />
    </>
  )
}

// ── App de demo (punto de entrada) ────────────────────────────────────────────
export default function AppDemo() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BioterioActivoProvider>
          <BrowserRouter>
            <DemoRoot />
          </BrowserRouter>
        </BioterioActivoProvider>
      </AuthProvider>
      <PWAUpdatePrompt />
    </ThemeProvider>
  )
}
