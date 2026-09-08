import { useState } from 'react'
import type { Producto } from '../../lib/dominio/tipos'
import { formatear, aCentavos } from '../../lib/dominio/dinero'
import { actualizarPrecio } from '../../lib/db/productos.repo'

interface CampoPrecio {
  etiqueta: string
  campo: 'precio' | 'precioGeneral' | 'precioAlumno'
  valor: number
}

export default function FilaProducto({ producto }: { producto: Producto }) {
  const [editando, setEditando] = useState(false)
  const [valores, setValores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const campos: CampoPrecio[] = []
  if (producto.precio != null) {
    campos.push({ etiqueta: 'Precio', campo: 'precio', valor: producto.precio })
  }
  if (producto.precioGeneral != null) {
    campos.push({ etiqueta: 'General', campo: 'precioGeneral', valor: producto.precioGeneral })
  }
  if (producto.precioAlumno != null) {
    campos.push({ etiqueta: 'Alumno', campo: 'precioAlumno', valor: producto.precioAlumno })
  }

  function empezarEdicion() {
    const iniciales: Record<string, string> = {}
    for (const c of campos) iniciales[c.campo] = String(c.valor / 100)
    setValores(iniciales)
    setError(null)
    setEditando(true)
  }

  async function guardar() {
    setError(null)
    try {
      const cambios: Record<string, number> = {}
      for (const c of campos) {
        const texto = valores[c.campo] ?? ''
        cambios[c.campo] = aCentavos(texto)
      }
      setGuardando(true)
      await actualizarPrecio(producto.id, cambios)
      setEditando(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (!editando) {
    return (
      <button
        onClick={empezarEdicion}
        className="flex w-full items-center justify-between gap-3 border-b border-linea py-3 text-left last:border-b-0"
      >
        <div className="min-w-0">
          <p className="truncate text-[14px]">{producto.nombre}</p>
          {producto.presentacion && (
            <p className="text-[12px] text-gris-texto">{producto.presentacion}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[13px] text-gris-texto">
          {campos.map((c) => (
            <span key={c.campo}>
              {campos.length > 1 && <span className="mr-1 text-[11px]">{c.etiqueta[0]}</span>}
              {formatear(c.valor)}
            </span>
          ))}
        </div>
      </button>
    )
  }

  return (
    <div className="border-b border-linea py-3 last:border-b-0">
      <p className="mb-2 text-[14px] font-medium">{producto.nombre}</p>
      <div className="flex flex-wrap gap-2">
        {campos.map((c) => (
          <label key={c.campo} className="flex items-center gap-1.5 text-[13px] text-gris-texto">
            {campos.length > 1 ? c.etiqueta : 'Precio'}
            <span>$</span>
            <input
              inputMode="decimal"
              value={valores[c.campo] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [c.campo]: e.target.value }))}
              className="w-20 rounded-md border border-linea px-2 py-1.5 text-[14px] text-tinta"
            />
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-[13px] text-peligro">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setEditando(false)}
          disabled={guardando}
          className="flex-1 rounded-lg border border-linea py-2 text-[13px] text-gris-texto"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex-1 rounded-lg bg-tinta py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
