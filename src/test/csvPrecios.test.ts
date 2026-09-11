import { describe, expect, it } from 'vitest'
import { construirCSVDePrecios, parsearCSV, analizarCSVDePrecios } from '../lib/dominio/csvPrecios'
import type { Producto } from '../lib/dominio/tipos'

const barro12: Producto = {
  id: 'moldes-barro-12', categoria: 'moldes', subcategoria: 'barro', codigo: '12',
  nombre: 'Molde de barro #12', precioGeneral: 21000, precioAlumno: 19000, orden: 0,
}
const barro13: Producto = {
  id: 'moldes-barro-13', categoria: 'moldes', subcategoria: 'barro', codigo: '13',
  nombre: 'Molde de barro #13', precioGeneral: 27500, precioAlumno: 24500, orden: 1,
}
const velaChica: Producto = {
  id: 'velas-punta-chica', categoria: 'velas', subcategoria: 'punta', codigo: 'chica',
  nombre: 'Vela de punta chica', precio: 1700, orden: 2,
}
const catalogo = [barro12, barro13, velaChica]

describe('construirCSVDePrecios', () => {
  it('trae encabezado y una fila por producto, con pesos (no centavos)', () => {
    const csv = construirCSVDePrecios(catalogo)
    const lineas = csv.replace(/^\uFEFF/, '').trim().split('\r\n')
    expect(lineas[0]).toBe('id,categoria,subcategoria,codigo,nombre,precio,precioGeneral,precioAlumno')
    expect(lineas).toHaveLength(4) // encabezado + 3 productos
    expect(lineas[1]).toContain('210') // $210 general de barro #12, en pesos
  })

  it('incluye el BOM UTF-8 para que Excel muestre bien los acentos', () => {
    const csv = construirCSVDePrecios(catalogo)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('deja vacías las columnas que no aplican a cada producto', () => {
    const csv = construirCSVDePrecios([velaChica])
    const [, fila] = csv.replace(/^\uFEFF/, '').trim().split('\r\n')
    const columnas = fila!.split(',')
    expect(columnas[5]).toBe('17') // precio
    expect(columnas[6]).toBe('') // precioGeneral vacío
    expect(columnas[7]).toBe('') // precioAlumno vacío
  })
})

describe('parsearCSV', () => {
  it('separa filas y columnas simples', () => {
    const filas = parsearCSV('a,b,c\n1,2,3')
    expect(filas).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('respeta comas dentro de celdas citadas', () => {
    const filas = parsearCSV('id,nombre\n1,"Rosa, de Castilla"')
    expect(filas[1]).toEqual(['1', 'Rosa, de Castilla'])
  })

  it('ignora líneas completamente vacías', () => {
    const filas = parsearCSV('a,b\n\n1,2\n')
    expect(filas).toEqual([['a', 'b'], ['1', '2']])
  })
})

describe('analizarCSVDePrecios — el escenario exacto del ticket', () => {
  it('actualiza barro #12 y reporta un error en #13 sin detener el resto', () => {
    const csv = [
      'id,categoria,subcategoria,codigo,nombre,precio,precioGeneral,precioAlumno',
      `${barro12.id},moldes,barro,12,Molde de barro #12,,220,190`, // cambia general 210→220
      `${barro13.id},moldes,barro,13,Molde de barro #13,,abc,245`, // precio inválido
    ].join('\n')

    const resultado = analizarCSVDePrecios(csv, catalogo)

    expect(resultado.actualizaciones).toHaveLength(1)
    expect(resultado.actualizaciones[0]).toMatchObject({
      id: barro12.id,
      cambios: { precioGeneral: 22000 }, // precioAlumno no cambió (seguía en $190), no se reporta
    })

    expect(resultado.errores).toHaveLength(1)
    expect(resultado.errores[0]?.motivo).toContain('Molde de barro #13')
  })
})

describe('analizarCSVDePrecios — casos generales', () => {
  it('reporta un id que no existe en el catálogo, sin tumbar el resto', () => {
    const csv = [
      'id,precio,precioGeneral,precioAlumno',
      'id-inventado,,999,888',
      `${velaChica.id},20,,`,
    ].join('\n')

    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.errores).toHaveLength(1)
    expect(resultado.errores[0]?.motivo).toContain('no existe en el catálogo')
    expect(resultado.actualizaciones).toHaveLength(1)
    expect(resultado.actualizaciones[0]?.cambios.precio).toBe(2000)
  })

  it('rechaza un precio negativo', () => {
    const csv = ['id,precio', `${velaChica.id},-5`].join('\n')
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.errores).toHaveLength(1)
    expect(resultado.actualizaciones).toHaveLength(0)
  })

  it('una fila con todas las celdas de precio vacías se ignora sin marcarse como error', () => {
    const csv = ['id,precio,precioGeneral,precioAlumno', `${barro12.id},,,`].join('\n')
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.actualizaciones).toHaveLength(0)
  })

  it('permite cambiar solo una de las dos tarifas de un molde', () => {
    const csv = ['id,precioGeneral,precioAlumno', `${barro12.id},225,`].join('\n')
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.actualizaciones[0]?.cambios).toEqual({ precioGeneral: 22500 })
  })

  it('reporta un archivo sin columna "id"', () => {
    const csv = ['nombre,precio', 'X,20'].join('\n')
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.errores[0]?.motivo).toContain('id')
    expect(resultado.actualizaciones).toHaveLength(0)
  })

  it('nunca puede agregar o quitar productos, solo cambia precios de los existentes', () => {
    const csv = ['id,precio', 'producto-que-no-existe,20'].join('\n')
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.actualizaciones).toHaveLength(0)
    expect(resultado.errores).toHaveLength(1)
  })
})

describe('round-trip: exportar el catálogo y volver a analizarlo sin cambios reales', () => {
  it('no genera ninguna actualización si no se tocó nada', () => {
    const csv = construirCSVDePrecios(catalogo)
    const resultado = analizarCSVDePrecios(csv, catalogo)
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.actualizaciones).toHaveLength(0) // mismos precios, nada que actualizar
  })
})
