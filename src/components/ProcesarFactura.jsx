import { useState } from 'react'
import SubirFactura from './SubirFactura'
import ResultadoFactura from './ResultadoFactura'
import { procesarFactura } from '../services/api'

export default function ProcesarFactura() {
  const [factura, setFactura] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [formulario, setFormulario] = useState(0) // Cambiarlo remonta SubirFactura vacío

  const manejarProcesar = async (archivo, opciones) => {
    setCargando(true)
    setError('')
    setFactura(null)
    try {
      const respuesta = await procesarFactura(archivo, opciones)
      setFactura(respuesta.factura)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const nuevaFactura = () => {
    setFactura(null)
    setError('')
    setFormulario((n) => n + 1)
  }

  return (
    <div className="rejilla">
      <SubirFactura key={formulario} onProcesar={manejarProcesar} cargando={cargando} />

      <div>
        {(factura || error) && !cargando && (
          <div className="acciones-nueva">
            <button type="button" onClick={nuevaFactura}>
              + Nueva factura
            </button>
          </div>
        )}
        {cargando && (
          <div className="tarjeta estado">
            <div className="spinner" aria-hidden="true" />
            <p>Analizando la imagen… esto puede tardar unos segundos.</p>
          </div>
        )}
        {error && (
          <div className="tarjeta estado error" role="alert">
            <p>{error}</p>
          </div>
        )}
        {factura && <ResultadoFactura factura={factura} />}
        {!cargando && !error && !factura && (
          <div className="tarjeta estado">
            <p>Aquí aparecerán los datos extraídos de tu factura.</p>
          </div>
        )}
      </div>
    </div>
  )
}
