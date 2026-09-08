export default function Ajustes() {
  const conexion = navigator.onLine ? 'Con conexión' : 'Sin conexión'
  const instalada = window.matchMedia('(display-mode: standalone)').matches

  return (
    <section className="rounded-xl bg-white p-4">
      <h2 className="text-[15px] font-medium">Ajustes</h2>
      <p className="mt-1 text-[13px] text-gris-texto">
        Fase 6. Aquí estarán exportar e importar los datos.
      </p>
      <dl className="mt-4 space-y-2 border-t border-linea pt-3 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-gris-texto">Versión</dt>
          <dd>{__VERSION__}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gris-texto">Estado</dt>
          <dd>{conexion}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gris-texto">Modo</dt>
          <dd>{instalada ? 'Instalada' : 'Navegador'}</dd>
        </div>
      </dl>
    </section>
  )
}
