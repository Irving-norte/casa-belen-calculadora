import { describe, expect, it } from 'vitest'
import { precioUnitario } from '../lib/dominio/precios'
import { PrecioNoDisponibleError } from '../lib/dominio/errores'
import type { Producto } from '../lib/dominio/tipos'

function producto(sobrescribir: Partial<Producto>): Producto {
  return {
    id: 'x', categoria: 'moldes', subcategoria: 'barro', codigo: '1',
    nombre: 'Test', orden: 0, ...sobrescribir,
  }
}

describe('precioUnitario', () => {
  it('vela: mismo precio sin importar el tipo de cliente', () => {
    const vela = producto({ categoria: 'velas', subcategoria: 'punta', codigo: 'grande', precio: 2200 })
    expect(precioUnitario(vela, 'general')).toBe(2200)
    expect(precioUnitario(vela, 'alumno')).toBe(2200)
  })

  it('aroma: mismo precio sin importar el tipo de cliente', () => {
    const aroma = producto({ categoria: 'aromas', subcategoria: '30ml', codigo: 'vanilla', precio: 4800 })
    expect(precioUnitario(aroma, 'general')).toBe(4800)
    expect(precioUnitario(aroma, 'alumno')).toBe(4800)
  })

  it('molde: general y alumno dan precios distintos', () => {
    const molde = producto({ precioGeneral: 25500, precioAlumno: 22500 })
    expect(precioUnitario(molde, 'general')).toBe(25500)
    expect(precioUnitario(molde, 'alumno')).toBe(22500)
  })

  it('lanza PrecioNoDisponibleError en vez de devolver 0 o undefined', () => {
    const incompleto = producto({ precioGeneral: 25500 }) // sin precioAlumno
    expect(() => precioUnitario(incompleto, 'alumno')).toThrow(PrecioNoDisponibleError)
  })

  it('un producto totalmente sin precio también lanza error', () => {
    const vacio = producto({})
    expect(() => precioUnitario(vacio, 'general')).toThrow(PrecioNoDisponibleError)
  })
})
