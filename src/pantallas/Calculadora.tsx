import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../lib/hooks/useProductos'
import { useBorradorPedido } from '../lib/hooks/useBorradorPedido'
import { useCopiarPedido } from '../lib/hooks/useCopiarPedido'
import * as pedidosRepo from '../lib/db/pedidos.repo'
import SelectorCliente from './calculadora/SelectorCliente'
import AgregarProducto from './calculadora/AgregarProducto'
import LineasBorrador from './calculadora/LineasBorrador'
import BarraTotal from './calculadora/BarraTotal'

export default function Calculadora() {
  const productos = useProductos()
  const navigate = useNavigate()
  const {
    tipoCliente,
    lineas,
    total,
    avisoOrigen,
    seleccionarCliente,
    agregarProducto,
    cambiarCantidadDeLinea,
    quitarLinea,
    vaciar,
    descartarAviso,
  } = useBorradorPedido()

  const { estado: estadoCopiar, copiar } = useCopiarPedido()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deshacer, setDeshacer] = useState<{ id: string; tipoCliente: typeof tipoCliente; lineas: typeof lineas } | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current)
  }, [])

  function copiarPedido() {
    void copiar(tipoCliente, lineas, total)
  }

  async function guardar() {
    setError(null)
    setGuardando(true)
    try {
      const pedido = await pedidosRepo.crear({ tipoCliente, lineas })
      setDeshacer({ id: pedido.id, tipoCliente, lineas })
      vaciar()
      if (temporizador.current) clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setDeshacer(null), 6000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el pedido')
    } finally {
      setGuardando(false)
    }
  }

  async function deshacerGuardado() {
    if (!deshacer) return
    await pedidosRepo.eliminar(deshacer.id)
    setDeshacer(null)
    if (temporizador.current) clearTimeout(temporizador.current)
  }

  return (
    <div className="space-y-4">
      {avisoOrigen && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-salvia px-3 py-2">
          <span className="text-[13px] text-salvia-fuerte">
            {avisoOrigen === 'recuperado'
              ? 'Recuperamos tu pedido sin terminar'
              : 'Pedido cargado para corregirlo'}
          </span>
          <button
            onClick={descartarAviso}
            className="text-[13px] font-medium text-salvia-fuerte underline"
          >
            Entendido
          </button>
        </div>
      )}

      {deshacer && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-tinta px-3 py-2.5">
          <span className="text-[13px] text-white">Pedido guardado</span>
          <div className="flex items-center gap-3">
            <button
              onClick={deshacerGuardado}
              className="text-[13px] font-medium text-white underline"
            >
              Deshacer
            </button>
            <button
              onClick={() => navigate(`/pedido/${deshacer.id}`)}
              className="text-[13px] font-medium text-white underline"
            >
              Ver
            </button>
          </div>
        </div>
      )}

      {estadoCopiar === 'copiado' && (
        <div className="rounded-lg bg-salvia px-3 py-2">
          <span className="text-[13px] text-salvia-fuerte">
            Pedido copiado. Ya puedes pegarlo en WhatsApp.
          </span>
        </div>
      )}

      <SelectorCliente
        valor={tipoCliente}
        onCambiar={(t) => seleccionarCliente(t, productos ?? [])}
      />

      <section className="rounded-xl bg-white p-4">
        <AgregarProducto
          productos={productos ?? []}
          tipoCliente={tipoCliente}
          onAgregar={agregarProducto}
        />
      </section>

      <section className="rounded-xl bg-white p-4 pb-2">
        <p className="mb-1 text-[12px] text-gris-texto">Pedido</p>
        <LineasBorrador
          lineas={lineas}
          onCambiarCantidad={cambiarCantidadDeLinea}
          onQuitar={quitarLinea}
        />
        {error && <p className="pb-3 text-[13px] text-peligro">{error}</p>}
      </section>

      {/* Reserva espacio para que la última línea no quede tapada por la
          barra de total y la navegación, ambas fijas y superpuestas al
          contenido. La altura se calcula contra las mismas medidas reales
          (nav = 4rem) en vez de un número adivinado. */}
      <div className="h-[calc(4rem+7.5rem+env(safe-area-inset-bottom))]" />

      <BarraTotal
        total={total}
        hayLineas={lineas.length > 0 && !guardando}
        onCopiar={copiarPedido}
        onGuardar={guardar}
      />
    </div>
  )
}
