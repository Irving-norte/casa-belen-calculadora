import type { TipoCliente } from '../../lib/dominio/tipos'

const OPCIONES: { valor: TipoCliente; etiqueta: string }[] = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'alumno', etiqueta: 'Alumno' },
]

export default function SelectorCliente({
  valor,
  onCambiar,
}: {
  valor: TipoCliente
  onCambiar: (t: TipoCliente) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[12px] text-gris-texto">Cliente</p>
      <div className="grid grid-cols-2 gap-2">
        {OPCIONES.map((o) => {
          const activo = o.valor === valor
          return (
            <button
              key={o.valor}
              onClick={() => onCambiar(o.valor)}
              className={
                'rounded-lg py-3 text-[15px] font-medium ' +
                (activo
                  ? 'border-[1.5px] border-salvia-fuerte bg-salvia text-salvia-fuerte'
                  : 'border border-linea text-gris-texto')
              }
            >
              {o.etiqueta}
            </button>
          )
        })}
      </div>
    </div>
  )
}
