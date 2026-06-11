// ════════════════════════════════════════════════════════════════════════════
//  COLONIA DEMOSTRATIVA — ITeRatE Demo  (versión comercial, "una por funcionalidad")
//  ----------------------------------------------------------------------------
//  Simula un bioterio REAL, pequeño-mediano, ordenado y entendible para un
//  potencial cliente. La regla de diseño es: UN escenario representativo por
//  funcionalidad — NO decenas de ejemplos de cada situación.
//
//  Cada línea genética tiene IDENTIDAD propia (no se repiten estructuras):
//    · Ratas Wistar  → colonia principal: muestra TODO el flujo (parto, destete,
//                      madurez, separación, retiro de macho, alertas san./reprod.,
//                      mejor hembra/macho, camada excepcional, fin de ciclo).
//    · BALB/c        → colonia chica y tranquila: una camada reciente + entrega.
//    · C57BL/6       → colonia chica con UN apareamiento activo + camada histórica.
//    · Híbridos F1   → SIN reproductores: solo stock generado (disponible/entregado)
//                      e historial de producción a partir de padres exportados.
//
//  Proporción de eventos buscada ≈ 70% normal · 20% positivo · 10% problemático.
//  Sin alertas duplicadas ni sensación de colonia en crisis.
//
//  Todas las fechas son RELATIVAS A HOY (se recalculan en cada carga / reset),
//  para que el Panel de Hoy y el calendario muestren escenarios vigentes.
// ════════════════════════════════════════════════════════════════════════════

const MS_DIA = 86_400_000

