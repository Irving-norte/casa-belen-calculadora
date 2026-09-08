import { useMemo, useState } from 'react'
import type { Producto, TipoCliente } from '../../lib/dominio/tipos'
import SelectorCategoria, { type CategoriaSeleccion } from './SelectorCategoria'
import RejillaNumeros from './RejillaNumeros'
import ListaAromas from './ListaAromas'
import CampoCantidad from './CampoCantidad'
import VistaPrecio from './VistaPrecio'

export default function AgregarProducto({
  productos,
  tipoCliente,
  onAgregar,
}: {
  productos: Producto[]
  tipoCliente: TipoCliente
  onAgregar: (producto: Producto, cantidad: number) => void
}) {
  const [categoria, setCategoria] = useState<CategoriaSeleccion | null>(null)
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const velas = productos.filter((p) => p.categoria === 'velas')
  const aromas = productos.filter((p) => p.categoria === 'aromas')

  const productoSeleccionado = useMemo<Producto | undefined>(() => {
    if (!categoria || !codigoSeleccionado) return undefined
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
      onAgregar(productoSeleccionado, cantidad)
      setCategoria(null)
      setCodigoSeleccionado(null)
      setCantidad(1)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el producto')
    }
  }

  return (
    <div>
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
    </div>
  )
}
