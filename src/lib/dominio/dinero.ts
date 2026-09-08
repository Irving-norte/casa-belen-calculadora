/**
 * Todo el dinero se maneja como ENTEROS en centavos. Nunca decimales.
 * JavaScript no representa exactamente los decimales (0.1 + 0.2 !== 0.3);
 * con centavos enteros ese error es estructuralmente imposible.
 *
 * La UI nunca toca centavos directamente: entra en pesos (lo que la
 * persona escribe) y sale como texto ya formateado.
 */

/** "22" o "22.50" (pesos, como los escribe una persona) → 2250 (centavos) */
export function aCentavos(pesos: string | number): number {
  const texto = String(pesos).trim().replace(',', '.')
  if (texto === '' || Number.isNaN(Number(texto))) {
    throw new Error(`"${pesos}" no es un monto válido`)
  }
  const [enteros = '0', decimales = ''] = texto.split('.')
  const centavosTexto = (decimales + '00').slice(0, 2)
  const signo = enteros.startsWith('-') ? -1 : 1
  const enterosAbs = enteros.replace('-', '') || '0'
  return signo * (Number(enterosAbs) * 100 + Number(centavosTexto))
}

/** 2250 (centavos) → "$22.50" · 2200 → "$22" (sin decimales si son .00) */
const formateador = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatear(centavos: number): string {
  return formateador.format(centavos / 100)
}

export function pesos(centavos: number): number {
  return Math.round(centavos) / 100
}
