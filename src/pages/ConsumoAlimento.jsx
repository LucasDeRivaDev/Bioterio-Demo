import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBioterio } from '../context/BiotheriumContextPro'
import { useEspecie } from '../context/EspecieContext'
import { difDias, parseDate, hoy, formatFecha } from '../utils/calculos'
import { generarId } from '../utils/storage'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ArrowLeft, TrendingUp, Wheat, ClipboardList, ShoppingBag } from 'lucide-react'

// ── Tasas de consumo g/día por animal según especie y categoría ───────────────
const TASAS_POR_ESPECIE = {
  rata: {
    crias:    { min: 5,   max: 14,  label: 'Crías' },
    jovenes:  { min: 10,  max: 20,  label: 'Jóvenes' },
    adultos:  { min: 20,  max: 35,  label: 'Adultos' },
    repro:    { min: 20,  max: 35,  label: 'Reproductor adulto' },
    lactante: { min: 30,  max: 40,  label: 'Hembra lactante' },
  },
  raton: {
    crias:    { min: 3,   max: 5,   label: 'Crías' },
    jovenes:  { min: 5,   max: 7,   label: 'Jóvenes' },
    adultos:  { min: 6,   max: 8,   label: 'Adultos' },
    repro:    { min: 6,   max: 8,   label: 'Reproductor adulto' },
    lactante: { min: 10,  max: 15,  label: 'Hembra lactante' },
  },
  cobayo: {
    crias:    { min: 10,  max: 15,  label: 'Crías' },
    jovenes:  { min: 20,  max: 30,  label: 'Jóvenes' },
    adultos:  { min: 30,  max: 40,  label: 'Adultos' },
    repro:    { min: 30,  max: 40,  label: 'Reproductor adulto' },
    lactante: { min: 35,  max: 50,  label: 'Hembra lactante' },
  },
  conejo: {
    crias:    { min: 20,  max: 40,  label: 'Crías' },
    jovenes:  { min: 80,  max: 120, label: 'Jóvenes' },
    adultos:  { min: 150, max: 200, label: 'Adultos' },
    repro:    { min: 150, max: 200, label: 'Reproductor adulto' },
    lactante: { min: 200, max: 300, label: 'Hembra lactante' },
  },
  hamster: {
    crias:    { min: 2,   max: 4,   label: 'Crías' },
    jovenes:  { min: 3,   max: 6,   label: 'Jóvenes' },
    adultos:  { min: 5,   max: 8,   label: 'Adultos' },
    repro:    { min: 5,   max: 8,   label: 'Reproductor adulto' },
    lactante: { min: 8,   max: 12,  label: 'Hembra lactante' },
  },
}

function getTasas(especieId) {
  return TASAS_POR_ESPECIE[especieId] ?? TASAS_POR_ESPECIE.rata
}

// ── localStorage ──────────────────────────────────────────────────────────────
const LS_CENSOS   = 'demo_alimento_censos'
const LS_INGRESOS = 'demo_alimento_ingresos'

function cargarLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function guardarLS(key, lista) {
  localStorage.setItem(key, JSON.stringify(lista))
}

// ── Helpers de cálculo ────────────────────────────────────────────────────────

function mid(tasa) { return (tasa.min + tasa.max) / 2 }

function edadDias(fechaNacimiento) {
  if (!fechaNacimiento) return null
  return difDias(parseDate(fechaNacimiento), parseDate(hoy()))
}

function clasificarEdadStock(dias, bio) {
  const stockAdultosDias = bio.MADUREZ_DIAS ?? 84
  if (dias < 42)                 return 'crias'
  if (dias < stockAdultosDias)   return 'jovenes'
  return 'adultos'
}

function stockCamada(camada, sacrificios, entregas) {
  const sac  = sacrificios.filter(s => s.camada_id === camada.id).reduce((s, x) => s + x.cantidad, 0)
  const ent  = entregas.filter(e => e.camada_id === camada.id).reduce((s, x) => s + x.cantidad, 0)
  const base = camada.total_destetados ?? camada.total_crias ?? 0
  return Math.max(0, base - sac - ent)
}

