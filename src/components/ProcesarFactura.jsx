import { useState } from 'react'
import SubirFactura from './SubirFactura'
import EditarFactura from './EditarFactura'
import { guardarFactura, procesarFactura } from '../services/api'
import { hoy } from '../utils/formato'

// Datos iniciales de una factura cargada a mano
const facturaVacia = () => ({
  nombre_empresa: '',
  numero_factura: '',
  fecha: hoy(),
  total: '',
  moneda: 'VES',
  tasa_dia: null,
  tasa_origen: null,
  detalles: [{ cantidad: 1, descripcion: '', precio_unitario: '', importe: '' }],
})

export default function ProcesarFactura() {
  // borrador: datos por guardar (leídos por la IA o escritos a mano) junto con su imagen, si la hay
  const [borrador, setBorrador] = useState(null)
  // Imagen que la IA no pudo leer: se adjunta si el usuario carga la factura a mano
  const [archivoFallido, setArchivoFallido] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [formulario, setFormulario] = useState(0) // Cambiarlo remonta SubirFactura vacío

  const manejarProcesar = async (archivo, opciones) => {
    setCargando(true)
    setError('')
    setExito('')
    setBorrador(null)
    setArchivoFallido(null)
    try {
      const respuesta = await procesarFactura(archivo, opciones)
      setBorrador({ archivo, factura: respuesta.factura, manual: false })
    } catch (err) {
      setError(err.message)
      setArchivoFallido(archivo)
    } finally {
      setCargando(false)
    }
  }

  const abrirManual = () => {
    setError('')
    setExito('')
    setBorrador({ archivo: archivoFallido, factura: facturaVacia(), manual: true })
  }

  // Tras guardar se limpia todo para cargar la siguiente factura
  const manejarGuardar = async (datos) => {
    setGuardando(true)
    setError('')
    try {
      const respuesta = await guardarFactura(borrador.archivo, datos)
      setExito(`La factura se guardó correctamente (ID ${respuesta.id}).`)
      setBorrador(null)
      setArchivoFallido(null)
      setFormulario((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const descartar = () => {
    setBorrador(null)
    setArchivoFallido(null)
    setError('')
    setFormulario((n) => n + 1)
  }

  return (
    <div className="rejilla">
      <SubirFactura key={formulario} onProcesar={manejarProcesar} cargando={cargando || guardando} />

      <div>
        {!borrador && !cargando && (
          <div className="acciones-nueva">
            <button type="button" className="secundario" onClick={abrirManual}>
              ✎ Ingresar factura manualmente
            </button>
          </div>
        )}
        {exito && (
          <div className="tarjeta estado exito" role="status">
            <span className="icono-exito" aria-hidden="true">✓</span>
            <p>{exito}</p>
            <p className="nota">Ya puedes subir otra factura.</p>
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
            {archivoFallido && !borrador && (
              <button type="button" onClick={abrirManual}>
                Ingresarla manualmente
              </button>
            )}
          </div>
        )}
        {borrador && (
          <EditarFactura
            factura={borrador.factura}
            manual={borrador.manual}
            nombreImagen={borrador.manual ? borrador.archivo?.name : undefined}
            guardando={guardando}
            onGuardar={manejarGuardar}
            onDescartar={descartar}
          />
        )}
        {!cargando && !error && !exito && !borrador && (
          <div className="tarjeta estado">
            <p>Aquí aparecerán los datos extraídos de tu factura.</p>
          </div>
        )}
      </div>
    </div>
  )
}
