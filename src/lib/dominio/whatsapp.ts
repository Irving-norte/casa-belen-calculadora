import type { LineaPedido, TipoCliente } from './tipos'
import { formatear } from './dinero'

/**
 * Reproduce EXACTAMENTE el formato que el cliente definió en su
 * documento original (§16), carácter por carácter — incluido el guion
 * largo "—" como separador. No es un formato inventado por la app.
 */
const ETIQUETAS_VELA: Record<string, string> = {
  chica: 'Chicas',
  mediana: 'Medianas',
  grande: 'Grandes',
}

interface GrupoWhatsApp {
  titulo: string
  categoria: LineaPedido['categoria']
  subcategoria: LineaPedido['subcategoria']
}

const GRUPOS: GrupoWhatsApp[] = [
  { titulo: 'Moldes de barro', categoria: 'moldes', subcategoria: 'barro' },
  { titulo: 'Moldes de madera', categoria: 'moldes', subcategoria: 'madera' },
  { titulo: 'Velas de punta', categoria: 'velas', subcategoria: 'punta' },
  { titulo: 'Aromas', categoria: 'aromas', subcategoria: '30ml' },
]

function etiquetaDeLinea(linea: LineaPedido): string {
  if (linea.categoria === 'moldes') return `#${linea.codigo}`
  if (linea.categoria === 'velas') return ETIQUETAS_VELA[linea.codigo] ?? linea.nombreProducto
  // aromas
  return linea.presentacion ? `${linea.nombreProducto} ${linea.presentacion}` : linea.nombreProducto
}

function lineaATexto(linea: LineaPedido): string {
  return `${linea.cantidad} × ${etiquetaDeLinea(linea)} — ${formatear(linea.precioUnitario)} c/u — ${formatear(linea.subtotal)}`
}

export function generarTextoPedido(
  tipoCliente: TipoCliente,
  lineas: LineaPedido[],
  total: number,
): string {
  const etiquetaCliente = tipoCliente === 'alumno' ? 'Alumno' : 'General'
  const bloques: string[] = ['PEDIDO CASA BELÉN', '', `Cliente: ${etiquetaCliente}`]

  for (const grupo of GRUPOS) {
    const items = lineas.filter(
      (l) => l.categoria === grupo.categoria && l.subcategoria === grupo.subcategoria,
    )
    if (items.length === 0) continue
    bloques.push('', grupo.titulo, ...items.map(lineaATexto))
  }

  bloques.push('', `TOTAL: ${formatear(total)}`)
  return bloques.join('\n')
}
