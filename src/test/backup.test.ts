import { describe, expect, it } from 'vitest'
import { construirBackup, leerBackup } from '../lib/dominio/backup'
import { ErrorDeValidacion } from '../lib/dominio/errores'
import type { Pedido, Producto } from '../lib/dominio/tipos'

const barro1: Producto = {
  id: 'moldes-barro-1', categoria: 'moldes', subcategoria: 'barro', codigo: '1',
  nombre: 'Molde de barro #1', precioGeneral: 25500, precioAlumno: 22500, orden: 0,
}
const vanilla: Producto = {
  id: 'aromas-30ml-vanilla', categoria: 'aromas', subcategoria: '30ml', codigo: 'vanilla',
  nombre: 'Vanilla', presentacion: '30 ml', precio: 4800, orden: 1,
}
const pedidoEjemplo: Pedido = {
  id: 'pedido-1', creadoEn: 1700000000000, tipoCliente: 'alumno',
  lineas: [
    {
      productoId: barro1.id, nombreProducto: barro1.nombre, categoria: 'moldes',
      subcategoria: 'barro', codigo: '1', cantidad: 2, precioUnitario: 22500, subtotal: 45000,
    },
  ],
  total: 45000, versionCatalogo: 1, versionApp: '0.5.0',
}

describe('construirBackup — centavos internos → pesos en el archivo', () => {
  it('convierte los precios de productos a pesos', () => {
    const backup = construirBackup({
      productos: [barro1, vanilla], pedidos: [], versionApp: '0.5.0', versionCatalogo: 1,
    })
    const b1 = backup.productos.find((p) => p.id === barro1.id)
    expect(b1?.precioGeneral).toBe(255)
    expect(b1?.precioAlumno).toBe(225)
    const van = backup.productos.find((p) => p.id === vanilla.id)
    expect(van?.precio).toBe(48)
  })

  it('convierte los precios de pedidos a pesos', () => {
    const backup = construirBackup({
      productos: [], pedidos: [pedidoEjemplo], versionApp: '0.5.0', versionCatalogo: 1,
    })
    expect(backup.pedidos[0]?.total).toBe(450)
    expect(backup.pedidos[0]?.lineas[0]?.precioUnitario).toBe(225)
  })
})

describe('round-trip: exportar y volver a leer debe dar el mismo resultado', () => {
  it('productos van y vuelven idénticos', () => {
    const backup = construirBackup({
      productos: [barro1, vanilla], pedidos: [], versionApp: '0.5.0', versionCatalogo: 1,
    })
    const { productos } = leerBackup(backup)
    expect(productos).toEqual([barro1, vanilla])
  })

  it('pedidos van y vuelven idénticos', () => {
    const backup = construirBackup({
      productos: [], pedidos: [pedidoEjemplo], versionApp: '0.5.0', versionCatalogo: 1,
    })
    const { pedidos } = leerBackup(backup)
    expect(pedidos).toEqual([pedidoEjemplo])
  })
})

describe('leerBackup — rechazo de archivos inválidos', () => {
  it('rechaza algo que no es un objeto', () => {
    expect(() => leerBackup('esto no es un objeto')).toThrow(ErrorDeValidacion)
    expect(() => leerBackup(null)).toThrow(ErrorDeValidacion)
    expect(() => leerBackup([1, 2, 3])).toThrow(ErrorDeValidacion)
  })

  it('rechaza una versión no soportada', () => {
    expect(() => leerBackup({ version: 99, productos: [], pedidos: [] })).toThrow(ErrorDeValidacion)
  })

  it('rechaza si falta el arreglo de productos', () => {
    expect(() => leerBackup({ version: 1, pedidos: [] })).toThrow(ErrorDeValidacion)
  })

  it('rechaza un producto sin categoría válida', () => {
    const malo = {
      version: 1, productos: [{ id: 'x', categoria: 'inventada', subcategoria: 'barro', codigo: '1', nombre: 'X', precio: 10, orden: 0 }],
      pedidos: [],
    }
    expect(() => leerBackup(malo)).toThrow(ErrorDeValidacion)
  })

  it('rechaza un producto sin ningún precio', () => {
    const malo = {
      version: 1,
      productos: [{ id: 'x', categoria: 'velas', subcategoria: 'punta', codigo: 'chica', nombre: 'X', orden: 0 }],
      pedidos: [],
    }
    expect(() => leerBackup(malo)).toThrow(ErrorDeValidacion)
  })

  it('rechaza ids de producto duplicados', () => {
    const dup = { ...barro1 }
    const backup = construirBackup({ productos: [barro1, dup], pedidos: [], versionApp: '1', versionCatalogo: 1 })
    expect(() => leerBackup(backup)).toThrow(ErrorDeValidacion)
  })

  it('rechaza un pedido sin líneas', () => {
    const malo = {
      version: 1, productos: [],
      pedidos: [{ id: 'p', creadoEn: 1, tipoCliente: 'alumno', lineas: [], total: 0, versionCatalogo: 1, versionApp: '1' }],
    }
    expect(() => leerBackup(malo)).toThrow(ErrorDeValidacion)
  })

  it('rechaza un pedido cuyo total no cuadra con sus líneas', () => {
    const malo = {
      version: 1, productos: [],
      pedidos: [{
        id: 'p', creadoEn: 1, tipoCliente: 'alumno', versionCatalogo: 1, versionApp: '1',
        total: 999, // no coincide
        lineas: [{
          productoId: 'x', nombreProducto: 'X', categoria: 'velas', subcategoria: 'punta',
          codigo: 'chica', cantidad: 1, precioUnitario: 17, subtotal: 17,
        }],
      }],
    }
    expect(() => leerBackup(malo)).toThrow(ErrorDeValidacion)
  })

  it('rechaza un tipoCliente desconocido', () => {
    const malo = {
      version: 1, productos: [],
      pedidos: [{
        id: 'p', creadoEn: 1, tipoCliente: 'vip', versionCatalogo: 1, versionApp: '1', total: 17,
        lineas: [{ productoId: 'x', nombreProducto: 'X', categoria: 'velas', subcategoria: 'punta', codigo: 'chica', cantidad: 1, precioUnitario: 17, subtotal: 17 }],
      }],
    }
    expect(() => leerBackup(malo)).toThrow(ErrorDeValidacion)
  })

  it('rechaza un objeto vacío sin explotar de forma rara', () => {
    expect(() => leerBackup({})).toThrow(ErrorDeValidacion)
  })
})
