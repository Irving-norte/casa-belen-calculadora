import { useState } from 'react'
import { generarTextoPedido } from '../dominio/whatsapp'
import { copiarAlPortapapeles } from '../utilNavegador'
import type { LineaPedido, TipoCliente } from '../dominio/tipos'

/**
 * Encapsula el botón de "Copiar" + su feedback, para no duplicar la
 * lógica entre la Calculadora (antes de guardar) y el Detalle de un
 * pedido ya guardado (para reenviarlo).
 */
export function useCopiarPedido() {
  const [estado, setEstado] = useState<'inactivo' | 'copiado' | 'manual'>('inactivo')

  async function copiar(tipoCliente: TipoCliente, lineas: LineaPedido[], total: number) {
    const texto = generarTextoPedido(tipoCliente, lineas, total)
    const exito = await copiarAlPortapapeles(texto)
    if (exito) {
      setEstado('copiado')
      setTimeout(() => setEstado('inactivo'), 2500)
    } else {
      // Sin soporte de portapapeles: se ofrece el texto seleccionable a mano.
      window.prompt('Copia el texto manualmente:', texto)
      setEstado('manual')
    }
  }

  return { estado, copiar }
}
