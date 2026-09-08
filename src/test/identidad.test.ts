import { describe, expect, it } from 'vitest'
import { crearProductoId } from '../lib/dominio/tipos'
import { CATALOGO_INICIAL } from '../data/catalogo-inicial'

describe('identidad de productos — el número NO es un id global', () => {
  it('molde de barro #1 y molde de madera #1 tienen ids distintos', () => {
    const idBarro = crearProductoId('moldes', 'barro', '1')
    const idMadera = crearProductoId('moldes', 'madera', '1')
    expect(idBarro).not.toBe(idMadera)
  })

  it('barro #1 y madera #1 tienen precios distintos', () => {
    const barro1 = CATALOGO_INICIAL.find((p) => p.id === crearProductoId('moldes', 'barro', '1'))
    const madera1 = CATALOGO_INICIAL.find((p) => p.id === crearProductoId('moldes', 'madera', '1'))
    expect(barro1?.precioGeneral).toBe(25500) // $255
    expect(madera1?.precioGeneral).toBe(37000) // $370
    expect(barro1?.precioGeneral).not.toBe(madera1?.precioGeneral)
  })

  it('el id incluye siempre categoría y subcategoría, nunca solo el código', () => {
    const id = crearProductoId('moldes', 'barro', '12')
    expect(id).toBe('moldes-barro-12')
    expect(id).not.toBe('12')
  })
})
