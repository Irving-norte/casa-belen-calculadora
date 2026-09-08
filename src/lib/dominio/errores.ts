export class ErrorDeValidacion extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeValidacion'
  }
}

export class PrecioNoDisponibleError extends Error {
  constructor(productoId: string, tipoCliente: string) {
    super(`No hay precio "${tipoCliente}" definido para el producto "${productoId}"`)
    this.name = 'PrecioNoDisponibleError'
  }
}
