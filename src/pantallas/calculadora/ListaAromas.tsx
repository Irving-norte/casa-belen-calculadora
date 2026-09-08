import { useState } from 'react'
import type { Producto } from '../../lib/dominio/tipos'

export default function ListaAromas({
  aromas,
  seleccionado,
  onSeleccionar,
}: {
  aromas: Producto[]
  seleccionado: string | null
  onSeleccionar: (id: string) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const filtro = busqueda.trim().toLowerCase()
  const visibles = filtro ? aromas.filter((a) => a.nombre.toLowerCase().includes(filtro)) : aromas

  return (
    <div>
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar aroma…"
        className="mb-2 w-full rounded-lg border border-linea px-3 py-2.5 text-[14px]"
      />
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {visibles.map((a) => {
          const activo = a.id === seleccionado
          return (
            <button
              key={a.id}
              onClick={() => onSeleccionar(a.id)}
              className={
                'w-full rounded-md px-3 py-2.5 text-left text-[14px] ' +
                (activo ? 'bg-salvia-fuerte font-medium text-white' : 'border border-linea text-tinta')
              }
            >
              {a.nombre}
            </button>
          )
        })}
        {visibles.length === 0 && (
          <p className="py-2 text-[13px] text-gris-texto">Sin resultados</p>
        )}
      </div>
    </div>
  )
}
