import { describe, expect, it } from 'vitest'
import { CATALOGO_INICIAL } from '../data/catalogo-inicial'

/**
 * Transcripción INDEPENDIENTE de la tabla de precios que dio el cliente.
 * A propósito NO se comparte código con `catalogo-inicial.ts`: si hay un
 * dedazo en cualquiera de los dos archivos, este test lo revela. Comparar
 * un archivo consigo mismo no prueba nada.
 */
const BARRO_ESPERADO: Record<number, [number, number]> = {
  1: [255, 225], 2: [205, 185], 3: [195, 175], 4: [225, 185], 5: [245, 215],
  6: [430, 390], 7: [270, 240], 8: [245, 215], 9: [290, 260], 10: [270, 240],
  11: [430, 390], 12: [210, 190], 13: [275, 245], 14: [175, 145], 15: [205, 175],
  16: [235, 205], 17: [120, 95], 18: [105, 75], 19: [135, 105], 20: [190, 170],
  21: [230, 190], 22: [170, 140], 23: [205, 175], 24: [120, 95], 25: [120, 95],
  26: [95, 65], 27: [230, 190], 28: [290, 270], 29: [230, 190], 30: [290, 270],
  31: [145, 110], 32: [145, 110], 33: [165, 135], 34: [135, 95], 35: [195, 165],
  36: [165, 145], 37: [290, 260], 38: [75, 55], 39: [75, 55], 40: [105, 85],
}

const MADERA_ESPERADO: Record<number, [number, number]> = {
  1: [370, 340], 2: [320, 290], 3: [290, 260], 4: [290, 260], 5: [350, 330],
  6: [370, 340], 7: [260, 230], 8: [275, 245], 9: [190, 160], 10: [270, 240],
  11: [210, 180], 12: [360, 330], 13: [260, 230], 14: [270, 240], 15: [250, 220],
  16: [260, 230], 17: [230, 200],
}

const VELAS_ESPERADO = { chica: 17, mediana: 19, grande: 22 }

const AROMAS_ESPERADO: Record<string, number> = {
  Vanilla: 48, Sándalo: 55, Bebé: 47, Copal: 45, Pino: 40, 'Manzana Canela': 39,
  Eucalipto: 48, Canela: 40, Cereza: 39, Naranja: 43, Armonía: 60, Lavanda: 39,
  'Blue Berry': 40, Jazmín: 37, Bergamota: 47, Citronela: 49, 'Café Moka': 38,
  Fresa: 42, Chocolate: 58, 'Chicle frutal': 41, 'Rosa de Castilla': 41,
  'Palo Santo': 55, Miel: 47, Coco: 46, 'Pay de Manzana': 44, Hierbabuena: 55,
  Cítricos: 55, Mandarina: 57, Champagne: 53, 'Frutos Rojos': 62, Rosas: 39,
  'Dulce de Cereza': 47, Nardo: 48, Acaí: 57,
}

describe('catálogo dorado — inventario', () => {
  it('tiene exactamente 94 productos', () => {
    expect(CATALOGO_INICIAL).toHaveLength(94)
  })

  it('tiene 3 velas, 40 moldes de barro, 17 de madera y 34 aromas', () => {
    const contar = (cat: string, sub: string) =>
      CATALOGO_INICIAL.filter((p) => p.categoria === cat && p.subcategoria === sub).length
    expect(contar('velas', 'punta')).toBe(3)
    expect(contar('moldes', 'barro')).toBe(40)
    expect(contar('moldes', 'madera')).toBe(17)
    expect(contar('aromas', '30ml')).toBe(34)
  })

  it('no tiene ids duplicados', () => {
    const ids = CATALOGO_INICIAL.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('catálogo dorado — velas', () => {
  for (const [codigo, pesos] of Object.entries(VELAS_ESPERADO)) {
    it(`vela ${codigo} = $${pesos}`, () => {
      const producto = CATALOGO_INICIAL.find(
        (p) => p.categoria === 'velas' && p.codigo === codigo,
      )
      expect(producto?.precio).toBe(pesos * 100)
    })
  }
})

describe('catálogo dorado — moldes de barro (#1–#40)', () => {
  for (const [numero, [general, alumno]] of Object.entries(BARRO_ESPERADO)) {
    it(`barro #${numero}: general $${general} / alumno $${alumno}`, () => {
      const producto = CATALOGO_INICIAL.find(
        (p) => p.categoria === 'moldes' && p.subcategoria === 'barro' && p.codigo === numero,
      )
      expect(producto?.precioGeneral).toBe(general * 100)
      expect(producto?.precioAlumno).toBe(alumno * 100)
    })
  }
})

describe('catálogo dorado — moldes de madera (#1–#17)', () => {
  for (const [numero, [general, alumno]] of Object.entries(MADERA_ESPERADO)) {
    it(`madera #${numero}: general $${general} / alumno $${alumno}`, () => {
      const producto = CATALOGO_INICIAL.find(
        (p) => p.categoria === 'moldes' && p.subcategoria === 'madera' && p.codigo === numero,
      )
      expect(producto?.precioGeneral).toBe(general * 100)
      expect(producto?.precioAlumno).toBe(alumno * 100)
    })
  }
})

describe('catálogo dorado — aromas 30 ml', () => {
  it('tiene los 34 aromas con su precio correcto', () => {
    for (const [nombre, pesos] of Object.entries(AROMAS_ESPERADO)) {
      const producto = CATALOGO_INICIAL.find(
        (p) => p.categoria === 'aromas' && p.nombre === nombre,
      )
      expect(producto, `falta el aroma "${nombre}"`).toBeDefined()
      expect(producto?.precio, `precio de "${nombre}"`).toBe(pesos * 100)
      expect(producto?.presentacion).toBe('30 ml')
    }
  })
})
