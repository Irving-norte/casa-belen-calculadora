import { Link } from 'react-router-dom'
import { useHistorial } from '../lib/hooks/useHistorial'
import { formatear } from '../lib/dominio/dinero'
import type { Pedido } from '../lib/dominio/tipos'

function etiquetaFecha(marca: number): string {
  const fecha = new Date(marca)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)

  const mismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (mismoDia(fecha, hoy)) return 'Hoy'
  if (mismoDia(fecha, ayer)) return 'Ayer'
  return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function hora(marca: number): string {
  return new Date(marca).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

export default function Historial() {
  const pedidos = useHistorial()

  if (pedidos === undefined) {
    return (
      <section className="rounded-xl bg-white p-4">
        <p className="text-[13px] text-gris-texto">Cargando historial…</p>
      </section>
    )
  }

  if (pedidos.length === 0) {
    return (
      <section className="rounded-xl bg-white p-4">
        <h2 className="text-[15px] font-medium">Historial</h2>
        <p className="mt-1 text-[13px] text-gris-texto">
          Todavía no has guardado ningún pedido.
        </p>
      </section>
    )
  }

  const grupos = new Map<string, Pedido[]>()
  for (const p of pedidos) {
    const clave = etiquetaFecha(p.creadoEn)
    const lista = grupos.get(clave) ?? []
    lista.push(p)
    grupos.set(clave, lista)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-medium">Historial</h2>

      {[...grupos.entries()].map(([etiqueta, items]) => (
        <section key={etiqueta}>
          <h3 className="mb-1.5 px-1 text-[12px] font-medium tracking-wide text-gris-texto uppercase">
            {etiqueta}
          </h3>
          <div className="rounded-xl bg-white">
            {items.map((p, i) => (
              <Link
                key={p.id}
                to={`/pedido/${p.id}`}
                className={
                  'flex items-center justify-between gap-3 px-4 py-3 ' +
                  (i < items.length - 1 ? 'border-b border-linea' : '')
                }
              >
                <div>
                  <p className="text-[14px] font-medium">
                    {p.tipoCliente === 'alumno' ? 'Alumno' : 'General'}
                  </p>
                  <p className="text-[12px] text-gris-texto">
                    {hora(p.creadoEn)} · {p.lineas.length} producto{p.lineas.length === 1 ? '' : 's'}
                    {p.editadoEn ? ' · editado' : ''}
                  </p>
                </div>
                <span className="text-[16px] font-medium">{formatear(p.total)}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