function consumoGrupo(count, tasa) {
  return { count, min: count * tasa.min, max: count * tasa.max, mid: count * mid(tasa) }
}

function sumarConsumo(a, b) {
  return { count: a.count + b.count, min: a.min + b.min, max: a.max + b.max, mid: a.mid + b.mid }
}

const VACIO = { count: 0, min: 0, max: 0, mid: 0 }

// ── Cálculo principal ─────────────────────────────────────────────────────────

function calcularConsumo(tasas, bio, animales, camadas, jaulas, sacrificios, entregas) {
  const activos = ['activo', 'en_apareamiento', 'en_cria']

  const lactantes = animales.filter(a =>
    a.sexo === 'hembra' &&
    a.estado === 'en_cria' &&
    camadas.some(c => c.id_madre === a.id && c.fecha_nacimiento && !c.fecha_destete && !c.failure_flag)
  )

  const otrasHembras = animales.filter(a =>
    a.sexo === 'hembra' &&
    activos.includes(a.estado) &&
    !lactantes.find(l => l.id === a.id)
  )

  const machos = animales.filter(a =>
    a.sexo === 'macho' && activos.includes(a.estado)
  )

  const reproLactantes = consumoGrupo(lactantes.length, tasas.lactante)
  const reproOtros     = consumoGrupo(otrasHembras.length + machos.length, tasas.repro)

  const jaulasIds = new Set(jaulas.map(j => j.camada_id))
  let stockCrias = { ...VACIO }, stockJovenes = { ...VACIO }, stockAdultos = { ...VACIO }

  function acumularStock(total, fechaNacimiento) {
    const edad = edadDias(fechaNacimiento)
    if (edad === null) return
    const cat = clasificarEdadStock(edad, bio)
    if      (cat === 'crias')   stockCrias   = sumarConsumo(stockCrias,   consumoGrupo(total, tasas.crias))
    else if (cat === 'jovenes') stockJovenes = sumarConsumo(stockJovenes, consumoGrupo(total, tasas.jovenes))
    else                        stockAdultos = sumarConsumo(stockAdultos, consumoGrupo(total, tasas.adultos))
  }

  jaulas.forEach(jaula => {
    const camada = camadas.find(c => c.id === jaula.camada_id)
    if (!camada || camada.incluir_en_stock === false || jaula.total <= 0) return
    acumularStock(jaula.total, camada.fecha_nacimiento)
  })

  camadas.forEach(camada => {
    if (!camada.fecha_destete || camada.incluir_en_stock === false) return
    if (jaulasIds.has(camada.id)) return
    const stock = stockCamada(camada, sacrificios, entregas)
    if (stock <= 0) return
    acumularStock(stock, camada.fecha_nacimiento)
  })

  const totalMin = reproLactantes.min + reproOtros.min + stockCrias.min + stockJovenes.min + stockAdultos.min
  const totalMax = reproLactantes.max + reproOtros.max + stockCrias.max + stockJovenes.max + stockAdultos.max

  return {
    reproLactantes,
    reproOtros,
    stockCrias,
    stockJovenes,
    stockAdultos,
    totalMin,
    totalMax,
    totalMid: (totalMin + totalMax) / 2,
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ConsumoAlimento() {
  const { animales, camadas, jaulas, sacrificios, entregas } = useBioterio()
  const { especie, bio } = useEspecie()

  const [censos,   setCensos]   = useState(() => cargarLS(LS_CENSOS))
  const [ingresos, setIngresos] = useState(() => cargarLS(LS_INGRESOS))

  const [modalCenso,   setModalCenso]   = useState(false)
  const [modalIngreso, setModalIngreso] = useState(false)

  const tasas = getTasas(especie?.id)

  // ── Datos calculados ──
  const datos = useMemo(() =>
    calcularConsumo(tasas, bio, animales, camadas, jaulas, sacrificios, entregas),
    [tasas, bio, animales, camadas, jaulas, sacrificios, entregas]
  )

  // ── Censos ordenados por fecha ──
  const censosOrdenados = useMemo(
    () => [...censos].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [censos]
  )

  const ultimoCenso = censosOrdenados.length > 0 ? censosOrdenados[censosOrdenados.length - 1] : null

  const ingresosPostCenso = ultimoCenso
    ? ingresos.filter(i => i.fecha >= ultimoCenso.fecha)
    : []

  const stockActualKg = ultimoCenso !== null
    ? ultimoCenso.kg + ingresosPostCenso.reduce((s, i) => s + i.kg, 0)
    : null

  // ── Calibración adaptativa ──
  const calibracion = useMemo(() => {
    if (censosOrdenados.length < 2) return null
    const pares = []
    for (let i = 0; i < censosOrdenados.length - 1; i++) {
      const prev = censosOrdenados[i]
      const cur  = censosOrdenados[i + 1]
      const dias = difDias(parseDate(prev.fecha), parseDate(cur.fecha))
      if (dias <= 0) continue

      const ingresosEnPeriodo = ingresos
        .filter(c => c.fecha >= prev.fecha && c.fecha < cur.fecha)
        .reduce((s, c) => s + c.kg, 0)

      const consumidoG = (prev.kg + ingresosEnPeriodo - cur.kg) * 1000
      if (consumidoG <= 0) continue

      const realGDia = consumidoG / dias
      if (!prev.consumoEstimadoGDia || prev.consumoEstimadoGDia <= 0) continue

      pares.push({
        fechaInicio: prev.fecha,
        fechaFin: cur.fecha,
        dias,
        realGDia,
        estimadoGDia: prev.consumoEstimadoGDia,
        factor: realGDia / prev.consumoEstimadoGDia,
      })
    }
    if (pares.length === 0) return null
    const factorPromedio = pares.reduce((s, p) => s + p.factor, 0) / pares.length
    return { factor: factorPromedio, muestras: pares.length, pares }
  }, [censosOrdenados, ingresos])

  const consumoBase     = datos.totalMid
  const consumoAjustado = calibracion ? consumoBase * calibracion.factor : consumoBase

  // ── Predicción de duración ──
  const diasEstimados = useMemo(() => {
    if (stockActualKg === null || stockActualKg <= 0 || consumoBase <= 0) return null
    const consumoFinal = calibracion ? consumoBase * calibracion.factor : consumoBase
    return Math.floor((stockActualKg * 1000) / consumoFinal)
  }, [stockActualKg, consumoBase, calibracion])

  const fechaAgotamiento = useMemo(() => {
    if (!diasEstimados) return null
    const d = new Date()
    d.setDate(d.getDate() + diasEstimados)
    return formatFecha(d)
  }, [diasEstimados])

  // ── Movimientos ──
  const movimientos = useMemo(() => {
    const items = [
      ...censos.map(c => ({ ...c, tipo: 'censo' })),
      ...ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
    ]
    return items.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [censos, ingresos])

  // ── Gráfico ──
  const datosGrafico = useMemo(() => {
    if (!calibracion) return []
    return calibracion.pares.map(p => ({
      fecha: formatFecha(p.fechaInicio, { month: '2-digit', day: '2-digit', year: undefined }),
      estimado: Math.round(p.estimadoGDia / 100) / 10,
      real: Math.round(p.realGDia / 100) / 10,
    })).slice(-8)
  }, [calibracion])

  function consumoPorCenso(censoActual, idx) {
    const prev = censosOrdenados[idx - 1]
    if (!prev) return null
    const dias = difDias(parseDate(prev.fecha), parseDate(censoActual.fecha))
    if (dias <= 0) return null
    const ingresosG = ingresos
      .filter(c => c.fecha >= prev.fecha && c.fecha < censoActual.fecha)
      .reduce((s, c) => s + c.kg, 0) * 1000
    const consumidoG = (prev.kg + ingresosG / 1000 - censoActual.kg) * 1000
    if (consumidoG <= 0) return null
    return { consumidoG, dias, realGDia: consumidoG / dias }
  }

  // ── CRUD ──
  function registrarCenso(fecha, kg) {
    const nuevo = {
      id: generarId(),
      fecha,
      kg,
      consumoEstimadoGDia: Math.round(consumoAjustado),
    }
    const nuevos = [...censos, nuevo]
    setCensos(nuevos)
    guardarLS(LS_CENSOS, nuevos)
    setModalCenso(false)
  }

  function eliminarCensoItem(id) {
    const nuevos = censos.filter(c => c.id !== id)
    setCensos(nuevos)
    guardarLS(LS_CENSOS, nuevos)
  }

  function registrarIngreso(fecha, kg) {
    const nuevo = { id: generarId(), fecha, kg }
    const nuevos = [...ingresos, nuevo]
    setIngresos(nuevos)
    guardarLS(LS_INGRESOS, nuevos)
    setModalIngreso(false)
  }

  function eliminarIngresoItem(id) {
    const nuevos = ingresos.filter(i => i.id !== id)
    setIngresos(nuevos)
    guardarLS(LS_INGRESOS, nuevos)
  }

  const especieColor = especie?.color ?? '#ffb300'
  const especieIcono = especie?.icono ?? '🔬'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050810' }}>

      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,179,0,0.15)', background: 'rgba(13,21,40,0.6)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-mono transition-colors"
          style={{ background: 'rgba(255,179,0,0.07)', border: '1px solid rgba(255,179,0,0.2)', color: '#ffb300', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} />
          Volver
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-white text-base">
            {especieIcono} Consumo de alimento
          </h1>
          <p className="text-xs font-mono" style={{ color: '#4a5f7a' }}>
            {especie?.nombre ?? 'Especie activa'} · stock y predicción adaptativa
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* ── Tarjeta resumen ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.8)', border: '1.5px solid rgba(255,179,0,0.3)', boxShadow: '0 0 30px rgba(255,179,0,0.06)' }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,179,0,0.15)', background: 'rgba(255,179,0,0.05)' }}>
            <Wheat size={20} style={{ color: '#ffb300' }} />
            <div className="flex-1">
              <div className="font-bold text-white text-sm">Consumo diario estimado</div>
              <div className="text-xs font-mono" style={{ color: '#4a5f7a' }}>
                Rango: {Math.round(datos.totalMin)} – {Math.round(datos.totalMax)} g/día
                {calibracion && <span style={{ color: '#40c4ff' }}> · Ajustado con {calibracion.muestras} par{calibracion.muestras > 1 ? 'es' : ''} de censos</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono" style={{ color: '#ffb300' }}>
                {consumoAjustado >= 1000
                  ? `${(consumoAjustado / 1000).toFixed(2)} kg`
                  : `${Math.round(consumoAjustado)} g`}
              </div>
              <div className="text-xs font-mono" style={{ color: '#4a5f7a' }}>por día</div>
            </div>
          </div>

          {calibracion && (
            <div className="px-6 py-2 flex items-center gap-2 text-xs font-mono" style={{ borderTop: '1px solid rgba(64,196,255,0.1)', background: 'rgba(64,196,255,0.03)', color: '#40c4ff' }}>
              <TrendingUp size={12} />
              Factor de calibración: ×{calibracion.factor.toFixed(2)}
              {calibracion.factor > 1
                ? ' — los animales consumen más de lo estimado'
                : ' — los animales consumen menos de lo estimado'}
            </div>
          )}
        </div>

        {/* ── Panel de stock y predicción ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.7)', border: '1px solid rgba(0,230,118,0.2)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,230,118,0.12)', background: 'rgba(0,230,118,0.04)' }}>
            <div className="font-bold text-sm text-white">Stock y predicción de duración</div>
            <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5f7a' }}>
              Basado en el último censo más los ingresos registrados
            </div>
          </div>

          {stockActualKg === null ? (
            <div className="px-6 py-8 text-center text-sm font-mono" style={{ color: '#3d5068' }}>
              Registrá el primer censo para ver la predicción de duración
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
                  <div className="text-xs font-mono mb-1" style={{ color: '#4a5f7a' }}>Stock actual</div>
                  <div className="text-xl font-bold font-mono" style={{ color: '#00e676' }}>
                    {stockActualKg.toFixed(1)} kg
                  </div>
                </div>

                <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div className="text-xs font-mono mb-1" style={{ color: '#4a5f7a' }}>Último censo</div>
                  <div className="font-bold font-mono text-sm" style={{ color: '#a78bfa' }}>
                    {ultimoCenso.kg.toFixed(1)} kg
                  </div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5f7a' }}>
                    {formatFecha(ultimoCenso.fecha)}
                  </div>
                </div>

                <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-mono mb-1" style={{ color: '#4a5f7a' }}>Último ingreso</div>
                  {ingresos.length > 0 ? (() => {
                    const ult = [...ingresos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
                    return (
                      <>
                        <div className="font-bold font-mono text-sm" style={{ color: '#00e676' }}>+{ult.kg.toFixed(1)} kg</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5f7a' }}>{formatFecha(ult.fecha)}</div>
                      </>
                    )
                  })() : (
                    <div className="text-xs font-mono mt-1" style={{ color: '#3d5068' }}>Sin ingresos</div>
                  )}
                </div>

                <div
                  className="rounded-xl px-4 py-3 text-center"
                  style={{
                    background: diasEstimados !== null && diasEstimados < 7 ? 'rgba(255,61,87,0.08)' : diasEstimados !== null && diasEstimados < 14 ? 'rgba(255,179,0,0.07)' : 'rgba(0,230,118,0.06)',
                    border: `1px solid ${diasEstimados !== null && diasEstimados < 7 ? 'rgba(255,61,87,0.3)' : diasEstimados !== null && diasEstimados < 14 ? 'rgba(255,179,0,0.25)' : 'rgba(0,230,118,0.2)'}`,
                  }}
                >
                  <div className="text-xs font-mono mb-1" style={{ color: '#4a5f7a' }}>Duración estimada</div>
                  {diasEstimados ? (
                    <>
                      <div
                        className="text-xl font-bold font-mono"
                        style={{ color: diasEstimados < 7 ? '#ff6b80' : diasEstimados < 14 ? '#ffb300' : '#00e676' }}
                      >
                        {diasEstimados} días
                      </div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5f7a' }}>
                        {fechaAgotamiento}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-mono mt-1" style={{ color: '#3d5068' }}>—</div>
                  )}
                </div>
              </div>

              {ingresosPostCenso.length > 0 && (
                <div className="mt-3 text-xs font-mono" style={{ color: '#4a5f7a' }}>
                  {ingresosPostCenso.length} ingreso{ingresosPostCenso.length > 1 ? 's' : ''} post-censo: +{ingresosPostCenso.reduce((s, i) => s + i.kg, 0).toFixed(1)} kg sumados al stock
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Desglose por categoría ── */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#4a5f7a' }}>
            Desglose por categoría
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.6)', border: `1px solid ${especieColor}25` }}>
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${especieColor}15`, background: `${especieColor}07` }}>
              <span className="text-lg">{especieIcono}</span>
              <div className="flex-1">
                <span className="font-bold text-sm text-white">{especie?.nombre ?? 'Colonia'}</span>
                <span className="ml-2 text-xs font-mono" style={{ color: '#4a5f7a' }}>
                  Rango: {Math.round(datos.totalMin)} – {Math.round(datos.totalMax)} g/día
                </span>
              </div>
              <div className="font-bold font-mono text-base" style={{ color: especieColor }}>
                {datos.totalMid >= 1000
                  ? `${(datos.totalMid / 1000).toFixed(2)} kg/día`
                  : `${Math.round(datos.totalMid)} g/día`}
              </div>
            </div>

            {datos.totalMid > 0 ? (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <FilaCategoria label="Hembras lactantes"     dato={datos.reproLactantes} tasaMin={tasas.lactante.min} tasaMax={tasas.lactante.max} color="#ce93d8" />
                <FilaCategoria label="Reproductores (resto)" dato={datos.reproOtros}     tasaMin={tasas.repro.min}    tasaMax={tasas.repro.max}    color="#40c4ff" />
                <FilaCategoria label="Crías en stock"        dato={datos.stockCrias}     tasaMin={tasas.crias.min}    tasaMax={tasas.crias.max}    color="#00e676" />
                <FilaCategoria label="Jóvenes en stock"      dato={datos.stockJovenes}   tasaMin={tasas.jovenes.min}  tasaMax={tasas.jovenes.max}  color="#ffb300" />
                <FilaCategoria label="Adultos en stock"      dato={datos.stockAdultos}   tasaMin={tasas.adultos.min}  tasaMax={tasas.adultos.max}  color="#ff6b80" />
              </div>
            ) : (
              <div className="px-5 py-4 text-xs font-mono" style={{ color: '#3d5068' }}>
                Sin animales activos registrados
              </div>
            )}
          </div>
        </div>

        {/* ── Movimientos de stock ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.7)', border: '1px solid rgba(167,139,250,0.18)' }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(167,139,250,0.12)', background: 'rgba(167,139,250,0.04)' }}>
            <ClipboardList size={18} style={{ color: '#a78bfa' }} />
            <div className="flex-1">
              <div className="font-bold text-sm text-white">Movimientos de stock</div>
              <div className="text-xs font-mono" style={{ color: '#4a5f7a' }}>
                Censos = fuente del cálculo real · Ingresos = compras que suman al stock
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalCenso(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold"
                style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', cursor: 'pointer' }}
              >
                <ClipboardList size={13} />
                Registrar censo
              </button>
              <button
                onClick={() => setModalIngreso(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-semibold"
                style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676', cursor: 'pointer' }}
              >
                <ShoppingBag size={13} />
                Registrar ingreso
              </button>
            </div>
          </div>

          <div className="px-6 py-3 text-xs font-mono space-y-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)', color: '#4a5f7a' }}>
            <div>
              <span style={{ color: '#a78bfa' }}>📊 Censo</span>
              {' '}— pesaje real del stock actual. Es la fuente del aprendizaje adaptativo.
            </div>
            <div>
              <span style={{ color: '#00e676' }}>📦 Ingreso</span>
              {' '}— compra o reposición. Suma al stock sin alterar el historial de consumo.
            </div>
          </div>

          {movimientos.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm font-mono" style={{ color: '#3d5068' }}>
              Aún no hay registros. Empezá con un censo del alimento disponible.
            </div>
          ) : (
            <div className="px-6 py-4 space-y-2 max-h-80 overflow-y-auto">
              {movimientos.map((mov) => {
                if (mov.tipo === 'censo') {
                  const idxEnOrden = censosOrdenados.findIndex(c => c.id === mov.id)
                  const consumo = consumoPorCenso(mov, idxEnOrden)
                  return (
                    <div key={mov.id} className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)' }}>
                      <div className="text-base mt-0.5">📊</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono" style={{ color: '#a78bfa' }}>Censo</span>
                          <span className="text-xs font-mono text-white">{mov.kg.toFixed(1)} kg</span>
                          <span className="text-xs font-mono" style={{ color: '#4a5f7a' }}>{formatFecha(mov.fecha)}</span>
                        </div>
                        {consumo && (
                          <div className="text-xs font-mono mt-1" style={{ color: '#6a8099' }}>
                            Consumo del período: {(consumo.consumidoG / 1000).toFixed(2)} kg en {consumo.dias} días
                            {' · '}{Math.round(consumo.realGDia)} g/día
                          </div>
                        )}
                      </div>
                      <button onClick={() => eliminarCensoItem(mov.id)} className="text-xs shrink-0" style={{ color: '#2a3a50', cursor: 'pointer' }} title="Eliminar">✕</button>
                    </div>
                  )
                } else {
                  return (
                    <div key={mov.id} className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.12)' }}>
                      <div className="text-base">📦</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono" style={{ color: '#00e676' }}>Ingreso</span>
                          <span className="text-xs font-mono text-white">+{mov.kg.toFixed(1)} kg</span>
                          <span className="text-xs font-mono" style={{ color: '#4a5f7a' }}>{formatFecha(mov.fecha)}</span>
                        </div>
                      </div>
                      <button onClick={() => eliminarIngresoItem(mov.id)} className="text-xs shrink-0" style={{ color: '#2a3a50', cursor: 'pointer' }} title="Eliminar">✕</button>
                    </div>
                  )
                }
              })}
            </div>
          )}
        </div>

        {/* ── Gráfico histórico ── */}
        {datosGrafico.length >= 2 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.7)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-bold text-sm text-white">Consumo estimado vs. real — histórico</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: '#4a5f7a' }}>kg/día por par de censos</div>
            </div>
            <div className="px-4 py-4" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fecha" tick={{ fill: '#4a5f7a', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4a5f7a', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} unit=" kg" />
                  <Tooltip
                    contentStyle={{ background: '#0d1528', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#c9d4e0' }}
                    itemStyle={{ color: '#c9d4e0' }}
                    formatter={(v, name) => [`${v} kg/día`, name === 'estimado' ? 'Estimado' : 'Real']}
                  />
                  <Legend formatter={v => v === 'estimado' ? 'Estimado' : 'Real'} wrapperStyle={{ fontSize: 12, fontFamily: 'monospace', color: '#6a8099' }} />
                  <Bar dataKey="estimado" fill="rgba(255,179,0,0.5)"  radius={[4,4,0,0]} />
                  <Bar dataKey="real"      fill="rgba(0,230,118,0.6)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Nota ── */}
        <div className="rounded-xl px-5 py-4 text-xs font-mono space-y-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#4a5f7a' }}>
          <div className="font-semibold" style={{ color: '#6a8099' }}>Acerca de los valores</div>
          <div>Los rangos de consumo son promedios de referencia. Variaciones por temperatura, estado reproductivo y tipo de alimento son normales.</div>
          <div>Especie activa: <span style={{ color: especieColor }}>{especie?.nombre ?? '—'}</span> · Categoría lactante: {tasas.lactante.min}–{tasas.lactante.max} g/día · Reproductores: {tasas.repro.min}–{tasas.repro.max} g/día</div>
        </div>

      </div>

      {/* Modales */}
      {modalCenso && (
        <ModalCensoAlimento
          stockActualKg={stockActualKg}
          onConfirmar={registrarCenso}
          onCerrar={() => setModalCenso(false)}
        />
      )}
      {modalIngreso && (
        <ModalIngreso
          stockActualKg={stockActualKg}
          onConfirmar={registrarIngreso}
          onCerrar={() => setModalIngreso(false)}
        />
      )}
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function FilaCategoria({ label, dato, tasaMin, tasaMax, color }) {
  if (dato.count === 0) return null
  return (
    <div className="px-5 py-2.5 flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-xs flex-1" style={{ color: '#8a9bb0' }}>{label}</span>
      <span className="text-xs font-mono" style={{ color: '#4a5f7a' }}>
        {dato.count} × {tasaMin}–{tasaMax} g
      </span>
      <span className="text-xs font-mono font-semibold w-24 text-right" style={{ color }}>
        {Math.round(dato.mid)} g/día
      </span>
    </div>
  )
}

function ModalCensoAlimento({ stockActualKg, onConfirmar, onCerrar }) {
  const [fecha, setFecha] = useState(hoy())
  const [kg, setKg]       = useState('')

  function confirmar(e) {
    e.preventDefault()
    const v = parseFloat(kg)
    if (!v || v < 0) return
    onConfirmar(fecha, v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.98)', border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 0 60px rgba(167,139,250,0.12)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(167,139,250,0.15)', background: 'rgba(167,139,250,0.05)' }}>
          <div className="font-bold text-white text-sm">📊 Registrar censo de alimento</div>
          <div className="text-xs font-mono mt-1" style={{ color: '#4a5f7a' }}>
            Pesá el alimento disponible ahora mismo
          </div>
        </div>
        <form onSubmit={confirmar} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a5f7a' }}>Fecha del censo</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,51,82,0.9)', color: '#c9d4e0', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a5f7a' }}>
              Alimento disponible (kg)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={kg}
              onChange={e => setKg(e.target.value)}
              placeholder="Ej: 18.5"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,51,82,0.9)', color: '#c9d4e0', outline: 'none' }}
            />
          </div>

          {stockActualKg !== null && kg && parseFloat(kg) >= 0 && (
            <div className="rounded-xl px-4 py-3 text-xs font-mono space-y-1"
              style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <div style={{ color: '#a78bfa' }}>Vista previa</div>
              <div style={{ color: '#8a9bb0' }}>
                Stock anterior: <span className="text-white">{stockActualKg.toFixed(1)} kg</span>
                {' → '}
                Nuevo stock: <span className="text-white">{parseFloat(kg || 0).toFixed(1)} kg</span>
              </div>
              {stockActualKg - parseFloat(kg || 0) > 0 && (
                <div style={{ color: '#6a8099' }}>
                  Consumo registrado: {(stockActualKg - parseFloat(kg)).toFixed(1)} kg
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#4a5f7a', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', cursor: 'pointer' }}
            >
              Guardar censo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalIngreso({ stockActualKg, onConfirmar, onCerrar }) {
  const [fecha, setFecha] = useState(hoy())
  const [kg, setKg]       = useState('')

  const nuevoStock = stockActualKg !== null && kg
    ? (stockActualKg + parseFloat(kg || 0)).toFixed(1)
    : null

  function confirmar(e) {
    e.preventDefault()
    const v = parseFloat(kg)
    if (!v || v <= 0) return
    onConfirmar(fecha, v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'rgba(13,21,40,0.98)', border: '1px solid rgba(0,230,118,0.25)', boxShadow: '0 0 60px rgba(0,230,118,0.08)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,230,118,0.12)', background: 'rgba(0,230,118,0.04)' }}>
          <div className="font-bold text-white text-sm">📦 Registrar ingreso de alimento</div>
          <div className="text-xs font-mono mt-1" style={{ color: '#4a5f7a' }}>
            Suma al stock disponible · No modifica el historial de consumo
          </div>
        </div>
        <form onSubmit={confirmar} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a5f7a' }}>Fecha del ingreso</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,51,82,0.9)', color: '#c9d4e0', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#4a5f7a' }}>
              Cantidad ingresada (kg)
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={kg}
              onChange={e => setKg(e.target.value)}
              placeholder="Ej: 25"
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(8,13,26,0.9)', border: '1px solid rgba(30,51,82,0.9)', color: '#c9d4e0', outline: 'none' }}
            />
          </div>

          {nuevoStock && (
            <div className="rounded-xl px-4 py-3 text-xs font-mono" style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <span style={{ color: '#4a5f7a' }}>Stock después del ingreso: </span>
              <span className="font-bold" style={{ color: '#00e676' }}>{nuevoStock} kg</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 py-2.5 rounded-xl text-sm font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#4a5f7a', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.4)', color: '#00e676', cursor: 'pointer' }}
            >
              Guardar ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
