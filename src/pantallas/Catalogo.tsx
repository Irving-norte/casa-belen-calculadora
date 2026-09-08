import { useMemo, useState } from 'react'
import { useProductos } from '../lib/hooks/useProductos'
import FilaProducto from './catalogo/FilaProducto'
import type { Categoria, Subcategoria } from '../lib/dominio/tipos'

const GRUPOS: { titulo: string; categoria: Categoria; subcategoria: Subcategoria }[] = [
  { titulo: 'Velas de punta', categoria: 'velas', subcategoria: 'punta' },
  { titulo: 'Moldes de barro', categoria: 'moldes', subcategoria: 'barro' },
  { titulo: 'Moldes de madera', categoria: 'moldes', subcategoria: 'madera' },
  { titulo: 'Aromas / Esencias', categoria: 'aromas', subcategoria: '30ml' },
]

export default function Catalogo() {
  const productos = useProductos()
  const [busqueda, setBusqueda] = useState('')

  const filtro = busqueda.trim().toLowerCase()

  const gruposConProductos = useMemo(() => {
    if (!productos) return []
    return GRUPOS.map((g) => {
      const items = productos
        .filter((p) => p.categoria === g.categoria && p.subcategoria === g.subcategoria)
        .filter((p) => !filtro || p.nombre.toLowerCase().includes(filtro))
      return { ...g, items }
    }).filter((g) => g.items.length > 0)
  }, [productos, filtro])

  if (productos === undefined) {
    return (
      <section className="rounded-xl bg-white p-4">
        <p className="text-[13px] text-gris-texto">Cargando catálogo…</p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-medium">Catálogo</h2>
        <p className="mt-1 text-[13px] text-gris-texto">
          {productos.length} productos · toca uno para editar su precio
        </p>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto…"
        className="w-full rounded-lg border border-linea bg-white px-3 py-3 text-[14px]"
      />

      {gruposConProductos.length === 0 && (
        <p className="text-[13px] text-gris-texto">Sin resultados para "{busqueda}"</p>
      )}

      {gruposConProductos.map((g) => (
        <section key={g.titulo} className="rounded-xl bg-white p-4">
          <h3 className="mb-1 text-[13px] font-medium tracking-wide text-gris-texto uppercase">
            {g.titulo}
          </h3>
          <div>
            {g.items.map((p) => (
              <FilaProducto key={p.id} producto={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
