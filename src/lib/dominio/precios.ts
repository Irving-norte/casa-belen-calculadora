import type { Producto, TipoCliente } from './tipos'
import { PrecioNoDisponibleError } from './errores'

/**
 * Única función autorizada para resolver el precio de un producto.
 * Ninguna otra parte del código debe leer `precioGeneral` / `precioAlumno`
 * directamente — así el usuario nunca puede terminar escribiendo un precio
 * a mano y cualquier producto sin tarifa falla de forma ruidosa, no en
 * silencio con un 0 o un undefined.
 */
export function precioUnitario(producto: Producto, tipoCliente: TipoCliente): number {
  if (producto.precio != null) return producto.precio // velas, aromas

  if (tipoCliente === 'general' && producto.precioGeneral != null) {
    return producto.precioGeneral
  }
  if (tipoCliente === 'alumno' && producto.precioAlumno != null) {
    return producto.precioAlumno
  }

  throw new PrecioNoDisponibleError(producto.id, tipoCliente)
}
