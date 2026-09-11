import { useState } from 'react'
import { restaurarCatalogoDeFabrica } from '../lib/db/seed'
import SeccionRespaldo from './ajustes/SeccionRespaldo'

export default function Ajustes() {
  const [confirmando, setConfirmando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const conexion = navigator.onLine ? 'Con conexión' : 'Sin conexión'
  const instalada = window.matchMedia('(display-mode: standalone)').matches

  async function restaurar() {
    setRestaurando(true)
    try {
      await restaurarCatalogoDeFabrica()
      setMensaje('Catálogo restaurado a los precios originales.')
    } catch {
      setMensaje('No se pudo restaurar. Intenta de nuevo.')
    } finally {
      setRestaurando(false)
      setConfirmando(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white p-4">
        <h2 className="text-[15px] font-medium">Ajustes</h2>
        <p className="mt-1 text-[13px] text-gris-texto">
          Casa Belén — Calculadora de pedidos.
        </p>
        <dl className="mt-4 space-y-2 border-t border-linea pt-3 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-gris-texto">Versión</dt>
            <dd>{__VERSION__}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gris-texto">Estado</dt>
            <dd>{conexion}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gris-texto">Modo</dt>
            <dd>{instalada ? 'Instalada' : 'Navegador'}</dd>
          </div>
        </dl>
      </section>

      <SeccionRespaldo />

      <section className="rounded-xl bg-white p-4">
        <h3 className="text-[14px] font-medium">Catálogo</h3>
        <p className="mt-1 text-[13px] text-gris-texto">
          Vuelve a poner todos los precios como venían de fábrica. Esto no
          afecta los pedidos ya guardados: sus precios quedaron congelados
          al momento de crearlos.
        </p>

        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="mt-3 rounded-lg border border-peligro px-3 py-2 text-[13px] text-peligro"
          >
            Restaurar catálogo de fábrica
          </button>
        ) : (
          <div className="mt-3 rounded-lg bg-salvia p-3">
            <p className="text-[13px] text-salvia-fuerte">
              ¿Seguro? Se perderá cualquier precio que hayas editado a mano.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setConfirmando(false)}
                disabled={restaurando}
                className="flex-1 rounded-lg border border-linea bg-white py-2 text-[13px]"
              >
                Cancelar
              </button>
              <button
                onClick={restaurar}
                disabled={restaurando}
                className="flex-1 rounded-lg bg-peligro py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {restaurando ? 'Restaurando…' : 'Sí, restaurar'}
              </button>
            </div>
          </div>
        )}

        {mensaje && <p className="mt-3 text-[13px] text-gris-texto">{mensaje}</p>}
      </section>
    </div>
  )
}
