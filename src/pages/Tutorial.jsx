import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ChevronRight, ChevronLeft, CheckCircle2,
  LayoutDashboard, Dna, Users, Baby, Package,
  Calendar, TrendingUp, Thermometer, AlertCircle,
  Printer, Star, ArrowRight, Layers,
} from 'lucide-react'

// ── Definición de pasos ───────────────────────────────────────────────────────

const PASOS = [
  {
    icono: <BookOpen size={36} />,
    color: '#00e676',
    titulo: 'Bienvenido a BioteríoDemo',
    subtitulo: 'Tu sistema de gestión de colonias reproductivas',
    descripcion: (
      <div className="space-y-4">
        <p>
          <strong style={{ color: '#c9d4e0' }}>BioteríoDemo</strong> es una herramienta
          diseñada para bioterios de investigación que necesitan hacer seguimiento
          reproductivo de su colonia animal.
        </p>
        <p>
          La app se <strong style={{ color: '#00e676' }}>adapta a tu especie</strong> —
          no importa si trabajás con ratas, ratones, cobayos, conejos o hámsters.
          Vos configurás los parámetros biológicos y el sistema los usa para calcular
          fechas, alertas y scores automáticamente.
        </p>
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)' }}
        >
          <div className="text-sm font-semibold" style={{ color: '#00e676' }}>
            ¿Qué vas a poder hacer?
          </div>
          {[
            '📋 Registrar y seguir a cada animal reproductor',
            '🐣 Gestionar apareamientos, preñeces y camadas',
            '📦 Controlar el stock de animales jóvenes',
            '🔔 Recibir alertas automáticas de tareas pendientes',
            '📊 Ver estadísticas y rendimiento de tu colonia',
            '🖨️ Generar reportes imprimibles',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm" style={{ color: '#8a9bb0' }}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icono: <Dna size={36} />,
    color: '#ce93d8',
    titulo: 'Configurar tu especie',
    subtitulo: 'El primer paso antes de empezar',
    descripcion: (
      <div className="space-y-4">
        <p>
          Cuando entrás a BioteríoDemo por primera vez, la app te pide que elijas
          con qué especie vas a trabajar. Podés elegir entre los
          <strong style={{ color: '#ce93d8' }}> presets incluidos</strong> o
          crear una especie personalizada.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icono: '🐀', nombre: 'Rata',    cientifico: 'Rattus norvegicus', gest: '23 días' },
            { icono: '🐭', nombre: 'Ratón',   cientifico: 'Mus musculus',      gest: '21 días' },
            { icono: '🐹', nombre: 'Cobayo',  cientifico: 'Cavia porcellus',   gest: '65 días' },
            { icono: '🐇', nombre: 'Conejo',  cientifico: 'Oryctolagus cuniculus', gest: '31 días' },
            { icono: '🐹', nombre: 'Hámster', cientifico: 'Mesocricetus auratus',  gest: '16 días' },
            { icono: '🔬', nombre: 'Personalizada', cientifico: 'Cualquier especie', gest: 'configurable' },
          ].map((e) => (
            <div
              key={e.nombre}
              className="rounded-lg px-3 py-2 flex items-center gap-2"
              style={{ background: 'rgba(206,147,216,0.07)', border: '1px solid rgba(206,147,216,0.2)' }}
            >
              <span className="text-xl">{e.icono}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#ce93d8' }}>{e.nombre}</div>
                <div className="text-xs font-mono italic" style={{ color: 'rgba(138,155,176,0.5)' }}>{e.gest}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-3 text-sm"
          style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)', color: '#8a9bb0' }}
        >
          <span style={{ color: '#ffb300' }}>⚙️ Podés cambiar de especie</span> en cualquier
          momento usando el botón <strong style={{ color: '#c9d4e0' }}>↺</strong> que aparece
          en la barra lateral, junto al nombre de la especie activa.
        </div>
      </div>
    ),
  },
  {
    icono: <LayoutDashboard size={36} />,
    color: '#40c4ff',
    titulo: 'Panel de hoy',
    subtitulo: 'Tu centro de control diario',
    descripcion: (
      <div className="space-y-4">
        <p>
          El <strong style={{ color: '#40c4ff' }}>Panel de hoy</strong> es la pantalla
          principal. Cada vez que abrís la app, acá vas a ver qué tareas necesitás
          hacer hoy en tu colonia.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Tipos de tareas
          </div>
          {[
            { color: '#ff3d57', bg: 'rgba(255,61,87,0.1)', label: '🚨 Vencida', desc: 'Debería haberse hecho antes — atención inmediata' },
            { color: '#ffb300', bg: 'rgba(255,179,0,0.1)', label: '⚠️ Hoy',     desc: 'Está programada para el día de hoy' },
            { color: '#40c4ff', bg: 'rgba(64,196,255,0.1)',label: '📅 Próxima', desc: 'En los próximos días — para que te vayas preparando' },
          ].map(({ color, bg, label, desc }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2 flex items-start gap-3"
              style={{ background: bg, border: `1px solid ${color}30` }}
            >
              <span className="text-sm font-bold shrink-0" style={{ color }}>{label}</span>
              <span className="text-xs" style={{ color: '#8a9bb0' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Tareas que genera el sistema
          </div>
          {[
            'Separar pareja (fin del período de apareamiento)',
            'Control de parto (parto esperado hoy o próximo)',
            'Destete (crías listas para separar de la madre)',
            'Evaluación de hembra (muchos apareamientos sin éxito)',
            'Alerta de macho por edad límite',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 text-xs" style={{ color: '#6b7c94' }}>
              <span style={{ color: '#00e676' }}>›</span> {t}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icono: <Users size={36} />,
    color: '#ce93d8',
    titulo: 'Reproductores',
    subtitulo: 'Registrá tus animales reproductivos',
    descripcion: (
      <div className="space-y-4">
        <p>
          En la sección <strong style={{ color: '#ce93d8' }}>Reproductores</strong>{' '}
          registrás cada animal reproductor de tu colonia —
          tanto hembras como machos.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Datos que registrás por animal
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              'ID / código del animal',
              'Sexo (macho o hembra)',
              'Fecha de nacimiento',
              'Jaula o ubicación',
              'Notas o comentarios',
              'Fecha de incorporación',
            ].map((d) => (
              <div key={d} className="text-xs flex items-center gap-1.5" style={{ color: '#8a9bb0' }}>
                <span style={{ color: '#ce93d8' }}>•</span> {d}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Estados de un animal
          </div>
          {[
            { label: 'Activo',           color: '#00e676', desc: 'Disponible para apareamiento' },
            { label: 'En apareamiento',  color: '#40c4ff', desc: 'Conviviendo con la pareja' },
            { label: 'En cría',          color: '#ffb300', desc: 'Preñada o amamantando' },
            { label: 'Retirado',         color: '#8a9bb0', desc: 'Fuera del ciclo reproductivo' },
          ].map(({ label, color, desc }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span
                className="px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
              >
                {label}
              </span>
              <span style={{ color: '#6b7c94' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icono: <Baby size={36} />,
    color: '#ffb300',
    titulo: 'Emparejamientos y camadas',
    subtitulo: 'El corazón del seguimiento reproductivo',
    descripcion: (
      <div className="space-y-4">
        <p>
          Acá registrás todo el ciclo reproductivo desde el apareamiento
          hasta el destete de las crías.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            El flujo de una camada
          </div>
          {[
            { paso: '1', color: '#40c4ff',  texto: 'Registrás la fecha de cópula y qué macho y hembra se juntaron' },
            { paso: '2', color: '#ce93d8', texto: 'La app calcula automáticamente el rango de parto esperado' },
            { paso: '3', color: '#ffb300', texto: 'Cuando nace la camada, registrás fecha y cantidad de crías' },
            { paso: '4', color: '#00e676', texto: 'El sistema genera alerta de destete en la fecha correcta' },
            { paso: '5', color: '#8a9bb0', texto: 'Confirmás el destete y las crías pasan al stock' },
          ].map(({ paso, color, texto }) => (
            <div key={paso} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: `${color}20`, color, border: `1px solid ${color}50` }}
              >
                {paso}
              </div>
              <span className="text-xs" style={{ color: '#8a9bb0' }}>{texto}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)', color: '#8a9bb0' }}
        >
          <span style={{ color: '#ffb300' }}>💡 Tip:</span> BioteríoDemo usa los parámetros
          biológicos de tu especie para calcular las fechas. Si trabajás con cobayos
          (gestación 65 días) los plazos van a ser completamente distintos a los de una
          rata (gestación 23 días).
        </div>
      </div>
    ),
  },
  {
    icono: <Package size={36} />,
    color: '#00e676',
    titulo: 'Stock de animales',
    subtitulo: 'Control de crías y animales no reproductores',
    descripcion: (
      <div className="space-y-4">
        <p>
          El módulo de <strong style={{ color: '#00e676' }}>Stock</strong> te permite
          controlar la cantidad de animales jóvenes disponibles en tu colonia,
          organizados por jaulas o grupos.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Categorías de stock por edad
          </div>
          {[
            { label: 'Crías',    color: '#00e676', desc: 'Menos de 42 días — aún lactantes o recién destetados' },
            { label: 'Jóvenes', color: '#ffb300', desc: 'De 42 días a la madurez sexual' },
            { label: 'Adultos', color: '#ff6b80', desc: 'Mayores a la madurez sexual, sin rol reproductor' },
          ].map(({ label, color, desc }) => (
            <div
              key={label}
              className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: `${color}0d`, border: `1px solid ${color}30` }}
            >
              <span className="font-bold shrink-0" style={{ color }}>{label}</span>
              <span style={{ color: '#6b7c94' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Acciones disponibles desde el stock
          </div>
          {[
            'Registrar sacrificio (experimental o sanitario)',
            'Registrar entrega a otro laboratorio',
            'Promover un animal a reproductor',
            'Asignar y gestionar jaulas de stock',
          ].map((a) => (
            <div key={a} className="flex items-center gap-2 text-xs" style={{ color: '#8a9bb0' }}>
              <span style={{ color: '#00e676' }}>›</span> {a}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icono: <Calendar size={36} />,
    color: '#40c4ff',
    titulo: 'Calendario',
    subtitulo: 'Vista mensual de eventos reproductivos',
    descripcion: (
      <div className="space-y-4">
        <p>
          El <strong style={{ color: '#40c4ff' }}>Calendario</strong> te da una
          vista mensual de todos los eventos programados en tu colonia —
          ideal para planificar el trabajo de la semana.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Eventos que aparecen en el calendario
          </div>
          {[
            { emoji: '✂️', label: 'Separación de parejas',     color: '#ff6b80' },
            { emoji: '🐣', label: 'Partos esperados',           color: '#ffb300' },
            { emoji: '📦', label: 'Destetes programados',       color: '#00e676' },
            { emoji: '🌱', label: 'Madurez sexual de camadas',  color: '#ce93d8' },
            { emoji: '🔬', label: 'Revisiones de ciclo estral', color: '#40c4ff' },
          ].map(({ emoji, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span>{emoji}</span>
              <span style={{ color }}>{label}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(64,196,255,0.06)', border: '1px solid rgba(64,196,255,0.2)', color: '#8a9bb0' }}
        >
          <span style={{ color: '#40c4ff' }}>💡 Tip:</span> Podés navegar entre meses
          usando las flechas. Los días con eventos aparecen marcados — hacé clic
          en un día para ver el detalle de qué eventos tiene.
        </div>
      </div>
    ),
  },
  {
    icono: <TrendingUp size={36} />,
    color: '#ce93d8',
    titulo: 'Rendimiento y estadísticas',
    subtitulo: 'Medí el desempeño de tu colonia',
    descripcion: (
      <div className="space-y-4">
        <p>
          Los módulos de <strong style={{ color: '#ce93d8' }}>Rendimiento</strong> y{' '}
          <strong style={{ color: '#ce93d8' }}>Estadísticas</strong> te dan herramientas
          para analizar qué tan bien está funcionando tu colonia.
        </p>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#ce93d8' }}>
              📈 Rendimiento — análisis por animal
            </div>
            <div className="space-y-1">
              {[
                'Score reproductivo de cada hembra (latencia, tamaño de camadas, supervivencia)',
                'Indicador de confiabilidad: qué tan predecible es una hembra',
                'Machos: tasa de fertilidad y alertas de edad límite',
                'Recomendaciones de descarte cuando un animal baja su performance',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-xs" style={{ color: '#8a9bb0' }}>
                  <span style={{ color: '#ce93d8', marginTop: '1px' }}>›</span> {t}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#40c4ff' }}>
              📊 Estadísticas — visión global de la colonia
            </div>
            <div className="space-y-1">
              {[
                'Tendencia de nacimientos y destetes por mes',
                'Distribución de la colonia por sexo y estado',
                'Promedio de crías por camada',
                'Evolución del stock a lo largo del tiempo',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2 text-xs" style={{ color: '#8a9bb0' }}>
                  <span style={{ color: '#40c4ff', marginTop: '1px' }}>›</span> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icono: <Thermometer size={36} />,
    color: '#ff6b80',
    titulo: 'Temperatura e incidentes',
    subtitulo: 'Registro de condiciones y eventos adversos',
    descripcion: (
      <div className="space-y-4">
        <p>
          Estos módulos te permiten llevar un registro de las{' '}
          <strong style={{ color: '#ff6b80' }}>condiciones ambientales</strong> y
          de cualquier <strong style={{ color: '#ff6b80' }}>evento inesperado</strong>{' '}
          que ocurra en el bioterio.
        </p>

        <div className="space-y-3">
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(255,107,128,0.07)', border: '1px solid rgba(255,107,128,0.2)' }}
          >
            <div className="text-xs font-semibold" style={{ color: '#ff6b80' }}>
              🌡️ Temperatura
            </div>
            <div className="text-xs" style={{ color: '#8a9bb0' }}>
              Registrá la temperatura del bioterio una o más veces por día.
              El sistema guarda el historial y te muestra si hay valores
              fuera del rango habitual para tu especie.
            </div>
          </div>

          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(255,179,0,0.07)', border: '1px solid rgba(255,179,0,0.2)' }}
          >
            <div className="text-xs font-semibold" style={{ color: '#ffb300' }}>
              ⚠️ Incidentes
            </div>
            <div className="text-xs" style={{ color: '#8a9bb0' }}>
              Anotá cualquier evento adverso: muerte accidental, fuga, enfermedad,
              problema con la instalación. Cada incidente queda registrado con
              fecha, descripción y animal afectado (si aplica).
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-3 text-xs"
          style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', color: '#8a9bb0' }}
        >
          <span style={{ color: '#00e676' }}>💡 Buena práctica:</span> Registrar
          la temperatura diariamente y documentar incidentes es útil para
          auditorías institucionales y para detectar patrones que afecten
          la reproducción.
        </div>
      </div>
    ),
  },
  {
    icono: <Printer size={36} />,
    color: '#ffb300',
    titulo: 'Reportes',
    subtitulo: 'Informes imprimibles de tu colonia',
    descripcion: (
      <div className="space-y-4">
        <p>
          Desde <strong style={{ color: '#ffb300' }}>Reportes</strong> podés generar
          informes listos para imprimir o guardar como PDF. Útil para
          reuniones, auditorías o para llevar un registro en papel.
        </p>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(138,155,176,0.5)' }}>
            Informes disponibles
          </div>
          {[
            { emoji: '🐾', label: 'Estado de reproductores',    desc: 'Lista completa de machos y hembras activos con su estado' },
            { emoji: '🐣', label: 'Camadas activas',            desc: 'Todas las preñeces y crías en curso con fechas clave' },
            { emoji: '📦', label: 'Inventario de stock',        desc: 'Animales jóvenes disponibles por grupo y categoría de edad' },
            { emoji: '🌡️', label: 'Registro de temperaturas',  desc: 'Historial de temperatura del período seleccionado' },
            { emoji: '⚠️', label: 'Incidentes registrados',    desc: 'Log de eventos adversos en el período' },
          ].map(({ emoji, label, desc }) => (
            <div
              key={label}
              className="rounded-lg px-3 py-2 flex items-start gap-3"
              style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)' }}
            >
              <span className="text-lg shrink-0">{emoji}</span>
              <div>
                <div className="text-xs font-semibold" style={{ color: '#ffb300' }}>{label}</div>
                <div className="text-xs" style={{ color: '#6b7c94' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icono: <Star size={36} />,
    color: '#00e676',
    titulo: '¡Listo para empezar!',
    subtitulo: 'Ya sabés todo lo que necesitás saber',
    descripcion: (
      <div className="space-y-4">
        <p>
          Ahora tenés una visión completa de BioteríoDemo.
          Te dejamos un resumen del flujo de trabajo recomendado para cuando arrancás:
        </p>

        <div className="space-y-2">
          {[
            { n: '1', texto: 'Configurá tu especie en el selector inicial',                      color: '#ce93d8' },
            { n: '2', texto: 'Registrá tus animales reproductores en la sección Reproductores',  color: '#40c4ff' },
            { n: '3', texto: 'Cuando apareás una pareja, anotá la cópula en Camadas',            color: '#ffb300' },
            { n: '4', texto: 'Revisá el Panel de hoy a diario para ver tus tareas pendientes',   color: '#00e676' },
            { n: '5', texto: 'Cuando nazcan crías, registrá el nacimiento y esperá la alerta de destete', color: '#ff6b80' },
            { n: '6', texto: 'Usá Rendimiento para identificar tus mejores reproductores',       color: '#ce93d8' },
          ].map(({ n, texto, color }) => (
            <div key={n} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
              >
                {n}
              </div>
              <span className="text-sm" style={{ color: '#8a9bb0' }}>{texto}</span>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}
        >
          <div className="font-bold text-sm mb-1" style={{ color: '#00e676' }}>
            ¿Necesitás volver a ver este tutorial?
          </div>
          <div className="text-xs" style={{ color: '#6b7c94' }}>
            Podés acceder desde el menú lateral, en la sección{' '}
            <strong style={{ color: '#8a9bb0' }}>Tutorial</strong> — siempre va a estar ahí.
          </div>
        </div>
      </div>
    ),
  },
]

// ── Componente principal ──────────────────────────────────────────────────────

export default function Tutorial() {
  const [paso, setPaso] = useState(0)
  const navigate = useNavigate()
  const total = PASOS.length
  const actual = PASOS[paso]
  const esUltimo = paso === total - 1

  function siguiente() {
    if (esUltimo) navigate('/')
    else setPaso((p) => p + 1)
  }

  function anterior() {
    if (paso > 0) setPaso((p) => p - 1)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-8 px-4"
      style={{ background: '#050810' }}
    >
      {/* Encabezado */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={14} style={{ color: 'rgba(0,230,118,0.5)' }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'rgba(0,230,118,0.5)' }}>
            Tutorial
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#4a5f7a' }}>
            Paso {paso + 1} de {total}
          </span>
          <button
            onClick={() => navigate('/')}
            className="text-xs px-3 py-1 rounded-lg transition-all"
            style={{ color: '#4a5f7a', background: 'rgba(30,51,82,0.3)', border: '1px solid rgba(30,51,82,0.6)' }}
          >
            Saltar tutorial
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full max-w-lg mb-6">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(30,51,82,0.8)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((paso + 1) / total) * 100}%`,
              background: `linear-gradient(90deg, ${actual.color}, ${actual.color}99)`,
            }}
          />
        </div>

        {/* Puntos de progreso */}
        <div className="flex justify-between mt-2">
          {PASOS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPaso(i)}
              title={p.titulo}
              className="transition-all duration-200"
              style={{
                width: i === paso ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i < paso
                  ? '#00e676'
                  : i === paso
                    ? actual.color
                    : 'rgba(30,51,82,0.8)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Tarjeta del paso */}
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #080d1a 0%, #050810 100%)',
          border: `1px solid ${actual.color}30`,
          boxShadow: `0 0 40px ${actual.color}10`,
        }}
      >
        {/* Header del paso */}
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${actual.color}12 0%, transparent 100%)`,
            borderBottom: `1px solid ${actual.color}20`,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `${actual.color}15`,
              border: `1px solid ${actual.color}35`,
              color: actual.color,
            }}
          >
            {actual.icono}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight" style={{ color: '#c9d4e0' }}>
              {actual.titulo}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: actual.color + 'cc' }}>
              {actual.subtitulo}
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div
          className="px-6 py-5 text-sm leading-relaxed"
          style={{ color: '#8a9bb0' }}
        >
          {actual.descripcion}
        </div>

        {/* Navegación */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${actual.color}15` }}
        >
          <button
            onClick={anterior}
            disabled={paso === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: paso === 0 ? 'transparent' : 'rgba(30,51,82,0.4)',
              border: `1px solid ${paso === 0 ? 'transparent' : 'rgba(30,51,82,0.8)'}`,
              color: paso === 0 ? 'rgba(74,95,122,0.4)' : '#8a9bb0',
              cursor: paso === 0 ? 'default' : 'pointer',
            }}
          >
            <ChevronLeft size={15} />
            Anterior
          </button>

          <button
            onClick={siguiente}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `linear-gradient(135deg, ${actual.color}25 0%, ${actual.color}15 100%)`,
              border: `1px solid ${actual.color}50`,
              color: actual.color,
              boxShadow: `0 0 16px ${actual.color}15`,
            }}
          >
            {esUltimo ? (
              <>
                <CheckCircle2 size={15} />
                Ir al panel
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Índice de pasos */}
      <div className="w-full max-w-lg mt-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(138,155,176,0.4)' }}>
          Contenido del tutorial
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PASOS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPaso(i)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-xs"
              style={{
                background: i === paso
                  ? `${p.color}12`
                  : i < paso
                    ? 'rgba(0,230,118,0.05)'
                    : 'rgba(8,13,26,0.8)',
                border: i === paso
                  ? `1px solid ${p.color}35`
                  : i < paso
                    ? '1px solid rgba(0,230,118,0.15)'
                    : '1px solid rgba(30,51,82,0.5)',
                color: i === paso ? p.color : i < paso ? '#4a5f7a' : '#2a3a50',
                cursor: 'pointer',
              }}
            >
              {i < paso ? (
                <CheckCircle2 size={12} style={{ color: '#00e676', shrink: 0 }} />
              ) : (
                <span
                  className="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: i === paso ? `${p.color}20` : 'rgba(30,51,82,0.5)',
                    fontSize: '8px',
                    color: i === paso ? p.color : '#2a3a50',
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span className="truncate">{p.titulo}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
