import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../lib/db/dexie'
import { sembrarCatalogoSiHaceFalta, restaurarCatalogoDeFabrica, versionCatalogoActual } from '../lib/db/seed'
import { actualizarPrecio, obtenerProducto } from '../lib/db/productos.repo'
import { crearProductoId } from '../lib/dominio/tipos'

beforeEach(async () => {
  await db.productos.clear()
  await db.meta.clear()
  await db.pedidos.clear()
})

describe('siembra del catálogo', () => {
  it('siembra los 94 productos la primera vez', async () => {
    await sembrarCatalogoSiHaceFalta()
    expect(await db.productos.count()).toBe(94)
  })

  it('es idempotente: sembrar dos veces no duplica productos', async () => {
    await sembrarCatalogoSiHaceFalta()
    await sembrarCatalogoSiHaceFalta()
    expect(await db.productos.count()).toBe(94)
  })

  it('NO vuelve a sembrar si el usuario ya editó un precio (no se pierde la edición)', async () => {
    await sembrarCatalogoSiHaceFalta()
    const id = crearProductoId('moldes', 'barro', '1')
    await actualizarPrecio(id, { precioGeneral: 30000, precioAlumno: 27000 })

    await sembrarCatalogoSiHaceFalta() // simula un segundo arranque de la app

    const producto = await obtenerProducto(id)
    expect(producto?.precioGeneral).toBe(30000) // la edición sigue ahí
  })
})

describe('restaurar catálogo de fábrica', () => {
  it('regresa un precio editado a su valor original', async () => {
    await sembrarCatalogoSiHaceFalta()
    const id = crearProductoId('moldes', 'barro', '1')
    await actualizarPrecio(id, { precioGeneral: 99900, precioAlumno: 99900 })

    await restaurarCatalogoDeFabrica()

    const producto = await obtenerProducto(id)
    expect(producto?.precioGeneral).toBe(25500) // $255 original
    expect(producto?.precioAlumno).toBe(22500) // $225 original
  })

  it('mantiene 94 productos después de restaurar', async () => {
    await sembrarCatalogoSiHaceFalta()
    await restaurarCatalogoDeFabrica()
    expect(await db.productos.count()).toBe(94)
  })
})

describe('edición de precios', () => {
  it('actualizarPrecio incrementa la versión del catálogo', async () => {
    await sembrarCatalogoSiHaceFalta()
    const antes = await versionCatalogoActual()
    const id = crearProductoId('velas', 'punta', 'grande')
    await actualizarPrecio(id, { precio: 2500 })
    const despues = await versionCatalogoActual()
    expect(despues).toBe(antes + 1)
  })

  it('rechaza un precio negativo', async () => {
    await sembrarCatalogoSiHaceFalta()
    const id = crearProductoId('velas', 'punta', 'grande')
    await expect(actualizarPrecio(id, { precio: -100 })).rejects.toThrow()
  })

  it('rechaza un precio no entero (centavos fraccionados)', async () => {
    await sembrarCatalogoSiHaceFalta()
    const id = crearProductoId('velas', 'punta', 'grande')
    await expect(actualizarPrecio(id, { precio: 22.5 })).rejects.toThrow()
  })

  it('rechaza editar un producto que no existe', async () => {
    await expect(actualizarPrecio('no-existe', { precio: 100 })).rejects.toThrow()
  })
})
