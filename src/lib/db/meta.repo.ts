import { db } from './dexie'

export async function obtenerMeta<T>(clave: string): Promise<T | undefined> {
  const registro = await db.meta.get(clave)
  return registro?.valor as T | undefined
}

export async function fijarMeta(clave: string, valor: unknown): Promise<void> {
  await db.meta.put({ clave, valor })
}
