import { cantidad, dolares, fecha, moneda, nombreMoneda, tasa } from '../utils/formato'

export default function ResultadoFactura({ factura, etiqueta, resaltarDetalleId, tituloId, acciones }) {
  const detalles = factura.detalles || []

  return (
    <section className="tarjeta">
      <div className="encabezado-resultado">
        <h2 id={tituloId}>{factura.nombre_empresa}</h2>
        <span className="etiqueta">{etiqueta ?? `Guardada · ID ${factura.id}`}</span>
      </div>

      {acciones && <div className="acciones-resultado">{acciones}</div>}

      <dl className="datos-factura">
        <div>
          <dt>N.º de factura</dt>
          <dd>{factura.numero_factura || '—'}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{fecha(factura.fecha)}</dd>
        </div>
        <div>
          <dt>Moneda</dt>
          <dd>{nombreMoneda(factura.moneda)}</dd>
        </div>
        <div>
          <dt>Tasa del día</dt>
          <dd>{factura.tasa_dia == null ? '—' : `${tasa(factura.tasa_dia)} Bs/$`}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="total">{moneda(factura.total)}</dd>
        </div>
      </dl>

      <h3>Productos ({detalles.length})</h3>
      {detalles.length === 0 ? (
        <p className="vacio">No se detectaron productos en la imagen.</p>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th className="num">Cant.</th>
                <th>Descripción</th>
                <th className="num">P. unitario</th>
                <th className="num">P. unitario $</th>
                <th className="num">Importe</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((d) => (
                <tr key={d.id} className={d.id === resaltarDetalleId ? 'resaltada' : undefined}>
                  <td className="num">{cantidad(d.cantidad)}</td>
                  <td>{d.descripcion}</td>
                  <td className="num">{moneda(d.precio_unitario)}</td>
                  <td className="num">{dolares(d.precio_unitario_usd)}</td>
                  <td className="num">{moneda(d.importe)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total</td>
                <td className="num">{moneda(factura.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  )
}
