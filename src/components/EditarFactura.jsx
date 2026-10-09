import { useEffect, useRef, useState } from 'react'
import { tasaSugerida } from '../services/api'
import { dolares, moneda } from '../utils/formato'

const ORIGEN_TASA = {
  usuario: 'escrita por ti',
  factura: 'leída de la factura',
  registro: 'registrada para ese día',
  bcv: 'oficial del BCV (DolarApi)',
}

let siguienteClave = 0
const nuevaClave = () => ++siguienteClave

// Los inputs trabajan con texto; '' representa un campo vacío
const aTexto = (valor) => (valor == null ? '' : String(valor))
const aNumero = (texto) => {
  const n = Number(String(texto).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
const redondear = (n) => Math.round(n * 100) / 100

const filaDesde = (d) => ({
  clave: nuevaClave(),
  cantidad: aTexto(d.cantidad),
  descripcion: d.descripcion || '',
  precio_unitario: aTexto(d.precio_unitario),
  importe: aTexto(d.importe),
  precio_unitario_usd: d.precio_unitario_usd ?? null,
})

const filaVacia = () => filaDesde({ cantidad: 1, descripcion: '', precio_unitario: '', importe: '' })

// Formulario para revisar y corregir lo que leyó la IA antes de guardar la factura,
// o para cargar una factura a mano (manual)
export default function EditarFactura({ factura, manual, nombreImagen, guardando, onGuardar, onDescartar }) {
  const [datos, setDatos] = useState(() => ({
    nombre_empresa: factura.nombre_empresa || '',
    numero_factura: factura.numero_factura || '',
    fecha: factura.fecha || '',
    moneda: factura.moneda || 'VES',
    tasa_dia: aTexto(factura.tasa_dia),
    total: aTexto(factura.total),
  }))
  const [filas, setFilas] = useState(() => (factura.detalles || []).map(filaDesde))
  const [origenTasa, setOrigenTasa] = useState(factura.tasa_origen)
  const [buscandoTasa, setBuscandoTasa] = useState(false)
  // La tasa se busca sola al cambiar la fecha, salvo que la haya escrito el usuario o venga impresa en la factura
  const [tasaAutomatica, setTasaAutomatica] = useState(!['usuario', 'factura'].includes(factura.tasa_origen))
  const fechaDeLaTasa = useRef(factura.tasa_origen ? factura.fecha : null)

  useEffect(() => {
    if (!tasaAutomatica || !datos.fecha || datos.fecha === fechaDeLaTasa.current) return
    const controlador = new AbortController()
    // Pequeña espera para no consultar con cada tecla mientras se escribe la fecha
    const espera = setTimeout(() => {
      setBuscandoTasa(true)
      tasaSugerida(datos.fecha, controlador.signal)
        .then((respuesta) => {
          fechaDeLaTasa.current = datos.fecha
          setDatos((d) => ({ ...d, tasa_dia: aTexto(respuesta.tasa) }))
          setOrigenTasa(respuesta.origen)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setOrigenTasa(null)
        })
        .finally(() => {
          if (!controlador.signal.aborted) setBuscandoTasa(false)
        })
    }, 400)
    return () => {
      clearTimeout(espera)
      controlador.abort()
      setBuscandoTasa(false)
    }
  }, [datos.fecha, tasaAutomatica])

  const cambiarDato = (campo) => (e) => setDatos((d) => ({ ...d, [campo]: e.target.value }))

  const cambiarTasa = (e) => {
    setTasaAutomatica(false)
    setOrigenTasa(null)
    setDatos((d) => ({ ...d, tasa_dia: e.target.value }))
  }

  // Al corregir cantidad o precio, el importe se recalcula; el importe también se puede editar a mano
  const cambiarFila = (clave, campo, valor) =>
    setFilas((actuales) =>
      actuales.map((f) => {
        if (f.clave !== clave) return f
        const fila = { ...f, [campo]: valor }
        if (campo === 'cantidad' || campo === 'precio_unitario') {
          fila.importe = String(redondear(aNumero(fila.cantidad) * aNumero(fila.precio_unitario)))
        }
        return fila
      }),
    )

  const quitarFila = (clave) => setFilas((actuales) => actuales.filter((f) => f.clave !== clave))
  const agregarFila = () => setFilas((actuales) => [...actuales, filaVacia()])

  const tasa = aNumero(datos.tasa_dia)
  const precioDolares = (fila) => {
    const precio = aNumero(fila.precio_unitario)
    if (datos.moneda === 'USD') return precio
    if (tasa > 0 && precio) return redondear(precio / tasa)
    return fila.precio_unitario_usd
  }

  const sumaImportes = redondear(filas.reduce((suma, f) => suma + aNumero(f.importe), 0))
  const total = aNumero(datos.total)
  const descuadradas = filas.filter(
    (f) => Math.abs(aNumero(f.cantidad) * aNumero(f.precio_unitario) - aNumero(f.importe)) > 0.05,
  ).length

  const enviar = (e) => {
    e.preventDefault()
    onGuardar({
      nombre_empresa: datos.nombre_empresa.trim(),
      numero_factura: datos.numero_factura.trim() || null,
      fecha: datos.fecha || null,
      moneda: datos.moneda,
      tasa_dia: tasa > 0 ? tasa : null,
      total,
      detalles: filas.map((f) => ({
        cantidad: aNumero(f.cantidad) || 1,
        descripcion: f.descripcion.trim(),
        precio_unitario: aNumero(f.precio_unitario),
        importe: aNumero(f.importe),
        precio_unitario_usd: f.precio_unitario_usd,
      })),
    })
  }

  return (
    <form className="tarjeta" onSubmit={enviar}>
      <div className="encabezado-resultado">
        <h2>{manual ? 'Factura manual' : 'Revisa los datos'}</h2>
        <span className="etiqueta etiqueta-pendiente">Sin guardar</span>
      </div>
      <p className="nota">
        {manual
          ? 'Escribe los datos de la factura y sus productos, y pulsa «Guardar factura».'
          : 'Corrige lo que la IA haya leído mal y pulsa «Guardar factura».'}
        {nombreImagen && ` Se adjuntará la imagen ${nombreImagen}.`}
      </p>

      <fieldset className="campos-factura" disabled={guardando}>
        <label className="campo campo-ancho">
          <span>Empresa</span>
          <input value={datos.nombre_empresa} onChange={cambiarDato('nombre_empresa')} required autoFocus={manual} />
        </label>
        <label className="campo">
          <span>N.º de factura</span>
          <input value={datos.numero_factura} onChange={cambiarDato('numero_factura')} />
        </label>
        <label className="campo">
          <span>Fecha</span>
          <input type="date" value={datos.fecha} onChange={cambiarDato('fecha')} />
        </label>
        <label className="campo">
          <span>Moneda</span>
          <select value={datos.moneda} onChange={cambiarDato('moneda')}>
            <option value="VES">Bolívares (Bs)</option>
            <option value="USD">Dólares ($)</option>
          </select>
        </label>
        <label className="campo">
          <span>Tasa del día (Bs/$)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={datos.tasa_dia}
            onChange={cambiarTasa}
          />
          {buscandoTasa ? (
            <small>Buscando la tasa de ese día…</small>
          ) : origenTasa ? (
            <small>Tasa {ORIGEN_TASA[origenTasa]}</small>
          ) : (
            !datos.tasa_dia && <small>Sin tasa no se calcula el precio en $</small>
          )}
        </label>
        <label className="campo">
          <span>Total</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={datos.total}
            onChange={cambiarDato('total')}
          />
        </label>
      </fieldset>

      <h3>Productos ({filas.length})</h3>
      <fieldset className="campos-productos" disabled={guardando}>
        <div className="tabla-scroll">
          <table className="tabla-editable">
            <thead>
              <tr>
                <th className="num">Cant.</th>
                <th>Descripción</th>
                <th className="num">P. unitario</th>
                <th className="num">Importe</th>
                <th className="num">P. unitario $</th>
                <th>
                  <span className="solo-lector">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const descuadrada =
                  Math.abs(aNumero(f.cantidad) * aNumero(f.precio_unitario) - aNumero(f.importe)) > 0.05
                return (
                  <tr key={f.clave} className={descuadrada ? 'descuadrada' : undefined}>
                    <td>
                      <input
                        className="entrada-cantidad"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={f.cantidad}
                        onChange={(e) => cambiarFila(f.clave, 'cantidad', e.target.value)}
                        aria-label={`Cantidad del producto ${i + 1}`}
                      />
                    </td>
                    <td>
                      <input
                        className="entrada-descripcion"
                        value={f.descripcion}
                        onChange={(e) => cambiarFila(f.clave, 'descripcion', e.target.value)}
                        aria-label={`Descripción del producto ${i + 1}`}
                      />
                    </td>
                    <td>
                      <input
                        className="entrada-monto"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={f.precio_unitario}
                        onChange={(e) => cambiarFila(f.clave, 'precio_unitario', e.target.value)}
                        aria-label={`Precio unitario del producto ${i + 1}`}
                      />
                    </td>
                    <td>
                      <input
                        className="entrada-monto"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={f.importe}
                        onChange={(e) => cambiarFila(f.clave, 'importe', e.target.value)}
                        aria-label={`Importe del producto ${i + 1}`}
                        title={descuadrada ? 'Cantidad × precio unitario no coincide con el importe' : undefined}
                      />
                    </td>
                    <td className="num">{dolares(precioDolares(f))}</td>
                    <td>
                      <button
                        type="button"
                        className="secundario boton-pequeno"
                        onClick={() => quitarFila(f.clave)}
                        aria-label={`Quitar el producto ${i + 1}`}
                        title="Quitar producto"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Suma de importes</td>
                <td className="num">{moneda(sumaImportes)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="acciones-tabla">
          <button type="button" className="secundario boton-pequeno" onClick={agregarFila}>
            + Agregar producto
          </button>
        </div>
      </fieldset>

      {descuadradas > 0 && (
        <p className="aviso">
          {descuadradas === 1 ? 'Hay 1 producto' : `Hay ${descuadradas} productos`} donde cantidad × precio unitario
          no coincide con el importe (marcados en la tabla).
        </p>
      )}
      {filas.length > 0 && Math.abs(sumaImportes - total) > 0.05 && (
        <p className="nota">
          La suma de importes ({moneda(sumaImportes)}) es distinta del total ({moneda(total)}). Es normal si el total
          incluye IVA u otros impuestos.
        </p>
      )}

      <div className="acciones">
        <button type="button" className="secundario" onClick={onDescartar} disabled={guardando}>
          Descartar
        </button>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar factura'}
        </button>
      </div>
    </form>
  )
}
