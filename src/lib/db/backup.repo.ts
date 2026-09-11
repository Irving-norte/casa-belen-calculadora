import { db, operacionSegura } from './dexie'
import { obtenerMeta, fijarMeta } from './meta.repo'
import { construirBackup, leerBackup, type BackupV1 } from '../dominio/backup'
import { versionCatalogoActual } from './seed'
import { ErrorDeValidacion } from '../dominio/errores'
import type { Pedido, Producto } from '../dominio/tipos'

const CLAVE_ULTIMO_RESPALDO = 'ultimoRespaldoExportadoEn'
const CLAVE_SNAPSHOT_UNDO = 'respaldoAntesDeImportar'

interface SnapshotUndo {
  creadoEn: number
  productos: Producto[]
  pedidos: Pedido[]
}

export async function exportarBackup(): Promise<{ archivo: BackupV1; nombreSugerido: string }> {
  const [productos, pedidos, versionCatalogo] = await Promise.all([
    db.productos.toArray(),
    db.pedidos.toArray(),
    versionCatalogoActual(),
  ])

  const archivo = construirBackup({ productos, pedidos, versionApp: __VERSION__, versionCatalogo })
  await fijarMeta(CLAVE_ULTIMO_RESPALDO, archivo.exportadoEn)

  const fecha = new Date(archivo.exportadoEn).toISOString().slice(0, 10)
  return { archivo, nombreSugerido: `casa-belen-respaldo-${fecha}.json` }
}

export async function fechaUltimoRespaldo(): Promise<number | undefined> {
  return obtenerMeta<number>(CLAVE_ULTIMO_RESPALDO)
}

/** Valida el texto del archivo SIN tocar la base de datos. Lanza si es inválido. */
export function previsualizarImportacion(textoJson: string): { productos: Producto[]; pedidos: Pedido[] } {
  let json: unknown
  try {
    json = JSON.parse(textoJson)
  } catch {
    throw new ErrorDeValidacion('El archivo no es un JSON válido')
  }
  return leerBackup(json)
}

/**
 * Reemplaza TODO el catálogo y TODO el historial por lo que trae el
 * archivo (decisión D-4: importar reemplaza, nunca fusiona).
 *
 * Antes de tocar nada, guarda internamente un snapshot del estado actual
 * — no como un archivo adicional que el usuario tenga que administrar,
 * sino en `meta`, recuperable con `deshacerUltimaImportacion()`. Es un
 * único nivel de deshacer, no una pila: cada importación nueva reemplaza
 * el snapshot anterior.
 */
export async function importarBackup(datos: { productos: Producto[]; pedidos: Pedido[] }): Promise<{
  productos: number
  pedidos: number
}> {
  return operacionSegura(async () => {
    await db.transaction('rw', db.productos, db.pedidos, db.meta, async () => {
      const snapshot: SnapshotUndo = {
        creadoEn: Date.now(),
        productos: await db.productos.toArray(),
        pedidos: await db.pedidos.toArray(),
      }
      await fijarMeta(CLAVE_SNAPSHOT_UNDO, snapshot)

      await db.productos.clear()
      await db.pedidos.clear()
      await db.productos.bulkAdd(datos.productos)
      if (datos.pedidos.length > 0) await db.pedidos.bulkAdd(datos.pedidos)
    })
    return { productos: datos.productos.length, pedidos: datos.pedidos.length }
  }, 'importar respaldo')
}

export async function haySnapshotParaDeshacer(): Promise<{ creadoEn: number } | undefined> {
  const snapshot = await obtenerMeta<SnapshotUndo>(CLAVE_SNAPSHOT_UNDO)
  return snapshot ? { creadoEn: snapshot.creadoEn } : undefined
}

export async function deshacerUltimaImportacion(): Promise<void> {
  await operacionSegura(async () => {
    const snapshot = await obtenerMeta<SnapshotUndo>(CLAVE_SNAPSHOT_UNDO)
    if (!snapshot) throw new ErrorDeValidacion('No hay ninguna importación reciente que deshacer')

    await db.transaction('rw', db.productos, db.pedidos, db.meta, async () => {
      await db.productos.clear()
      await db.pedidos.clear()
      await db.productos.bulkAdd(snapshot.productos)
      if (snapshot.pedidos.length > 0) await db.pedidos.bulkAdd(snapshot.pedidos)
      await db.meta.delete(CLAVE_SNAPSHOT_UNDO)
    })
  }, 'deshacer importación')
}
