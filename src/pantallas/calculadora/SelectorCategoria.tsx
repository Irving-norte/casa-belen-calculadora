export type CategoriaSeleccion = 'velas' | 'barro' | 'madera' | 'aromas'

const OPCIONES: { valor: CategoriaSeleccion; etiqueta: string }[] = [
  { valor: 'velas', etiqueta: 'Velas' },
  { valor: 'barro', etiqueta: 'Barro' },
  { valor: 'madera', etiqueta: 'Madera' },
  { valor: 'aromas', etiqueta: 'Aromas' },
]

export default function SelectorCategoria({
  valor,
  onCambiar,
}: {
  valor: CategoriaSeleccion | null
  onCambiar: (c: CategoriaSeleccion) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {OPCIONES.map((o) => {
        const activo = o.valor === valor
        return (
          <button
            key={o.valor}
            onClick={() => onCambiar(o.valor)}
            className={
              'rounded-lg py-3 text-[13px] font-medium ' +
              (activo ? 'bg-tinta text-white' : 'border border-linea text-gris-texto')
            }
          >
            {o.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
