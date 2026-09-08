import { formatear } from '../../lib/dominio/dinero'

export default function BarraTotal({
  total,
  hayLineas,
  onCopiar,
  onGuardar,
}: {
  total: number
  hayLineas: boolean
  onCopiar: () => void
  onGuardar: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-[64px] border-t border-linea bg-white px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] tracking-wide text-gris-texto uppercase">Total</span>
        <span className="text-[22px] font-medium">{formatear(total)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCopiar}
          disabled={!hayLineas}
          className="rounded-lg border border-tinta py-3 text-[14px] text-tinta disabled:opacity-40"
        >
          Copiar
        </button>
        <button
          onClick={onGuardar}
          disabled={!hayLineas}
          className="rounded-lg bg-tinta py-3 text-[14px] font-medium text-white disabled:opacity-40"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
