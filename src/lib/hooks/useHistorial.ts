import { useLiveQuery } from 'dexie-react-hooks'
import * as pedidosRepo from '../db/pedidos.repo'
import type { Pedido } from '../dominio/tipos'

export function useHistorial(): Pedido[] | undefined {
  return useLiveQuery(() => pedidosRepo.listar(), [])
}

export function usePedido(id: string | undefined): Pedido | null | undefined {
  // `undefined` = todavía cargando · `null` = ya se buscó y no existe.
  // useLiveQuery por sí solo no distingue esos dos casos, así que la
  // función de consulta traduce explícitamente "no encontrado" a null.
  return useLiveQuery(async () => {
    if (!id) return null
    const pedido = await pedidosRepo.obtener(id)
    return pedido ?? null
  }, [id])
}
