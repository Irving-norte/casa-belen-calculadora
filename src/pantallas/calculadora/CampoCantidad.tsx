export default function CampoCantidad({
  valor,
  onCambiar,
}: {
  valor: number
  onCambiar: (n: number) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[12px] text-gris-texto">Cantidad</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onCambiar(Math.max(1, valor - 1))}
          className="h-11 w-11 rounded-lg border border-linea text-[20px] text-tinta"
          aria-label="Quitar uno"
        >
          −
        </button>
        <span className="w-10 text-center text-[18px] font-medium">{valor}</span>
        <button
          onClick={() => onCambiar(valor + 1)}
          className="h-11 w-11 rounded-lg border border-linea text-[20px] text-tinta"
          aria-label="Agregar uno"
        >
          +
        </button>
      </div>
    </div>
  )
}
