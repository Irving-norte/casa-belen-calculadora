import { NavLink, Route, Routes } from 'react-router-dom'
import Calculadora from './pantallas/Calculadora'
import Historial from './pantallas/Historial'
import DetallePedido from './pantallas/DetallePedido'
import Catalogo from './pantallas/Catalogo'
import Ajustes from './pantallas/Ajustes'
import AvisoActualizacion from './AvisoActualizacion'

const NAV = [
  { a: '/', texto: 'Calculadora' },
  { a: '/historial', texto: 'Historial' },
  { a: '/catalogo', texto: 'Catálogo' },
  { a: '/ajustes', texto: 'Ajustes' },
]

export default function App() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <img src={`${import.meta.env.BASE_URL}icons/marca.png`} alt="" className="h-8 w-auto" />
        <div>
          <p className="text-[11px] tracking-[0.14em] text-gris-texto">CASA BELÉN</p>
          <h1 className="text-base font-medium leading-tight">Calculadora de pedidos</h1>
        </div>
      </header>

      <AvisoActualizacion />

      <main className="flex-1 px-4 pb-28">
        <Routes>
          <Route path="/" element={<Calculadora />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/pedido/:id" element={<DetallePedido />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Calculadora />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 grid h-16 grid-cols-4 border-t border-linea bg-beige pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ a, texto }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            className={({ isActive }) =>
              'flex items-center justify-center text-center text-[13px] ' +
              (isActive ? 'font-medium text-salvia-fuerte' : 'text-gris-texto')
            }
          >
            {texto}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
