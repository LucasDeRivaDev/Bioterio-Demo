import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBioterioActivo, BIOTERIOS_CONFIG } from '../context/BioterioActivoContext'
import logoSloganDark   from '../assets/iterate+logo+slogan.png'
import logoSloganLight  from '../assets/iterate+logo+sloganfondoclaro.png'
import sloganDark       from '../assets/iterate+slogan.png'
import sloganLight      from '../assets/iterate+sloganfondoclaro.png'
import { useTheme } from '../context/ThemeContext'
import { Lock } from 'lucide-react'

const GRUPOS_RATONES = ['ratones_balbc', 'ratones_c57', 'ratones_hibridos']

const CSS = `
  @keyframes floatSelector { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
`

// ── Modal "en desarrollo" ─────────────────────────────────────────────────────
function ModalBloqueado({ onClose, tema }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,21,40,0.98)', border: '1.5px solid rgba(255,179,0,0.3)', boxShadow: '0 0 60px rgba(255,179,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(255,179,0,0.1)', border: '1.5px solid rgba(255,179,0,0.3)' }}
          >
            <Lock size={28} style={{ color: '#ffb300' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2" style={{ color: tema.textPrimary }}>
              Funcionalidad en desarrollo
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: tema.textSecondary }}>
              Esta funcionalidad aún se encuentra en desarrollo.
              Se le notificará cuando esté disponible para pruebas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.3)',
              color: '#00e676',
              cursor: 'pointer',
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelectorBioterio() {
  const { setBioterioActivo } = useBioterioActivo()
  const { tema, modoBrillo } = useTheme()
  const navigate = useNavigate()
  const [logoW, setLogoW]   = useState(340)
  const [abierto, setAbierto] = useState(null) // 'ratas' | 'ratones' | 'global'
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    const update = () => setLogoW(window.innerWidth < 480 ? 200 : window.innerWidth < 768 ? 260 : 340)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const toggle = (seccion) => setAbierto(abierto === seccion ? null : seccion)

  const cl  = modoBrillo
  const BL  = cl ? 'rgba(0,0,0,0.10)' : null
  const BA  = cl ? 'rgba(0,0,0,0.22)' : null
  const BT  = cl ? 'rgba(0,0,0,0.06)' : null
  const BG  = cl ? 'rgba(0,0,0,0.02)' : null
  const BH  = cl ? 'rgba(0,0,0,0.05)' : null
  const BTN = cl ? 'rgba(0,0,0,0.08)' : null

  // Estado sanitario local (vacío, no consulta supabase)
  const incidentesSalud = []
  function badgeSanitario() {
    return { emoji: '🟢', label: 'Estable', color: tema.accent, count: 0 }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-6 gap-6 md:gap-8"
      style={{ background: tema.bgMain, backgroundImage: tema.bgMainGrad, backgroundSize: '40px 40px' }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {modalVisible && <ModalBloqueado tema={tema} onClose={() => setModalVisible(false)} />}

      {/* Botón volver a landing */}
      <button
        onClick={() => navigate('/landing')}
        style={{
          position: 'absolute', top: '1rem', left: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 0.85rem', borderRadius: '0.6rem', cursor: 'pointer',
          fontSize: '0.75rem', fontWeight: 600,
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.25)',
          color: '#00e676',
        }}
      >
        ← Ver página de inicio
      </button>

      {/* Logo + Título */}
      <div className="flex flex-col items-center" style={{ gap: '16px' }}>
        <div style={{
          position: 'relative',
          animation: 'floatSelector 4s ease-in-out infinite',
          mixBlendMode: modoBrillo ? 'multiply' : 'screen',
          filter: modoBrillo ? 'none' : 'brightness(1.15) saturate(1.1)',
        }}>
          {!cl && <div style={{ position: 'absolute', inset: '-40px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />}
          <img
            src={modoBrillo ? logoSloganLight : logoSloganDark}
            alt="ITeRatE"
            style={{ width: `${logoW}px`, height: 'auto', display: 'block' }}
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1" style={{ color: tema.textPrimary }}>Seleccioná el bioterio</h1>
          <p className="text-sm" style={{ color: tema.textMuted }}>¿Con qué colonia vas a trabajar hoy?</p>
        </div>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-3">

        {/* ── Acordeón Ratas ── */}
        <div
          className="w-full rounded-2xl overflow-hidden transition-all duration-200"
          style={{ background: cl ? 'transparent' : 'rgba(0,230,118,0.04)', border: `1.5px solid ${abierto === 'ratas' ? (cl ? BA : 'rgba(0,230,118,0.5)') : (cl ? BL : 'rgba(0,230,118,0.25)')}` }}
        >
          <button
            className="w-full text-left px-6 py-4 flex items-center gap-4"
            onClick={() => toggle('ratas')}
          >
            <span className="text-3xl">🐀</span>
            <div className="flex-1">
              <div className="font-bold text-sm mb-0.5" style={{ color: tema.textPrimary }}>Bioterio de Ratas</div>
              <div className="text-xs font-mono italic">Rattus norvegicus</div>
            </div>
            <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: abierto === 'ratas' ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
          </button>

          <div style={{ maxHeight: abierto === 'ratas' ? '300px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
            <div className="px-6 pb-5" style={{ borderTop: `1px solid ${cl ? BT : 'rgba(0,230,118,0.12)'}` }}>
              <div className="flex flex-wrap gap-2 pt-3 mb-4">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: cl ? BG : 'rgba(0,230,118,0.1)', border: `1px solid ${cl ? BL : 'rgba(0,230,118,0.2)'}` }}>
                  Gestación 23d
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: cl ? BG : 'rgba(0,230,118,0.1)', border: `1px solid ${cl ? BL : 'rgba(0,230,118,0.2)'}` }}>
                  Madurez 12 sem.
                </span>
                {(() => {
                  const bs = badgeSanitario()
                  return (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: cl ? BG : `${bs.color}18`, border: `1px solid ${cl ? BL : `${bs.color}40`}` }}>
                      {bs.emoji} {bs.label}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setBioterioActivo('ratas')}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: cl ? BTN : 'rgba(0,230,118,0.15)', border: `1.5px solid ${cl ? BA : 'rgba(0,230,118,0.4)'}` }}
                onMouseEnter={e => e.currentTarget.style.background = cl ? BH : 'rgba(0,230,118,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = cl ? BTN : 'rgba(0,230,118,0.15)'}
              >
                Ingresar al bioterio →
              </button>
            </div>
          </div>
        </div>

        {/* ── Acordeón Ratones ── */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: tema.bgCard, border: `1.5px solid ${abierto === 'ratones' ? (cl ? BA : 'rgba(64,196,255,0.45)') : (cl ? BL : 'rgba(64,196,255,0.2)')}` }}
        >
          <button
            className="w-full text-left px-6 py-4 flex items-center gap-3"
            onClick={() => toggle('ratones')}
          >
            <span className="text-3xl">🐭</span>
            <div className="flex-1">
              <div className="font-bold text-sm" style={{ color: tema.textPrimary }}>Bioterio de Ratones</div>
              <div className="text-xs font-mono italic">
                <span className="hidden sm:inline">Mus musculus · </span>Gestación 21d · Madurez 8 sem.
              </div>
            </div>
            <span style={{ fontSize: '18px', transition: 'transform 0.2s', transform: abierto === 'ratones' ? 'rotate(90deg)' : 'rotate(0deg)', marginLeft: '8px' }}>›</span>
          </button>

          <div style={{ maxHeight: abierto === 'ratones' ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
            <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${cl ? BT : 'rgba(64,196,255,0.12)'}` }}>
              {GRUPOS_RATONES.map((id) => {
                const cfg = BIOTERIOS_CONFIG[id]
                return (
                  <button
                    key={id}
                    onClick={() => setBioterioActivo(id)}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-150"
                    style={{ background: cl ? 'transparent' : 'rgba(255,255,255,0.03)', border: `1px solid ${cl ? BL : `${cfg.color}30`}`, color: tema.textPrimary }}
                    onMouseEnter={e => { e.currentTarget.style.background = cl ? BH : `${cfg.color}12`; e.currentTarget.style.border = `1px solid ${cl ? BA : `${cfg.color}60`}` }}
                    onMouseLeave={e => { e.currentTarget.style.background = cl ? 'transparent' : 'rgba(255,255,255,0.03)'; e.currentTarget.style.border = `1px solid ${cl ? BL : `${cfg.color}30`}` }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cl ? 'rgba(0,0,0,0.3)' : cfg.color }} />
                    <span className="font-semibold text-sm">{cfg.labelCorto}</span>
                    <span className="text-xs font-mono ml-1 hidden sm:inline">{cfg.nombreCientifico}</span>
                    <span className="ml-auto text-xs">›</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Acordeón Vista Global (bloqueado en demo) ── */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: tema.bgCard, border: `1px solid ${abierto === 'global' ? (cl ? BA : 'rgba(255,179,0,0.4)') : (cl ? BL : 'rgba(255,179,0,0.18)')}` }}
        >
          <button
            className="w-full text-left px-5 py-3.5 flex items-center gap-2"
            onClick={() => toggle('global')}
            style={{ background: cl ? 'transparent' : 'rgba(255,179,0,0.02)' }}
          >
            <span className="text-base">🌐</span>
            <span className="text-sm font-semibold">Vista global</span>
            <span className="text-xs font-mono">· Todos los bioterios</span>
            <Lock size={13} style={{ color: '#ffb300', marginLeft: '4px', opacity: 0.8 }} />
            <span style={{ fontSize: '18px', marginLeft: 'auto', transition: 'transform 0.2s', transform: abierto === 'global' ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
          </button>

          <div style={{ maxHeight: abierto === 'global' ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <div className="p-3 space-y-2" style={{ borderTop: `1px solid ${cl ? BT : 'rgba(255,179,0,0.1)'}` }}>
              {[
                { emoji: '🌾', label: 'Consumo global de alimento', desc: 'Ratas + Ratones · estimación diaria + predicción de duración', color: 'rgba(255,179,0,0.25)' },
                { emoji: '🪵', label: 'Consumo de viruta / camas', desc: 'Ratas + Ratones · calculado por jaulas activas', color: 'rgba(139,92,246,0.25)' },
                { emoji: '📊', label: 'Capacidad y predicción', desc: 'Saturación estimada · candidatos a sacrificio · simulador', color: 'rgba(255,61,87,0.25)' },
                { emoji: '🧬', label: 'Genealogía y consanguinidad', desc: 'Árbol genealógico · coeficiente F · simulador de apareamiento', color: 'rgba(167,139,250,0.25)' },
              ].map(({ emoji, label, desc, color }) => (
                <button
                  key={label}
                  onClick={() => setModalVisible(true)}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-150"
                  style={{ background: cl ? 'transparent' : 'rgba(255,255,255,0.02)', border: `1px solid ${cl ? BL : color}`, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = cl ? BH : 'rgba(255,179,0,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = cl ? 'transparent' : 'rgba(255,255,255,0.02)'}
                >
                  <span className="text-sm">{emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm" style={{ color: tema.textPrimary }}>{label}</div>
                    <div className="text-xs font-mono" style={{ color: tema.textMuted }}>{desc}</div>
                  </div>
                  <Lock size={13} style={{ color: '#ffb300', opacity: 0.7, flexShrink: 0 }} />
                </button>
              ))}

              <div
                className="px-4 py-3 rounded-xl text-center text-xs"
                style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', color: '#ffb300' }}
              >
                🔒 Esta sección estará disponible próximamente
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Pie de página */}
      <img
        src={modoBrillo ? sloganLight : sloganDark}
        alt="ITeRatE"
        style={{
          width: '520px',
          maxWidth: '90vw',
          height: 'auto',
          display: 'block',
          mixBlendMode: modoBrillo ? 'multiply' : 'screen',
          filter: modoBrillo ? 'none' : 'brightness(1.15) saturate(1.1)',
        }}
      />
    </div>
  )
}
