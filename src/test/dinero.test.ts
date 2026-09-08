import { describe, expect, it } from 'vitest'
import { aCentavos, formatear, pesos } from '../lib/dominio/dinero'

describe('dinero — conversión pesos ↔ centavos', () => {
  it('convierte enteros', () => {
    expect(aCentavos('22')).toBe(2200)
    expect(aCentavos(22)).toBe(2200)
  })

  it('convierte decimales', () => {
    expect(aCentavos('22.50')).toBe(2250)
    expect(aCentavos('22.5')).toBe(2250)
  })

  it('nunca produce el error de flotantes de JavaScript', () => {
    // 0.1 + 0.2 en pesos-flotante daría 0.30000000000000004
    const a = aCentavos('0.10')
    const b = aCentavos('0.20')
    expect(a + b).toBe(30) // 30 centavos, exacto
  })

  it('rechaza texto inválido', () => {
    expect(() => aCentavos('abc')).toThrow()
    expect(() => aCentavos('')).toThrow()
  })

  it('formatea de vuelta a pesos', () => {
    expect(formatear(2200)).toContain('22')
    expect(pesos(2250)).toBe(22.5)
  })
})
