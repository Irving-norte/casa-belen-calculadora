import type { Categoria, LineaPedido, Pedido, Producto, Subcategoria, TipoCliente } from './tipos'
import { aCentavos, pesos } from './dinero'
import { ErrorDeValidacion } from './errores'

/**
 * Formato de archivo de respaldo (Historia A, Fase 6).
 *
 * Los montos se escriben en PESOS, no en centavos (decisión D-2), para que
 * el archivo se pueda inspeccionar a simple vista si alguna vez hace
 * falta. El usuario nunca edita este archivo a mano — solo lo exporta y,
 * si hace falta, lo vuelve a importar tal cual.
 */
export interface BackupV1 {
  version: 1
  exportadoEn: number
  versionApp: string
  versionCatalogo: number
  productos: ProductoExportado[]
  pedidos: PedidoExportado[]
}

interface ProductoExportado {
  id: string
  categoria: string
  subcategoria: string
  codigo: string
  nombre: string
  presentacion?: string
  precio?: number
  precioGeneral?: number
  precioAlumno?: number
  orden: number
}

interface LineaPedidoExportada {
  productoId: string
  nombreProducto: string
  categoria: string
  subcategoria: string
  codigo: string
  presentacion?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface PedidoExportado {
  id: string
  creadoEn: number
  editadoEn?: number
  tipoCliente: string
  lineas: LineaPedidoExportada[]
  total: number
  notas?: string
  versionCatalogo: number
  versionApp: string
}

// ---------------------------------------------------------------------
// Construcción (centavos internos → pesos legibles en el archivo)
// ---------------------------------------------------------------------

export function construirBackup(datos: {
  productos: Producto[]
  pedidos: Pedido[]
  versionApp: string
  versionCatalogo: number
}): BackupV1 {
  return {
    version: 1,
    exportadoEn: Date.now(),
    versionApp: datos.versionApp,
    versionCatalogo: datos.versionCatalogo,
    productos: datos.productos.map((p) => ({
      id: p.id,
      categoria: p.categoria,
      subcategoria: p.subcategoria,
      codigo: p.codigo,
      nombre: p.nombre,
      ...(p.presentacion != null && { presentacion: p.presentacion }),
      ...(p.precio != null && { precio: pesos(p.precio) }),
      ...(p.precioGeneral != null && { precioGeneral: pesos(p.precioGeneral) }),
      ...(p.precioAlumno != null && { precioAlumno: pesos(p.precioAlumno) }),
      orden: p.orden,
    })),
    pedidos: datos.pedidos.map((ped) => ({
      id: ped.id,
      creadoEn: ped.creadoEn,
      ...(ped.editadoEn != null && { editadoEn: ped.editadoEn }),
      tipoCliente: ped.tipoCliente,
      lineas: ped.lineas.map((l) => ({
        productoId: l.productoId,
        nombreProducto: l.nombreProducto,
        categoria: l.categoria,
        subcategoria: l.subcategoria,
        codigo: l.codigo,
        ...(l.presentacion != null && { presentacion: l.presentacion }),
        cantidad: l.cantidad,
        precioUnitario: pesos(l.precioUnitario),
        subtotal: pesos(l.subtotal),
      })),
      total: pesos(ped.total),
      ...(ped.notas != null && { notas: ped.notas }),
      versionCatalogo: ped.versionCatalogo,
      versionApp: ped.versionApp,
    })),
  }
}

// ---------------------------------------------------------------------
// Validación y lectura (pesos del archivo → centavos internos)
// ---------------------------------------------------------------------

const CATEGORIAS: Categoria[] = ['velas', 'moldes', 'aromas']
const SUBCATEGORIAS: Subcategoria[] = ['punta', 'barro', 'madera', '30ml']
const TIPOS_CLIENTE: TipoCliente[] = ['general', 'alumno']

function fallar(mensaje: string): never {
  throw new ErrorDeValidacion(`Archivo de respaldo inválido: ${mensaje}`)
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function cadenaRequerida(obj: Record<string, unknown>, campo: string, contexto: string): string {
  const v = obj[campo]
  if (typeof v !== 'string' || v === '') fallar(`${contexto}: falta o es inválido el campo "${campo}"`)
  return v
}

function numeroRequerido(obj: Record<string, unknown>, campo: string, contexto: string): number {
  const v = obj[campo]
  if (typeof v !== 'number' || Number.isNaN(v)) {
    fallar(`${contexto}: falta o es inválido el campo "${campo}"`)
  }
  return v as number
}

function numeroOpcionalAPrecio(obj: Record<string, unknown>, campo: string, contexto: string): number | undefined {
  const v = obj[campo]
  if (v == null) return undefined
  if (typeof v !== 'number' || Number.isNaN(v) || v < 0) {
    fallar(`${contexto}: el campo "${campo}" debe ser un número ≥ 0`)
  }
  return aCentavos(v)
}

function validarProducto(v: unknown, indice: number): Producto {
  const contexto = `productos[${indice}]`
  if (!esObjeto(v)) fallar(`${contexto}: no es un objeto`)

  const id = cadenaRequerida(v, 'id', contexto)
  const categoria = cadenaRequerida(v, 'categoria', contexto)
  const subcategoria = cadenaRequerida(v, 'subcategoria', contexto)
  const codigo = cadenaRequerida(v, 'codigo', contexto)
  const nombre = cadenaRequerida(v, 'nombre', contexto)
  const orden = numeroRequerido(v, 'orden', contexto)

  if (!CATEGORIAS.includes(categoria as Categoria)) {
    fallar(`${contexto}: categoría "${categoria}" desconocida`)
  }
  if (!SUBCATEGORIAS.includes(subcategoria as Subcategoria)) {
    fallar(`${contexto}: subcategoría "${subcategoria}" desconocida`)
  }

  const precio = numeroOpcionalAPrecio(v, 'precio', contexto)
  const precioGeneral = numeroOpcionalAPrecio(v, 'precioGeneral', contexto)
  const precioAlumno = numeroOpcionalAPrecio(v, 'precioAlumno', contexto)

  if (precio == null && (precioGeneral == null || precioAlumno == null)) {
    fallar(`${contexto} ("${nombre}"): no trae un esquema de precio válido`)
  }

  const presentacion = typeof v.presentacion === 'string' ? v.presentacion : undefined

  return {
    id,
    categoria: categoria as Categoria,
    subcategoria: subcategoria as Subcategoria,
    codigo,
    nombre,
    orden,
    ...(presentacion != null && { presentacion }),
    ...(precio != null && { precio }),
    ...(precioGeneral != null && { precioGeneral }),
    ...(precioAlumno != null && { precioAlumno }),
  }
}

function validarLinea(v: unknown, contextoPedido: string, indice: number): LineaPedido {
  const contexto = `${contextoPedido}.lineas[${indice}]`
  if (!esObjeto(v)) fallar(`${contexto}: no es un objeto`)

  const productoId = cadenaRequerida(v, 'productoId', contexto)
  const nombreProducto = cadenaRequerida(v, 'nombreProducto', contexto)
  const categoria = cadenaRequerida(v, 'categoria', contexto)
  const subcategoria = cadenaRequerida(v, 'subcategoria', contexto)
  const codigo = cadenaRequerida(v, 'codigo', contexto)
  const cantidad = numeroRequerido(v, 'cantidad', contexto)
  const precioUnitarioPesos = numeroRequerido(v, 'precioUnitario', contexto)
  const subtotalPesos = numeroRequerido(v, 'subtotal', contexto)

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    fallar(`${contexto}: "cantidad" debe ser un entero ≥ 1`)
  }
  if (precioUnitarioPesos < 0) fallar(`${contexto}: "precioUnitario" no puede ser negativo`)

  const precioUnitario = aCentavos(precioUnitarioPesos)
  const subtotal = aCentavos(subtotalPesos)

  if (subtotal !== precioUnitario * cantidad) {
    fallar(`${contexto}: el subtotal no cuadra con precioUnitario × cantidad`)
  }

  const presentacion = typeof v.presentacion === 'string' ? v.presentacion : undefined

  return {
    productoId,
    nombreProducto,
    categoria: categoria as Categoria,
    subcategoria: subcategoria as Subcategoria,
    codigo,
    cantidad,
    precioUnitario,
    subtotal,
    ...(presentacion != null && { presentacion }),
  }
}

function validarPedido(v: unknown, indice: number): Pedido {
  const contexto = `pedidos[${indice}]`
  if (!esObjeto(v)) fallar(`${contexto}: no es un objeto`)

  const id = cadenaRequerida(v, 'id', contexto)
  const creadoEn = numeroRequerido(v, 'creadoEn', contexto)
  const tipoCliente = cadenaRequerida(v, 'tipoCliente', contexto)
  const versionCatalogo = numeroRequerido(v, 'versionCatalogo', contexto)
  const versionApp = cadenaRequerida(v, 'versionApp', contexto)
  const totalPesos = numeroRequerido(v, 'total', contexto)

  if (!TIPOS_CLIENTE.includes(tipoCliente as TipoCliente)) {
    fallar(`${contexto}: tipoCliente "${tipoCliente}" desconocido`)
  }

  const lineasRaw = v.lineas
  if (!Array.isArray(lineasRaw) || lineasRaw.length === 0) {
    fallar(`${contexto}: debe traer al menos una línea`)
  }
  const lineas = lineasRaw.map((l, i) => validarLinea(l, contexto, i))

  const total = aCentavos(totalPesos)
  const sumaLineas = lineas.reduce((s, l) => s + l.subtotal, 0)
  if (total !== sumaLineas) {
    fallar(`${contexto}: el total no coincide con la suma de sus líneas`)
  }

  const editadoEn = typeof v.editadoEn === 'number' ? v.editadoEn : undefined
  const notas = typeof v.notas === 'string' ? v.notas : undefined

  return {
    id,
    creadoEn,
    tipoCliente: tipoCliente as TipoCliente,
    lineas,
    total,
    versionCatalogo,
    versionApp,
    ...(editadoEn != null && { editadoEn }),
    ...(notas != null && { notas }),
  }
}

/**
 * Valida un archivo de respaldo y lo convierte de vuelta al formato
 * interno (centavos). Lanza `ErrorDeValidacion` con un mensaje específico
 * ante cualquier problema — nunca devuelve datos a medio validar.
 */
export function leerBackup(json: unknown): { productos: Producto[]; pedidos: Pedido[] } {
  if (!esObjeto(json)) fallar('el contenido no es un objeto JSON')
  if (json.version !== 1) fallar(`versión de archivo no soportada (${String(json.version)})`)

  if (!Array.isArray(json.productos)) fallar('falta el arreglo "productos"')
  if (!Array.isArray(json.pedidos)) fallar('falta el arreglo "pedidos"')

  const productos = json.productos.map((p, i) => validarProducto(p, i))
  const pedidos = json.pedidos.map((p, i) => validarPedido(p, i))

  const idsProductos = new Set(productos.map((p) => p.id))
  if (idsProductos.size !== productos.length) fallar('hay productos con id duplicado')

  return { productos, pedidos }
}
