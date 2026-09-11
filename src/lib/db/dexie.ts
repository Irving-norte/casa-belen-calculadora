import Dexie, { type EntityTable } from 'dexie'
import type { Producto, Pedido } from '../dominio/tipos'
import { ErrorDeValidacion } from '../dominio/errores'

export interface MetaRegistro {
  clave: string
  valor: unknown
}

export class CasaBelenDB extends Dexie {
  productos!: EntityTable<Producto, 'id'>
  pedidos!: EntityTable<Pedido, 'id'>
  meta!: EntityTable<MetaRegistro, 'clave'>

  constructor() {
    super('casa-belen')
    this.version(1).stores({
      productos: 'id, categoria, [categoria+subcategoria], orden',
      pedidos: 'id, creadoEn, tipoCliente',
      meta: 'clave',
    })
  }
}

export const db = new CasaBelenDB()

/**
 * Envoltura para operaciones de escritura: convierte cualquier fallo de
 * IndexedDB (cuota llena, modo incógnito, storage bloqueado) en un mensaje
 * comprensible en vez de dejar una excepción cruda reventar la UI.
 */
export async function operacionSegura<T>(op: () => Promise<T>, contexto: string): Promise<T> {
  try {
    return await op()
  } catch (error) {
    if (error instanceof ErrorDeValidacion) throw error // mensaje ya pensado para el usuario
    console.error(`[db] ${contexto}:`, error)
    throw new Error(`No se pudo completar: ${contexto}. Intenta de nuevo.`)
  }
}
