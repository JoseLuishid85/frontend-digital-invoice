import { useEffect, useRef, useState } from 'react'
import ResultadoFactura from './ResultadoFactura'
import { obtenerFactura, urlImagenFactura } from '../services/api'

// Muestra la factura completa en un <dialog> nativo (cierra con Esc, clic fuera o el botón ×)
export default function ModalFactura({ facturaId, resaltarDetalleId, onCerrar }) {
  const dialogRef = useRef(null)
  const [factura, setFactura] = useState(null)
  const [error, setError] = useState('')
  const [verImagen, setVerImagen] = useState(false)
  const [errorImagen, setErrorImagen] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    setFactura(null)
    setError('')
    setVerImagen(false)
    setErrorImagen(false)

    obtenerFactura(facturaId, controlador.signal)
      .then((datos) => setFactura(datos.factura))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controlador.abort()
  }, [facturaId])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-factura-titulo"
      onClose={onCerrar}
      // Un clic directamente sobre el fondo (el propio <dialog>) cierra el modal
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
    >
      <button
        type="button"
        className="modal-cerrar"
        aria-label="Cerrar"
        onClick={() => dialogRef.current?.close()}
      >
        ×
      </button>

      {!factura && !error && (
        <div className="tarjeta estado">
          <div className="spinner" aria-hidden="true" />
          <p id="modal-factura-titulo">Cargando factura…</p>
        </div>
      )}
      {error && (
        <div className="tarjeta estado error" role="alert">
          <p id="modal-factura-titulo">{error}</p>
        </div>
      )}
      {factura && !verImagen && (
        <ResultadoFactura
          factura={factura}
          etiqueta={`Factura #${factura.id}`}
          resaltarDetalleId={resaltarDetalleId}
          tituloId="modal-factura-titulo"
          acciones={
            factura.imagen ? (
              <button type="button" className="secundario boton-pequeno" onClick={() => setVerImagen(true)}>
                Ver imagen
              </button>
            ) : (
              <span className="vacio nota">Esta factura no tiene imagen guardada.</span>
            )
          }
        />
      )}
      {factura && verImagen && (
        <section className="tarjeta">
          <div className="encabezado-resultado">
            <h2 id="modal-factura-titulo">{factura.nombre_empresa}</h2>
            <span className="etiqueta">{`Factura #${factura.id}`}</span>
          </div>
          <div className="acciones-resultado">
            <button type="button" className="secundario boton-pequeno" onClick={() => setVerImagen(false)}>
              ← Volver al detalle
            </button>
            <a className="enlace" href={urlImagenFactura(factura.id)} target="_blank" rel="noreferrer">
              Abrir en otra pestaña
            </a>
          </div>
          {errorImagen ? (
            // Algunos navegadores no muestran HEIC; se puede abrir o descargar con el enlace
            <p className="vacio">No se pudo mostrar la imagen aquí. Prueba a abrirla en otra pestaña.</p>
          ) : (
            <img
              className="imagen-factura"
              src={urlImagenFactura(factura.id)}
              alt={`Imagen de la factura #${factura.id}`}
              onError={() => setErrorImagen(true)}
            />
          )}
        </section>
      )}
    </dialog>
  )
}
