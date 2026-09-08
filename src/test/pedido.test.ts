import { describe, expect, it } from 'vitest'
import {
  crearLineaDesdeProducto,
  agregarLinea,
  cambiarCantidad,
  eliminarLinea,
  calcularTotal,
  recalcularPreciosPorTipoCliente,
  validarPedidoNoVacio,
} from '../lib/dominio/pedido'
import { ErrorDeValidacion } from '../lib/dominio/errores'
import type { Producto } from '../lib/dominio/tipos'

function molde(codigo: string, general: number, alumno: number): Producto {
  return {
    id: `moldes-barro-${codigo}`, categoria: 'moldes', subcategoria: 'barro', codigo,
    nombre: `Molde de barro #${codigo}`, precioGeneral: general, precioAlumno: alumno, orden: 0,
  }
}

describe('crearLineaDesdeProducto — congelación del precio', () => {
  it('2 × molde alumno a $225 = $450 (ejemplo del cliente, §4)', () => {
    const producto = molde('1', 25500, 22500)
    const linea = crearLineaDesdeProducto(producto, 'alumno', 2)
    expect(linea.precioUnitario).toBe(22500)
    expect(linea.subtotal).toBe(45000)
  })

  it('el mismo molde para GENERAL da $510, no $450 (§4)', () => {
    const producto = molde('1', 25500, 22500)
    const linea = crearLineaDesdeProducto(producto, 'general', 2)
    expect(linea.precioUnitario).toBe(25500)
    expect(linea.subtotal).toBe(51000)
  })

  it('rechaza cantidad 0', () => {
    const producto = molde('1', 25500, 22500)
    expect(() => crearLineaDesdeProducto(producto, 'alumno', 0)).toThrow(ErrorDeValidacion)
  })

  it('rechaza cantidad negativa', () => {
    const producto = molde('1', 25500, 22500)
    expect(() => crearLineaDesdeProducto(producto, 'alumno', -3)).toThrow(ErrorDeValidacion)
  })
})

describe('agregarLinea', () => {
  it('agregar el mismo producto dos veces suma cantidades, no duplica filas', () => {
    const producto = molde('12', 21000, 19000)
    let lineas = agregarLinea([], crearLineaDesdeProducto(producto, 'alumno', 2))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(producto, 'alumno', 1))
    expect(lineas).toHaveLength(1)
    expect(lineas[0]?.cantidad).toBe(3)
    expect(lineas[0]?.subtotal).toBe(19000 * 3)
  })
})

describe('cambiarCantidad y eliminarLinea', () => {
  it('cambiar cantidad recalcula el subtotal sin tocar el precio unitario', () => {
    const producto = molde('1', 25500, 22500)
    let lineas = agregarLinea([], crearLineaDesdeProducto(producto, 'alumno', 2))
    lineas = cambiarCantidad(lineas, producto.id, 5)
    expect(lineas[0]?.precioUnitario).toBe(22500) // no cambia
    expect(lineas[0]?.subtotal).toBe(22500 * 5)
  })

  it('eliminar una línea la quita del borrador', () => {
    const producto = molde('1', 25500, 22500)
    let lineas = agregarLinea([], crearLineaDesdeProducto(producto, 'alumno', 2))
    lineas = eliminarLinea(lineas, producto.id)
    expect(lineas).toHaveLength(0)
  })
})

describe('calcularTotal — pedido mixto del documento del cliente (§26)', () => {
  it('2 barro + 1 madera + 10 velas + 2 aromas = $1,096', () => {
    const barro1: Producto = {
      id: 'moldes-barro-1', categoria: 'moldes', subcategoria: 'barro', codigo: '1',
      nombre: 'Molde de barro #1', precioGeneral: 25500, precioAlumno: 22500, orden: 0,
    }
    const madera5: Producto = {
      id: 'moldes-madera-5', categoria: 'moldes', subcategoria: 'madera', codigo: '5',
      nombre: 'Molde de madera #5', precioGeneral: 35000, precioAlumno: 33000, orden: 0,
    }
    const velaGrande: Producto = {
      id: 'velas-punta-grande', categoria: 'velas', subcategoria: 'punta', codigo: 'grande',
      nombre: 'Vela de punta grande', precio: 2200, orden: 0,
    }
    const vanilla: Producto = {
      id: 'aromas-30ml-vanilla', categoria: 'aromas', subcategoria: '30ml', codigo: 'vanilla',
      nombre: 'Vanilla', presentacion: '30 ml', precio: 4800, orden: 0,
    }

    let lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'alumno', 2)) // $450
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(madera5, 'alumno', 1)) // $330
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(velaGrande, 'alumno', 10)) // $220
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(vanilla, 'alumno', 2)) // $96

    expect(calcularTotal(lineas)).toBe(109600) // $1,096.00 en centavos
  })
})

describe('recalcularPreciosPorTipoCliente — cambiar de tipo de cliente en un borrador sin guardar', () => {
  const barro1: Producto = {
    id: 'moldes-barro-1', categoria: 'moldes', subcategoria: 'barro', codigo: '1',
    nombre: 'Molde de barro #1', precioGeneral: 25500, precioAlumno: 22500, orden: 0,
  }
  const velaChica: Producto = {
    id: 'velas-punta-chica', categoria: 'velas', subcategoria: 'punta', codigo: 'chica',
    nombre: 'Vela de punta chica', precio: 1700, orden: 0,
  }
  const catalogo = [barro1, velaChica]

  it('ajusta un molde ya agregado al cambiar de Alumno a General (el bug reportado)', () => {
    let lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'alumno', 2)) // $225 c/u
    lineas = recalcularPreciosPorTipoCliente(lineas, catalogo, 'general')

    expect(lineas[0]?.precioUnitario).toBe(25500) // ahora $255
    expect(lineas[0]?.subtotal).toBe(51000)
  })

  it('no toca velas ni aromas: su precio no depende del tipo de cliente', () => {
    let lineas = agregarLinea([], crearLineaDesdeProducto(velaChica, 'alumno', 3))
    lineas = recalcularPreciosPorTipoCliente(lineas, catalogo, 'general')

    expect(lineas[0]?.precioUnitario).toBe(1700) // sin cambio
  })

  it('recalcula varias líneas mixtas a la vez', () => {
    let lineas = agregarLinea([], crearLineaDesdeProducto(barro1, 'alumno', 1))
    lineas = agregarLinea(lineas, crearLineaDesdeProducto(velaChica, 'alumno', 5))
    lineas = recalcularPreciosPorTipoCliente(lineas, catalogo, 'general')

    expect(lineas.find((l) => l.productoId === barro1.id)?.precioUnitario).toBe(25500)
    expect(lineas.find((l) => l.productoId === velaChica.id)?.precioUnitario).toBe(1700)
  })
})

describe('validarPedidoNoVacio', () => {
  it('rechaza guardar un pedido sin líneas', () => {
    expect(() => validarPedidoNoVacio([])).toThrow(ErrorDeValidacion)
  })
  it('permite un pedido con al menos una línea', () => {
    expect(() => validarPedidoNoVacio([{} as never])).not.toThrow()
  })
})
