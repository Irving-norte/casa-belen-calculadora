import { actualizarPrecio } from './productos.repo'
import type { ActualizacionDePrecio } from '../dominio/csvPrecios'

/**
 * Aplica las actualizaciones ya analizadas y validadas por
 * `analizarCSVDePrecios`. Reutiliza `actualizarPrecio()` una por una —
 * la misma función que usa la edición manual en Catálogo — así que
 * hereda automáticamente sus validaciones y el incremento de la versión
 * del catálogo.
 */
export async function aplicarActualizacionesDePrecios(
  actualizaciones: ActualizacionDePrecio[],
): Promise<number> {
  for (const { id, cambios } of actualizaciones) {
    await actualizarPrecio(id, cambios)
  }
  return actualizaciones.length
}
