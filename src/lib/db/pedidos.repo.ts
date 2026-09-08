import { db, operacionSegura } from './dexie'
import { versionCatalogoActual } from './seed'
import type { LineaPedido, Pedido, TipoCliente } from '../dominio/tipos'
import { calcularTotal, validarPedidoNoVacio } from '../dominio/pedido'
import { ErrorDeValidacion } from '../dominio/errores'

export async function listar(): Promise<Pedido[]> {
  return db.pedidos.orderBy('creadoEn').reverse().toArray()
}

export async function obtener(id: string): Promise<Pedido | undefined> {
  return db.pedidos.get(id)
}

/**
 * Congela el pedido tal como está en el momento de guardar: cada línea ya
 * trae su `precioUnitario` resuelto (ver `crearLineaDesdeProducto`), y aquí
 * simplemente se persiste sin volver a tocar el catálogo.
 */
export async function crear(datos: { tipoCliente: TipoCliente; lineas: LineaPedido[] }): Promise<Pedido> {
  validarPedidoNoVacio(datos.lineas)

  return operacionSegura(async () => {
    const versionCatalogo = await versionCatalogoActual()
    const pedido: Pedido = {
      id: crypto.randomUUID(),
      creadoEn: Date.now(),
      tipoCliente: datos.tipoCliente,
      lineas: datos.lineas,
      total: calcularTotal(datos.lineas),
      versionCatalogo,
      versionApp: __VERSION__,
    }
    await db.pedidos.add(pedido)
    return pedido
  }, 'guardar pedido')
}

/**
 * Único punto de edición de un pedido ya guardado (decisión D-6).
 *
 * A propósito NO acepta `tipoCliente`: TypeScript ya lo impide a nivel de
 * tipos, porque cambiar el tipo de cliente obligaría a recalcular todas
 * las líneas contra el catálogo actual — exactamente lo que el requisito
 * de precios históricos prohíbe. Para eso existe "Duplicar como pedido
 * nuevo", que crea un pedido aparte y deja este intacto.
 *
 * Tampoco valida que cada `precioUnitario` coincida con el de la versión
 * anterior del pedido: esa garantía ya la dan, más arriba en la cadena,
 * las únicas dos funciones que producen una `LineaPedido` —
 * `cambiarCantidad` (nunca toca el precio) y `crearLineaDesdeProducto`
 * (siempre lo resuelve del catálogo, nunca de un input de texto). Aquí
 * solo se comprueba la integridad aritmética, como red de seguridad
 * ante un futuro error de programación.
 */
export async function actualizar(id: string, cambios: { lineas: LineaPedido[] }): Promise<void> {
  validarPedidoNoVacio(cambios.lineas)

  for (const linea of cambios.lineas) {
    if (!Number.isInteger(linea.precioUnitario) || linea.precioUnitario < 0) {
      throw new ErrorDeValidacion(`Precio inválido en la línea "${linea.nombreProducto}"`)
    }
    if (linea.subtotal !== linea.precioUnitario * linea.cantidad) {
      throw new ErrorDeValidacion(`El subtotal de "${linea.nombreProducto}" no cuadra`)
    }
  }

  await operacionSegura(async () => {
    const pedido = await db.pedidos.get(id)
    if (!pedido) throw new ErrorDeValidacion('El pedido no existe')

    await db.pedidos.update(id, {
      lineas: cambios.lineas,
      total: calcularTotal(cambios.lineas),
      editadoEn: Date.now(),
    })
  }, 'editar pedido')
}

export async function eliminar(id: string): Promise<void> {
  await operacionSegura(() => db.pedidos.delete(id), 'eliminar pedido')
}
