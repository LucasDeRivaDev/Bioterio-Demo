// ════════════════════════════════════════════════════════════════════════════
//  COLONIA DEMOSTRATIVA COMPLETA — ITeRatE Demo
//  ----------------------------------------------------------------------------
//  Genera una colonia ficticia multi-bioterio con ~18 meses de historia
//  diseñada para una demostración comercial: contiene un ejemplo de CADA
//  escenario que el sistema sabe gestionar (reproductores, emparejamientos,
//  preñeces, camadas, destetes, madurez, stock, entregas, sacrificios,
//  incidentes, temperaturas, calendario, rankings y genealogía).
//
//  Todas las fechas son RELATIVAS A HOY (se calculan en cada carga / reset),
//  de modo que el "Panel de Hoy", el calendario y las tareas automáticas
//  siempre muestran escenarios vigentes (destete hoy, parto esperado hoy,
//  madurez hoy, macho próximo a retiro, etc.).
//
//  Especies / bioterios:
//    · ratas            → Ratas Wistar
//    · ratones_balbc    → Ratones BALB/c
//    · ratones_c57      → Ratones C57BL/6
//    · ratones_hibridos → Ratones Híbridos F1 (BALB/c × C57BL/6)
// ════════════════════════════════════════════════════════════════════════════

const MS_DIA = 86_400_000

// Devuelve una fecha YYYY-MM-DD desplazada `offset` días respecto de hoy
// (offset negativo = pasado, positivo = futuro). Se ancla al mediodía para
// evitar saltos de día por husos horarios / horario de verano.
function diaISO(offset) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setTime(d.getTime() + offset * MS_DIA)
  return d.toISOString().split('T')[0]
}

// Parámetros biológicos por bioterio (deben coincidir con utils/constants.js)
const PARAM = {
  ratas:            { gest: 23, destete: 21, madurez: 84 },
  ratones_balbc:    { gest: 21, destete: 21, madurez: 56 },
  ratones_c57:      { gest: 21, destete: 21, madurez: 56 },
  ratones_hibridos: { gest: 21, destete: 21, madurez: 56 },
}

