import type { Producto } from './tipos'
import { aCentavos, pesos } from './dinero'

const ENCABEZADOS = ['id', 'categoria', 'subcategoria', 'codigo', 'nombre', 'precio', 'precioGeneral', 'precioAlumno'] as const

function escaparCeldaCSV(valor: string): string {
  if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

/**
 * Genera el CSV de precios para editar en Excel/Sheets. Coma como
 * separador (Google Sheets, que es lo que usa el cliente, la detecta sin
 * configuración adicional). Incluye BOM UTF-8 para que acentos y "ñ" se
 * vean bien al abrirlo.
 */
export function construirCSVDePrecios(productos: Producto[]): string {
  const filas = [ENCABEZADOS.join(',')]
  for (const p of productos) {
    const fila = [
      p.id,
      p.categoria,
      p.subcategoria,
      p.codigo,
      escaparCeldaCSV(p.nombre),
      p.precio != null ? String(pesos(p.precio)) : '',
      p.precioGeneral != null ? String(pesos(p.precioGeneral)) : '',
      p.precioAlumno != null ? String(pesos(p.precioAlumno)) : '',
    ]
    filas.push(fila.join(','))
  }
  return '\uFEFF' + filas.join('\r\n') + '\r\n'
}

/** Parser CSV mínimo: soporta comillas dobles y comas dentro de celdas citadas. */
export function parsearCSV(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let dentroDeComillas = false

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]
    if (dentroDeComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"'
        i++
      } else if (c === '"') {
        dentroDeComillas = false
      } else {
        celda += c
      }
    } else if (c === '"') {
      dentroDeComillas = true
    } else if (c === ',') {
      fila.push(celda)
      celda = ''
    } else if (c === '\n') {
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ''
    } else {
      celda += c
    }
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }
  return filas.filter((f) => f.some((c) => c.trim() !== ''))
}

export interface ActualizacionDePrecio {
  id: string
  nombre: string
  cambios: { precio?: number; precioGeneral?: number; precioAlumno?: number }
}

export interface ErrorFilaCSV {
  fila: number // 1-based, contando el encabezado como fila 1
  motivo: string
}

export interface AnalisisCSVDePrecios {
  actualizaciones: ActualizacionDePrecio[]
  errores: ErrorFilaCSV[]
}

/**
 * Analiza el CSV SIN tocar la base de datos. Empareja cada fila por `id`
 * (nunca por nombre, para no confundirse si alguien reordena o edita el
 * texto). Una fila con id desconocido o un precio inválido se reporta
 * como error y se omite — el resto del archivo sí se procesa.
 */
export function analizarCSVDePrecios(texto: string, productosActuales: Producto[]): AnalisisCSVDePrecios {
  const filas = parsearCSV(texto)
  const errores: ErrorFilaCSV[] = []
  const actualizaciones: ActualizacionDePrecio[] = []

  if (filas.length === 0) {
    return { actualizaciones: [], errores: [{ fila: 1, motivo: 'El archivo está vacío' }] }
  }

  const encabezado = filas[0]!.map((h) => h.trim())
  const indice = (nombre: string) => encabezado.indexOf(nombre)
  const iId = indice('id')
  const iPrecio = indice('precio')
  const iGeneral = indice('precioGeneral')
  const iAlumno = indice('precioAlumno')

  if (iId === -1) {
    return { actualizaciones: [], errores: [{ fila: 1, motivo: 'Falta la columna "id"' }] }
  }

  const porId = new Map(productosActuales.map((p) => [p.id, p]))

  for (let i = 1; i < filas.length; i++) {
    const numeroFila = i + 1
    const fila = filas[i]!
    const id = fila[iId]?.trim()

    if (!id) {
      errores.push({ fila: numeroFila, motivo: 'Fila sin id' })
      continue
    }
    const producto = porId.get(id)
    if (!producto) {
      errores.push({ fila: numeroFila, motivo: `id "${id}" no existe en el catálogo` })
      continue
    }

    try {
      const cambios: ActualizacionDePrecio['cambios'] = {}

      const leerCelda = (indiceColumna: number): number | undefined => {
        if (indiceColumna === -1) return undefined
        const valor = fila[indiceColumna]?.trim()
        if (!valor) return undefined // celda vacía = no cambiar esta columna
        const centavos = aCentavos(valor)
        if (centavos < 0) throw new Error('el precio no puede ser negativo')
        return centavos
      }

      const precio = leerCelda(iPrecio)
      const precioGeneral = leerCelda(iGeneral)
      const precioAlumno = leerCelda(iAlumno)

      // Solo cuenta como cambio si el valor es distinto al que ya está en
      // el catálogo — así, re-importar un CSV sin editar nada no reporta
      // 94 "actualizaciones" vacías.
      if (precio != null && precio !== producto.precio) cambios.precio = precio
      if (precioGeneral != null && precioGeneral !== producto.precioGeneral) {
        cambios.precioGeneral = precioGeneral
      }
      if (precioAlumno != null && precioAlumno !== producto.precioAlumno) {
        cambios.precioAlumno = precioAlumno
      }

      if (Object.keys(cambios).length === 0) continue // fila sin cambios reales, se ignora en silencio

      actualizaciones.push({ id, nombre: producto.nombre, cambios })
    } catch (e) {
      const motivo = e instanceof Error ? e.message : 'precio inválido'
      errores.push({ fila: numeroFila, motivo: `${producto.nombre}: ${motivo}` })
    }
  }

  return { actualizaciones, errores }
}
