export default function RejillaNumeros({
  desde,
  hasta,
  seleccionado,
  onSeleccionar,
}: {
  desde: number
  hasta: number
  seleccionado: number | null
  onSeleccionar: (n: number) => void
}) {
  const numeros = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {numeros.map((n) => {
        const activo = n === seleccionado
        return (
          <button
            key={n}
            onClick={() => onSeleccionar(n)}
            className={
              'rounded-md py-2.5 text-[14px] ' +
              (activo ? 'bg-salvia-fuerte font-medium text-white' : 'border border-linea text-tinta')
            }
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
