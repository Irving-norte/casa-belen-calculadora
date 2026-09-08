import type { Producto, TipoCliente } from '../../lib/dominio/tipos'
import { precioUnitario } from '../../lib/dominio/precios'
import { formatear } from '../../lib/dominio/dinero'

export default function VistaPrecio({
  producto,
  tipoCliente,
}: {
  producto: Producto
  tipoCliente: TipoCliente
}) {
  const precio = precioUnitario(producto, tipoCliente)
  const esMolde = producto.precioGeneral != null

  return (
    <div className="rounded-lg bg-salvia px-3 py-2.5">
      <p className="text-[14px] font-medium text-salvia-fuerte">{producto.nombre}</p>
      <p className="text-[13px] text-salvia-fuerte">
        {formatear(precio)} c/u
        {esMolde && ` · tarifa ${tipoCliente === 'general' ? 'General' : 'Alumno'}`}
        {producto.presentacion && ` · ${producto.presentacion}`}
      </p>
    </div>
  )
}
