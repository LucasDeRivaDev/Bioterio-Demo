import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useBioterio } from '../context/BiotheriumContextPro'
import { useEspecie } from '../context/EspecieContext'
import {
  LayoutDashboard, Printer, Dna, RefreshCw, BookOpen, Wheat, Layers,
  Microscope, Archive, BarChart2, ChevronDown,
  PackageCheck, Skull, TrendingUp,
} from 'lucide-react'
import GenERatsBrand from './GenERatsBrand'

// ── Links simples ─────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',          label: 'Panel de hoy',     icon: <LayoutDashboard size={15} /> },
]

// ── Grupos con submenús ───────────────────────────────────────────────────────
const NAV_GRUPOS = [
  {
    to: '/animales',
    label: 'Reproductores',
    icon: <Microscope size={15} />,
    color: '#ce93d8',
    hijos: [
      { to: '/camadas', label: 'Emparejamientos', icon: <Dna size={13} /> },
    ],
  },
  {
    to: '/stock',
    label: 'Stock',
    icon: <Archive size={15} />,
    color: '#40c4ff',
    hijos: [
      { to: '/entregas',    label: 'Entregas',    icon: <PackageCheck size={13} /> },
      { to: '/sacrificios', label: 'Sacrificios', icon: <Skull size={13} /> },
    ],
  },
  {
    to: '/rendimiento',
    label: 'Rendimiento',
    icon: <BarChart2 size={15} />,
    color: '#ff9800',
    hijos: [
      { to: '/estadisticas', label: 'Estadísticas', icon: <TrendingUp size={13} /> },
    ],
  },
]

// ── Links simples al final ────────────────────────────────────────────────────
const NAV_LINKS_CONSUMO = [
  { to: '/alimento',  label: 'Consumo alimento', icon: <Wheat size={15} /> },
  { to: '/viruta',    label: 'Consumo viruta',   icon: <Layers size={15} /> },
]

const NAV_LINKS_FINAL = [
  { to: '/reportes',  label: 'Reportes',         icon: <Printer size={15} /> },
  { to: '/tutorial',  label: 'Tutorial',         icon: <BookOpen size={15} /> },
]

// ── Estilos comunes ───────────────────────────────────────────────────────────
const styleActivo = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '8px 12px', borderRadius: '10px',
  background: 'rgba(0,230,118,0.12)',
  color: '#00e676',
  border: '1px solid rgba(0,230,118,0.25)',
  boxShadow: '0 0 12px rgba(0,230,118,0.1)',
  fontSize: '13px', fontWeight: 600, textDecoration: 'none',
}
const styleInactivo = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '8px 12px', borderRadius: '10px',
  color: '#8a9bb0',
  border: '1px solid transparent',
  fontSize: '13px', fontWeight: 500, textDecoration: 'none',
}

