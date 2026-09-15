import { describe, expect, it } from 'vitest'
import { generarTextoPedido } from '../lib/dominio/whatsapp'
import { crearLineaDesdeProducto, agregarLinea, calcularTotal } from '../lib/dominio/pedido'
import type { Producto } from '../lib/dominio/tipos'

const barro1: Producto = {
  id: 'moldes-barro-1', categoria: 'moldes', subcategoria: 'barro', codigo: '1',
  nombre: 'Molde de barro #1', precioGeneral: 25500, precioAlumno: 22500, orden: 0,
}
const madera5: Producto = {
  id: 'moldes-madera-5', categoria: 'moldes', subcategoria: 'madera', codigo: '5',
  nombre: 'Molde de madera #5', precioGeneral: 35000, precioAlumno: 33000, orden: 1,
}
const velaGrande: Producto = {
  id: 'velas-punta-grande', categoria: 'velas', subcategoria: 'punta', codigo: 'grande',
  nombre: 'Vela de punta grande', precio: 2200, orden: 2,
}
const vanilla: Producto = {
  id: 'aromas-30ml-vanilla', categoria: 'aromas', subcategoria: '30ml', codigo: 'vanilla',
  nombre: 'Vanilla', presentacion: '30 ml', precio: 4800, orden: 3,
}

describe('generarTextoPedido — coincide carácter por carácter con el ejemplo del §16', () => {
  it('reproduce exactamente el pedido de ejemplo del documento del cliente', () => {
    let lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'alumno', 2))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(madera5, 'alumno', 1))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(velaGrande, 'alumno', 10))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(vanilla, 'alumno', 2))

    const texto = generarTextoPedido('alumno', lineas, calcularTotal(lineas))

    const esperado = [
      'PEDIDO CASA BELÉN',
      '',
      'Cliente: Alumno',
      '',
      'Moldes de barro',
      '2 × #1 — $225 c/u — $450',
      '',
      'Moldes de madera',
      '1 × #5 — $330 c/u — $330',
      '',
      'Velas de punta',
      '10 × Grandes — $22 c/u — $220',
      '',
      'Aromas',
      '2 × Vanilla 30 ml — $48 c/u — $96',
      '',
      'TOTAL: $1,096',
    ].join('\n')

    expect(texto).toBe(esperado)
  })
})

describe('generarTextoPedido — casos generales', () => {
  it('usa "General" cuando el tipo de cliente es general', () => {
    const lineas = agregarLinea([], crearLineaDesdeProducto(velaGrande, 'general', 1))
    const texto = generarTextoPedido('general', lineas, calcularTotal(lineas))
    expect(texto).toContain('Cliente: General')
  })

  it('omite las secciones de categorías sin productos', () => {
    const lineas = agregarLinea([], crearLineaDesdeProducto(vanilla, 'alumno', 1))
    const texto = generarTextoPedido('alumno', lineas, calcularTotal(lineas))
    expect(texto).not.toContain('Moldes de barro')
    expect(texto).not.toContain('Velas de punta')
    expect(texto).toContain('Aromas')
  })

  it('un pedido de una sola línea genera el texto mínimo correcto', () => {
    const lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'general', 1))
    const texto = generarTextoPedido('general', lineas, calcularTotal(lineas))
    expect(texto).toBe(
      ['PEDIDO CASA BELÉN', '', 'Cliente: General', '', 'Moldes de barro', '1 × #1 — $255 c/u — $255', '', 'TOTAL: $255'].join('\n'),
    )
  })

  it('las velas usan la etiqueta en plural (Chicas/Medianas/Grandes)', () => {
    const chica: Producto = { id: 'velas-punta-chica', categoria: 'velas', subcategoria: 'punta', codigo: 'chica', nombre: 'Vela de punta chica', precio: 1700, orden: 0 }
    const lineas = agregarLinea([], crearLineaDesdeProducto(chica, 'alumno', 3))
    const texto = generarTextoPedido('alumno', lineas, calcularTotal(lineas))
    expect(texto).toContain('3 × Chicas — $17 c/u — $51')
  })
})
