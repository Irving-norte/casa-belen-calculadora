export function descargarArchivo(nombre: string, contenido: string, tipoMime: string): void {
  const blob = new Blob([contenido], { type: tipoMime })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

export function leerArchivoComoTexto(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result ?? ''))
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.readAsText(archivo, 'utf-8')
  })
}

/**
 * Intenta copiar al portapapeles con la API moderna. Si falla (navegador
 * sin soporte, permiso denegado, contexto no seguro), regresa `false` para
 * que quien llama pueda ofrecer una alternativa — por ejemplo un cuadro de
 * texto seleccionable con `window.prompt`.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}
