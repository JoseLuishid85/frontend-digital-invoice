import { useEffect, useState } from 'react'
import ModalFactura from './ModalFactura'
import { buscarProductos } from '../services/api'
import { dolares, fecha, moneda } from '../utils/formato'

const MINIMO_CARACTERES = 2
const ESPERA_MS = 300 // Espera tras dejar de escribir antes de buscar

export default function BuscadorProductos() {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null) // { facturaId, detalleId } del modal abierto

  const busqueda = texto.trim()

  // Busca automáticamente mientras se escribe; cancela la petición anterior
  useEffect(() => {
    if (busqueda.length < MINIMO_CARACTERES) {
      setResultado(null)
      setError('')
      setCargando(false)
      return
    }

    const controlador = new AbortController()
    setCargando(true)

    const temporizador = setTimeout(async () => {
      try {
        const datos = await buscarProductos(busqueda, controlador.signal)
        setResultado(datos)
        setError('')
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message)
        setResultado(null)
      } finally {
        if (!controlador.signal.aborted) setCargando(false)
      }
    }, ESPERA_MS)

    return () => {
      clearTimeout(temporizador)
      controlador.abort()
    }
  }, [busqueda])

  const productos = resultado?.productos || []
  const resumen = resultado?.resumen

  return (
    <section className="tarjeta">
      <h2>Buscar productos</h2>

      <div className="campo-busqueda">
        <span className="icono-busqueda" aria-hidden="true">⌕</span>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe el nombre de un producto…"
          aria-label="Buscar productos"
        />
        {cargando && <div className="spinner pequeno" aria-hidden="true" />}
      </div>

      {error && <p className="mensaje-error" role="alert">{error}</p>}

      {busqueda.length < MINIMO_CARACTERES && (
        <p className="vacio ayuda-busqueda">
          Escribe al menos {MINIMO_CARACTERES} caracteres para buscar en los productos de todas tus facturas.
        </p>
      )}

      {resultado && resumen.coincidencias === 0 && (
        <p className="vacio ayuda-busqueda">No se encontraron productos con “{resultado.busqueda}”.</p>
      )}

      {resultado && resumen.coincidencias > 0 && (
        <>
          <dl className="datos-factura resumen-precios">
            <div>
              <dt>Coincidencias</dt>
              <dd>{resumen.coincidencias}</dd>
            </div>
            <div>
              <dt>Precio mínimo</dt>
              <dd>{moneda(resumen.precio_minimo)}</dd>
            </div>
            <div>
              <dt>Precio promedio</dt>
              <dd>{moneda(resumen.precio_promedio)}</dd>
            </div>
            <div>
              <dt>Precio máximo</dt>
              <dd>{moneda(resumen.precio_maximo)}</dd>
            </div>
          </dl>

          {resumen.coincidencias > productos.length && (
            <p className="vacio nota">
              Mostrando los primeros {productos.length}. Escribe algo más específico para afinar.
            </p>
          )}

          <div className="tabla-scroll">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">P. unitario</th>
                  <th className="num">P. dólar</th>
                  <th>Fecha</th>
                  <th><span className="solo-lector">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.descripcion}</td>
                    <td className="num destacado">{moneda(p.precio_unitario)}</td>
                    <td className="num">{dolares(p.precio_unitario_usd)}</td>
                    <td className="sin-salto">{fecha(p.factura?.fecha)}</td>
                    <td>
                      <button
                        type="button"
                        className="secundario boton-pequeno"
                        onClick={() => setSeleccionado({ facturaId: p.factura_id, detalleId: p.id })}
                      >
                        Ver factura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {seleccionado && (
        <ModalFactura
          facturaId={seleccionado.facturaId}
          resaltarDetalleId={seleccionado.detalleId}
          onCerrar={() => setSeleccionado(null)}
        />
      )}
    </section>
  )
}
