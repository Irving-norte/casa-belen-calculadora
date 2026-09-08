import { describe, expect, it } from 'vitest'
import { validarCantidad, validarNumeroMolde } from '../lib/dominio/validaciones'
import { ErrorDeValidacion } from '../lib/dominio/errores'

describe('validarCantidad', () => {
  it('acepta enteros positivos', () => {
    expect(() => validarCantidad(1)).not.toThrow()
    expect(() => validarCantidad(40)).not.toThrow()
  })
  it('rechaza 0', () => {
    expect(() => validarCantidad(0)).toThrow(ErrorDeValidacion)
  })
  it('rechaza negativos', () => {
    expect(() => validarCantidad(-1)).toThrow(ErrorDeValidacion)
  })
  it('rechaza decimales', () => {
    expect(() => validarCantidad(2.5)).toThrow(ErrorDeValidacion)
  })
})

describe('validarNumeroMolde', () => {
  it('acepta barro #1 y #40 (límites del rango)', () => {
    expect(() => validarNumeroMolde('barro', 1)).not.toThrow()
    expect(() => validarNumeroMolde('barro', 40)).not.toThrow()
  })
  it('rechaza barro #0 y #41 (fuera de rango)', () => {
    expect(() => validarNumeroMolde('barro', 0)).toThrow(ErrorDeValidacion)
    expect(() => validarNumeroMolde('barro', 41)).toThrow(ErrorDeValidacion)
  })
  it('acepta madera #1 y #17', () => {
    expect(() => validarNumeroMolde('madera', 1)).not.toThrow()
    expect(() => validarNumeroMolde('madera', 17)).not.toThrow()
  })
  it('rechaza madera #18 (que sí sería válido para barro)', () => {
    expect(() => validarNumeroMolde('madera', 18)).toThrow(ErrorDeValidacion)
  })
  it('no valida rango para subcategorías que no son moldes', () => {
    expect(() => validarNumeroMolde('punta', 999)).not.toThrow()
  })
})