// ── Componente grupo acordeón ─────────────────────────────────────────────────
function NavGrupo({ grupo, onCerrarMenu }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div>
      {/* Fila principal: link al padre + botón toggle */}
      <div className="flex items-center rounded-xl overflow-hidden"
        style={{ border: '1px solid transparent' }}
      >
        <NavLink
          to={grupo.to}
          onClick={onCerrarMenu}
          className="flex-1"
          style={({ isActive }) => isActive
            ? { ...styleActivo, borderRadius: '10px 0 0 10px', border: 'none', boxShadow: 'none', background: 'rgba(0,230,118,0.12)' }
            : { ...styleInactivo, borderRadius: '10px 0 0 10px', border: 'none' }
          }
        >
          <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {grupo.icon}
          </span>
          {grupo.label}
        </NavLink>
        <button
          onClick={() => setAbierto(v => !v)}
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px', height: '34px',
            background: abierto ? `${grupo.color}15` : 'transparent',
            border: 'none',
            color: abierto ? grupo.color : '#4a5f7a',
            cursor: 'pointer',
            borderRadius: '0 10px 10px 0',
          }}
        >
          <ChevronDown
            size={13}
            style={{ transition: 'transform 0.2s', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* Sublinks */}
      {abierto && (
        <div className="ml-4 mt-0.5 space-y-0.5 pl-3"
          style={{ borderLeft: `1px solid ${grupo.color}30` }}
        >
          {grupo.hijos.map(hijo => (
            <NavLink
              key={hijo.to}
              to={hijo.to}
              onClick={onCerrarMenu}
              style={({ isActive }) => isActive
                ? { ...styleActivo, padding: '6px 10px', fontSize: '12px' }
                : { ...styleInactivo, padding: '6px 10px', fontSize: '12px', color: '#6a8099' }
              }
            >
              <span style={{ width: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: grupo.color }}>
                {hijo.icon}
              </span>
              {hijo.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ onCerrarMenu }) {
  const { animales, camadas, bio } = useBioterio()
  const { especie, limpiarEspecie } = useEspecie()

  const [fichaVisible, setFichaVisible] = useState(() => {
    try { return localStorage.getItem('demo_ficha_visible') === 'true' }
    catch { return true }
  })

  function toggleFicha() {
    setFichaVisible(v => {
      const nuevo = !v
      localStorage.setItem('demo_ficha_visible', String(nuevo))
      return nuevo
    })
  }

  const datosBio = bio ? [
    { label: 'Gestación',         valor: `${bio.GESTACION_DIAS} días` },
    { label: 'Destete',           valor: `${bio.DESTETE_DIAS} días post-nacimiento` },
    { label: 'Madurez sexual',    valor: `${Math.round(bio.MADUREZ_DIAS / 7)} semanas` },
    { label: 'Ciclo estral',      valor: `~${bio.CICLO_ESTRAL_DIAS} días` },
    { label: 'Camada promedio',   valor: especie?.camadaPromedio ?? '—' },
    { label: 'Vida reproductiva', valor: especie?.vidaReproductiva ?? '—' },
  ] : []

  const hembrasActivas = animales.filter((a) => a.sexo === 'hembra' && (a.estado === 'activo' || a.estado === 'en_apareamiento' || a.estado === 'en_cria')).length
  const machosActivos  = animales.filter((a) => a.sexo === 'macho'  && (a.estado === 'activo' || a.estado === 'en_apareamiento' || a.estado === 'en_cria')).length
  const prenadas       = camadas.filter((c) => c.fecha_copula && !c.fecha_nacimiento && !c.failure_flag).length

  const especieColor = especie?.color ?? '#00e676'

  return (
    <aside
      className="w-64 h-full flex flex-col shrink-0"
      style={{
        background: 'linear-gradient(180deg, #080d1a 0%, #050810 100%)',
        borderRight: '1px solid rgba(0,230,118,0.12)',
      }}
    >
      {/* Logo + especie activa */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(0,230,118,0.1)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.3)',
              boxShadow: '0 0 12px rgba(0,230,118,0.15)',
            }}
          >
            <Dna size={18} style={{ color: '#00e676' }} />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide">BIOTERIO</div>
            <div className="text-xs font-mono" style={{ color: 'rgba(0,230,118,0.6)' }}>Demo · LOCAL</div>
          </div>
        </div>

        {/* Especie activa + botón cambiar */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
          style={{ background: `${especieColor}10`, border: `1px solid ${especieColor}30` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{especie?.icono ?? '🔬'}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: especieColor }}>
                {especie?.nombre ?? 'Sin especie'}
              </div>
              <div className="text-xs font-mono italic truncate" style={{ color: 'rgba(138,155,176,0.5)', fontSize: '10px' }}>
                {especie?.nombreCientifico || '—'}
              </div>
            </div>
          </div>
          <button
            onClick={limpiarEspecie}
            title="Cambiar especie"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4a5f7a', cursor: 'pointer' }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: '1px solid rgba(30,51,82,0.6)' }}>
        {[
          { val: hembrasActivas, label: '♀', color: '#ce93d8' },
          { val: machosActivos,  label: '♂', color: '#40c4ff' },
          { val: prenadas,       label: '🫄', color: '#ffb300' },
        ].map(({ val, label, color }) => (
          <div
            key={label}
            className="rounded-lg py-2 text-center"
            style={{ background: 'rgba(30,51,82,0.3)', border: '1px solid rgba(30,51,82,0.6)' }}
          >
            <div className="font-mono font-bold text-base" style={{ color }}>{val}</div>
            <div className="text-xs mt-0.5" style={{ color: '#4a5f7a' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Módulos */}
      <div className="px-4 pt-4 pb-1">
        <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(138,155,176,0.4)' }}>
          Módulos
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {/* Links simples (Panel de hoy) */}
        {NAV_LINKS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onCerrarMenu}
            style={({ isActive }) => isActive ? styleActivo : styleInactivo}
          >
            <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* Separador */}
        <div style={{ height: '1px', background: 'rgba(30,51,82,0.6)', margin: '6px 4px' }} />

        {/* Grupos con submenús */}
        {NAV_GRUPOS.map(grupo => (
          <NavGrupo key={grupo.to} grupo={grupo} onCerrarMenu={onCerrarMenu} />
        ))}

        {/* Separador */}
        <div style={{ height: '1px', background: 'rgba(30,51,82,0.6)', margin: '6px 4px' }} />

        {/* Consumo alimento y viruta */}
        {NAV_LINKS_CONSUMO.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onCerrarMenu}
            style={({ isActive }) => isActive ? styleActivo : styleInactivo}
          >
            <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* Separador */}
        <div style={{ height: '1px', background: 'rgba(30,51,82,0.6)', margin: '6px 4px' }} />

        {/* Reportes y Tutorial */}
        {NAV_LINKS_FINAL.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onCerrarMenu}
            style={({ isActive }) => isActive ? styleActivo : styleInactivo}
          >
            <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Ficha biológica */}
      {especie && bio && (
        <div className="mx-3 mb-3 rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(161,120,80,0.3)', background: 'rgba(161,120,80,0.05)' }}
        >
          {/* Header siempre visible con botón toggle */}
          <button
            onClick={toggleFicha}
            className="w-full px-4 py-3 flex items-center gap-2 text-left"
            style={{
              background: 'rgba(161,120,80,0.1)',
              borderBottom: fichaVisible ? '1px solid rgba(161,120,80,0.2)' : 'none',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <span className="text-xl">{especie.icono}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: '#c9a87a' }}>{especie.nombre}</div>
              <div className="text-xs font-mono italic opacity-60 truncate" style={{ color: '#a17850' }}>{especie.nombreCientifico || '—'}</div>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: '#a17850',
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: fichaVisible ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Contenido colapsable */}
          {fichaVisible && (
            <>
              <div className="px-4 py-3 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(161,120,80,0.5)' }}>
                  Referencias biológicas
                </div>
                {datosBio.map(({ label, valor }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="text-xs leading-tight" style={{ color: '#6b7c94' }}>{label}</span>
                    <span className="text-xs font-mono font-semibold text-right" style={{ color: '#a17850' }}>{valor}</span>
                  </div>
                ))}
              </div>

              {especie.orden && especie.orden !== '—' && (
                <div
                  className="px-4 py-2 text-xs text-center font-mono"
                  style={{ borderTop: '1px solid rgba(161,120,80,0.15)', color: 'rgba(107,124,148,0.5)' }}
                >
                  {especie.orden}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Footer — Logo GenERats */}
      <div
        style={{
          borderTop: '1px solid rgba(0,230,118,0.08)',
          padding: '14px 12px 18px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <GenERatsBrand
          iconSize={52}
          nameSize={30}
          sloganSize={11}
          sublineSize={0}
          gap={10}
          align="left"
          showSubline={false}
          allowWrap
          iconPrefix="sidebarFooterBrandPro"
          style={{ width: '100%', maxWidth: '100%' }}
        />
      </div>
    </aside>
  )
}
