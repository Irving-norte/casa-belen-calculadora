import type { LineaPedido, Producto, TipoCliente } from './tipos'
import { precioUnitario } from './precios'
import { validarCantidad } from './validaciones'
import { ErrorDeValidacion } from './errores'

/**
 * Congela el precio en el instante en que se agrega la línea — no al
 * guardar el pedido. Es la regla central del requisito de precios
 * históricos: lo que ves en pantalla al tocar "Agregar" es lo que se
 * guarda, sin importar qué pase con el catálogo después.
 */
export function crearLineaDesdeProducto(
  producto: Producto,
  tipoCliente: TipoCliente,
  cantidad: number,
): LineaPedido {
  validarCantidad(cantidad)
  const precio = precioUnitario(producto, tipoCliente)
  return {
    productoId: producto.id,
    nombreProducto: producto.nombre,
    categoria: producto.categoria,
    subcategoria: producto.subcategoria,
    codigo: producto.codigo,
    presentacion: producto.presentacion,
    cantidad,
    precioUnitario: precio,
    subtotal: precio * cantidad,
  }
}

/**
 * Agrega una línea al borrador. Si el producto ya estaba en el borrador,
 * suma la cantidad a la línea existente en vez de duplicar la fila —
 * mejor UX y el precio unitario es el mismo porque viene de la misma
 * sesión de captura.
 */
export function agregarLinea(lineas: LineaPedido[], nueva: LineaPedido): LineaPedido[] {
  const indice = lineas.findIndex((l) => l.productoId === nueva.productoId)
  if (indice === -1) return [...lineas, nueva]

  const copia = [...lineas]
  const existente = copia[indice]!
  const cantidad = existente.cantidad + nueva.cantidad
  copia[indice] = {
    ...existente,
    cantidad,
    subtotal: existente.precioUnitario * cantidad,
  }
  return copia
}

export function cambiarCantidad(
  lineas: LineaPedido[],
  productoId: string,
  nuevaCantidad: number,
): LineaPedido[] {
  validarCantidad(nuevaCantidad)
  return lineas.map((l) =>
    l.productoId === productoId
      ? { ...l, cantidad: nuevaCantidad, subtotal: l.precioUnitario * nuevaCantidad }
      : l,
  )
}

export function eliminarLinea(lineas: LineaPedido[], productoId: string): LineaPedido[] {
  return lineas.filter((l) => l.productoId !== productoId)
}

export function calcularTotal(lineas: LineaPedido[]): number {
  return lineas.reduce((suma, l) => suma + l.subtotal, 0)
}

export function validarPedidoNoVacio(lineas: LineaPedido[]): void {
  if (lineas.length === 0) {
    throw new ErrorDeValidacion('Agrega al menos un producto antes de guardar')
  }
}
