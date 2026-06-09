import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

const DEMO_EMAIL = 'demo@bioterio.com'
const DEMO_PASS  = 'demo1234'
const SESION_DEMO = { user: { email: DEMO_EMAIL } }

export function AuthProvider({ children }) {
  const [sesion, setSesion]                   = useState(null)
  const [cargando, setCargando]               = useState(true)
  const [necesitaPassword, setNecesitaPassword] = useState(false)
  const [modoDemo, setModoDemo]               = useState(() => localStorage.getItem('bioterio_demo') === '1')

  useEffect(() => {
    if (modoDemo) {
      setCargando(false)
      return
    }

    // Detectar link de invitación ANTES de que Supabase lo procese
    const hash = window.location.hash
    if (hash.includes('type=invite') || hash.includes('type=signup')) {
      setNecesitaPassword(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      setSesion(nuevaSesion)
      if (evento === 'SIGNED_IN' && (window.location.hash.includes('type=invite') || window.location.hash.includes('type=signup'))) {
        setNecesitaPassword(true)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [modoDemo])

  function iniciarDemo() {
    localStorage.setItem('bioterio_demo', '1')
    setModoDemo(true)
  }

  async function iniciarSesion(email, password) {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASS) {
      iniciarDemo()
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function cerrarSesion() {
    if (modoDemo) {
      localStorage.removeItem('bioterio_demo')
      setModoDemo(false)
      return
    }
    await supabase.auth.signOut()
  }

  async function actualizarPassword(nuevaPassword) {
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
    if (error) throw error
    setNecesitaPassword(false)
    window.history.replaceState(null, '', window.location.pathname)
  }

  const sesionActiva = modoDemo ? SESION_DEMO : sesion

  return (
    <AuthCtx.Provider value={{ sesion: sesionActiva, cargando, iniciarSesion, cerrarSesion, actualizarPassword, necesitaPassword }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