// ════════════════════════════════════════════════════════════════════════════
//  GENERADOR
// ════════════════════════════════════════════════════════════════════════════
function generar() {
  const animales     = []
  const camadas      = []
  const jaulas       = []
  const sacrificios  = []
  const entregas     = []
  const temperaturas = []
  const incidentes   = []
  const extendidos   = []

  // ── Builders ───────────────────────────────────────────────────────────────
  function animal(a) {
    animales.push({
      id:                a.id,
      codigo:            a.codigo,
      sexo:              a.sexo,
      estado:            a.estado ?? 'activo',
      fecha_nacimiento:  diaISO(a.nac),
      id_madre:          a.madre ?? null,
      id_padre:          a.padre ?? null,
      notas:             a.notas ?? '',
      nota_tipo:         a.nota_tipo ?? 'normal',
      fecha_sacrificio:  a.sac ? diaISO(a.sac.fecha) : null,
      motivo_sacrificio: a.sac ? a.sac.motivo : null,
      exportado_hibridos: a.exportado ?? false,
      bioterio_id:       a.bio,
    })
    // Reproductor fallecido → registro de sacrificio (categoría reproductor)
    if (a.sac) {
      sacrificios.push({
        id: `sac-rep-${a.id}`, camada_id: null, animal_id: a.id,
        cantidad: 1, fecha: diaISO(a.sac.fecha), categoria: 'reproductor',
        notas: a.sac.motivo, bioterio_id: a.bio,
      })
    }
    // Reproductor retirado → registro de entrega
    if (a.entrega) {
      entregas.push({
        id: `ent-rep-${a.id}`, camada_id: null, animal_id: a.id,
        cantidad: 1, fecha: diaISO(a.entrega.fecha),
        observaciones: a.entrega.obs, bioterio_id: a.bio,
      })
    }
  }

  function pushCamada(c) {
    camadas.push({
      id:               c.id,
      id_madre:         c.madre ?? null,
      id_padre:         c.padre ?? null,
      fecha_copula:     c.copula     != null ? diaISO(c.copula)     : null,
      fecha_separacion: c.separacion != null ? diaISO(c.separacion) : null,
      fecha_nacimiento: c.nac        != null ? diaISO(c.nac)        : null,
      fecha_destete:    c.destete    != null ? diaISO(c.destete)    : null,
      gestacion_real:   c.gestacion ?? null,
      total_crias:      c.crias ?? null,
      crias_machos:     c.cm ?? null,
      crias_hembras:    c.ch ?? null,
      total_destetados: c.destetados ?? null,
      failure_flag:     !!c.failure,
      failure_type:     c.failure ?? null,
      incluir_en_stock: c.stock !== false,
      notas:            c.notas ?? '',
      bioterio_id:      c.bio,
    })
    if (c.jaula != null && c.jaula > 0) {
      jaulas.push({
        id: `jaula-${c.id}`, camada_id: c.id, total: c.jaula,
        machos: c.jm ?? null, hembras: c.jh ?? null,
        notas: c.jnotas ?? '', bioterio_id: c.bio,
      })
    }
  }

  // Camada finalizada y destetada (en stock si se pasa `jaula`)
  function completa(bio, id, madre, padre, nac, lat, crias, cm, ch, dest, jaula, jm, jh, notas, jnotas) {
    const p = PARAM[bio]
    pushCamada({
      bio, id, madre, padre, nac, gestacion: p.gest,
      copula: nac - p.gest - lat, separacion: nac - p.gest - lat + 15,
      destete: nac + p.destete,
      crias, cm, ch, destetados: dest,
      jaula, jm, jh, notas, jnotas,
    })
  }

  // Camada nacida pero aún lactando (sin destete → genera tarea de destete)
  function lactante(bio, id, madre, padre, nac, lat, crias, cm, ch, notas) {
    const p = PARAM[bio]
    pushCamada({
      bio, id, madre, padre, nac, gestacion: p.gest,
      copula: nac - p.gest - lat, separacion: nac - p.gest - lat + 15,
      destete: null, crias, cm, ch, destetados: null, notas,
    })
  }

  // Hembra preñada (cópula confirmada, sin parto todavía)
  function gestacion(bio, id, madre, padre, copula, notas) {
    pushCamada({
      bio, id, madre, padre, copula,
      separacion: copula + 15 <= 0 ? copula + 15 : null,
      notas,
    })
  }

  // Emparejamiento con fallo reproductivo
  function fallo(bio, id, madre, padre, copula, ftype, notas) {
    pushCamada({ bio, id, madre, padre, copula, separacion: copula + 15, failure: ftype, notas })
  }

  function sacrificio(bio, id, camada, cantidad, fecha, categoria, notas) {
    sacrificios.push({ id, camada_id: camada, animal_id: null, cantidad, fecha: diaISO(fecha), categoria, notas, bioterio_id: bio })
  }

  function entrega(bio, id, camada, cantidad, fecha, obs) {
    entregas.push({ id, camada_id: camada, animal_id: null, cantidad, fecha: diaISO(fecha), observaciones: obs, bioterio_id: bio })
  }

  function incidente(i) {
    incidentes.push({
      id:             i.id,
      fecha:          diaISO(i.fecha),
      tipo_categoria: i.cat,
      tipo_incidente: i.tipo,
      severidad:      i.sev ?? 'leve',
      descripcion:    i.desc ?? null,
      animal_id:      i.animal ?? (i.animales?.[0] ?? null),
      animal_ids:     i.animales ?? (i.animal ? [i.animal] : []),
      camada_id:      i.camada ?? null,
      padre_id:       i.padre ?? null,
      madre_id:       i.madre ?? null,
      duracion_dias:  i.duracion ?? null,
      linea_genetica: i.linea ?? null,
      resuelto:       i.resuelto ?? false,
      bioterio_id:    i.bio,
    })
  }

  // 60 días de temperatura terminando hoy; `alertas` = { offset: tempForzada }
  function genTemps(bio, base, alertas = {}) {
    for (let off = -59; off <= 0; off++) {
      let cur = base + Math.sin(off * 0.7) * 0.7
      cur = Math.round(cur * 10) / 10
      if (alertas[off] != null) cur = alertas[off]
      temperaturas.push({
        id: `temp-${bio}-${60 + off}`, date: diaISO(off), time: '08:00',
        current_temp: cur,
        min_temp: Math.round((cur - 1.2) * 10) / 10,
        max_temp: Math.round((cur + 1.4) * 10) / 10,
        bioterio_id: bio,
      })
    }
  }

  // Serie de extendidos vaginales (ciclo estral) que culmina en cópula confirmada
  function cicloEstral(bio, animalId, copulaOffset) {
    const dias = [
      { d: copulaOffset - 4, citologia: 'leucocitos',        claridad: 'claro',      apertura: 'no',     lordosis: 'no',     copula: 'no_observado', esperma: 'no_encontrados', fase: 'L1', dia0: false, notas: 'Inicio del ciclo.' },
      { d: copulaOffset - 3, citologia: 'celulas_ovales',    claridad: 'claro',      apertura: 'dudosa', lordosis: 'no',     copula: 'no_observado', esperma: 'no_encontrados', fase: 'L2', dia0: false, notas: '' },
      { d: copulaOffset - 2, citologia: 'celulas_ovales',    claridad: 'poco_claro', apertura: 'si',     lordosis: 'dudosa', copula: 'no_observado', esperma: 'no_encontrados', fase: 'L3', dia0: false, notas: '' },
      { d: copulaOffset - 1, citologia: 'celulas_escamosas', claridad: 'claro',      apertura: 'si',     lordosis: 'si',     copula: 'no_observado', esperma: 'no_encontrados', fase: 'O',  dia0: false, notas: 'Pico de estro.' },
      { d: copulaOffset,     citologia: 'celulas_escamosas', claridad: 'poco_claro', apertura: 'si',     lordosis: 'si',     copula: 'confirmada',   esperma: 'encontrados',    fase: 'E',  dia0: true,  notas: 'Cópula confirmada. Día 0 de gestación.' },
    ]
    dias.forEach((x, i) => {
      extendidos.push({
        id: `ext-${animalId}-${i}`, animal_id: animalId, bioterio_id: bio,
        fecha: diaISO(x.d), citologia: x.citologia, claridad: x.claridad,
        apertura_vaginal: x.apertura, lordosis: x.lordosis, copula: x.copula,
        espermatozoides: x.esperma, fase: x.fase, fase_confirmada: true,
        es_dia_0: x.dia0, notas: x.notas,
      })
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BIOTERIO 1 — RATAS WISTAR  (showcase principal)
  //  10 machos + 20 hembras reproductores activos + históricos
  // ══════════════════════════════════════════════════════════════════════════
  const RB = 'ratas'

  // — Fundadores (generación 0, históricos) → raíz de la genealogía —
  animal({ bio: RB, id: 'ratas-fm', codigo: 'WM-F1', sexo: 'macho',  nac: -560, estado: 'retirado',
           notas: 'Fundador de la colonia (línea Wistar original). Retirado por edad tras 16 meses de servicio.' })
  animal({ bio: RB, id: 'ratas-fh', codigo: 'WH-F1', sexo: 'hembra', nac: -540, estado: 'retirado',
           notas: 'Fundadora de la colonia. 3 ciclos completados. Retirada.' })

  // — Machos reproductores activos (gen 1, hijos de fundadores) —
  animal({ bio: RB, id: 'ratas-m01', codigo: 'WM-01', sexo: 'macho', nac: -200, madre: 'ratas-fh', padre: 'ratas-fm',
           notas: '★ Mejor macho de la colonia. Latencia 1–2 días, camadas grandes y parejas.' })
  animal({ bio: RB, id: 'ratas-m02', codigo: 'WM-02', sexo: 'macho', nac: -180, madre: 'ratas-fh', padre: 'ratas-fm' })
  animal({ bio: RB, id: 'ratas-m03', codigo: 'WM-03', sexo: 'macho', nac: -160 })
  animal({ bio: RB, id: 'ratas-m04', codigo: 'WM-04', sexo: 'macho', nac: -220,
           notas: 'Bajo rendimiento: latencias altas y camadas chicas. Candidato a recambio.', nota_tipo: 'critica' })
  animal({ bio: RB, id: 'ratas-m05', codigo: 'WM-05', sexo: 'macho', nac: -150 })
  animal({ bio: RB, id: 'ratas-m06', codigo: 'WM-06', sexo: 'macho', nac: -140 })
  animal({ bio: RB, id: 'ratas-m07', codigo: 'WM-07', sexo: 'macho', nac: -130 })
  animal({ bio: RB, id: 'ratas-m08', codigo: 'WM-08', sexo: 'macho', nac: -95, madre: 'ratas-h01', padre: 'ratas-m01',
           notas: 'Recién promovido a reproductor (3.ª generación). Aún sin camadas.' })
  animal({ bio: RB, id: 'ratas-m09', codigo: 'WM-09', sexo: 'macho', nac: -240 })
  animal({ bio: RB, id: 'ratas-m10', codigo: 'WM-10', sexo: 'macho', nac: -265,
           notas: 'Próximo al límite de edad reproductiva (9 meses). Planificar reemplazo.' })

  // — Machos históricos —
  animal({ bio: RB, id: 'ratas-mh1', codigo: 'WM-H1', sexo: 'macho', nac: -330, estado: 'fallecido',
           sac: { fecha: -40, motivo: 'Sacrificio por edad límite (>9 meses)' } })
  animal({ bio: RB, id: 'ratas-mh2', codigo: 'WM-H2', sexo: 'macho', nac: -300, estado: 'retirado',
           entrega: { fecha: -30, obs: 'Dr. Pérez — Cátedra de Farmacología' },
           notas: 'Reproductor entregado a investigador.' })

  // — Hembras reproductoras activas (gen 1) —
  animal({ bio: RB, id: 'ratas-h01', codigo: 'WH-01', sexo: 'hembra', nac: -270, madre: 'ratas-fh', padre: 'ratas-fm',
           notas: '★ Mejor hembra / hembra excelente. Camadas grandes, 100% de supervivencia.' })
  animal({ bio: RB, id: 'ratas-h02', codigo: 'WH-02', sexo: 'hembra', nac: -250, madre: 'ratas-fh', padre: 'ratas-fm',
           notas: 'Fin de ciclo reproductivo: 3 camadas completadas. Lista para descarte.' })
  animal({ bio: RB, id: 'ratas-h03', codigo: 'WH-03', sexo: 'hembra', nac: -230 })
  animal({ bio: RB, id: 'ratas-h04', codigo: 'WH-04', sexo: 'hembra', nac: -210, notas: 'Reabsorción registrada. En observación.' })
  animal({ bio: RB, id: 'ratas-h05', codigo: 'WH-05', sexo: 'hembra', nac: -200, estado: 'en_cria', notas: 'Gestante. Parto esperado para hoy.' })
  animal({ bio: RB, id: 'ratas-h06', codigo: 'WH-06', sexo: 'hembra', nac: -190, estado: 'en_cria', notas: 'Gestante. Parto esperado en ~5 días.' })
  animal({ bio: RB, id: 'ratas-h07', codigo: 'WH-07', sexo: 'hembra', nac: -185, estado: 'en_apareamiento', notas: 'En apareamiento (día 10). Separación próxima.' })
  animal({ bio: RB, id: 'ratas-h08', codigo: 'WH-08', sexo: 'hembra', nac: -240, estado: 'en_cria', notas: 'Lactando. Destete programado para hoy.' })
  animal({ bio: RB, id: 'ratas-h09', codigo: 'WH-09', sexo: 'hembra', nac: -245, estado: 'en_cria', notas: 'Lactando. Destete vencido — separar.' })
  animal({ bio: RB, id: 'ratas-h10', codigo: 'WH-10', sexo: 'hembra', nac: -235, estado: 'en_cria', notas: 'Lactando. Destete en 4 días.' })
  animal({ bio: RB, id: 'ratas-h11', codigo: 'WH-11', sexo: 'hembra', nac: -260 })
  animal({ bio: RB, id: 'ratas-h12', codigo: 'WH-12', sexo: 'hembra', nac: -255 })
  animal({ bio: RB, id: 'ratas-h13', codigo: 'WH-13', sexo: 'hembra', nac: -220, estado: 'en_cria', notas: 'Parto reciente (hace 5 días). Camada saludable.' })
  animal({ bio: RB, id: 'ratas-h14', codigo: 'WH-14', sexo: 'hembra', nac: -265 })
  animal({ bio: RB, id: 'ratas-h15', codigo: 'WH-15', sexo: 'hembra', nac: -160 })
  animal({ bio: RB, id: 'ratas-h16', codigo: 'WH-16', sexo: 'hembra', nac: -150 })
  animal({ bio: RB, id: 'ratas-h17', codigo: 'WH-17', sexo: 'hembra', nac: -140 })
  animal({ bio: RB, id: 'ratas-h18', codigo: 'WH-18', sexo: 'hembra', nac: -175, notas: 'Camada pequeña en su último parto (6 crías). Monitorear.' })
  animal({ bio: RB, id: 'ratas-h19', codigo: 'WH-19', sexo: 'hembra', nac: -280,
           notas: 'Hembra NO apta: 2 fallos reproductivos + camada chica. Baja confiabilidad — descartar.', nota_tipo: 'critica' })
  animal({ bio: RB, id: 'ratas-h20', codigo: 'WH-20', sexo: 'hembra', nac: -130, notas: 'Joven, primera generación. Aún no apareada.' })

  // — Hembra histórica (descarte genético) —
  animal({ bio: RB, id: 'ratas-hh1', codigo: 'WH-H1', sexo: 'hembra', nac: -320, estado: 'fallecido',
           sac: { fecha: -50, motivo: 'Descarte por selección genética (línea de baja prolificidad)' } })

  // — Camadas (cubren todos los escenarios) —
  // Excepcional + exitosa (mejor macho/hembra)  → stock jóvenes
  completa(RB, 'cam-r-01', 'ratas-h01', 'ratas-m01', -45, 1, 13, 6, 7, 13, 13, 6, 7, 'Parto sin complicaciones. Camada excepcional, todos saludables.', '')
  // Promedio, con entrega parcial               → stock adultos
  completa(RB, 'cam-r-02', 'ratas-h02', 'ratas-m01', -100, 2, 11, 5, 6, 11, 7, 3, 4, 'Camada normal. 4 crías entregadas a protocolo.', '')
  // Históricas de WH-02 (para cerrar 3 ciclos → fin de ciclo)
  completa(RB, 'cam-r-02b', 'ratas-h02', 'ratas-m09', -200, 3, 10, 5, 5, 10, null, null, null, 'Camada histórica. Crías destinadas a protocolo externo.')
  completa(RB, 'cam-r-02c', 'ratas-h02', 'ratas-m02', -150, 2, 11, 6, 5, 11, null, null, null, 'Camada histórica.')
  // Con mortalidad neonatal + reducción         → stock crías
  completa(RB, 'cam-r-03', 'ratas-h03', 'ratas-m02', -30, 3, 10, 5, 5, 9, 7, 4, 3, '1 muerte neonatal. Camada reducida a tamaño manejable.', 'Separar pronto.')
  // Camada pequeña (<8)                          → stock jóvenes + alerta evaluar hembra
  completa(RB, 'cam-r-04', 'ratas-h18', 'ratas-m04', -60, 8, 6, 3, 3, 6, 6, 3, 3, 'Camada pequeña (6 crías). Latencia alta del macho.', '')
  // Baja supervivencia (canibalismo)            → stock jóvenes + alerta
  completa(RB, 'cam-r-05', 'ratas-h19', 'ratas-m04', -75, 10, 9, 5, 4, 5, 4, 2, 2, 'Canibalismo parcial. Supervivencia 55%.', '')
  // Histórica chica de WH-19
  completa(RB, 'cam-r-19', 'ratas-h19', 'ratas-m09', -180, 5, 7, 4, 3, 7, null, null, null, 'Camada chica histórica.')
  // Fallos reproductivos (3 tipos)
  fallo(RB, 'cam-r-06', 'ratas-h19', 'ratas-m02', -40, 'no_birth', 'Sin signos de parto a 30 días post-cópula.')
  fallo(RB, 'cam-r-08', 'ratas-h19', 'ratas-m01', -90, 'failed_pregnancy', 'Preñez interrumpida.')
  fallo(RB, 'cam-r-07', 'ratas-h04', 'ratas-m03', -55, 'reabsorption', 'Reabsorción sospechada por ecografía.')
  // Gestaciones
  gestacion(RB, 'cam-r-09', 'ratas-h05', 'ratas-m01', -24, 'Día 0 confirmado por extendido. Parto esperado para hoy.')
  gestacion(RB, 'cam-r-10', 'ratas-h06', 'ratas-m02', -22, 'Gestación en curso. Parto esperado en los próximos días.')
  gestacion(RB, 'cam-r-11', 'ratas-h07', 'ratas-m03', -10, 'Emparejamiento recién iniciado (día 10). Separación próxima.')
  // Destetes (hoy / vencido / próximo) — lactantes sin destete aún
  lactante(RB, 'cam-r-12', 'ratas-h08', 'ratas-m05', -21, 2, 11, 6, 5, 'Destete programado para hoy.')
  lactante(RB, 'cam-r-13', 'ratas-h09', 'ratas-m05', -24, 3, 10, 5, 5, 'Destete vencido hace 3 días.')
  lactante(RB, 'cam-r-14', 'ratas-h10', 'ratas-m06', -17, 2, 12, 6, 6, 'Destete en 4 días.')
  // Parto reciente (lactante)
  lactante(RB, 'cam-r-17', 'ratas-h13', 'ratas-m07', -5, 1, 12, 6, 6, 'Parto hace 5 días. Camada saludable.')
  // Madurez (hoy / próxima / recién) — camadas destetadas en stock
  completa(RB, 'cam-r-15', 'ratas-h11', 'ratas-m01', -84, 2, 10, 4, 6, 10, 8, 3, 5, 'Crías alcanzan madurez reproductiva hoy.', '')
  completa(RB, 'cam-r-16', 'ratas-h12', 'ratas-m02', -79, 2, 11, 5, 6, 11, 11, 5, 6, 'Crías próximas a madurez (~5 días).', '')
  completa(RB, 'cam-r-20', 'ratas-h15', 'ratas-m03', -85, 3, 10, 5, 5, 10, 10, 5, 5, 'Crías recién maduras.', '')
  // Stock adultos antiguo
  completa(RB, 'cam-r-18', 'ratas-h14', 'ratas-m01', -120, 1, 12, 6, 6, 12, 10, 5, 5, 'Camada antigua, en stock como adultos.', '')

  // — Sacrificios de stock (por categoría) —
  sacrificio(RB, 'sac-r-01', 'cam-r-18', 2, -100, 'joven',  'Control de densidad poblacional')
  sacrificio(RB, 'sac-r-02', 'cam-r-03', 2, -22,  'cria',   'Reducción de camada a tamaño manejable')
  sacrificio(RB, 'sac-r-03', 'cam-r-05', 1, -55,  'cria',   'Sacrificio sanitario (cría con dermatitis severa)')

  // — Entregas de stock —
  entrega(RB, 'ent-r-01', 'cam-r-02', 4, -60, 'Dra. Martínez — Protocolo 042 (Fisiología renal) — entrega parcial')
  entrega(RB, 'ent-r-02', 'cam-r-15', 2, -3,  'Lab. Histología — entrega reciente')

  // — Incidentes —
  incidente({ bio: RB, id: 'inc-r-01', fecha: -18, cat: 'ambiental', tipo: 'corte_energia', sev: 'moderado', duracion: 1, resuelto: true,
              desc: 'Corte de energía de 3 h. La temperatura descendió a 17 °C. Se monitorearon todos los neonatos: sin bajas.' })
  incidente({ bio: RB, id: 'inc-r-02', fecha: -40, cat: 'ambiental', tipo: 'temperatura_alta', sev: 'leve', resuelto: true,
              desc: 'Pico de temperatura a 27 °C por falla transitoria de climatización. Corregido en el día.' })
  incidente({ bio: RB, id: 'inc-r-03', fecha: -8, cat: 'sanitario', tipo: 'heridas', sev: 'leve', animales: ['ratas-h03'], resuelto: true,
              desc: 'WH-03 con heridas leves por peleas. Separada preventivamente. Recuperada.' })
  incidente({ bio: RB, id: 'inc-r-04', fecha: -53, cat: 'reproductivo', tipo: 'reabsorcion', sev: 'moderado', camada: 'cam-r-07', madre: 'ratas-h04', padre: 'ratas-m03',
              desc: 'Reabsorción confirmada en WH-04: sin parto a los 30 días post-cópula.' })
  incidente({ bio: RB, id: 'inc-r-05', fecha: -73, cat: 'reproductivo', tipo: 'canibalismo', sev: 'grave', camada: 'cam-r-05', madre: 'ratas-h19', padre: 'ratas-m04',
              desc: 'Canibalismo parcial de la camada de WH-19. Supervivencia 55%.' })
  incidente({ bio: RB, id: 'inc-r-06', fecha: -29, cat: 'reproductivo', tipo: 'muerte_neonatal', sev: 'leve', camada: 'cam-r-03', madre: 'ratas-h03', padre: 'ratas-m02',
              desc: '1 muerte neonatal en la camada de WH-03.' })

  // — Temperaturas (60 días, con 2 alertas históricas correlacionadas) —
  genTemps(RB, 22.0, { '-18': 17.2, '-40': 27.1 })

  // — Ciclo estral de la hembra en apareamiento —
  cicloEstral(RB, 'ratas-h07', -10)

  // ══════════════════════════════════════════════════════════════════════════
  //  BIOTERIOS DE RATONES — generador parametrizado
  // ══════════════════════════════════════════════════════════════════════════
  function generarRatones({ bio, pfx, nM, nH, exportM = 0, exportH = 0 }) {
    const P = PARAM[bio]

    // — Fundadores —
    animal({ bio, id: `${bio}-fm`, codigo: `${pfx}M-F1`, sexo: 'macho',  nac: -520, estado: 'retirado',
             notas: 'Fundador de la línea. Retirado por edad.' })
    animal({ bio, id: `${bio}-fh`, codigo: `${pfx}H-F1`, sexo: 'hembra', nac: -500, estado: 'retirado',
             notas: 'Fundadora de la línea. Retirada tras 3 ciclos.' })

    // — Machos activos —
    for (let i = 1; i <= nM; i++) {
      const id = `${bio}-m${String(i).padStart(2, '0')}`
      const codigo = `${pfx}M-${String(i).padStart(2, '0')}`
      let a = { bio, id, codigo, sexo: 'macho', nac: -120 - i * 8 }
      if (i === 1) { a = { ...a, nac: -150, madre: `${bio}-fh`, padre: `${bio}-fm`, notas: '★ Mejor macho de la línea. Camadas grandes, latencia baja.' } }
      else if (i === 2) { a = { ...a, nac: -75, madre: `${bio}-h01`, padre: `${bio}-m01`, notas: 'Recién promovido a reproductor. Sin camadas todavía.' } }
      else if (i === 3) { a = { ...a, nac: -200, notas: 'Bajo rendimiento: latencias altas y camadas chicas. Candidato a recambio.', nota_tipo: 'critica' } }
      else if (i === nM) { a = { ...a, nac: -262, notas: 'Próximo al límite de edad reproductiva. Planificar reemplazo.' } }
      // Exportados para producción de híbridos F1
      if (exportM > 0 && i >= 4 && i < 4 + exportM) {
        a.exportado = true
        a.notas = (a.notas ? a.notas + ' ' : '') + 'Exportado al programa de híbridos F1.'
      }
      animal(a)
    }

    // — Hembras activas —
    for (let i = 1; i <= nH; i++) {
      const id = `${bio}-h${String(i).padStart(2, '0')}`
      const codigo = `${pfx}H-${String(i).padStart(2, '0')}`
      let a = { bio, id, codigo, sexo: 'hembra', nac: -150 - i * 7 }
      if (i === 1) { a = { ...a, nac: -240, madre: `${bio}-fh`, padre: `${bio}-fm`, notas: '★ Mejor hembra / excelente. Camadas grandes, 100% de supervivencia.' } }
      else if (i === 2) { a = { ...a, nac: -170, notas: 'Camada pequeña reciente. Monitorear.' } }
      else if (i === 3) { a = { ...a, nac: -260, notas: 'Hembra NO apta: fallos reproductivos + camada chica. Descartar.', nota_tipo: 'critica' } }
      else if (i === 4) { a = { ...a, nac: -190, estado: 'en_cria', notas: 'Gestante. Parto esperado en ~5 días.' } }
      else if (i === 5) { a = { ...a, nac: -200, estado: 'en_cria', notas: 'Lactando. Destete programado para hoy.' } }
      else if (i === 6) { a = { ...a, nac: -180, estado: 'en_cria', notas: 'Parto reciente. Camada saludable.' } }
      if (exportH > 0 && i >= 7 && i < 7 + exportH) {
        a.exportado = true
        a.notas = (a.notas ? a.notas + ' ' : '') + 'Exportada al programa de híbridos F1.'
      }
      animal(a)
    }

    // — Históricos —
    animal({ bio, id: `${bio}-mh`, codigo: `${pfx}M-H1`, sexo: 'macho', nac: -300, estado: 'fallecido',
             sac: { fecha: -45, motivo: 'Sacrificio por edad límite reproductiva' } })
    animal({ bio, id: `${bio}-hh`, codigo: `${pfx}H-H1`, sexo: 'hembra', nac: -290, estado: 'fallecido',
             sac: { fecha: -55, motivo: 'Descarte por selección genética' } })
    animal({ bio, id: `${bio}-mr`, codigo: `${pfx}M-H2`, sexo: 'macho', nac: -280, estado: 'retirado',
             entrega: { fecha: -25, obs: 'Entregado a investigador' }, notas: 'Reproductor entregado.' })

    const M = (i) => `${bio}-m${String(i).padStart(2, '0')}`
    const H = (i) => `${bio}-h${String(i).padStart(2, '0')}`

    // — Camadas (mejor macho M01 acumula varias buenas) —
    completa(bio, `cam-${bio}-01`, H(1), M(1), -38, 1, 9, 4, 5, 9, 9, 4, 5, 'Camada excelente. Todos saludables.', '')          // crías
    completa(bio, `cam-${bio}-02`, H(7), M(1), -95, 2, 9, 5, 4, 9, 6, 3, 3, 'Camada normal. Entrega parcial registrada.', '')    // adultos
    completa(bio, `cam-${bio}-03`, H(8), M(3), -55, 3, 8, 4, 4, 8, 8, 4, 4, 'Camada promedio.', '')                              // jóvenes
    completa(bio, `cam-${bio}-04`, H(2), M(3), -48, 6, 5, 3, 2, 5, 5, 3, 2, 'Camada pequeña (5 crías).', '')                     // jóvenes (pequeña)
    completa(bio, `cam-${bio}-05`, H(3), M(3), -62, 8, 7, 4, 3, 3, 2, 1, 1, 'Baja supervivencia (43%).', '')                     // jóvenes (mortalidad)
    completa(bio, `cam-${bio}-11`, H(7), M(1), -56, 2, 9, 4, 5, 9, 7, 3, 4, 'Crías alcanzan madurez reproductiva hoy.', '')      // madurez hoy (2 entregadas)
    completa(bio, `cam-${bio}-12`, H(8), M(3), -100, 2, 9, 5, 4, 9, 7, 4, 3, 'Camada antigua, en stock como adultos.', '')       // adultos
    completa(bio, `cam-${bio}-13`, H(1),  M(1), -130, 1, 9, 4, 5, 9, null, null, null, 'Camada histórica de la mejor línea.')    // histórica (sin stock)
    // Fallos de la hembra no apta
    fallo(bio, `cam-${bio}-06`, H(3), M(1), -32, 'no_birth', 'Sin signos de parto post-cópula.')
    fallo(bio, `cam-${bio}-07`, H(3), M(1), -80, 'failed_pregnancy', 'Preñez interrumpida.')
    // Gestación / destete / parto reciente
    gestacion(bio, `cam-${bio}-08`, H(4), M(1), -16, 'Gestación en curso. Parto esperado en ~5 días.')
    lactante(bio, `cam-${bio}-09`, H(5), M(1), -21, 2, 9, 5, 4, 'Destete programado para hoy.')
    lactante(bio, `cam-${bio}-10`, H(6), M(3), -5, 1, 9, 4, 5, 'Parto hace 5 días. Camada saludable.')

    // — Sacrificios / entregas de stock —
    sacrificio(bio, `sac-${bio}-01`, `cam-${bio}-12`, 2, -90, 'joven', 'Reducción de camada')
    sacrificio(bio, `sac-${bio}-02`, `cam-${bio}-05`, 1, -45, 'cria',  'Sacrificio sanitario')
    entrega(bio, `ent-${bio}-01`, `cam-${bio}-02`, 3, -40, 'Entrega parcial a laboratorio')
    entrega(bio, `ent-${bio}-02`, `cam-${bio}-11`, 2, -4,  'Entrega reciente')

    // — Incidentes —
    incidente({ bio, id: `inc-${bio}-01`, fecha: -22, cat: 'ambiental', tipo: 'temperatura_baja', sev: 'moderado', duracion: 1, resuelto: true,
                desc: 'Falla de calefacción nocturna. Temperatura mínima 18 °C. Corregida sin bajas.' })
    incidente({ bio, id: `inc-${bio}-02`, fecha: -12, cat: 'sanitario', tipo: 'alopecia', sev: 'leve', animales: [H(2)], resuelto: false,
                desc: `${pfx}H-02 con alopecia leve en zona dorsal. En seguimiento.` })
    incidente({ bio, id: `inc-${bio}-03`, fecha: -33, cat: 'reproductivo', tipo: 'no_prenez', sev: 'moderado', camada: `cam-${bio}-06`, madre: H(3), padre: M(1),
                desc: `No preñez confirmada en ${pfx}H-03.` })

    // — Temperaturas + ciclo estral —
    genTemps(bio, 22.0, { '-22': 18.1, '-30': 25.6 })
    cicloEstral(bio, H(4), -16)
  }

  // BALB/c — exporta 2 machos al programa de híbridos
  generarRatones({ bio: 'ratones_balbc', pfx: 'B', nM: 6, nH: 12, exportM: 2 })
  // C57BL/6 — exporta 2 hembras al programa de híbridos
  generarRatones({ bio: 'ratones_c57', pfx: 'C', nM: 6, nH: 12, exportH: 2 })
  // Híbridos F1 (BALB/c × C57BL/6)
  generarRatones({ bio: 'ratones_hibridos', pfx: 'F', nM: 4, nH: 8 })

  return { animales, camadas, jaulas, sacrificios, entregas, temperaturas, incidentes, extendidos }
}

// ─── FUNCIÓN DE RESET / SEED INICIAL ─────────────────────────────────────────
// Se regenera en cada llamada para que las fechas se reanclen a "hoy".
export function getSeedInicial() {
  return generar()
}
