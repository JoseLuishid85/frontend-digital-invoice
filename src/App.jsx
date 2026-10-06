import { useState } from 'react'
import ProcesarFactura from './components/ProcesarFactura'
import BuscadorProductos from './components/BuscadorProductos'
import TasasDia from './components/TasasDia'

const PESTANAS = [
  { id: 'procesar', etiqueta: 'Procesar factura' },
  { id: 'buscar', etiqueta: 'Buscar productos' },
  { id: 'tasas', etiqueta: 'Tasa del día' },
]

export default function App() {
  const [pestana, setPestana] = useState('procesar')

  return (
    <div className="contenedor">
      <header className="cabecera">
        <img src="/logo.png" alt="" className="logo" width="56" height="56" />
        <div>
          <h1>Digital Invoice</h1>
          <p>Sube la foto de una factura o ticket y extraemos sus datos automáticamente con IA.</p>
        </div>
      </header>

      <nav className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            className={pestana === p.id ? 'activa' : ''}
            onClick={() => setPestana(p.id)}
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>

      {/* Ambas vistas quedan montadas para no perder lo escrito o procesado al cambiar de pestaña */}
      <main>
        <div hidden={pestana !== 'procesar'}>
          <ProcesarFactura />
        </div>
        <div hidden={pestana !== 'buscar'}>
          <BuscadorProductos />
        </div>
        <div hidden={pestana !== 'tasas'}>
          <TasasDia activa={pestana === 'tasas'} />
        </div>
      </main>
    </div>
  )
}
