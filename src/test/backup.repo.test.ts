import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../lib/db/dexie'
import { sembrarCatalogoSiHaceFalta } from '../lib/db/seed'
import { actualizarPrecio } from '../lib/db/productos.repo'
import * as pedidosRepo from '../lib/db/pedidos.repo'
import * as backupRepo from '../lib/db/backup.repo'
import { crearLineaDesdeProducto } from '../lib/dominio/pedido'
import { crearProductoId } from '../lib/dominio/tipos'
import { ErrorDeValidacion } from '../lib/dominio/errores'

beforeEach(async () => {
  await db.productos.clear()
  await db.pedidos.clear()
  await db.meta.clear()
  await sembrarCatalogoSiHaceFalta()
})

describe('caso feliz: exportar e importar de vuelta', () => {
  it('el catálogo editado y los pedidos sobreviven la ida y vuelta', async () => {
    const idBarro1 = crearProductoId('moldes', 'barro', '1')
    await actualizarPrecio(idBarro1, { precioGeneral: 30000, precioAlumno: 27000 })

    const producto = await db.productos.get(idBarro1)
    const linea = crearLineaDesdeProducto(producto!, 'alumno', 2)
    const pedido = await pedidosRepo.crear({ tipoCliente: 'alumno', lineas: [linea] })

    const { archivo } = await backupRepo.exportarBackup()

    // Simula "perder los datos": limpiar todo antes de importar.
    await db.productos.clear()
    await db.pedidos.clear()

    const datos = backupRepo.previsualizarImportacion(JSON.stringify(archivo))
    const resultado = await backupRepo.importarBackup(datos)

    expect(resultado.productos).toBe(94)
    expect(resultado.pedidos).toBe(1)

    const productoRestaurado = await db.productos.get(idBarro1)
    expect(productoRestaurado?.precioAlumno).toBe(27000) // la edición sobrevivió

    const pedidoRestaurado = await pedidosRepo.obtener(pedido.id)
    expect(pedidoRestaurado?.total).toBe(pedido.total)
    expect(pedidoRestaurado?.lineas[0]?.precioUnitario).toBe(27000)
  })
})

describe('rechazo de archivo inválido: no debe tocar nada', () => {
  it('un JSON corrupto no borra el catálogo existente', async () => {
    const antes = await db.productos.count()
    expect(() => backupRepo.previsualizarImportacion('{esto no es json')).toThrow(ErrorDeValidacion)
    expect(await db.productos.count()).toBe(antes) // nada cambió
  })

  it('un JSON válido pero con estructura desconocida no borra nada', async () => {
    const antes = await db.productos.count()
    expect(() =>
      backupRepo.previsualizarImportacion(JSON.stringify({ esto: 'no es un respaldo' })),
    ).toThrow(ErrorDeValidacion)
    expect(await db.productos.count()).toBe(antes)
  })
})

describe('deshacer última importación', () => {
  it('regresa el catálogo y los pedidos al estado justo anterior a importar', async () => {
    const idBarro1 = crearProductoId('moldes', 'barro', '1')
    const productoOriginal = await db.productos.get(idBarro1)
    const linea = crearLineaDesdeProducto(productoOriginal!, 'alumno', 1)
    const pedidoOriginal = await pedidosRepo.crear({ tipoCliente: 'alumno', lineas: [linea] })

    // Un respaldo "de otro teléfono" con un solo producto distinto y sin pedidos.
    const respaldoAjeno = {
      version: 1 as const,
      exportadoEn: Date.now(),
      versionApp: '0.0.0',
      versionCatalogo: 1,
      productos: [
        { id: idBarro1, categoria: 'moldes', subcategoria: 'barro', codigo: '1', nombre: 'Otro nombre', precioGeneral: 999, precioAlumno: 888, orden: 0 },
      ],
      pedidos: [],
    }
    const datos = backupRepo.previsualizarImportacion(JSON.stringify(respaldoAjeno))
    await backupRepo.importarBackup(datos)

    expect(await db.productos.count()).toBe(1) // reemplazó todo
    expect(await pedidosRepo.obtener(pedidoOriginal.id)).toBeUndefined()

    await backupRepo.deshacerUltimaImportacion()

    expect(await db.productos.count()).toBe(94)
    const restaurado = await pedidosRepo.obtener(pedidoOriginal.id)
    expect(restaurado?.id).toBe(pedidoOriginal.id)
    expect(restaurado?.total).toBe(pedidoOriginal.total)
  })

  it('no hay nada que deshacer si nunca se ha importado', async () => {
    expect(await backupRepo.haySnapshotParaDeshacer()).toBeUndefined()
    await expect(backupRepo.deshacerUltimaImportacion()).rejects.toThrow(ErrorDeValidacion)
  })

  it('una segunda importación reemplaza el snapshot de deshacer (no es una pila)', async () => {
    const vacio = { version: 1 as const, exportadoEn: Date.now(), versionApp: '0', versionCatalogo: 1, productos: [], pedidos: [] }
    // Falla porque no puede haber catálogo vacío en la app real, pero aquí solo probamos el mecanismo del snapshot.
    const conUnProducto = {
      ...vacio,
      productos: [{ id: 'x', categoria: 'velas', subcategoria: 'punta', codigo: 'chica', nombre: 'X', precio: 10, orden: 0 }],
    }

    await backupRepo.importarBackup(backupRepo.previsualizarImportacion(JSON.stringify(conUnProducto)))
    const primerSnapshot = await backupRepo.haySnapshotParaDeshacer()

    await backupRepo.importarBackup(backupRepo.previsualizarImportacion(JSON.stringify(conUnProducto)))
    const segundoSnapshot = await backupRepo.haySnapshotParaDeshacer()

    expect(segundoSnapshot?.creadoEn).toBeGreaterThanOrEqual(primerSnapshot!.creadoEn)
  })
})

describe('fecha del último respaldo', () => {
  it('se registra al exportar', async () => {
    expect(await backupRepo.fechaUltimoRespaldo()).toBeUndefined()
    await backupRepo.exportarBackup()
    expect(await backupRepo.fechaUltimoRespaldo()).toBeTypeOf('number')
  })
})
