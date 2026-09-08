// ---------- Identidad ----------
export type Categoria = 'velas' | 'moldes' | 'aromas'
export type Subcategoria = 'punta' | 'barro' | 'madera' | '30ml'
export type TipoCliente = 'general' | 'alumno'

/**
 * ID determinístico y legible: `${categoria}-${subcategoria}-${codigo}`
 *   moldes-barro-1
 *   moldes-madera-1     ← distinto del anterior, por construcción
 *   velas-punta-grande
 *   aromas-30ml-vanilla
 * El número NUNCA se usa solo, sin categoría, como identificador.
 */
export type ProductoId = string

export function crearProductoId(
  categoria: Categoria,
  subcategoria: Subcategoria,
  codigo: string,
): ProductoId {
  return `${categoria}-${subcategoria}-${codigo}`
}

// ---------- Producto (catálogo, mutable) ----------
export interface Producto {
  id: ProductoId
  categoria: Categoria
  subcategoria: Subcategoria
  codigo: string // "1", "grande", "vanilla"
  nombre: string // "Molde de barro #1"
  presentacion?: string // solo aromas: "30 ml"

  // Exactamente uno de los dos esquemas de precio está presente:
  precio?: number // centavos — velas y aromas
  precioGeneral?: number // centavos — moldes
  precioAlumno?: number // centavos — moldes

  orden: number // orden de aparición en pantalla
}

// ---------- Pedido (histórico) ----------
export interface LineaPedido {
  productoId: ProductoId
  nombreProducto: string // congelado
  categoria: Categoria // congelado
  subcategoria: Subcategoria
  codigo: string
  presentacion?: string
  cantidad: number // entero ≥ 1
  precioUnitario: number // centavos — CONGELADO al agregar la línea
  subtotal: number // centavos = precioUnitario * cantidad
}

export interface Pedido {
  id: string // crypto.randomUUID()
  creadoEn: number // Date.now()
  editadoEn?: number // presente solo si se editó después de guardar
  tipoCliente: TipoCliente // fijo: no se puede cambiar tras guardar
  lineas: LineaPedido[]
  total: number // centavos
  notas?: string
  versionCatalogo: number // trazabilidad de qué tarifa estaba vigente
  versionApp: string
}
