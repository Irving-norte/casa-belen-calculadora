import { useRef, useState } from 'react'
import { construirCSVDePrecios, analizarCSVDePrecios, type AnalisisCSVDePrecios } from '../../lib/dominio/csvPrecios'
import { aplicarActualizacionesDePrecios } from '../../lib/db/csvPrecios.repo'
import { descargarArchivo, leerArchivoComoTexto } from '../../lib/utilNavegador'
import type { Producto } from '../../lib/dominio/tipos'

export default function SeccionCSVPrecios({ productos }: { productos: Producto[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [analisis, setAnalisis] = useState<AnalisisCSVDePrecios | null>(null)
  const [aplicando, setAplicando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function exportarCSV() {
    setError(null)
    setMensaje(null)
    const csv = construirCSVDePrecios(productos)
    descargarArchivo('casa-belen-precios.csv', csv, 'text/csv;charset=utf-8')
  }

  function elegirArchivo() {
    setError(null)
    setMensaje(null)
    setAnalisis(null)
    inputRef.current?.click()
  }

  async function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    try {
      const texto = await leerArchivoComoTexto(archivo)
      setAnalisis(analizarCSVDePrecios(texto, productos))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo')
    }
  }

  async function confirmar() {
    if (!analisis) return
    setAplicando(true)
    try {
      const total = await aplicarActualizacionesDePrecios(analisis.actualizaciones)
      setMensaje(`${total} precio${total === 1 ? '' : 's'} actualizado${total === 1 ? '' : 's'}.`)
      setAnalisis(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar la actualización')
    } finally {
      setAplicando(false)
    }
  }

  return (
    <section className="rounded-xl bg-white p-4">
      <h3 className="text-[14px] font-medium">Editar precios en Excel</h3>
      <p className="mt-1 text-[13px] text-gris-texto">
        Exporta una hoja con todos los productos, cambia los precios que quieras ahí, y vuelve a
        subirla. No se pueden agregar ni quitar productos por esta vía, solo cambiar precios.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={exportarCSV}
          className="flex-1 rounded-lg border border-linea py-2.5 text-[13px] text-tinta"
        >
          Exportar precios (CSV)
        </button>
        <button
          onClick={elegirArchivo}
          className="flex-1 rounded-lg border border-linea py-2.5 text-[13px] text-tinta"
        >
          Importar precios (CSV)
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="text/csv,.csv"
          className="hidden"
          onChange={onArchivoSeleccionado}
        />
      </div>

      {analisis && (
        <div className="mt-3 rounded-lg bg-salvia p-3">
          <p className="text-[13px] text-salvia-fuerte">
            {analisis.actualizaciones.length} precio
            {analisis.actualizaciones.length === 1 ? '' : 's'} se van a actualizar
            {analisis.errores.length > 0 &&
              `, ${analisis.errores.length} fila${analisis.errores.length === 1 ? '' : 's'} con error se van a omitir`}
            .
          </p>

          {analisis.errores.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[12px] text-peligro">
              {analisis.errores.map((e) => (
                <li key={e.fila}>
                  Fila {e.fila}: {e.motivo}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setAnalisis(null)}
              disabled={aplicando}
              className="flex-1 rounded-lg border border-linea bg-white py-2 text-[13px]"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={aplicando || analisis.actualizaciones.length === 0}
              className="flex-1 rounded-lg bg-tinta py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {aplicando ? 'Aplicando…' : 'Confirmar cambios'}
            </button>
          </div>
        </div>
      )}

      {mensaje && <p className="mt-3 text-[13px] text-gris-texto">{mensaje}</p>}
      {error && <p className="mt-3 text-[13px] text-peligro">{error}</p>}
    </section>
  )
}
