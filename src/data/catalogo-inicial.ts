import type { Producto } from '../lib/dominio/tipos'
import { crearProductoId } from '../lib/dominio/tipos'

let orden = 0
const siguienteOrden = () => orden++

// ---------------- Velas de punta ----------------
const velas: Producto[] = [
  { codigo: 'chica', nombre: 'Vela de punta chica', precio: 1700 },
  { codigo: 'mediana', nombre: 'Vela de punta mediana', precio: 1900 },
  { codigo: 'grande', nombre: 'Vela de punta grande', precio: 2200 },
].map((v) => ({
  id: crearProductoId('velas', 'punta', v.codigo),
  categoria: 'velas' as const,
  subcategoria: 'punta' as const,
  codigo: v.codigo,
  nombre: v.nombre,
  precio: v.precio,
  orden: siguienteOrden(),
}))

// ---------------- Moldes de barro (#1–#40): [general, alumno] en pesos ----------------
const TARIFAS_BARRO: [number, number][] = [
  [255, 225], [205, 185], [195, 175], [225, 185], [245, 215],
  [430, 390], [270, 240], [245, 215], [290, 260], [270, 240],
  [430, 390], [210, 190], [275, 245], [175, 145], [205, 175],
  [235, 205], [120, 95], [105, 75], [135, 105], [190, 170],
  [230, 190], [170, 140], [205, 175], [120, 95], [120, 95],
  [95, 65], [230, 190], [290, 270], [230, 190], [290, 270],
  [145, 110], [145, 110], [165, 135], [135, 95], [195, 165],
  [165, 145], [290, 260], [75, 55], [75, 55], [105, 85],
]

const moldesBarro: Producto[] = TARIFAS_BARRO.map(([general, alumno], i) => {
  const numero = i + 1
  return {
    id: crearProductoId('moldes', 'barro', String(numero)),
    categoria: 'moldes' as const,
    subcategoria: 'barro' as const,
    codigo: String(numero),
    nombre: `Molde de barro #${numero}`,
    precioGeneral: general * 100,
    precioAlumno: alumno * 100,
    orden: siguienteOrden(),
  }
})

// ---------------- Moldes de madera (#1–#17): [general, alumno] en pesos ----------------
const TARIFAS_MADERA: [number, number][] = [
  [370, 340], [320, 290], [290, 260], [290, 260], [350, 330],
  [370, 340], [260, 230], [275, 245], [190, 160], [270, 240],
  [210, 180], [360, 330], [260, 230], [270, 240], [250, 220],
  [260, 230], [230, 200],
]

const moldesMadera: Producto[] = TARIFAS_MADERA.map(([general, alumno], i) => {
  const numero = i + 1
  return {
    id: crearProductoId('moldes', 'madera', String(numero)),
    categoria: 'moldes' as const,
    subcategoria: 'madera' as const,
    codigo: String(numero),
    nombre: `Molde de madera #${numero}`,
    precioGeneral: general * 100,
    precioAlumno: alumno * 100,
    orden: siguienteOrden(),
  }
})

// ---------------- Aromas / Esencias, 30 ml: [nombre, precio en pesos] ----------------
const TARIFAS_AROMAS: [string, number][] = [
  ['Vanilla', 48], ['Sándalo', 55], ['Bebé', 47], ['Copal', 45],
  ['Pino', 40], ['Manzana Canela', 39], ['Eucalipto', 48], ['Canela', 40],
  ['Cereza', 39], ['Naranja', 43], ['Armonía', 60], ['Lavanda', 39],
  ['Blue Berry', 40], ['Jazmín', 37], ['Bergamota', 47], ['Citronela', 49],
  ['Café Moka', 38], ['Fresa', 42], ['Chocolate', 58], ['Chicle frutal', 41],
  ['Rosa de Castilla', 41], ['Palo Santo', 55], ['Miel', 47], ['Coco', 46],
  ['Pay de Manzana', 44], ['Hierbabuena', 55], ['Cítricos', 55], ['Mandarina', 57],
  ['Champagne', 53], ['Frutos Rojos', 62], ['Rosas', 39], ['Dulce de Cereza', 47],
  ['Nardo', 48], ['Acaí', 57],
]

function slugificar(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const aromas: Producto[] = TARIFAS_AROMAS.map(([nombre, precio]) => ({
  id: crearProductoId('aromas', '30ml', slugificar(nombre)),
  categoria: 'aromas' as const,
  subcategoria: '30ml' as const,
  codigo: slugificar(nombre),
  nombre,
  presentacion: '30 ml',
  precio: precio * 100,
  orden: siguienteOrden(),
}))

export const CATALOGO_INICIAL: Producto[] = [...velas, ...moldesBarro, ...moldesMadera, ...aromas]

export const SEED_VERSION = 1
