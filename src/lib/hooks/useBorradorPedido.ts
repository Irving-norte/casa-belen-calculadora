import { useCallback, useEffect, useRef, useState } from 'react'
import type { LineaPedido, Producto, TipoCliente } from '../dominio/tipos'
import {
  agregarLinea as agregarLineaPura,
  cambiarCantidad as cambiarCantidadPura,
  eliminarLinea as eliminarLineaPura,
  calcularTotal,
  crearLineaDesdeProducto,
} from '../dominio/pedido'
import { obtenerMeta, fijarMeta } from '../db/meta.repo'

const CLAVE_BORRADOR = 'borradorActual'

interface Borrador {
  tipoCliente: TipoCliente
  lineas: LineaPedido[]
}

const BORRADOR_VACIO: Borrador = { tipoCliente: 'alumno', lineas: [] }

/**
 * Estado del pedido en construcción. Se autoguarda en IndexedDB en cada
 * cambio (meta.borradorActual) para que si la app se cierra a medio
 * capturar — una llamada entrante, Android matando la pestaña — el pedido
 * no se pierda. Al montar, se recupera si había algo pendiente.
 */
export function useBorradorPedido() {
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO)
  const [recuperado, setRecuperado] = useState(false)
  const cargado = useRef(false)

  useEffect(() => {
    obtenerMeta<Borrador>(CLAVE_BORRADOR)
      .then((guardado) => {
        if (guardado && guardado.lineas.length > 0) {
          setBorrador(guardado)
          setRecuperado(true)
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

  const seleccionarCliente = useCallback((tipoCliente: TipoCliente) => {
    setBorrador((b) => ({ ...b, tipoCliente }))
  }, [])

  const agregarProducto = useCallback(
    (producto: Producto, cantidad: number) => {
      setBorrador((b) => {
        const linea = crearLineaDesdeProducto(producto, b.tipoCliente, cantidad)
        return { ...b, lineas: agregarLineaPura(b.lineas, linea) }
      })
    },
    [],
  )

  const cambiarCantidadDeLinea = useCallback((productoId: string, cantidad: number) => {
    setBorrador((b) => ({ ...b, lineas: cambiarCantidadPura(b.lineas, productoId, cantidad) }))
  }, [])

  const quitarLinea = useCallback((productoId: string) => {
    setBorrador((b) => ({ ...b, lineas: eliminarLineaPura(b.lineas, productoId) }))
  }, [])

  const vaciar = useCallback(() => {
    setBorrador(BORRADOR_VACIO)
    setRecuperado(false)
  }, [])

  const descartarAvisoRecuperacion = useCallback(() => setRecuperado(false), [])

  return {
    tipoCliente: borrador.tipoCliente,
    lineas: borrador.lineas,
    total: calcularTotal(borrador.lineas),
    recuperado,
    seleccionarCliente,
    agregarProducto,
    cambiarCantidadDeLinea,
    quitarLinea,
    vaciar,
    descartarAvisoRecuperacion,
  }
}
