import { useRegisterSW } from 'virtual:pwa-register/react'

export default function AvisoActualizacion() {
  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayVersionNueva) return null

  return (
    <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg bg-salvia px-3 py-2">
      <span className="text-[13px] text-salvia-fuerte">Hay una versión nueva</span>
      <button
        onClick={() => void updateServiceWorker(true)}
        className="rounded-md bg-tinta px-3 py-1.5 text-[13px] font-medium text-white"
      >
        Actualizar
      </button>
    </div>
  )
}
