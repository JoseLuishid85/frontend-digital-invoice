import { useEffect, useRef, useState } from 'react'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const TAMANO_MAXIMO = 10 * 1024 * 1024 // 10 MB, igual que en el backend

export default function SubirFactura({ onProcesar, cargando }) {
  const [archivo, setArchivo] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState('')
  const [moneda, setMoneda] = useState('VES')
  const [tasaDia, setTasaDia] = useState('')
  const inputRef = useRef(null)

  // Liberar la URL de la vista previa cuando cambie el archivo
  useEffect(() => {
    if (!archivo) return
    const url = URL.createObjectURL(archivo)
    setVistaPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  const seleccionar = (nuevo) => {
    if (!nuevo) return
    if (!TIPOS_PERMITIDOS.includes(nuevo.type)) {
      setError('Formato no permitido. Usa JPG, PNG, WEBP o HEIC.')
      return
    }
    if (nuevo.size > TAMANO_MAXIMO) {
      setError('La imagen supera el tamaño máximo de 10 MB.')
      return
    }
    setError('')
    setArchivo(nuevo)
  }

  const limpiar = () => {
    setArchivo(null)
    setVistaPrevia(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const enviar = (e) => {
    e.preventDefault()
    if (archivo) onProcesar(archivo, { moneda, tasaDia: tasaDia.trim() })
  }

  return (
    <form className="tarjeta" onSubmit={enviar}>
      <h2>Subir factura o ticket</h2>

      <label
        className={`zona-carga ${arrastrando ? 'arrastrando' : ''} ${vistaPrevia ? 'con-imagen' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          seleccionar(e.dataTransfer.files[0])
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_PERMITIDOS.join(',')}
          onChange={(e) => seleccionar(e.target.files[0])}
          disabled={cargando}
          hidden
        />
        {vistaPrevia ? (
          <img src={vistaPrevia} alt="Vista previa de la factura" />
        ) : (
          <div className="zona-carga-texto">
            <span className="icono" aria-hidden="true">⇪</span>
            <strong>Arrastra una imagen aquí</strong>
            <span>o haz clic para elegir un archivo</span>
            <small>JPG, PNG, WEBP o HEIC · máx. 10 MB</small>
          </div>
        )}
      </label>

      {archivo && <p className="nombre-archivo">{archivo.name}</p>}
      {error && <p className="mensaje-error">{error}</p>}

      <fieldset className="opciones-moneda" disabled={cargando}>
        <legend>Los precios de la factura están en</legend>
        <label>
          <input
            type="radio"
            name="moneda"
            value="VES"
            checked={moneda === 'VES'}
            onChange={(e) => setMoneda(e.target.value)}
          />
          Bolívares (Bs)
        </label>
        <label>
          <input
            type="radio"
            name="moneda"
            value="USD"
            checked={moneda === 'USD'}
            onChange={(e) => setMoneda(e.target.value)}
          />
          Dólares ($)
        </label>
      </fieldset>

      <label className="campo">
        <span>
          Tasa del día (Bs por $) <small>· opcional</small>
        </span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={tasaDia}
          onChange={(e) => setTasaDia(e.target.value)}
          placeholder="Si se deja vacío, se toma de la factura"
          disabled={cargando}
        />
        {moneda === 'VES' && (
          <small>
            Precio en $ = precio en Bs ÷ tasa. Si la dejas vacía se usa la impresa en la factura o la registrada para
            ese día.
          </small>
        )}
      </label>

      <div className="acciones">
        <button type="button" className="secundario" onClick={limpiar} disabled={!archivo || cargando}>
          Quitar
        </button>
        <button type="submit" disabled={!archivo || cargando}>
          {cargando ? 'Procesando…' : 'Procesar factura'}
        </button>
      </div>
    </form>
  )
}
