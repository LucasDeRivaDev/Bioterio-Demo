import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function PaginaBloqueada() {
  const navigate = useNavigate()
  const { tema } = useTheme()

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6"
      style={{ background: tema.bgMain, minHeight: '60vh' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,179,0,0.1)',
          border: '1.5px solid rgba(255,179,0,0.3)',
          boxShadow: '0 0 30px rgba(255,179,0,0.08)',
        }}
      >
        <Lock size={36} style={{ color: '#ffb300' }} />
      </div>

      <div className="max-w-sm space-y-3">
        <h2 className="text-xl font-bold" style={{ color: tema.textPrimary }}>
          Funcionalidad en desarrollo
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: tema.textSecondary }}>
          Esta funcionalidad aún se encuentra en desarrollo.
          Se le notificará cuando esté disponible para pruebas.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.25)',
          color: '#00e676',
          cursor: 'pointer',
        }}
      >
        ← Volver al panel
      </button>
    </div>
  )
}
