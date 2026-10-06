import { useEffect, useState } from 'react'
import { guardarTasa, listarTasas } from '../services/api'
import { fecha as formatoFecha, hoy, tasa as formatoTasa } from '../utils/formato'

// Registro de la tasa del dólar: un solo registro por día
export default function TasasDia({ activa }) {
  const [tasas, setTasas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [valor, setValor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [recargar, setRecargar] = useState(0)

  // Recarga al mostrar la pestaña: procesar una factura también puede registrar tasas
  useEffect(() => {
    if (!activa) return
    const controlador = new AbortController()
    setCargando(true)

    listarTasas(controlador.signal)
      .then((datos) => {
        setTasas(datos.tasas)
        setError('')
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false)
      })

    return () => controlador.abort()
  }, [activa, recargar])

  const existente = tasas.find((t) => t.fecha === fecha)

  const enviar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')
    setError('')
    try {
      const respuesta = await guardarTasa(fecha, valor)
      setMensaje(respuesta.mensaje)
      setValor('')
      setRecargar((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="tarjeta">
      <h2>Tasa del día</h2>

      <form className="formulario-tasa" onSubmit={enviar}>
        <label className="campo">
          <span>Fecha</span>
          <input type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        <label className="campo">
          <span>Tasa (Bs por $)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={existente ? formatoTasa(existente.tasa) : 'Ej. 36.50'}
            required
          />
        </label>
        <button type="submit" disabled={guardando || !fecha || !valor}>
          {guardando ? 'Guardando…' : existente ? 'Actualizar' : 'Registrar'}
        </button>
      </form>

      {existente && (
        <p className="vacio nota">
          Ya hay una tasa registrada para este día ({formatoTasa(existente.tasa)} Bs/$). Al guardar se reemplaza.
        </p>
      )}
      {mensaje && <p className="mensaje-exito" role="status">{mensaje}</p>}
      {error && <p className="mensaje-error" role="alert">{error}</p>}

      <h3 className="titulo-historial">Historial</h3>
      {cargando && tasas.length === 0 ? (
        <div className="spinner pequeno-centrado" aria-hidden="true" />
      ) : tasas.length === 0 ? (
        <p className="vacio">Aún no hay tasas registradas.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Tasa (Bs/$)</th>
              </tr>
            </thead>
            <tbody>
              {tasas.map((t) => (
                <tr key={t.id}>
                  <td>{formatoFecha(t.fecha)}</td>
                  <td className="num destacado">{formatoTasa(t.tasa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
