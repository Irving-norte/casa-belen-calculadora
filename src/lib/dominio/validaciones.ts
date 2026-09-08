import { ErrorDeValidacion } from './errores'
import type { Subcategoria } from './tipos'

export function validarCantidad(cantidad: number): void {
  if (!Number.isInteger(cantidad)) {
    throw new ErrorDeValidacion('La cantidad debe ser un número entero')
  }
  if (cantidad < 1) {
    throw new ErrorDeValidacion('La cantidad debe ser al menos 1')
  }
}

/** Rango válido de cada subcategoría de molde, para no permitir números fuera de catálogo. */
const RANGOS_MOLDES: Partial<Record<Subcategoria, [number, number]>> = {
  barro: [1, 40],
  madera: [1, 17],
}

export function validarNumeroMolde(subcategoria: Subcategoria, numero: number): void {
  const rango = RANGOS_MOLDES[subcategoria]
  if (!rango) return // no es una subcategoría de moldes
  const [min, max] = rango
  if (!Number.isInteger(numero) || numero < min || numero > max) {
    throw new ErrorDeValidacion(`El número debe estar entre ${min} y ${max}`)
  }
}
