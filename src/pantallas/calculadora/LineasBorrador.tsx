import type { LineaPedido } from '../../lib/dominio/tipos'
import { formatear } from '../../lib/dominio/dinero'

export default function LineasBorrador({
  lineas,
  onCambiarCantidad,
  onQuitar,
}: {
  lineas: LineaPedido[]
  onCambiarCantidad: (productoId: string, cantidad: number) => void
  onQuitar: (productoId: string) => void
}) {
  if (lineas.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-gris-texto">
        Todavía no agregas ningún producto
      </p>
    )
  }

  return (
    <ul className="divide-y divide-linea">
      {lineas.map((l) => (
        <li key={l.productoId} className="flex items-center gap-2 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px]">{l.nombreProducto}</p>
            <p className="text-[12px] text-gris-texto">
              {formatear(l.precioUnitario)} × {l.cantidad} = {formatear(l.subtotal)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => onCambiarCantidad(l.productoId, Math.max(1, l.cantidad - 1))}
              className="h-9 w-9 rounded-md border border-linea text-[16px] text-tinta"
              aria-label={`Quitar uno de ${l.nombreProducto}`}
            >
              −
            </button>
            <span className="w-6 text-center text-[14px]">{l.cantidad}</span>
            <button
              onClick={() => onCambiarCantidad(l.productoId, l.cantidad + 1)}
              className="h-9 w-9 rounded-md border border-linea text-[16px] text-tinta"
              aria-label={`Agregar uno de ${l.nombreProducto}`}
            >
              +
            </button>
            <button
              onClick={() => onQuitar(l.productoId)}
              className="ml-1 h-9 w-9 rounded-md text-[16px] text-peligro"
              aria-label={`Quitar ${l.nombreProducto} del pedido`}
            >
              🗑
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
