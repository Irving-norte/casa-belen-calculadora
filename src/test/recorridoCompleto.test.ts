import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../lib/db/dexie'
import { sembrarCatalogoSiHaceFalta } from '../lib/db/seed'
import { actualizarPrecio, obtenerProducto } from '../lib/db/productos.repo'
import * as pedidosRepo from '../lib/db/pedidos.repo'
import * as backupRepo from '../lib/db/backup.repo'
import { aplicarActualizacionesDePrecios } from '../lib/db/csvPrecios.repo'
import {
  crearLineaDesdeProducto,
  agregarLinea,
  cambiarCantidad,
  calcularTotal,
  recalcularPreciosPorTipoCliente,
} from '../lib/dominio/pedido'
import { generarTextoPedido } from '../lib/dominio/whatsapp'
import { construirCSVDePrecios, analizarCSVDePrecios } from '../lib/dominio/csvPrecios'
import { crearProductoId } from '../lib/dominio/tipos'

/**
 * Fase 8 — Pruebas.
 *
 * Las suites de las fases 3 a 7 verifican cada pieza por separado. Esta
 * prueba las encadena tal como las usaría Casa Belén un día normal, para
 * atrapar cualquier problema que solo aparece en la costura entre dos
 * módulos (algo que las pruebas unitarias, por diseño, no pueden ver).
 */
describe('recorrido completo: un día típico en Casa Belén', () => {
  beforeEach(async () => {
    await db.productos.clear()
    await db.pedidos.clear()
    await db.meta.clear()
    await sembrarCatalogoSiHaceFalta()
  })

  it('arma, guarda, edita, respalda y reimporta un pedido sin perder ni alterar nada', async () => {
    // 1) Un cliente Alumno pide el pedido mixto del documento original (§26)
    const barro1 = (await obtenerProducto(crearProductoId('moldes', 'barro', '1')))!
    const madera5 = (await obtenerProducto(crearProductoId('moldes', 'madera', '5')))!
    const velaGrande = (await obtenerProducto(crearProductoId('velas', 'punta', 'grande')))!
    const vanilla = (await obtenerProducto(crearProductoId('aromas', '30ml', 'vanilla')))!

    let lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'alumno', 2))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(madera5, 'alumno', 1))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(velaGrande, 'alumno', 10))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(vanilla, 'alumno', 2))
    expect(calcularTotal(lineas)).toBe(109600) // $1,096.00, igual que en el documento

    // 2) Se copia para WhatsApp ANTES de guardar — el texto debe coincidir con el §16
    const textoWhatsApp = generarTextoPedido('alumno', lineas, calcularTotal(lineas))
    expect(textoWhatsApp).toContain('TOTAL: $1,096')
    expect(textoWhatsApp).toContain('2 × #1 — $225 c/u — $450')

    // 3) Se guarda
    const pedido = await pedidosRepo.crear({ tipoCliente: 'alumno', lineas })
    expect(pedido.total).toBe(109600)

    // 4) Al día siguiente, el precio del molde de barro #1 sube en el catálogo
    await actualizarPrecio(barro1.id, { precioGeneral: 30000, precioAlumno: 27000 })

    // 5) El pedido de ayer NO debe cambiar (el requisito central de todo el proyecto)
    const pedidoReleido = await pedidosRepo.obtener(pedido.id)
    expect(pedidoReleido?.lineas[0]?.precioUnitario).toBe(22500)
    expect(pedidoReleido?.total).toBe(109600)

    // 6) Se corrige la cantidad de velas de ese pedido (decisión D-6: sí se puede)
    const lineasEditadas = cambiarCantidad(pedidoReleido!.lineas, velaGrande.id, 12)
    await pedidosRepo.actualizar(pedido.id, { lineas: lineasEditadas })
    const pedidoEditado = await pedidosRepo.obtener(pedido.id)
    expect(pedidoEditado?.editadoEn).toBeTypeOf('number')
    expect(pedidoEditado?.lineas.find((l) => l.productoId === velaGrande.id)?.precioUnitario).toBe(2200) // precio intacto
    expect(pedidoEditado?.total).toBe(109600 + 2200 * 2) // 2 velas más al mismo precio

    // 7) Un cliente pide lo mismo pero es General: se duplica y se cambia el tipo
    const productosActuales = await db.productos.toArray()
    const lineasParaGeneral = recalcularPreciosPorTipoCliente(
      pedidoEditado!.lineas,
      productosActuales,
      'general',
    )
    const pedidoGeneral = await pedidosRepo.crear({ tipoCliente: 'general', lineas: lineasParaGeneral })
    // El barro #1 en General ya está a $300 (paso 4), no a los $225 originales
    expect(pedidoGeneral.lineas.find((l) => l.productoId === barro1.id)?.precioUnitario).toBe(30000)
    // El pedido Alumno original sigue intacto
    expect((await pedidosRepo.obtener(pedido.id))?.lineas[0]?.precioUnitario).toBe(22500)

    // 8) Fin del día: se exporta un respaldo completo
    const { archivo } = await backupRepo.exportarBackup()
    expect(archivo.pedidos).toHaveLength(2)

    // 9) Se simula perder el teléfono y restaurar en uno nuevo
    await db.productos.clear()
    await db.pedidos.clear()
    const datosRestaurados = backupRepo.previsualizarImportacion(JSON.stringify(archivo))
    await backupRepo.importarBackup(datosRestaurados)

    const pedidoAlumnoRestaurado = await pedidosRepo.obtener(pedido.id)
    const pedidoGeneralRestaurado = await pedidosRepo.obtener(pedidoGeneral.id)
    expect(pedidoAlumnoRestaurado?.total).toBe(pedidoEditado!.total) // sobrevivió completo
    expect(pedidoGeneralRestaurado?.lineas[0]?.precioUnitario).toBe(30000) // sobrevivió completo
    expect(await db.productos.count()).toBe(94) // el catálogo con el precio editado también volvió

    // 10) Semanas después, se hace un ajuste de precios en lote por CSV
    const catalogoActual = await db.productos.toArray()
    const csv = construirCSVDePrecios(catalogoActual)
    const filas = csv.replace(/^\uFEFF/, '').trim().split('\r\n')
    const encabezado = filas[0]!.split(',')
    const iId = encabezado.indexOf('id')
    const iGeneral = encabezado.indexOf('precioGeneral')
    const filasEditadas = filas.map((fila) => {
      const columnas = fila.split(',')
      if (columnas[iId] === barro1.id) columnas[iGeneral] = '310' // sube $10 sobre el $300 del paso 4
      return columnas.join(',')
    })
    const csvEditado = filasEditadas.join('\r\n')

    const analisis = analizarCSVDePrecios(csvEditado, catalogoActual)
    expect(analisis.errores).toHaveLength(0)
    await aplicarActualizacionesDePrecios(analisis.actualizaciones)

    const barro1Actualizado = await obtenerProducto(barro1.id)
    expect(barro1Actualizado?.precioGeneral).toBe(31000)

    // 11) Y los dos pedidos históricos, de nuevo, no se movieron ni un centavo
    expect((await pedidosRepo.obtener(pedido.id))?.lineas[0]?.precioUnitario).toBe(22500)
    expect((await pedidosRepo.obtener(pedidoGeneral.id))?.lineas[0]?.precioUnitario).toBe(30000)
  })
})
