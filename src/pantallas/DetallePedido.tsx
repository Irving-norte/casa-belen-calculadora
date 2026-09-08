import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePedido } from '../lib/hooks/useHistorial'
import { useProductos } from '../lib/hooks/useProductos'
import { cargarBorradorParaDuplicar } from '../lib/hooks/useBorradorPedido'
import * as pedidosRepo from '../lib/db/pedidos.repo'
import { agregarLinea, cambiarCantidad, eliminarLinea, calcularTotal } from '../lib/dominio/pedido'
import { formatear } from '../lib/dominio/dinero'
import type { LineaPedido } from '../lib/dominio/tipos'
import LineasBorrador from './calculadora/LineasBorrador'
import AgregarProducto from './calculadora/AgregarProducto'

function fechaCompleta(marca: number): string {
  return new Date(marca).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DetallePedido() {
  const { id } = useParams<{ id: string }>()
  const pedido = usePedido(id)
  const productos = useProductos()
  const navigate = useNavigate()

  const [editando, setEditando] = useState(false)
  const [lineasEdicion, setLineasEdicion] = useState<LineaPedido[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  if (pedido === undefined) {
    return (
      <section className="rounded-xl bg-white p-4">
        <p className="text-[13px] text-gris-texto">Cargando pedido…</p>
      </section>
    )
  }

  if (pedido === null) {
    return (
      <section className="rounded-xl bg-white p-4">
        <p className="text-[14px] font-medium">Este pedido ya no existe</p>
        <button
          onClick={() => navigate('/historial')}
          className="mt-3 text-[13px] font-medium text-salvia-fuerte underline"
        >
          Volver al historial
        </button>
      </section>
    )
  }

  function empezarEdicion() {
    setLineasEdicion(pedido!.lineas)
    setError(null)
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setError(null)
  }

  async function guardarEdicion() {
    if (!pedido) return
    setError(null)
    setGuardando(true)
    try {
      await pedidosRepo.actualizar(pedido.id, { lineas: lineasEdicion })
      setEditando(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la edición')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarPedido() {
    if (!pedido) return
    await pedidosRepo.eliminar(pedido.id)
    navigate('/historial')
  }

  async function duplicar() {
    if (!pedido) return
    await cargarBorradorParaDuplicar(pedido.tipoCliente, pedido.lineas)
    navigate('/')
  }

  const lineasAMostrar = editando ? lineasEdicion : pedido.lineas
  const totalAMostrar = editando ? calcularTotal(lineasEdicion) : pedido.total

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-medium">
              {pedido.tipoCliente === 'alumno' ? 'Alumno' : 'General'}
            </p>
            <p className="text-[13px] text-gris-texto">Guardado el {fechaCompleta(pedido.creadoEn)}</p>
            {pedido.editadoEn && (
              <p className="text-[13px] text-gris-texto">Editado el {fechaCompleta(pedido.editadoEn)}</p>
            )}
          </div>
          {!editando && (
            <button
              onClick={empezarEdicion}
              className="shrink-0 rounded-lg border border-linea px-3 py-1.5 text-[13px] text-tinta"
            >
              Editar
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 pb-2">
        <p className="mb-1 text-[12px] text-gris-texto">Productos</p>
        <LineasBorrador
          lineas={lineasAMostrar}
          onCambiarCantidad={
            editando
              ? (productoId, cantidad) =>
                  setLineasEdicion((ls) => cambiarCantidad(ls, productoId, cantidad))
              : () => {}
          }
          onQuitar={
            editando ? (productoId) => setLineasEdicion((ls) => eliminarLinea(ls, productoId)) : () => {}
          }
        />
        {!editando && (
          <p className="pb-3 text-[12px] text-gris-texto">
            Toca "Editar" arriba para cambiar cantidades o quitar productos.
          </p>
        )}
      </section>

      {editando && (
        <section className="rounded-xl bg-white p-4">
          <AgregarProducto
            productos={productos ?? []}
            tipoCliente={pedido.tipoCliente}
            onAgregar={(producto, cantidad) => {
              try {
                const nueva = {
                  productoId: producto.id,
                  nombreProducto: producto.nombre,
                  categoria: producto.categoria,
                  subcategoria: producto.subcategoria,
                  codigo: producto.codigo,
                  presentacion: producto.presentacion,
                  cantidad,
                  precioUnitario:
                    producto.precio ??
                    (pedido.tipoCliente === 'general' ? producto.precioGeneral : producto.precioAlumno) ??
                    0,
                  subtotal: 0,
                }
                nueva.subtotal = nueva.precioUnitario * nueva.cantidad
                setLineasEdicion((ls) => agregarLinea(ls, nueva))
              } catch (e) {
                setError(e instanceof Error ? e.message : 'No se pudo agregar')
              }
            }}
          />
          <p className="mt-2 text-[12px] text-gris-texto">
            Un producto agregado aquí toma el precio actual del catálogo, no el de cuando se
            guardó el pedido.
          </p>
        </section>
      )}

      <section className="rounded-xl bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] tracking-wide text-gris-texto uppercase">Total</span>
          <span className="text-[20px] font-medium">{formatear(totalAMostrar)}</span>
        </div>

        {error && <p className="mt-2 text-[13px] text-peligro">{error}</p>}

        {editando ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={cancelarEdicion}
              disabled={guardando}
              className="flex-1 rounded-lg border border-linea py-2.5 text-[14px] text-gris-texto"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEdicion}
              disabled={guardando}
              className="flex-1 rounded-lg bg-tinta py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        ) : (
          <button
            onClick={duplicar}
            className="mt-3 w-full rounded-lg border border-linea py-2.5 text-[14px] text-tinta"
          >
            Duplicar como pedido nuevo
          </button>
        )}
      </section>

      {!editando && (
        <section className="rounded-xl bg-white p-4">
          {!confirmandoEliminar ? (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="text-[13px] text-peligro"
            >
              Eliminar este pedido
            </button>
          ) : (
            <div className="rounded-lg bg-salvia p-3">
              <p className="text-[13px] text-salvia-fuerte">
                Esto no se puede deshacer. ¿Eliminar el pedido?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setConfirmandoEliminar(false)}
                  className="flex-1 rounded-lg border border-linea bg-white py-2 text-[13px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarPedido}
                  className="flex-1 rounded-lg bg-peligro py-2 text-[13px] font-medium text-white"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
