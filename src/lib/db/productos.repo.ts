import { db, operacionSegura } from './dexie'
import type { Producto, ProductoId, Categoria, Subcategoria } from '../dominio/tipos'
import { ErrorDeValidacion } from '../dominio/errores'
import { incrementarVersionCatalogo } from './seed'

export async function listarTodos(): Promise<Producto[]> {
  return db.productos.orderBy('orden').toArray()
}

export async function listarPorSubcategoria(
  categoria: Categoria,
  subcategoria: Subcategoria,
): Promise<Producto[]> {
  return db.productos
    .where('[categoria+subcategoria]')
    .equals([categoria, subcategoria])
    .sortBy('orden')
}

export async function obtenerProducto(id: ProductoId): Promise<Producto | undefined> {
  return db.productos.get(id)
}

/**
 * Único punto de edición de precios. Solo puede tocar los campos de precio
 * — nunca categoría, subcategoría, código u orden — así el catálogo queda
 * protegido de cambios accidentales de identidad (requisito: no agregar ni
 * quitar productos en el MVP, solo ajustar tarifas).
 */
export async function actualizarPrecio(
  id: ProductoId,
  cambios: { precio?: number; precioGeneral?: number; precioAlumno?: number },
): Promise<void> {
  await operacionSegura(async () => {
    const producto = await db.productos.get(id)
    if (!producto) throw new ErrorDeValidacion(`Producto "${id}" no existe`)

    for (const [campo, valor] of Object.entries(cambios)) {
      if (valor != null && (!Number.isInteger(valor) || valor < 0)) {
        throw new ErrorDeValidacion(`El precio "${campo}" debe ser un entero ≥ 0`)
      }
    }

    await db.productos.update(id, cambios)
    await incrementarVersionCatalogo()
  }, 'actualizar precio')
}
