import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../lib/db/dexie'
import { sembrarCatalogoSiHaceFalta } from '../lib/db/seed'
import { actualizarPrecio, obtenerProducto } from '../lib/db/productos.repo'
import * as pedidosRepo from '../lib/db/pedidos.repo'
import { crearLineaDesdeProducto, agregarLinea, cambiarCantidad } from '../lib/dominio/pedido'
import { crearProductoId } from '../lib/dominio/tipos'
import { ErrorDeValidacion } from '../lib/dominio/errores'

beforeEach(async () => {
  await db.productos.clear()
  await db.pedidos.clear()
  await db.meta.clear()
  await sembrarCatalogoSiHaceFalta()
})

async function pedidoDeEjemplo() {
  const id = crearProductoId('moldes', 'barro', '1')
  const barro1 = await obtenerProducto(id)
  if (!barro1) throw new Error('seed incompleto en la prueba')
  const linea = crearLineaDesdeProducto(barro1, 'alumno', 2) // $225 × 2 = $450
  return pedidosRepo.crear({ tipoCliente: 'alumno', lineas: [linea] })
}

describe('crear pedido', () => {
  it('guarda el total y las líneas correctamente', async () => {
    const pedido = await pedidoDeEjemplo()
    expect(pedido.total).toBe(45000) // $450.00
    expect(pedido.lineas[0]?.precioUnitario).toBe(22500)
    expect(pedido.tipoCliente).toBe('alumno')
  })

  it('rechaza un pedido sin líneas', async () => {
    await expect(pedidosRepo.crear({ tipoCliente: 'alumno', lineas: [] })).rejects.toThrow(
      ErrorDeValidacion,
    )
  })

  it('queda disponible en listar()', async () => {
    await pedidoDeEjemplo()
    const lista = await pedidosRepo.listar()
    expect(lista).toHaveLength(1)
  })
})

describe('el escenario central del proyecto: precios históricos (§6 y §26)', () => {
  it('cambiar el precio del catálogo NO afecta un pedido ya guardado', async () => {
    const pedido = await pedidoDeEjemplo() // barro #1 alumno a $225 × 2 = $450

    const id = crearProductoId('moldes', 'barro', '1')
    await actualizarPrecio(id, { precioGeneral: 25500, precioAlumno: 25000 }) // sube a $250

    const relectura = await pedidosRepo.obtener(pedido.id)
    expect(relectura?.lineas[0]?.precioUnitario).toBe(22500) // sigue en $225
    expect(relectura?.total).toBe(45000) // sigue en $450
  })
})

describe('editar un pedido guardado (decisión D-6)', () => {
  it('cambiar la cantidad de una línea no toca su precio unitario', async () => {
    const pedido = await pedidoDeEjemplo()

    // Sube el precio del catálogo, para asegurarnos de que la edición
    // no lo vuelve a resolver por accidente.
    const id = crearProductoId('moldes', 'barro', '1')
    await actualizarPrecio(id, { precioGeneral: 99900, precioAlumno: 99900 })

    const nuevasLineas = cambiarCantidad(pedido.lineas, id, 5)
    await pedidosRepo.actualizar(pedido.id, { lineas: nuevasLineas })

    const relectura = await pedidosRepo.obtener(pedido.id)
    expect(relectura?.lineas[0]?.precioUnitario).toBe(22500) // no cambió
    expect(relectura?.lineas[0]?.cantidad).toBe(5)
    expect(relectura?.total).toBe(22500 * 5)
  })

  it('marca `editadoEn` después de una edición', async () => {
    const pedido = await pedidoDeEjemplo()
    expect(pedido.editadoEn).toBeUndefined()

    const id = crearProductoId('moldes', 'barro', '1')
    const nuevasLineas = cambiarCantidad(pedido.lineas, id, 3)
    await pedidosRepo.actualizar(pedido.id, { lineas: nuevasLineas })

    const relectura = await pedidosRepo.obtener(pedido.id)
    expect(relectura?.editadoEn).toBeTypeOf('number')
  })

  it('agregar un producto nuevo a un pedido guardado congela el precio actual', async () => {
    const pedido = await pedidoDeEjemplo()
    const idMadera = crearProductoId('moldes', 'madera', '5')
    const madera5 = await obtenerProducto(idMadera)
    if (!madera5) throw new Error('seed incompleto')

    const nuevaLinea = crearLineaDesdeProducto(madera5, 'alumno', 1) // $330
    const nuevasLineas = agregarLinea(pedido.lineas, nuevaLinea)
    await pedidosRepo.actualizar(pedido.id, { lineas: nuevasLineas })

    const relectura = await pedidosRepo.obtener(pedido.id)
    expect(relectura?.lineas).toHaveLength(2)
    expect(relectura?.total).toBe(45000 + 33000)
  })

  it('rechaza dejar el pedido sin líneas', async () => {
    const pedido = await pedidoDeEjemplo()
    await expect(pedidosRepo.actualizar(pedido.id, { lineas: [] })).rejects.toThrow(
      ErrorDeValidacion,
    )
  })

  it('rechaza una línea con el subtotal alterado (defensa aritmética)', async () => {
    const pedido = await pedidoDeEjemplo()
    const lineaAlterada = { ...pedido.lineas[0]!, subtotal: 999999 }
    await expect(
      pedidosRepo.actualizar(pedido.id, { lineas: [lineaAlterada] }),
    ).rejects.toThrow(ErrorDeValidacion)
  })

  it('rechaza editar un pedido que no existe', async () => {
    await expect(
      pedidosRepo.actualizar('no-existe', { lineas: [] }),
    ).rejects.toThrow()
  })
})

describe('eliminar pedido', () => {
  it('lo quita del historial', async () => {
    const pedido = await pedidoDeEjemplo()
    await pedidosRepo.eliminar(pedido.id)
    expect(await pedidosRepo.obtener(pedido.id)).toBeUndefined()
  })
})
