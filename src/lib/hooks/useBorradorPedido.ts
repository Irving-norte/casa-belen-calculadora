import { useCallback, useEffect, useRef, useState } from 'react'
import type { LineaPedido, Producto, TipoCliente } from '../dominio/tipos'
import {
  agregarLinea as agregarLineaPura,
  cambiarCantidad as cambiarCantidadPura,
  eliminarLinea as eliminarLineaPura,
  calcularTotal,
  crearLineaDesdeProducto,
  recalcularPreciosPorTipoCliente,
} from '../dominio/pedido'
import { obtenerMeta, fijarMeta } from '../db/meta.repo'

const CLAVE_BORRADOR = 'borradorActual'

type OrigenBorrador = 'recuperado' | 'duplicado'

interface Borrador {
  tipoCliente: TipoCliente
  lineas: LineaPedido[]
  origen?: OrigenBorrador
}

const BORRADOR_VACIO: Borrador = { tipoCliente: 'alumno', lineas: [] }

/**
 * Escribe un borrador directamente en IndexedDB para que la Calculadora lo
 * recoja al montar. Se usa desde el Detalle de un pedido para "Duplicar
 * como pedido nuevo": como cambiar de pantalla desmonta la Calculadora,
 * al volver a montarla el efecto de abajo la recupera sin acoplar
 * directamente los dos componentes entre sí.
 */
export async function cargarBorradorParaDuplicar(
  tipoCliente: TipoCliente,
  lineas: LineaPedido[],
): Promise<void> {
  await fijarMeta(CLAVE_BORRADOR, { tipoCliente, lineas, origen: 'duplicado' } satisfies Borrador)
}

/**
 * Estado del pedido en construcción. Se autoguarda en IndexedDB en cada
 * cambio (meta.borradorActual) para que si la app se cierra a medio
 * capturar — una llamada entrante, Android matando la pestaña — el pedido
 * no se pierda. Al montar, se recupera si había algo pendiente.
 */
export function useBorradorPedido() {
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO)
  const [avisoOrigen, setAvisoOrigen] = useState<OrigenBorrador | null>(null)
  const cargado = useRef(false)

  useEffect(() => {
    obtenerMeta<Borrador>(CLAVE_BORRADOR)
      .then((guardado) => {
        if (guardado && guardado.lineas.length > 0) {
          setBorrador(guardado)
          setAvisoOrigen(guardado.origen ?? 'recuperado')
        }
      })
      .finally(() => {
        cargado.current = true
      })
  }, [])

  useEffect(() => {
    if (!cargado.current) return // no pisar lo guardado antes de terminar de leerlo
    void fijarMeta(CLAVE_BORRADOR, borrador)
  }, [borrador])

  const seleccionarCliente = useCallback((tipoCliente: TipoCliente, productos: Producto[]) => {
    setBorrador((b) => ({
      ...b,
      tipoCliente,
      lineas: recalcularPreciosPorTipoCliente(b.lineas, productos, tipoCliente),
    }))
  }, [])

  const agregarProducto = useCallback((producto: Producto, cantidad: number) => {
    setBorrador((b) => {
      const linea = crearLineaDesdeProducto(producto, b.tipoCliente, cantidad)
      return { ...b, lineas: agregarLineaPura(b.lineas, linea) }
    })
  }, [])

  const cambiarCantidadDeLinea = useCallback((productoId: string, cantidad: number) => {
    setBorrador((b) => ({ ...b, lineas: cambiarCantidadPura(b.lineas, productoId, cantidad) }))
  }, [])

  const quitarLinea = useCallback((productoId: string) => {
    setBorrador((b) => ({ ...b, lineas: eliminarLineaPura(b.lineas, productoId) }))
  }, [])

  const vaciar = useCallback(() => {
    setBorrador(BORRADO_VACIO_SEGURO())
    setAvisoOrigen(null)
  }, [])

  const descartarAviso = useCallback(() => setAvisoOrigen(null), [])

  return {
    tipoCliente: borrador.tipoCliente,
    lineas: borrador.lineas,
    total: calcularTotal(borrador.lineas),
    avisoOrigen,
    seleccionarCliente,
    agregarProducto,
    cambiarCantidadDeLinea,
    quitarLinea,
    vaciar,
    descartarAviso,
  }
}

// Evita compartir la misma referencia de objeto entre renders/llamadas.
function BORRADO_VACIO_SEGURO(): Borrador {
  return { tipoCliente: 'alumno', lineas: [] }
}
