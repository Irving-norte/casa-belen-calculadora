import { useEffect, useRef, useState } from 'react'
import * as backupRepo from '../../lib/db/backup.repo'
import { descargarArchivo, leerArchivoComoTexto } from '../../lib/utilNavegador'
import type { Producto, Pedido } from '../../lib/dominio/tipos'

type Fase =
  | { paso: 'inicio' }
  | { paso: 'confirmando'; datos: { productos: Producto[]; pedidos: Pedido[] } }
  | { paso: 'importando' }

function formatearFecha(marca: number): string {
  return new Date(marca).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function SeccionRespaldo() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ultimoRespaldo, setUltimoRespaldo] = useState<number | undefined>()
  const [snapshotDeshacer, setSnapshotDeshacer] = useState<{ creadoEn: number } | undefined>()
  const [fase, setFase] = useState<Fase>({ paso: 'inicio' })
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    backupRepo.fechaUltimoRespaldo().then(setUltimoRespaldo)
    backupRepo.haySnapshotParaDeshacer().then(setSnapshotDeshacer)
  }, [])

  async function exportar() {
    setError(null)
    setMensaje(null)
    try {
      const { archivo, nombreSugerido } = await backupRepo.exportarBackup()
      descargarArchivo(nombreSugerido, JSON.stringify(archivo, null, 2), 'application/json')
      setUltimoRespaldo(archivo.exportadoEn)
      setMensaje('Respaldo descargado. Guárdalo en Drive o mándatelo por WhatsApp para tenerlo a salvo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar')
    }
  }

  function elegirArchivo() {
    setError(null)
    setMensaje(null)
    inputRef.current?.click()
  }

  async function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo si hace falta
    if (!archivo) return

    try {
      const texto = await leerArchivoComoTexto(archivo)
      const datos = backupRepo.previsualizarImportacion(texto) // no toca la base de datos todavía
      setFase({ paso: 'confirmando', datos })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo')
    }
  }

  async function confirmarImportacion() {
    if (fase.paso !== 'confirmando') return
    setFase({ paso: 'importando' })
    try {
      await backupRepo.importarBackup(fase.datos)
      setSnapshotDeshacer(await backupRepo.haySnapshotParaDeshacer())
      setMensaje(
        `Listo: se importaron ${fase.datos.productos.length} productos y ${fase.datos.pedidos.length} pedidos.`,
      )
      setFase({ paso: 'inicio' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar')
      setFase({ paso: 'inicio' })
    }
  }

  async function deshacer() {
    setError(null)
    try {
      await backupRepo.deshacerUltimaImportacion()
      setSnapshotDeshacer(undefined)
      setMensaje('Se deshizo la última importación.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo deshacer')
    }
  }

  return (
    <section className="rounded-xl bg-white p-4">
      <h3 className="text-[14px] font-medium">Respaldo</h3>
      <p className="mt-1 text-[13px] text-gris-texto">
        Guarda una copia de tu catálogo e historial completo, o restáurala si alguna vez pierdes
        los datos del teléfono.
      </p>

      <p className="mt-2 text-[12px] text-gris-texto">
        Último respaldo: {ultimoRespaldo ? formatearFecha(ultimoRespaldo) : 'nunca'}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={exportar}
          className="flex-1 rounded-lg border border-linea py-2.5 text-[13px] text-tinta"
        >
          Exportar datos
        </button>
        <button
          onClick={elegirArchivo}
          className="flex-1 rounded-lg border border-linea py-2.5 text-[13px] text-tinta"
        >
          Importar datos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onArchivoSeleccionado}
        />
      </div>

      {fase.paso === 'confirmando' && (
        <div className="mt-3 rounded-lg bg-salvia p-3">
          <p className="text-[13px] text-salvia-fuerte">
            Este archivo trae {fase.datos.productos.length} productos y {fase.datos.pedidos.length}{' '}
            pedidos. Va a <strong>reemplazar todo</strong> lo que tienes ahora en el teléfono.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setFase({ paso: 'inicio' })}
              className="flex-1 rounded-lg border border-linea bg-white py-2 text-[13px]"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarImportacion}
              className="flex-1 rounded-lg bg-peligro py-2 text-[13px] font-medium text-white"
            >
              Sí, reemplazar
            </button>
          </div>
        </div>
      )}

      {fase.paso === 'importando' && (
        <p className="mt-3 text-[13px] text-gris-texto">Importando…</p>
      )}

      {snapshotDeshacer && fase.paso === 'inicio' && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-salvia px-3 py-2">
          <span className="text-[13px] text-salvia-fuerte">
            Importaste el {formatearFecha(snapshotDeshacer.creadoEn)}
          </span>
          <button onClick={deshacer} className="text-[13px] font-medium text-salvia-fuerte underline">
            Deshacer
          </button>
        </div>
      )}

      {mensaje && <p className="mt-3 text-[13px] text-gris-texto">{mensaje}</p>}
      {error && <p className="mt-3 text-[13px] text-peligro">{error}</p>}
    </section>
  )
}
