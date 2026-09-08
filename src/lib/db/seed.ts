import { db } from './dexie'
import { obtenerMeta, fijarMeta } from './meta.repo'
import { CATALOGO_INICIAL, SEED_VERSION } from '../../data/catalogo-inicial'

const CLAVE_SEED = 'seedVersion'
const CLAVE_VERSION_CATALOGO = 'versionCatalogo'

/**
 * Siembra idempotente: solo escribe el catálogo si nunca se ha sembrado.
 *
 * Esto es crítico. Si se re-ejecutara en cada arranque, cada vez que se
 * publique una versión nueva de la app se BORRARÍAN los precios que el
 * usuario editó a mano. La regla es: los precios editados siempre ganan.
 */
export async function sembrarCatalogoSiHaceFalta(): Promise<void> {
  const yaSembrado = await obtenerMeta<number>(CLAVE_SEED)
  if (yaSembrado != null) return

  await db.transaction('rw', db.productos, db.meta, async () => {
    await db.productos.bulkAdd(CATALOGO_INICIAL)
    await fijarMeta(CLAVE_SEED, SEED_VERSION)
    await fijarMeta(CLAVE_VERSION_CATALOGO, 1)
  })
}

/** Botón explícito de Ajustes. Requiere confirmación en la UI antes de llamarse. */
export async function restaurarCatalogoDeFabrica(): Promise<void> {
  await db.transaction('rw', db.productos, db.meta, async () => {
    await db.productos.clear()
    await db.productos.bulkAdd(CATALOGO_INICIAL)
    await fijarMeta(CLAVE_SEED, SEED_VERSION)
    const actual = (await obtenerMeta<number>(CLAVE_VERSION_CATALOGO)) ?? 0
    await fijarMeta(CLAVE_VERSION_CATALOGO, actual + 1)
  })
}

export async function versionCatalogoActual(): Promise<number> {
  return (await obtenerMeta<number>(CLAVE_VERSION_CATALOGO)) ?? 1
}

export async function incrementarVersionCatalogo(): Promise<number> {
  const actual = await versionCatalogoActual()
  const nueva = actual + 1
  await fijarMeta(CLAVE_VERSION_CATALOGO, nueva)
  return nueva
}