// Devuelve una fecha YYYY-MM-DD desplazada `offset` días respecto de hoy
// (offset negativo = pasado, positivo = futuro). Anclada al mediodía.
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
    // Reproductor retirado y entregado → registro de entrega
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

  // Camada finalizada y destetada (entra al stock si se pasa `jaula > 0`)
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
  //  LÍNEA 1 — RATAS WISTAR  ·  Colonia principal (showcase completo)
  //  4 machos + 8 hembras reproductores. Muestra UN ejemplo de cada escenario.
  // ══════════════════════════════════════════════════════════════════════════
  const W = 'ratas'

  // — Fundadores (gen 0, retirados) → raíz de la genealogía —
  animal({ bio: W, id: 'w-fm', codigo: 'WM-F', sexo: 'macho',  nac: -560, estado: 'retirado',
           notas: 'Fundador de la colonia Wistar. Retirado por edad tras un ciclo completo de servicio.' })
  animal({ bio: W, id: 'w-fh', codigo: 'WH-F', sexo: 'hembra', nac: -540, estado: 'retirado',
           notas: 'Fundadora de la colonia Wistar. Retirada tras completar su ciclo reproductivo.' })

  // — Machos reproductores (4) —
  animal({ bio: W, id: 'w-m01', codigo: 'WM-01', sexo: 'macho', nac: -200, madre: 'w-fh', padre: 'w-fm',
           notas: '★ Macho élite de la colonia. Latencia baja y camadas grandes y parejas.', nota_tipo: 'positiva' })
  animal({ bio: W, id: 'w-m02', codigo: 'WM-02', sexo: 'macho', nac: -170 })
  animal({ bio: W, id: 'w-m03', codigo: 'WM-03', sexo: 'macho', nac: -150 })
  animal({ bio: W, id: 'w-m04', codigo: 'WM-04', sexo: 'macho', nac: -265,
           notas: 'Próximo al límite de edad reproductiva (9 meses). Planificar su reemplazo.', nota_tipo: 'critica' })

  // — Hembras reproductoras (8) —
  animal({ bio: W, id: 'w-h01', codigo: 'WH-01', sexo: 'hembra', nac: -260, madre: 'w-fh', padre: 'w-fm',
           notas: '★ Mejor hembra de la colonia. Camadas grandes y 100% de supervivencia al destete.', nota_tipo: 'positiva' })
  animal({ bio: W, id: 'w-h02', codigo: 'WH-02', sexo: 'hembra', nac: -250,
           notas: 'Fin de ciclo reproductivo: 3 camadas completadas. Lista para descarte.', nota_tipo: 'critica' })
  animal({ bio: W, id: 'w-h03', codigo: 'WH-03', sexo: 'hembra', nac: -200, estado: 'en_cria',
           notas: 'Gestante — preñez activa. Parto esperado en los próximos días.' })
  animal({ bio: W, id: 'w-h04', codigo: 'WH-04', sexo: 'hembra', nac: -190, estado: 'en_apareamiento',
           notas: 'En apareamiento (día 10). Separación de la pareja próxima.' })
  animal({ bio: W, id: 'w-h05', codigo: 'WH-05', sexo: 'hembra', nac: -210, estado: 'en_cria',
           notas: 'Lactando. Destete programado para hoy.' })
  animal({ bio: W, id: 'w-h06', codigo: 'WH-06', sexo: 'hembra', nac: -180,
           notas: 'Última camada pequeña (6 crías) + una reabsorción. Monitorear rendimiento.' })
  animal({ bio: W, id: 'w-h07', codigo: 'WH-07', sexo: 'hembra', nac: -220,
           notas: 'Buena reproductora. Su última camada alcanza madurez ahora.' })
  animal({ bio: W, id: 'w-h08', codigo: 'WH-08', sexo: 'hembra', nac: -160 })

  // — Camadas Wistar —
  // Excepcional (mejor hembra × macho élite): supervivencia perfecta → stock jóvenes (POSITIVO)
  completa(W, 'cam-w-01', 'w-h01', 'w-m01', -45, 1, 13, 6, 7, 13, 9, 4, 5, 'Camada excepcional: 13 crías, todas destetadas (100% de supervivencia).', '')
  // Fin de ciclo de WH-02: 3 camadas históricas sanas (la última destetada → dispara "fin de ciclo")
  completa(W, 'cam-w-02a', 'w-h02', 'w-m01', -210, 2, 11, 5, 6, 11, 0, 0, 0, 'Camada histórica (ciclo 1). Crías destinadas a protocolo.', '')
  completa(W, 'cam-w-02b', 'w-h02', 'w-m03', -150, 2, 10, 5, 5, 10, 0, 0, 0, 'Camada histórica (ciclo 2).', '')
  completa(W, 'cam-w-02c', 'w-h02', 'w-m01', -95,  2, 12, 6, 6, 12, 0, 0, 0, 'Camada histórica (ciclo 3). Tercer y último ciclo completado.', '')
  // Preñez activa → parto esperado (confirmada por extendido día 0)
  gestacion(W, 'cam-w-03', 'w-h03', 'w-m01', -26, 'Día 0 confirmado por extendido. Parto esperado en los próximos días.')
  // Apareamiento activo → separación próxima
  gestacion(W, 'cam-w-04', 'w-h04', 'w-m02', -10, 'Emparejamiento iniciado (día 10). Convivencia por finalizar — separar.')
  // Camada lactando → destete hoy
  lactante(W, 'cam-w-05', 'w-h05', 'w-m03', -21, 2, 12, 6, 6, 'Camada saludable, lactando. Destete programado para hoy.')
  // Camada pequeña (<8) → alerta "evaluar hembra" (NEGATIVO, único de la colonia)
  completa(W, 'cam-w-06', 'w-h06', 'w-m04', -60, 8, 6, 3, 3, 6, 6, 3, 3, 'Camada pequeña (6 crías). Latencia alta del macho.', '')
  // Crías alcanzan madurez reproductiva hoy → stock adultos
  completa(W, 'cam-w-07', 'w-h07', 'w-m01', -84, 2, 11, 5, 6, 11, 8, 4, 4, 'Crías alcanzan madurez reproductiva hoy. Candidatas a renovación.', '')
  // Camada reciente → stock crías (1 muerte neonatal, supervivencia 90%)
  completa(W, 'cam-w-08', 'w-h08', 'w-m02', -30, 2, 10, 5, 5, 9, 7, 4, 3, 'Camada reciente. 1 muerte neonatal; el resto sano.', 'Separar al destete.')
  // Reabsorción de WH-06 → fallo reproductivo (NEGATIVO, sin generar alerta de stock)
  fallo(W, 'cam-w-09', 'w-h06', 'w-m03', -50, 'reabsorption', 'Reabsorción confirmada: sin parto a 30 días post-cópula.')

  // — Sacrificio y entrega de stock —
  sacrificio(W, 'sac-w-01', 'cam-w-08', 1, -10, 'cria', 'Sacrificio sanitario (una cría con dermatitis leve).')
  entrega(W, 'ent-w-01', 'cam-w-01', 3, -5, 'Dra. Martínez — Protocolo 042 (Fisiología renal). Entrega realizada.')

  // — Incidentes Wistar (1 ambiental, 1 sanitario, 1 reproductivo) —
  incidente({ bio: W, id: 'inc-w-amb', fecha: -18, cat: 'ambiental', tipo: 'corte_energia', sev: 'moderado', duracion: 1, resuelto: true,
              desc: 'Corte de energía de 3 h. La temperatura bajó a 17 °C; se monitorearon los neonatos sin bajas.' })
  incidente({ bio: W, id: 'inc-w-san', fecha: -7, cat: 'sanitario', tipo: 'heridas', sev: 'leve', animales: ['w-h08'], resuelto: true,
              desc: 'WH-08 con heridas leves por peleas. Separada preventivamente. Recuperada.' })
  incidente({ bio: W, id: 'inc-w-rep', fecha: -48, cat: 'reproductivo', tipo: 'reabsorcion', sev: 'moderado', camada: 'cam-w-09', madre: 'w-h06', padre: 'w-m03',
              desc: 'Reabsorción confirmada en WH-06 (camada cam-w-09).' })

  // — Temperaturas (60 días, 1 alerta correlacionada con el corte de energía) —
  genTemps(W, 22.0, { '-18': 17.2 })
  // — Ciclo estral de la hembra en apareamiento —
  cicloEstral(W, 'w-h04', -10)

  // ══════════════════════════════════════════════════════════════════════════
  //  LÍNEA 2 — RATONES BALB/c  ·  Colonia chica y tranquila
  //  2 machos colonia + 2 machos exportados a F1 + 3 hembras. Camada reciente + entrega.
  // ══════════════════════════════════════════════════════════════════════════
  const B = 'ratones_balbc'

  animal({ bio: B, id: 'b-fm', codigo: 'BM-F', sexo: 'macho',  nac: -500, estado: 'retirado', notas: 'Fundador de la línea BALB/c. Retirado.' })
  animal({ bio: B, id: 'b-fh', codigo: 'BH-F', sexo: 'hembra', nac: -480, estado: 'retirado', notas: 'Fundadora de la línea BALB/c. Retirada.' })

  // Machos de colonia (2)
  animal({ bio: B, id: 'b-m01', codigo: 'BM-01', sexo: 'macho', nac: -170, madre: 'b-fh', padre: 'b-fm',
           notas: '★ Mejor macho de la línea. Camadas parejas.', nota_tipo: 'positiva' })
  animal({ bio: B, id: 'b-m02', codigo: 'BM-02', sexo: 'macho', nac: -150 })
  // Machos exportados al programa de Híbridos F1 (NO se comparten con la colonia)
  animal({ bio: B, id: 'b-m03', codigo: 'BM-03', sexo: 'macho', nac: -140, exportado: true,
           notas: 'Reproductor exportado al programa de híbridos F1 (cruza con C57).' })
  animal({ bio: B, id: 'b-m04', codigo: 'BM-04', sexo: 'macho', nac: -130, exportado: true,
           notas: 'Reproductor exportado al programa de híbridos F1 (cruza con C57).' })
  // Hembras (3)
  animal({ bio: B, id: 'b-h01', codigo: 'BH-01', sexo: 'hembra', nac: -200, madre: 'b-fh', padre: 'b-fm',
           notas: '★ Mejor hembra de la línea. Buena supervivencia.', nota_tipo: 'positiva' })
  animal({ bio: B, id: 'b-h02', codigo: 'BH-02', sexo: 'hembra', nac: -180 })
  animal({ bio: B, id: 'b-h03', codigo: 'BH-03', sexo: 'hembra', nac: -160, estado: 'en_cria',
           notas: 'Parto reciente. Camada sana, lactando.' })

  // Camadas BALB/c
  completa(B, 'cam-b-01', 'b-h01', 'b-m01', -40, 2, 9, 4, 5, 9, 8, 4, 4, 'Camada sana en stock (crías).', '')      // stock crías
  completa(B, 'cam-b-02', 'b-h02', 'b-m02', -90, 2, 8, 4, 4, 8, 8, 4, 4, 'Camada en stock (adultos).', '')          // stock adultos
  lactante(B, 'cam-b-03', 'b-h03', 'b-m01', -6, 1, 9, 5, 4, 'Camada reciente, lactando. Todo en orden.')             // reciente (sin tarea aún)

  // Entrega (representa el pedido asociado a la línea)
  entrega(B, 'ent-b-01', 'cam-b-02', 3, -8, 'Bioterio externo — Pedido P-051. Entrega realizada.')

  genTemps(B, 22.0)  // ambiente estable, sin alertas

  // ══════════════════════════════════════════════════════════════════════════
  //  LÍNEA 3 — RATONES C57BL/6  ·  Colonia chica con UN apareamiento activo
  //  2 machos + 3 hembras colonia + 2 hembras exportadas a F1. Camada histórica.
  // ══════════════════════════════════════════════════════════════════════════
  const C = 'ratones_c57'

  animal({ bio: C, id: 'c-fm', codigo: 'CM-F', sexo: 'macho',  nac: -500, estado: 'retirado', notas: 'Fundador de la línea C57. Retirado.' })
  animal({ bio: C, id: 'c-fh', codigo: 'CH-F', sexo: 'hembra', nac: -480, estado: 'retirado', notas: 'Fundadora de la línea C57. Retirada.' })

  // Machos colonia (2)
  animal({ bio: C, id: 'c-m01', codigo: 'CM-01', sexo: 'macho', nac: -180, madre: 'c-fh', padre: 'c-fm',
           notas: '★ Mejor macho de la línea.', nota_tipo: 'positiva' })
  animal({ bio: C, id: 'c-m02', codigo: 'CM-02', sexo: 'macho', nac: -150 })
  // Hembras colonia (3)
  animal({ bio: C, id: 'c-h01', codigo: 'CH-01', sexo: 'hembra', nac: -200, madre: 'c-fh', padre: 'c-fm',
           notas: '★ Mejor hembra de la línea.', nota_tipo: 'positiva' })
  animal({ bio: C, id: 'c-h02', codigo: 'CH-02', sexo: 'hembra', nac: -170 })
  animal({ bio: C, id: 'c-h03', codigo: 'CH-03', sexo: 'hembra', nac: -160, estado: 'en_apareamiento',
           notas: 'Apareamiento activo (día 10). Separación próxima.' })
  // Hembras exportadas al programa de Híbridos F1 (reservadas, no se cruzan en C57)
  animal({ bio: C, id: 'c-h04', codigo: 'CH-04', sexo: 'hembra', nac: -190, exportado: true,
           notas: 'Reproductora exportada al programa de híbridos F1 (cruza con BALB/c).' })
  animal({ bio: C, id: 'c-h05', codigo: 'CH-05', sexo: 'hembra', nac: -175, exportado: true,
           notas: 'Reproductora exportada al programa de híbridos F1 (cruza con BALB/c).' })

  // Camadas C57
  completa(C, 'cam-c-01', 'c-h01', 'c-m01', -95, 2, 9, 4, 5, 9, 8, 4, 4, 'Camada histórica en stock (adultos).', '')  // histórica/adultos
  completa(C, 'cam-c-02', 'c-h02', 'c-m02', -40, 2, 8, 4, 4, 8, 8, 4, 4, 'Camada en stock (crías).', '')               // stock crías
  gestacion(C, 'cam-c-03', 'c-h03', 'c-m01', -10, 'Emparejamiento iniciado (día 10). Convivencia por finalizar — separar.')  // apareamiento activo

  genTemps(C, 22.0)             // ambiente estable
  cicloEstral(C, 'c-h03', -10)  // ciclo estral del apareamiento activo

  // ══════════════════════════════════════════════════════════════════════════
  //  LÍNEA 4 — RATONES HÍBRIDOS F1 (BALB/c × C57)  ·  SIN reproductores
  //  Solo stock generado a partir de los reproductores exportados de BALB/c y C57.
  //  Muestra: disponibles, entregados e historial de producción.
  // ══════════════════════════════════════════════════════════════════════════
  const F = 'ratones_hibridos'

  // Producción F1 = padre exportado de BALB/c × madre exportada de C57
  completa(F, 'cam-f-01', 'c-h04', 'b-m03', -35, 1, 10, 5, 5, 10, 9, 5, 4, 'Producción F1 disponible (crías).', '')   // disponibles (crías)
  completa(F, 'cam-f-02', 'c-h04', 'b-m04', -80, 1, 11, 6, 5, 11, 10, 5, 5, 'Producción F1 en stock (adultos).', '')  // disponibles (adultos)
  completa(F, 'cam-f-03', 'c-h05', 'b-m03', -120, 1, 10, 5, 5, 10, 0, 0, 0, 'Producción F1 histórica (entregada en su totalidad).', '')  // historial

  // Entrega de stock F1 (animales entregados)
  entrega(F, 'ent-f-01', 'cam-f-01', 2, -7, 'Cátedra de Inmunología — entrega de híbridos F1. Realizada.')

  genTemps(F, 22.0)  // ambiente estable

  return { animales, camadas, jaulas, sacrificios, entregas, temperaturas, incidentes, extendidos }
}

// ─── FUNCIÓN DE RESET / SEED INICIAL ─────────────────────────────────────────
// Se regenera en cada llamada para que las fechas se reanclen a "hoy".
export function getSeedInicial() {
  return generar()
}
