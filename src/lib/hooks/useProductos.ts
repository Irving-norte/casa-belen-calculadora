import { useLiveQuery } from 'dexie-react-hooks'
import { listarTodos } from '../db/productos.repo'
import type { Producto, Categoria, Subcategoria } from '../dominio/tipos'

/** Se re-renderiza solo cuando la tabla de productos cambia. Sin caché manual. */
export function useProductos(): Producto[] | undefined {
  return useLiveQuery(() => listarTodos(), [])
}

export function useProductosPorGrupo(
  productos: Producto[] | undefined,
): Map<`${Categoria}-${Subcategoria}`, Producto[]> {
  const grupos = new Map<`${Categoria}-${Subcategoria}`, Producto[]>()
  for (const p of productos ?? []) {
    const clave = `${p.categoria}-${p.subcategoria}` as const
    const lista = grupos.get(clave) ?? []
    lista.push(p)
    grupos.set(clave, lista)
  }
  return grupos
}
