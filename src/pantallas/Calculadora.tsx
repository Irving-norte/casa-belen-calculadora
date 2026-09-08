import { useMemo, useState } from 'react'
import { useProductos } from '../lib/hooks/useProductos'
import { useBorradorPedido } from '../lib/hooks/useBorradorPedido'
import SelectorCliente from './calculadora/SelectorCliente'
import SelectorCategoria, { type CategoriaSeleccion } from './calculadora/SelectorCategoria'
import RejillaNumeros from './calculadora/RejillaNumeros'
import ListaAromas from './calculadora/ListaAromas'
import CampoCantidad from './calculadora/CampoCantidad'
import VistaPrecio from './calculadora/VistaPrecio'
import LineasBorrador from './calculadora/LineasBorrador'
import BarraTotal from './calculadora/BarraTotal'
import type { Producto } from '../lib/dominio/tipos'

export default function Calculadora() {
  const productos = useProductos()
  const {
    tipoCliente,
    lineas,
    total,
    recuperado,
    seleccionarCliente,
    agregarProducto,
    cambiarCantidadDeLinea,
    quitarLinea,
    descartarAvisoRecuperacion,
  } = useBorradorPedido()

  const [categoria, setCategoria] = useState<CategoriaSeleccion | null>(null)
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const productoSeleccionado = useMemo<Producto | undefined>(() => {
    if (!productos || !categoria || !codigoSeleccionado) return undefined
    const [cat, sub] =
      categoria === 'velas'
        ? (['velas', 'punta'] as const)
        : categoria === 'barro'
          ? (['moldes', 'barro'] as const)
          : categoria === 'madera'
            ? (['moldes', 'madera'] as const)
            : (['aromas', '30ml'] as const)
    return productos.find(
      (p) => p.categoria === cat && p.subcategoria === sub && p.codigo === codigoSeleccionado,
    )
  }, [productos, categoria, codigoSeleccionado])

  function elegirCategoria(c: CategoriaSeleccion) {
    setCategoria(c)
    setCodigoSeleccionado(null)
    setCantidad(1)
    setError(null)
  }

  function agregar() {
    if (!productoSeleccionado) return
    try {
      agregarProducto(productoSeleccionado, cantidad)
      setCodigoSeleccionado(null)
      setCantidad(1)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el producto')
    }
  }

  function copiar() {
    // Se implementa en la Fase 7 (texto para WhatsApp).
    window.alert('Copiar pedido estará disponible en la Fase 7.')
  }

  function guardar() {
    // Se implementa en la Fase 5 (historial con precios congelados).
    window.alert('Guardar pedido estará disponible en la Fase 5.')
  }

  const velas = productos?.filter((p) => p.categoria === 'velas') ?? []
  const aromas = productos?.filter((p) => p.categoria === 'aromas') ?? []

  return (
    <div className="space-y-4">
      {recuperado && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-salvia px-3 py-2">
          <span className="text-[13px] text-salvia-fuerte">Recuperamos tu pedido sin terminar</span>
          <button
            onClick={descartarAvisoRecuperacion}
            className="text-[13px] font-medium text-salvia-fuerte underline"
          >
            Entendido
          </button>
        </div>
      )}

      <SelectorCliente valor={tipoCliente} onCambiar={seleccionarCliente} />

      <section className="rounded-xl bg-white p-4">
        <p className="mb-2 text-[12px] text-gris-texto">Agregar producto</p>
        <SelectorCategoria valor={categoria} onCambiar={elegirCategoria} />

        {categoria && (
          <div className="mt-4 space-y-4">
            {categoria === 'velas' && (
              <div className="grid grid-cols-3 gap-2">
                {velas.map((v) => {
                  const activo = v.codigo === codigoSeleccionado
                  return (
                    <button
                      key={v.id}
                      onClick={() => setCodigoSeleccionado(v.codigo)}
                      className={
                        'rounded-lg py-3 text-[13px] font-medium capitalize ' +
                        (activo ? 'bg-salvia-fuerte text-white' : 'border border-linea text-tinta')
                      }
                    >
                      {v.codigo}
                    </button>
                  )
                })}
              </div>
            )}

            {categoria === 'barro' && (
              <RejillaNumeros
                desde={1}
                hasta={40}
                seleccionado={codigoSeleccionado ? Number(codigoSeleccionado) : null}
                onSeleccionar={(n) => setCodigoSeleccionado(String(n))}
              />
            )}

            {categoria === 'madera' && (
              <RejillaNumeros
                desde={1}
                hasta={17}
                seleccionado={codigoSeleccionado ? Number(codigoSeleccionado) : null}
                onSeleccionar={(n) => setCodigoSeleccionado(String(n))}
              />
            )}

            {categoria === 'aromas' && (
              <ListaAromas
                aromas={aromas}
                seleccionado={
                  codigoSeleccionado
                    ? (aromas.find((a) => a.codigo === codigoSeleccionado)?.id ?? null)
                    : null
                }
                onSeleccionar={(id) => {
                  const aroma = aromas.find((a) => a.id === id)
                  if (aroma) setCodigoSeleccionado(aroma.codigo)
                }}
              />
            )}

            {productoSeleccionado && (
              <>
                <VistaPrecio producto={productoSeleccionado} tipoCliente={tipoCliente} />
                <CampoCantidad valor={cantidad} onCambiar={setCantidad} />
                {error && <p className="text-[13px] text-peligro">{error}</p>}
                <button
                  onClick={agregar}
                  className="w-full rounded-lg bg-tinta py-3.5 text-[15px] font-medium text-white"
                >
                  + Agregar
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 pb-2">
        <p className="mb-1 text-[12px] text-gris-texto">Pedido</p>
        <LineasBorrador
          lineas={lineas}
          onCambiarCantidad={cambiarCantidadDeLinea}
          onQuitar={quitarLinea}
        />
      </section>

      {/* Espacio para que la última línea no quede tapada por la barra fija de abajo */}
      <div className="h-24" />

      <BarraTotal total={total} hayLineas={lineas.length > 0} onCopiar={copiar} onGuardar={guardar} />
    </div>
  )
}
